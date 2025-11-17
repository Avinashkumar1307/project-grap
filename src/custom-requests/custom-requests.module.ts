import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomRequestsService } from './custom-requests.service';
import { CustomRequestsController } from './custom-requests.controller';
import { CustomRequest } from './entities/custom-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomRequest])],
  controllers: [CustomRequestsController],
  providers: [CustomRequestsService],
  exports: [CustomRequestsService],
})
export class CustomRequestsModule {}
