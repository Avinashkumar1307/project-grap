import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CustomRequestsService } from './custom-requests.service';
import { CreateCustomRequestDto } from './dto/create-custom-request.dto';
import { UpdateCustomRequestDto } from './dto/update-custom-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestStatus } from './entities/custom-request.entity';

@Controller('custom-requests')
export class CustomRequestsController {
  constructor(private readonly customRequestsService: CustomRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCustomRequestDto: CreateCustomRequestDto, @Request() req) {
    return this.customRequestsService.create(createCustomRequestDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    const isAdmin = req.user.role === 'admin';
    return this.customRequestsService.findAll(req.user.id, isAdmin);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.customRequestsService.getStats();
  }

  @Get('by-status/:status')
  @UseGuards(JwtAuthGuard)
  findByStatus(@Param('status') status: RequestStatus) {
    return this.customRequestsService.findByStatus(status);
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  getMyRequests(@Request() req) {
    return this.customRequestsService.findByUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.customRequestsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCustomRequestDto: UpdateCustomRequestDto,
    @Request() req,
  ) {
    const isAdmin = req.user.role === 'admin';
    return this.customRequestsService.update(id, updateCustomRequestDto, req.user.id, isAdmin);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: RequestStatus; adminNotes?: string; quotedPrice?: number; estimatedDays?: number },
  ) {
    return this.customRequestsService.updateStatus(
      id,
      body.status,
      body.adminNotes,
      body.quotedPrice,
      body.estimatedDays,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.customRequestsService.remove(id, req.user.id);
  }
}
