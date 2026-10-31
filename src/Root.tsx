import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ============================================================
// 01. GLOBAL CONFIG
// ============================================================

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2820;

const ACCENT_CYAN = '#00e5ff';
const ACCENT_ORANGE = '#ff9f43';
const ACCENT_GREEN = '#00ff9d';
const ACCENT_RED = '#ff5252';
const ACCENT_GOLD = '#ffd166';

const SCENES = [
  {
    id: 1,
    theme: 'dark',
    start: 0,
    end: 8.45,
    speechStart: 0.10,
    speechEnd: 8.35,
    image: 'device.png',
    caption:
      'Kya aapko pata hai ki ye universe bilkul ek video game ki tarah kaam karta hai—jab tak aap kisi cheez ko nahi dekhte, woh exist hi nahi karti!',
    heroBeats: [
      {
        at: 0,
        tag: 'QUANTUM REALITY',
        line1: 'UNIVERSE IS A',
        line2: 'VIDEO GAME 🎮',
        accent: '#00e5ff',
      },
      {
        at: 4.2,
        tag: 'OBSERVER EFFECT',
        line1: 'NOT SEEN =',
        line2: 'DOES NOT EXIST!',
        accent: '#ff9f43',
      },
    ],
  },
  {
    id: 2,
    theme: 'paper',
    start: 8.45,
    end: 24.5,
    speechStart: 8.55,
    speechEnd: 24.4,
    image: 'double_slit.png',
    caption:
      'Science mein ise Double-Slit Experiment kehte hain. Isme jab electrons ya light particles ko chhoda jata hai, toh jab tak koi observer ya camera unhein nahi dekhta, woh waves ki tarah phail jaate hain. Par jaise hi aap unhein observe karne ki koshish karte hain, woh achanak solid particles ban jate hain!',
    heroBeats: [
      {
        at: 8.45,
        tag: 'QUANTUM MECHANICS',
        line1: 'DOUBLE-SLIT',
        line2: 'EXPERIMENT 🔬',
        accent: '#d93829',
      },
      {
        at: 13.5,
        tag: 'WAVE FUNCTION',
        line1: 'SPREADS LIKE',
        line2: 'WAVES 🌊',
        accent: '#00bcd4',
      },
      {
        at: 19.2,
        tag: 'COLLAPSE',
        line1: 'BECOMES SOLID',
        line2: 'PARTICLES! ⚡',
        accent: '#d93829',
      },
    ],
  },
  {
    id: 3,
    theme: 'dark',
    start: 24.5,
    end: 32,
    speechStart: 24.6,
    speechEnd: 31.9,
    image: 'wave_duality.png',
    caption:
      'Matlab yeh universe sirf tabhi render hota hai jab aap ise dekhte hain? Iska mind-bending quantum raaz batayenge Part 2 mein!',
    heroBeats: [
      {
        at: 24.5,
        tag: 'SIMULATION THEORY',
        line1: 'RENDERED ONLY',
        line2: 'WHEN SEEN 👀',
        accent: '#00ff9d',
      },
      {
        at: 28.5,
        tag: 'COMING NEXT',
        line1: 'SECRET IN',
        line2: 'PART 2 🔓',
        accent: '#ffd166',
      },
    ],
  },
  {
    id: 4,
    theme: 'paper',
    start: 32,
    end: 47,
    speechStart: 32.1,
    speechEnd: 46.85,
    image: 'sensor.png',
    caption:
      'Waise, aapka kaun sa dost aisi hi parallel reality mein jeeta hai jise real duniya ki koi khabar hi nahi hoti? Comment mein uska naam zaroor batana!',
    heroBeats: [
      {
        at: 32,
        tag: 'PARALLEL REALITY',
        line1: 'WHO IS YOUR',
        line2: 'DREAMER FRIEND?',
        accent: '#00bcd4',
      },
      {
        at: 39.5,
        tag: 'REAL WORLD LOST',
        line1: 'NO CLUE ABOUT',
        line2: 'REALITY 🌌',
        accent: '#ff5252',
      },
      {
        at: 43.8,
        tag: 'TAG THEM',
        line1: 'DROP NAME IN',
        line2: 'COMMENTS 👇',
        accent: '#ffd166',
      },
    ],
  },
] as const;

