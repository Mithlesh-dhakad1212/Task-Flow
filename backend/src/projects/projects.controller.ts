import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { type AuthUser } from '../auth/auth.types';
import { ClientToday } from '../common/decorators/client-today.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/http/error-response';
import {
  CreateProjectDto,
  ListProjectsQueryDto,
  ProjectDto,
  ProjectListDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@ApiCookieAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List your projects with task counts and progress' })
  @ApiOkResponse({ type: ProjectListDto })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListProjectsQueryDto,
    @ClientToday() today: Date,
  ): Promise<ProjectListDto> {
    return this.projects.list(user.id, query, today);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiCreatedResponse({ type: ProjectDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto): Promise<ProjectDto> {
    return this.projects.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project' })
  @ApiOkResponse({ type: ProjectDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientToday() today: Date,
  ): Promise<ProjectDto> {
    return this.projects.get(user.id, id, today);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiOkResponse({ type: ProjectDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @ClientToday() today: Date,
  ): Promise<ProjectDto> {
    return this.projects.update(user.id, id, dto, today);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project and all of its tasks' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.projects.remove(user.id, id);
  }
}
