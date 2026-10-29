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
  useVideoConfig,
} from 'remotion';

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2064; // 34.4 seconds

type Theme = 'dark' | 'paper';
type Scene = (typeof SCENES)[number];

const SCENES = [
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
    caption: 'Kya aapko pata hai ki agar aap space mein lambe samay tak rehkar',
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
    caption: 'wapas zameen par aayenge, toh aap apne twin brother se thode chhote, yaani younger lagenge?',
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
    caption: 'Darasal, Einstein ke theory ke mutabik, jahan gravity ya speed bahut zyada hoti hai, wahan time slow ho jata hai.',
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
    caption: 'Space station mein high speed par travel karne ki wajah se astronaut ka time zameen ke muqable thoda slow chalta hai, jisse woh literally future mein thoda aage chale jaate hain.',
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
    caption: 'Matlab, space travel ek tarah ki time machine hi hai!',
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
    caption: 'Waise, agar aapko kabhi time travel karke future mein jaane ka mauka mile, toh aap sabse pehle kiske paas jaana chahoge? Comment mein uska naam zaroor',
  },
] as const;

const clamp = (value: number, input: number[], output: number[]) =>
  interpolate(value, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const ease = (value: number, input: number[], output: number[]) =>
  interpolate(value, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const sceneStartFrame = (scene: Scene) => Math.round(scene.start * FPS);
const sceneEndFrame = (scene: Scene) => Math.round(scene.end * FPS);
const localFrameFor = (frame: number, scene: Scene) =>
  Math.max(0, frame - sceneStartFrame(scene));

function seededUnit(seed: number) {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
}

function Background({
  theme,
  frame,
}: {
  theme: Theme;
  frame: number;
}) {
  const stars = Array.from({ length: 118 }, (_, i) => {
    const x = 16 + seededUnit(i + 5) * 1048;
    const y = 20 + seededUnit(i + 210) * 1870;
    const r = 0.7 + seededUnit(i + 470) * 2.2;
    const twinkle =
      0.25 +
      0.75 *
        ((Math.sin(frame * (0.025 + seededUnit(i + 30) * 0.055) + i) + 1) /
          2);
    return { x, y, r, twinkle, key: i };
  });

  if (theme === 'paper') {
    return (
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(145deg, #f4efe4 0%, #eee5d5 48%, #e5dbc6 100%)',
          overflow: 'hidden',
        }}
      >
        <AbsoluteFill
          style={{
            backgroundImage:
              'linear-gradient(rgba(77,69,55,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(77,69,55,0.09) 1px, transparent 1px), linear-gradient(rgba(77,69,55,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(77,69,55,0.035) 1px, transparent 1px)',
            backgroundSize:
              '200px 200px, 200px 200px, 40px 40px, 40px 40px',
          }}
        />

        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ position: 'absolute', inset: 0 }}
        >
          <g
            stroke="#665d4c"
            strokeOpacity="0.24"
            fill="none"
            strokeWidth="2"
          >
            <path d="M 36 380 V 1500 M 44 380 V 1500 M 1036 380 V 1500 M 1044 380 V 1500" />

            {Array.from({ length: 29 }, (_, i) => {
              const y = 400 + i * 38;
              return (
                <path
                  key={i}
                  d={`M 26 ${y} h ${i % 5 === 0 ? 28 : 13} M 1054 ${y} h -${i % 5 === 0 ? 28 : 13}`}
                />
              );
            })}

            <path
              d="M 74 356 H 1006 M 74 1510 H 1006"
              strokeOpacity="0.45"
            />

            <path d="M 100 348 v 16 M 200 348 v 16 M 300 348 v 16 M 400 348 v 16 M 500 348 v 16 M 600 348 v 16 M 700 348 v 16 M 800 348 v 16 M 900 348 v 16 M 1000 348 v 16" />
          </g>

          <g
            fill="#625745"
            opacity="0.45"
            fontFamily="Arial, sans-serif"
            fontSize="14"
            letterSpacing="2"
          >
            <text x="62" y="386">
              FIG. 01
            </text>
            <text x="1018" y="386" textAnchor="end">
              FIELD NOTES / RELATIVITY
            </text>
            <text x="62" y="1538">
              ENGINEERING PAPER · 40 PX GRID
            </text>
            <text x="1018" y="1538" textAnchor="end">
              REV. 2026
            </text>
          </g>
        </svg>

        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 52%)',
            pointerEvents: 'none',
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at 50% 48%, #181d38 0%, #0b1022 48%, #060916 100%)',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 82%, rgba(212,130,90,0.23) 0%, rgba(212,130,90,0.06) 25%, transparent 49%), radial-gradient(ellipse at 82% 12%, rgba(0,229,255,0.07) 0%, transparent 36%)',
        }}
      />

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <radialGradient id="starHalo">
            <stop offset="0" stopColor="#d9faff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#d9faff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {stars.map((s) => (
          <g key={s.key} opacity={s.twinkle}>
            <circle
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={s.key % 7 === 0 ? '#ffce9b' : '#d9faff'}
            />

            {s.key % 19 === 0 && (
              <circle
                cx={s.x}
                cy={s.y}
                r={s.r * 5}
                fill="url(#starHalo)"
                opacity="0.22"
              />
            )}
          </g>
        ))}

        <g fill="none" stroke="#00e5ff" strokeOpacity="0.09">
          <circle cx="900" cy="1070" r="360" strokeWidth="1" />
          <circle cx="900" cy="1070" r="420" strokeWidth="1" />
          <circle cx="900" cy="1070" r="485" strokeWidth="1" />
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(6,9,22,0.08) 76%, rgba(6,9,22,0.38) 100%)',
        }}
      />
    </AbsoluteFill>
  );
}

