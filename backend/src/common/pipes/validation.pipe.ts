import { BadRequestException, ValidationPipe, type ValidationError } from '@nestjs/common';
import { type FieldErrorDto } from '../http/error-response';

function flatten(errors: ValidationError[], parent = ''): FieldErrorDto[] {
  return errors.flatMap((err) => {
    const field = parent ? `${parent}.${err.property}` : err.property;
    const own = err.constraints ? [{ field, messages: Object.values(err.constraints) }] : [];
    return [...own, ...flatten(err.children ?? [], field)];
  });
}

/**
 * Strict global validation: unknown properties are rejected, payloads are
 * transformed into DTO instances, and errors are reported per field.
 */
export const appValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: false,
  exceptionFactory: (errors) =>
    new BadRequestException({ message: 'Validation failed', details: flatten(errors) }),
});
