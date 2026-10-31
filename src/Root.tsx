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
// 01. GLOBAL CONFIG & 4 MAIN NARRATION SCENES (WITH 12 RAPID VISUAL CUTS)
// ============================================================================

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2494; // 41.566 seconds @ 60 FPS

const SCENES = [
  {
    id: 1,
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
        at: 2.6,
        tag: 'GAME ENGINE OPTIMIZATION',
        line1: 'FOV RADAR',
        line2: 'CHUNK LOADING ⚡',
        accent: '#d93829',
      },
      {
        at: 5.2,
        tag: 'OBSERVER RENDERING RULE',
        line1: 'NOT SEEN =',
        line2: 'DOES NOT EXIST!',
        accent: '#ff9f43',
      },
    ],
  },
  {
    id: 2,
    start: 8.0,
    end: 22.5,
    speechStart: 8.10,
    speechEnd: 22.40,
    caption:
      'Science mein ise Double-Slit Experiment kehte hain. Isme jab electrons ya light particles ko chhoda jata hai, toh jab tak koi observer ya camera unhein nahi dekhta, woh waves ki tarah phail jaate hain. Par jaise hi aap unhein observe karne ki koshish karte hain, woh achanak solid particles ban jate hain!',
    heroBeats: [
      {
        at: 8.0,
        tag: 'QUANTUM LAB // FIG 01',
        line1: 'DOUBLE-SLIT',
        line2: 'EXPERIMENT 🔬',
        accent: '#d93829',
      },
      {
        at: 11.5,
        tag: 'NO OBSERVER WATCHING',
        line1: 'SPREADS LIKE',
        line2: 'WATER WAVES 🌊',
        accent: '#00e5ff',
      },
      {
        at: 14.8,
        tag: 'INTERFERENCE FRINGES',
        line1: 'MULTI-STRIPE',
        line2: 'WAVE PATTERN 📊',
        accent: '#d93829',
      },
      {
        at: 17.8,
        tag: 'QUANTUM SENSOR ACTIVE',
        line1: 'CAMERA DROPS',
        line2: 'ON THE SLITS! 🚨',
        accent: '#ff5252',
      },
      {
        at: 20.2,
        tag: 'WAVEFUNCTION COLLAPSE',
        line1: 'BECOMES 2 SOLID',
        line2: 'PARTICLES! ⚡',
        accent: '#d93829',
      },
    ],
  },
  {
    id: 3,
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
        accent: '#d93829',
      },
    ],
  },
  {
    id: 4,
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
        accent: '#00e5ff',
      },
      {
        at: 35.8,
        tag: 'TAG THEM IN COMMENTS',
        line1: 'NO CLUE ABOUT',
        line2: 'REAL DUNIYA 👇',
        accent: '#d93829',
      },
    ],
  },
] as const;

type Scene = (typeof SCENES)[number];
type HeroBeat = Scene['heroBeats'][number];

// Rapid visual cutaways every ~2.6s - 3.5s so background & stage constantly change!
const CUTS = [
  { cutId: 1, start: 0.0, end: 2.6, theme: 'dark' as const, code: 'CUT 01 // GAME ENGINE' },
  { cutId: 2, start: 2.6, end: 5.2, theme: 'paper' as const, code: 'CUT 02 // FOV CULLING' },
  { cutId: 3, start: 5.2, end: 8.0, theme: 'dark' as const, code: 'CUT 03 // EYE TEST' },
  { cutId: 4, start: 8.0, end: 11.5, theme: 'paper' as const, code: 'CUT 04 // ELECTRON GUN' },
  { cutId: 5, start: 11.5, end: 14.8, theme: 'dark' as const, code: 'CUT 05 // WAVE TANK' },
  { cutId: 6, start: 14.8, end: 17.8, theme: 'paper' as const, code: 'CUT 06 // WAVE GRAPH' },
  { cutId: 7, start: 17.8, end: 20.2, theme: 'dark' as const, code: 'CUT 07 // SENSOR ALARM' },
  { cutId: 8, start: 20.2, end: 22.5, theme: 'paper' as const, code: 'CUT 08 // 2 SOLID BARS' },
  { cutId: 9, start: 22.5, end: 26.5, theme: 'dark' as const, code: 'CUT 09 // RENDER CARDS' },
  { cutId: 10, start: 26.5, end: 30.0, theme: 'paper' as const, code: 'CUT 10 // PART 2 VAULT' },
  { cutId: 11, start: 30.0, end: 35.8, theme: 'dark' as const, code: 'CUT 11 // FRIEND LINEUP' },
  { cutId: 12, start: 35.8, end: 41.6, theme: 'paper' as const, code: 'CUT 12 // TAG FRIEND' },
] as const;

type Theme = 'dark' | 'paper';

// ============================================================================
// 02. MATH & SPRING HELPERS
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

const popSpring = (frame: number, startSec: number, damping = 13, stiffness = 170) =>
  spring({
    frame: Math.max(0, frame - Math.round(startSec * FPS)),
    fps: FPS,
    config: { damping, stiffness, mass: 0.7 },
  });

const STARS = Array.from({ length: 75 }, (_, i) => ({
  x: (i * 137.5) % WIDTH,
  y: (i * 89.3) % 1340,
  r: 1 + (i % 3) * 0.6,
  phase: i * 0.8,
}));

// ============================================================================
// 03. LAYER 1 (zIndex: 1): DYNAMIC BACKDROPS
// ============================================================================

