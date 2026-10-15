import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PageMetaDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Trim } from '../../common/transforms';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Accepts `?status=TODO&status=DONE` or `?status=TODO,DONE`. */
const CsvArray = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const list = Array.isArray(value) ? value : [value];
    return list.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean);
  });

export class CreateTaskDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'projectId must be a valid id' })
  projectId: string;

  @ApiProperty({ example: 'Design homepage', minLength: 1, maxLength: 200 })
  @Trim()
  @IsString()
  @MinLength(1, { message: 'title should not be empty' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Hero, features and pricing sections', maxLength: 5000 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus, { message: `status must be one of: ${Object.values(TaskStatus).join(', ')}` })
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority, { message: `priority must be one of: ${Object.values(TaskPriority).join(', ')}` })
  priority?: TaskPriority;

  @ApiProperty({ example: '2026-11-01', description: 'Calendar date, YYYY-MM-DD' })
  @Matches(DATE_ONLY, { message: 'dueDate must be in YYYY-MM-DD format' })
  @IsISO8601({ strict: true }, { message: 'dueDate must be a valid calendar date' })
  dueDate: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'status'] as const;

export class ListTasksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Limit to one project', format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'projectId must be a valid id' })
  projectId?: string;

  @ApiPropertyOptional({ enum: TaskStatus, isArray: true, description: 'Repeat or comma-separate for several' })
  @IsOptional()
  @CsvArray()
  @IsArray()
  @ArrayMaxSize(3)
  @IsEnum(TaskStatus, { each: true, message: `status must be one of: ${Object.values(TaskStatus).join(', ')}` })
  status?: TaskStatus[];

  @ApiPropertyOptional({ enum: TaskPriority, isArray: true, description: 'Repeat or comma-separate for several' })
  @IsOptional()
  @CsvArray()
  @IsArray()
  @ArrayMaxSize(3)
  @IsEnum(TaskPriority, {
    each: true,
    message: `priority must be one of: ${Object.values(TaskPriority).join(', ')}`,
  })
  priority?: TaskPriority[];

  @ApiPropertyOptional({ description: 'Case-insensitive search on title' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Only tasks that are not done and due before today' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : value))
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ enum: TASK_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sortBy: (typeof TASK_SORT_FIELDS)[number] = 'createdAt';

  // Board view loads a whole column set at once, so allow a larger page.
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  override limit: number = 20;
}

export class TaskProjectDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() color: string;
}

export class TaskDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) projectId: string;
  @ApiProperty({ type: TaskProjectDto }) project: TaskProjectDto;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty({ enum: TaskStatus }) status: TaskStatus;
  @ApiProperty({ enum: TaskPriority }) priority: TaskPriority;
  @ApiProperty({ example: '2026-11-01' }) dueDate: string;
  @ApiProperty({ description: 'Not done and due before today (in the caller timezone)' }) isOverdue: boolean;
  @ApiPropertyOptional({ nullable: true, type: Date }) completedAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class TaskListDto {
  @ApiProperty({ type: [TaskDto] }) data: TaskDto[];
  @ApiProperty({ type: PageMetaDto }) meta: PageMetaDto;
}
