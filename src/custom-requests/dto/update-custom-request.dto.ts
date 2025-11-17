import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomRequestDto } from './create-custom-request.dto';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RequestStatus } from '../entities/custom-request.entity';

export class UpdateCustomRequestDto extends PartialType(CreateCustomRequestDto) {
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quotedPrice?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  estimatedDays?: number;
}
