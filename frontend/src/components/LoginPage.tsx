/**
 * LoginPage — Clean light-theme operator login.
 * Wraps the existing LoginForm with page-level layout and heading.
 * No auth token stored in localStorage manually — Supabase SDK manages session automatically.
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  // Redirect already-authenticated users to dashboard
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
        <h1 className="mb-2 text-heading-lg text-text-primary">Operator Login</h1>
        <p className="mb-8 text-body-sm text-text-secondary">
          Sign in to access the ground control dashboard.
        </p>

        <LoginForm />

        <p className="mt-6 text-center text-body-sm text-text-secondary">
          New to StadiumIQ?{' '}
          <Link
            to="/signup"
            className="font-semibold text-pitch-blue hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Fan link — optional, no login required */}
      <p className="mt-6 text-body-sm text-text-secondary">
        Looking for fan assistance?{' '}
        <Link
          to="/assistant"
          className="font-semibold text-stadium-green hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Fan Assistant — no login needed
        </Link>
      </p>

      <p className="mt-2 text-body-sm text-text-secondary">
        Want to try without saving?{' '}
        <Link
          to="/dashboard"
          className="font-semibold text-pitch-blue hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Continue as Guest
        </Link>
      </p>

      <Link
        to="/"
        className="mt-4 text-label-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}

export default LoginPage;
