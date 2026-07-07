import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { signupSchema } from '../utils/validation';
import type { ZodError } from 'zod';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { signup, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    clearError();

    try {
      const validated = signupSchema.parse({ email, password, name });
      await signup(validated.email, validated.password, validated.name);
      toast.success('Account created! Welcome to StadiumIQ.');
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
        toast.error('Sign up failed. Please try again.');
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
          htmlFor="signup-name"
          className="mb-1.5 block text-label-md font-medium text-black"
        >
          Full Name
        </label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-required="true"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? 'signup-name-error' : undefined}
          autoComplete="name"
          className="w-full rounded-input border border-gray-300 bg-white px-4 py-2.5 text-body-md text-black placeholder-gray-500 transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
          placeholder="John Smith"
        />
        {fieldErrors.name && (
          <p
            id="signup-name-error"
            className="mt-1 text-label-sm text-crowd-critical"
            role="alert"
          >
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="signup-email"
          className="mb-1.5 block text-label-md font-medium text-black"
        >
          Email Address
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-required="true"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
          autoComplete="email"
          className="w-full rounded-input border border-gray-300 bg-white px-4 py-2.5 text-body-md text-black placeholder-gray-500 transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
          placeholder="operator@stadiumiq.com"
        />
        {fieldErrors.email && (
          <p
            id="signup-email-error"
            className="mt-1 text-label-sm text-crowd-critical"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor="signup-password"
          className="mb-1.5 block text-label-md font-medium text-black"
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-required="true"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={
            fieldErrors.password ? 'signup-password-error' : undefined
          }
          autoComplete="new-password"
          className="w-full rounded-input border border-gray-300 bg-white px-4 py-2.5 text-body-md text-black placeholder-gray-500 transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
          placeholder="Minimum 8 characters"
        />
        {fieldErrors.password && (
          <p
            id="signup-password-error"
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
            Creating account…
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Create Account
          </>
        )}
      </button>
    </form>
  );
}
