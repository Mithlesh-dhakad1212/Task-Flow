import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { type CookieOptions, type Request, type Response } from 'express';
import { AuthRateLimited } from '../common/decorators/auth-rate-limit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ErrorResponseDto } from '../common/http/error-response';
import { AppConfigService } from '../config/app-config.service';
import { AuthResult, AuthService } from './auth.service';
import {
  ACCESS_COOKIE,
  type AccessTokenPayload,
  type AuthUser,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  type RequestMeta,
} from './auth.types';
import { AuthResponseDto, LoginDto, RegisterDto, UserDto } from './dto/auth.dto';
import { extractAccessToken } from './jwt-auth.guard';
import { SessionsService } from './sessions.service';

@ApiTags('Auth')
@ApiTooManyRequestsResponse({ type: ErrorResponseDto, description: 'Rate limit exceeded' })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @AuthRateLimited()
  @Post('register')
  @ApiOperation({ summary: 'Create an account and start a session' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respond(res, await this.auth.register(dto, this.meta(req)));
  }

  @Public()
  @AuthRateLimited()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respond(res, await this.auth.login(dto, this.meta(req)));
  }

  @Public()
  @AuthRateLimited()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh token (httpOnly cookie) and issue a new access token',
    description: 'A refresh token can be used once. Re-using an old one revokes the whole session.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthResponseDto> {
    try {
      return this.respond(res, await this.auth.refresh(this.refreshCookie(req)));
    } catch (err) {
      this.clearCookies(res);
      throw err;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End the current session and clear auth cookies' })
  @ApiNoContentResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    // Works with either credential so logout succeeds even with an expired access token.
    const sessionId = this.sessions.sessionIdOf(this.refreshCookie(req)) ?? (await this.sessionFromAccess(req));
    await this.auth.logout(sessionId);
    this.clearCookies(res);
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Current user' })
  @ApiOkResponse({ type: UserDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  me(@CurrentUser() user: AuthUser): Promise<UserDto> {
    return this.auth.me(user.id);
  }

  private respond(res: Response, result: AuthResult): AuthResponseDto {
    const base: CookieOptions = {
      httpOnly: true,
      secure: this.config.cookieSecure,
      sameSite: 'lax',
    };
    res.cookie(ACCESS_COOKIE, result.accessToken, { ...base, path: '/', maxAge: this.config.jwtAccessTtlMs });
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...base,
      path: REFRESH_COOKIE_PATH,
      maxAge: this.config.refreshTokenTtlMs,
    });
    // The refresh token is deliberately never exposed in the body.
    return { user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  private clearCookies(res: Response) {
    const base: CookieOptions = { httpOnly: true, secure: this.config.cookieSecure, sameSite: 'lax' };
    res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
    res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_COOKIE_PATH });
  }

  private refreshCookie(req: Request): string | undefined {
    const value = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    return typeof value === 'string' ? value : undefined;
  }

  private async sessionFromAccess(req: Request): Promise<string | null> {
    const token = extractAccessToken(req);
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, { ignoreExpiration: true });
      return payload.sid ?? null;
    } catch {
      return null;
    }
  }

  private meta(req: Request): RequestMeta {
    return { userAgent: req.header('user-agent'), ipAddress: req.ip };
  }
}