const DarkBackdropLayer: React.FC<{ sec: number; code: string }> = ({ sec, code }) => (
  <AbsoluteFill style={{ zIndex: 1 }}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <linearGradient id="bgDarkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060916" />
          <stop offset="55%" stopColor="#111936" />
          <stop offset="82%" stopColor="#231f3d" />
          <stop offset="100%" stopColor="#060812" />
        </linearGradient>
        <linearGradient id="bgWaterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15223d" />
          <stop offset="100%" stopColor="#05070f" />
        </linearGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#bgDarkGrad)" />

      {STARS.map((s, idx) => (
        <circle
          key={idx}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#d9f7ff"
          opacity={0.25 + 0.6 * Math.abs(Math.sin(sec * 2 + s.phase))}
        />
      ))}

      {/* Center Stage Frame Box so visuals pop clearly */}
      <rect
        x="46"
        y="400"
        width="988"
        height="1120"
        rx="28"
        fill="rgba(7, 13, 29, 0.55)"
        stroke="rgba(0, 229, 255, 0.28)"
        strokeWidth="2"
      />

      {/* Horizon Skyline at bottom of stage */}
      <g fill="#080c18" opacity="0.85">
        {Array.from({ length: 24 }, (_, i) => {
          const bh = 30 + ((i * 29) % 70);
          return <rect key={i} x={56 + i * 40} y={1360 - bh} width="34" height={bh} />;
        })}
      </g>
      <rect x="48" y="1360" width="984" height="158" rx="18" fill="url(#bgWaterGrad)" opacity="0.85" />
      <line x1="48" y1="1360" x2="1032" y2="1360" stroke="#00e5ff" strokeWidth="1.5" opacity="0.4" />

      {/* Top Metadata Strip */}
      <rect x="76" y="424" width="270" height="32" rx="6" fill="rgba(0, 229, 255, 0.14)" />
      <text x="211" y="445" fill="#00e5ff" fontSize="14" fontWeight="900" textAnchor="middle" letterSpacing="2">
        {code}
      </text>
      <text x="995" y="445" fill="#7fa6c4" fontSize="14" fontWeight="800" textAnchor="end" letterSpacing="2">
        60 FPS // QUANTUM HUD
      </text>
    </svg>
  </AbsoluteFill>
);

const PaperBackdropLayer: React.FC<{ code: string }> = ({ code }) => (
  <AbsoluteFill
    style={{
      zIndex: 1,
      background: 'linear-gradient(135deg, #f6f1e5 0%, #ece4d3 55%, #e1d6c0 100%)',
    }}
  >
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <pattern id="paperGridS" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#8c806e" strokeWidth="0.7" opacity="0.25" />
        </pattern>
        <pattern id="paperGridL" width="180" height="180" patternUnits="userSpaceOnUse">
          <path d="M 180 0 L 0 0 0 180" fill="none" stroke="#756958" strokeWidth="1.4" opacity="0.3" />
        </pattern>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#paperGridS)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#paperGridL)" />

      <rect
        x="46"
        y="400"
        width="988"
        height="1120"
        rx="20"
        fill="rgba(255, 252, 245, 0.45)"
        stroke="#3d352a"
        strokeWidth="2.5"
      />

      {/* Ruler ticks on left & right */}
      <g stroke="#4a4235" strokeWidth="1.5" opacity="0.55">
        {Array.from({ length: 40 }, (_, i) => {
          const y = 435 + i * 26;
          const major = i % 5 === 0;
          return (
            <React.Fragment key={i}>
              <line x1="46" y1={y} x2={46 + (major ? 20 : 9)} y2={y} />
              <line x1="1034" y1={y} x2={1034 - (major ? 20 : 9)} y2={y} />
            </React.Fragment>
          );
        })}
      </g>

      <rect x="76" y="424" width="270" height="32" rx="6" fill="#26211b" />
      <text x="211" y="445" fill="#f6f1e5" fontSize="14" fontWeight="900" textAnchor="middle" letterSpacing="2">
        {code}
      </text>
      <text x="995" y="445" fill="#5c5243" fontSize="14" fontWeight="800" textAnchor="end" letterSpacing="2">
        SCALE 1 : 10⁻⁹ NANOMETER
      </text>
    </svg>
  </AbsoluteFill>
);

// ============================================================================
// 04. SHARED VECTOR BADGES FOR THE STAGE
// ============================================================================

const StageBadge: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  title: string;
  sub?: string;
  accent?: string;
  dark?: boolean;
}> = ({ x, y, w, h = 76, title, sub, accent = '#00e5ff', dark = true }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      x={-w / 2}
      y={-h / 2}
      width={w}
      height={h}
      rx="16"
      fill={dark ? '#081226' : '#241f19'}
      stroke={accent}
      strokeWidth="3"
    />
    <text
      x="0"
      y={sub ? -4 : 8}
      fill="#ffffff"
      fontSize="25"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
      textAnchor="middle"
      letterSpacing="1"
    >
      {title}
    </text>
    {sub && (
      <text
        x="0"
        y={23}
        fill={accent}
        fontSize="15"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        textAnchor="middle"
        letterSpacing="2"
      >
        {sub}
      </text>
    )}
  </g>
);

const BanCircle: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={r} fill="rgba(217, 56, 41, 0.18)" stroke="#ff3b30" strokeWidth="10" />
    <line
      x1={-r * 0.68}
      y1={-r * 0.68}
      x2={r * 0.68}
      y2={r * 0.68}
      stroke="#ff3b30"
      strokeWidth="10"
      strokeLinecap="round"
    />
  </g>
);

// ============================================================================
// 05. LAYER 2 (zIndex: 10): 12 RAPID VISUAL CUTAWAYS (100% VISIBLE ON TOP!)
// ============================================================================

