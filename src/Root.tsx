import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

/**
 * Vertical biomedical short — timing is intentionally locked to the supplied VO script.
 * No TTS, generated voice, or music. Only public/sfx.wav is played.
 */
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

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sceneStartFrame = (scene: Scene) => Math.round(scene.start * FPS);
const sceneEndFrame = (scene: Scene) => Math.round(scene.end * FPS);
const progressFor = (frame: number, scene: Scene) =>
  clamp01((frame - sceneStartFrame(scene)) / Math.max(1, sceneEndFrame(scene) - sceneStartFrame(scene)));
const sine = (frame: number, speed: number, phase = 0) => Math.sin(frame * speed + phase);

const TITLES: Record<SceneId, string> = {
  1: 'THE IMMUNE BLIND SPOT',
  2: 'TARGET ACQUIRED',
  3: 'THE EYE’S SECRET SHIELD',
  4: 'BARRIER BREACHED',
  5: 'FRIENDLY FIRE: AUTOIMMUNITY',
  6: 'THE CHASHMISH TEST',
};

const ACCENTS: Record<SceneId, string> = {
  1: '#00d2d3',
  2: '#ff4757',
  3: '#49f0da',
  4: '#ff5367',
  5: '#9cff57',
  6: '#ffc857',
};

const WEIGHTED_PUNCTUATION = (word: string) => {
  let extra = 0;
  if (word.includes(',')) extra += 3;
  if (word.includes('?') || word.includes('!')) extra += 4;
  return extra;
};

