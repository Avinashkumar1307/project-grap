import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RequestStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ProjectType {
  ML = 'ml',
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  FULLSTACK = 'fullstack',
  AI = 'ai',
  OTHER = 'other',
}

@Entity('custom_requests')
export class CustomRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  projectTitle: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectType,
  })
  projectType: ProjectType;

  @Column('simple-array', { nullable: true })
  requiredFeatures: string[];

  @Column('text', { nullable: true })
  technicalRequirements: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budgetInINR: number;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column('text', { nullable: true })
  adminNotes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quotedPrice: number;

  @Column({ type: 'int', nullable: true })
  estimatedDays: number;

  @Column('simple-array', { nullable: true })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
