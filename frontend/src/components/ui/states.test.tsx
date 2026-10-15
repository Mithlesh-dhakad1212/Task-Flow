import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inbox } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { Field, Input } from './form-controls';
import { EmptyState, ErrorState } from './states';

describe('EmptyState', () => {
  it('renders title, description and action', () => {
    render(<EmptyState icon={Inbox} title="No tasks match" description="Try clearing filters" action={<button>Clear</button>} />);
    expect(screen.getByRole('heading', { name: 'No tasks match' })).toBeInTheDocument();
    expect(screen.getByText('Try clearing filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('shows a friendly message and retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new ApiError(503, 'db down')} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('The server had a problem');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('Field', () => {
  it('links the label and error message to the control', () => {
    render(
      <Field label="Email" error="Enter a valid email address">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email address');
  });
});
