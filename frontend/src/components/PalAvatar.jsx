import React from 'react';
import { PAL_COLORS } from '../utils/palEngine';

function getColorMeta(colorId) {
  return PAL_COLORS.find((c) => c.id === colorId) || PAL_COLORS[0];
}

function Face({ mood, ink, red, cx, cy }) {
  if (mood === 'foggy') {
    return (
      <g>
        <path d={`M${cx - 14} ${cy - 7} Q${cx - 10} ${cy - 10} ${cx - 6} ${cy - 7}`} stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d={`M${cx + 6} ${cy - 7} Q${cx + 10} ${cy - 10} ${cx + 14} ${cy - 7}`} stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx={cx - 10} cy={cy - 1} r="3.2" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx={cx + 10} cy={cy - 1} r="3.2" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx={cx - 10} cy={cy - 1} r="1" fill={ink} />
        <circle cx={cx + 10} cy={cy - 1} r="1" fill={ink} />
        <path d={`M${cx - 6} ${cy + 9} Q${cx - 3} ${cy + 6} ${cx} ${cy + 9} Q${cx + 3} ${cy + 12} ${cx + 6} ${cy + 9}`} stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (mood === 'focused') {
    return (
      <g>
        <circle cx={cx - 10} cy={cy - 1} r="7.5" fill="rgba(255,253,249,0.55)" stroke={ink} strokeWidth="2" />
        <circle cx={cx + 10} cy={cy - 1} r="7.5" fill="rgba(255,253,249,0.55)" stroke={ink} strokeWidth="2" />
        <line x1={cx - 2.5} y1={cy - 1} x2={cx + 2.5} y2={cy - 1} stroke={ink} strokeWidth="2" />
        <circle cx={cx - 9.5} cy={cy - 1} r="2.2" fill={ink} />
        <circle cx={cx + 10.5} cy={cy - 1} r="2.2" fill={ink} />
        <path d={`M${cx - 4} ${cy + 10} Q${cx} ${cy + 12.5} ${cx + 4} ${cy + 10}`} stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (mood === 'thriving') {
    return (
      <g>
        <path d={`M${cx - 14} ${cy} Q${cx - 10} ${cy - 6} ${cx - 6} ${cy}`} stroke={ink} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d={`M${cx + 6} ${cy} Q${cx + 10} ${cy - 6} ${cx + 14} ${cy}`} stroke={ink} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <ellipse cx={cx - 16} cy={cy + 5} rx="3.5" ry="2" fill={red} opacity="0.35" />
        <ellipse cx={cx + 16} cy={cy + 5} rx="3.5" ry="2" fill={red} opacity="0.35" />
        <path d={`M${cx - 7} ${cy + 6} Q${cx} ${cy + 14} ${cx + 7} ${cy + 6}`} stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (mood === 'waiting') {
    return (
      <g>
        <path d={`M${cx - 14} ${cy} Q${cx - 10} ${cy + 4} ${cx - 6} ${cy}`} stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d={`M${cx + 6} ${cy} Q${cx + 10} ${cy + 4} ${cx + 14} ${cy}`} stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d={`M${cx - 3} ${cy + 8} Q${cx} ${cy + 10} ${cx + 3} ${cy + 8}`} stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx - 10} cy={cy - 1} r="3.2" fill={ink} />
      <circle cx={cx + 10} cy={cy - 1} r="3.2" fill={ink} />
      <circle cx={cx - 11} cy={cy - 2.2} r="1.1" fill="#FFFDF9" />
      <circle cx={cx + 9} cy={cy - 2.2} r="1.1" fill="#FFFDF9" />
      <path d={`M${cx - 4} ${cy + 8} Q${cx} ${cy + 12} ${cx + 4} ${cy + 8}`} stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none" />
    </g>
  );
}

function MoodProps({ mood, ink, red }) {
  if (mood === 'foggy') {
    return (
      <g>
        <text x="86" y="30" fill={red} fontSize="18" fontWeight="800" fontFamily="monospace">?</text>
        <text x="16" y="34" fill={red} fontSize="13" fontWeight="800" fontFamily="monospace" opacity="0.8">?</text>
        <path d="M36 17 Q46 11 56 17 Q66 11 76 17" stroke={red} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75" />
      </g>
    );
  }
  if (mood === 'thriving') {
    return (
      <g>
        <path
          d="M92 16 L94.2 21.5 L100 22 L95.6 25.8 L97 31.5 L92 28.4 L87 31.5 L88.4 25.8 L84 22 L89.8 21.5 Z"
          fill={red}
          fillOpacity="0.22"
          stroke={red}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M18 22 L20 26 L24 28 L20 30 L18 34 L16 30 L12 28 L16 26 Z" fill={red} opacity="0.8" />
      </g>
    );
  }
  if (mood === 'waiting') {
    return (
      <g>
        <g transform="translate(80, 74)">
          <rect x="0" y="6" width="16" height="14" rx="3" fill="#FFFDF9" stroke={ink} strokeWidth="2" />
          <path d="M16 9 C21 9, 21 17, 16 17" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M5 3 Q7 0 5 -3" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M11 3 Q13 0 11 -3" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </g>
        <text x="84" y="30" fill={ink} fontSize="12" fontWeight="700" fontFamily="monospace" opacity="0.65">zZ</text>
      </g>
    );
  }
  if (mood === 'fresh') {
    return (
      <g transform="translate(88, 66) rotate(28)">
        <rect x="0" y="0" width="7" height="22" rx="1.2" fill="#FDE047" stroke={ink} strokeWidth="1.8" />
        <polygon points="0,0 3.5,-6 7,0" fill="#FDBA74" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points="2.2,-4 3.5,-6 4.8,-4" fill={red} />
      </g>
    );
  }
  if (mood === 'focused') {
    return (
      <path d="M88 22 L95 18 M91 28 L99 28 M88 34 L95 38" stroke={red} strokeWidth="2" strokeLinecap="round" />
    );
  }
  return null;
}

function BehindAccessory({ accessory, style, ink, red }) {
  if (accessory === 'cape') {
    return (
      <path
        d="M30 62 C16 70, 14 86, 24 91 L56 86 L88 91 C98 86, 96 70, 82 62 Z"
        fill={red}
        fillOpacity="0.92"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    );
  }
  if (accessory === 'pencil') {
    const px = style === 'sticky' ? 81 : 78;
    const py = style === 'sticky' ? 29 : 31;
    return (
      <g transform={`translate(${px}, ${py}) rotate(-34)`}>
        <rect x="0" y="0" width="6.5" height="5" rx="1.2" fill="#F9A8D4" stroke={ink} strokeWidth="1.6" />
        <rect x="0" y="4.5" width="6.5" height="19" rx="1" fill="#FDE047" stroke={ink} strokeWidth="1.8" />
        <polygon points="0,23.5 3.25,30 6.5,23.5" fill="#FDBA74" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points="2,27.6 3.25,30 4.5,27.6" fill={red} />
      </g>
    );
  }
  return null;
}

function FrontAccessory({ accessory, style, ink, red }) {
  const topY = style === 'sticky' ? 23 : 25;
  if (accessory === 'scarf') {
    return (
      <g>
        <path
          d="M31 73 Q56 82 81 73 C82 78, 79 81, 75 82 Q56 88 37 82 C33 81, 30 78, 31 73 Z"
          fill={red}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M62 79 L69 78 L72 92 L63 93 Z" fill={red} stroke={ink} strokeWidth="1.9" strokeLinejoin="round" />
        <line x1="65" y1="84" x2="70.5" y2="83.5" stroke="#FDE047" strokeWidth="2" />
      </g>
    );
  }
  if (accessory === 'cape') {
    return (
      <g>
        <path d="M38 72 Q56 79 74 72" stroke={red} strokeWidth="3" strokeLinecap="round" />
        <circle cx="56" cy="76" r="4" fill="#FDE047" stroke={ink} strokeWidth="1.8" />
      </g>
    );
  }
  if (accessory === 'crown') {
    return (
      <g transform={`translate(38, ${topY - 16})`}>
        <path
          d="M3 16 L0 4 L10 10 L18 1 L26 10 L36 4 L33 16 Z"
          fill="#FDE047"
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="11" r="2.2" fill={red} />
      </g>
    );
  }
  if (accessory === 'gradcap') {
    return (
      <g transform={`translate(27, ${topY - 17})`}>
        <polygon points="29,2 56,11 29,20 2,11" fill={ink} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 15 L14 22 C14 25, 44 25, 44 22 L44 15" fill={ink} stroke={ink} strokeWidth="1.6" />
        <path d="M52 12 L52 24" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="52" cy="25" r="2.4" fill={red} stroke={ink} strokeWidth="1.2" />
      </g>
    );
  }
  return null;
}

/**
 * Hand-drawn notebook-doodle mascot SVG that adapts to style, highlighter color, mastery mood, and equipped accessory.
 */
export default function PalAvatar({
  style = 'sticky',
  color = 'yellow',
  mood = 'fresh',
  accessory = 'none',
  size = 84,
  animate = true,
  className = '',
  label = 'Your study pal',
}) {
  const col = getColorMeta(color);
  // Keep Pal's ink, cream, and red-pen palette consistent across Light and Dark modes
  const ink = '#1B2534';
  const red = '#D93829';
  const paper = '#FFFDF9';
  const dash = mood === 'fresh' ? '5 3' : undefined;
  const animClass = animate ? (mood === 'foggy' ? 'pal-wiggle' : 'pal-float') : '';

  return (
    <svg
      viewBox="0 0 112 112"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={label}
      className={`shrink-0 ${animClass} ${className}`}
    >
      <ellipse cx="56" cy="100" rx="26" ry="5" fill={ink} opacity="0.14" />
      <BehindAccessory accessory={accessory} style={style} ink={ink} red={red} />

      {style === 'owl' && (
        <g>
          <path
            d="M32 34 L27 20 L42 27 C47 25, 65 25, 70 27 L85 20 L80 34 C86 43, 88 57, 84 72 C80 84, 70 90, 56 90 C42 90, 32 84, 28 72 C24 57, 26 43, 32 34 Z"
            fill={col.fill}
            fillOpacity="0.72"
            stroke={ink}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeDasharray={dash}
          />
          <ellipse cx="56" cy="74" rx="18" ry="12" fill={paper} fillOpacity="0.78" stroke={ink} strokeWidth="1.8" />
          <path d="M48 73 Q51 76 54 73 M58 73 Q61 76 64 73 M53 79 Q56 82 59 79" stroke={ink} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
          <path d="M27 52 C19 56, 18 69, 27 72" fill={col.fill} fillOpacity="0.9" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M85 52 C93 56, 94 69, 85 72" fill={col.fill} fillOpacity="0.9" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
          <polygon points="56,57 52,51 60,51" fill={red} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M46 90 L44 95 M49 90 L49 95 M63 90 L63 95 M66 90 L68 95" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
          <Face mood={mood} ink={ink} red={red} cx={56} cy={46} />
        </g>
      )}

      {style === 'cat' && (
        <g>
          <path d="M82 78 C96 78, 98 62, 89 58" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path
            d="M31 40 L27 21 L44 30 C49 28, 63 28, 68 30 L85 21 L81 40 C87 49, 88 64, 83 78 C79 87, 70 90, 56 90 C42 90, 33 87, 29 78 C24 64, 25 49, 31 40 Z"
            fill={col.fill}
            fillOpacity="0.72"
            stroke={ink}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeDasharray={dash}
          />
          <polygon points="32,35 31,26 39,31" fill={red} fillOpacity="0.35" />
          <polygon points="80,35 81,26 73,31" fill={red} fillOpacity="0.35" />
          <path d="M22 55 L32 56 M21 61 L32 60 M90 55 L80 56 M91 61 L80 60" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="44" cy="88" rx="6" ry="3.5" fill={paper} stroke={ink} strokeWidth="2" />
          <ellipse cx="68" cy="88" rx="6" ry="3.5" fill={paper} stroke={ink} strokeWidth="2" />
          <Face mood={mood} ink={ink} red={red} cx={56} cy={54} />
        </g>
      )}

      {style === 'shiba' && (
        <g>
          <path
            d="M81 78 C95 79, 99 64, 91 57 C85 52, 79 59, 85 65 C88 68, 91 65, 89 62"
            fill={col.fill}
            fillOpacity="0.85"
            stroke={ink}
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M31 41 L24 22 C24 20, 27 19, 29 21 L44 30 C49 28, 63 28, 68 30 L83 21 C85 19, 88 20, 88 22 L81 41 C87 48, 90 58, 86 67 C85 73, 84 78, 81 82 C77 88, 68 90, 56 90 C44 90, 35 88, 31 82 C28 78, 27 73, 26 67 C22 58, 25 48, 31 41 Z"
            fill={col.fill}
            fillOpacity="0.78"
            stroke={ink}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeDasharray={dash}
          />
          <polygon points="32,36 28,26 40,32" fill={paper} fillOpacity="0.85" />
          <polygon points="80,36 84,26 72,32" fill={paper} fillOpacity="0.85" />
          <path
            d="M29 61 C31 53, 41 53, 48 56 C52 52, 60 52, 64 56 C71 53, 81 53, 83 61 C85 68, 80 76, 73 79 L71 86 C66 89, 46 89, 41 86 L39 79 C32 76, 27 68, 29 61 Z"
            fill={paper}
            fillOpacity="0.9"
          />
          <ellipse cx="45" cy="40" rx="3" ry="1.8" fill={paper} fillOpacity="0.92" />
          <ellipse cx="67" cy="40" rx="3" ry="1.8" fill={paper} fillOpacity="0.92" />
          <path d="M36 74 Q56 81 76 74 L56 86 Z" fill={red} fillOpacity="0.9" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
          <ellipse cx="56" cy="54.5" rx="3.2" ry="2.1" fill={ink} />
          <ellipse cx="43" cy="89" rx="6.5" ry="3.5" fill={paper} stroke={ink} strokeWidth="2" />
          <ellipse cx="69" cy="89" rx="6.5" ry="3.5" fill={paper} stroke={ink} strokeWidth="2" />
          <Face mood={mood} ink={ink} red={red} cx={56} cy={51} />
        </g>
      )}

      {style !== 'owl' && style !== 'cat' && style !== 'shiba' && (
        <g>
          <path d="M56 26 C56 17, 65 13, 68 18 C65 22, 59 23, 56 26 Z" fill={red} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path
            d="M26 30 C26 26, 29 24, 33 24 L79 24 C83 24, 86 26, 86 30 L86 73 L71 88 L33 88 C29 88, 26 85, 26 81 Z"
            fill={col.fill}
            fillOpacity="0.72"
            stroke={ink}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeDasharray={dash}
          />
          <path d="M71 88 L71 76 C71 74, 73 73, 75 73 L86 73 Z" fill={paper} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
          <line x1="33" y1="74" x2="64" y2="74" stroke={ink} strokeOpacity="0.15" strokeWidth="1.4" />
          <line x1="33" y1="81" x2="60" y2="81" stroke={ink} strokeOpacity="0.15" strokeWidth="1.4" />
          <path d="M26 58 Q17 55 16 63" stroke={ink} strokeWidth="2.3" strokeLinecap="round" />
          <path d="M86 58 Q95 54 96 62" stroke={ink} strokeWidth="2.3" strokeLinecap="round" />
          <Face mood={mood} ink={ink} red={red} cx={56} cy={53} />
        </g>
      )}

      <FrontAccessory accessory={accessory} style={style} ink={ink} red={red} />
      <MoodProps mood={mood} ink={ink} red={red} />
    </svg>
  );
}
