import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray, IsUrl, Min } from 'class-validator';
import { ProjectCategory, ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ProjectCategory)
  @IsNotEmpty()
  category: ProjectCategory;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  features?: string;

  @IsString()
  @IsOptional()
  techStack?: string;

  @IsUrl()
  @IsOptional()
  demoUrl?: string;

  @IsUrl()
  @IsOptional()
  documentationUrl?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
