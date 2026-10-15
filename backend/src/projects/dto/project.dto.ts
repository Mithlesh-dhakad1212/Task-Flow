import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageMetaDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Trim } from '../../common/transforms';

export const PROJECT_COLORS = ['blue', 'violet', 'emerald', 'amber', 'rose', 'cyan'] as const;
export type ProjectColor = (typeof PROJECT_COLORS)[number];

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign', minLength: 1, maxLength: 120 })
  @Trim()
  @IsString()
  @MinLength(1, { message: 'name should not be empty' })
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Modernize the company website with a new design.', maxLength: 2000 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: PROJECT_COLORS, default: 'blue' })
  @IsOptional()
  @IsIn(PROJECT_COLORS)
  color?: ProjectColor;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export const PROJECT_SORT_FIELDS = ['createdAt', 'updatedAt', 'name'] as const;

export class ListProjectsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive match on name or description' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: PROJECT_SORT_FIELDS, default: 'updatedAt' })
  @IsOptional()
  @IsIn(PROJECT_SORT_FIELDS)
  sortBy: (typeof PROJECT_SORT_FIELDS)[number] = 'updatedAt';
}

export class ProjectStatsDto {
  @ApiProperty({ example: 12 }) total: number;
  @ApiProperty({ example: 3 }) todo: number;
  @ApiProperty({ example: 1 }) inProgress: number;
  @ApiProperty({ example: 8 }) done: number;
  @ApiProperty({ example: 2, description: 'Not done and due before today' }) overdue: number;
  @ApiProperty({ example: 67, description: 'Percent of tasks done, 0–100' }) progress: number;
}

export class ProjectDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty({ enum: PROJECT_COLORS }) color: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ type: ProjectStatsDto }) stats: ProjectStatsDto;
}

export class ProjectListDto {
  @ApiProperty({ type: [ProjectDto] }) data: ProjectDto[];
  @ApiProperty({ type: PageMetaDto }) meta: PageMetaDto;
}
