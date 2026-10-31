import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ============================================================================
// 01. GLOBAL CONFIGURATION & STORY TIMELINE (41.56s / 2494 FRAMES @ 60 FPS)
// ============================================================================

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2494; // 41.566 seconds

const SCENES = [
  {
    id: 1,
    theme: 'dark',
    start: 0.0,
    end: 8.0,
    speechStart: 0.10,
    speechEnd: 7.90,
    caption:
      'Kya aapko pata hai ki yeh universe bilkul ek video game ki tarah kaam karta hai—jab tak aap kisi cheez ko nahi dekhte, woh exist hi nahi karti!',
    heroBeats: [
      {
        at: 0.0,
        tag: 'SIMULATION HYPOTHESIS // 01',
        line1: 'UNIVERSE IS A',
        line2: 'VIDEO GAME 🎮',
        accent: '#00e5ff',
      },
      {
        at: 3.8,
        tag: 'OBSERVER RENDERING RULE',
        line1: 'NOT SEEN =',
        line2: 'DOES NOT EXIST!',
        accent: '#ff9f43',
      },
    ],
  },
  {
    id: 2,
    theme: 'paper',
    start: 8.0,
    end: 22.5,
    speechStart: 8.10,
    speechEnd: 22.40,
    caption:
      'Science mein ise Double-Slit Experiment kehte hain. Isme jab electrons ya light particles ko chhoda jata hai, toh jab tak koi observer ya camera unhein nahi dekhta, woh waves ki tarah phail jaate hain. Par jaise hi aap unhein observe karne ki koshish karte hain, woh achanak solid particles ban jate hain!',
    heroBeats: [
      {
        at: 8.0,
        tag: 'QUANTUM PHYSICS // FIG 02',
        line1: 'DOUBLE-SLIT',
        line2: 'EXPERIMENT 🔬',
        accent: '#d93829',
      },
      {
        at: 11.5,
        tag: 'UNOBSERVED STATE',
        line1: 'SPREADS LIKE',
        line2: 'WAVES 🌊',
        accent: '#008b9b',
      },
      {
        at: 17.8,
        tag: 'WAVEFUNCTION COLLAPSE',
        line1: 'BECOMES SOLID',
        line2: 'PARTICLES! ⚡',
        accent: '#d93829',
      },
    ],
  },
  {
    id: 3,
    theme: 'dark',
    start: 22.5,
    end: 30.0,
    speechStart: 22.60,
    speechEnd: 29.90,
    caption:
      'Matlab yeh universe sirf tabhi render hota hai jab aap ise dekhte hain? Iska mind-bending quantum raaz batayenge Part 2 mein!',
    heroBeats: [
      {
        at: 22.5,
        tag: 'REALITY ENGINE LOGIC',
        line1: 'RENDERED ONLY',
        line2: 'WHEN SEEN 👀',
        accent: '#00ff9d',
      },
      {
        at: 26.5,
        tag: 'CLASSIFIED QUANTUM FILE',
        line1: 'SECRET IN',
        line2: 'PART 2 🔓',
        accent: '#ffd166',
      },
    ],
  },
  {
    id: 4,
    theme: 'paper',
    start: 30.0,
    end: 41.56,
    speechStart: 30.10,
    speechEnd: 41.45,
    caption:
      'Waise, aapka kaun sa dost aisi hi parallel reality mein jeeta hai jise real duniya ki koi khabar hi nahi hoti? Comment mein uska naam zaroor batana!',
    heroBeats: [
      {
        at: 30.0,
        tag: 'PARALLEL REALITY // FIG 04',
        line1: 'WHO IS YOUR',
        line2: 'LOST FRIEND?',
        accent: '#d93829',
      },
      {
        at: 36.2,
        tag: 'ZERO GROUND CONNECTION',
        line1: 'NO CLUE ABOUT',
        line2: 'REAL DUNIYA 🌌',
        accent: '#008b9b',
      },
      {
        at: 39.0,
        tag: 'EXPOSE THEM NOW',
        line1: 'DROP NAME IN',
        line2: 'COMMENTS 👇',
        accent: '#d93829',
      },
    ],
  },
] as const;

type Scene = (typeof SCENES)[number];
type Theme = Scene['theme'];
type HeroBeat = Scene['heroBeats'][number];

// ============================================================================
// 02. MATHEMATICAL & ANIMATION UTILITIES
// ============================================================================

const clamp = (val: number, min = 0, max = 1) => Math.min(max, Math.max(min, val));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const interp = (val: number, inp: number[], out: number[]) =>
  interpolate(val, inp, out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * r,
    y: cy + Math.sin(rad) * r,
  };
};

const fastSpring = (frame: number, delayFrames = 0, damping = 13, stiffness = 160) =>
  spring({
    frame: Math.max(0, frame - delayFrames),
    fps: FPS,
    config: { damping, stiffness, mass: 0.7 },
  });

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.5) % WIDTH,
  y: (i * 89.3) % 1350,
  r: 0.8 + (i % 4) * 0.45,
  phase: i * 0.9,
}));

// ============================================================================
// 03. SHARED SVG FILTERS & GRADIENTS
// ============================================================================

const GlobalSvgDefs: React.FC = () => (
  <defs>
    <linearGradient id="twilightSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#070916" />
      <stop offset="55%" stopColor="#141833" />
      <stop offset="82%" stopColor="#2c2442" />
      <stop offset="100%" stopColor="#070a14" />
    </linearGradient>

    <linearGradient id="waterReflect" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#1a2642" stopOpacity="0.95" />
      <stop offset="100%" stopColor="#05070f" stopOpacity="1" />
    </linearGradient>

    <linearGradient id="cyanBeam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
      <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0" />
    </linearGradient>

    <linearGradient id="crimsonBeam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#d93829" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#d93829" stopOpacity="0.03" />
    </linearGradient>

    <pattern id="blueprintGridSmall" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#8c806e" strokeWidth="0.7" opacity="0.24" />
    </pattern>

    <pattern id="blueprintGridLarge" width="180" height="180" patternUnits="userSpaceOnUse">
      <path d="M 180 0 L 0 0 0 180" fill="none" stroke="#756958" strokeWidth="1.3" opacity="0.28" />
    </pattern>

    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="cardShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.35" />
    </filter>
  </defs>
);

