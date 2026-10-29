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
const DURATION = 2010;

const SCENES = [
  { id: 1, start: 0.0, end: 5.2, speechStart: 0.10, speechEnd: 5.05, caption: "Kya aapko pata hai aapke shareer ke immune system ko yeh pata hi nahi hai ki aapke paas aankhein bhi hain?" },
  { id: 2, start: 5.2, end: 8.3, speechStart: 5.30, speechEnd: 8.05, caption: "Aur agar use pata chal gaya, toh woh aapko andha kar dega!" },
  { id: 3, start: 8.3, end: 14.3, speechStart: 8.45, speechEnd: 14.05, caption: "Darasal, hamari eyes ka apna ek alag security system hota hai, jo unhein shareer se chhupa kar rakhta hai." },
  { id: 4, start: 14.3, end: 19.3, speechStart: 14.45, speechEnd: 19.15, caption: "Par agar kisi gehri chot ki wajah se body ke immune system ko aapki aankhon ka pata chal jaye," },
  { id: 5, start: 19.3, end: 25.0, speechStart: 19.35, speechEnd: 24.75, caption: "Toh woh unhein koi bahari virus samajh kar seedha attack kar dega, aur aapko hamesha ke liye andha bana dega!" },
  { id: 6, start: 25.0, end: 33.5, speechStart: 25.15, speechEnd: 33.40, caption: "Waise, aapka kaun sa chashmish dost aisa hai jise dekh kar lagta hai ki uske immune system ko uski aankhon ka pata chal chuka hai? Comment mein uska naam zaroor batao!" },
] as const;

type Scene = (typeof SCENES)[number];
type SceneId = Scene['id'];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sceneStartFrame = (s: Scene) => Math.round(s.start * FPS);
const sceneEndFrame = (s: Scene) => Math.round(s.end * FPS);
const localSec = (frame: number, s: Scene) => (frame - sceneStartFrame(s)) / FPS;
const progressFor = (frame: number, s: Scene) =>
  clamp01((frame - sceneStartFrame(s)) / Math.max(1, sceneEndFrame(s) - sceneStartFrame(s)));

const TITLES: Record<SceneId, string> = {
  1: 'THE IMMUNE BLIND SPOT',
  2: 'TARGET ACQUIRED // DANGER',
  3: 'THE EYE’S SECRET FORTRESS',
  4: 'TRAUMA: BARRIER SHATTERED',
  5: 'AUTOIMMUNE ASSAULT',
  6: 'THE CHASHMISH FRIEND TEST',
};

const ACCENTS: Record<SceneId, string> = {
  1: '#00f2fe',
  2: '#ff2e4c',
  3: '#ffd166',
  4: '#ff4757',
  5: '#7bed9f',
  6: '#ffc857',
};