const wordWeight = (word: string) =>
  Math.max(1, word.replace(/[.,!?;:…“”"'()]/g, '').length) +
  WEIGHTED_PUNCTUATION(word);

function SceneTitle({ frame, scene }: { frame: number; scene: Scene }) {
  const localFrame = frame - sceneStartFrame(scene);
  const enter = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 14, stiffness: 145, mass: 0.72 },
  });
  const opacity = interpolate(localFrame, [0, 8, 24], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const accent = ACCENTS[scene.id];

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 20,
        top: 110,
        left: '50%',
        transform: `translateX(-50%) translateY(${interpolate(enter, [0, 1], [-34, 0])}px) scale(${interpolate(enter, [0, 1], [0.82, 1])})`,
        opacity,
        maxWidth: 'calc(100% - 80px)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        whiteSpace: 'nowrap',
        padding: '17px 25px 18px',
        borderRadius: 22,
        border: `1.5px solid ${accent}70`,
        background: 'linear-gradient(115deg, rgba(9,18,34,.91), rgba(13,24,43,.70))',
        boxShadow: `0 0 34px ${accent}20, inset 0 1px 0 rgba(255,255,255,.09)`,
        backdropFilter: 'blur(18px)',
        color: '#f5fbff',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: 24,
        fontWeight: 850,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 20,
          flex: '0 0 auto',
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
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
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const spanFrames = Math.max(1, speechEnd - speechStart);
  const normalized = clamp01((frame - speechStart) / spanFrames);
  const weightedPosition = normalized * totalWeight;

  let activeIndex = words.length - 1;
  let running = 0;

  for (let i = 0; i < weights.length; i += 1) {
    if (weightedPosition < running + weights[i] || i === words.length - 1) {
      activeIndex = i;
      break;
    }
    running += weights[i];
  }

  const chunkStart = Math.floor(activeIndex / 4) * 4;
  const chunkWords = words.slice(chunkStart, chunkStart + 4);
  const beforeActive = weights
    .slice(0, activeIndex)
    .reduce((sum, weight) => sum + weight, 0);
  const wordStart =
    speechStart + Math.round((beforeActive / totalWeight) * spanFrames);

  const pop = spring({
    frame: Math.max(0, frame - wordStart),
    fps: FPS,
    config: { damping: 9, stiffness: 250, mass: 0.38 },
  });
  const accent = ACCENTS[scene.id];

  return (
    <div
      aria-label="Kinetic spoken captions"
      style={{
        position: 'absolute',
        zIndex: 30,
        left: '50%',
        bottom: 180,
        transform: 'translateX(-50%)',
        width: 'calc(100% - 88px)',
        maxWidth: 930,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: 8,
        rowGap: 8,
        padding: '20px 19px 22px',
        borderRadius: 27,
        border: '1px solid rgba(196,224,255,.16)',
        background: 'linear-gradient(135deg, rgba(4,9,19,.88), rgba(9,17,32,.72))',
        boxShadow: '0 18px 60px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.07)',
        backdropFilter: 'blur(22px)',
        fontFamily: 'Inter, Arial, sans-serif',
        textAlign: 'center',
      }}
    >
      {chunkWords.map((word, index) => {
        const wordIndex = chunkStart + index;
        const active = wordIndex === activeIndex;
        const activeScale = active ? interpolate(pop, [0, 1], [0.86, 1.08]) : 1;

        return (
          <span
            key={`${scene.id}-${wordIndex}-${word}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${activeScale})`,
              transformOrigin: 'center center',
              padding: active ? '8px 12px 10px' : '8px 5px 10px',
              borderRadius: 13,
              background: active ? accent : 'rgba(255,255,255,.035)',
              border: active ? `1px solid ${accent}` : '1px solid transparent',
              boxShadow: active ? `0 0 25px ${accent}50` : 'none',
              color: active ? '#ffffff' : '#f1f5fb',
              fontSize: 40,
              fontWeight: active ? 900 : 740,
              letterSpacing: -0.7,
              lineHeight: 1.12,
              textShadow: active
                ? '0 2px 2px rgba(0,0,0,.18)'
                : '0 2px 8px rgba(0,0,0,.55)',
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

function SvgDefs() {
  return (
    <defs>
      <radialGradient id="bodyGlow" cx="50%" cy="46%" r="64%">
        <stop offset="0%" stopColor="#142a46" stopOpacity=".82" />
        <stop offset="62%" stopColor="#0b1427" stopOpacity=".32" />
        <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="eyeAura" cx="50%" cy="50%" r="58%">
        <stop offset="0%" stopColor="#d8ffff" stopOpacity=".46" />
        <stop offset="40%" stopColor="#54f4e4" stopOpacity=".19" />
        <stop offset="100%" stopColor="#33d8e5" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="scleraGrad" x1="0" y1="0" x2=".15" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="48%" stopColor="#e9f7ff" />
        <stop offset="100%" stopColor="#a6c6dc" />
      </linearGradient>

      <radialGradient id="irisGrad" cx="38%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#8ef4ee" />
        <stop offset="28%" stopColor="#2cb4c0" />
        <stop offset="62%" stopColor="#16718c" />
        <stop offset="84%" stopColor="#102e54" />
        <stop offset="100%" stopColor="#071525" />
      </radialGradient>

      <radialGradient id="pupilGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#172638" />
        <stop offset="100%" stopColor="#01050b" />
      </radialGradient>

      <linearGradient id="nerveGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f5d6a3" />
        <stop offset="48%" stopColor="#baaa91" />
        <stop offset="100%" stopColor="#756a70" />
      </linearGradient>

      <linearGradient id="cellGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e3ffff" />
        <stop offset="36%" stopColor="#67ece4" />
        <stop offset="78%" stopColor="#168da7" />
        <stop offset="100%" stopColor="#0b3c66" />
      </linearGradient>

      <linearGradient id="antibodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d4ff8a" />
        <stop offset="100%" stopColor="#43d98d" />
      </linearGradient>

      <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff0a6" />
        <stop offset="44%" stopColor="#64fff0" />
        <stop offset="100%" stopColor="#5a9eff" />
      </linearGradient>

      <linearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#293a50" />
        <stop offset="100%" stopColor="#080e1c" />
      </linearGradient>

      <linearGradient id="blindnessGrad" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stopColor="#03060b" stopOpacity=".15" />
        <stop offset="52%" stopColor="#0a0e16" stopOpacity=".76" />
        <stop offset="100%" stopColor="#000000" stopOpacity=".98" />
      </linearGradient>

      <radialGradient id="redFlash" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ff344f" stopOpacity=".72" />
        <stop offset="100%" stopColor="#ff344f" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="greenTarget" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stopColor="#aaff66" stopOpacity=".12" />
        <stop offset="100%" stopColor="#aaff66" stopOpacity="0" />
      </radialGradient>

      <filter id="glowCyan" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glowRed" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="9" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glowGold" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="softShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="16" />
      </filter>

      <filter id="desaturate">
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
  );
}

function ParticleField({ frame }: { frame: number }) {
  const particles = Array.from({ length: 72 }, (_, index) => {
    const x = (index * 157.3 + 43) % WIDTH;
    const baseY = (index * 251.7 + 79) % HEIGHT;
    const drift = (frame * (0.27 + (index % 5) * 0.045) + index * 17) % (HEIGHT + 80);
    const y = (baseY + drift) % HEIGHT;
    const radius = 1.4 + (index % 4) * 0.65;
    const alpha = 0.12 + ((Math.sin(frame * 0.025 + index) + 1) / 2) * 0.28;
    const cyan = index % 4 !== 0;

    return { x, y, radius, alpha, cyan, key: index };
  });

  return (
    <g>
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#bodyGlow)" />

      <g opacity=".18" fill="none" strokeLinecap="round">
        <path
          d="M-80 490 C180 390 310 560 520 488 S890 405 1160 520"
          stroke="#316b91"
          strokeWidth="3"
        />
        <path
          d="M-60 1320 C150 1230 340 1390 560 1305 S920 1260 1160 1395"
          stroke="#7c314d"
          strokeWidth="2.5"
        />
        <path
          d="M130 -90 C200 190 60 360 170 590 S260 1030 150 1190"
          stroke="#255b83"
          strokeWidth="2"
        />
        <path
          d="M950 520 C830 730 1020 930 910 1170 S845 1500 1030 1750"
          stroke="#255b83"
          strokeWidth="2"
        />
      </g>

      {particles.map((particle) => (
        <circle
          key={particle.key}
          cx={particle.x}
          cy={particle.y}
          r={particle.radius}
          fill={particle.cyan ? '#6ceee8' : '#ff6678'}
          opacity={particle.alpha}
          filter={particle.cyan ? 'url(#glowCyan)' : undefined}
        />
      ))}
    </g>
  );
}

function EyeGraphic({
  frame,
  scale = 1,
  constricted = 0,
  darkness = 0,
  crossSection = false,
}: {
  frame: number;
  scale?: number;
  constricted?: number;
  darkness?: number;
  crossSection?: boolean;
}) {
  const pupilRadius = lerp(38, 12, clamp01(constricted));
  const blink = 1 + sine(frame, 0.025) * 0.008;

  const irisLines = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const inner = 57 + (i % 3) * 4;
    const outer = 91 + (i % 4) * 3;

    return {
      x1: Math.cos(angle) * inner,
      y1: Math.sin(angle) * inner,
      x2: Math.cos(angle + 0.035) * outer,
      y2: Math.sin(angle + 0.035) * outer,
      key: i,
    };
  });

  return (
    <g transform={`translate(540 850) scale(${scale * blink} ${scale})`}>
      <ellipse cx="0" cy="0" rx="455" ry="340" fill="url(#eyeAura)" opacity=".72" />

      <path
        d="M250 0 C320 -15 346 4 422 26 C454 35 479 16 504 9 C470 51 440 68 406 57 L255 42 Z"
        fill="url(#nerveGrad)"
        stroke="#f4d6ac"
        strokeOpacity=".45"
        strokeWidth="4"
      />

      <path
        d="M273 13 C340 12 389 41 451 29 M284 26 C350 26 392 52 432 43"
        fill="none"
        stroke="#6d7f90"
        strokeWidth="3"
        opacity=".64"
      />

      <path
        d="M-356 0 C-247 -164 247 -164 356 0 C247 164 -247 164 -356 0 Z"
        fill="url(#scleraGrad)"
        stroke="#c9f7ff"
        strokeWidth="9"
      />

      <path
        d="M-334 -3 C-223 -142 225 -142 334 -3"
        fill="none"
        stroke="#ffffff"
        strokeWidth="8"
        opacity=".78"
      />

      <g fill="none" strokeLinecap="round" opacity=".36">
        <path
          d="M-288 -28 C-238 -18 -235 13 -180 28 S-112 21 -86 42"
          stroke="#d74c69"
          strokeWidth="4"
        />
        <path
          d="M-250 65 C-200 51 -193 71 -153 82 S-120 68 -95 78"
          stroke="#ee677d"
          strokeWidth="3"
        />
        <path
          d="M-298 -63 C-251 -76 -225 -49 -185 -67"
          stroke="#7bbacb"
          strokeWidth="3"
        />
        <path
          d="M234 -58 C190 -39 178 -10 139 -11"
          stroke="#d45b74"
          strokeWidth="3"
        />
        <path
          d="M245 56 C199 44 188 58 162 72"
          stroke="#da7280"
          strokeWidth="3"
        />
      </g>

      <ellipse cx="0" cy="0" rx="126" ry="132" fill="#0a243c" opacity=".22" />
      <circle cx="0" cy="0" r="105" fill="url(#irisGrad)" stroke="#97fff4" strokeWidth="5" />
      <circle cx="0" cy="0" r="96" fill="none" stroke="#9efff6" strokeWidth="2" opacity=".66" />

      {irisLines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={line.key % 2 ? '#8ffcf3' : '#073a61'}
          strokeWidth={line.key % 3 === 0 ? 3.5 : 2}
          opacity=".48"
        />
      ))}

      <circle cx="0" cy="0" r={pupilRadius + 10} fill="#06101d" opacity=".72" />
      <circle
        cx="0"
        cy="0"
        r={pupilRadius}
        fill="url(#pupilGrad)"
        stroke="#9bfff4"
        strokeWidth={constricted > 0.4 ? 2 : 1}
      />

      <ellipse
        cx="-34"
        cy="-44"
        rx="18"
        ry="10"
        fill="#ffffff"
        opacity=".88"
        transform="rotate(-38 -34 -44)"
      />
      <circle cx="29" cy="34" r="6" fill="#e9ffff" opacity=".76" />

      <path
        d="M-356 0 C-247 -164 247 -164 356 0"
        fill="none"
        stroke="#edfaff"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M-356 0 C-247 164 247 164 356 0"
        fill="none"
        stroke="#789db7"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M-329 -14 C-210 -136 210 -136 329 -14"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        opacity=".6"
      />

      {crossSection && (
        <g>
          <path
            d="M110 -120 C222 -109 294 -61 322 0 C296 70 223 112 112 121 C175 75 190 39 190 0 C190 -42 169 -82 110 -120 Z"
            fill="#ffa67d"
            opacity=".26"
            stroke="#ffcf8e"
            strokeWidth="3"
          />
          <path
            d="M135 -108 C211 -82 259 -45 282 0 C258 45 208 79 136 105"
            fill="none"
            stroke="#ff8e7a"
            strokeWidth="8"
            opacity=".86"
          />
          <path
            d="M155 -87 C213 -63 240 -35 257 0 C241 31 214 55 157 83"
            fill="none"
            stroke="#ffe4a0"
            strokeWidth="5"
            opacity=".9"
          />
          <path
            d="M179 -59 C212 -43 231 -22 239 0 C231 21 213 42 180 58"
            fill="none"
            stroke="#74fff0"
            strokeWidth="4"
            opacity=".9"
          />
          <path
            d="M208 -31 C226 -23 232 -12 235 0 C231 12 224 23 207 31"
            fill="none"
            stroke="#f8fff9"
            strokeWidth="3"
            opacity=".9"
          />
        </g>
      )}

      {darkness > 0 && (
        <g>
          <ellipse
            cx="0"
            cy="0"
            rx="357"
            ry="166"
            fill="url(#blindnessGrad)"
            opacity={clamp01(darkness)}
          />
          <path
            d="M-356 0 C-247 -164 247 -164 356 0 C247 164 -247 164 -356 0 Z"
            fill="#03060a"
            opacity={clamp01(darkness) * 0.74}
          />
          <circle cx="0" cy="0" r="98" fill="#05080d" opacity={clamp01(darkness)} />
        </g>
      )}
    </g>
  );
}

function TCell({
  x,
  y,
  frame,
  size = 1,
  alert = false,
  opacity = 1,
  bobPhase = 0,
}: {
  x: number;
  y: number;
  frame: number;
  size?: number;
  alert?: boolean;
  opacity?: number;
  bobPhase?: number;
}) {
  const bob = sine(frame, 0.045, bobPhase) * 9;
  const turn = sine(frame, 0.012, bobPhase) * 9;
  const core = alert ? '#ff354f' : '#8ffff0';

  return (
    <g
      transform={`translate(${x} ${y + bob}) rotate(${turn}) scale(${size})`}
      opacity={opacity}
    >
      <circle
        r="62"
        fill={alert ? '#ff314d' : '#00d6d2'}
        opacity=".12"
        filter={alert ? 'url(#glowRed)' : 'url(#glowCyan)'}
      />
      <path
        d="M-42 -31 C-24 -58 16 -59 39 -34 C58 -14 56 22 34 42 C12 62 -24 53 -42 31 C-56 13 -56 -13 -42 -31 Z"
        fill="url(#cellGrad)"
        stroke={alert ? '#ff9ca7' : '#a7fff7'}
        strokeWidth="4"
      />
      <ellipse cx="-5" cy="-2" rx="22" ry="27" fill={alert ? '#7a1327' : '#137487'} opacity=".93" />
      <ellipse
        cx="-10"
        cy="-9"
        rx="11"
        ry="14"
        fill={core}
        opacity=".92"
        filter={alert ? 'url(#glowRed)' : undefined}
      />
      <circle cx="21" cy="-21" r="6" fill="#ffffff" opacity=".78" />
      <path
        d="M-34 -4 L-47 -12 M-31 21 L-43 30 M5 41 L4 53 M35 10 L49 16 M18 -40 L23 -51"
        stroke={alert ? '#ff687b' : '#8ffcf3'}
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".8"
      />
      <circle r="39" fill="none" stroke={core} strokeWidth="2" opacity=".46" />
    </g>
  );
}

function Antibody({
  x,
  y,
  frame,
  progress,
  phase = 0,
}: {
  x: number;
  y: number;
  frame: number;
  progress: number;
  phase?: number;
}) {
  const flicker = 0.72 + (Math.sin(frame * 0.18 + phase) + 1) * 0.14;
  const grow = 0.75 + progress * 0.34;

  return (
    <g
      transform={`translate(${x} ${y}) rotate(${Math.sin(frame * 0.03 + phase) * 12}) scale(${grow})`}
      opacity={flicker}
    >
      <path
        d="M0 28 L0 0 M0 0 L-19 -25 M0 0 L19 -25"
        fill="none"
        stroke="url(#antibodyGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glowCyan)"
      />
      <circle cx="-19" cy="-25" r="5" fill="#ecffb4" />
      <circle cx="19" cy="-25" r="5" fill="#ecffb4" />
      <circle cx="0" cy="28" r="5" fill="#79e7ad" />
    </g>
  );
}

function RadarBeam({ frame, scene }: { frame: number; scene: Scene }) {
  const start = sceneStartFrame(scene);
  const local = frame - start;
  const angle = interpolate(
    local,
    [0, Math.round(2.2 * FPS), Math.round(5.2 * FPS)],
    [-76, 0, 72],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const pulse = 0.6 + (Math.sin(frame * 0.18) + 1) * 0.2;

  return (
    <g transform={`translate(540 850) rotate(${angle})`}>
      <path
        d="M0 0 L-510 -95 A520 520 0 0 1 -510 95 Z"
        fill="#00f4e8"
        opacity={0.055 * pulse}
      />
      <path d="M0 0 L-510 -95" stroke="#00d2d3" strokeWidth="2.5" opacity=".62" />
      <path d="M0 0 L-510 95" stroke="#00d2d3" strokeWidth="2.5" opacity=".25" />
      <circle cx="-485" cy="0" r="10" fill="#b8fffa" opacity=".8" filter="url(#glowCyan)" />
    </g>
  );
}

function StatusPill({
  x,
  y,
  width,
  label,
  sublabel,
  color,
  frame,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  sublabel?: string;
  color: string;
  frame: number;
}) {
  const alpha = 0.87 + (Math.sin(frame * 0.09) + 1) * 0.065;

  return (
    <g transform={`translate(${x} ${y})`} opacity={alpha}>
      <rect
        x={-width / 2}
        y="-42"
        width={width}
        height={sublabel ? 88 : 68}
        rx="18"
        fill="#081120"
        fillOpacity=".92"
        stroke={color}
        strokeOpacity=".72"
        strokeWidth="2"
      />
      <circle cx={-width / 2 + 23} cy="-9" r="5" fill={color} filter="url(#glowCyan)" />
      <text
        x="0"
        y="-1"
        fill={color}
        textAnchor="middle"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="24"
        fontWeight="900"
        letterSpacing="1.4"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x="0"
          y="28"
          fill="#eaf6ff"
          opacity=".9"
          textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="17"
          fontWeight="700"
          letterSpacing="2"
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

function HexShield({
  frame,
  progress,
  broken = false,
}: {
  frame: number;
  progress: number;
  broken?: boolean;
}) {
  const r = 430;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${540 + Math.cos(angle) * r},${850 + Math.sin(angle) * r}`;
  }).join(' ');

  const inner = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${540 + Math.cos(angle) * (r - 36)},${850 + Math.sin(angle) * (r - 36)}`;
  }).join(' ');

  const opacity = interpolate(progress, [0, 0.18, 1], [0, 1, 0.94]);

  return (
    <g opacity={opacity}>
      <circle cx="540" cy="850" r="490" fill="url(#eyeAura)" opacity=".32" />
      <polygon
        points={points}
        fill="#24dcd7"
        fillOpacity={broken ? '.025' : '.045'}
        stroke="url(#shieldGrad)"
        strokeWidth="6"
        strokeLinejoin="round"
        filter="url(#glowGold)"
        strokeDasharray={broken ? '215 26 80 18' : 'none'}
      />
      <polygon
        points={inner}
        fill="none"
        stroke="#b5fff8"
        strokeWidth="2"
        strokeOpacity=".7"
        strokeLinejoin="round"
      />

      {Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = 540 + Math.cos(angle) * 360;
        const hy = 850 + Math.sin(angle) * 360;

        return (
          <circle
            key={i}
            cx={hx}
            cy={hy}
            r={7 + Math.sin(frame * 0.07 + i) * 1.5}
            fill="#fff4b9"
            filter="url(#glowGold)"
          />
        );
      })}

      {!broken &&
        Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i;
          const x1 = 540 + Math.cos(angle) * 210;
          const y1 = 850 + Math.sin(angle) * 210;
          const x2 = 540 + Math.cos(angle) * 430;
          const y2 = 850 + Math.sin(angle) * 430;

          return (
            <path
              key={`ray-${i}`}
              d={`M${x1} ${y1} L${x2} ${y2}`}
              stroke="#67fff1"
              strokeWidth="2"
              strokeOpacity=".28"
            />
          );
        })}

      {broken && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M540 420 L518 515 L564 584 L531 661 L570 723" stroke="#efffff" strokeWidth="5" />
          <path d="M886 675 L811 696 L780 755 L727 771 L702 824" stroke="#ff7b8a" strokeWidth="5" />
          <path d="M223 997 L293 968 L323 906 L382 891 L411 844" stroke="#fff6da" strokeWidth="5" />
          <path d="M595 1266 L573 1198 L617 1147 L597 1096" stroke="#ffb2b8" strokeWidth="4" />
          <path d="M340 553 L402 582 L415 635" stroke="#cffffa" strokeWidth="4" />
        </g>
      )}
    </g>
  );
}

