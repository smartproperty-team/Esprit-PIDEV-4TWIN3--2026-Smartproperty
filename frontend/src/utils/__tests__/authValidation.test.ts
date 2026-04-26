import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  isValidPhoneNumber,
  passwordsMatch,
  validateRegistrationData,
  validateLoginData,
  validateChangePasswordData,
  validateResetPasswordData,
} from '../authValidation';

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('name.last@domain.co')).toBe(true);
    expect(isValidEmail('test+tag@mail.org')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('noatsign')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts strong passwords', () => {
    expect(isValidPassword('MyPass1@word')).toBe(true);
    expect(isValidPassword('Str0ng!Pass')).toBe(true);
  });

  it('rejects weak passwords', () => {
    expect(isValidPassword('')).toBe(false);
    expect(isValidPassword('short1!')).toBe(false);
    expect(isValidPassword('nouppercase1!')).toBe(false);
    expect(isValidPassword('NOLOWERCASE1!')).toBe(false);
    expect(isValidPassword('NoNumbers!')).toBe(false);
    expect(isValidPassword('NoSpecial1')).toBe(false);
  });
});

describe('getPasswordStrength', () => {
  it('returns weak for empty password', () => {
    expect(getPasswordStrength('')).toBe('weak');
  });

  it('returns weak for short simple passwords', () => {
    expect(getPasswordStrength('abc')).toBe('weak');
  });

  it('returns medium for moderate passwords', () => {
    expect(getPasswordStrength('Abcd1234')).toBe('medium');
  });

  it('returns strong for complex passwords', () => {
    expect(getPasswordStrength('MyStr0ng!Pass')).toBe('strong');
  });
});

describe('isValidPhoneNumber', () => {
  it('accepts valid phone numbers', () => {
    expect(isValidPhoneNumber('+1234567890')).toBe(true);
    expect(isValidPhoneNumber('+216 98 765 432')).toBe(true);
    expect(isValidPhoneNumber('1234567890')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('abc')).toBe(false);
    expect(isValidPhoneNumber('+0123456789')).toBe(false);
  });
});

describe('passwordsMatch', () => {
  it('returns true when passwords match', () => {
    expect(passwordsMatch('password1', 'password1')).toBe(true);
  });

  it('returns false when passwords differ', () => {
    expect(passwordsMatch('password1', 'password2')).toBe(false);
  });

  it('returns false for empty passwords', () => {
    expect(passwordsMatch('', '')).toBe(false);
  });
});

describe('validateRegistrationData', () => {
  const validData = {
    email: 'user@example.com',
    password: 'MyPass1@word',
    confirmPassword: 'MyPass1@word',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('passes with valid data', () => {
    const result = validateRegistrationData(validData);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('fails with invalid email', () => {
    const result = validateRegistrationData({ ...validData, email: 'bad' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('fails with weak password', () => {
    const result = validateRegistrationData({
      ...validData,
      password: 'weak',
      confirmPassword: 'weak',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });

  it('fails with mismatched passwords', () => {
    const result = validateRegistrationData({
      ...validData,
      confirmPassword: 'Different1@',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.confirmPassword).toBeDefined();
  });

  it('fails with short first name', () => {
    const result = validateRegistrationData({ ...validData, firstName: 'A' });
    expect(result.valid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
  });

  it('fails with short last name', () => {
    const result = validateRegistrationData({ ...validData, lastName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.lastName).toBeDefined();
  });

  it('fails with invalid phone when provided', () => {
    const result = validateRegistrationData({ ...validData, phone: 'abc' });
    expect(result.valid).toBe(false);
    expect(result.errors.phone).toBeDefined();
  });

  it('passes with valid phone when provided', () => {
    const result = validateRegistrationData({ ...validData, phone: '+21698765432' });
    expect(result.valid).toBe(true);
  });
});

describe('validateLoginData', () => {
  it('passes with valid data', () => {
    const result = validateLoginData({ email: 'user@test.com', password: 'pass' });
    expect(result.valid).toBe(true);
  });

  it('fails with invalid email', () => {
    const result = validateLoginData({ email: '', password: 'pass' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('fails with empty password', () => {
    const result = validateLoginData({ email: 'user@test.com', password: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });
});

describe('validateChangePasswordData', () => {
  it('passes with valid data', () => {
    const result = validateChangePasswordData({
      currentPassword: 'OldPass1@',
      newPassword: 'NewPass1@',
      confirmPassword: 'NewPass1@',
    });
    expect(result.valid).toBe(true);
  });

  it('fails when current password is empty', () => {
    const result = validateChangePasswordData({
      currentPassword: '',
      newPassword: 'NewPass1@',
      confirmPassword: 'NewPass1@',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.currentPassword).toBeDefined();
  });

  it('fails when new password is weak', () => {
    const result = validateChangePasswordData({
      currentPassword: 'OldPass1@',
      newPassword: 'weak',
      confirmPassword: 'weak',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toBeDefined();
  });

  it('fails when new equals current', () => {
    const result = validateChangePasswordData({
      currentPassword: 'SamePass1@',
      newPassword: 'SamePass1@',
      confirmPassword: 'SamePass1@',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.newPassword).toBeDefined();
  });

  it('fails when confirm does not match', () => {
    const result = validateChangePasswordData({
      currentPassword: 'OldPass1@',
      newPassword: 'NewPass1@',
      confirmPassword: 'Different1@',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.confirmPassword).toBeDefined();
  });
});

describe('validateResetPasswordData', () => {
  it('passes with valid data', () => {
    const result = validateResetPasswordData({
      password: 'NewPass1@',
      confirmPassword: 'NewPass1@',
    });
    expect(result.valid).toBe(true);
  });

  it('fails with empty password', () => {
    const result = validateResetPasswordData({
      password: '',
      confirmPassword: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });

  it('fails with weak password', () => {
    const result = validateResetPasswordData({
      password: 'weak',
      confirmPassword: 'weak',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });

  it('fails when passwords dont match', () => {
    const result = validateResetPasswordData({
      password: 'NewPass1@',
      confirmPassword: 'Other1@xx',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.confirmPassword).toBeDefined();
  });
});