const wordWeight = (word: string) => {
  let extra = 0;
  if (word.includes(',')) extra += 3;
  if (word.includes('?') || word.includes('!')) extra += 4;
  return Math.max(1, word.replace(/[.,!?;:…“”"'()]/g, '').length) + extra;
};

/* ======================== KINETIC TITLE & CAPTIONS ======================== */

function SceneTitle({ frame, scene }: { frame: number; scene: Scene }) {
  const lf = frame - sceneStartFrame(scene);
  const enter = spring({ frame: lf, fps: FPS, config: { damping: 12, stiffness: 160 } });
  const accent = ACCENTS[scene.id];
  const pulse = 1 + Math.sin(frame * 0.14) * 0.025;

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 25,
        top: 96,
        left: '50%',
        transform: `translateX(-50%) translateY(${interpolate(enter, [0, 1], [-80, 0])}px) scale(${enter * pulse})`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        whiteSpace: 'nowrap',
        padding: '16px 28px',
        borderRadius: 999,
        border: `2px solid ${accent}`,
        background: 'rgba(6, 12, 24, 0.90)',
        boxShadow: `0 0 40px ${accent}55, inset 0 0 18px ${accent}25`,
        color: '#ffffff',
        fontFamily: 'Inter, Arial Black, sans-serif',
        fontSize: 25,
        fontWeight: 900,
        letterSpacing: 2.5,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 20px ${accent}`,
        }}
      />
      <span>{TITLES[scene.id]}</span>
    </div>
  );
}

function WordCaptions({ frame, scene }: { frame: number; scene: Scene }) {
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
    config: { damping: 8, stiffness: 280, mass: 0.35 },
  });
  const accent = ACCENTS[scene.id];

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 30,
        left: '50%',
        bottom: 155,
        transform: 'translateX(-50%)',
        width: 'calc(100% - 76px)',
        maxWidth: 950,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        padding: '22px 24px',
        borderRadius: 28,
        border: `1.5px solid ${accent}55`,
        background: 'linear-gradient(135deg, rgba(4,9,20,0.92), rgba(10,20,38,0.84))',
        boxShadow: `0 20px 60px rgba(0,0,0,0.65), 0 0 30px ${accent}22`,
        fontFamily: 'Inter, Arial Black, sans-serif',
      }}
    >
      {chunkWords.map((word, idx) => {
        const wIdx = chunkStart + idx;
        const active = wIdx === activeIndex;
        const scale = active ? interpolate(pop, [0, 1], [0.82, 1.14]) : 1;
        const rot = active ? interpolate(pop, [0, 1], [-3, 0]) : 0;

        return (
          <span
            key={`${scene.id}-${wIdx}`}
            style={{
              display: 'inline-flex',
              transform: `scale(${scale}) rotate(${rot}deg)`,
              padding: active ? '8px 16px 10px' : '8px 6px 10px',
              borderRadius: 14,
              background: active ? accent : 'transparent',
              boxShadow: active ? `0 0 28px ${accent}99` : 'none',
              color: active ? '#040811' : '#f1f6ff',
              fontSize: 42,
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

/* ======================== SHARED SVG DEFS & DYNAMIC BG ======================== */

function SvgDefs() {
  return (
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stopColor="#162c4e" />
        <stop offset="55%" stopColor="#091326" />
        <stop offset="100%" stopColor="#040710" />
      </radialGradient>
      <linearGradient id="sclera" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#dff4ff" />
        <stop offset="100%" stopColor="#8ab4d0" />
      </linearGradient>
      <radialGradient id="irisCyan" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#9bfff8" />
        <stop offset="35%" stopColor="#00d2d3" />
        <stop offset="75%" stopColor="#09527a" />
        <stop offset="100%" stopColor="#041b2e" />
      </radialGradient>
      <radialGradient id="irisRed" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#ff9eaa" />
        <stop offset="40%" stopColor="#ff2e4c" />
        <stop offset="80%" stopColor="#6b0918" />
        <stop offset="100%" stopColor="#240208" />
      </radialGradient>
      <linearGradient id="goldShield" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffe885" />
        <stop offset="50%" stopColor="#00f2fe" />
        <stop offset="100%" stopColor="#4facfe" />
      </linearGradient>
      <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#95afc0" />
        <stop offset="100%" stopColor="#2f3640" />
      </linearGradient>
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="8" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="heavyGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="16" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* Fast-flowing bloodstream highway in background so canvas is ALWAYS alive */
function BloodstreamHighway({ frame, alertLevel = 0 }: { frame: number; alertLevel?: number }) {
  const rbcs = Array.from({ length: 28 }, (_, i) => {
    const speed = 4.5 + (i % 5) * 1.8;
    const x = ((i * 193 + frame * speed) % (WIDTH + 240)) - 120;
    const yBase = (i * 137) % HEIGHT;
    const wave = Math.sin(frame * 0.05 + i) * 35;
    const y = yBase + wave;
    const rot = (frame * (2 + (i % 4)) + i * 45) % 360;
    const scale = 0.55 + (i % 4) * 0.22;
    return { x, y, rot, scale, i };
  });

  return (
    <g>
      <rect width={WIDTH} height={HEIGHT} fill="url(#bgGrad)" />
      {alertLevel > 0 && (
        <rect
          width={WIDTH}
          height={HEIGHT}
          fill="#ff002b"
          opacity={alertLevel * (0.12 + Math.sin(frame * 0.25) * 0.08)}
        />
      )}

      {/* Animated pulsing blood vessel tunnels */}
      {[380, 920, 1460].map((vy, idx) => {
        const dY = Math.sin(frame * 0.04 + idx) * 25;
        return (
          <path
            key={idx}
            d={`M-100 ${vy + dY} Q 540 ${vy - 120 - dY} 1180 ${vy + dY}`}
            fill="none"
            stroke={alertLevel > 0.3 ? '#ff2e4c' : '#1e4875'}
            strokeWidth={75}
            opacity={0.18}
            strokeLinecap="round"
          />
        );
      })}

      {/* Fast-moving Red Blood Cells */}
      {rbcs.map((cell) => (
        <g
          key={cell.i}
          transform={`translate(${cell.x} ${cell.y}) rotate(${cell.rot}) scale(${cell.scale})`}
          opacity={0.28}
        >
          <ellipse cx="0" cy="0" rx="34" ry="22" fill="#d63031" />
          <ellipse cx="0" cy="0" rx="18" ry="10" fill="#851414" />
        </g>
      ))}
    </g>
  );
}

/* Expressive Animated Eye that looks around, blinks, dilates, cloaks, or goes grayscale */
function DynamicEye({
  frame,
  lookX = 0,
  lookY = 0,
  pupilScale = 1,
  stealthCloak = 0,
  dangerMode = 0,
  blackout = 0,
  deadGrey = 0,
  crossSection = false,
  scale = 1,
}: {
  frame: number;
  lookX?: number;
  lookY?: number;
  pupilScale?: number;
  stealthCloak?: number;
  dangerMode?: number;
  blackout?: number;
  deadGrey?: number;
  crossSection?: boolean;
  scale?: number;
}) {
  // Periodic natural blink every ~110 frames
  const blinkCycle = frame % 115;
  const blinkOpen =
    blinkCycle < 8
      ? interpolate(blinkCycle, [0, 4, 8], [1, 0.08, 1])
      : 1;

  const pRadius = 38 * pupilScale;
  const irisRayCount = 24;

  return (
    <g
      transform={`translate(540 850) scale(${scale})`}
      style={{ filter: deadGrey > 0 ? `grayscale(${deadGrey * 100}%)` : undefined }}
    >
      {/* Outer Glow */}
      <ellipse
        cx="0"
        cy="0"
        rx="430"
        ry="290"
        fill={dangerMode > 0.3 ? '#ff2e4c' : '#00f2fe'}
        opacity={0.18 + Math.sin(frame * 0.1) * 0.05}
        filter="url(#heavyGlow)"
      />

      {/* Animated Optic Nerve Tail waving at the back */}
      <path
        d={`M 260 0 Q 360 ${Math.sin(frame * 0.12) * 28} 475 ${15 + Math.cos(frame * 0.1) * 22} L 475 ${65 + Math.cos(frame * 0.1) * 22} Q 360 ${45 + Math.sin(frame * 0.12) * 28} 250 42 Z`}
        fill="#e6c28b"
        stroke="#ffdfab"
        strokeWidth="4"
      />

      {/* Eye Group with Blinking & Stealth Opacity */}
      <g
        transform={`scale(1 ${blinkOpen})`}
        opacity={1 - stealthCloak * 0.68}
      >
        {/* Sclera */}
        <path
          d="M-360 0 C-245 -180 245 -180 360 0 C245 180 -245 180 -360 0 Z"
          fill="url(#sclera)"
          stroke={dangerMode > 0.3 ? '#ff4757' : '#a8f9ff'}
          strokeWidth="10"
        />

        {/* Pulsing Blood Vessels on Sclera */}
        <g
          fill="none"
          stroke="#e84158"
          strokeLinecap="round"
          opacity={0.35 + dangerMode * 0.55}
        >
          <path d="M-315 -15 Q-240 -35 -185 12 T-125 25" strokeWidth={4 + dangerMode * 3} />
          <path d="M-290 50 Q-220 35 -165 72" strokeWidth={3 + dangerMode * 2} />
          <path d="M285 -45 Q215 -20 155 -8" strokeWidth={4 + dangerMode * 3} />
          <path d="M270 55 Q205 40 148 65" strokeWidth={3 + dangerMode * 2} />
        </g>

        {/* Cross-section internal retinal layers for Scene 3 & 4 */}
        {crossSection && (
          <g>
            <path
              d="M115 -132 C230 -115 305 -58 338 0 C305 58 230 115 115 132 C185 82 205 40 205 0 C205 -40 185 -82 115 -132 Z"
              fill="#ff7675"
              opacity="0.38"
              stroke="#fab1a0"
              strokeWidth="4"
            />
            <path
              d="M150 -112 C230 -80 280 -40 302 0 C280 40 230 80 150 112"
              fill="none"
              stroke="#ffeaa7"
              strokeWidth="7"
              strokeDasharray="14 8"
            />
          </g>
        )}

        {/* MOVING IRIS & PUPIL (Tracks lookX, lookY!) */}
        <g transform={`translate(${lookX} ${lookY})`}>
          <circle
            cx="0"
            cy="0"
            r="112"
            fill={dangerMode > 0.4 ? 'url(#irisRed)' : 'url(#irisCyan)'}
            stroke={dangerMode > 0.4 ? '#ff7685' : '#9efff9'}
            strokeWidth="6"
          />
          {Array.from({ length: irisRayCount }, (_, i) => {
            const ang = (i / irisRayCount) * Math.PI * 2 + frame * 0.008;
            return (
              <line
                key={i}
                x1={Math.cos(ang) * (pRadius + 8)}
                y1={Math.sin(ang) * (pRadius + 8)}
                x2={Math.cos(ang) * 102}
                y2={Math.sin(ang) * 102}
                stroke={dangerMode > 0.4 ? '#ffccd5' : '#b8fff9'}
                strokeWidth="3"
                opacity="0.55"
              />
            );
          })}
          <circle cx="0" cy="0" r={pRadius} fill="#040812" stroke="#ffffff" strokeWidth="2" />
          {/* Specular Eye Highlights */}
          <ellipse
            cx={-28}
            cy={-34}
            rx="20"
            ry="12"
            fill="#ffffff"
            opacity="0.92"
            transform="rotate(-30 -28 -34)"
          />
          <circle cx="30" cy="30" r="8" fill="#ffffff" opacity="0.8" />
        </g>
      </g>

      {/* STEALTH WIREFRAME OVERLAY (When cloaked in Scene 1) */}
      {stealthCloak > 0.05 && (
        <g opacity={stealthCloak}>
          <path
            d="M-360 0 C-245 -180 245 -180 360 0 C245 180 -245 180 -360 0 Z"
            fill="none"
            stroke="#00f2fe"
            strokeWidth="5"
            strokeDasharray="18 12"
            filter="url(#glow)"
          />
          {[-100, -50, 0, 50, 100].map((ly) => (
            <line
              key={ly}
              x1="-310"
              y1={ly}
              x2="310"
              y2={ly}
              stroke="#00f2fe"
              strokeWidth="2"
              opacity="0.45"
              strokeDasharray="10 14"
            />
          ))}
        </g>
      )}

      {/* BLACKOUT SHATTER OVERLAY (Scene 2 & 5) */}
      {blackout > 0.02 && (
        <g opacity={clamp01(blackout)}>
          <path
            d="M-362 0 C-245 -182 245 -182 362 0 C245 182 -245 182 -362 0 Z"
            fill="#03050a"
            opacity={0.92}
          />
          <path
            d="M-220 -95 L-40 -10 L-140 95 M190 -85 L30 15 L155 110 M0 -150 L-15 150"
            stroke="#ff2e4c"
            strokeWidth="7"
            fill="none"
            filter="url(#glow)"
          />
        </g>
      )}
    </g>
  );
}

/* Animated Hunter T-Cell with rotating scanner or angry spikes */
function KineticTCell({
  x,
  y,
  frame,
  scale = 1,
  angry = false,
  scanAngle,
}: {
  x: number;
  y: number;
  frame: number;
  scale?: number;
  angry?: boolean;
  scanAngle?: number;
}) {
  const color = angry ? '#ff2e4c' : '#00f2fe';
  const squishX = 1 + Math.sin(frame * 0.18 + x) * 0.09;
  const squishY = 1 + Math.cos(frame * 0.18 + y) * 0.09;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Optional Laser Scanner Cone */}
      {scanAngle !== undefined && (
        <g transform={`rotate(${scanAngle})`}>
          <path
            d="M0 0 L 420 -85 L 420 85 Z"
            fill={color}
            opacity={0.22 + Math.sin(frame * 0.25) * 0.08}
          />
          <line x1="0" y1="0" x2="420" y2="-85" stroke={color} strokeWidth="3" opacity="0.8" />
          <line x1="0" y1="0" x2="420" y2="85" stroke={color} strokeWidth="3" opacity="0.8" />
        </g>
      )}

      <g transform={`scale(${squishX} ${squishY})`}>
        <circle r="68" fill={color} opacity="0.2" filter="url(#glow)" />
        {/* Tentacle/Receptor spikes */}
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2 + frame * (angry ? 0.08 : 0.03);
          const r1 = 44;
          const r2 = angry ? 72 : 58;
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke={color}
              strokeWidth={angry ? 7 : 5}
              strokeLinecap="round"
            />
          );
        })}
        <circle
          r="46"
          fill={angry ? '#4a0815' : '#0b3854'}
          stroke={color}
          strokeWidth="6"
        />
        {/* Animated Eye/Core inside the T-Cell */}
        <circle
          cx={Math.cos(frame * 0.1) * 8}
          cy={Math.sin(frame * 0.1) * 8}
          r="18"
          fill={color}
          filter="url(#glow)"
        />
        <circle
          cx={Math.cos(frame * 0.1) * 8 - 5}
          cy={Math.sin(frame * 0.1) * 8 - 5}
          r="6"
          fill="#ffffff"
        />
      </g>
    </g>
  );
}

/* ======================== SCENE 1: IMMUNE PATROL & STEALTH CLOAK ======================== */

function SceneOne({ frame, scene }: { frame: number; scene: Scene }) {
  const t = localSec(frame, scene);

  // T-Cell Drone 1 sweeps right across the screen and scans the eye!
  const droneX = interpolate(t, [0, 2.5, 5.2], [140, 540, 940]);
  const droneY = interpolate(t, [0, 2.5, 5.2], [440, 390, 460]);
  const scanDeg = interpolate(t, [0, 2.5, 5.2], [45, 90, 135]);

  // Eye looks directly at the patrolling drone!
  const lookX = interpolate(t, [0, 2.5, 5.2], [-55, 0, 55]);
  const lookY = -30;

  // When drone passes over the eye (1.3s to 3.8s), Stealth Cloak activates!
  const cloak = interpolate(t, [1.0, 1.8, 3.5, 4.3], [0, 1, 1, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Organ checklist badges on top-left & top-right showing Immune System knows other organs
  const organs = [
    { name: 'HEART: KNOWN ✅', x: 230, y: 275, delay: 0.2 },
    { name: 'LUNGS: KNOWN ✅', x: 850, y: 275, delay: 0.6 },
    { name: 'EYES: 404 NOT FOUND ❓', x: 540, y: 1255, dela
