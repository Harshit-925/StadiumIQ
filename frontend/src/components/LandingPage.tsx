/**
 * LandingPage — Public entry point for StadiumIQ.
 *
 * Section sequence:
 * 1. Nav: wordmark + "Fan Assistant" CTA (trophy gold) + "Operator Login"
 * 2. Hero: StadiumPulse ambient background + orchestrated Framer Motion entrance
 * 3. 3D Stadium bowl (lazy-loaded Three.js, aria-hidden, static SVG fallback)
 * 4. Feature cards (scroll-triggered reveal)
 * 5. Stats bar
 * 6. Footer
 */
// Removed lazy and Suspense imports as they are no longer used
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Shield,
  Globe,
  Accessibility,
  Leaf,
  ChevronRight,
  Activity,
} from 'lucide-react';
import StadiumSchematic from './StadiumSchematic';
// Removed lazy-loaded Three.js scene (was StadiumBowl3D)

const FEATURES = [
  {
    icon: Shield,
    title: 'Crowd Safety',
    description:
      'Real-time crowd density analysis with AI-powered evacuation planning across all stadium zones. Backed by G. Keith Still crowd science thresholds.',
  },
  {
    icon: Globe,
    title: 'Multilingual Assistant',
    description:
      'AI fan assistant supporting 6 languages — English, Spanish, French, German, Portuguese, and Japanese — for all 16 host venues.',
  },
  {
    icon: Accessibility,
    title: 'Accessibility First',
    description:
      'Full ADA compliance tracking with wheelchair seating ratio analysis against ADAAG 4.33.2 standards at every venue.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description:
      'Waste recycling rate and sustainability score tracking aligned with FIFA Green Goals and the EPA 90% diversion target.',
  },
] as const;

const STATS = [
  { value: '16', label: 'Host Venues' },
  { value: '3',  label: 'Countries' },
  { value: '6',  label: 'Languages' },
  { value: 'AI', label: 'Powered' },
] as const;

function FeatureCard({
  icon: Icon,
  title,
  description,
}: (typeof FEATURES)[number]) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion() ?? false;
  const headingId = `feature-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <motion.article
      ref={ref}
      aria-labelledby={headingId}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.15 } }}
      className="card-surface-hover flex flex-col gap-4 p-6"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pitch-blue/8">
        <Icon className="h-5 w-5 text-pitch-blue" aria-hidden="true" />
      </div>
      <div>
        <h3 id={headingId} className="mb-2 text-heading-sm text-text-primary">{title}</h3>
        <p className="text-body-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </motion.article>
  );
}

export function LandingPage() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  // Orchestrated hero entrance: pulse → headline → subheadline → CTA
  const heroContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.2,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const heroItem = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen relative bg-base-bg">
      <div id="features" className="absolute top-[800px]" aria-hidden="true" />

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <header className="relative z-30 sticky top-0 border-b border-white/10 bg-pitch-blue/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="StadiumIQ Home">
            <Activity className="h-6 w-6 text-white" aria-hidden="true" />
            <span className="text-heading-sm font-display text-white">
              Stadium<span className="text-trophy-gold">IQ</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4" aria-label="Main navigation">
            <a href="#features" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">
              Features
            </a>
            <Link
              to="/assistant"
              className="btn-gold text-sm"
              aria-label="Open Fan Assistant — no login required"
            >
              Fan Assistant
            </Link>
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-1 rounded-input border border-white/20 px-4 py-2 text-body-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Go to Dashboard
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              to="/dashboard"
              className="sm:hidden flex items-center justify-center h-9 w-9 rounded-full border border-white/20 text-white/80 transition-colors hover:bg-white/10"
              aria-label="Go to Dashboard"
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative z-10 overflow-hidden bg-pitch-blue px-4 pb-20 pt-16 sm:px-6 sm:pt-24"
        aria-label="StadiumIQ hero"
      >
        <StadiumSchematic />
        <div className="relative mx-auto max-w-5xl z-10">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Event badge */}
            <motion.div variants={heroItem} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-pill border border-trophy-gold/30 bg-trophy-gold/8 px-4 py-1.5 text-label-md text-trophy-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-trophy-gold" aria-hidden="true" />
                FIFA World Cup 2026™ · 16 Venues
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={heroItem}
              className="mb-6 font-display text-display-xl text-white drop-shadow-sm"
            >
              Every crowd number, cited.
              <br />
              <span className="text-trophy-gold">Every gate, covered.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={heroItem}
              className="mx-auto mb-10 max-w-2xl text-body-lg text-white/80"
            >
              Real-time crowd density, evacuation modeling, accessibility compliance, and
              sustainability tracking for all 16 host venues — every figure backed by a
              published safety standard, not a guess.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={heroItem}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Link to="/assistant" className="btn-gold shadow-lg shadow-black/20 text-base px-6 py-3">
                Ask the Fan Assistant
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-6 py-3 text-body-md text-white/80 transition-colors hover:text-white"
              >
                Open Operator Dashboard
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>


        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-20 sm:px-6" aria-labelledby="features-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2
              id="features-heading"
              className="mb-4 font-display text-display-md text-pitch-blue"
            >
              Built for World Cup scale
            </h2>
            <p className="mx-auto max-w-xl text-body-lg text-text-secondary">
              Every number shown is backed by a cited formula. Crowd science
              thresholds, FIFA evacuation standards, ADA compliance ratios.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-gray-200 bg-surface px-4 py-12 sm:px-6" aria-label="Platform statistics">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8 sm:gap-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-data text-data-xl text-trophy-gold">{stat.value}</p>
              <p className="mt-1 text-label-md text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-pitch-blue px-4 py-10 sm:px-6" role="contentinfo">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center sm:items-start gap-3">
              <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="StadiumIQ Home">
                <Activity className="h-5 w-5 text-white/70" aria-hidden="true" />
                <span className="text-body-sm font-semibold text-white">
                  Stadium<span className="text-trophy-gold">IQ</span>
                </span>
              </Link>
              <p className="text-center sm:text-left text-label-sm text-white/70">
                Built for Challenge 4: Smart Stadiums & Tournament Operations
              </p>
            </div>
            
            <div className="flex flex-col items-center sm:items-end gap-3">
              <nav aria-label="Footer navigation" className="flex items-center gap-6">
                <Link to="/dashboard" className="text-label-sm text-white/50 hover:text-white transition-colors">
                  Go to Dashboard
                </Link>
                <a 
                  href="https://github.com/Harshit-925/StadiumIQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-label-sm text-white/50 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </a>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