function WarningTriangle({
  x,
  y,
  frame,
  delay = 0,
}: {
  x: number;
  y: number;
  frame: number;
  delay?: number;
}) {
  const flash = Math.max(0, Math.sin((frame - delay) * 0.22));
  const scale = 0.9 + flash * 0.1;

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      opacity={0.3 + flash * 0.7}
    >
      <path
        d="M0 -32 L31 25 L-31 25 Z"
        fill="#ff304c"
        fillOpacity=".15"
        stroke="#ff455c"
        strokeWidth="4"
        filter="url(#glowRed)"
      />
      <path d="M0 -13 L0 7" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="0" cy="16" r="3.8" fill="#fff" />
    </g>
  );
}

function Reticle({ frame, progress }: { frame: number; progress: number }) {
  const scale = spring({
    frame: Math.max(0, Math.round(progress * 28)),
    fps: FPS,
    config: { damping: 11, stiffness: 185 },
  });
  const radius = lerp(380, 326, clamp01(progress));
  const opacity = clamp01(progress) * (0.83 + Math.sin(frame * 0.2) * 0.12);

  return (
    <g
      transform={`translate(540 850) scale(${lerp(0.72, 1, scale)})`}
      opacity={opacity}
    >
      <circle r={radius + 30} fill="url(#greenTarget)" />
      <circle
        r={radius}
        fill="none"
        stroke="#b5ff77"
        strokeWidth="4"
        strokeDasharray="14 14"
        filter="url(#glowCyan)"
      />
      <circle
        r={radius - 25}
        fill="none"
        stroke="#a5ff62"
        strokeWidth="2"
        strokeOpacity=".68"
      />
      <path
        d={`M0 ${-radius - 54} V${-radius + 3} M0 ${radius - 3} V${radius + 54} M${-radius - 54} 0 H${-radius + 3} M${radius - 3} 0 H${radius + 54}`}
        stroke="#c7ff8a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle r="22" fill="none" stroke="#d6ff9e" strokeWidth="3" />
      <circle r="5" fill="#d6ff9e" />
    </g>
  );
}

