import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService
  implements OnModuleInit, OnModuleDestroy
{
  private client!: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });

    await this.client.connect();
  }

  async acquireLock(
    key: string,
    ttlMs: number,
  ): Promise<boolean> {
    const result = await this.client.set(
      key,
      'locked',
      {
        NX: true,
        PX: ttlMs,
      },
    );

    return result === 'OK';
  }

  async releaseLock(key: string) {
    await this.client.del(key);
  }

  async setWithTTL(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ) {
    await this.client.set(
      key,
      JSON.stringify(value),
      { EX: ttlSeconds },
    );
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set(key: string, value: string, ...args: any[]): Promise<string | null> {
    // Padrão: ('NX','EX', ttl)
    if (args.length >= 3 && args[0] === 'NX' && args[1] === 'EX' && typeof args[2] === 'number') {
      return this.client.set(key, value, { NX: true, EX: args[2] });
    }

    // Padrão: ('XX','EX', ttl)
    if (args.length >= 3 && args[0] === 'XX' && args[1] === 'EX' && typeof args[2] === 'number') {
      return this.client.set(key, value, { XX: true, EX: args[2] });
    }

    // Se passaram um único objeto de options
    if (args.length === 1 && typeof args[0] === 'object') {
      return this.client.set(key, value, args[0]);
    }

    // Fallback simples
    return this.client.set(key, value);
  }

  // Store idempotency key result for 24 hours
  async storeIdempotencyResult(key: string, result: any): Promise<void> {
    await this.setWithTTL(`idempotency:${key}`, result, 86400);
  }

  // Check if idempotency key was already processed
  async getIdempotencyResult<T>(key: string): Promise<T | null> {
    return this.get<T>(`idempotency:${key}`);
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }
}
