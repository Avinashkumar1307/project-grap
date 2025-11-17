import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum ProjectCategory {
  ML = 'ml',
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  FULLSTACK = 'fullstack',
  AI = 'ai',
  OTHER = 'other',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  SOLD_OUT = 'sold_out',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectCategory,
    default: ProjectCategory.OTHER,
  })
  category: ProjectCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('text', { nullable: true })
  features: string;

  @Column('text', { nullable: true })
  techStack: string;

  @Column({ nullable: true })
  demoUrl: string;

  @Column({ nullable: true })
  documentationUrl: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  downloads: number;

  @Column({ type: 'int', default: 0 })
  sales: number;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({ nullable: true })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @OneToMany(() => Transaction, (transaction) => transaction.project)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
