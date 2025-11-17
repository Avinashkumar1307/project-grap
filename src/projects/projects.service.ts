import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    sellerId: string,
  ): Promise<Project> {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      sellerId,
    });
    return await this.projectsRepository.save(project);
  }

  async findAll(filterDto: FilterProjectDto) {
    const {
      category,
      status,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = filterDto;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = ProjectStatus.ACTIVE;
    }

    if (search) {
      where.title = Like(`%${search}%`);
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = Between(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      where.price = Between(minPrice, Number.MAX_SAFE_INTEGER);
    } else if (maxPrice !== undefined) {
      where.price = Between(0, maxPrice);
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await this.projectsRepository.findAndCount({
      where,
      relations: ['seller'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['seller', 'transactions'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Increment views
    project.views += 1;
    await this.projectsRepository.save(project);

    return project;
  }

  async findByUser(userId: string): Promise<Project[]> {
    return await this.projectsRepository.find({
      where: { sellerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (project.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    Object.assign(project, updateProjectDto);
    return await this.projectsRepository.save(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    if (project.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own projects');
    }

    await this.projectsRepository.remove(project);
  }

  async incrementDownloads(id: string): Promise<void> {
    await this.projectsRepository.increment({ id }, 'downloads', 1);
  }

  async incrementSales(id: string): Promise<void> {
    await this.projectsRepository.increment({ id }, 'sales', 1);
  }

  async getPopular(limit: number = 10): Promise<Project[]> {
    return await this.projectsRepository.find({
      where: { status: ProjectStatus.ACTIVE },
      order: { sales: 'DESC', views: 'DESC' },
      take: limit,
    });
  }

  async getLatest(limit: number = 10): Promise<Project[]> {
    return await this.projectsRepository.find({
      where: { status: ProjectStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