function Shockwave({
  frame,
  startFrame,
  color = '#ff465d',
}: {
  frame: number;
  startFrame: number;
  color?: string;
}) {
  const elapsed = frame - startFrame;
  if (elapsed < 0 || elapsed > 88) return null;

  const p = clamp01(elapsed / 88);

  return (
    <g transform="translate(540 850)">
      {[0, 1, 2].map((ring) => {
        const local = clamp01((p - ring * 0.12) / 0.88);
        const radius = 30 + local * 510;

        return (
          <circle
            key={ring}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={5 - ring}
            opacity={(1 - local) * 0.72}
            filter="url(#glowRed)"
          />
        );
      })}
      <circle r={75 * (1 - p)} fill="url(#redFlash)" opacity={1 - p} />
    </g>
  );
}

function SceneOne({ frame, scene }: { frame: number; scene: Scene }) {
  const progress = progressFor(frame, scene);
  const cellPositions = [
    { x: 190, y: 650, size: 0.62, phase: 0.1 },
    { x: 830, y: 610, size: 0.58, phase: 1.8 },
    { x: 230, y: 1110, size: 0.53, phase: 3.0 },
    { x: 845, y: 1110, size: 0.61, phase: 4.3 },
    { x: 340, y: 440, size: 0.40, phase: 2.4 },
  ];

  return (
    <g>
      <ellipse cx="540" cy="850" rx="465" ry="355" fill="url(#eyeAura)" opacity=".37" />
      <EyeGraphic frame={frame} scale={0.92} />
      <ellipse
        cx="540"
        cy="850"
        rx="426"
        ry="222"
        fill="none"
        stroke="#56f6ee"
        strokeWidth="2"
        strokeDasharray="4 16"
        opacity=".38"
      />
      <ellipse
        cx="540"
        cy="850"
        rx="389"
        ry="183"
        fill="none"
        stroke="#a6fffa"
        strokeWidth="2"
        strokeDasharray="3 20"
        opacity=".20"
      />

      <RadarBeam frame={frame} scene={scene} />

      {cellPositions.map((cell, i) => (
        <TCell
          key={i}
          x={cell.x + sine(frame, 0.012, cell.phase) * 15}
          y={cell.y + sine(frame, 0.02, cell.phase) * 13}
          frame={frame}
          size={cell.size}
          bobPhase={cell.phase}
        />
      ))}

      <StatusPill
        x={540}
        y={1256}
        width={440}
        label="0% DETECTED"
        sublabel="STEALTH MODE // EYE OFF RADAR"
        color="#00d2d3"
        frame={frame}
      />

      <g opacity={0.4 + progress * 0.35}>
        <circle
          cx="540"
          cy="850"
          r={500 + Math.sin(frame * 0.06) * 9}
          fill="none"
          stroke="#48f0e5"
          strokeWidth="2"
          strokeDasharray="2 24"
        />
      </g>
    </g>
  );
}

