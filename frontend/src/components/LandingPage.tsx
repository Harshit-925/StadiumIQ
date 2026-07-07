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
import { StadiumPulse } from './StadiumPulse';

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

  // Pulse fades in first (delay 0 via CSS transition, before stagger)
  const pulseVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.8, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-base-bg">
      {/* ── Navigation ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-pitch-blue" aria-hidden="true" />
            <span className="text-heading-sm font-display text-pitch-blue">
              Stadium<span className="text-trophy-gold">IQ</span>
            </span>
          </div>

          <nav className="flex items-center gap-3" aria-label="Main navigation">
            <Link
              to="/assistant"
              className="btn-gold text-sm"
              aria-label="Open Fan Assistant — no login required"
            >
              Fan Assistant
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1 rounded-input border border-gray-200 px-4 py-2 text-body-sm text-text-secondary transition-colors hover:border-gray-300 hover:text-text-primary"
            >
              Operator Login
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24"
        aria-label="StadiumIQ hero"
      >
        {/* Ambient pulse visualization — fades in first */}
        <motion.div
          variants={pulseVariant}
          initial="hidden"
          animate="visible"
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <StadiumPulse
            variant="animated"
            className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-60"
          />
        </motion.div>

        <div className="relative mx-auto max-w-5xl">
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
                FIFA World Cup 2026™
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={heroItem}
              className="mb-6 font-display text-display-xl text-pitch-blue"
            >
              Operations Intelligence
              <br />
              <span className="text-trophy-gold">for the World's Stage</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={heroItem}
              className="mx-auto mb-10 max-w-2xl text-body-lg text-text-secondary"
            >
              Monitor crowd safety across 16 venues in real time. AI-powered
              evacuation planning, multilingual fan support, accessibility
              compliance, and sustainability tracking — in one platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={heroItem}
              className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Link to="/assistant" className="btn-gold text-base px-6 py-3">
                Try Fan Assistant — Free
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-input px-6 py-3 text-body-md text-pitch-blue transition-colors hover:bg-pitch-blue/5"
              >
                Operator Login
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>


        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6" aria-labelledby="features-heading">
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
      <section className="border-y border-gray-200 bg-surface px-4 py-12 sm:px-6" aria-label="Platform statistics">
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
      <footer className="bg-pitch-blue px-4 py-10 sm:px-6" role="contentinfo">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              <span className="text-body-sm font-semibold text-text-primary">
                Stadium<span className="text-trophy-gold">IQ</span>
              </span>
            </div>
            <p className="text-center text-label-sm text-text-secondary/70">
              FIFA World Cup 2026™ Operations Platform · 16 Venues · 3 Countries
            </p>
            <nav aria-label="Footer navigation">
              <Link to="/login" className="text-label-sm text-text-primary/50 hover:text-text-primary transition-colors">
                Operator Login
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
