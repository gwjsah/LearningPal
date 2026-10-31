import React from 'react';

/**
 * Custom SVG Notebook & Pencil Logo for LearningPal
 */
export function LearningPalLogo({ className = 'w-9 h-9' }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Back page shadow */}
      <rect
        x="8"
        y="6"
        width="28"
        height="34"
        rx="3.5"
        className="fill-highlighter-yellow/60 stroke-ink dark:stroke-chalkboard-chalk"
        strokeWidth="2"
        transform="rotate(4 22 23)"
      />
      {/* Main notebook page */}
      <rect
        x="6"
        y="4"
        width="28"
        height="34"
        rx="3.5"
        className="fill-paper-card dark:fill-chalkboard-card stroke-ink dark:stroke-chalkboard-chalk"
        strokeWidth="2.2"
      />
      {/* Red vertical margin line */}
      <line x1="13" y1="5.5" x2="13" y2="36.5" stroke="#D93829" strokeWidth="1.8" />
      {/* Ruled horizontal lines */}
      <line x1="7.5" y1="13" x2="32.5" y2="13" stroke="#93C5FD" strokeWidth="1.3" strokeOpacity="0.8" />
      <line x1="7.5" y1="20" x2="32.5" y2="20" stroke="#93C5FD" strokeWidth="1.3" strokeOpacity="0.8" />
      <line x1="7.5" y1="27" x2="32.5" y2="27" stroke="#93C5FD" strokeWidth="1.3" strokeOpacity="0.8" />
      {/* Spiral rings on left */}
      <circle cx="6.5" cy="11" r="1.5" className="fill-ink dark:fill-chalkboard-chalk" />
      <circle cx="6.5" cy="19" r="1.5" className="fill-ink dark:fill-chalkboard-chalk" />
      <circle cx="6.5" cy="27" r="1.5" className="fill-ink dark:fill-chalkboard-chalk" />
      {/* Rising mastery line in red pen */}
      <path
        d="M15.5 26.5 L20 20.5 L24 23 L30.5 12"
        stroke="#D93829"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pencil tip badge */}
      <g transform="translate(26, 22) rotate(-35)">
        <rect x="0" y="0" width="6" height="14" rx="1" fill="#FDE047" stroke="#1B2534" strokeWidth="1.6" />
        <polygon points="0,0 3,-5 6,0" fill="#FDBA74" stroke="#1B2534" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="2,-3.3 3,-5 4,-3.3" fill="#D93829" />
      </g>
    </svg>
  );
}

/**
 * Animated hand-drawn squiggly underline
 */
export function SquigglyUnderline({
  color = '#D93829',
  className = 'w-full h-3 mt-0.5',
}) {
  return (
    <svg
      viewBox="0 0 240 14"
      fill="none"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 9.5 C 32 3, 58 13, 88 6.5 C 118 2, 148 12.5, 178 6 C 202 2.5, 222 10, 237 5.5"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        className="animate-draw-stroke"
      />
    </svg>
  );
}

/**
 * Hand-drawn red-pen circle around key stats or words
 */
export function HandDrawnCircle({ className = ' inset-0 w-full h-full', color = '#D93829' }) {
  return (
    <svg
      viewBox="0 0 120 60"
      fill="none"
      preserveAspectRatio="none"
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M14 28 C 12 10, 48 4, 78 6 C 108 8, 116 24, 112 38 C 107 52, 68 57, 36 53 C 11 49, 6 35, 18 20"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="320"
        className="animate-draw-stroke"
      />
    </svg>
  );
}

/**
 * Hand-drawn curved arrow for margin annotations
 */
export function ScribbledArrow({ className = 'w-12 h-12', color = '#D93829', flip = false }) {
  return (
    <svg
      viewBox="0 0 68 48"
      fill="none"
      className={`pointer-events-none ${flip ? '-scale-x-100' : ''} ${className}`}
      aria-hidden="true"
    >
      <path
        d="M5 10 C 24 6, 44 14, 56 35"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M46 33 L57 37 L59 25"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hand-drawn star doodle
 */
export function StarDoodle({ className = 'w-5 h-5', color = '#D93829' }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={`pointer-events-none ${className}`} aria-hidden="true">
      <path
        d="M14 2.5 L16.9 9.8 L24.8 10.4 L18.7 15.4 L20.7 23.2 L14 18.8 L7.3 23.2 L9.3 15.4 L3.2 10.4 L11.1 9.8 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.16"
      />
    </svg>
  );
}

/**
 * Tactile Push Pin at the top center of a sticky note
 */
export function PushPin({ color = '#D93829' }) {
  return (
    <div className="pointer-events-none flex justify-center -mt-3.5 mb-1" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <ellipse cx="14" cy="21" rx="5" ry="2.2" fill="rgba(0,0,0,0.18)" />
        <path d="M13 13 L13 21" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="13" cy="9.5" r="6.5" fill={color} stroke="#1B2534" strokeWidth="1.6" />
        <circle cx="10.8" cy="7.5" r="2" fill="#FFF" fillOpacity="0.65" />
      </svg>
    </div>
  );
}

/**
 * Metallic Paper Clip on the top edge of a card
 */
export function PaperClip({ className = '' }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <svg width="24" height="44" viewBox="0 0 24 44" fill="none">
        <path
          d="M7 14 V 31 C 7 35.5 10.5 39 15 39 C 19.5 39 22 35.5 22 31 V 9 C 22 5.5 19.2 2.5 15.5 2.5 C 11.8 2.5 9 5.5 9 9 V 28 C 9 30.2 10.8 32 13 32 C 15.2 32 17 30.2 17 28 V 13"
          stroke="#475569"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Translucent Washi Tape strip at the top of a card
 */
export function WashiTape({ colorClass = 'bg-highlighter-yellow/75 dark:bg-yellow-500/40', rotate = '-rotate-2' }) {
  return (
    <div
      className={`pointer-events-none mx-auto -mt-4 mb-2 h-6 w-28 washi-tape border border-ink/10 dark:border-white/10 ${colorClass} ${rotate}`}
      aria-hidden="true"
    />
  );
}

/**
 * Notebook 3-hole punch strip along left or top edge
 */
export function BinderHoles({ vertical = true }) {
  return (
    <div
      className={`pointer-events-none flex ${
        vertical ? 'flex-col justify-around py-6 pl-2.5 pr-1' : 'flex-row justify-around px-8 py-2'
      }`}
      aria-hidden="true"
    >
      {[0, 1, 2].map((idx) => (
        <span
          key={idx}
          className="h-3.5 w-3.5 rounded-full bg-paper-warm dark:bg-chalkboard border border-ink/25 dark:border-white/20 shadow-inner"
        />
      ))}
    </div>
  );
}

