// ===========================================
// AiDescriptionService unit tests
// ===========================================

import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { AiDescriptionService } from './ai-description.service';
import { GenerateDescriptionDto } from './dto/ai-description.dto';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AiDescriptionService', () => {
  let service: AiDescriptionService;
  let post: jest.Mock;
  let get: jest.Mock;

  const baseConfig: Record<string, unknown> = {
    'app.aiService.url': 'http://ai:8000',
    'app.aiService.timeoutMs': 30000,
    'app.aiService.retries': 1,
  };

  beforeEach(() => {
    post = jest.fn();
    get = jest.fn();
    (mockedAxios.create as jest.Mock).mockReturnValue({ post, get });
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn(
      (e: unknown) => Boolean((e as { isAxiosError?: boolean })?.isAxiosError),
    );

    const config = {
      get: (key: string) => baseConfig[key],
    } as unknown as ConfigService;
    service = new AiDescriptionService(config);
  });

  const buildDto = (): GenerateDescriptionDto => ({
    propertyId: 'p1',
    propertySnapshot: { title: 'Cozy', city: 'Paris' } as any,
    tone: 'warm',
    lengths: ['short'],
    sourceLanguage: 'en',
    targetLanguages: ['en'],
  });

  it('rejects when neither propertyId nor snapshot are provided', async () => {
    await expect(
      service.generateDescription(
        { tone: 'warm', lengths: ['short'], sourceLanguage: 'en', targetLanguages: ['en'] } as any,
        'req-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns the proxied response on success', async () => {
    const payload = {
      variants: [{ length: 'short', tone: 'warm', language: 'en', text: 'hi', wordCount: 1 }],
      metadata: {
        generationId: 'g1',
        modelName: 'flan-t5-base',
        modelVersion: 'transformers',
        cacheHit: false,
        latencyMs: 12,
      },
    };
    post.mockResolvedValueOnce({ data: payload });
    const result = await service.generateDescription(buildDto(), 'req-2');
    expect(result).toEqual(payload);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('retries once on transient 5xx then succeeds', async () => {
    post
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 503, data: { detail: 'temporary' } },
        message: 'fail',
      })
      .mockResolvedValueOnce({ data: { variants: [], metadata: {} } });
    await service.generateDescription(buildDto(), 'req-3');
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 4xx and maps to BadRequest', async () => {
    post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { detail: 'bad' } },
      message: 'bad',
    });
    await expect(service.generateDescription(buildDto(), 'req-4')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('maps timeout (ECONNABORTED) to GatewayTimeout', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout',
    });
    await expect(service.generateDescription(buildDto(), 'req-5')).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });

  it('maps unreachable host to BadGateway', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      message: 'ENOTFOUND',
    });
    await expect(service.generateDescription(buildDto(), 'req-6')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps 5xx (after retries) to ServiceUnavailable', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 503, data: { detail: 'down' } },
      message: 'down',
    });
    await expect(service.generateDescription(buildDto(), 'req-7')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('getModelStatus delegates to GET /model/status', async () => {
    get.mockResolvedValueOnce({ data: { generation: { loaded: false } } });
    const status = await service.getModelStatus();
    expect(get).toHaveBeenCalledWith('/api/v1/marketing/model/status');
    expect(status).toEqual({ generation: { loaded: false } });
  });
});
