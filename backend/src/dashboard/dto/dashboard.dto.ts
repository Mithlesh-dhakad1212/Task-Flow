import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatsDto } from '../../projects/dto/project.dto';
import { TaskDto } from '../../tasks/dto/task.dto';

export class DashboardTotalsDto {
  @ApiProperty({ example: 8 }) projects: number;
  @ApiProperty({ example: 24 }) tasks: number;
  @ApiProperty({ example: 3 }) todo: number;
  @ApiProperty({ example: 5 }) inProgress: number;
  @ApiProperty({ example: 16 }) completed: number;
  @ApiProperty({ example: 3, description: 'Not done and due before today' }) overdue: number;
  @ApiProperty({ example: 2, description: 'Not done and due today' }) dueToday: number;
  @ApiProperty({ example: 67, description: 'completed / tasks, 0–100' }) completionRate: number;
}

export class DashboardProjectDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() color: string;
  @ApiProperty({ type: ProjectStatsDto }) stats: ProjectStatsDto;
}

export class ActivityPointDto {
  @ApiProperty({ example: '2026-10-15', description: 'Calendar day in the caller timezone' }) date: string;
  @ApiProperty({ example: 3, description: 'Tasks completed that day' }) completed: number;
}

export class OpenByPriorityDto {
  @ApiProperty({ example: 2 }) HIGH: number;
  @ApiProperty({ example: 5 }) MEDIUM: number;
  @ApiProperty({ example: 4 }) LOW: number;
}

export class DashboardDto {
  @ApiProperty({ type: DashboardTotalsDto }) totals: DashboardTotalsDto;
  @ApiProperty({ type: [DashboardProjectDto], description: 'Most recently active projects' })
  projects: DashboardProjectDto[];
  @ApiProperty({ type: [TaskDto], description: 'Next open tasks by due date (today onwards)' })
  upcoming: TaskDto[];
  @ApiProperty({ type: [TaskDto], description: 'Most overdue open tasks' })
  overdue: TaskDto[];
  @ApiProperty({ type: [ActivityPointDto], description: 'Completions per day for the last 14 days (oldest first)' })
  activity: ActivityPointDto[];
  @ApiProperty({ type: OpenByPriorityDto, description: 'Open (not done) tasks by priority' })
  openByPriority: OpenByPriorityDto;
}