function SceneTwo({ frame, scene }: { frame: number; scene: Scene }) {
  const progress = progressFor(frame, scene);
  const blackout = clamp01((frame - Math.round(7.0 * FPS)) / Math.round(0.9 * FPS));
  const danger = clamp01((frame - Math.round(5.3 * FPS)) / 18);

  return (
    <g>
      <ellipse
        cx="540"
        cy="850"
        rx="460"
        ry="340"
        fill="url(#redFlash)"
        opacity={0.42 + danger * 0.3}
      />

      <EyeGraphic
        frame={frame}
        scale={1}
        constricted={clamp01(progress * 1.35)}
        darkness={blackout * 0.94}
      />

      <g transform={`translate(540 850) rotate(${sine(frame, 0.09) * 2})`}>
        <ellipse
          rx="397"
          ry="235"
          fill="none"
          stroke="#ff2e4c"
          strokeWidth="4"
          strokeDasharray="12 9"
          opacity={0.35 + danger * 0.6}
          filter="url(#glowRed)"
        />
        <path
          d="M-450 -240 L-375 -180 M450 -240 L375 -180 M-455 240 L-380 180 M455 240 L380 180"
          fill="none"
          stroke="#ff2e4c"
          strokeWidth="6"
          strokeLinecap="round"
          opacity=".8"
        />
      </g>

      <WarningTriangle x={225} y={575} frame={frame} delay={0} />
      <WarningTriangle x={855} y={575} frame={frame} delay={9} />
      <WarningTriangle x={540} y={1190} frame={frame} delay={4} />

      <path
        d="M540 658 L516 735 L547 779 L525 824 L546 871 L515 932 L548 989"
        fill="none"
        stroke="#080b10"
        strokeWidth={8 * blackout}
        strokeLinecap="round"
        opacity={blackout}
      />
      <path
        d="M518 735 L474 759 L491 804 M547 779 L594 802 L574 848 M525 824 L482 865 L496 905"
        fill="none"
        stroke="#090c12"
        strokeWidth={5 * blackout}
        strokeLinecap="round"
        opacity={blackout}
      />

      <StatusPill
        x={540}
        y={1253}
        width={472}
        label="IMMUNE ALERT"
        sublabel="EYE DETECTED // LOCK CONFIRMED"
        color="#ff4058"
        frame={frame}
      />
    </g>
  );
}

