import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { type AccessTokenPayload, type RequestMeta } from './auth.types';
import { type LoginDto, type RegisterDto, type UserDto } from './dto/auth.dto';
import { SessionsService } from './sessions.service';

export interface AuthResult {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const publicUserSelect = { id: true, email: true, name: true, createdAt: true } as const;

@Injectable()
export class AuthService {
  /**
   * Compared against when the email does not exist so that login takes the
   * same time either way (prevents user enumeration via timing).
   */
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionsService,
    private readonly config: AppConfigService,
  ) {
    this.dummyHash = bcrypt.hash('taskflow-timing-equalizer', this.config.bcryptRounds);
  }

  async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, this.config.bcryptRounds);
    // The unique index is the real guard against races; P2002 maps to 409 in the filter.
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
      select: publicUserSelect,
    });
    return this.issue(user, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const valid = await bcrypt.compare(dto.password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !valid) throw new UnauthorizedException('Invalid email or password');

    const { passwordHash: _omit, updatedAt: _u, ...publicUser } = user;
    return this.issue(publicUser, meta);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    const rotated = await this.sessions.rotate(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: rotated.userId }, select: publicUserSelect });
    if (!user) throw new UnauthorizedException('Session expired, please log in again');
    return {
      user,
      refreshToken: rotated.refreshToken,
      ...(await this.signAccess(user, rotated.sessionId)),
    };
  }

  async logout(sessionId: string | null): Promise<void> {
    if (sessionId) await this.sessions.revoke(sessionId);
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async issue(user: UserDto, meta: RequestMeta): Promise<AuthResult> {
    const { sessionId, refreshToken } = await this.sessions.create(user.id, meta);
    return { user, refreshToken, ...(await this.signAccess(user, sessionId)) };
  }

  private async signAccess(user: UserDto, sessionId: string) {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, sid: sessionId };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, expiresIn: Math.floor(this.config.jwtAccessTtlMs / 1000) };
  }
}
