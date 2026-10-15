import { z } from 'zod';
import { PROJECT_COLOR_KEYS } from './constants';

// Client-side mirrors of the API validation rules, so most mistakes are
// caught before a round-trip. The API remains the source of truth.

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Use at most 72 characters')
      .regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Include at least one letter and one number'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120, 'Keep it under 120 characters'),
  description: z.string().trim().max(2000, 'Keep it under 2000 characters'),
  color: z.enum(PROJECT_COLOR_KEYS as [string, ...string[]]),
});

export const taskSchema = z.object({
  projectId: z.string().min(1, 'Choose a project'),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Keep it under 200 characters'),
  description: z.string().trim().max(5000, 'Keep it under 5000 characters'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format'),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type TaskFormValues = z.infer<typeof taskSchema>;
