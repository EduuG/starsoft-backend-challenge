import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // Create a session with seats.
  @Post()
  async create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  // List sessions.
  @Get()
  async listAll() {
    return this.sessionsService.listAll();
  }

  // Session details by id.
  @Get(':id')
  async findById(@Param('id') sessionId: string) {
    return this.sessionsService.findById(sessionId);
  }

  // Seat availability by session.
  @Get(':id/seats')
  async getSeats(@Param('id') sessionId: string) {
    return this.sessionsService.getSessionSeats(sessionId);
  }
}
