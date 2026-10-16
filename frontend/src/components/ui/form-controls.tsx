import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  cloneElement,
} from 'react';
import { cn } from '@/lib/utils';

const control =
  'block w-full rounded-lg border-0 bg-surface px-3 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 transition focus:ring-2 focus:ring-inset focus:ring-brand-500 focus-visible:ring-offset-0 disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:ring-rose-400 aria-[invalid=true]:focus:ring-rose-500';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-10', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(control, 'min-h-24 resize-y py-2.5', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(control, 'h-10 cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
});

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  /** Exactly one form control; it receives id / aria wiring automatically. */
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>;
}

/** Label + control + error/hint with correct accessibility attributes. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      {cloneElement(children, { id, 'aria-invalid': !!error || undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
