import { type ArgumentsHost, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

function mockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', originalUrl: '/api/x', id: 'req-1' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('wraps HttpExceptions in the standard envelope', () => {
    const { host, status, json } = mockHost();
    filter.catch(new NotFoundException('Project not found'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'Not Found',
      message: 'Project not found',
      path: '/api/x',
      timestamp: expect.any(String),
      requestId: 'req-1',
    });
  });

  it('keeps field-level validation details', () => {
    const { host, json } = mockHost();
    const details = [{ field: 'name', messages: ['name should not be empty'] }];
    filter.catch(new BadRequestException({ message: 'Validation failed', details }), host);
    expect(json.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: 'Validation failed', details });
  });

  it('maps a Prisma unique violation to 409', () => {
    const { host, status } = mockHost();
    filter.catch(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }), host);
    expect(status).toHaveBeenCalledWith(409);
  });

  it('hides internals of unexpected errors', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('connection string postgres://secret@db'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0].message).toBe('Internal server error');
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('secret');
  });
});
