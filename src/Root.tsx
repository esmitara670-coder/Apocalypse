import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2064; // 34.4 seconds @ 60 FPS

interface SceneConfig {
  id: number;
  theme: 'dark' | 'paper';
  start: number;
  end: number;
  speechStart: number;
  speechEnd: number;
  tag: string;
  titleWhite: string;
  titleAccent: string;
  caption: string;
}

const SCENES: readonly SceneConfig[] = [
  {
    id: 1,
    theme: 'dark',
    start: 0.0,
    end: 4.2,
    speechStart: 0.10,
    speechEnd: 4.10,
    tag: 'SPACE TIME PARADOX',
    titleWhite: 'EARTH TO',
    titleAccent: 'DEEP SPACE',
    caption: "Kya aapko pata hai ki agar aap space mein lambe samay tak rehkar"
  },
  {
    id: 2,
    theme: 'paper',
    start: 4.2,
    end: 7.9,
    speechStart: 4.20,
    speechEnd: 7.65,
    tag: 'THE TWIN PARADOX',
    titleWhite: 'TWIN BROTHER SE',
    titleAccent: 'YOUNGER!',
    caption: "wapas zameen par aayenge, toh aap apne twin brother se thode chhote, yaani younger lagenge?"
  },
  {
    id: 3,
    theme: 'dark',
    start: 7.9,
    end: 14.7,
    speechStart: 8.10,
    speechEnd: 14.45,
    tag: 'EINSTEIN RELATIVITY',
    titleWhite: 'GRAVITY & SPEED',
    titleAccent: 'SLOWS TIME',
    caption: "Darasal, Einstein ke theory ke mutabik, jahan gravity ya speed bahut zyada hoti hai, wahan time slow ho jata hai."
  },
  {
    id: 4,
    theme: 'paper',
    start: 14.7,
    end: 23.8,
    speechStart: 14.85,
    speechEnd: 23.55,
    tag: 'ISS ORBITAL VELOCITY',
    titleWhite: 'JUMP INTO THE',
    titleAccent: 'FUTURE!',
    caption: "Space station mein high speed par travel karne ki wajah se astronaut ka time zameen ke muqable thoda slow chalta hai, jisse woh literally future mein thoda aage chale jaate hain."
  },
  {
    id: 5,
    theme: 'dark',
    start: 23.8,
    end: 27.2,
    speechStart: 23.95,
    speechEnd: 27.00,
    tag: 'REAL LIFE SCI-FI',
    titleWhite: 'REAL TIME',
    titleAccent: 'MACHINE',
    caption: "Matlab, space travel ek tarah ki time machine hi hai!"
  },
  {
    id: 6,
    theme: 'paper',
    start: 27.2,
    end: 34.4,
    speechStart: 27.35,
    speechEnd: 34.30,
    tag: 'YOUR FUTURE JOURNEY',
    titleWhite: 'KISKE PAAS',
    titleAccent: 'JAANA CHAHOGE?',
    caption: "Waise, agar aapko kabhi time travel karke future mein jaane ka mauka mile, toh aap sabse pehle kiske paas jaana chahoge? Comment mein uska naam zaroor"
  }
] as const;

type SceneId = 1 | 2 | 3 | 4 | 5 | 6;