const AnimatedStageLayer: React.FC<{ cutId: number; sec: number; frame: number }> = ({
  cutId,
  sec,
  frame,
}) => {
  return (
    <AbsoluteFill style={{ zIndex: 10, pointerEvents: 'none' }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* =================================================================
            CUT 1 (0.0s - 2.6s): 3D ISOMETRIC GAME ENGINE & VOXEL CUBE
           ================================================================= */}
        {cutId === 1 && (
          <g transform={`translate(540 940) scale(${0.85 + popSpring(frame, 0.0) * 0.15})`}>
            <circle r="330" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="10 12" opacity="0.45" />
            <circle r="275" fill="none" stroke="#00e5ff" strokeWidth="3" opacity="0.75" />

            {/* Isometric Floor Grid */}
            <g transform="translate(0 95)" stroke="#00e5ff" strokeWidth="2" opacity="0.5">
              {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
                <React.Fragment key={i}>
                  <line x1={i * 55} y1="-110" x2={i * 80} y2="110" />
                  <line x1="-280" y1={i * 26} x2="280" y2={i * 26} />
                </React.Fragment>
              ))}
            </g>

            {/* Floating 3D Isometric Cube */}
            <g transform={`translate(0 ${-45 + Math.sin(sec * 5) * 16})`}>
              <polygon
                points="0,-145 130,-72 0,0 -130,-72"
                fill="#00e5ff"
                fillOpacity="0.35"
                stroke="#00e5ff"
                strokeWidth="5"
              />
              <polygon
                points="-130,-72 0,0 0,145 -130,72"
                fill="#009db3"
                fillOpacity="0.45"
                stroke="#00e5ff"
                strokeWidth="5"
              />
              <polygon
                points="130,-72 0,0 0,145 130,72"
                fill="#074f6b"
                fillOpacity="0.65"
                stroke="#00e5ff"
                strokeWidth="5"
              />
              <circle cx="0" cy="0" r="18" fill="#ffffff" />
            </g>

            <StageBadge
              x={-235}
              y={-285}
              w={330}
              title="ENGINE: UNIVERSE"
              sub="60 FPS // SIMULATION"
              accent="#00e5ff"
            />
            <StageBadge
              x={235}
              y={-285}
              w={330}
              title="GRAPHICS: QUANTUM"
              sub="ON-DEMAND RENDER ⚡"
              accent="#00ff9d"
            />
            <StageBadge
              x={0}
              y={310}
              w={680}
              title="REALITY WORKS LIKE A VIDEO GAME 🎮"
              sub="OBJECTS LOAD ONLY WHEN PLAYER LOOKS"
              accent="#00e5ff"
            />
          </g>
        )}

        {/* =================================================================
            CUT 2 (2.6s - 5.2s): RADAR FOV FRUSTUM CULLING (CHUNK LOADING)
           ================================================================= */}
        {cutId === 2 && (
          <g transform={`translate(540 930) scale(${0.86 + popSpring(frame, 2.6) * 0.14})`}>
            <circle r="335" fill="#f2ead9" stroke="#241f19" strokeWidth="5" />
            <circle r="250" fill="none" stroke="#786d5c" strokeWidth="2" strokeDasharray="8 8" />
            <circle r="155" fill="none" stroke="#786d5c" strokeWidth="2" strokeDasharray="8 8" />

            {/* Rotating Player FOV Radar Cone */}
            {(() => {
              const angle = -90 + Math.sin((sec - 2.6) * 2.6) * 55;
              const pLeft = polar(0, 0, 330, angle - 38);
              const pRight = polar(0, 0, 330, angle + 38);
              return (
                <g>
                  <path
                    d={`M 0 0 L ${pLeft.x} ${pLeft.y} A 330 330 0 0 1 ${pRight.x} ${pRight.y} Z`}
                    fill="rgba(0, 168, 150, 0.26)"
                    stroke="#008b9b"
                    strokeWidth="4"
                  />
                  {/* Objects around map: solid inside cone, ghost outside */}
                  {Array.from({ length: 12 }, (_, i) => {
                    const objDeg = i * 30 - 150;
                    const pos = polar(0, 0, 215, objDeg);
                    const inView = Math.abs(objDeg - angle) < 40;
                    return (
                      <g key={i} transform={`translate(${pos.x} ${pos.y})`}>
                        {inView ? (
                          <g>
                            <rect
                              x="-24"
                              y="-24"
                              width="48"
                              height="48"
                              rx="10"
                              fill="#d93829"
                              stroke="#241f19"
                              strokeWidth="3"
                            />
                            <text y="6" fill="#ffffff" fontSize="20" fontWeight="900" textAnchor="middle">
                              3D
                            </text>
                          </g>
                        ) : (
                          <circle
                            r="18"
                            fill="none"
                            stroke="#8c7f6a"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })()}

            <circle r="34" fill="#241f19" stroke="#d93829" strokeWidth="5" />
            <text y="8" fill="#ffffff" fontSize="22" fontWeight="900" textAnchor="middle">
              👀
            </text>

            <StageBadge
              x={0}
              y={-355}
              w={640}
              title="FRUSTUM CULLING: SAVING MEMORY"
              sub="GREEN CONE = RENDERED // OUTSIDE = UNLOADED"
              accent="#d93829"
              dark={false}
            />
            <StageBadge
              x={0}
              y={365}
              w={700}
              title="JAB TAK NAHI DEKHTE = UNRENDERED! ⚡"
              sub="EXACTLY LIKE GTA OR MINECRAFT CHUNKS"
              accent="#008b9b"
              dark={false}
            />
          </g>
        )}

        {/* =================================================================
            CUT 3 (5.2s - 8.0s): SPLIT-SCREEN EYE TEST (SEEN VS NOT SEEN)
           ================================================================= */}
        {cutId === 3 && (
          <g transform={`translate(540 935) scale(${0.86 + popSpring(frame, 5.2) * 0.14})`}>
            <rect
              x="-440"
              y="-340"
              width="420"
              height="620"
              rx="26"
              fill="#0a162e"
              stroke="#00ff9d"
              strokeWidth="4"
            />
            <rect
              x="20"
              y="-340"
              width="420"
              height="620"
              rx="26"
              fill="#170d1c"
              stroke="#ff5252"
              strokeWidth="4"
            />

            {/* LEFT CARD: EYE OPEN = SOLID */}
            <g transform="translate(-230 0)">
              <text y="-265" fill="#00ff9d" fontSize="26" fontWeight="900" textAnchor="middle">
                EYE OPEN 👀
              </text>
              <path
                d="M -85 -150 Q 0 -210 85 -150 Q 0 -90 -85 -150 Z"
                fill="#061224"
                stroke="#00e5ff"
                strokeWidth="5"
              />
              <circle cx="0" cy="-150" r="24" fill="#00e5ff" />
              <polygon points="0,-120 -130,60 130,60" fill="rgba(0, 229, 255, 0.18)" />
              <circle cx="0" cy="60" r="82" fill="#00e5ff" stroke="#ffffff" strokeWidth="5" />
              <text y="68" fill="#061224" fontSize="26" fontWeight="900" textAnchor="middle">
                SOLID
              </text>
              <text y="210" fill="#00ff9d" fontSize="28" fontWeight="900" textAnchor="middle">
                EXISTS ✅
              </text>
            </g>

            {/* RIGHT CARD: EYE CLOSED = DOES NOT EXIST */}
            <g transform="translate(230 0)">
              <text y="-265" fill="#ff5252" fontSize="26" fontWeight="900" textAnchor="middle">
                EYE CLOSED 🙈
              </text>
              <path
                d="M -85 -150 Q 0 -95 85 -150"
                fill="none"
                stroke="#ff5252"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle
                cx="0"
                cy="60"
                r="82"
                fill="none"
                stroke="#8e9bb0"
                strokeWidth="4"
                strokeDasharray="10 10"
              />
              <BanCircle cx={0} cy={60} r={96} />
              <text y="210" fill="#ff5252" fontSize="28" fontWeight="900" textAnchor="middle">
                NO EXISTENCE ❌
              </text>
            </g>

            <StageBadge
              x={0}
              y={355}
              w={760}
              title="WOH CHEEZ EXIST HI NAHI KARTI! 🤯"
              sub="QUANTUM OBSERVER PARADOX"
              accent="#ff9f43"
            />
          </g>
        )}

        {/* =================================================================
            CUT 4 (8.0s - 11.5s): PAPER BLUEPRINT ELECTRON CANNON & 2 SLITS
           ================================================================= */}
        {cutId === 4 && (
          <g transform={`translate(0 0) scale(${0.92 + popSpring(frame, 8.0) * 0.08})`} style={{ transformOrigin: '540px 950px' }}>
            <StageBadge
              x={540}
              y={525}
              w={740}
              title="YOUNG'S DOUBLE-SLIT APPARATUS"
              sub="FIRING ELECTRONS & LIGHT PHOTONS"
              accent="#d93829"
              dark={false}
            />

            {/* Giant Detailed Electron Cannon on Left */}
            <g transform="translate(230 960)">
              <path d="M -60 140 L 0 40 L 60 140" fill="none" stroke="#241f19" strokeWidth="10" />
              <line x1="-90" y1="140" x2="90" y2="140" stroke="#241f19" strokeWidth="10" />
              <rect x="-120" y="-75" width="210" height="150" rx="22" fill="#241f19" stroke="#d93829" strokeWidth="6" />
              <rect x="90" y="-32" width="75" height="64" rx="10" fill="#d93829" />
              <circle cx="-15" cy="0" r="38" fill="#ff9f43" />
              <text x="-15" y="8" fill="#241f19" fontSize="24" fontWeight="900" textAnchor="middle">
                e⁻
              </text>
              <text x="0" y="195" fill="#241f19" fontSize="24" fontWeight="900" textAnchor="middle">
                ELECTRON GUN
              </text>
            </g>

            {/* Firing Particle Stream */}
            {[0, 0.25, 0.5, 0.75].map((off, i) => {
              const p = ((sec - 8.0) * 1.8 + off) % 1;
              const px = mix(410, 740, p);
              const py = 960 + (i % 2 === 0 ? -95 : 95) * p;
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r="14" fill="#d93829" />
                  <circle cx={px} cy={py} r="24" fill="none" stroke="#d93829" strokeWidth="3" opacity={1 - p} />
                </g>
              );
            })}

            {/* Double-Slit Titanium Barrier on Right */}
            <g transform="translate(770 960)">
              <rect x="-22" y="-330" width="44" height="190" rx="6" fill="#241f19" />
              <rect x="-22" y="-50" width="44" height="100" rx="6" fill="#241f19" />
              <rect x="-22" y="140" width="44" height="190" rx="6" fill="#241f19" />
              <rect x="-16" y="-140" width="32" height="90" fill="#00e5ff" opacity="0.7" />
              <rect x="-16" y="50" width="32" height="90" fill="#00e5ff" opacity="0.7" />
              <text x="85" y="-85" fill="#d93829" fontSize="25" fontWeight="900">
                ⬅ SLIT 1
              </text>
              <text x="85" y="105" fill="#d93829" fontSize="25" fontWeight="900">
                ⬅ SLIT 2
              </text>
              <text x="0" y="380" fill="#241f19" fontSize="24" fontWeight="900" textAnchor="middle">
                2-SLIT WALL
              </text>
            </g>
          </g>
        )}

        {/* =================================================================
            CUT 5 (11.5s - 14.8s): DARK QUANTUM RIPPLE TANK (WAVES SPREADING)
           ================================================================= */}
        {cutId === 5 && (
          <g transform={`translate(0 0) scale(${0.92 + popSpring(frame, 11.5) * 0.08})`} style={{ transformOrigin: '540px 950px' }}>
            <StageBadge
              x={540}
              y={525}
              w={700}
              title="NO CAMERA // NO OBSERVER 📵"
              sub="ELECTRONS TRANSFORM INTO PROBABILITY WAVES"
              accent="#00e5ff"
            />

            {/* Barrier at Left (x=230) */}
            <g transform="translate(230 960)">
              <rect x="-16" y="-320" width="32" height="190" fill="#00e5ff" />
              <rect x="-16" y="-50" width="32" height="100" fill="#00e5ff" />
              <rect x="-16" y="130" width="32" height="190" fill="#00e5ff" />
            </g>

            {/* Expanding Dual Circular Wavefronts from Slit 1 (y=870) and Slit 2 (y=1050) */}
            <g fill="none">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const r = (((sec - 11.5) * 140 + i * 75) % 540) + 20;
                const op = clamp(1 - r / 550, 0.12, 0.95);
                return (
                  <React.Fragment key={i}>
                    <path
                      d={`M 248 ${870 - r} A ${r} ${r} 0 0 1 248 ${870 + r}`}
                      stroke="#00e5ff"
                      strokeWidth="4.5"
                      opacity={op}
                    />
                    <path
                      d={`M 248 ${1050 - r} A ${r} ${r} 0 0 1 248 ${1050 + r}`}
                      stroke="#00ff9d"
                      strokeWidth="4.5"
                      opacity={op}
                    />
                  </React.Fragment>
                );
              })}
            </g>

            {/* Detector Screen on Right (x=860) */}
            <rect x="850" y="640" width="30" height="640" rx="8" fill="#102542" stroke="#00e5ff" strokeWidth="4" />

            <StageBadge
              x={540}
              y={1415}
              w={760}
              title="WAVES KI TARAH PHAIL JAATE HAIN! 🌊"
              sub="PASSING THROUGH BOTH SLITS AT THE SAME TIME"
              accent="#00ff9d"
            />
          </g>
        )}

        {/* =================================================================
            CUT 6 (14.8s - 17.8s): PAPER INTERFERENCE ZEBRA BANDS & GRAPH
           ================================================================= */}
        {cutId === 6 && (
          <g transform={`translate(540 940) scale(${0.88 + popSpring(frame, 14.8) * 0.12})`}>
            <StageBadge
              x={0}
              y={-390}
              w={740}
              title="DETECTOR WALL: WAVE INTERFERENCE"
              sub="MULTIPLE BRIGHT & DARK ZEBRA BANDS"
              accent="#d93829"
              dark={false}
            />

            {/* Detector Wall Zebra Pattern */}
            <rect x="-410" y="-260" width="820" height="240" rx="18" fill="#1e1b17" stroke="#d93829" strokeWidth="5" />
            {[-330, -248, -165, -82, 0, 82, 165, 248, 330].map((bx, i) => {
              const dist = Math.abs(i - 4);
              const alpha = 1 - dist * 0.18;
              return (
                <rect
                  key={i}
                  x={bx - 24}
                  y="-235"
                  width="48"
                  height="190"
                  rx="8"
                  fill={i % 2 === 0 ? '#00e5ff' : '#d93829'}
                  opacity={alpha}
                />
              );
            })}

            {/* Live Oscillating Wave Intensity Curve Below */}
            <path
              d={Array.from({ length: 85 }, (_, i) => {
                const x = -390 + (i / 84) * 780;
                const env = Math.cos(((i - 42) / 42) * (Math.PI / 2));
                const y =
                  160 -
                  Math.abs(Math.cos(i * 0.38 + sec * 6)) * 165 * env * env;
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              }).join(' ')}
              fill="none"
              stroke="#d93829"
              strokeWidth="6"
            />
            <line x1="-400" y1="165" x2="400" y2="165" stroke="#241f19" strokeWidth="4" />

            <StageBadge
              x={0}
              y={330}
              w={740}
              title="9+ INTERFERENCE STRIPES = WAVE PROOF 📊"
              sub="P(x) = |Ψ₁ + Ψ₂|² SUPERPOSITION"
              accent="#008b9b"
              dark={false}
            />
          </g>
        )}

        {/* =================================================================
            CUT 7 (17.8s - 20.2s): DARK ROBOTIC CAMERA DROP & WAVE SHATTER!
           ================================================================= */}
        {cutId === 7 && (
          <g transform={`translate(540 930) scale(${0.86 + popSpring(frame, 17.8) * 0.14})`}>
            {/* Giant Robotic Eye Sensor Dropping from Top */}
            <line x1="0" y1="-480" x2="0" y2="-180" stroke="#ff5252" strokeWidth="14" />
            <rect
              x="-190"
              y="-210"
              width="380"
              height="190"
              rx="38"
              fill="#141d33"
              stroke="#ff5252"
              strokeWidth="6"
            />
            <circle cx="0" cy="-115" r="68" fill="#060a14" stroke="#ff5252" strokeWidth="5" />
            <circle cx="0" cy="-115" r="28" fill="#ff5252" />

            {/* Red Laser Scanning Cone */}
            <polygon points="-130,-20 130,-20 340,320 -340,320" fill="rgba(255, 82, 82, 0.24)" />
            <line x1="-130" y1="-20" x2="-340" y2="320" stroke="#ff5252" strokeWidth="4" strokeDasharray="10 10" />
            <line x1="130" y1="-20" x2="340" y2="320" stroke="#ff5252" strokeWidth="4" strokeDasharray="10 10" />

            {/* Shattered Wave Fragments Disappearing */}
            <BanCircle cx={0} cy={145} r={115} />

            <StageBadge
              x={0}
              y={-360}
              w={680}
              title="🚨 OBSERVER CAMERA ACTIVATED!"
              sub="WATCHING WHICH SLIT THE ELECTRON TAKES"
              accent="#ff5252"
            />
            <StageBadge
              x={0}
              y={355}
              w={740}
              title="WAVES INSTANTLY VANISH / COLLAPSE! 💥"
              sub="QUANTUM MEASUREMENT DISTURBANCE"
              accent="#ffd166"
            />
          </g>
        )}

        {/* =================================================================
            CUT 8 (20.2s - 22.5s): PAPER BALLISTIC COLLAPSE TO 2 SOLID BARS!
           ================================================================= */}
        {cutId === 8 && (
          <g transform={`translate(540 940) scale(${0.86 + popSpring(frame, 20.2) * 0.14})`}>
            <StageBadge
              x={0}
              y={-390}
              w={740}
              title="WAVEFUNCTION COLLAPSED! ⚡"
              sub="ELECTRONS ACT LIKE SOLID MARBLE BULLETS"
              accent="#d93829"
              dark={false}
            />

            {/* Detector Wall with ONLY TWO SOLID BARS */}
            <rect x="-410" y="-230" width="820" height="340" rx="22" fill="#1e1b17" stroke="#241f19" strokeWidth="6" />

            {/* Left Solid Bar (Slit 1) */}
            <rect x="-215" y="-185" width="95" height="250" rx="12" fill="#d93829" stroke="#ffffff" strokeWidth="4" />
            <text x="-167" y="110" fill="#d93829" fontSize="26" fontWeight="900" textAnchor="middle">
              BAR 01
            </text>

            {/* Right Solid Bar (Slit 2) */}
            <rect x="120" y="-185" width="95" height="250" rx="12" fill="#d93829" stroke="#ffffff" strokeWidth="4" />
            <text x="167" y="110" fill="#d93829" fontSize="26" fontWeight="900" textAnchor="middle">
              BAR 02
            </text>

            {/* Incoming Solid Bullet Lines */}
            <line x1="-167" y1="270" x2="-167" y2="65" stroke="#d93829" strokeWidth="12" strokeDasharray="18 12" />
            <line x1="167" y1="270" x2="167" y2="65" stroke="#d93829" strokeWidth="12" strokeDasharray="18 12" />

            <StageBadge
              x={0}
              y={340}
              w={760}
              title="ACHANAK 2 SOLID PARTICLES BAN JATE HAIN!"
              sub="NO WAVES // STRICTLY 2 PARTICLE BANDS"
              accent="#d93829"
              dark={false}
            />
          </g>
        )}

        {/* =================================================================
            CUT 9 (22.5s - 26.5s): TECHDE 3 GLASSMORPHIC CARDS & GPU BAR
           ================================================================= */}
        {cutId === 9 && (
          <g transform="translate(0 25)">
            {[
              { title: 'NO OBSERVER', sub: 'WAVES SPREAD', icon: '🌊', col: '#ff5252', t: 22.55, ban: true },
              { title: 'CAMERA ON', sub: 'PARTICLE LOCK', icon: '📹', col: '#00e5ff', t: 23.0, ban: false },
              { title: 'SOLID WORLD', sub: '100% RENDERED', icon: '🧱', col: '#00ff9d', t: 23.45, ban: false },
            ].map((c, idx) => {
              const s = popSpring(frame, c.t);
              const cx = 210 + idx * 330;
              return (
                <g key={idx} transform={`translate(${cx} 860) scale(${0.75 + s * 0.25})`}>
                  <rect
                    x="-145"
                    y="-210"
                    width="290"
                    height="420"
                    rx="28"
                    fill="#0b162e"
                    stroke={c.col}
                    strokeWidth="4"
                  />
                  <circle cx="0" cy="-55" r="76" fill="rgba(255,255,255,0.06)" stroke={c.col} strokeWidth="3" />
                  <text x="0" y="-30" fontSize="70" textAnchor="middle">
                    {c.icon}
                  </text>
                  {c.ban && <BanCircle cx={0} cy={-55} r={82} />}
                  <text x="0" y="95" fill="#ffffff" fontSize="28" fontWeight="900" textAnchor="middle">
                    {c.title}
                  </text>
                  <text x="0" y="135" fill={c.col} fontSize="19" fontWeight="800" textAnchor="middle">
                    {c.sub}
                  </text>
                </g>
              );
            })}

            {/* Live Reality Render Progress Bar */}
            {(() => {
              const pct = Math.round(interp(sec, [22.8, 25.8], [12, 100]));
              return (
                <g transform="translate(540 1265)">
                  <rect x="-410" y="-55" width="820" height="110" rx="20" fill="#081226" stroke="#00ff9d" strokeWidth="3" />
                  <rect x="-380" y="8" width={7.6 * pct} height="24" rx="12" fill="#00ff9d" />
                  <text x="0" y="-12" fill="#ffffff" fontSize="26" fontWeight="900" textAnchor="middle">
                    UNIVERSE REALITY RENDERING: {pct}% ⚡
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* =================================================================
            CUT 10 (26.5s - 30.0s): PAPER QUANTUM CLOCK & PART 2 VAULT
           ================================================================= */}
        {cutId === 10 && (
          <g transform={`translate(540 935) scale(${0.86 + popSpring(frame, 26.5) * 0.14})`}>
            <circle r="275" fill="#241f19" stroke="#d93829" strokeWidth="8" />
            <circle r="235" fill="none" stroke="#ffcf74" strokeWidth="3" strokeDasharray="10 10" />

            {Array.from({ length: 12 }, (_, i) => {
              const p1 = polar(0, 0, 195, i * 30);
              const p2 = polar(0, 0, 225, i * 30);
              return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ffcf74" strokeWidth="5" />;
            })}

            {/* Rotating Vault / Clock Hands */}
            <line
              x1="0"
              y1="0"
              x2={polar(0, 0, 155, (sec - 26.5) * 240).x}
              y2={polar(0, 0, 155, (sec - 26.5) * 240).y}
              stroke="#00e5ff"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <line
              x1="0"
              y1="0"
              x2={polar(0, 0, 110, (sec - 26.5) * 75).x}
              y2={polar(0, 0, 110, (sec - 26.5) * 75).y}
              stroke="#d93829"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle r="36" fill="#d93829" />
            <text y="12" fontSize="34" textAnchor="middle">
              🔓
            </text>

            <StageBadge
              x={0}
              y={-365}
              w={660}
              title="MIND-BENDING QUANTUM MYSTERY"
              sub="HOW DO PARTICLES KNOW WE ARE WATCHING?"
              accent="#d93829"
              dark={false}
            />
            <StageBadge
              x={0}
              y={365}
              w={740}
              title="ISKA RAAZ BATAYENGE PART 2 MEIN! 🔥"
              sub="SUBSCRIBE & STAY TUNED FOR PART 2"
              accent="#d93829"
              dark={false}
            />
          </g>
        )}

        {/* =================================================================
            CUT 11 (30.0s - 35.8s): TECHDE 7 HUMAN SILHOUETTES LINEUP
           ================================================================= */}
        {cutId === 11 && (
          <g transform={`translate(0 20) scale(${0.9 + popSpring(frame, 30.0) * 0.1})`} style={{ transformOrigin: '540px 950px' }}>
            {/* Earth Horizon Floor */}
            <line x1="90" y1="1120" x2="990" y2="1120" stroke="#00e5ff" strokeWidth="4" />
            <text x="540" y="1168" fill="#9bc2de" fontSize="20" fontWeight="900" textAnchor="middle" letterSpacing="4">
              REAL DUNIYA // NORMAL FRIENDS ON EARTH
            </text>

            {/* 7 Friends Lineup: Middle Friend Levitating in Parallel Portal! */}
            {[-3, -2, -1, 0, 1, 2, 3].map((idx) => {
              const x = 540 + idx * 122;
              const isLost = idx === 0;
              const y = isLost ? 810 + Math.sin(sec * 5) * 20 : 1040;
              const col = isLost ? '#ff5252' : '#3b5278';

              return (
                <g key={idx} transform={`translate(${x} ${y}) scale(${isLost ? 1.22 : 0.95})`}>
                  {isLost && (
                    <ellipse
                      cx="0"
                      cy="-35"
                      rx="78"
                      ry="125"
                      fill="rgba(0, 229, 255, 0.14)"
                      stroke="#00e5ff"
                      strokeWidth="3"
                      strokeDasharray="8 8"
                    />
                  )}
                  <circle cx="0" cy="-115" r="28" fill={col} />
                  <path
                    d="M -32 -78 C -32 -84 32 -84 32 -78 L 48 -5 L 30 0 L 22 -52 L 16 -52 L 26 75 L 4 75 L 0 5 L -4 75 L -26 75 L -16 -52 L -22 -52 L -30 0 L -48 -5 Z"
                    fill={col}
                  />
                  {isLost && <rect x="-24" y="-124" width="48" height="16" rx="5" fill="#00e5ff" />}
                </g>
              );
            })}

            <StageBadge
              x={540}
              y={540}
              w={680}
              title="PARALLEL REALITY FRIEND 🛸"
              sub="FLOATING IN ANOTHER DIMENSION"
              accent="#ff5252"
            />
            <StageBadge
              x={540}
              y={1315}
              w={740}
              title="JISE REAL DUNIYA KI KOI KHABAR NAHI! 😂"
              sub="ALWAYS LOST IN THEIR OWN MULTIVERSE"
              accent="#00e5ff"
            />
          </g>
        )}

        {/* =================================================================
            CUT 12 (35.8s - 41.56s): LOST FRIEND RADAR & YOUTUBE COMMENT BOX
           ================================================================= */}
        {cutId === 12 && (
          <g transform={`translate(540 920) scale(${0.88 + popSpring(frame, 35.8) * 0.12})`}>
            {/* Radar Target Around Lost Friend */}
            <circle cy="-120" r="175" fill="#241f19" stroke="#d93829" strokeWidth="6" />
            <circle cy="-120" r="135" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="8 8" />

            {/* Floating Lost Friend Inside Radar */}
            <g transform={`translate(0 ${-95 + Math.sin(sec * 6) * 10})`}>
              <circle cx="0" cy="-85" r="32" fill="#d93829" />
              <rect x="-26" y="-95" width="52" height="18" rx="6" fill="#00e5ff" />
              <path d="M -42 -42 C -42 -42 42 -42 42 -42 L 55 45 L -55 45 Z" fill="#d93829" />
            </g>

            <StageBadge
              x={-275}
              y={-240}
              w={310}
              title="REAL WORLD: 0%"
              sub="NO AWARENESS"
              accent="#d93829"
              dark={false}
            />
            <StageBadge
              x={275}
              y={-240}
              w={310}
              title="BRAIN: SPACE 🪐"
              sub="PARALLEL UNIVERSE"
              accent="#008b9b"
              dark={false}
            />

            {/* Live Typing YouTube Comment Box */}
            {(() => {
              const t = clamp((sec - 36.2) / 3.2);
              const text = '@tag_your_parallel_friend 😂👇'.slice(
                0,
                Math.floor(t * '@tag_your_parallel_friend 😂👇'.length)
              );
              return (
                <g transform="translate(0 225)">
                  <rect
                    x="-410"
                    y="-95"
                    width="820"
                    height="190"
                    rx="26"
                    fill="#1e1b17"
                    stroke="#d93829"
                    strokeWidth="5"
                  />
                  <circle cx="-340" cy="-30" r="26" fill="#d93829" />
                  <text x="-340" y="-21" fontSize="24" textAnchor="middle">
                    💬
                  </text>
                  <text x="-290" y="-20" fill="#e0d4be" fontSize="20" fontWeight="900" letterSpacing="1.5">
                    YouTube Comments · Tag Your Lost Friend!
                  </text>
                  <line x1="-365" y1="10" x2="365" y2="10" stroke="#4a4135" strokeWidth="2" />
                  <text x="-360" y="62" fill="#ffffff" fontSize="32" fontWeight="900">
                    {text}
                    <tspan fill="#00e5ff">{t < 1 ? '▍' : ''}</tspan>
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================================
// 06. LAYER 3 (zIndex: 20): TOP TIMELINE & HERO HEADLINES
// ============================================================================

const TopHeroLayer: React.FC<{
  beat: HeroBeat;
  beatAt: number;
  theme: Theme;
  frame: number;
  sec: number;
}> = ({ beat, beatAt, theme, frame, sec }) => {
  const age = Math.max(0, frame - Math.round(beatAt * FPS));
  const pop = spring({
    frame: age,
    fps: FPS,
    config: { damping: 13, stiffness: 165, mass: 0.7 },
  });
  const isPaper = theme === 'paper';

  return (
    <AbsoluteFill style={{ zIndex: 20, pointerEvents: 'none' }}>
      {/* Top 12-Cut Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 46,
          right: 46,
          display: 'flex',
          gap: 6,
          height: 6,
        }}
      >
        {CUTS.map((c) => {
          const fill =
            sec >= c.end ? 1 : sec <= c.start ? 0 : clamp((sec - c.start) / (c.end - c.start));
          return (
            <div
              key={c.cutId}
              style={{
                flex: 1,
                background: isPaper ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.2)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: '100%',
                  background: isPaper ? '#d93829' : '#00e5ff',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Dynamic Hero Title */}
      <div
        style={{
          position: 'absolute',
          top: 86,
          left: 44,
          right: 44,
          transform: `scale(${0.86 + pop * 0.14})`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 14,
            marginBottom: 12,
          }}
        >
          <span style={{ width: 38, height: 3, background: beat.accent }} />
          <span
            style={{
              padding: '6px 18px',
              borderRadius: 100,
              background: isPaper ? 'rgba(36,31,25,0.1)' : 'rgba(0,229,255,0.14)',
              border: `2px solid ${beat.accent}`,
              color: isPaper ? '#241f19' : '#e2f7ff',
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

        <div
          style={{
            fontFamily: 'Arial Black, Impact, Arial, sans-serif',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -3,
            textTransform: 'uppercase',
            color: isPaper ? '#1e1a15' : '#ffffff',
            textShadow: isPaper ? '0 2px 0 rgba(255,255,255,0.4)' : '0 8px 28px rgba(0,0,0,0.75)',
          }}
        >
          <div style={{ fontSize: 70, whiteSpace: 'nowrap' }}>{beat.line1}</div>
          <div style={{ fontSize: 72, whiteSpace: 'nowrap', color: beat.accent, marginTop: 6 }}>
            {beat.line2}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 07. LAYER 4 (zIndex: 30): SYNCED BOTTOM KARAOKE CAPTIONS
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

const BottomCaptionLayer: React.FC<{ scene: Scene; theme: Theme; sec: number }> = ({
  scene,
  theme,
  sec,
}) => {
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
  const isPaper = theme === 'paper';
  const sceneProgress = clamp((sec - scene.speechStart) / (scene.speechEnd - scene.speechStart));

  return (
    <AbsoluteFill style={{ zIndex: 30, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 48,
          right: 48,
          top: 1580,
          minHeight: 175,
          borderRadius: 26,
          background: isPaper ? 'rgba(28, 24, 20, 0.97)' : 'rgba(7, 13, 28, 0.96)',
          border: `2.5px solid ${isPaper ? '#d93829' : '#00e5ff'}`,
          boxShadow: '0 20px 55px rgba(0,0,0,0.5)',
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
                }}
              >
                {item.word}
              </span>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 24,
            right: 24,
            height: 5,
            background: 'rgba(255,255,255,0.14)',
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
// 08. MAIN REEL COMPOSITION
// ============================================================================

const ReelVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const scene = SCENES.find((s) => sec >= s.start && sec < s.end) ?? SCENES[SCENES.length - 1];
  const currentCut = CUTS.find((c) => sec >= c.start && sec < c.end) ?? CUTS[CUTS.length - 1];

  const activeBeatIdx = scene.heroBeats.reduce((acc, b, idx) => (sec >= b.at ? idx : acc), 0);
  const beat = scene.heroBeats[activeBeatIdx] ?? scene.heroBeats[0];

  return (
    <AbsoluteFill style={{ backgroundColor: '#050814', overflow: 'hidden' }}>
      {/* LAYER 1 (zIndex: 1): Alternating Dark & Paper Backdrops */}
      {currentCut.theme === 'dark' ? (
        <DarkBackdropLayer sec={sec} code={currentCut.code} />
      ) : (
        <PaperBackdropLayer code={currentCut.code} />
      )}

      {/* LAYER 2 (zIndex: 10): 12 Animated Vector Cutaways (Guaranteed On Top!) */}
      <AnimatedStageLayer cutId={currentCut.cutId} sec={sec} frame={frame} />

      {/* LAYER 3 (zIndex: 20): Top Progress Bar & Dynamic Hero Headlines */}
      <TopHeroLayer
        beat={beat}
        beatAt={beat.at}
        theme={currentCut.theme}
        frame={frame}
        sec={sec}
      />

      {/* LAYER 4 (zIndex: 30): Bottom Word-Synced Captions */}
      <BottomCaptionLayer scene={scene} theme={currentCut.theme} sec={sec} />

      {/* Audio Track */}
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
