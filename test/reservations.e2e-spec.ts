import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RabbitMQService } from '../src/infra/messaging/rabbitmq.service';

describe('Reservations - Concurrent Operations (E2E)', () => {
  let app: INestApplication;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQService)
      .useValue({
        publish: jest.fn().mockResolvedValue(undefined),
        emitEvent: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const sessionResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        movieTitle: 'Test Movie',
        startsAt: new Date(Date.now() + 3600_000).toISOString(),
        roomId: 'Test Room',
        seatCount: 20,
        price: 25.00,
      });

    sessionId = sessionResponse.body.id;
    console.log(`Sessão criada: ${sessionId}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Race Condition - Same Seat', () => {
    it('should only allow one user to reserve the last available seat', async () => {
      const seatNumber = 1;
      const concurrentUsers = 5;

      const promises = Array.from({ length: concurrentUsers }, (_, i) =>
        request(app.getHttpServer())
          .post('/reservations')
          .send({
            sessionId,
            seatNumbers: [seatNumber],
            userId: `concurrent-user-${i}`,
          }),
      );

      const results = await Promise.all(promises);

      // LOG DETALHADO
      console.log('\nTeste 1 - Race Condition Results:');
      results.forEach((r, i) => {
        console.log(`   User ${i}: Status ${r.status}, Body:`, r.body);
      });

      const successful = results.filter(r => r.status === 201);
      const conflicts = results.filter(r => r.status === 409);

      console.log(`   Sucessos: ${successful.length}`);
      console.log(`   Conflitos: ${conflicts.length}\n`);

      expect(successful).toHaveLength(1);
      expect(conflicts).toHaveLength(concurrentUsers - 1);
    });
  });

  describe('Deadlock Prevention', () => {
    it('should handle multiple users reserving different seat combinations', async () => {
      const promiseA = request(app.getHttpServer())
        .post('/reservations')
        .send({
          sessionId,
          seatNumbers: [2, 3],
          userId: 'user-a',
        });

      const promiseB = request(app.getHttpServer())
        .post('/reservations')
        .send({
          sessionId,
          seatNumbers: [3, 2],
          userId: 'user-b',
        });

      const [resultA, resultB] = await Promise.all([promiseA, promiseB]);

      // LOG DETALHADO
      console.log('\nTeste 2 - Deadlock Prevention Results:');
      console.log(`   User A: Status ${resultA.status}, Body:`, resultA.body);
      console.log(`   User B: Status ${resultB.status}, Body:`, resultB.body);

      const validStatuses = [resultA.status, resultB.status];
      expect(validStatuses.some(status => status === 201)).toBe(true);
    });
  });
});