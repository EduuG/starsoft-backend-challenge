# Cinema Ticket Reservation System

Sistema de venda de ingressos de cinema que evita que o mesmo assento seja vendido para duas pessoas ao mesmo tempo.

## O que o sistema faz

O principal desafio era garantir que quando várias pessoas tentam comprar o mesmo assento simultaneamente, apenas uma consegue. Isso foi solucionado utilizando locks no Redis e transações no banco de dados.

**Funcionalidades:**
- Criar sessões de cinema com assentos
- Reservar assentos (válido por 30 segundos)
- Confirmar pagamento
- Expiração automática caso o pagamento não seja efetuado
- Ver disponibilidade em tempo real

## Tecnologias utilizadas

- **NestJS**: Escolhi porque tem suporte nativo a microserviços e boa estrutura modular, o que facilita organizar o código em controllers, services e módulos separados.

- **PostgreSQL**: Precisava de um banco com transações confiáveis e suporte a locks. O Postgres permite bloquear linhas durante uma transação para evitar que dois processos modifiquem os mesmos assentos.

- **Redis**: Usei para fazer locks distribuídos porque é muito mais rápido que o banco de dados (trabalha em memória). Também uso para cachear os resultados de requisições com idempotency key.

- **RabbitMQ**: Precisava garantir que eventos importantes (reserva criada, pagamento confirmado) não se perdessem. O RabbitMQ tem suporte a confirmação manual, então em caso de erro posso reprocessar a mensagem.

- **Docker**: Para garantir que o projeto execute em qualquer máquina.

## Como executar

É necessário ter o Docker e Docker Compose instalados.

```bash
# Clone o projeto
git clone https://github.com/EduuG/starsoft-backend-challenge.git
cd starsoft-backend-challenge

# Copie o .env.example para .env
cp .env.example .env

# Suba todos os serviços
docker-compose up -d

# Aguarde alguns segundos para os serviços iniciarem
# Verifique se está tudo rodando
docker-compose ps

# Ver logs da aplicação
docker-compose logs -f api
```

API: `http://localhost:3000`  
Documentação Swagger: `http://localhost:3000/api-docs`  
RabbitMQ Management: `http://localhost:15672` (user: guest, password: guest)

## Testando

```bash
# Rodar testes e2e
docker compose run --rm test
```

Os testes e2e validam:
- Criação de sessões
- Reserva de assentos
- Confirmação de pagamento
- Expiração de reservas
- Concorrência (venda dupla e prevenção de deadlock)


## Como solucionei os desafios propostos

### Evitar venda dupla do mesmo assento

Implementei um sistema de locks distribuídos usando Redis. Antes de processar uma reserva, o sistema tenta adquirir um lock exclusivo para os assentos solicitados. Apenas uma requisição consegue obter o lock por vez, garantindo que as verificações e modificações no banco de dados sejam atômicas.

```typescript
const lockKey = `lock:session:${sessionId}:seats:${seatNumbers.sort().join(',')}`;
const locked = await this.redis.acquireLock(lockKey, 30_000);

if (!locked) {
  throw new ConflictException('Assentos em disputa. Tente novamente.');
}
```

O lock tem duração de 30 segundos e é liberado automaticamente após a conclusão da operação, evitando que recursos fiquem travados indefinidamente.

### Evitar deadlock

Em caso de duas pessoas tentarem reservar assentos em ordens diferentes ([1,3] vs [3,1]), pode ocorrer um deadlock. A solução foi simples: ordenar os números antes de criar a chave do lock. Assim todo mundo pede na mesma ordem.

### Expirações automáticas

Desenvolvi um serviço que, a cada 10 segundos, é executado e verifica as reservas que expiraram. Em caso afirmativo, o assento é liberado novamente.

### Idempotência

Adicionei suporte para um header `Idempotency-Key`. Em uma situação onde cliente envia a mesma requisição duas vezes (como por timeout), é retornado o resultado anterior ao invés de processar novamente.

## API Endpoints

A documentação completa está disponível no Swagger (`/api-docs`), mas resumindo:

- `POST /sessions` - Criar nova sessão
- `GET /sessions` - Listar sessões  
- `GET /sessions/:id/seats` - Lista assentos disponíveis
- `POST /reservations` - Reservar assentos
- `POST /sales/confirm-payment` - Confirmar pagamento
- `GET /sales/users/:userId` - Listar compras de um usuário

## Decisões que tomei

**Por que Redis e Postgres juntos?**

Postgres é ótimo para guardar dados de forma permanente e tem transações, mas Redis é muito mais rápido para locks temporários porque trabalha em memória. Usei cada um para o que faz melhor.

**Por que RabbitMQ e não Kafka?**

RabbitMQ é mais simples de configurar e para o volume de mensagens deste projeto atende perfeitamente. Kafka seria necessário para volumes muito maiores ou se precisasse guardar histórico de eventos por mais tempo.

## O que ficou faltando

- Não implementei autenticação de verdade (userId é só uma string)
- Não tem Dead Letter Queue para mensagens com erro
- Idempotência só funciona em alguns endpoints
- Não tem rate limiting
- Poderia ter mais testes

## O que eu faria com mais tempo

- Adicionar autenticação JWT
- Melhorar o tratamento de erros
- Adicionar mais testes
- Documentar melhor o código
- Monitoramento (logs melhores)


Desenvolvido por Eduardo Guimarães.
