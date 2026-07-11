/**
 * SignupPage — Clean light-theme operator account creation.
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { SignupForm } from './SignupForm';
import { useAuthStore } from '../store/useAuthStore';

export function SignupPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-bg px-4 py-12">
      {/* Logo */}
      <Link to="/" className="mb-8 flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="StadiumIQ Home">
        <Activity className="h-8 w-8 text-pitch-blue" aria-hidden="true" />
        <span className="font-display text-display-md text-pitch-blue">
          Stadium<span className="text-trophy-gold">IQ</span>
        </span>
      </Link>

      {/* Card */}
      <div className="card-surface w-full max-w-sm p-8">
        <h1 className="mb-2 text-heading-lg text-text-primary">Create Account</h1>
        <p className="mb-8 text-body-sm text-text-secondary">
          Join StadiumIQ to access operator tools for FIFA World Cup 2026™.
        </p>

        <SignupForm />

        <p className="mt-6 text-center text-body-sm text-text-secondary">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-pitch-blue hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-body-sm text-text-secondary">
        Looking for fan assistance?{' '}
        <Link
          to="/assistant"
          className="font-semibold text-stadium-green hover:underline"
        >
          Fan Assistant — no login needed
        </Link>
      </p>

      <Link to="/" className="mt-4 text-label-sm text-text-secondary hover:text-text-primary transition-colors">
        ← Back to home
      </Link>
    </div>
  );
}

export default SignupPage;
