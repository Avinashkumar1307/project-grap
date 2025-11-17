import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectType } from '../entities/custom-request.entity';

export class CreateCustomRequestDto {
  @IsString()
  @IsNotEmpty()
  projectTitle: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ProjectType)
  @IsNotEmpty()
  projectType: ProjectType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredFeatures?: string[];

  @IsString()
  @IsOptional()
  technicalRequirements?: string;

  @IsNumber()
  @Min(0)
  budgetInINR: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expectedDeliveryDate?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
