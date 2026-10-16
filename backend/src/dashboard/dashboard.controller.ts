import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { type AuthUser } from '../auth/auth.types';
import { ClientTimeZone, ClientToday } from '../common/decorators/client-today.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/http/error-response';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiCookieAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Totals, completion and overdue statistics for the current user' })
  @ApiHeader({ name: 'X-Timezone', required: false, description: 'IANA timezone, e.g. Asia/Kolkata' })
  @ApiOkResponse({ type: DashboardDto })
  summary(
    @CurrentUser() user: AuthUser,
    @ClientToday() today: Date,
    @ClientTimeZone() timeZone: string,
  ): Promise<DashboardDto> {
    return this.dashboard.summary(user.id, today, timeZone);
  }
}
