'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { type z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form-controls';
import { useAuth } from '@/context/auth-context';
import { ApiError, errorMessage } from '@/lib/api/client';
import { registerSchema } from '@/lib/validation';

type Values = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null);
    try {
      await signUp(name, email, password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('email', { message: 'An account with this email already exists' });
      } else if (err instanceof ApiError && err.details.length) {
        for (const d of err.details) {
          setError(d.field as keyof Values, { message: d.messages[0] });
        }
      } else {
        setFormError(errorMessage(err, 'Could not create your account'));
      }
    }
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900">Create your account</h1>
      <p className="mt-1 text-sm text-ink-500">Start organizing your projects in seconds</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
            {formError}
          </div>
        )}
        <Field label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" placeholder="Alex Morgan" {...register('name')} />
        </Field>
        <Field label="Email address" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="alex@example.com" {...register('email')} />
        </Field>
        <Field
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters, including a letter and a number."
        >
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label="Confirm password" error={errors.confirm?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirm')} />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