const ACCENTS: Record<SceneId, string> = {
  1: '#00e5ff',
  2: '#d93829',
  3: '#ffd166',
  4: '#e59f24',
  5: '#ff9f43',
  6: '#ff5252',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sceneStartFrame = (s: SceneConfig) => Math.round(s.start * FPS);
const sceneEndFrame = (s: SceneConfig) => Math.round(s.end * FPS);
const localSec = (frame: number, s: SceneConfig) => (frame - sceneStartFrame(s)) / FPS;
const progressFor = (frame: number, s: SceneConfig) =>
  clamp01((frame - sceneStartFrame(s)) / Math.max(1, sceneEndFrame(s) - sceneStartFrame(s)));

const wordWeight = (word: string) => {
  let extra = 0;
  if (word.includes(',')) extra += 3;
  if (word.includes('?') || word.includes('!')) extra += 4;
  return Math.max(1, word.replace(/[.,!?;:…“”"'()]/g, '').length) + extra;
};

/* ==================== GLOBAL HEADER LABEL ==================== */
function SceneTitle({ frame, scene }: { frame: number; scene: SceneConfig }) {
  const lf = frame - sceneStartFrame(scene);
  const enter = spring({ frame: lf, fps: FPS, config: { damping: 13, stiffness: 150 } });
  const accentColor = ACCENTS[scene.id as SceneId];
  const pulse = 1 + Math.sin(frame * 0.12) * 0.02;

  const titleX = 540;
  const tagY = 110;
  const line1Y = 220;
  const line2Y = 300;

  return (
    <g transform={`translate(0, ${interpolate(enter, [0, 1], [-120, 0])})`} style={{ pointerEvents: 'none' }}>
      {/* Dynamic Header Badge */}
      <g transform={`translate(${titleX}, ${tagY}) scale(${pulse})`}>
        <rect
          x="-240"
          y="-30"
          width="480"
          height="60"
          rx="30"
          fill={scene.theme === 'dark' ? 'rgba(8,12,30,0.85)' : '#fcf9f2'}
          stroke={accentColor}
          strokeWidth="3.5"
        />
        <circle cx="-190" cy="0" r="8" fill={accentColor} />
        <text
          x="0"
          y="7"
          fill={scene.theme === 'dark' ? '#00e5ff' : '#24211d'}
          textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="19"
          fontWeight="900"
          letterSpacing="4"
        >
          {scene.tag}
        </text>
      </g>

      {/* Main Large Editorial Title Label */}
      <g transform={`translate(${titleX}, 0)`}>
        <text
          y={line1Y}
          fill={scene.theme === 'dark' ? '#ffffff' : '#24211d'}
          textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="68"
          fontWeight="900"
          letterSpacing="-1"
        >
          {scene.titleWhite}
        </text>
        <text
          y={line2Y}
          fill={accentColor}
          textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="72"
          fontWeight="900"
          letterSpacing="-1"
        >
          {scene.titleAccent}
        </text>
      </g>
    </g>
  );
}

/* ==================== KINETIC CAPTIONS pill ==================== */
function WordCaptions({ frame, scene }: { frame: number; scene: SceneConfig }) {
  const words = scene.caption.trim().split(/\s+/);
  const speechStart = Math.round(scene.speechStart * FPS);
  const speechEnd = Math.round(scene.speechEnd * FPS);

  if (frame < speechStart || frame > speechEnd) return null;

  const weights = words.map(wordWeight);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const spanFrames = Math.max(1, speechEnd - speechStart);
  const normalized = clamp01((frame - speechStart) / spanFrames);
  const weightedPos = normalized * totalWeight;

  let activeIndex = words.length - 1;
  let running = 0;
  for (let i = 0; i < weights.length; i++) {
    if (weightedPos < running + weights[i] || i === words.length - 1) {
      activeIndex = i;
      break;
    }
    running += weights[i];
  }

  const chunkStart = Math.floor(activeIndex / 4) * 4;
  const chunkWords = words.slice(chunkStart, chunkStart + 4);
  const beforeActive = weights.slice(0, activeIndex).reduce((s, w) => s + w, 0);
  const wordStart = speechStart + Math.round((beforeActive / totalWeight) * spanFrames);

  const pop = spring({
    frame: Math.max(0, frame - wordStart),
    fps: FPS,
    config: { damping: 9, stiffness: 260, mass: 0.35 },
  });
  const accentColor = ACCENTS[scene.id as SceneId];

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 30,
        left: '50%',
        bottom: 160,
        transform: 'translateX(-50%)',
        width: 'calc(100% - 88px)',
        maxWidth: 900,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '24px 30px',
        borderRadius: 24,
        border: scene.theme === 'dark' ? `2px solid ${accentColor}70` : `2.5px solid ${accentColor}`,
        background: scene.theme === 'dark' ? 'rgba(6,10,24,0.92)' : '#fdfaf5',
        boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 25px ${accentColor}18`,
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {chunkWords.map((word, idx) => {
        const wIdx = chunkStart + idx;
        const active = wIdx === activeIndex;
        const scale = active ? interpolate(pop, [0, 1], [0.85, 1.14]) : 1;
        const rotation = active ? interpolate(pop, [0, 1], [-2, 0]) : 0;

        return (
          <span
            key={`${scene.id}-${wIdx}-${word}`}
            style={{
              display: 'inline-flex',
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              padding: active ? '10px 18px 12px' : '10px 4px 12px',
              borderRadius: 16,
              background: active ? accentColor : 'transparent',
              boxShadow: active ? `0 0 20px ${accentColor}70` : 'none',
              color: active ? (scene.theme === 'dark' ? '#060a12' : '#ffffff') : (scene.theme === 'dark' ? '#f1f6ff' : '#24211d'),
              fontSize: 40,
              fontWeight: 900,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

/* ==================== ASSET DESIGN & COMMON ASSETS ==================== */
function SvgDefs() {
  return (
    <defs>
      {/* Background Gradients */}
      <radialGradient id="bgDarkGrad" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stopColor="#172242" />
        <stop offset="60%" stopColor="#0a1024" />
        <stop offset="100%" stopColor="#04060c" />
      </radialGradient>
      <linearGradient id="bgPaperGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f3eee0" />
        <stop offset="100%" stopColor="#e3d6bc" />
      </linearGradient>

      {/* Astro / Rocket gradients */}
      <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#bdc3c7" />
      </linearGradient>
      <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffd200" />
        <stop offset="50%" stopColor="#ff3f34" />
        <stop offset="100%" stopColor="#ff3008" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="spaceStationGlass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="100%" stopColor="#0a527a" />
      </linearGradient>

      {/* Filter effects */}
      <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function GlobalStars({ frame }: { frame: number }) {
  const count = 40;
  return (
    <g opacity="0.32">
      {Array.from({ length: count }, (_, i) => {
        const x = (i * 37 + 13) % WIDTH;
        const y = (i * 59 + 71) % HEIGHT;
        const flash = 0.2 + (Math.sin(frame * 0.08 + i) + 1) * 0.4;
        return <circle key={i} cx={x} cy={y} r={1.5 + (i % 3) * 0.7} fill="#ffffff" opacity={flash} />;
      })}
    </g>
  );
}

function PaperGridLines() {
  const gap = 60;
  const cols = Math.floor(WIDTH / gap);
  const rows = Math.floor(HEIGHT / gap);

  return (
    <g stroke="#d5c8ab" strokeWidth="0.85" strokeDasharray="3 3" opacity="0.75">
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line key={`x-${i}`} x1={i * gap} y1="0" x2={i * gap} y2={HEIGHT} />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line key={`y-${i}`} x1="0" y1={i * gap} x2={WIDTH} y2={i * gap} />
      ))}
    </g>
  );
}

/* ==================== THEMATIC SCENE OVERLAYS ==================== */

// Scene 1: Rocket Launch through Ascent up into Orbit
function SceneOne({ frame, scene }: { frame: number; scene: SceneConfig }) {
  const t = localSec(frame, scene);
  
  // Camera Pan upward, going from ground to Space
  const worldY = lerp(0, -1100, clamp01(t / 4.2));

  // Altitude text ticking up 
  const altValue = Math.round(interpolate(t, [0, 4.2], [0, 408], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  // Rocket position as camera Pans
  const rocketOffset = interpolate(t, [0, 4.2], [1400, 680], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <g transform={`translate(0, ${worldY})`}>
      {/* Ground skyline (Initially displayed at y: 1400-1920) */}
      <g transform="translate(0, 1500)">
        {/* Cityscape and Launch Platform */}
        <rect x="0" y="300" width={WIDTH} height="400" fill="#0b0f19" />
        <path d="M-80 320 C180 290 340 330 520 310 S900 290 1160 320 L1160 500 L-80 500 Z" fill="#080c14" />
        {/* Industrial/Telescope shapes/Gantry */}
        <rect x="180" y="160" width="14" height="150" fill="#2d3748" />
        <rect x="160" y="140" width="54" height="20" fill="#e53e3e" />
        <line x1="194" y1="160" x2="260" y2="280" stroke="#718096" strokeWidth="3" />
        <line x1="194" y1="200" x2="260" y2="280" stroke="#718096" strokeWidth="3" />
        <circle cx="680" cy="270" r="16" fill="#1e293b" stroke="#718096" strokeWidth="2" />
        <path d="M 664 270 L 696 270" stroke="#475569" strokeWidth="5" />
      </g>

      {/* Atmospheric/Cloud layers for zoom stage */}
      <g opacity={interpolate(t, [0.8, 2.5], [0.95, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
        {[650, 950, 1200].map((cy, idx) => (
          <path
            key={idx}
            d={`M -100 ${cy} Q 200 ${cy - 80} 540 ${cy + 20} T 1180 ${cy - 40} L 1180 ${cy + 180} L -100 ${cy + 180} Z`}
            fill="#ffffff"
            opacity="0.14"
          />
        ))}
      </g>

      {/* Orbit features (Earth and Space Station at y: 200-850) */}
      <g opacity={interpolate(t, [1.2, 2.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
        {/* Orbital curved planet horizon */}
        <circle cx="540" cy="1880" r="1280" fill="#0d1b3e" stroke="#00e5ff" strokeWidth="12" opacity="0.65" />
        <circle cx="540" cy="1880" r="1280" fill="none" stroke="#2c5282" strokeWidth="48" opacity="0.25" />

        {/* Floating space Station (ISS) */}
        <g transform="translate(320 480) scale(0.92) rotate(15)">
          <line x1="-190" y1="0" x2="190" y2="0" stroke="#a0aec0" strokeWidth="14" />
          {/* Array panels */}
          {[-170, -110, 110, 170].map((x) => (
            <rect key={x} x={x - 24} y="-95" width="48" height="190" rx="3" fill="#ffd166" opacity="0.82" stroke="#d69e2e" strokeWidth="2" />
          ))}
          {/* Modular station core */}
          <rect x="-82" y="-32" width="164" height="64" rx="8" fill="url(#spaceStationGlass)" stroke="#ffffff" strokeWidth="3.5" />
          <circle cx="0" cy="0" r="18" fill="#1a365d" stroke="#00e5ff" strokeWidth="2.5" />
          <line x1="-60" y1="0" x2="-60" y2="105" stroke="#718096" strokeWidth="3" />
          <circle cx="-60" cy="105" r="7" fill="#ffffff" />
        </g>
      </g>

      {/* Rising Rocket */}
      <g transform={`translate(540, ${rocketOffset})`}>
        {/* Flame effect */}
        {t < 3.8 && (
          <path
            d={`M-13,55 Q0,${150 + Math.sin(frame * 0.4) * 45} 13,55 Q0,75 -13,55 Z`}
            fill="url(#flame)"
            filter="url(#glowRed)"
          />
        )}
        {/* Thrust body */}
        <path d="M-22,50 L22,50 L28,-15 Q0,-82 -28,-15 Z" fill="url(#rocketBody)" stroke="#4a5568" strokeWidth="3.5" />
        <rect x="-18" y="10" width="36" height="32" rx="2" fill="#2d3748" />
        <ellipse cx="0" cy="20" rx="9" ry="14" fill="#00e5ff" stroke="#1a202c" strokeWidth="2.5" />
        <rect x="-34" y="32" width="12" height="24" rx="2" fill="#e53e3e" transform="skewY(20)" />
        <rect x="22" y="32" width="12" height="24" rx="2" fill="#e53e3e" transform="skewY(-20)" />
      </g>

      {/* Floating Altitude Indicator Badge */}
      <g transform={`translate(160, ${rocketOffset + 240})`}>
        <rect x="-95" y="-30" width="190" height="60" rx="14" fill="#0c111d" stroke="#00e5ff" strokeWidth="3.5" />
        <text x="0" y="6" fill="#00e5ff" textAnchor="middle" fontFamily="monospace" fontSize="22" fontWeight="900" filter="url(#glowCyan)">
          {altValue} KM
        </text>
      </g>
    </g>
  );
}

// Scene 2: Returns to Earth with comparative Aging Twin Brother
function SceneTwo({ frame, scene }: { frame: number; scene: SceneConfig }) {
  const t = localSec(frame, scene);
  
  // Parachute falls on Earth 
  const parachuterY = interpolate(t, [0, 1.4], [350, 470], { extrapolateRight: 'clamp' });
  const parachuteRot = Math.sin(frame * 0.08) * 8;

  const countdown = spring({ frame: frame - sceneStartFrame(scene), fps: FPS, config: { damping: 11, stiffness: 120 } });

  // Big comparative numbers 
  const oldManAge = Math.round(interpolate(t, [1.0, 3.5], [28, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <g>
      {/* Return visual for landing capsular parachute */}
      {t < 1.6 && (
        <g transform={`translate(280, ${parachuterY}) rotate(${parachuteRot})`}>
          <path d="M-60 -45 C-50 -110 50 -110 60 -45 L50 -35 L-50 -35 Z" fill="#d93829" stroke="#24211d" strokeWidth="3" />
          {/* Shrouds */}
          <line x1="-50" y1="-35" x2="0" y2="22" stroke="#24211d" strokeWidth="1.2" />
          <line x1="-20" y1="-35" x2="0" y2="22" stroke="#24211d" strokeWidth="1.2" />
          <line x1="20" y1="-35" x2="0" y2="22" stroke="#24211d" strokeWidth="1.2" />
          <line x1="50" y1="-35" x2="0" y2="22" stroke="#24211d" strokeWidth="1.2" />
          {/* Capsule */}
          <polygon points="-16,22 16,22 8,36 -8,36" fill="#e59f24" stroke="#24211d" strokeWidth="3" />
          <circle cx="0" cy="18" r="7" fill="#ffffff" opacity="0.32" />
        </g>
      )}

      {/* Stage platform Split- pedestals for side comparison */}
      <g transform="translate(0 500)">
        <line x1="120" y1="520" x2="960" y2="520" stroke="#24211d" strokeWidth="6.5" />
        {Array.from({ length: 11 }, (_, i) => (
          <line key={i} x1={180 + i * 70} y1="520" x2={180 + i * 70} y2="542" stroke="#24211d" strokeWidth="3" />
        ))}

        {/* Left Side: You (Astronaut) labeled 'ASTRONAUT 🚀' */}
        <g transform={`translate(280, 520) scale(${countdown})`}>
          <ellipse cx="0" cy="18" rx="72" ry="18" fill="#e5dbc6" opacity="0.82" />
          {/* Cute illustration astronaut */}
          <g transform="translate(0 -220)">
            <rect x="-34" y="65" width="68" height="135" rx="20" fill="#fcf9f2" stroke="#24211d" strokeWidth="5.5" />
            <circle cx="0" cy="0" r="42" fill="#fcf9f2" stroke="#24211d" strokeWidth="5.5" />
            <rect x="-24" y="-12" width="48" height="30" rx="8" fill="#4a69bd" stroke="#24211d" strokeWidth="4.5" />
            <circle cx="-14" cy="-3" r="4" fill="#ffffff" opacity="0.8" />
            <rect x="-38" y="75" width="13" height="70" rx="5" fill="#fcf9f2" stroke="#24211d" strokeWidth="4" />
            <rect x="25" y="75" width="13" height="70" rx="5" fill="#fcf9f2" stroke="#24211d" strokeWidth="4" />
            {/* Patch */}
            <rect x="-10" y="105" width="20" height="20" rx="3" fill="#e59f24" />
          </g>
          {/* Label box */}
          <rect x="-120" y="-395" width="240" height="54" rx="14" fill="#2ed573" stroke="#24211d" strokeWidth="4.5" />
          <text x="0" y="-358" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif" fontSize="21" fontWeight="900" letterSpacing="1">
            YOU (ASTRONAUT)
          </text>
          {/* Counting overlay */}
          <text x="0" y="140" fill="#2ed573" textAnchor="middle" fontFamily="sans-serif" fontSize="62" fontWeight="900">
            28 YRS
          </text>
          {/* Animated bounce call sign */}
          <g transform={`translate(0, -450) scale(${1 + Math.sin(frame * 0.12) * 0.05})`}>
            <rect x="-65" y="-18" width="130" height="36" rx="8" fill="#24211d" />
            <text x="0" y="7" fill="#2ed573" textAnchor="middle" fontFamily="sans-serif" fontSize="
