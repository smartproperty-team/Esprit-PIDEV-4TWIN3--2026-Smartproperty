// ===========================================
// SmartProperty - AI Virtual Tour Service (Proxy)
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

export interface VirtualTourImagePayload {
  url: string;
  key: string;
}

export interface GenerateVirtualTourPayload {
  propertyId: string;
  requestedBy: string;
  images: VirtualTourImagePayload[];
  processNow?: boolean;
}

export interface GenerateVirtualTourResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  acceptedImageCount: number;
  panoramaPath?: string | null;
  error?: string | null;
}

@Injectable()
export class AiVirtualTourService {
  private readonly logger = new Logger(AiVirtualTourService.name);
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

  async requestGeneration(
    payload: GenerateVirtualTourPayload,
  ): Promise<GenerateVirtualTourResponse> {
    const endpoint = '/api/v1/virtual-tour/generate';
    const startedAt = Date.now();

    this.logger.log(
      `[ai-vtour] Requesting generation for property=${payload.propertyId} ` +
        `images=${payload.images.length} processNow=${payload.processNow ?? false}`,
    );

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.http.post<GenerateVirtualTourResponse>(
          endpoint,
          payload,
        );

        const elapsedMs = Date.now() - startedAt;
        this.logger.log(
          `[ai-vtour] property=${payload.propertyId} jobId=${response.data.jobId} ` +
            `status=${response.data.status} message="${response.data.message}" ` +
            `error=${response.data.error ?? 'none'} panoramaPath=${response.data.panoramaPath ?? 'pending'} ` +
            `elapsedMs=${elapsedMs}`,
        );

        return response.data;
      } catch (error) {
        lastError = error;
        const mapped = this.mapAxiosError(error);

        if (mapped instanceof BadRequestException) {
          this.logger.error(
            `[ai-vtour] BadRequest for property=${payload.propertyId}: ${mapped.message}`,
          );
          throw mapped;
        }

        if (attempt < this.retries) {
          this.logger.warn(
            `[ai-vtour] property=${payload.propertyId} attempt=${attempt} failed: ${
              (error as Error).message
            } - retrying`,
          );
          continue;
        }

        this.logger.error(
          `[ai-vtour] property=${payload.propertyId} final attempt failed: ${mapped.message}`,
        );
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
        'Virtual tour AI request failed';

      if (axiosError.code === 'ECONNABORTED') {
        return new GatewayTimeoutException('Virtual tour AI request timed out');
      }
      if (!status) {
        return new BadGatewayException(
          `Virtual tour AI service unreachable: ${detail}`,
        );
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
      (error as Error)?.message || 'Virtual tour AI service error',
    );
  }

  /**
   * Retrieve panorama image from AI service
   */
  async getPanoramaImage(propertyId: string, jobId: string) {
    try {
      const endpoint = `/api/v1/virtual-tour/panoramas/${propertyId}/${jobId}`;
      this.logger.log(
        `[ai-vtour] Retrieving panorama from AI service: propertyId=${propertyId} jobId=${jobId}`,
      );

      const response = await this.http.get(endpoint, {
        responseType: 'stream',
      });

      this.logger.log(
        `[ai-vtour] Successfully retrieved panorama from AI service for propertyId=${propertyId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `[ai-vtour] Failed to retrieve panorama for property ${propertyId} jobId=${jobId}: ${
          (error as Error).message
        }`,
      );
      throw this.mapAxiosError(error);
    }
  }

  /**
   * Fetch job status from AI service
   */
  async getJobStatus(jobId: string) {
    try {
      const endpoint = `/api/v1/virtual-tour/jobs/${jobId}`;
      this.logger.log(`[ai-vtour] Fetching job status: ${jobId}`);
      const response = await this.http.get(endpoint);
      this.logger.log(`[ai-vtour] Job status for ${jobId}: ${response.status}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `[ai-vtour] Failed to fetch job status ${jobId}: ${(error as Error).message}`,
      );
      throw this.mapAxiosError(error);
    }
  }
}
