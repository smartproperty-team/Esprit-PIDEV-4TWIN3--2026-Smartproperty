// ===========================================
// SmartProperty - AI Recommendation Proxy Service
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

export interface RecommendedProperty {
  property_id: string;
  title: string;
  score: number;
  price: number;
  property_type: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  match_reasons: string[];
}

export interface RecommendationResponse {
  user_id: string;
  recommendations: RecommendedProperty[];
  total_count: number;
  algorithm: string;
}

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);
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

  async getUserRecommendations(
    userId: string,
    limit = 6,
  ): Promise<RecommendationResponse> {
    const endpoint = `/api/v1/recommendations/user/${userId}`;

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.http.get<RecommendationResponse>(endpoint, {
          params: { limit },
        });
        return response.data;
      } catch (error) {
        lastError = error;
        const mapped = this.mapAxiosError(error);
        if (mapped instanceof BadRequestException) {
          throw mapped;
        }
        if (attempt < this.retries) {
          this.logger.warn(
            `[ai-rec] user=${userId} attempt=${attempt} failed: ${
              (error as Error).message
            } - retrying`,
          );
          continue;
        }
        throw mapped;
      }
    }

    throw this.mapAxiosError(lastError);
  }

  private mapAxiosError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const status = axiosError.response?.status;
      const detail =
        axiosError.response?.data?.detail ||
        axiosError.message ||
        'AI request failed';

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
