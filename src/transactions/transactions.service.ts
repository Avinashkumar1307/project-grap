import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: string): Promise<Transaction> {
    const transaction = this.transactionsRepository.create({
      ...createTransactionDto,
      userId,
      transactionReference: this.generateTransactionReference(),
    });
    return await this.transactionsRepository.save(transaction);
  }

  async findAll(userId?: string, isAdmin?: boolean): Promise<Transaction[]> {
    const where: any = {};

    if (!isAdmin && userId) {
      where.userId = userId;
    }

    return await this.transactionsRepository.find({
      where,
      relations: ['user', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['user', 'project'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByUser(userId: string): Promise<Transaction[]> {
    return await this.transactionsRepository.find({
      where: { userId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProject(projectId: string): Promise<Transaction[]> {
    return await this.transactionsRepository.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: TransactionStatus): Promise<Transaction[]> {
    return await this.transactionsRepository.find({
      where: { status },
      relations: ['user', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);
    Object.assign(transaction, updateTransactionDto);
    return await this.transactionsRepository.save(transaction);
  }

  async updateStatus(id: string, status: TransactionStatus, failureReason?: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.status = status;
    if (failureReason) transaction.failureReason = failureReason;
    return await this.transactionsRepository.save(transaction);
  }

  async getStats(userId?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const total = await this.transactionsRepository.count({ where });
    const completed = await this.transactionsRepository.count({
      where: { ...where, status: TransactionStatus.COMPLETED },
    });
    const pending = await this.transactionsRepository.count({
      where: { ...where, status: TransactionStatus.PENDING },
    });
    const failed = await this.transactionsRepository.count({
      where: { ...where, status: TransactionStatus.FAILED },
    });

    const totalAmount = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'sum')
      .where(userId ? 'transaction.userId = :userId' : '1=1', { userId })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    return {
      total,
      completed,
      pending,
      failed,
      totalAmount: parseFloat(totalAmount.sum) || 0,
    };
  }

  async getTransactionHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Transaction[]> {
    const where: any = { userId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    return await this.transactionsRepository.find({
      where,
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  private generateTransactionReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TXN${timestamp}${random}`;
  }
}
