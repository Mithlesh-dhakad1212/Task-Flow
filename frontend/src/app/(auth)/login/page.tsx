'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form-controls';
import { useAuth } from '@/context/auth-context';
import { errorMessage } from '@/lib/api/client';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // On success the auth layout redirects to ?next= (or the dashboard).
      await login(values.email, values.password);
    } catch (err) {
      setFormError(errorMessage(err, 'Could not sign in'));
    }
  });

  const fillDemo = () => {
    setValue('email', 'demo@taskflow.dev', { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Sign in to your TaskFlow account</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {formError && (
          <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
            {formError}
          </div>
        )}
        <Field label="Email address" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="alex@example.com" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create account
        </Link>
      </p>

      <button
        type="button"
        onClick={fillDemo}
        className="mt-6 flex w-full items-start gap-2 rounded-lg border border-dashed border-ink-200 px-3 py-2.5 text-left text-xs text-ink-500 transition hover:border-brand-300 hover:bg-brand-50/50"
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
        <span>
          Trying it out? Use the seeded demo account{' '}
          <span className="font-semibold text-ink-700">demo@taskflow.dev</span> — click to fill in.
        </span>
      </button>
    </div>
  );
}