// ============================================================================
// 04. TECHDE-STYLE BACKDROPS (TWILIGHT SKYLINE & ARCHITECTURAL BLUEPRINT PAPER)
// ============================================================================

const DarkTwilightBackdrop: React.FC<{ sec: number }> = ({ sec }) => (
  <AbsoluteFill>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <GlobalSvgDefs />
      <rect width={WIDTH} height={HEIGHT} fill="url(#twilightSky)" />

      {/* Twinkling Deep Space Stars */}
      {STARS.map((s, idx) => (
        <circle
          key={idx}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#e2f7ff"
          opacity={0.25 + 0.55 * Math.abs(Math.sin(sec * 1.8 + s.phase))}
        />
      ))}

      {/* Subtle Twilight Horizon Glow */}
      <ellipse cx="540" cy="1340" rx="620" ry="110" fill="#ff9f43" opacity="0.12" filter="url(#neonGlow)" />

      {/* Techde-inspired Minimalist City & Lab Skyline Silhouette at y=1340 */}
      <g fill="#090c18">
        {Array.from({ length: 28 }, (_, i) => {
          const bw = 34 + (i % 3) * 12;
          const bh = 35 + ((i * 29) % 85);
          const bx = i * 40 - 10;
          return <rect key={i} x={bx} y={1340 - bh} width={bw} height={bh} />;
        })}
      </g>

      {/* Water / Horizon Reflection Floor */}
      <rect x="0" y="1340" width={WIDTH} height="580" fill="url(#waterReflect)" />
      <line x1="0" y1="1340" x2={WIDTH} y2="1340" stroke="#00e5ff" strokeWidth="1.5" opacity="0.35" />

      {/* Perspective Floor Grid Lines */}
      <g stroke="#00e5ff" strokeWidth="0.9" opacity="0.14">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`p${i}`} x1="540" y1="1340" x2={-300 + i * 168} y2="1920" />
        ))}
        {[1390, 1450, 1525, 1620, 1740].map((y, i) => (
          <line key={`h${i}`} x1="0" y1={y} x2={WIDTH} y2={y} />
        ))}
      </g>
    </svg>
  </AbsoluteFill>
);

const PaperBlueprintBackdrop: React.FC<{ figCode: string }> = ({ figCode }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(135deg, #f6f1e5 0%, #ece4d3 55%, #e1d6c0 100%)' }}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <GlobalSvgDefs />
      <rect width={WIDTH} height={HEIGHT} fill="url(#blueprintGridSmall)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#blueprintGridLarge)" />

      {/* Outer Architectural Border & Corner Crosshairs */}
      <rect
        x="46"
        y="400"
        width="988"
        height="1120"
        fill="none"
        stroke="#4a4235"
        strokeWidth="2"
        opacity="0.55"
      />
      <rect
        x="58"
        y="412"
        width="964"
        height="1096"
        fill="none"
        stroke="#8c7f6a"
        strokeWidth="1"
        strokeDasharray="6 6"
        opacity="0.5"
      />

      {/* Precision Measurement Ruler Ticks Left & Right */}
      <g stroke="#4a4235" strokeWidth="1.4" opacity="0.5">
        {Array.from({ length: 42 }, (_, i) => {
          const y = 430 + i * 26;
          const major = i % 5 === 0;
          return (
            <React.Fragment key={i}>
              <line x1="46" y1={y} x2={46 + (major ? 18 : 8)} y2={y} />
              <line x1="1034" y1={y} x2={1034 - (major ? 18 : 8)} y2={y} />
            </React.Fragment>
          );
        })}
      </g>

      {/* Blueprint Header Metadata Stamp */}
      <g transform="translate(82 442)">
        <rect x="0" y="-20" width="250" height="30" rx="4" fill="#26211b" />
        <text x="125" y="0" fill="#f6f1e5" fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="2.5">
          {figCode}
        </text>
      </g>

      <text x="995" y="442" fill="#5c5243" fontSize="13" fontWeight="800" textAnchor="end" letterSpacing="2">
        SCALE 1 : 10⁻⁹ QUANTUM
      </text>
    </svg>
  </AbsoluteFill>
);

// ============================================================================
// 05. REUSABLE UI BADGES (DEVMONK & TECHDE HYBRID CARDS)
// ============================================================================

const TelemetryPill: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  sublabel?: string;
  accent?: string;
  dark?: boolean;
  scale?: number;
}> = ({ x, y, w, h = 68, label, sublabel, accent = '#00e5ff', dark = true, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} filter="url(#cardShadow)">
    <rect
      x={-w / 2}
      y={-h / 2}
      width={w}
      height={h}
      rx="16"
      fill={dark ? '#091122' : '#231f1a'}
      stroke={accent}
      strokeWidth="2.5"
    />
    <text
      x="0"
      y={sublabel ? -4 : 8}
      fill="#ffffff"
      fontSize="24"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
      textAnchor="middle"
      letterSpacing="1"
    >
      {label}
    </text>
    {sublabel && (
      <text
        x="0"
        y={22}
        fill={accent}
        fontSize="14"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        textAnchor="middle"
        letterSpacing="2"
      >
        {sublabel}
      </text>
    )}
  </g>
);

const RedProhibitionIcon: React.FC<{ cx: number; cy: number; r: number; scale?: number }> = ({
  cx,
  cy,
  r,
  scale = 1,
}) => (
  <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
    <circle r={r} fill="rgba(217, 56, 41, 0.14)" stroke="#ff3b30" strokeWidth="8" />
    <line
      x1={-r * 0.68}
      y1={-r * 0.68}
      x2={r * 0.68}
      y2={r * 0.68}
      stroke="#ff3b30"
      strokeWidth="8"
      strokeLinecap="round"
    />
  </g>
);

