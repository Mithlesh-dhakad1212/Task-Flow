import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
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
import { CreateTaskDto, ListTasksQueryDto, TaskDto, TaskListDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@ApiCookieAuth()
@ApiHeader({ name: 'X-Timezone', required: false, description: 'IANA timezone used to decide what "overdue" means' })
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List, filter and search your tasks across projects' })
  @ApiOkResponse({ type: TaskListDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListTasksQueryDto,
    @ClientToday() today: Date,
  ): Promise<TaskListDto> {
    return this.tasks.list(user.id, query, today);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task in one of your projects' })
  @ApiCreatedResponse({ type: TaskDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Project not found' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto, @ClientToday() today: Date): Promise<TaskDto> {
    return this.tasks.create(user.id, dto, today);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task' })
  @ApiOkResponse({ type: TaskDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientToday() today: Date,
  ): Promise<TaskDto> {
    return this.tasks.get(user.id, id, today);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task (any subset of fields, e.g. just the status)' })
  @ApiOkResponse({ type: TaskDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @ClientToday() today: Date,
  ): Promise<TaskDto> {
    return this.tasks.update(user.id, id, dto, today);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasks.remove(user.id, id);
  }
}
