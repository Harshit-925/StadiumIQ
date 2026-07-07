/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Core brand palette ─────────────────────────────────────────────
        'pitch-blue':       '#0B2545',
        'pitch-blue-light': '#1A3D6B',
        'stadium-green':    '#1E7A46',
        'trophy-gold':      '#D4A94A',

        // ── Safety tier colors (operator dashboard only) ───────────────────
        'crowd-safe':     '#1E9E63',
        'crowd-moderate': '#E0A430',
        'crowd-warning':  '#E07B30',
        'crowd-critical': '#D64545',

        // ── Light theme surfaces ───────────────────────────────────────────
        'base-bg':  '#F7F9FC',
        'surface':  '#FFFFFF',

        // ── Semantic text ──────────────────────────────────────────────────
        'text-primary':   '#0B1826',
        'text-secondary': '#5A6B7D',

        // ── Legacy aliases kept for backward compat with existing tests ────
        // (ResultsPanel, FanAssistant etc. reference these)
        'stadium-blue':  '#0B2545',
        'fifa-gold':     '#D4A94A',
        'dark-bg':       '#0B1826',
      },

      fontFamily: {
        // Display: heavy Inter for hero/section headings (weight 800)
        display: ['Inter', 'system-ui', 'sans-serif'],
        // Body: readable Inter for all UI copy
        body:    ['Inter', 'system-ui', 'sans-serif'],
        // Data: tabular mono for numeric readouts in operator screens
        data:    ['JetBrains Mono', 'Menlo', 'monospace'],
        // Legacy aliases
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'monospace'],
      },

      fontSize: {
        // Display scale — Inter weight 800
        'display-2xl': ['4.5rem',  { lineHeight: '1.1',  letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1',  letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.015em', fontWeight: '800' }],
        // Heading scale — Inter weight 600
        'heading-xl':  ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg':  ['1.5rem',   { lineHeight: '1.35', fontWeight: '600' }],
        'heading-md':  ['1.25rem',  { lineHeight: '1.4',  fontWeight: '600' }],
        'heading-sm':  ['1.125rem', { lineHeight: '1.5',  fontWeight: '600' }],
        // Body scale — Inter weight 400
        'body-lg':     ['1.125rem', { lineHeight: '1.75', fontWeight: '400' }],
        'body-md':     ['1rem',     { lineHeight: '1.625', fontWeight: '400' }],
        'body-sm':     ['0.875rem', { lineHeight: '1.5',  fontWeight: '400' }],
        // Label scale — Inter weight 600
        'label-lg':    ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-md':    ['0.75rem',  { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-sm':    ['0.6875rem',{ lineHeight: '1.25', letterSpacing: '0.02em', fontWeight: '600' }],
        // Data scale — JetBrains Mono (used for all numeric values)
        'data-2xl':    ['3rem',    { lineHeight: '1',    fontWeight: '600' }],
        'data-xl':     ['2.25rem', { lineHeight: '1',    fontWeight: '600' }],
        'data-lg':     ['1.5rem',  { lineHeight: '1.2',  fontWeight: '400' }],
        'data-md':     ['1.125rem',{ lineHeight: '1.2',  fontWeight: '400' }],
        'data-sm':     ['0.875rem',{ lineHeight: '1.2',  fontWeight: '400' }],
      },

      borderRadius: {
        card:  '12px',
        input: '8px',
        pill:  '9999px',
        // Keep the default TW values available too
        DEFAULT: '6px',
        sm:    '4px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '24px',
      },

      spacing: {
        'sidebar': '260px',
        'tab-bar': '64px',
        'top-bar': '60px',
      },

      boxShadow: {
        // Card elevation — light, cool-tinted
        card:    '0 1px 3px rgba(11,25,69,0.08), 0 4px 16px rgba(11,25,69,0.04)',
        'card-hover': '0 4px 12px rgba(11,25,69,0.12), 0 8px 32px rgba(11,25,69,0.08)',
        // Input focus
        input:   '0 0 0 3px rgba(11,37,69,0.15)',
        // Fan assistant panel
        panel:   '0 8px 32px rgba(11,25,69,0.16), 0 2px 8px rgba(11,25,69,0.08)',
      },

      transitionDuration: {
        '50':  '50ms',
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
      },

      zIndex: {
        'top-bar':   '30',
        'sidebar':   '20',
        'overlay':   '40',
        'modal':     '50',
        'toast':     '60',
      },
    },
  },
  plugins: [],
};