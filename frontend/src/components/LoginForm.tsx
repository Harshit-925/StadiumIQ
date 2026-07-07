import { useState } from 'react';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { loginSchema } from '../utils/validation';
import type { ZodError } from 'zod';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    clearError();

    try {
      const validated = loginSchema.parse({ email, password });
      await login(validated.email, validated.password);
      toast.success('Welcome back to StadiumIQ!');
    } catch (err) {
      if ((err as ZodError).issues) {
        const zodErr = err as ZodError;
        const errors: Record<string, string> = {};
        zodErr.issues.forEach((issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') {
            errors[field] = issue.message;
          }
        });
        setFieldErrors(errors);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-input border border-crowd-critical/30 bg-crowd-critical/10 px-4 py-3 text-label-md text-crowd-critical"
        >
          {error}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-label-md font-medium text-text-primary"
        >
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-required="true"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          autoComplete="email"
          className="w-full rounded-input border border-gray-200 bg-white px-4 py-2.5 text-body-md text-text-primary placeholder-text-secondary transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
          placeholder="operator@stadiumiq.com"
        />
        {fieldErrors.email && (
          <p
            id="login-email-error"
            className="mt-1 text-label-sm text-crowd-critical"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-label-md font-medium text-text-primary"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-required="true"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={
            fieldErrors.password ? 'login-password-error' : undefined
          }
          autoComplete="current-password"
          className="w-full rounded-input border border-gray-200 bg-white px-4 py-2.5 text-body-md text-text-primary placeholder-text-secondary transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <p
            id="login-password-error"
            className="mt-1 text-label-sm text-crowd-critical"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-input bg-pitch-blue px-6 py-3 text-body-md font-semibold text-white transition-colors hover:bg-pitch-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign In
          </>
        )}
      </button>
    </form>
  );
}
