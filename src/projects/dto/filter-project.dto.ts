import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ProjectCategory, ProjectStatus } from '../entities/project.entity';

export class FilterProjectDto {
  @IsEnum(ProjectCategory)
  @IsOptional()
  category?: ProjectCategory;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 10;
}
