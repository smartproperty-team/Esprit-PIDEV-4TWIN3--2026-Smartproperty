// ===========================================
// SmartProperty - AI Description Proxy Service
// ===========================================

import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

import {
  GenerateDescriptionDto,
  GenerateDescriptionResponseDto,
} from './dto/ai-description.dto';

@Injectable()
export class AiDescriptionService {
  private readonly logger = new Logger(AiDescriptionService.name);
  private readonly http: AxiosInstance;
  private readonly retries: number;

  constructor(private readonly config: ConfigService) {
    const baseURL =
      this.config.get<string>('app.aiService.url') || 'http://localhost:8000';
    const timeout = this.config.get<number>('app.aiService.timeoutMs') ?? 60000;
    this.retries = this.config.get<number>('app.aiService.retries') ?? 1;
    this.http = axios.create({
      baseURL,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async generateDescription(
    dto: GenerateDescriptionDto,
    requestId: string,
  ): Promise<GenerateDescriptionResponseDto> {
    if (!dto.propertyId && !dto.propertySnapshot) {
      throw new BadRequestException(
        'propertySnapshot is required when propertyId is not provided',
      );
    }

    const endpoint = '/api/v1/marketing/descriptions/generate';
    const startedAt = Date.now();
    this.logger.log(
      `[ai-desc] requestId=${requestId} -> ${endpoint} tone=${dto.tone} ` +
        `lengths=${dto.lengths?.join(',')} targets=${dto.targetLanguages?.join(',')}`,
    );

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response =
          await this.http.post<GenerateDescriptionResponseDto>(endpoint, dto);
        const elapsed = Date.now() - startedAt;
        this.logger.log(
          `[ai-desc] requestId=${requestId} ok attempt=${attempt} elapsedMs=${elapsed}`,
        );
        return response.data;
      } catch (error) {
        lastError = error;
        const mapped = this.mapAxiosError(error);
        // Do not retry on client errors (4xx)
        if (mapped instanceof BadRequestException) {
          throw mapped;
        }
        if (attempt < this.retries) {
          this.logger.warn(
            `[ai-desc] requestId=${requestId} attempt=${attempt} failed: ${
              (error as Error).message
            } - retrying`,
          );
          continue;
        }
        throw mapped;
      }
    }
    // Unreachable, but keeps the compiler happy
    throw this.mapAxiosError(lastError);
  }

  async getModelStatus(): Promise<unknown> {
    try {
      const res = await this.http.get('/api/v1/marketing/model/status');
      return res.data;
    } catch (error) {
      throw this.mapAxiosError(error);
    }
  }

  private mapAxiosError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const status = axiosError.response?.status;
      const detail =
        axiosError.response?.data?.detail || axiosError.message || 'AI request failed';

      if (axiosError.code === 'ECONNABORTED') {
        return new GatewayTimeoutException('AI service request timed out');
      }
      if (!status) {
        return new BadGatewayException(`AI service unreachable: ${detail}`);
      }
      if (status === 400 || status === 422) {
        return new BadRequestException(detail);
      }
      if (status === 504) {
        return new GatewayTimeoutException(detail);
      }
      if (status >= 500) {
        return new ServiceUnavailableException(detail);
      }
      return new BadGatewayException(detail);
    }
    return new ServiceUnavailableException(
      (error as Error)?.message || 'AI service error',
    );
  }
}
