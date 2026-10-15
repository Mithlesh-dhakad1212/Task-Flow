import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim, TrimLower } from '../../common/transforms';

export class RegisterDto {
  @ApiProperty({ example: 'Alex Morgan', minLength: 2, maxLength: 80 })
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'alex@example.com' })
  @TrimLower()
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: 'Password123!',
    minLength: 8,
    maxLength: 72,
    description: 'At least 8 characters with at least one letter and one number',
  })
  @IsString()
  @MinLength(8)
  // bcrypt only uses the first 72 bytes of input
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'password must contain at least one letter and one number' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'demo@taskflow.dev' })
  @TrimLower()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}

export class UserDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserDto }) user: UserDto;

  @ApiProperty({
    description:
      'Short-lived JWT. Also set as an httpOnly cookie; returned here for API clients that prefer the Authorization header.',
  })
  accessToken: string;

  @ApiProperty({ description: 'Access token lifetime in seconds', example: 900 })
  expiresIn: number;
}