type Scene = (typeof SCENES)[number];
type Theme = Scene['theme'];
type HeroBeat = Scene['heroBeats'][number];

// ============================================================
// 02. ANIMATION HELPERS
// ============================================================

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

const interp = (
  value: number,
  input: number[],
  output: number[],
) =>
  interpolate(value, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const smoothSpring = (
  frame: number,
  fps: number,
  damping = 15,
  stiffness = 150,
) =>
  spring({
    frame,
    fps,
    config: {
      damping,
      stiffness,
      mass: 0.7,
    },
  });

const localFrame = (frame: number, start: number) =>
  Math.max(0, frame - Math.round(start * FPS));

// ============================================================
// 03. DETERMINISTIC PARTICLES
// ============================================================

const PARTICLES = Array.from({ length: 42 }, (_, i) => ({
  x: ((i * 137.5) % 94) + 3,
  y: ((i * 83.7) % 92) + 4,
  size: 2 + ((i * 7) % 5),
  speed: 0.35 + ((i * 13) % 10) / 15,
  phase: i * 1.7,
}));

const ParticleField: React.FC<{
  frame: number;
  theme: Theme;
}> = ({ frame, theme }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {PARTICLES.map((p, i) => {
        const driftY = Math.sin(frame * 0.012 * p.speed + p.phase) * 22;
        const driftX = Math.cos(frame * 0.009 * p.speed + p.phase) * 12;

        const pulse =
          0.3 +
          Math.abs(Math.sin(frame * 0.025 + p.phase)) * 0.55;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: theme === 'dark' ? ACCENT_CYAN : '#b15c35',
              opacity: pulse * 0.6,
              boxShadow:
                theme === 'dark'
                  ? `0 0 ${p.size * 5}px ${ACCENT_CYAN}`
                  : `0 0 ${p.size * 4}px rgba(177,92,53,.5)`,
              transform: `translate(${driftX}px, ${driftY}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ============================================================
// 04. CINEMATIC BACKGROUNDS
// ============================================================

const DarkBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse at 50% 40%, #172848 0%, #0a1023 48%, #030611 100%)',
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,229,255,.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,255,.045) 1px, transparent 1px)
        `,
        backgroundSize: '65px 65px',
        maskImage:
          'linear-gradient(to bottom, rgba(0,0,0,.8), transparent 90%)',
      }}
    />
  </AbsoluteFill>
);

const PaperBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse at 50% 35%, #fff9ee 0%, #f1e9d9 55%, #dcd0b9 100%)',
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(80,55,25,.025) 0px, rgba(80,55,25,.025) 1px, transparent 1px, transparent 5px)',
        opacity: 0.6,
      }}
    />
  </AbsoluteFill>
);