function EditorialHeader({
  scene,
  frame,
}: {
  scene: Scene;
  frame: number;
}) {
  const local = localFrameFor(frame, scene);
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: local,
    fps,
    config: { damping: 19, stiffness: 125, mass: 0.82 },
  });

  const accent =
    scene.theme === 'paper'
      ? '#d93829'
      : scene.id === 3
        ? '#00e5ff'
        : scene.id === 5
          ? '#ffd166'
          : '#ff9f43';

  const primary = scene.theme === 'paper' ? '#24211d' : '#f8f7f2';
  const enterY = interpolate(reveal, [0, 1], [30, 0]);
  const blur = interpolate(reveal, [0, 1], [12, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 78,
        left: 42,
        right: 42,
        height: 270,
        textAlign: 'center',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          height: 30,
          opacity: interpolate(reveal, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            width: 108,
            height: 2,
            background: accent,
            opacity: 0.8,
          }}
        />

        <div
          style={{
            color: scene.theme === 'paper' ? '#5a5144' : '#d7e7f4',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 800,
            fontSize: 19,
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {scene.tag}
        </div>

        <div
          style={{
            width: 108,
            height: 2,
            background: accent,
            opacity: 0.8,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 14,
          transform: `translateY(${enterY}px)`,
          filter: `blur(${blur}px)`,
          opacity: reveal,
          fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
          fontSize: scene.id === 6 ? 60 : 64,
          lineHeight: 1.04,
          fontWeight: 900,
          letterSpacing: -1.4,
          textTransform: 'uppercase',
          color: primary,
          textShadow:
            scene.theme === 'dark'
              ? '0 6px 32px rgba(0,0,0,0.28)'
              : '0 2px 0 rgba(255,255,255,0.24)',
        }}
      >
        <div>{scene.titleWhite}</div>
        <div style={{ color: accent, marginTop: 3 }}>{scene.titleAccent}</div>
      </div>

      <div
        style={{
          width: 74,
          height: 5,
          borderRadius: 10,
          margin: '15px auto 0',
          background: accent,
          transform: `scaleX(${reveal})`,
          boxShadow:
            scene.theme === 'dark' ? `0 0 18px ${accent}66` : 'none',
        }}
      />
    </div>
  );
}

function punctuationPause(word: string) {
  if (/[.!?…]$/.test(word)) return 2.6;
  if (/[,;:]$/.test(word)) return 1.5;
  return 0;
}

function CaptionPill({
  scene,
  frame,
}: {
  scene: Scene;
  frame: number;
}) {
  const words = scene.caption.trim().split(/\s+/);
  const start = Math.round(scene.speechStart * FPS);
  const end = Math.round(scene.speechEnd * FPS);

  const weights = words.map(
    (word) =>
      Math.max(2, word.replace(/[^a-zA-Z0-9]/g, '').length) +
      punctuationPause(word),
  );

  const total = weights.reduce((a, b) => a + b, 0);
  const elapsed = Math.max(0, Math.min(end - start, frame - start));
  const weightedProgress = (elapsed / Math.max(1, end - start)) * total;

  let cumulative = 0;
  let activeIndex = 0;

  for (let i = 0; i < weights.length; i++) {
    if (weightedProgress >= cumulative) activeIndex = i;
    cumulative += weights[i];
    if (weightedProgress < cumulative) break;
  }

  if (frame >= end) activeIndex = words.length - 1;

  const chunkStart = Math.floor(activeIndex / 4) * 4;
  const visibleWords = words.slice(
    chunkStart,
    Math.min(chunkStart + 4, words.length),
  );

  const dark = scene.theme === 'dark';

  const highlight =
    scene.id === 2 || scene.id === 4 || scene.id === 6
      ? '#ff5252'
      : '#ffb142';

  const reveal = spring({
    frame: Math.max(0, frame - sceneStartFrame(scene)),
    fps: FPS,
    config: { damping: 20, stiffness: 150 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 1570,
        left: 55,
        right: 55,
        minHeight: 94,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 32px',
        borderRadius: 20,
        background: dark
          ? 'rgba(18,22,36,0.90)'
          : 'rgba(36,33,29,0.94)',
        border: `1.5px solid ${
          dark ? 'rgba(205,229,248,0.24)' : 'rgba(255,255,255,0.2)'
        }`,
        boxShadow: dark
          ? '0 18px 48px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 12px 32px rgba(35,25,12,0.20)',
        opacity: interpolate(reveal, [0, 1], [0.6, 1]),
        transform: `translateY(${interpolate(reveal, [0, 1], [12, 0])}px)`,
        zIndex: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0 10px',
          color: '#f8f5ef',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 34,
          lineHeight: 1.25,
          fontWeight: 700,
          letterSpacing: -0.45,
          textAlign: 'center',
        }}
      >
        {visibleWords.map((word, index) => {
          const absoluteIndex = chunkStart + index;
          const isActive = absoluteIndex === activeIndex;

          return (
            <span
              key={`${absoluteIndex}-${word}`}
              style={{
                color: isActive ? highlight : '#f8f5ef',
                textShadow: isActive ? `0 0 18px ${highlight}66` : 'none',
                transform: isActive ? 'translateY(-1px)' : 'none',
                transition: 'none',
                whiteSpace: 'pre',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 350,
        width: WIDTH,
        height: 1160,
        overflow: 'hidden',
        zIndex: 3,
      }}
    >
      {children}
    </div>
  );
}

function ISS({
  x,
  y,
  scale = 1,
  rotate = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g stroke="#d6a74e" strokeWidth="3" fill="#9c762e">
        <rect
          x="-410"
          y="-48"
          width="152"
          height="96"
          rx="3"
          fill="#173a58"
        />
        <rect
          x="258"
          y="-48"
          width="152"
          height="96"
          rx="3"
          fill="#173a58"
        />

        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={`l${i}`}
            d={`M ${-410 + i * 19} -48 V 48`}
            stroke="#d6a74e"
            strokeWidth="1.5"
          />
        ))}

        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={`r${i}`}
            d={`M ${258 + i * 19} -48 V 48`}
            stroke="#d6a74e"
            strokeWidth="1.5"
          />
        ))}

        {Array.from({ length: 5 }, (_, i) => (
          <path
            key={`lh${i}`}
            d={`M -410 ${-48 + i * 24} H -258`}
            stroke="#d6a74e"
            strokeWidth="1.5"
          />
        ))}

        {Array.from({ length: 5 }, (_, i) => (
          <path
            key={`rh${i}`}
            d={`M 258 ${-48 + i * 24} H 410`}
            stroke="#d6a74e"
            strokeWidth="1.5"
          />
        ))}

        <path
          d="M -255 0 H 255"
          fill="none"
          stroke="#c2cbd5"
          strokeWidth="11"
        />

        <path
          d="M -150 -18 H 150"
          fill="none"
          stroke="#dce5eb"
          strokeWidth="13"
        />

        <rect
          x="-118"
          y="-34"
          width="76"
          height="68"
          rx="15"
          fill="#d4d8da"
          stroke="#f6f4e9"
        />

        <rect
          x="-36"
          y="-42"
          width="96"
          height="84"
          rx="16"
          fill="#f0eee4"
          stroke="#ffffff"
          strokeWidth="3"
        />

        <rect
          x="64"
          y="-28"
          width="67"
          height="56"
          rx="13"
          fill="#d5dad9"
          stroke="#ffffff"
          strokeWidth="2"
        />

        <rect
          x="140"
          y="-21"
          width="60"
          height="42"
          rx="10"
          fill="#aebfca"
          stroke="#edf5f9"
          strokeWidth="2"
        />

        <path
          d="M -84 -34 V 34 M -44 -34 V 34 M -20 -42 V 42 M 12 -42 V 42 M 40 -42 V 42 M 80 -28 V 28 M 105 -28 V 28"
          stroke="#61717f"
          strokeWidth="2"
        />

        <path
          d="M -205 0 v -62 h 30 v 62 M 202 0 v -62 h 30 v 62"
          fill="none"
          stroke="#e3e8e8"
          strokeWidth="6"
        />

        <path
          d="M -140 -56 V 56 M 140 -56 V 56"
          fill="none"
          stroke="#f4d78a"
          strokeWidth="4"
        />
      </g>

      <g fill="#00e5ff" opacity="0.86">
        <circle cx="-4" cy="-2" r="6" />
        <circle cx="88" cy="0" r="4" />
      </g>
    </g>
  );
}

