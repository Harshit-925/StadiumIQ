import { motion, useReducedMotion } from 'framer-motion';

/**
 * StadiumSchematic
 * Pure technical blueprint aesthetic, animated schematic of stadium flow.
 * Placed behind the hero text.
 */
export function StadiumSchematic() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  // Pulse animation for density dots
  const pulseAnim = shouldReduceMotion
    ? {}
    : {
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  // Flow line drawing animation
  const flowAnim = shouldReduceMotion
    ? { pathLength: 1, opacity: 0.5 }
    : {
        pathLength: [0, 1, 1, 0],
        opacity: [0, 0.5, 0.5, 0],
        transition: {
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        },
      };

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-pitch-blue"
      aria-hidden="true"
    >
      <svg
        className="absolute left-1/2 top-1/2 h-full w-full min-w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-70"
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#1A3D6B" strokeWidth="2" strokeOpacity="0.4" fill="none">
          {/* Pitch area */}
          <rect x="350" y="300" width="300" height="400" rx="40" />
          <circle cx="500" cy="500" r="40" />
          <line x1="350" y1="500" x2="650" y2="500" />
          
          {/* Seating tiers (concentric rounded rects) */}
          <rect x="250" y="200" width="500" height="600" rx="100" />
          <rect x="150" y="100" width="700" height="800" rx="150" />
          <rect x="50" y="0" width="900" height="1000" rx="200" />

          {/* Wedge dividers (zones) */}
          <line x1="250" y1="200" x2="50" y2="0" />
          <line x1="750" y1="200" x2="950" y2="0" />
          <line x1="250" y1="800" x2="50" y2="1000" />
          <line x1="750" y1="800" x2="950" y2="1000" />
          <line x1="500" y1="200" x2="500" y2="0" />
          <line x1="500" y1="800" x2="500" y2="1000" />
          <line x1="250" y1="500" x2="50" y2="500" />
          <line x1="750" y1="500" x2="950" y2="500" />
        </g>

        {/* Live density dots */}
        {/* Green dots (Safe) */}
        <motion.circle cx="300" cy="350" r="4" fill="#1E7A46" animate={pulseAnim} />
        <motion.circle cx="700" cy="700" r="4" fill="#1E7A46" animate={pulseAnim} transition={{ delay: 1 }} />
        <motion.circle cx="600" cy="250" r="4" fill="#1E7A46" animate={pulseAnim} transition={{ delay: 2 }} />

        {/* Gold dots (Moderate) */}
        <motion.circle cx="200" cy="650" r="5" fill="#D4A94A" animate={pulseAnim} transition={{ delay: 0.5 }} />
        <motion.circle cx="800" cy="350" r="5" fill="#D4A94A" animate={pulseAnim} transition={{ delay: 1.5 }} />

        {/* Amber dots (Warning) */}
        <motion.circle cx="450" cy="150" r="6" fill="#E07B30" animate={pulseAnim} transition={{ delay: 0.8 }} />
        <motion.circle cx="350" cy="850" r="6" fill="#E07B30" animate={pulseAnim} transition={{ delay: 2.5 }} />

        {/* Flow Lines to Exits */}
        <g stroke="#1A3D6B" strokeWidth="2" strokeDasharray="4 4" fill="none">
          {/* North Exit Flow */}
          <motion.path
            d="M450 150 Q 500 100 500 20"
            animate={flowAnim}
            stroke="#D4A94A"
          />
          <motion.path
            d="M600 250 Q 550 150 500 20"
            animate={flowAnim}
            transition={{ delay: 1.5 }}
            stroke="#1E7A46"
          />
          {/* South West Exit Flow */}
          <motion.path
            d="M350 850 Q 250 900 150 950"
            animate={flowAnim}
            transition={{ delay: 2 }}
            stroke="#E07B30"
          />
          <motion.path
            d="M200 650 Q 180 800 150 950"
            animate={flowAnim}
            transition={{ delay: 0.5 }}
            stroke="#D4A94A"
          />
          {/* East Exit Flow */}
          <motion.path
            d="M800 350 Q 880 400 920 500"
            animate={flowAnim}
            transition={{ delay: 1 }}
            stroke="#D4A94A"
          />
        </g>
      </svg>
      {/* Optional: subtle radial gradient overlay to fade edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-pitch-blue via-transparent to-pitch-blue/50" />
    </div>
  );
}

export default StadiumSchematic;