// ============================================================================
// 06. SCENE 1 VISUALS (0.0s - 8.0s): VIDEO GAME ENGINE & OBSERVER FOV CONE
// ============================================================================

const SceneOneVisual: React.FC<{ sec: number; frame: number }> = ({ sec, frame }) => {
  const isBeatB = sec >= 3.8;
  const beatASpring = fastSpring(frame, 4);
  const beatBSpring = fastSpring(frame, Math.round(3.8 * FPS));

  // Rotating Observer Cone angle for Beat B
  const coneDeg = -25 + Math.sin(sec * 2.1) * 32;

  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <GlobalSvgDefs />

      {/* --- SUB-SCENE 1A (0.0s - 3.8s): UNIVERSE VIDEO GAME SIMULATION ENGINE --- */}
      {!isBeatB && (
        <g transform={`translate(540 940) scale(${0.88 + beatASpring * 0.12})`}>
          {/* Outer HUD Ring */}
          <circle r="330" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="8 12" opacity="0.4" />
          <circle r="285" fill="none" stroke="#00e5ff" strokeWidth="2.5" opacity="0.65" />

          {/* Isometric Wireframe Terrain Patch */}
          <g transform="translate(0 75)" stroke="#00e5ff" strokeWidth="1.6" fill="none" opacity="0.55">
            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
              <React.Fragment key={i}>
                <line x1={i * 55} y1="-110" x2={i * 75} y2="110" />
                <line x1="-260" y1={i * 26} x2="260" y2={i * 26} />
              </React.Fragment>
            ))}
          </g>

          {/* Floating Isometric 3D Voxel / Quantum Cube */}
          <g transform={`translate(0 ${-45 + Math.sin(sec * 4) * 14})`}>
            {/* Top Face */}
            <polygon
              points="0,-130 115,-65 0,0 -115,-65"
              fill="rgba(0, 229, 255, 0.28)"
              stroke="#00e5ff"
              strokeWidth="4"
            />
            {/* Left Face */}
            <polygon
              points="-115,-65 0,0 0,130 -115,65"
              fill="rgba(0, 140, 180, 0.35)"
              stroke="#00e5ff"
              strokeWidth="4"
            />
            {/* Right Face */}
            <polygon
              points="115,-65 0,0 0,130 115,65"
              fill="rgba(0, 75, 120, 0.5)"
              stroke="#00e5ff"
              strokeWidth="4"
            />
            <circle cx="0" cy="0" r="14" fill="#ffffff" filter="url(#neonGlow)" />
          </g>

          {/* Game Controller / Engine Telemetry Badges */}
          <TelemetryPill
            x={-250}
            y={-275}
            w={310}
            h={64}
            label="ENGINE: UNIVERSE v1.0"
            sublabel="60.0 FPS // QUANTUM GPU"
            accent="#00e5ff"
          />
          <TelemetryPill
            x={250}
            y={-275}
            w={290}
            h={64}
            label="RENDER MODE: LAZY"
            sublabel="SAVE MEMORY ⚡"
            accent="#00ff9d"
          />

          <TelemetryPill
            x={0}
            y={295}
            w={620}
            h={78}
            label="GAMING OPTIMIZATION: ON 🎮"
            sublabel="ONLY RENDER WHAT THE PLAYER SEES"
            accent="#00e5ff"
          />
        </g>
      )}

      {/* --- SUB-SCENE 1B (3.8s - 8.0s): OBSERVER VISION CONE vs UNRENDERED VOID --- */}
      {isBeatB && (
        <g transform={`translate(540 930) scale(${0.9 + beatBSpring * 0.1})`}>
          {/* Split Comparison Arena Box */}
          <rect
            x="-440"
            y="-360"
            width="880"
            height="680"
            rx="28"
            fill="rgba(8, 15, 32, 0.85)"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth="2.5"
          />
          <line
            x1="0"
            y1="-360"
            x2="0"
            y2="320"
            stroke="#ff9f43"
            strokeWidth="3"
            strokeDasharray="10 10"
          />

          {/* LEFT SIDE: OBSERVED = SOLID RENDERED */}
          <g transform="translate(-220 -30)">
            <text y="-255" fill="#00ff9d" fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="2">
              WHEN YOU LOOK 👀
            </text>

            {/* Observer Eye Firing Cyan FOV Cone */}
            <g transform="translate(0 -150)">
              <polygon points="0,20 -135,230 135,230" fill="rgba(0, 229, 255, 0.16)" />
              <line x1="0" y1="20" x2="-135" y2="230" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="6 6" />
              <line x1="0" y1="20" x2="135" y2="230" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="6 6" />
              <path
                d="M -65 0 Q 0 -48 65 0 Q 0 48 -65 0 Z"
                fill="#071529"
                stroke="#00e5ff"
                strokeWidth="4"
              />
              <circle r="18" fill="#00e5ff" />
            </g>

            {/* Crisp Rendered Solid Planet/Atom */}
            <g transform="translate(0 75)">
              <circle r="76" fill="#00e5ff" filter="url(#neonGlow)" />
              <ellipse
                rx="125"
                ry="36"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                transform={`rotate(${-18 + Math.sin(sec * 3) * 6})`}
              />
              <text y="135" fill="#00ff9d" fontSize="23" fontWeight="900" textAnchor="middle">
                100% RENDERED ✅
              </text>
            </g>
          </g>

          {/* RIGHT SIDE: NOT SEEN = DOES NOT EXIST (Techde Red Ban Icon!) */}
          <g transform="translate(220 -30)">
            <text y="-255" fill="#ff5252" fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="2">
              WHEN NOT SEEN 🙈
            </text>

            {/* Closed Eye */}
            <g transform="translate(0 -150)">
              <path d="M -65 0 Q 0 38 65 0" fill="none" stroke="#7c8da6" strokeWidth="5" strokeLinecap="round" />
              <line x1="-40" y1="15" x2="-52" y2="34" stroke="#7c8da6" strokeWidth="4" />
              <line x1="0" y1="22" x2="0" y2="44" stroke="#7c8da6" strokeWidth="4" />
              <line x1="40" y1="15" x2="52" y2="34" stroke="#7c8da6" strokeWidth="4" />
            </g>

            {/* Ghost Dotted Outline + Giant Techde Prohibition Circle */}
            <g transform="translate(0 75)">
              <circle
                r="76"
                fill="none"
                stroke="#7c8da6"
                strokeWidth="3"
                strokeDasharray="8 10"
                opacity="0.5"
              />
              <RedProhibitionIcon cx={0} cy={0} r={88} scale={0.95 + Math.sin(sec * 7) * 0.05} />
              <text y="135" fill="#ff5252" fontSize="23" fontWeight="900" textAnchor="middle">
                DOES NOT EXIST ❌
              </text>
            </g>
          </g>

          {/* Bottom Summary Pill */}
          <TelemetryPill
            x={0}
            y={305}
            w={680}
            h={74}
            label="OBSERVER EFFECT: NO EYE = NO REALITY"
            sublabel="QUANTUM PROBABILITY RULE"
            accent="#ff9f43"
          />
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// 07. SCENE 2 VISUALS (8.0s - 22.5s): PAPER BLUEPRINT DOUBLE-SLIT EXPERIMENT
// ============================================================================

const SceneTwoVisual: React.FC<{ sec: number; frame: number }> = ({ sec, frame }) => {
  // 3 distinct stages on the blueprint canvas:
  // Stage A (8.0 - 11.5s): Setup & Electron Gun Firing
  // Stage B (11.5 - 17.8s): Unobserved Wave Interference Pattern
  // Stage C (17.8 - 22.5s): Observer Camera Drops -> Collapse to 2 Solid Particle Bars
  const stage = sec < 11.5 ? 'setup' : sec < 17.8 ? 'waves' : 'collapse';
  const collapseSpring = fastSpring(frame, Math.round(17.8 * FPS), 11, 180);

  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <GlobalSvgDefs />

      {/* Blueprint Technical Title Strip */}
      <g transform="translate(540 505)">
        <text fill="#241f19" fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="3">
          {stage === 'setup'
            ? 'LABORATORY APPARATUS // ELECTRON BEAM SETUP'
            : stage === 'waves'
              ? 'MODE 01: NO OBSERVER ➔ WAVE INTERFERENCE PATTERN'
              : 'MODE 02: CAMERA ACTIVE ➔ WAVEFUNCTION COLLAPSE!'}
        </text>
        <line x1="-380" y1="16" x2="380" y2="16" stroke="#241f19" strokeWidth="2" opacity="0.4" />
      </g>

      {/* --- 1. ELECTRON / PHOTON CANNON (LEFT: x=175, y=950) --- */}
      <g transform="translate(175 950)">
        {/* Base Tripod */}
        <path d="M -35 95 L 0 35 L 35 95" fill="none" stroke="#241f19" strokeWidth="6" strokeLinecap="round" />
        <line x1="-55" y1="95" x2="55" y2="95" stroke="#241f19" strokeWidth="6" />
        {/* Cannon Body */}
        <rect x="-75" y="-48" width="130" height="96" rx="14" fill="#241f19" stroke="#d93829" strokeWidth="4" />
        <rect x="55" y="-20" width="48" height="40" rx="6" fill="#d93829" />
        {/* Glowing Core */}
        <circle cx="-10" cy="0" r="22" fill="#ff9f43" />
        <text x="0" y="135" fill="#241f19" fontSize="19" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
          ELECTRON GUN
        </text>
      </g>

      {/* Animated Electrons Firing from Cannon to Slits (x=280 to x=495) */}
      {[0, 0.33, 0.66].map((offset, idx) => {
        const p = (sec * 1.9 + offset) % 1;
        const ex = mix(285, 495, p);
        const ey = 950 + (idx - 1) * 45 * p;
        return (
          <g key={idx}>
            <circle cx={ex} cy={ey} r="9" fill="#d93829" />
            <circle cx={ex} cy={ey} r="16" fill="none" stroke="#d93829" strokeWidth="2" opacity={1 - p} />
          </g>
        );
      })}

      {/* --- 2. DOUBLE-SLIT TITANIUM BARRIER PLATE (CENTER: x=510, y=950) --- */}
      <g transform="translate(510 950)">
        {/* Top Plate */}
        <rect x="-14" y="-330" width="28" height="210" rx="4" fill="#241f19" />
        {/* Center Divider Between Slits */}
        <rect x="-14" y="-50" width="28" height="100" rx="4" fill="#241f19" />
        {/* Bottom Plate */}
        <rect x="-14" y="120" width="28" height="210" rx="4" fill="#241f19" />

        {/* Glowing Slit Openings (Slit 1 at y=-85, Slit 2 at y=+85) */}
        <rect x="-10" y="-120" width="20" height="70" fill="#00e5ff" opacity="0.55" />
        <rect x="-10" y="50" width="20" height="70" fill="#00e5ff" opacity="0.55" />

        {/* Engineering Callouts */}
        <text x="-32" y="-80" fill="#d93829" fontSize="18" fontWeight="900" textAnchor="end">
          SLIT 1 ➔
        </text>
        <text x="-32" y="92" fill="#d93829" fontSize="18" fontWeight="900" textAnchor="end">
          SLIT 2 ➔
        </text>
        <text x="0" y="368" fill="#241f19" fontSize="19" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
          2-SLIT BARRIER
        </text>
      </g>

      {/* --- 3. DETECTOR BACK SCREEN (RIGHT: x=865, y=950) --- */}
      <g transform="translate(865 950)">
        <rect x="-14" y="-330" width="28" height="660" rx="6" fill="#dfd5c0" stroke="#241f19" strokeWidth="4" />
        <text x="0" y="368" fill="#241f19" fontSize="19" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
          SCREEN WALL
        </text>
      </g>

      {/* =====================================================================
          STAGE A (8.0s - 11.5s): QUESTION MARK MYSTERY ON SCREEN
         ===================================================================== */}
      {stage === 'setup' && (
        <g transform="translate(690 950)">
          <circle r="72" fill="#d93829" />
          <text y="26" fill="#ffffff" fontSize="82" fontWeight="900" textAnchor="middle">
            ?
          </text>
          <TelemetryPill
            x={0}
            y={255}
            w={520}
            h={66}
            label="WAVE OR SOLID PARTICLE?"
            sublabel="THE ULTIMATE QUANTUM PUZZLE"
            accent="#d93829"
            dark={false}
          />
        </g>
      )}

      {/* =====================================================================
          STAGE B (11.5s - 17.8s): UNOBSERVED -> HUYGENS WAVES & 9 FRINGE BANDS
         ===================================================================== */}
      {stage === 'waves' && (
        <g>
          {/* "NO OBSERVER / CAMERA OFF" Badge at Top Center */}
          <g transform="translate(510 575)">
            <rect x="-155" y="-28" width="310" height="52" rx="26" fill="#241f19" />
            <text x="0" y="6" fill="#00e5ff" fontSize="18" fontWeight="900" textAnchor="middle" letterSpacing="2">
              📵 NO CAMERA LOOKING
            </text>
          </g>

          {/* Expanding Circular Wavefronts from Slit 1 (y=865) & Slit 2 (y=1035) */}
          <g fill="none" stroke="#008b9b">
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const r = ((sec * 110 + i * 58) % 340) + 15;
              const alpha = clamp(1 - r / 350, 0.1, 0.85);
              return (
                <React.Fragment key={i}>
                  <path
                    d={`M 524 ${865 - r} A ${r} ${r} 0 0 1 524 ${865 + r}`}
                    strokeWidth="3.2"
                    opacity={alpha}
                  />
                  <path
                    d={`M 524 ${1035 - r} A ${r} ${r} 0 0 1 524 ${1035 + r}`}
                    strokeWidth="3.2"
                    opacity={alpha}
                  />
                </React.Fragment>
              );
            })}
          </g>

          {/* 9 Interference Intensity Bands on Detector Screen + Probability Curve */}
          {[-260, -195, -130, -65, 0, 65, 130, 195, 260].map((dy, idx) => {
            const intensity = 1 - Math.abs(idx - 4) * 0.18;
            const barW = 28 + intensity * 48;
            return (
              <rect
                key={idx}
                x={882}
                y={950 + dy - 20}
                width={barW}
                height="40"
                rx="6"
                fill="#008b9b"
                opacity={0.35 + intensity * 0.65}
              />
            );
          })}

          <TelemetryPill
            x={540}
            y={1425}
            w={720}
            h={74}
            label="INTERFERENCE PATTERN: BEHAVES LIKE WAVES 🌊"
            sublabel="SINGLE ELECTRON PASSES THROUGH BOTH SLITS AT ONCE!"
            accent="#00e5ff"
            dark={false}
          />
        </g>
      )}

      {/* =====================================================================
          STAGE C (17.8s - 22.5s): OBSERVER CAMERA DROPS -> 2 SOLID BARS!
         ===================================================================== */}
      {stage === 'collapse' && (
        <g>
          {/* Robotic Quantum Observer Camera Dropping Down at x=510 */}
          <g transform={`translate(510 ${mix(440, 625, collapseSpring)})`}>
            {/* Mounting Arm */}
            <line x1="0" y1="-160" x2="0" y2="-45" stroke="#241f19" strokeWidth="10" />
            {/* Camera Housing */}
            <rect x="-85" y="-48" width="170" height="86" rx="18" fill="#d93829" stroke="#241f19" strokeWidth="4" />
            <circle cx="0" cy="-5" r="26" fill="#241f19" />
            <circle cx="0" cy="-5" r="12" fill="#ffeb3b" />

            {/* Red Laser Scanning Cone Hitting Slits */}
            <polygon points="-55,38 55,38 95,290 -95,290" fill="url(#crimsonBeam)" />
            <line x1="-55" y1="38" x2="-85" y2="290" stroke="#d93829" strokeWidth="3" strokeDasharray="6 6" />
            <line x1="55" y1="38" x2="85" y2="290" stroke="#d93829" strokeWidth="3" strokeDasharray="6 6" />

            <rect x="-130" y="-92" width="260" height="36" rx="8" fill="#241f19" />
            <text x="0" y="-68" fill="#ffeb3b" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="2">
              🚨 OBSERVER CAMERA ON
            </text>
          </g>

          {/* 2 Straight Ballistic Particle Trajectories */}
          <line x1="525" y1="865" x2="855" y2="865" stroke="#d93829" strokeWidth="9" strokeDasharray="16 12" />
          <line x1="525" y1="1035" x2="855" y2="1035" stroke="#d93829" strokeWidth="9" strokeDasharray="16 12" />

          {/* Strictly TWO Solid Particle Bars on the Screen Wall */}
          <rect x="884" y="820" width="72" height="90" rx="8" fill="#d93829" stroke="#241f19" strokeWidth="3" />
          <rect x="884" y="990" width="72" height="90" rx="8" fill="#d93829" stroke="#241f19" strokeWidth="3" />

          <TelemetryPill
            x={540}
            y={1425}
            w={740}
            h={76}
            label="WAVES VANISH ➔ ONLY 2 SOLID PARTICLE BARS! ⚡"
            sublabel="PARTICLES KNOW YOU ARE WATCHING THEM"
            accent="#d93829"
            dark={false}
          />
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// 08. SCENE 3 VISUALS (22.5s - 30.0s): TECHDE 3-CARD GRID & PART 2 CLOCK VAULT
// ============================================================================

const SceneThreeVisual: React.FC<{ sec: number; frame: number }> = ({ sec, frame }) => {
  const isVaultPhase = sec >= 26.5;

  const cards = [
    {
      title: 'NO OBSERVER',
      sub: 'WAVES EVERYWHERE',
      icon: '🌊',
      color: '#ff5252',
      delay: Math.round(22.6 * FPS),
      crossed: true,
    },
    {
      title: 'EYES OPEN',
      sub: 'CAMERA DETECTS',
      icon: '👁️',
      color: '#00e5ff',
      delay: Math.round(23.2 * FPS),
      crossed: false,
    },
    {
      title: 'SOLID REALITY',
      sub: 'INSTANT RENDER',
      icon: '🧱',
      color: '#00ff9d',
      delay: Math.round(23.8 * FPS),
      crossed: false,
    },
  ];

  const vaultSpring = fastSpring(frame, Math.round(26.5 * FPS), 12, 150);
  const unlockProgress = clamp((sec - 27.6) / 0.6);

  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <GlobalSvgDefs />

      {/* --- SUB-SCENE 3A (22.5s - 26.5s): TECHDE-STYLE 3 GLASSMORPHIC CARDS --- */}
      {!isVaultPhase && (
        <g transform="translate(0 40)">
          {cards.map((c, idx) => {
            const pop = fastSpring(frame, c.delay, 13, 165);
            const cx = 210 + idx * 330;
            const cy = 910;

            return (
              <g
                key={idx}
                transform={`translate(${cx} ${cy}) scale(${0.75 + pop * 0.25})`}
                opacity={clamp((frame - c.delay) / 10)}
              >
                <rect
                  x="-145"
                  y="-210"
                  width="290"
                  height="420"
                  rx="26"
                  fill="rgba(12, 22, 46, 0.9)"
                  stroke={c.color}
                  strokeWidth="3.5"
                  filter="url(#cardShadow)"
                />
                <circle cx="0" cy="-55" r="74" fill="rgba(255,255,255,0.06)" stroke={c.color} strokeWidth="2.5" />
                <text x="0" y="-30" fontSize="68" textAnchor="middle">
                  {c.icon}
                </text>

                {c.crossed && <RedProhibitionIcon cx={0} cy={-55} r={78} />}

                <text x="0" y="95" fill="#ffffff" fontSize="28" fontWeight="900" textAnchor="middle">
                  {c.title}
                </text>
                <text x="0" y="135" fill={c.color} fontSize="18" fontWeight="800" textAnchor="middle" letterSpacing="1.5">
                  {c.sub}
                </text>
              </g>
            );
          })}

          <TelemetryPill
            x={540}
            y={1285}
            w={780}
            h={82}
            label="UNIVERSE RENDERS ONLY ON OBSERVATION ⚡"
            sublabel="QUANTUM COPENHAGEN INTERPRETATION"
            accent="#00ff9d"
          />
        </g>
      )}

      {/* --- SUB-SCENE 3B (26.5s - 30.0s): TECHDE QUANTUM CLOCK & PART 2 VAULT --- */}
      {isVaultPhase && (
        <g transform={`translate(540 930) scale(${0.86 + vaultSpring * 0.14})`}>
          {/* Outer Glowing Quantum Clock / Vault Ring */}
          <circle r="270" fill="#081226" stroke="#ffd166" strokeWidth="6" filter="url(#cardShadow)" />
          <circle r="235" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="8 10" />

          {/* 12 Clock / Vault Hour Ticks */}
          {Array.from({ length: 12 }, (_, i) => {
            const p1 = polar(0, 0, 195, i * 30);
            const p2 = polar(0, 0, 222, i * 30);
            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#ffd166"
                strokeWidth={i % 3 === 0 ? 5 : 2.5}
              />
            );
          })}

          {/* Rotating Clock Hands */}
          <line
            x1="0"
            y1="0"
            x2={polar(0, 0, 145, (sec - 26.5) * 260).x}
            y2={polar(0, 0, 145, (sec - 26.5) * 260).y}
            stroke="#00ff9d"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="0"
            x2={polar(0, 0, 105, (sec - 26.5) * 80).x}
            y2={polar(0, 0, 105, (sec - 26.5) * 80).y}
            stroke="#ffd166"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle r="22" fill="#ffd166" />

          {/* Classified Part 2 Banner */}
          <TelemetryPill
            x={0}
            y={355}
            w={720}
            h={88}
            label={unlockProgress > 0.5 ? 'PART 2: THE QUANTUM RAAZ 🔓' : 'CLASSIFIED QUANTUM MYSTERY 🔒'}
            sublabel="HOW DO PARTICLES KNOW YOU'RE WATCHING?"
            accent="#ffd166"
          />
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// 09. SCENE 4 VISUALS (30.0s - 41.56s): TECHDE HUMAN SILHOUETTES & COMMENT BOX
// ============================================================================

const HumanFigure: React.FC<{
  x: number;
  y: number;
  color: string;
  scale?: number;
  isFloating?: boolean;
  sec?: number;
}> = ({ x, y, color, scale = 1, isFloating = false, sec = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* Head */}
    <circle cx="0" cy="-115" r="28" fill={color} />
    {/* Torso & Arms & Legs (Clean Techde Architectural Silhouette) */}
    <path
      d="M -32 -78 C -32 -84 32 -84 32 -78 L 48 -5 L 30 0 L 22 -52 L 16 -52 L 26 75 L 4 75 L 0 5 L -4 75 L -26 75 L -16 -52 L -22 -52 L -30 0 L -48 -5 Z"
      fill={color}
    />
    {isFloating && (
      <g>
        {/* VR / Parallel Reality Visor */}
        <rect x="-24" y="-124" width="48" height="16" rx="5" fill="#00e5ff" />
        {/* Orbiting Parallel Reality Rings */}
        <ellipse
          cx="0"
          cy="-40"
          rx="72"
          ry="22"
          fill="none"
          stroke="#d93829"
          strokeWidth="3"
          strokeDasharray="6 6"
          transform={`rotate(${-15 + Math.sin(sec * 4) * 8})`}
        />
      </g>
    )}
  </g>
);

const SceneFourVisual: React.FC<{ sec: number; frame: number }> = ({ sec, frame }) => {
  const showStamps = sec >= 36.2;
  const showComment = sec >= 38.8;
  const commentT = clamp((sec - 39.0) / 2.1);
  const typedText = '@tag_your_parallel_friend 😂🌌'.slice(
    0,
    Math.floor(commentT * '@tag_your_parallel_friend 😂🌌'.length)
  );

  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <GlobalSvgDefs />

      {/* Ground Reality Baseline */}
      <line x1="90" y1="1085" x2="990" y2="1085" stroke="#26211b" strokeWidth="4" />
      <text x="540" y="1128" fill="#5c5243" fontSize="18" fontWeight="900" textAnchor="middle" letterSpacing="4">
        REAL DUNIYA // NORMAL HUMANS ON EARTH
      </text>

      {/* Row of 7 Human Silhouettes (Exact Techde "আমরা নিজেরাই!" Aesthetic) */}
      {[-3, -2, -1, 0, 1, 2, 3].map((idx) => {
        const x = 540 + idx * 125;
        const isLostFriend = idx === 0;
        const floatOffset = isLostFriend ? -185 + Math.sin(sec * 4.2) * 18 : 0;

        return (
          <React.Fragment key={idx}>
            {/* Shadow on ground when floating */}
            {isLostFriend && (
              <ellipse cx={x} cy="1085" rx="34" ry="8" fill="rgba(0,0,0,0.22)" />
            )}
            <HumanFigure
              x={x}
              y={1010 + floatOffset}
              color={isLostFriend ? '#d93829' : '#3a332a'}
              scale={isLostFriend ? 1.18 : 0.96}
              isFloating={isLostFriend}
              sec={sec}
            />
          </React.Fragment>
        );
      })}

      {/* Floating Friend Callout Arrow */}
      <g transform={`translate(540 ${645 + Math.sin(sec * 4.2) * 14})`}>
        <rect x="-185" y="-36" width="370" height="54" rx="12" fill="#d93829" />
        <text x="0" y="-2" fill="#ffffff" fontSize="21" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
          PARALLEL REALITY FRIEND 🛸
        </text>
      </g>

      {/* --- SUB-SCENE 4B (36.2s+): 3 DIAGNOSTIC STAMPS AROUND LOST FRIEND --- */}
      {showStamps && (
        <g>
          <TelemetryPill
            x={250}
            y={760}
            w={290}
            h={62}
            label="HOSH: 0% LOST 🪐"
            sublabel="OWN DIMENSION"
            accent="#d93829"
            dark={false}
          />
          <TelemetryPill
            x={830}
            y={760}
            w={290}
            h={62}
            label="CALLS: IGNORED 📵"
            sublabel="OUT OF NETWORK"
            accent="#008b9b"
            dark={false}
          />
        </g>
      )}

      {/* --- LIVE YOUTUBE COMMENT DRAWER (38.8s - 41.56s) --- */}
      {showComment && (
        <g
          transform={`translate(540 1335) scale(${0.86 + fastSpring(frame, Math.round(38.8 * FPS)) * 0.14})`}
          filter="url(#cardShadow)"
        >
          <rect x="-380" y="-85" width="760" height="170" rx="24" fill="#1e1b17" stroke="#d93829" strokeWidth="3.5" />
          <circle cx="-315" cy="-22" r="24" fill="#d93829" />
          <text x="-315" y="-14" fill="#ffffff" fontSize="22" fontWeight="900" textAnchor="middle">
            💬
          </text>
          <text x="-270" y="-15" fill="#c7bca9" fontSize="18" fontWeight="800" letterSpacing="1.5">
            YouTube · TAG THAT FRIEND IN COMMENTS 👇
          </text>
          <line x1="-340" y1="12" x2="340" y2="12" stroke="#423b32" strokeWidth="2" />
          <text x="-335" y="56" fill="#ffffff" fontSize="29" fontWeight="900">
            {typedText}
            <tspan fill="#00e5ff">{commentT < 1 ? '▍' : ''}</tspan>
          </text>
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// 10. TOP DYNAMIC EDITORIAL HEADLINES (HERO OVERLAY)
// ============================================================================

const HeroOverlay: React.FC<{
  beat: HeroBeat;
  beatAt: number;
  theme: Theme;
  frame: number;
}> = ({ beat, beatAt, theme, frame }) => {
  const age = Math.max(0, frame - Math.round(beatAt * FPS));
  const pop = fastSpring(age, 0, 13, 165);
  const opacity = interp(age, [0, 7, 16], [0, 0.92, 1]);
  const isPaper = theme === 'paper';

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 44,
          right: 44,
          opacity,
          transform: `scale(${0.86 + pop * 0.14})`,
          textAlign: 'center',
        }}
      >
        {/* Top Tag Pill */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 14,
            marginBottom: 14,
          }}
        >
          <span style={{ width: 38, height: 3, background: beat.accent }} />
          <span
            style={{
              padding: '6px 18px',
              borderRadius: 100,
              background: isPaper ? 'rgba(36,31,25,0.08)' : 'rgba(0,229,255,0.1)',
              border: `1.5px solid ${beat.accent}`,
              color: isPaper ? '#3a3227' : '#d8f3ff',
              fontFamily: 'Arial, sans-serif',
              fontSize: 15,
              letterSpacing: 3.5,
              fontWeight: 900,
            }}
          >
            {beat.tag}
          </span>
          <span style={{ width: 38, height: 3, background: beat.accent }} />
        </div>

        {/* Two-Line Hero Impact Title */}
        <div
          style={{
            fontFamily: 'Arial Black, Impact, Arial, sans-serif',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -3,
            textTransform: 'uppercase',
            color: isPaper ? '#1e1a15' : '#ffffff',
            textShadow: isPaper ? '0 2px 0 rgba(255,255,255,0.4)' : '0 8px 28px rgba(0,0,0,0.65)',
          }}
        >
          <div style={{ fontSize: 70, whiteSpace: 'nowrap' }}>{beat.line1}</div>
          <div
            style={{
              fontSize: 72,
              whiteSpace: 'nowrap',
              color: beat.accent,
              marginTop: 6,
            }}
          >
            {beat.line2}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 11. WORD-BY-WORD SYNCED KARAOKE CAPTIONS (BOTTOM OVERLAY)
// ============================================================================

type WordTiming = { word: string; start: number; end: number };

function getWordTimings(scene: Scene): WordTiming[] {
  const words = scene.caption.trim().split(/\s+/);
  const weights = words.map((word) => {
    const chars = Math.max(2, word.replace(/[^a-zA-Z0-9]/g, '').length);
    const punc = /[,;:—]$/.test(word) ? 1.6 : /[?!.]$/.test(word) ? 2.8 : 0;
    return chars + punc;
  });

  const total = weights.reduce((sum, w) => sum + w, 0);
  const duration = scene.speechEnd - scene.speechStart;
  let cursor = scene.speechStart;

  return words.map((word, index) => {
    const start = cursor;
    cursor += (weights[index] / total) * duration;
    return {
      word,
      start,
      end: index === words.length - 1 ? scene.speechEnd : cursor,
    };
  });
}

const CaptionOverlay: React.FC<{ scene: Scene; sec: number }> = ({ scene, sec }) => {
  const timings = getWordTimings(scene);
  const activeIndex = timings.findIndex((t) => sec >= t.start && sec < t.end);
  const safeIndex =
    sec < scene.speechStart
      ? 0
      : sec >= scene.speechEnd
        ? timings.length - 1
        : Math.max(0, activeIndex);

  const chunkStart = Math.floor(safeIndex / 5) * 5;
  const visibleWords = timings.slice(chunkStart, chunkStart + 5);
  const isPaper = scene.theme === 'paper';

  const sceneProgress = clamp((sec - scene.speechStart) / (scene.speechEnd - scene.speechStart));

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 50,
          top: 1585,
          minHeight: 175,
          borderRadius: 26,
          background: isPaper ? 'rgba(28, 24, 20, 0.96)' : 'rgba(7, 13, 28, 0.95)',
          border: `2px solid ${isPaper ? 'rgba(217,56,41,0.45)' : 'rgba(0,229,255,0.4)'}`,
          boxShadow: '0 20px 55px rgba(0,0,0,0.45)',
          padding: '22px 28px 26px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '9px 12px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 33,
            fontWeight: 900,
            lineHeight: 1.25,
            textAlign: 'center',
          }}
        >
          {visibleWords.map((item, idx) => {
            const globalIdx = chunkStart + idx;
            const isActive = globalIdx === safeIndex && sec >= scene.speechStart && sec < scene.speechEnd;
            const isPast = globalIdx < safeIndex;

            return (
              <span
                key={`${globalIdx}-${item.word}`}
                style={{
                  display: 'inline-block',
                  color: isActive ? '#06101e' : isPast ? '#9cb1c4' : '#ffffff',
                  background: isActive ? '#00e5ff' : 'transparent',
                  borderRadius: 9,
                  padding: isActive ? '4px 11px 6px' : '2px 0',
                  transform: isActive ? 'translateY(-2px) scale(1.06)' : 'none',
                  boxShadow: isActive ? '0 0 18px rgba(0,229,255,0.65)' : 'none',
                }}
              >
                {item.word}
              </span>
            );
          })}
        </div>

        {/* Bottom Progress Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 24,
            right: 24,
            height: 4,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${sceneProgress * 100}%`,
              height: '100%',
              background: isPaper ? '#d93829' : '#00e5ff',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 12. TOP STORY SEGMENT PROGRESS BAR
// ============================================================================

const TopTimelineBar: React.FC<{ sec: number; activeScene: Scene }> = ({ sec, activeScene }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        top: 34,
        left: 48,
        right: 48,
        display: 'flex',
        gap: 8,
        height: 5,
      }}
    >
      {SCENES.map((s) => {
        const fill =
          sec >= s.end ? 1 : sec <= s.start ? 0 : clamp((sec - s.start) / (s.end - s.start));
        return (
          <div
            key={s.id}
            style={{
              flex: 1,
              background: activeScene.theme === 'paper' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${fill * 100}%`,
                height: '100%',
                background: activeScene.theme === 'paper' ? '#d93829' : '#00e5ff',
              }}
            />
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);

// ============================================================================
// 13. MAIN REEL COMPOSITION
// ============================================================================

const ReelVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const scene = SCENES.find((s) => sec >= s.start && sec < s.end) ?? SCENES[SCENES.length - 1];
  const activeBeatIdx = scene.heroBeats.reduce((acc, b, idx) => (sec >= b.at ? idx : acc), 0);
  const beat = scene.heroBeats[activeBeatIdx] ?? scene.heroBeats[0];

  return (
    <AbsoluteFill style={{ backgroundColor: '#050814', overflow: 'hidden' }}>
      {/* 1. Dynamic Theme Backdrop */}
      {scene.theme === 'dark' ? (
        <DarkTwilightBackdrop sec={sec} />
      ) : (
        <PaperBlueprintBackdrop
          figCode={scene.id === 2 ? 'FIG 02 // DOUBLE-SLIT LAB' : 'FIG 04 // PARALLEL REALITY'}
        />
      )}

      {/* 2. Story-Synced 2D Vector Motion Graphics Stage */}
      {scene.id === 1 && <SceneOneVisual sec={sec} frame={frame} />}
      {scene.id === 2 && <SceneTwoVisual sec={sec} frame={frame} />}
      {scene.id === 3 && <SceneThreeVisual sec={sec} frame={frame} />}
      {scene.id === 4 && <SceneFourVisual sec={sec} frame={frame} />}

      {/* 3. Top Story Progress Bar & Hero Headlines */}
      <TopTimelineBar sec={sec} activeScene={scene} />
      <HeroOverlay beat={beat} beatAt={beat.at} theme={scene.theme} frame={frame} />

      {/* 4. Bottom Word-Synced Karaoke Captions */}
      <CaptionOverlay scene={scene} sec={sec} />

      {/* 5. Audio Track */}
      <Audio src={staticFile('voice.mp3')} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={ReelVideo}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);

export default RemotionRoot;