function Rocket({
  x,
  y,
  scale = 1,
  flame = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  flame?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      strokeLinejoin="round"
    >
      <ellipse
        cx="0"
        cy="57"
        rx="26"
        ry={45 * flame}
        fill="#ff6d35"
        opacity={0.55 * flame}
        filter="url(#rocketGlow)"
      />

      <path
        d={`M -12 48 L 0 ${48 + 72 * flame} L 12 48 Z`}
        fill="#ffb142"
        opacity={flame}
      />

      <path
        d={`M -5 48 L 0 ${48 + 48 * flame} L 5 48 Z`}
        fill="#fff2bb"
        opacity={flame}
      />

      <path
        d="M -22 25 L -37 48 L -20 45 M 22 25 L 37 48 L 20 45"
        fill="#e64f35"
        stroke="#ffb142"
        strokeWidth="3"
      />

      <path
        d="M -22 24 Q -25 -26 0 -63 Q 25 -26 22 24 Z"
        fill="#e4e7ec"
        stroke="#ffffff"
        strokeWidth="3"
      />

      <path
        d="M -15 -2 Q 0 -22 15 -2 L 13 15 H -13 Z"
        fill="#274c6b"
        stroke="#7de9f2"
        strokeWidth="2"
      />

      <path
        d="M -20 18 H 20 L 15 40 H -15 Z"
        fill="#c2c8d0"
        stroke="#ffffff"
        strokeWidth="2"
      />

      <path
        d="M -9 -38 L 0 -55 L 9 -38"
        fill="none"
        stroke="#ffb142"
        strokeWidth="3"
      />
    </g>
  );
}

function SceneOne({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const local = localFrameFor(frame, scene);
  const seconds = local / FPS;

  const cameraY = ease(local, [0, 252], [-1900, -600]);
  const rocketY = ease(local, [0, 250], [2670, 900]);
  const rocketFlame = clamp(local, [0, 190, 250], [1, 0.72, 0.12]);
  const altitude = Math.round(clamp(local, [0, 252], [0, 408]));
  const markerY = clamp(altitude, [0, 408], [930, 180]);
  const cityOpacity = clamp(local, [0, 115, 195], [1, 0.42, 0.06]);
  const cloudOpacity = clamp(local, [50, 102, 175], [0.12, 1, 0.38]);
  const spaceOpacity = clamp(local, [90, 180, 252], [0.08, 0.64, 1]);

  return (
    <Stage>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        <svg
 
