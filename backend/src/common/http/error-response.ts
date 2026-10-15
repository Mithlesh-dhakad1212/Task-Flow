import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldErrorDto {
  @ApiProperty({ example: 'email' })
  field: string;

  @ApiProperty({ example: ['email must be an email'] })
  messages: string[];
}

/** The single error envelope returned by every failing endpoint. */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiPropertyOptional({ type: [FieldErrorDto] })
  details?: FieldErrorDto[];

  @ApiProperty({ example: '/api/projects' })
  path: string;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '9b2f6c1e-1f0d-4a8e-9a43-2b0d8f1a7c55' })
  requestId: string;
}