function SceneThree({ frame, scene }: { frame: number; scene: Scene }) {
  const progress = progressFor(frame, scene);
  const bounceProgress = clamp01((frame - Math.round(11.2 * FPS)) / 26);

  const cells = [
    { x0: 85, y0: 670, x1: 136, y1: 590, x2: 72, y2: 514, phase: 0.3 },
    { x0: 973, y0: 725, x1: 928, y1: 640, x2: 1000, y2: 564, phase: 1.8 },
    { x0: 185, y0: 1240, x1: 236, y1: 1192, x2: 166, y2: 1300, phase: 2.5 },
    { x0: 930, y0: 1170, x1: 881, y1: 1150, x2: 970, y2: 1255, phase: 3.6 },
  ];

  return (
    <g>
      <HexShield frame={frame} progress={progress} />
      <EyeGraphic frame={frame} scale={0.83} crossSection />

      <g opacity=".93">
        {cells.map((cell, i) => {
          const x =
            bounceProgress < 1
              ? lerp(cell.x0, cell.x1, Math.min(1, bounceProgress * 2))
              : lerp(cell.x1, cell.x2, clamp01((bounceProgress - 0.5) * 2));
          const y =
            bounceProgress < 1
              ? lerp(cell.y0, cell.y1, Math.min(1, bounceProgress * 2))
              : lerp(cell.y1, cell.y2, clamp01((bounceProgress - 0.5) * 2));

          return (
            <TCell
              key={i}
              x={x + sine(frame, 0.05, cell.phase) * 5}
              y={y}
              frame={frame}
              size={0.43}
              bobPhase={cell.phase}
            />
          );
        })}
      </g>

      {bounceProgress > 0 &&
        cells.map((cell, i) => (
          <g
            key={`bounce-${i}`}
            opacity={(1 - clamp01(bounceProgress)) * 0.6 + 0.12}
          >
            <circle
              cx={cell.x1}
              cy={cell.y1}
              r={20 + bounceProgress * 22}
              fill="none"
              stroke="#fff1ac"
              strokeWidth="3"
              filter="url(#glowGold)"
            />
            <path
              d={`M${cell.x1 - 18} ${cell.y1 - 11} l16 11 l-16 11`}
              fill="none"
              stroke="#fff1ac"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}

      <StatusPill
        x={540}
        y={1350}
        width={590}
        label="BLOOD–OCULAR BARRIER"
        sublabel="IMMUNE PRIVILEGE // ACCESS DENIED"
        color="#63f8df"
        frame={frame}
      />

      <g transform="translate(540 1462)" opacity=".78">
        <path d="M-210 0 H-135 M135 0 H210" stroke="#6bf8e5" strokeWidth="2" />
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fill="#d7fff8"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="18"
          fontWeight="800"
          letterSpacing="4"
        >
          PROTECTED TISSUE
        </text>
      </g>
    </g>
  );
}

function SceneFour({ frame, scene }: { frame: number; scene: Scene }) {
  const progress = progressFor(frame, scene);
  const impactFrame = Math.round(15.2 * FPS);
  const alarmFrame = Math.round(17.5 * FPS);
  const distress = clamp01((frame - alarmFrame) / 14);
  const pulse = 0.5 + (Math.sin(frame * 0.26) + 1) * 0.25;

  return (
    <g>
      <HexShield frame={frame} progress={progress} broken />
      <EyeGraphic frame={frame} scale={0.83} crossSection />
      <Shockwave frame={frame} startFrame={impactFrame} />

      <g opacity={distress}>
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="540"
            cy="850"
            r={470 + ((frame - alarmFrame) * 8 + i * 95) % 360}
            fill="none"
            stroke="#ff425d"
            strokeWidth={3 - i * 0.45}
            opacity={0.5 - i * 0.12}
          />
        ))}
        <circle cx="540" cy="850" r="505" fill="url(#redFlash)" opacity={pulse * 0.52} />
      </g>

      <TCell
        x={173 + sine(frame, 0.08) * 6}
        y={680}
        frame={frame}
        size={0.55}
        alert={distress > 0.25}
        bobPhase={0.4}
      />
      <TCell
        x={910 + sine(frame, 0.07, 1) * 7}
        y={770}
        frame={frame}
        size={0.6}
        alert={distress > 0.25}
        bobPhase={1.1}
      />
      <TCell
        x={270}
        y={1160 + sine(frame, 0.06, 2) * 7}
        frame={frame}
        size={0.48}
        alert={distress > 0.25}
        bobPhase={2.5}
      />

      <WarningTriangle x={540} y={425} frame={frame} delay={impactFrame} />

      <StatusPill
        x={540}
        y={1350}
        width={510}
        label="BARRIER BREACHED"
        sublabel="DISTRESS SIGNAL BROADCAST"
        color="#ff5367"
        frame={frame}
      />
    </g>
  );
}

function SceneFive({ frame, scene }: { frame: number; scene: Scene }) {
  const reticleProgress = clamp01((frame - Math.round(19.6 * FPS)) / 20);
  const attackProgress = clamp01(
    (frame - Math.round(21.0 * FPS)) / Math.round(2.6 * FPS),
  );
  const blindness = clamp01(
    (frame - Math.round(23.5 * FPS)) / Math.round(1.2 * FPS),
  );

  const swarm = [
    { x: 135, y: 575, phase: 0.2 },
    { x: 925, y: 595, phase: 1.1 },
    { x: 120, y: 1080, phase: 2.2 },
    { x: 963, y: 1122, phase: 2.8 },
    { x: 330, y: 420, phase: 3.7 },
    { x: 790, y: 430, phase: 4.4 },
    { x: 330, y: 1270, phase: 5.4 },
    { x: 790, y: 1300, phase: 5.9 },
  ];

  return (
    <g>
      <ellipse
        cx="540"
        cy="850"
        rx="485"
        ry="380"
        fill={blindness > 0 ? '#6e747c' : 'url(#redFlash)'}
        opacity={0.28 + attackProgress * 0.12}
      />

      <EyeGraphic frame={frame} scale={0.9} darkness={blindness} />
      <Reticle frame={frame} progress={reticleProgress} />

      {swarm.map((cell, index) => {
        const p = attackProgress;
        const x = lerp(cell.x, 540 + Math.sin(cell.phase) * 110, p);
        const y = lerp(cell.y, 850 + Math.cos(cell.phase) * 130, p);

        return (
          <g key={index}>
            <TCell
              x={x}
              y={y}
              frame={frame}
              size={0.28 + (index % 3) * 0.055}
              alert
              opacity={0.18 + p * 0.82}
              bobPhase={cell.phase}
            />
            <Antibody
              x={lerp(cell.x + 40, 540 + Math.sin(cell.phase + 1) * 210, p)}
              y={lerp(cell.y - 25, 850 + Math.cos(cell.phase + 1) * 190, p)}
              frame={frame}
              progress={p}
              phase={cell.phase}
            />
          </g>
        );
      })}

      {attackProgress > 0 && (
        <g opacity={attackProgress}>
          <path
            d="M716 846 C750 834 780 833 816 858 C841 876 868 876 900 869"
            fill="none"
            stroke="#ff3e56"
            strokeWidth={9 - blindness * 5}
            strokeLinecap="round"
            filter="url(#glowRed)"
          />
          <path
            d="M-10 0 L-45 -20 L-32 -7 L-54 3 L-29 10 L-41 25 Z"
            transform="translate(741 850) rotate(5)"
            fill="#ff4359"
            opacity=".85"
          />
          <circle cx="755" cy="847" r="22" fill="url(#redFlash)" />
        </g>
      )}

      <StatusPill
        x={540}
        y={1360}
        width={475}
        label={blindness > 0.8 ? 'SIGNAL LOST' : 'VIRUS TARGET'}
        sublabel={
          blindness > 0.8
            ? 'RETINA // OPTIC NERVE SILENCED'
            : 'TARGET CLASSIFICATION: FOREIGN'
        }
        color={blindness > 0.8 ? '#8d9aa8' : '#a5ff62'}
        frame={frame}
      />

      <g opacity={blindness}>
        <rect
          x="0"
          y="0"
          width={WIDTH}
          height={HEIGHT}
          fill="#05070b"
          opacity={blindness * 0.12}
        />
        <path
          d="M210 790 H870 M540 535 V1160"
          stroke="#c2c7cc"
          strokeWidth="2"
          strokeDasharray="2 18"
          opacity=".28"
        />
      </g>
    </g>
  );
}

