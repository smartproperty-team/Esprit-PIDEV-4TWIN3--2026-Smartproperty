import { ConfigService } from '@nestjs/config';
export interface HealthCheck {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
}
export interface ApiInfo {
    name: string;
    version: string;
    description: string;
    documentation: string;
    environment: string;
    endpoints: {
        health: string;
        docs: string;
        graphql: string;
    };
}
export declare class AppService {
    private readonly configService;
    constructor(configService: ConfigService);
    getHealth(): HealthCheck;
    getApiInfo(): ApiInfo;
}
