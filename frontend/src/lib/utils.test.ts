import { initials, safeNext } from './utils';
import { registerSchema, taskSchema } from './validation';

describe('safeNext', () => {
  it.each([
    ['/projects/123', '/projects/123'],
    [null, '/dashboard'],
    ['https://evil.example', '/dashboard'],
    ['//evil.example', '/dashboard'],
    ['/\\evil.example', '/dashboard'],
  ])('safeNext(%p) → %p', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});

describe('initials', () => {
  it('takes up to two initials', () => {
    expect(initials('Alex Morgan')).toBe('AM');
    expect(initials('cher')).toBe('C');
    expect(initials('  ')).toBe('?');
  });
});

describe('validation schemas', () => {
  it('requires matching passwords with a letter and a number', () => {
    const base = { name: 'Alex', email: 'a@b.co', password: 'Password1', confirm: 'Password1' };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, confirm: 'nope' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'onlyletters', confirm: 'onlyletters' }).success).toBe(false);
  });

  it('rejects blank task titles and malformed dates', () => {
    const base = { projectId: 'p', title: 'Do it', description: '', status: 'TODO', priority: 'LOW', dueDate: '2026-10-20' };
    expect(taskSchema.safeParse(base).success).toBe(true);
    expect(taskSchema.safeParse({ ...base, title: '   ' }).success).toBe(false);
    expect(taskSchema.safeParse({ ...base, dueDate: '20/10/2026' }).success).toBe(false);
  });
});
