import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ProjectsModule, TasksModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