const AmbientFX: React.FC<{
  frame: number;
  theme: Theme;
}> = ({ frame, theme }) => {
  const sweepX = interp(frame % 240, [0, 240], [-80, 120]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <ParticleField frame={frame} theme={theme} />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${sweepX}%`,
          width: 260,
          height: '100%',
          transform: 'skewX(-22deg)',
          background:
            theme === 'dark'
              ? 'linear-gradient(90deg, transparent, rgba(0,229,255,.07), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent)',
          filter: 'blur(25px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.34) 100%)',
          opacity: theme === 'dark' ? 0.9 : 0.22,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 5px, rgba(255,255,255,.09) 6px)',
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================
// 05. IMAGE MOTION
// ============================================================

const SceneVisual: React.FC<{
  scene: Scene;
  frame: number;
}> = ({ scene, frame }) => {
  const lf = localFrame(frame, scene.start);

  const scale = 1.035 + Math.sin(lf * 0.012) * 0.035;
  const moveX = Math.sin(lf * 0.006) * 15;
  const moveY = Math.cos(lf * 0.008) * 14;

  const imageOpacity = scene.theme === 'dark' ? 0.84 : 0.86;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(scene.image)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: imageOpacity,
          transform: `scale(${scale}) translate(${moveX}px, ${moveY}px)`,
          filter:
            scene.theme === 'dark'
              ? 'saturate(1.12) contrast(1.12)'
              : 'saturate(.88) contrast(1.08)',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            scene.theme === 'dark'
              ? 'linear-gradient(180deg, rgba(3,7,19,.45), transparent 38%, rgba(3,7,19,.32))'
              : 'linear-gradient(180deg, rgba(244,239,228,.35), transparent 38%, rgba(36,27,18,.17))',
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================
// 06. DYNAMIC QUANTUM DIAGRAMS
// ============================================================

const createWavePath = (
  frame: number,
  amplitude: number,
  phase: number,
) => {
  return Array.from({ length: 90 }, (_, i) => {
    const x = (i / 89) * 900;
    const y =
      260 +
      Math.sin(i * 0.115 + frame * 0.055 + phase) * amplitude;

    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
};

const QuantumDiagram: React.FC<{
  scene: Scene;
  frame: number;
}> = ({ scene, frame }) => {
  const lf = localFrame(frame, scene.start);

  const rotation = Math.sin(lf * 0.008) * 5;
  const pulse = 1 + Math.sin(lf * 0.045) * 0.06;

  const dark = scene.theme === 'dark';
  const stroke = dark ? '#00e5ff' : '#d93829';
  const softStroke = dark
    ? 'rgba(0,229,255,.35)'
    : 'rgba(217,56,41,.35)';

  return (
    <AbsoluteFill
      style={{
        top: 490,
        height: 830,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        opacity: 0.85,
      }}
    >
      <svg
        width="94%"
        height="100%"
        viewBox="0 0 900 650"
        style={{
          overflow: 'visible',
          transform: `rotate(${rotation}deg) scale(${pulse})`,
          filter: `drop-shadow(0 0 12px ${softStroke})`,
        }}
      >
        <defs>
          <radialGradient id="quantumCore">
            <stop offset="0%" stopColor={stroke} stopOpacity="1" />
            <stop offset="55%" stopColor={stroke} stopOpacity=".3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </radialGradient>

          <linearGradient id="quantumLine">
            <stop offset="0%" stopColor={stroke} stopOpacity="0" />
            <stop offset="50%" stopColor={stroke} stopOpacity="1" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* SCENE 1: QUANTUM UNIVERSE */}
        {scene.id === 1 && (
          <g transform="translate(450 300)">
            {[90, 155, 220].map((r, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx={r}
                ry={r * 0.38}
                fill="none"
                stroke={stroke}
                strokeWidth={i === 1 ? 2.5 : 1.5}
                strokeOpacity={0.55 - i * 0.1}
                transform={`rotate(${i * 58 + lf * 0.45})`}
              />
            ))}

            <circle r="105" fill="url(#quantumCore)" />

            <circle
              r="32"
              fill={stroke}
              opacity="0.85"
            />

            <circle
              r="46"
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeDasharray="6 10"
              transform={`rotate(${lf * 2})`}
            />

            {Array.from({ length: 8 }, (_, i) => {
              const angle = (Math.PI * 2 * i) / 8 + lf * 0.015;
              const radius = 170;

              return (
                <circle
                  key={i}
                  cx={Math.cos(angle) * radius}
                  cy={Math.sin(angle) * radius * 0.42}
                  r="6"
                  fill={stroke}
                />
              );
            })}
          </g>
        )}

        {/* SCENE 2: DOUBLE SLIT */}
        {scene.id === 2 && (
          <g>
            <line
              x1="90"
              y1="325"
              x2="340"
              y2="325"
              stroke={stroke}
              strokeWidth="3"
            />

            <circle
              cx="90"
              cy="325"
              r="13"
              fill={stroke}
            />

            <rect
              x="340"
              y="95"
              width="18"
              height="460"
              rx="4"
              fill={stroke}
              opacity=".75"
            />

            <rect
              x="335"
              y="210"
              width="28"
              height="60"
              fill={dark ? '#172848' : '#fff9ee'}
            />

            <rect
              x="335"
              y="390"
              width="28"
              height="60"
              fill={dark ? '#172848' : '#fff9ee'}
            />

            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M 360 ${240 + i * 7} Q 610 ${30 + i * 55} 830 ${150 + i * 75}`}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeOpacity=".65"
              />
            ))}

            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={`b-${i}`}
                d={`M 360 ${420 + i * 7} Q 610 ${620 - i * 50} 830 ${530 - i * 75}`}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeOpacity=".55"
              />
            ))}

            <line
              x1="850"
              y1="100"
              x2="850"
              y2="550"
              stroke={softStroke}
              strokeWidth="3"
            />

            {Array.from({ length: 15 }, (_, i) => (
              <circle
                key={i}
                cx="850"
                cy={125 + i * 29}
                r={3 + Math.abs(Math.sin(lf * 0.08 + i)) * 5}
                fill={stroke}
              />
            ))}
          </g>
        )}

        {/* SCENE 3: WAVE DUALITY */}
        {scene.id === 3 && (
          <g>
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={createWavePath(lf, 45 + i * 35, i * 1.2)}
                fill="none"
                stroke={i === 1 ? '#00ff9d' : stroke}
                strokeWidth={i === 1 ? 4 : 2}
                strokeOpacity={0.7 - i * 0.12}
                transform={`translate(0 ${i * 5})`}
              />
            ))}

            <circle
              cx="450"
              cy="260"
              r={55 + Math.sin(lf * 0.08) * 12}
              fill="none"
              stroke="#00ff9d"
              strokeWidth="2"
              strokeDasharray="6 8"
            />

            <circle
              cx="450"
              cy="260"
              r="12"
              fill="#00ff9d"
            />
          </g>
        )}

        {/* SCENE 4: OBSERVER SENSOR */}
        {scene.id === 4 && (
          <g transform="translate(450 300)">
            {[75, 140, 205, 265].map((r, i) => (
              <circle
                key={i}
                cx="0"
                cy="0"
                r={r}
                fill="none"
                stroke={stroke}
                strokeWidth={i === 3 ? 1.5 : 2}
                strokeOpacity=".55"
                strokeDasharray={i % 2 === 0 ? 'none' : '8 8'}
              />
            ))}

            <path
              d="M 0 0 L 0 -260"
              stroke={stroke}
              strokeWidth="4"
              transform={`rotate(${(lf * 2.5) % 360})`}
              style={{ transformOrigin: '0px 0px' }}
            />

            <circle
              cx="0"
              cy="0"
              r="24"
              fill={stroke}
            />

            {Array.from({ length: 12 }, (_, i) => {
              const angle = (Math.PI * 2 * i) / 12;
              const radius = 210;

              return (
                <circle
                  key={i}
                  cx={Math.cos(angle) * radius}
                  cy={Math.sin(angle) * radius}
                  r="5"
                  fill={stroke}
                  opacity=".8"
                />
              );
            })}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================
// 07. CINEMATIC HERO TEXT
// ============================================================

const HeroOverlay: React.FC<{
  beat: HeroBeat;
  beatAt: number;
  theme: Theme;
  frame: number;
}> = ({ beat, beatAt, theme, frame }) => {
  const age = localFrame(frame, beatAt);

  const pop = smoothSpring(age, FPS, 13, 170);
  const secondPop = smoothSpring(age - 5, FPS, 14, 160);

  const opacity = interp(age, [0, 7, 17], [0, 0.96, 1]);

  const blur = interp(age, [0, 12, 25], [15, 3, 0]);

  const line1Y = interp(pop, [0, 1], [45, 0]);
  const line2Y = interp(secondPop, [0, 1], [55, 0]);

  const isPaper = theme === 'paper';

  const mainColor = isPaper ? '#211c18' : '#f4faff';

  const font1 = beat.line1.length > 13 ? 64 : 74;
  const font2 = beat.line2.length > 13 ? 64 : 75;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 40,
          right: 40,
          opacity,
          transform: `scale(${0.92 + pop * 0.08})`,
          filter: `blur(${blur}px)`,
          textAlign: 'center',
        }}
      >
        {/* TOP BADGE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 13,
            marginBottom: 19,
          }}
        >
          <div
            style={{
              width: 38,
              height: 3,
              background: beat.accent,
              boxShadow: `0 0 14px ${beat.accent}`,
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              borderRadius: 100,
              border: `1px solid ${beat.accent}`,
              background: isPaper
                ? 'rgba(255,255,255,.55)'
                : 'rgba(3,12,30,.6)',
              boxShadow: `0 0 20px ${beat.accent}22`,
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: beat.accent,
                boxShadow: `0 0 13px ${beat.accent}`,
              }}
            />

            <span
              style={{
                color: isPaper ? '#5b5143' : '#d6efff',
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                letterSpacing: 3.5,
                fontWeight: 900,
              }}
            >
              {beat.tag}
            </span>
          </div>

          <div
            style={{
              width: 38,
              height: 3,
              background: beat.accent,
              boxShadow: `0 0 14px ${beat.accent}`,
            }}
          />
        </div>

        {/* MAIN HEADLINE */}
        <div
          style={{
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontWeight: 900,
            lineHeight: 0.99,
            letterSpacing: -3,
            textTransform: 'uppercase',
            color: mainColor,
            textShadow: isPaper
              ? '0 4px 1px rgba(255,255,255,.35), 0 8px 20px rgba(0,0,0,.12)'
              : '0 8px 30px rgba(0,0,0,.7), 0 0 20px rgba(0,229,255,.13)',
          }}
        >
          <div
            style={{
              fontSize: font1,
              whiteSpace: 'nowrap',
              opacity: interp(age, [0, 8], [0, 1]),
              transform: `translateY(${line1Y}px)`,
            }}
          >
            {beat.line1}
          </div>

          <div
            style={{
              fontSize: font2,
              whiteSpace: 'nowrap',
              color: beat.accent,
              marginTop: 9,
              opacity: interp(age, [4, 12], [0, 1]),
              transform: `translateY(${line2Y}px)`,
              textShadow: `0 0 28px ${beat.accent}66`,
            }}
          >
            {beat.line2}
          </div>
        </div>

        {/* ANIMATED ACCENT LINE */}
        <div
          style={{
            width: 300,
            height: 6,
            borderRadius: 20,
            margin: '24px auto 0',
            background: `linear-gradient(90deg, transparent, ${beat.accent}, transparent)`,
            boxShadow: `0 0 20px ${beat.accent}`,
            transform: `scaleX(${interp(age, [5, 23], [0, 1])})`,
          }}
        />

        {/* SMALL CORNER LABEL */}
        <div
          style={{
            marginTop: 13,
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            letterSpacing: 4,
            color: isPaper ? '#70604c' : '#8da9c1',
            fontWeight: 700,
            opacity: interp(age, [10, 25], [0, 0.75]),
          }}
        >
          THE SCIENCE BEHIND REALITY
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// 08. WORD-BY-WORD CAPTION TIMINGS
// ============================================================

type WordTiming = {
  word: string;
  start: number;
  end: number;
};

function getWordTimings(scene: Scene): WordTiming[] {
  const words = scene.caption.trim().split(/\s+/);

  const weights = words.map((word) => {
    const chars = Math.max(
      2,
      word.replace(/[^a-zA-Z0-9]/g, '').length,
    );

    const punctuation =
      /[,;:]$/.test(word)
        ? 1.5
        : /[?!.]$/.test(word)
          ? 2.7
          : 0;

    return chars + punctuation;
  });

  const total = weights.reduce((a, b) => a + b, 0);

  const duration = scene.speechEnd - scene.speechStart;

  let cursor = scene.speechStart;

  return words.map((word, index) => {
    const start = cursor;

    cursor += (weights[index] / total) * duration;

    return {
      word,
      start,
      end:
        index === words.length - 1
          ? scene.speechEnd
          : cursor,
    };
  });
}

// ============================================================
// 09. ADVANCED KARAOKE CAPTIONS
// ============================================================

const CaptionOverlay: React.FC<{
  scene: Scene;
  sec: number;
  frame: number;
}> = ({ scene, sec, frame }) => {
  const timings = getWordTimings(scene);

  const activeIndex = timings.findIndex(
    (timing) =>
      sec >= timing.start && sec < timing.end,
  );

  const safeIndex =
    sec < scene.speechStart
      ? 0
      : sec >= scene.speechEnd
        ? timings.length - 1
        : Math.max(0, activeIndex);

  // Display five words together.
  const first = Math.floor(safeIndex / 5) * 5;

  const visibleWords = timings.slice(first, first + 5);

  const isPaper = scene.theme === 'paper';

  const panelOpacity = interp(
    sec,
    [
      scene.speechStart - 0.15,
      scene.speechStart + 0.1,
      scene.speechEnd - 0.1,
      scene.speechEnd + 0.1,
    ],
    [0, 1, 1, 0.92],
  );

  const currentTiming = timings[safeIndex];

  const wordProgress = currentTiming
    ? clamp(
        (sec - currentTiming.start) /
          Math.max(0.001, currentTiming.end - currentTiming.start),
      )
    : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 47,
          right: 47,
          top: 1570,
          minHeight: 205,
          opacity: panelOpacity,
          borderRadius: 30,
          background: isPaper
            ? 'linear-gradient(135deg, rgba(28,25,22,.97), rgba(43,37,32,.96))'
            : 'linear-gradient(135deg, rgba(5,12,29,.97), rgba(13,25,47,.96))',
          border: `1.5px solid ${
            isPaper
              ? 'rgba(255,255,255,.24)'
              : 'rgba(0,229,255,.3)'
          }`,
          boxShadow: isPaper
            ? '0 18px 60px rgba(0,0,0,.28)'
            : '0 18px 65px rgba(0,0,0,.5), 0 0 25px rgba(0,229,255,.08)',
          padding: '23px 25px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* CAPTION HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: ACCENT_CYAN,
              boxShadow: `0 0 12px ${ACCENT_CYAN}`,
            }}
          />

          <span
            style={{
              color: '#9fb8cb',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: 3,
            }}
          >
            LIVE WORD SYNC
          </span>

          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: ACCENT_CYAN,
              boxShadow: `0 0 12px ${ACCENT_CYAN}`,
            }}
          />
        </div>

        {/* DYNAMIC WORDS */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px 11px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 32,
            fontWeight: 900,
            lineHeight: 1.3,
            textAlign: 'center',
          }}
        >
          {visibleWords.map((timing, index) => {
            const globalIndex = first + index;

            const isActive = globalIndex === safeIndex;

            const isPast = globalIndex < safeIndex;

            const age = Math.max(
              0,
              (sec - timing.start) * FPS,
            );

            const wordSpring = smoothSpring(
              age,
              FPS,
              12,
              190,
            );

            const activePulse = isActive
              ? 1 + Math.sin(frame * 0.16) * 0.025
              : 1;

            const y = isActive
              ? interp(wordSpring, [0, 1], [12, 0])
              : interp(wordSpring, [0, 1], [7, 0]);

            return (
              <span
                key={`${globalIndex}-${timing.word}`}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  color: isActive
                    ? '#06131d'
                    : isPast
                      ? '#9db0c0'
                      : '#ffffff',

                  background: isActive
                    ? 'linear-gradient(135deg, #00e5ff, #7ff8ff)'
                    : 'transparent',

                  borderRadius: 10,

                  padding: isActive
                    ? '5px 11px 7px'
                    : '4px 1px',

                  opacity: isActive
                    ? 1
                    : isPast
                      ? 0.83
                      : 0.95,

                  transform: `
                    translateY(${y}px)
                    scale(${isActive ? wordSpring * 0.06 + 0.94 : 1})
                    scale(${isActive ? activePulse : 1})
                  `,

                  boxShadow: isActive
                    ? '0 0 12px rgba(0,229,255,.8), 0 5px 22px rgba(0,229,255,.28)'
                    : 'none',

                  textShadow: isPast
                    ? '0 0 8px rgba(255,255,255,.1)'
                    : 'none',
                }}
              >
                {timing.word}
              </span>
            );
          })}
        </div>

        {/* WORD PROGRESS INDICATOR */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 27,
            right: 27,
            height: 4,
            borderRadius: 20,
            background: 'rgba(255,255,255,.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${wordProgress * 100}%`,
              background:
                'linear-gradient(90deg, #00bcd4, #00e5ff, #b7ffff)',
              boxShadow: '0 0 13px #00e5ff',
              borderRadius: 20,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// 10. TOP PROGRESS / TIMELINE
// ============================================================

const SceneTimeline: React.FC<{
  sec: number;
  scene: Scene;
}> = ({ sec, scene }) => {
  const progress = clamp(
    (sec - scene.start) / (scene.end - scene.start),
  );

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 48,
          right: 48,
          display: 'flex',
          gap: 7,
          height: 5,
        }}
      >
        {SCENES.map((item) => {
          const active = item.id === scene.id;

          const complete = sec >= item.end;

          const fill = complete
            ? 1
            : active
              ? progress
              : 0;

          return (
            <div
              key={item.id}
              style={{
                position: 'relative',
                flex: 1,
                borderRadius: 20,
                background: 'rgba(255,255,255,.22)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: '100%',
                  background: active
                    ? ACCENT_CYAN
                    : '#a8c6d7',
                  boxShadow: active
                    ? '0 0 15px #00e5ff'
                    : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 52,
          right: 50,
          fontFamily: 'Arial, sans-serif',
          fontSize: 14,
          letterSpacing: 2,
          fontWeight: 900,
          color:
            scene.theme === 'dark'
              ? '#b4cfdf'
              : '#51483a',
        }}
      >
        0{scene.id} / 04
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// 11. CINEMATIC SCENE TRANSITION
// ============================================================

const SceneTransition: React.FC<{
  scene: Scene;
  sec: number;
}> = ({ scene, sec }) => {
  const age = sec - scene.start;

  const flashOpacity = interp(
    age,
    [0, 0.035, 0.08, 0.2],
    [0, 0.28, 0.08, 0],
  );

  return (
    <AbsoluteFill
      style={{
        background: '#ffffff',
        opacity: flashOpacity,
        pointerEvents: 'none',
      }}
    />
  );
};

// ============================================================
// 12. MAIN VIDEO
// ============================================================

const ReelVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const { fps } = useVideoConfig();

  const sec = frame / fps;

  const scene =
    SCENES.find(
      (item) => sec >= item.start && sec < item.end,
    ) ?? SCENES[SCENES.length - 1];

  const activeBeatIndex = scene.heroBeats.reduce(
    (last, beat, index) =>
      sec >= beat.at ? index : last,
    0,
  );

  const beat =
    scene.heroBeats[activeBeatIndex] ??
    scene.heroBeats[0];

  // Smooth opening and ending fade.
  const sceneFade = interp(
    sec,
    [
      scene.start,
      scene.start + 0.16,
      scene.end - 0.16,
      scene.end,
    ],
    [0, 1, 1, 0.94],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030611',
        overflow: 'hidden',
      }}
    >
      {/* BACKGROUND */}
      {scene.theme === 'dark' ? (
        <DarkBackdrop />
      ) : (
        <PaperBackdrop />
      )}

      {/* MOVING IMAGE */}
      <AbsoluteFill style={{ opacity: sceneFade }}>
        <SceneVisual scene={scene} frame={frame} />
      </AbsoluteFill>

      {/* AMBIENT PARTICLES AND LIGHT */}
      <AmbientFX frame={frame} theme={scene.theme} />

      {/* QUANTUM VISUALIZATION */}
      <QuantumDiagram scene={scene} frame={frame} />

      {/* HERO TEXT */}
      <HeroOverlay
        beat={beat}
        beatAt={beat.at}
        theme={scene.theme}
        frame={frame}
      />

      {/* SCENE TIMELINE */}
      <SceneTimeline sec={sec} scene={scene} />

      {/* KARAOKE CAPTIONS */}
      <CaptionOverlay
        scene={scene}
        sec={sec}
        frame={frame}
      />

      {/* SCENE FLASH */}
      <SceneTransition scene={scene} sec={sec} />

      {/* EXTERNAL VOICEOVER - KEEP ORIGINAL SYNC */}
      <Audio src={staticFile('voice.mp3')} />
    </AbsoluteFill>
  );
};

// ============================================================
// 13. REMOTION COMPOSITION
// ============================================================

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ReelVideo}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
