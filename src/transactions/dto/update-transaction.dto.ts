import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '../entities/transaction.entity';

export class UpdateTransactionDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsString()
  @IsOptional()
  transactionReference?: string;

  @IsString()
  @IsOptional()
  paymentGatewayOrderId?: string;

  @IsString()
  @IsOptional()
  paymentGatewayPaymentId?: string;

  @IsString()
  @IsOptional()
  failureReason?: string;

  @IsOptional()
  metadata?: any;
}
