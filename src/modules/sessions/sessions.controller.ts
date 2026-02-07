import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova sessão de cinema', description: 'Cria uma sessão de cinema com assentos disponíveis para reserva' })
  @ApiResponse({ status: 201, description: 'Sessão criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as sessões', description: 'Retorna todas as sessões de cinema cadastradas' })
  @ApiResponse({ status: 200, description: 'Lista de sessões retornada com sucesso' })
  async listAll() {
    return this.sessionsService.listAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar sessão por ID', description: 'Retorna os detalhes de uma sessão específica' })
  @ApiResponse({ status: 200, description: 'Sessão encontrada' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async findById(@Param('id') sessionId: string) {
    return this.sessionsService.findById(sessionId);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'Consultar assentos da sessão', description: 'Retorna a disponibilidade dos assentos de uma sessão' })
  @ApiResponse({ status: 200, description: 'Lista de assentos retornada' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async getSeats(@Param('id') sessionId: string) {
    return this.sessionsService.getSessionSeats(sessionId);
  }
}
