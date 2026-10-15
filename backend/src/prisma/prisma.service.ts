import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Query errors are re-thrown and logged once by AllExceptionsFilter (with the request id),
    // so only engine warnings are logged here to avoid duplicate noise for expected 404s.
    super({ log: ['warn'] });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
