// ===========================================
// SmartProperty - Auth Service
// ===========================================
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

// ===========================================
// Types
// ===========================================

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

// ===========================================
// Auth Service
// ===========================================

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  // ===========================================
  // Registration
  // ===========================================

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      role,
    } = registerDto;

    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Generate email verification token
    const emailVerificationToken = this.generateToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      role: role || UserRole.TENANT,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    await this.userRepository.save(user);

    // Send verification email
    await this.sendVerificationEmail(user, emailVerificationToken);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    await this.updateRefreshToken(user._id.toHexString(), tokens.refreshToken);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  // ===========================================
  // Login
  // ===========================================

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTime = Math.ceil(
        (user.lockUntil!.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${lockTime} minutes`,
      );
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.incrementLoginAttempts();
      await this.userRepository.save(user);

      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    // Reset login attempts on successful login
    user.resetLoginAttempts();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    await this.updateRefreshToken(user._id.toHexString(), tokens.refreshToken);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  // ===========================================
  // Token Refresh
  // ===========================================

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Find user
      const user = await this.userRepository.findOne({
        where: { _id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify stored refresh token matches
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update refresh token in database
      await this.updateRefreshToken(
        user._id.toHexString(),
        tokens.refreshToken,
      );

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ===========================================
  // Logout
  // ===========================================

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(
      { _id: userId as any },
      { refreshToken: undefined },
    );
  }

  // ===========================================
  // Email Verification
  // ===========================================

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    const { token } = verifyEmailDto;

    const user = await this.userRepository.findOne({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    // Update user
    user.isEmailVerified = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return {
        message: 'If the email exists, a verification email has been sent',
      };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new token
    const emailVerificationToken = this.generateToken();
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userRepository.save(user);

    // Send verification email
    await this.sendVerificationEmail(user, emailVerificationToken);

    return { message: 'Verification email sent' };
  }

  // ===========================================
  // Password Reset
  // ===========================================

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if email exists
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = this.generateToken();
    user.passwordResetToken = await bcrypt.hash(resetToken, 10);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.save(user);

    // Send password reset email
    await this.sendPasswordResetEmail(user, resetToken);

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, password, confirmPassword } = resetPasswordDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user with valid reset token
    const users = await this.userRepository.find({
      where: {
        passwordResetExpires: { $gt: new Date() } as any,
      },
    });

    // Find user with matching token
    let targetUser: User | null = null;
    for (const user of users) {
      if (user.passwordResetToken) {
        const isTokenValid = await bcrypt.compare(
          token,
          user.passwordResetToken,
        );
        if (isTokenValid) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check password history (prevent reuse of last 5 passwords)
    if (
      targetUser.previousPasswords &&
      targetUser.previousPasswords.length > 0
    ) {
      for (const prevPassword of targetUser.previousPasswords) {
        const isReused = await bcrypt.compare(password, prevPassword);
        if (isReused) {
          throw new BadRequestException(
            'Cannot reuse a recent password. Please choose a different password.',
          );
        }
      }
    }

    // Update password
    await targetUser.setPassword(password);

    // Store in password history
    const previousPasswords = targetUser.previousPasswords || [];
    previousPasswords.unshift(targetUser.password);
    targetUser.previousPasswords = previousPasswords.slice(0, 5); // Keep last 5

    // Clear reset token
    targetUser.passwordResetToken = undefined;
    targetUser.passwordResetExpires = undefined;

    await this.userRepository.save(targetUser);

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository.findOne({
      where: { _id: userId as any },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check password history
    if (user.previousPasswords && user.previousPasswords.length > 0) {
      for (const prevPassword of user.previousPasswords) {
        const isReused = await bcrypt.compare(newPassword, prevPassword);
        if (isReused) {
          throw new BadRequestException(
            'Cannot reuse a recent password. Please choose a different password.',
          );
        }
      }
    }

    // Update password
    await user.setPassword(newPassword);

    // Store in password history
    const previousPasswords = user.previousPasswords || [];
    previousPasswords.unshift(user.password);
    user.previousPasswords = previousPasswords.slice(0, 5);

    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  // ===========================================
  // Helper Methods
  // ===========================================

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user._id.toHexString(),
      email: user.email,
      role: user.role,
    };

    const accessTokenExpirySeconds =
      this.configService.get<number>('jwt.expiresInSeconds') || 3600;
    const refreshTokenExpirySeconds = 7 * 24 * 60 * 60; // 7 days in seconds

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: accessTokenExpirySeconds,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTokenExpirySeconds,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpirySeconds,
    };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.userRepository.update(
      { _id: userId as any },
      { refreshToken: hashedRefreshToken },
    );
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async sendVerificationEmail(
    user: User,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.corsOrigin');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to SmartProperty - Verify Your Email',
        template: 'verification',
        context: {
          name: user.firstName,
          verificationUrl,
        },
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw - email failure shouldn't block registration
    }
  }

  private async sendPasswordResetEmail(
    user: User,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.corsOrigin');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'SmartProperty - Password Reset Request',
        template: 'password-reset',
        context: {
          name: user.firstName,
          resetUrl,
        },
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  // ===========================================
  // User Lookup (for strategies)
  // ===========================================

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { _id: userId as any },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }
}
