import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomRequest, RequestStatus } from './entities/custom-request.entity';
import { CreateCustomRequestDto } from './dto/create-custom-request.dto';
import { UpdateCustomRequestDto } from './dto/update-custom-request.dto';

@Injectable()
export class CustomRequestsService {
  constructor(
    @InjectRepository(CustomRequest)
    private customRequestsRepository: Repository<CustomRequest>,
  ) {}

  async create(createCustomRequestDto: CreateCustomRequestDto, userId: string): Promise<CustomRequest> {
    const customRequest = this.customRequestsRepository.create({
      ...createCustomRequestDto,
      userId,
    });
    return await this.customRequestsRepository.save(customRequest);
  }

  async findAll(userId?: string, isAdmin?: boolean): Promise<CustomRequest[]> {
    const where: any = {};

    if (!isAdmin && userId) {
      where.userId = userId;
    }

    return await this.customRequestsRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomRequest> {
    const customRequest = await this.customRequestsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!customRequest) {
      throw new NotFoundException(`Custom request with ID ${id} not found`);
    }

    return customRequest;
  }

  async findByUser(userId: string): Promise<CustomRequest[]> {
    return await this.customRequestsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: RequestStatus): Promise<CustomRequest[]> {
    return await this.customRequestsRepository.find({
      where: { status },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateCustomRequestDto: UpdateCustomRequestDto, userId: string, isAdmin?: boolean): Promise<CustomRequest> {
    const customRequest = await this.findOne(id);

    if (!isAdmin && customRequest.userId !== userId) {
      throw new ForbiddenException('You can only update your own requests');
    }

    Object.assign(customRequest, updateCustomRequestDto);
    return await this.customRequestsRepository.save(customRequest);
  }

  async updateStatus(id: string, status: RequestStatus, adminNotes?: string, quotedPrice?: number, estimatedDays?: number): Promise<CustomRequest> {
    const customRequest = await this.findOne(id);

    customRequest.status = status;
    if (adminNotes) customRequest.adminNotes = adminNotes;
    if (quotedPrice) customRequest.quotedPrice = quotedPrice;
    if (estimatedDays) customRequest.estimatedDays = estimatedDays;

    return await this.customRequestsRepository.save(customRequest);
  }

  async remove(id: string, userId: string): Promise<void> {
    const customRequest = await this.findOne(id);

    if (customRequest.userId !== userId) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    if (customRequest.status !== RequestStatus.PENDING && customRequest.status !== RequestStatus.CANCELLED) {
      throw new ForbiddenException('You can only delete pending or cancelled requests');
    }

    await this.customRequestsRepository.remove(customRequest);
  }

  async getStats() {
    const total = await this.customRequestsRepository.count();
    const pending = await this.customRequestsRepository.count({ where: { status: RequestStatus.PENDING } });
    const inProgress = await this.customRequestsRepository.count({ where: { status: RequestStatus.IN_PROGRESS } });
    const completed = await this.customRequestsRepository.count({ where: { status: RequestStatus.COMPLETED } });

    return {
      total,
      pending,
      inProgress,
      completed,
    };
  }
}