function CartoonFriend({ frame, progress }: { frame: number; progress: number }) {
  const wobble = Math.sin(frame * 0.09) * 2.5;
  const phoneTilt = -9 + Math.sin(frame * 0.055) * 2;
  const blink = Math.max(0, Math.sin(frame * 0.035 - 1.2));

  return (
    <g transform={`translate(${wobble} 0)`}>
      <ellipse
        cx="525"
        cy="1315"
        rx="238"
        ry="46"
        fill="#00040b"
        opacity=".48"
        filter="url(#softShadow)"
      />

      <path
        d="M390 1040 C360 1110 350 1190 366 1290 C430 1340 624 1340 694 1280 L666 1080 C616 1038 449 1024 390 1040 Z"
        fill="#243f69"
        stroke="#5b9ed1"
        strokeWidth="5"
      />
      <path
        d="M418 1084 C465 1124 600 1126 650 1080"
        fill="none"
        stroke="#7de4e4"
        strokeWidth="5"
        opacity=".7"
      />
      <path
        d="M432 1000 C438 1040 429 1060 414 1080 L463 1124 L523 1088 L581 1126 L635 1082 C610 1054 605 1020 610 985 Z"
        fill="#d78a64"
      />

      <path
        d="M382 785 C382 681 444 600 535 600 C638 600 686 676 671 789 L652 926 C637 1018 571 1060 514 1048 C441 1033 397 972 391 893 Z"
        fill="#f0b184"
        stroke="#ffd0a8"
        strokeWidth="6"
      />

      <path
        d="M392 782 C364 689 402 599 489 575 C548 559 615 580 653 625 C686 664 694 709 671 765 L636 720 L598 688 L546 701 L489 671 L437 720 Z"
        fill="#24202a"
      />
      <path
        d="M410 688 C450 625 486 626 531 643 C577 660 609 635 641 676"
        fill="none"
        stroke="#51404c"
        strokeWidth="19"
        strokeLinecap="round"
      />
      <path
        d="M394 795 C357 760 345 808 370 852 C382 874 395 870 402 850"
        fill="#e5a177"
        stroke="#f5c29b"
        strokeWidth="5"
      />
      <path
        d="M662 793 C702 758 714 807 688 851 C676 871 663 866 656 847"
        fill="#e5a177"
        stroke="#f5c29b"
        strokeWidth="5"
      />

      <g transform="rotate(-5 535 781)">
        <path
          d="M422 764 C438 741 482 738 509 758 L511 814 C490 837 445 832 424 808 Z"
          fill="#f7f1da"
          stroke="#050913"
          strokeWidth="17"
          strokeLinejoin="round"
        />
        <path
          d="M542 758 C569 739 615 751 632 776 L626 822 C607 840 562 832 545 811 Z"
          fill="#f7f1da"
          stroke="#050913"
          strokeWidth="17"
          strokeLinejoin="round"
        />
        <path
          d="M508 774 Q527 759 545 775"
          fill="none"
          stroke="#050913"
          strokeWidth="17"
          strokeLinecap="round"
        />
        <path
          d="M435 763 L421 745 M613 766 L634 750"
          stroke="#050913"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <ellipse
          cx="471"
          cy="785"
          rx="17"
          ry={Math.max(4, 16 - blink * 12)}
          fill="#2b548a"
        />
        <ellipse
          cx="583"
          cy="785"
          rx="17"
          ry={Math.max(4, 16 - blink * 12)}
          fill="#2b548a"
        />
        <circle cx="476" cy="780" r="5" fill="#fff" />
        <circle cx="588" cy="780" r="5" fill="#fff" />
      </g>

      <path
        d="M526 784 C514 815 515 832 536 835"
        fill="none"
        stroke="#b56b55"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M482 883 C508 858 552 861 574 884 C550 915 510 919 482 883 Z"
        fill="#572b38"
        stroke="#7b3746"
        strokeWidth="5"
      />
      <path
        d="M493 880 Q528 890 561 878"
        fill="none"
        stroke="#fff1dd"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M449 730 L487 718 M567 723 L607 739"
        stroke="#1a1720"
        strokeWidth="13"
        strokeLinecap="round"
      />

      <path
        d="M405 1102 C370 1094 340 1117 332 1150 L369 1190 C399 1182 418 1155 421 1130 Z"
        fill="#f0b184"
        stroke="#ffd0a8"
        strokeWidth="4"
      />

      <g transform={`translate(695 1010) rotate(${phoneTilt})`}>
        <rect
          x="-4"
          y="-4"
          width="142"
          height="250"
          rx="23"
          fill="#9cfff7"
          opacity=".15"
          filter="url(#glowCyan)"
        />
        <rect
          x="0"
          y="0"
          width="132"
          height="238"
          rx="20"
          fill="url(#phoneGrad)"
          stroke="#b2c9dc"
          strokeWidth="5"
        />
        <rect x="10" y="20" width="112" height="196" rx="12" fill="#0f273a" />
        <circle cx="66" cy="115" r="28" fill="#3ce8dc" opacity=".15" />
        <path
          d="M30 145 L49 122 L63 137 L84 95 L105 120"
          fill="none"
          stroke="#47e7da"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="66" cy="10" r="3" fill="#dce8f3" />
        <rect x="39" y="224" width="55" height="4" rx="2" fill="#8197aa" />
      </g>

      <path
        d="M643 1089 C662 1091 676 1107 677 1123 C679 1140 665 1152 651 1145 L625 1125 Z"
        fill="#f0b184"
        stroke="#ffd0a8"
        strokeWidth="4"
      />

      <g transform={`translate(540 530) scale(${0.95 + progress * 0.04})`}>
        <path
          d="M-90 0 Q-50 -45 0 -18 Q45 -43 88 -4"
          fill="none"
          stroke="#ffc857"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M83 -17 L102 -4 L82 8"
          fill="none"
          stroke="#ffc857"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="0"
          y="-57"
          textAnchor="middle"
          fill="#ffe6a4"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="23"
          fontWeight="900"
          letterSpacing="2"
        >
          IMMUNE SYSTEM KNOWS?
        </text>
      </g>

      <g opacity=".72">
        <path
          d="M325 930 l-35 -9 l18 29 M740 932 l37 -5 l-22 24"
          fill="none"
          stroke="#ffc857"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M357 706 l-23 -21 M697 702 l24 -24"
          stroke="#ffc857"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

function SceneSix({ frame, scene }: { frame: number; scene: Scene }) {
  const progress = progressFor(frame, scene);
  const cardStart = Math.round(30.8 * FPS);

  const cardProgress = spring({
    frame: Math.max(0, frame - cardStart),
    fps: FPS,
    config: { damping: 12, stiffness: 155, mass: 0.7 },
  });

  const cardOpacity = interpolate(
    frame,
    [cardStart, cardStart + 8, cardStart + 20],
    [0, 1, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <g>
      <ellipse cx="540" cy="930" rx="460" ry="520" fill="url(#eyeAura)" opacity=".4" />

      <g opacity=".22" stroke="#ffc857" strokeWidth="2" fill="none">
        <circle cx="540" cy="865" r="415" strokeDasharray="2 22" />
        <circle cx="540" cy="865" r="365" strokeDasharray="4 18" />
      </g>

      <CartoonFriend frame={frame} progress={progress} />

      <g
        transform={`translate(540 1430) translate(0 ${interpolate(cardProgress, [0, 1], [90, 0])}) scale(${interpolate(cardProgress, [0, 1], [0.78, 1])})`}
        opacity={cardOpacity}
      >
        <rect
          x="-400"
          y="-73"
          width="800"
          height="146"
          rx="29"
          fill="#081520"
          fillOpacity=".96"
          stroke="#ffc857"
          strokeWidth="3"
        />
        <rect
          x="-389"
          y="-62"
          width="778"
          height="124"
          rx="23"
          fill="none"
          stroke="#ffdf8f"
          strokeOpacity=".22"
          strokeWidth="2"
        />
        <circle cx="-350" cy="0" r="24" fill="#ffc857" opacity=".16" />
        <path
          d="M-360 -12 L-350 1 L-340 -12 M-350 1 V18"
          fill="none"
          stroke="#ffc857"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="8"
          y="-7"
          textAnchor="middle"
          fill="#fff6df"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="27"
          fontWeight="950"
          letterSpacing="1.2"
        >
          TAG YOUR FRIEND IN COMMENTS
        </text>
        <text
          x="8"
          y="31"
          textAnchor="middle"
          fill="#ffc857"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="23"
          fontWeight="850"
          letterSpacing="4"
        >
          DROP THE NAME 👇
        </text>
      </g>

      <g transform={`translate(845 515) rotate(${sine(frame, 0.06) * 5})`} opacity=".92">
        <path
          d="M-40 0 C-6 12 8 34 8 61"
          fill="none"
          stroke="#ffc857"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M-5 48 L8 64 L22 48"
          fill="none"
          stroke="#ffc857"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="-142"
          y="-78"
          width="230"
          height="54"
          rx="18"
          fill="#101a2b"
          stroke="#ffc857"
          strokeWidth="2"
        />
        <text
          x="-27"
          y="-43"
          textAnchor="middle"
          fill="#ffe6a2"
          fontFamily="Inter, Arial, sans-serif"
          fontSize="18"
          fontWeight="900"
          letterSpacing="1"
        >
          CHASHMISH ALERT
        </text>
      </g>
    </g>
  );
}

function SceneArtwork({ frame, scene }: { frame: number; scene: Scene }) {
  const progress = progressFor(frame, scene);

  const scales: Record<SceneId, [number, number, number]> = {
    1: [1, 1.035, 1.075],
    2: [1.035, 1.105, 1.145],
    3: [0.97, 1.015, 1.035],
    4: [1, 1.09, 1.055],
    5: [1.02, 1.095, 1.15],
    6: [0.97, 1, 1.025],
  };

  const [startScale, midScale, endScale] = scales[scene.id];

  const cameraScale =
    progress < 0.5
      ? lerp(startScale, midScale, progress * 2)
      : lerp(midScale, endScale, (progress - 0.5) * 2);

  const panX =
    sine(frame, 0.012, scene.id) *
    (scene.id === 2 || scene.id === 5 ? 7 : 3);
  const panY = sine(frame, 0.01, scene.id * 0.9) * 4;

  const cameraTransform = `translate(${540 * (1 - cameraScale) + panX} ${960 * (1 - cameraScale) + panY}) scale(${cameraScale})`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ position: 'absolute', inset: 0 }}
    >
      <SvgDefs />
      <ParticleField frame={frame} />

      <g transform={cameraTransform}>
        {scene.id === 1 && <SceneOne frame={frame} scene={scene} />}
        {scene.id === 2 && <SceneTwo frame={frame} scene={scene} />}
        {scene.id === 3 && <SceneThree frame={frame} scene={scene} />}
        {scene.id === 4 && <SceneFour frame={frame} scene={scene} />}
        {scene.id === 5 && <SceneFive frame={frame} scene={scene} />}
        {scene.id === 6 && <SceneSix frame={frame} scene={scene} />}
      </g>
    </svg>
  );
}

const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const safeFrame = Math.min(frame, DURATION - 1);

  const activeScene =
    SCENES.find(
      (scene) =>
        safeFrame >= sceneStartFrame(scene) &&
        safeFrame < sceneEndFrame(scene),
    ) ?? SCENES[SCENES.length - 1];

  const fadeIn = interpolate(safeFrame, [0, 18], [0.78, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        width: WIDTH,
        height: HEIGHT,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 42%, #142541 0%, #0c1527 45%, #070b14 100%)',
        color: '#f5fbff',
        opacity: fadeIn,
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <Audio src={staticFile('sfx.wav')} />

      <SceneArtwork frame={safeFrame} scene={activeScene} />
      <SceneTitle frame={safeFrame} scene={activeScene} />
      <WordCaptions frame={safeFrame} scene={activeScene} />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(3,7,14,.14) 0%, transparent 18%, transparent 78%, rgba(2,5,11,.26) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
