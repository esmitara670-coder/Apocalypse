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

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2820; // 47.0 seconds

const SCENES = [
  {
    id: 1,
    theme: 'dark',
    start: 0.0,
    end: 8.45,
    speechStart: 0.10,
    speechEnd: 8.35,
    caption:
      'Kya aapko pata hai ki universe mein do aise particles hain jo ek doosre se lakhon kilometer door hone par bhi ek doosre ke saath telepathically jude rehte hain?',
    heroBeats: [
      { at: 0.0, tag: 'DEEP SPACE MYSTERY', line1: 'TWO QUANTUM', line2: 'PARTICLES', accent: '#00e5ff' },
      { at: 3.0, tag: 'EXTREME SEPARATION', line1: 'LAKHON KM', line2: 'APART!', accent: '#ff9f43' },
      { at: 5.8, tag: 'IMPOSSIBLE CONNECTION', line1: 'TELEPATHIC', line2: 'BOND ⚡', accent: '#00e5ff' },
    ],
  },
  {
    id: 2,
    theme: 'paper',
    start: 8.45,
    end: 11.75,
    speechStart: 8.55,
    speechEnd: 11.65,
    caption: 'Is phenomenon ko Quantum Entanglement kehte hain.',
    heroBeats: [
      { at: 8.45, tag: 'QUANTUM PHYSICS // FIG 01', line1: 'QUANTUM', line2: 'ENTANGLEMENT', accent: '#d93829' },
    ],
  },
  {
    id: 3,
    theme: 'dark',
    start: 11.75,
    end: 22.55,
    speechStart: 11.85,
    speechEnd: 22.45,
    caption:
      'Ismein agar aap ek particle ki state ya direction change karoge, toh doosra particle chahe universe ke doosre kone par hi kyun na ho, woh instant wahi same reaction dega, bina kisi time delay ke!',
    heroBeats: [
      { at: 11.75, tag: 'SPIN MANIPULATION', line1: 'CHANGE ONE', line2: 'DIRECTION ↻', accent: '#00e5ff' },
      { at: 15.10, tag: 'EDGE OF THE COSMOS', line1: 'OPPOSITE END', line2: 'OF UNIVERSE', accent: '#ffd166' },
      { at: 18.45, tag: 'SIMULTANEOUS MIRROR', line1: 'INSTANT SAME', line2: 'REACTION!', accent: '#ff5252' },
      { at: 20.65, tag: 'ZERO LATENCY', line1: '0.000 SEC', line2: 'TIME DELAY', accent: '#00ff9d' },
    ],
  },
  {
    id: 4,
    theme: 'paper',
    start: 22.55,
    end: 31.85,
    speechStart: 22.65,
    speechEnd: 31.75,
    caption:
      'Yaani, Einstein bhi is cheez ko dekh kar ghabra gaye the, kyunki yeh Einstein ki is theory ko bhi galat saabit kar deta hai ki light ki speed se tez kuch bhi travel nahi kar sakta.',
    heroBeats: [
      { at: 22.55, tag: 'SPOOKY ACTION // 1935', line1: 'EINSTEIN WAS', line2: 'SHOCKED!', accent: '#d93829' },
      { at: 25.60, tag: 'THEORY OF RELATIVITY', line1: 'PHYSICS RULE', line2: 'BROKEN ❌', accent: '#d93829' },
      { at: 28.55, tag: 'COSMIC SPEED LIMIT', line1: 'FASTER THAN', line2: 'LIGHT SPEED!', accent: '#e59f24' },
    ],
  },
  {
    id: 5,
    theme: 'dark',
    start: 31.85,
    end: 35.70,
    speechStart: 31.95,
    speechEnd: 35.60,
    caption: 'Matlab, yeh universe ki sabse khatarnak long distance relationship hai.',
    heroBeats: [
      { at: 31.85, tag: 'COSMIC ROMANCE', line1: 'DEADLIEST LONG', line2: 'DISTANCE LOVE', accent: '#ff4d6d' },
    ],
  },
  {
    id: 6,
    theme: 'paper',
    start: 35.70,
    end: 39.55,
    speechStart: 35.80,
    speechEnd: 39.45,
    caption: 'Yeh particles aapas mein kaise jude rehte hain, iska raaz batayenge Part 2 mein.',
    heroBeats: [
      { at: 35.70, tag: 'CLASSIFIED MYSTERY', line1: 'HOW ARE THEY', line2: 'CONNECTED?', accent: '#24211d' },
      { at: 37.65, tag: 'COMING NEXT', line1: 'SECRET IN', line2: 'PART 2 🔓', accent: '#d93829' },
    ],
  },
  {
    id: 7,
    theme: 'dark',
    start: 39.55,
    end: 47.00,
    speechStart: 39.65,
    speechEnd: 46.85,
    caption:
      'Waise, aapka kaun sa dost aisi hi long distance relationship mein hai jo call na uthane par bhi turant pakda jata hai? Comment mein uska naam zaroor batana!',
    heroBeats: [
      { at: 39.55, tag: 'REAL LIFE ENTANGLEMENT', line1: 'WHO IS YOUR', line2: 'LDR FRIEND?', accent: '#00e5ff' },
      { at: 42.60, tag: 'INSTANT DETECTION', line1: 'MISSED CALL =', line2: 'CAUGHT! 🚨', accent: '#ff5252' },
      { at: 44.80, tag: 'TAG THEM NOW', line1: 'DROP NAME IN', line2: 'COMMENTS 👇', accent: '#ffd166' },
    ],
  },
] as const;

type Scene = (typeof SCENES)[number];
type Theme = Scene['theme'];
type HeroBeat = Scene['heroBeats'][number];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const interp = (value: number, input: number[], output: number[]) =>
  interpolate(value, input, output, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const polar = (cx: number, cy: number, radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius,
  };
};

const num = (value: number) => Number(value.toFixed(2));

const STATIC_STARS = Array.from({ length: 140 }, (_, i) => ({
  x: (i * 137.508) % WIDTH,
  y: (i * 83.17) % HEIGHT,
  r: 0.7 + ((i * 17) % 11) / 10,
  opacity: 0.2 + ((i * 29) % 70) / 100,
  drift: ((i % 7) - 3) * 0.22,
}));

const PAPER_FLECKS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 97) % WIDTH,
  y: (i * 173) % HEIGHT,
  r: 0.5 + (i % 4) * 0.2,
}));

function makeWavePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  amplitude: number,
  frequency: number,
  phase: number,
  samples = 90,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  let path = '';

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const envelope = Math.sin(Math.PI * t);
    const wave = Math.sin(t * Math.PI * 2 * frequency + phase) * amplitude * envelope;
    const x = x1 + dx * t + nx * wave;
    const y = y1 + dy * t + ny * wave;
    path += `${i === 0 ? 'M' : 'L'} ${num(x)} ${num(y)} `;
  }
  return path;
}

const SvgDefs: React.FC = () => (
  <defs>
    <linearGradient id="cyanOrb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#eaffff" />
      <stop offset="0.22" stopColor="#00e5ff" />
      <stop offset="0.72" stopColor="#0873a6" />
      <stop offset="1" stopColor="#04152c" />
    </linearGradient>

    <linearGradient id="goldOrb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fff4c8" />
      <stop offset="0.28" stopColor="#ffbd59" />
      <stop offset="0.75" stopColor="#bd6023" />
      <stop offset="1" stopColor="#27182a" />
    </linearGradient>

    <linearGradient id="paperCard" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fffaf0" />
      <stop offset="1" stopColor="#e9dfcd" />
    </linearGradient>

    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="hardGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
      <feOffset dx="0" dy="10" result="offset" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.32" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const DarkBackdrop: React.FC<{ sec: number }> = ({ sec }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(155deg, #050814 0%, #0a1023 47%, #121b38 100%)' }}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <radialGradient id="bgNebulaA">
          <stop offset="0" stopColor="#234d90" stopOpacity="0.45" />
          <stop offset="1" stopColor="#0b1025" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bgNebulaB">
          <stop offset="0" stopColor="#512b6d" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0b1025" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={230 + Math.sin(sec * 0.4) * 35} cy="590" rx="510" ry="660" fill="url(#bgNebulaA)" />
      <ellipse cx={890 - Math.cos(sec * 0.4) * 35} cy="1260" rx="560" ry="690" fill="url(#bgNebulaB)" />

      <g fill="#d8f8ff">
        {STATIC_STARS.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={(star.y + sec * 25 * star.drift + HEIGHT * 2) % HEIGHT}
            r={star.r}
            opacity={star.opacity * (0.65 + 0.35 * Math.sin(sec * 2.2 + index))}
          />
        ))}
      </g>

      <g opacity="0.18" stroke="#6c9bc3" strokeWidth="1" fill="none">
        {Array.from({ length: 12 }, (_, i) => {
          const t = i / 11;
          const y = 790 + t * t * 1160;
          return <path key={`h-${i}`} d={`M 0 ${y} Q 540 ${y - 100 - t * 220} 1080 ${y}`} />;
        })}
        {Array.from({ length: 15 }, (_, i) => (
          <path key={`v-${i}`} d={`M 540 770 L ${-520 + i * 150} 1920`} />
        ))}
      </g>
    </svg>
  </AbsoluteFill>
);

const PaperBackdrop: React.FC = () => (
  <AbsoluteFill style={{ background: 'linear-gradient(135deg, #f4efe4 0%, #ece4d4 58%, #e4dac3 100%)' }}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <pattern id="paperGrid40" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#7b7568" strokeWidth="0.8" opacity="0.22" />
        </pattern>
        <pattern id="paperGrid200" width="200" height="200" patternUnits="userSpaceOnUse">
          <path d="M200 0H0V200" fill="none" stroke="#756d60" strokeWidth="1.2" opacity="0.24" />
        </pattern>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#paperGrid40)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#paperGrid200)" />

      <g fill="#5e5342" opacity="0.12">
        {PAPER_FLECKS.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} />
        ))}
      </g>

      <g stroke="#403b32" strokeWidth="1.5" opacity="0.54">
        <path d="M32 400V1500 M1048 400V1500" />
        {Array.from({ length: 45 }, (_, i) => {
          const y = 410 + i * 24;
          const major = i % 5 === 0;
          return <path key={i} d={`M32 ${y} h${major ? 20 : 9} M1048 ${y} h-${major ? 20 : 9}`} />;
        })}
      </g>
      <path d="M65 390H1015 M65 1530H1015" stroke="#d93829" strokeWidth="2" opacity="0.28" />
    </svg>
  </AbsoluteFill>
);

const Gyro: React.FC<{
  cx: number;
  cy: number;
  r: number;
  color: 'cyan' | 'gold' | 'red';
  rotation?: number;
  opacity?: number;
}> = ({ cx, cy, r, color, rotation = 0, opacity = 1 }) => {
  const stroke = color === 'cyan' ? '#00e5ff' : color === 'gold' ? '#ffb34f' : '#ff5265';
  const orb = color === 'gold' ? 'url(#goldOrb)' : 'url(#cyanOrb)';

  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r * 1.46} fill="none" stroke={stroke} strokeWidth="1.4" opacity="0.18" />

      <g transform={`rotate(${rotation} ${cx} ${cy})`} fill="none" stroke={stroke}>
        <ellipse cx={cx} cy={cy} rx={r * 1.38} ry={r * 0.42} strokeWidth="3" opacity="0.85" filter="url(#softGlow)" />
        <ellipse cx={cx} cy={cy} rx={r * 1.32} ry={r * 0.42} transform={`rotate(62 ${cx} ${cy})`} strokeWidth="2.2" opacity="0.72" />
        <ellipse cx={cx} cy={cy} rx={r * 1.32} ry={r * 0.42} transform={`rotate(-62 ${cx} ${cy})`} strokeWidth="1.8" opacity="0.65" />
        <circle cx={cx} cy={cy} r={r * 1.12} strokeWidth="1.2" strokeDasharray="4 8" opacity="0.5" />

        {Array.from({ length: 16 }, (_, i) => {
          const p1 = polar(cx, cy, r * 1.02, i * 22.5);
          const p2 = polar(cx, cy, r * 1.23, i * 22.5);
          return <path key={i} d={`M${p1.x} ${p1.y} L${p2.x} ${p2.y}`} strokeWidth={i % 2 === 0 ? 2 : 1} opacity="0.75" />;
        })}
      </g>

      <circle cx={cx} cy={cy} r={r * 0.64} fill={orb} stroke={stroke} strokeWidth="2.5" filter="url(#hardGlow)" />
      <circle cx={cx - r * 0.18} cy={cy - r * 0.22} r={r * 0.16} fill="#ffffff" opacity="0.7" />
    </g>
  );
};

const DarkLabel: React.FC<{
  x: number;
  y: number;
  title: string;
  detail?: string;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
}> = ({ x, y, title, detail, color = '#00e5ff', anchor = 'start' }) => (
  <g>
    <text x={x} y={y} fill={color} fontSize="21" fontWeight="800" letterSpacing="2.2" textAnchor={anchor}>
      {title}
    </text>
    {detail ? (
      <text x={x} y={y + 28} fill="#c4d5e6" fontSize="14" letterSpacing="1.6" textAnchor={anchor} opacity="0.82">
        {detail}
      </text>
    ) : null}
  </g>
);

/* ======================== SCENE 1: TWO PARTICLES & TELEPATHIC BOND ======================== */
const SceneOne: React.FC<{ sec: number }> = ({ sec }) => {
  const t = smooth((sec - 3.0) / 2.6);

  // Orbiting motion during 0s-3s, then shooting apart across galaxies
  const orbitAngle = sec * 2.2;
  const startAX = 540 - Math.cos(orbitAngle) * 165;
  const startAY = 940 - Math.sin(orbitAngle) * 95;
  const startBX = 540 + Math.cos(orbitAngle) * 165;
  const startBY = 940 + Math.sin(orbitAngle) * 95;

  const ax = mix(startAX, 215, t);
  const ay = mix(startAY, 540, t);
  const bx = mix(startBX, 865, t);
  const by = mix(startBY, 1250, t);

  const phaseC = clamp((sec - 5.6) / 0.6);
  const rulerOpacity = interp(sec, [2.8, 3.2, 5.7, 6.2], [0, 1, 1, 0.25]);
  const liveKm = Math.round(interp(sec, [3.0, 5.5], [120, 999999])).toLocaleString('en-IN');

  // High-speed energy packets traveling back and forth on the quantum tether
  const packetT1 = (sec * 1.8) % 1;
  const packetT2 = 1 - ((sec * 1.8 + 0.5) % 1);

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <SvgDefs />

        <g opacity="0.34" fill="none" stroke="#3b75aa">
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx="540"
              cy="960"
              rx={160 + i * 58}
              ry={70 + i * 32}
              transform={`rotate(${i * 22 + sec * 4} 540 960)`}
              strokeWidth="1.2"
              opacity={0.65 - i * 0.05}
            />
          ))}
        </g>

        {sec >= 5.6 &&
          Array.from({ length: 5 }, (_, i) => (
            <path
              key={i}
              d={makeWavePath(ax, ay, bx, by, 18 + i * 10, 7 + i * 0.5, sec * 11 + i * 0.8, 90)}
              fill="none"
              stroke={i % 2 === 0 ? '#00e5ff' : '#ffd166'}
              strokeWidth={i === 2 ? 4.5 : 2.2}
              opacity={phaseC * (0.4 + (i === 2 ? 0.45 : 0.2))}
              filter="url(#softGlow)"
            />
          ))}

        {/* Traveling Telepathic Quantum Pulses */}
        {sec >= 5.6 && (
          <g filter="url(#hardGlow)">
            <circle cx={mix(ax, bx, packetT1)} cy={mix(ay, by, packetT1)} r="13" fill="#00e5ff" />
            <circle cx={mix(ax, bx, packetT2)} cy={mix(ay, by, packetT2)} r="13" fill="#ffd166" />
          </g>
        )}

        <g opacity={rulerOpacity}>
          <path d={`M${ax} ${ay} L${bx} ${by}`} stroke="#e9f4ff" strokeDasharray="8 8" strokeWidth="2.5" opacity="0.7" />
          <rect x="340" y="1035" width="400" height="76" rx="14" fill="#0b1427" stroke="#ffb34f" strokeWidth="2" />
          <text x="540" y="1064" fill="#ffcf74" fontSize="14" textAnchor="middle" letterSpacing="2.5" fontWeight="700">
            SPATIAL SEPARATION COUNTER
          </text>
          <text x="540" y="1096" fill="#ffffff" fontSize="28" textAnchor="middle" fontWeight="900">
            {liveKm}+ KM APART
          </text>
        </g>

        <Gyro cx={ax} cy={ay} r={sec < 3 ? 92 : 82} color="cyan" rotation={sec * 52} />
        <Gyro cx={bx} cy={by} r={sec < 3 ? 92 : 82} color="gold" rotation={-sec * 48} />

        <g opacity={interp(sec, [5.6, 6.1, 8.4], [0, 1, 0.8])} fill="none">
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle
                cx={ax}
                cy={ay}
                r={110 + i * 26 + Math.sin(sec * 9 + i) * 8}
                stroke="#00e5ff"
                strokeWidth="2.2"
                opacity={0.68 - i * 0.16}
                filter="url(#softGlow)"
              />
              <circle
                cx={bx}
                cy={by}
                r={110 + i * 26 + Math.sin(sec * 9 + i) * 8}
                stroke="#ffb34f"
                strokeWidth="2.2"
                opacity={0.68 - i * 0.16}
                filter="url(#softGlow)"
              />
            </g>
          ))}
        </g>

        <DarkLabel x={ax} y={ay - 138} title="PARTICLE A" detail="LOCAL QUANTUM SPIN" color="#00e5ff" anchor="middle" />
        <DarkLabel x={bx} y={by + 158} title="PARTICLE B" detail="ENTANGLED TWIN" color="#ffb34f" anchor="middle" />
      </svg>
    </AbsoluteFill>
  );
};

/* ======================== SCENE 2: BLUEPRINT MANDALA OF ENTANGLEMENT ======================== */
const SceneTwo: React.FC<{ sec: number }> = ({ sec }) => {
  const rotation = (sec - 8.45) * 24;
  const pop = spring({ frame: Math.max(0, (sec - 8.45) * FPS), fps: FPS, config: { damping: 14, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <g transform={`translate(540 930) scale(${0.86 + pop * 0.14}) translate(-540 -930)`}>
          <g fill="none" stroke="#292720">
            <circle cx="540" cy="930" r="305" strokeWidth="2.2" opacity="0.65" />
            <circle cx="540" cy="930" r="272" strokeWidth="1.2" strokeDasharray="5 7" opacity="0.7" />
            <circle cx="540" cy="930" r="220" strokeWidth="1.5" opacity="0.5" />
            <circle cx="540" cy="930" r="105" stroke="#d93829" strokeWidth="2.5" />
          </g>

          <g transform={`rotate(${rotation} 540 930)`} fill="none" stroke="#d93829">
            {Array.from({ length: 24 }, (_, i) => {
              const p1 = polar(540, 930, 175, i * 15);
              const p2 = polar(540, 930, 294, i * 15);
              const p3 = polar(540, 930, 246, i * 15 + 7.5);
              return (
                <g key={i}>
                  <path d={`M${p1.x} ${p1.y} L${p2.x} ${p2.y}`} strokeWidth={i % 3 === 0 ? 2.6 : 1.1} opacity="0.8" />
                  <circle cx={p3.x} cy={p3.y} r="4.2" fill="#d93829" />
                </g>
              );
            })}
            <path d="M245 930 C365 690 715 690 835 930 C715 1170 365 1170 245 930Z" strokeWidth="2.5" opacity="0.82" />
            <path d="M245 930 C365 1170 715 1170 835 930 C715 690 365 690 245 930Z" strokeWidth="2.5" opacity="0.82" />
          </g>

          <g fill="#1e1c19" textAnchor="middle">
            <text x="540" y="905" fontFamily="Georgia, serif" fontSize="60" fontStyle="italic" fontWeight="700">
              Ψ = |↑↓⟩ − |↓↑⟩
            </text>
            <text x="540" y="958" fontSize="16" fontWeight="800" letterSpacing="3">
              SINGLET WAVEFUNCTION // LOCKED SPINS
            </text>
          </g>

          {[
            { x: 225, y: 930, rot: -30, label: 'SPIN A (|↑⟩)' },
            { x: 855, y: 930, rot: 150, label: 'SPIN B (|↓⟩)' },
          ].map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r="118" fill="#f7f2e7" fillOpacity="0.88" stroke="#d93829" strokeWidth="3" />
              <circle cx={d.x} cy={d.y} r="96" fill="none" stroke="#292720" strokeWidth="1.2" strokeDasharray="4 7" />
              <g transform={`rotate(${d.rot + rotation * 1.4} ${d.x} ${d.y})`}>
                <path d={`M${d.x} ${d.y + 65} L${d.x} ${d.y - 68}`} stroke="#d93829" strokeWidth="8" strokeLinecap="round" />
                <path
                  d={`M${d.x - 16} ${d.y - 43} L${d.x} ${d.y - 72} L${d.x + 16} ${d.y - 43}`}
                  fill="none"
                  stroke="#d93829"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </g>
              <circle cx={d.x} cy={d.y} r="14" fill="#24211d" />
              <text x={d.x} y={d.y + 160} textAnchor="middle" fill="#1e1c19" fontSize="21" fontWeight="900" letterSpacing="2">
                {d.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ======================== SCENE 3: DIAGONAL SPLIT-SCREEN & 0.000s CHRONOMETER ======================== */
const SpinArrow: React.FC<{ cx: number; cy: number; angle: number; color: string }> = ({ cx, cy, angle, color }) => (
  <g transform={`rotate(${angle} ${cx} ${cy})`}>
    <path d={`M${cx} ${cy + 78} L${cx} ${cy - 80}`} stroke={color} strokeWidth="10" strokeLinecap="round" filter="url(#hardGlow)" />
    <path
      d={`M${cx - 24} ${cy - 45} L${cx} ${cy - 84} L${cx + 24} ${cy - 45}`}
      fill="none"
      stroke={color}
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx={cx} cy={cy + 78} r="8" fill={color} />
  </g>
);

const SceneThree: React.FC<{ sec: number }> = ({ sec }) => {
  // Smooth high-speed spring rotation when spin flips at 13.2s
  const flipSpring = spring({
    frame: Math.max(0, (sec - 13.2) * FPS),
    fps: FPS,
    config: { damping: 11, stiffness: 180 },
  });
  const flipAngle = flipSpring * 180;

  const shock = sec >= 13.2 ? interp(sec, [13.2, 13.3, 14.3], [0, 1, 0]) : 0;

  const chrono = spring({
    frame: Math.max(0, (sec - 19.5) * FPS),
    fps: FPS,
    config: { damping: 16, stiffness: 140 },
  });
  const chronoOpacity = interp(sec, [19.45, 19.75, 22.55], [0, 1, 1]);

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <SvgDefs />

        <path d="M0 390H1080V740L0 980Z" fill="#0b1730" opacity="0.52" />
        <path d="M0 980L1080 740V1530H0Z" fill="#12142b" opacity="0.62" />

        <path d="M0 980L1080 740" stroke="#00e5ff" strokeWidth="8" opacity="0.25" filter="url(#softGlow)" />
        <path d="M0 980L1080 740" stroke="#8defff" strokeWidth="2.5" />

        <DarkLabel x={90} y={455} title="GALAXY SECTOR A" detail="LOCAL LAB // PARTICLE A" color="#00e5ff" />
        <DarkLabel x={990} y={1105} title="GALAXY SECTOR B" detail="10 BILLION LIGHT YEARS AWAY" color="#ffb34f" anchor="end" />

        <Gyro cx={350} cy={700} r={106} color="cyan" rotation={sec * 28} />
        <Gyro cx={730} cy={1230} r={106} color="gold" rotation={-sec * 28} />

        <SpinArrow cx={350} cy={700} angle={flipAngle} color="#00e5ff" />
        <SpinArrow cx={730} cy={1230} angle={180 + flipAngle} color="#ffb34f" />

        <g fill="#e6f3ff" fontSize="22" fontWeight="900" textAnchor="middle">
          <text x="350" y="900">{sec < 13.2 ? 'SPIN STATE: +1/2 ↑' : 'SPIN FLIPPED: −1/2 ↓'}</text>
          <text x="730" y="1445">{sec < 13.2 ? 'SPIN STATE: −1/2 ↓' : 'INSTANT MIRROR: +1/2 ↑'}</text>
        </g>

        {sec >= 13.2 && (
          <g fill="none">
            <circle cx="350" cy="700" r={95 + (1 - shock) * 180} stroke="#00e5ff" strokeWidth="5" opacity={shock} filter="url(#softGlow)" />
            <circle cx="730" cy="1230" r={95 + (1 - shock) * 180} stroke="#ff5252" strokeWidth="5" opacity={shock} filter="url(#softGlow)" />
          </g>
        )}

        <g opacity={chronoOpacity} transform={`translate(540 960) scale(${0.82 + chrono * 0.18}) translate(-540 -960)`}>
          <rect
            x="132"
            y="820"
            width="816"
            height="280"
            rx="28"
            fill="#081222"
            fillOpacity="0.96"
            stroke="#00ff9d"
            strokeWidth="3"
            filter="url(#shadow)"
          />
          <text x="540" y="890" fill="#82d9ed" fontSize="18" textAnchor="middle" letterSpacing="3.5" fontWeight="800">
            REACTION DELAY CHRONOMETER
          </text>
          <text x="540" y="984" fill="#f4ffff" fontSize="68" fontWeight="900" textAnchor="middle" letterSpacing="-2">
            0.000000 SEC
          </text>
          <text x="540" y="1042" fill="#00ff9d" fontSize="23" fontWeight="900" textAnchor="middle" letterSpacing="3.5" filter="url(#hardGlow)">
            ⚡ ZERO TIME DELAY // INSTANT SYNC
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ======================== SCENE 4: EINSTEIN RELATIVITY VS SPEED OF LIGHT GAUGE ======================== */
const PaperCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  detail: string;
  accent?: string;
  rotate?: number;
}> = ({ x, y, w, h, title, detail, accent = '#d93829', rotate = 0 }) => (
  <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`} filter="url(#shadow)">
    <rect x={x} y={y} width={w} height={h} rx="12" fill="url(#paperCard)" stroke="#4c463c" strokeWidth="1.8" />
    <path d={`M${x + 16} ${y + 18}H${x + w - 16}`} stroke={accent} strokeWidth="5" />
    <text x={x + w / 2} y={y + h * 0.54} fill="#1e1c19" fontSize="27" fontWeight="900" textAnchor="middle" letterSpacing="1">
      {title}
    </text>
    <text x={x + w / 2} y={y + h * 0.78} fill="#5d564b" fontSize="15" fontWeight="700" textAnchor="middle" letterSpacing="1.4">
      {detail}
    </text>
  </g>
);

const SceneFour: React.FC<{ sec: number }> = ({ sec }) => {
  const gaugeT = smooth((sec - 26.3) / 0.8);
  const needleT = smooth((sec - 27.6) / 1.5);

  const photonDeg = mix(180, 48, smooth((sec - 26.5) / 1.2));
  const quantumDeg = mix(180, -12, needleT) + (sec > 29.1 ? Math.sin(sec * 45) * 3 : 0);

  const photonEnd = polar(540, 1110, 230, photonDeg);
  const quantumEnd = polar(540, 1110, 340, quantumDeg);
  const crackOpacity = interp(sec, [29.0, 29.4, 31.85], [0, 1, 0.85]);

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <SvgDefs />

        <g opacity={interp(sec, [22.55, 22.9, 26.2, 26.6], [0, 1, 1, 0])}>
          <PaperCard x={84} y={505} w={420} h={170} title="EPR PARADOX (1935)" detail="EINSTEIN · PODOLSKY · ROSEN" rotate={-2} />
          <PaperCard x={575} y={515} w={420} h={170} title="E = mc²" detail="COSMIC SPEED LIMIT: c" accent="#b18a35" rotate={2} />
          <PaperCard x={190} y={745} w={700} h={150} title="SPOOKY ACTION AT A DISTANCE" detail="EINSTEIN'S FAMOUS OBJECTION" rotate={0.6} />

          <g fill="none" stroke="#51493c" strokeWidth="2.5" opacity="0.78">
            <path d={makeWavePath(120, 995, 960, 995, 36, 4, sec * 6, 80)} />
          </g>

          <g transform="rotate(-8 540 1240)">
            <rect x="310" y="1170" width="460" height="115" rx="10" fill="none" stroke="#d93829" strokeWidth="8" />
            <text x="540" y="1244" textAnchor="middle" fill="#d93829" fontSize="46" fontWeight="900" letterSpacing="4">
              PARADOX!
            </text>
          </g>
        </g>

        {sec >= 26.3 && (
          <g opacity={gaugeT}>
            <g transform={`translate(0 ${mix(80, 0, gaugeT)})`}>
              <circle cx="540" cy="1110" r="308" fill="#f2ead8" stroke="#24211d" strokeWidth="6" />
              <path d="M252 1110 A288 288 0 0 1 828 1110" fill="none" stroke="#2a2823" strokeWidth="14" strokeLinecap="round" />
              <path d="M746 910 A288 288 0 0 1 828 1110" fill="none" stroke="#d93829" strokeWidth="20" strokeLinecap="round" />

              {Array.from({ length: 31 }, (_, i) => {
                const deg = 180 - i * 6;
                const p1 = polar(540, 1110, i % 5 === 0 ? 248 : 264, deg);
                const p2 = polar(540, 1110, 286, deg);
                return (
                  <path
                    key={i}
                    d={`M${p1.x} ${p1.y}L${p2.x} ${p2.y}`}
                    stroke={i >= 19 ? '#d93829' : '#2d2922'}
                    strokeWidth={i % 5 === 0 ? 4.5 : 1.8}
                  />
                );
              })}

              {/* Gold Photon Needle (Stops at Speed of Light c) */}
              <path d={`M540 1110L${photonEnd.x} ${photonEnd.y}`} stroke="#e59f24" strokeWidth="11" strokeLinecap="round" />
              <circle cx={photonEnd.x} cy={photonEnd.y} r="13" fill="#fff0b3" stroke="#b97817" strokeWidth="4" />

              {/* Crimson Quantum Needle (Breaks past c to Infinity!) */}
              <path d={`M540 1110L${quantumEnd.x} ${quantumEnd.y}`} stroke="#d93829" strokeWidth="13" strokeLinecap="round" filter="url(#hardGlow)" />
              <circle cx="540" cy="1110" r="25" fill="#26221d" stroke="#d8c5a4" strokeWidth="5" />

              <text x="540" y="1462" fill="#1e1c19" textAnchor="middle" fontSize="28" fontWeight="900">
                LIGHT LIMIT: c = 299,792 KM/S
              </text>
              <text x="842" y="1125" fill="#d93829" fontSize="26" fontWeight="900">
                ∞
              </text>
            </g>

            <g opacity={crackOpacity} fill="none" stroke="#d93829" strokeWidth="4">
              <path d="M550 815L570 870L548 900L588 942L568 980" />
              <path d="M568 870L620 845L643 807 M548 900L505 875L485 835" />
            </g>

            <g transform="rotate(-6 540 640)">
              <rect x="250" y="585" width="580" height="96" rx="10" fill="#d93829" stroke="#f4efe4" strokeWidth="4" />
              <text x="540" y="647" textAnchor="middle" fill="#fff8ee" fontSize="36" fontWeight="900" letterSpacing="2">
                SPEED LIMIT SHATTERED ❌
              </text>
            </g>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* ======================== SCENE 5: COSMIC TWIN GALAXIES & HEARTBEAT WAVE ======================== */
const Galaxy: React.FC<{ cx: number; cy: number; r: number; color: string; rotation: number }> = ({
  cx,
  cy,
  r,
  color,
  rotation,
}) => (
  <g>
    <circle cx={cx} cy={cy} r={r * 1.4} fill={color} opacity="0.09" filter="url(#softGlow)" />
    <g transform={`rotate(${rotation} ${cx} ${cy})`} fill="none" stroke={color}>
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={r * (0.3 + i * 0.16)}
          ry={r * (0.1 + i * 0.045)}
          transform={`rotate(${i * 25} ${cx} ${cy})`}
          strokeWidth={i === 3 ? 3 : 1.5}
          opacity={0.32 + i * 0.07}
        />
      ))}
    </g>
    <circle cx={cx} cy={cy} r={r * 0.18} fill="#ffffff" opacity="0.92" filter="url(#hardGlow)" />
  </g>
);

const SceneFive: React.FC<{ sec: number }> = ({ sec }) => {
  const pulse = 1 + Math.sin(sec * 9) * 0.065;
  const heartPath =
    'M540 1015 C495 965 405 925 405 850 C405 790 480 760 540 835 C600 760 675 790 675 850 C675 925 585 965 540 1015Z';

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <SvgDefs />

        <Galaxy cx={205} cy={690} r={148} color="#ff5c8a" rotation={sec * 18} />
        <Galaxy cx={875} cy={1250} r={155} color="#00e5ff" rotation={-sec * 16} />

        <path
          d={makeWavePath(185, 980, 895, 980, 62, 3.2, sec * 9, 100)}
          stroke="#ff4d83"
          strokeWidth="4.5"
          fill="none"
          filter="url(#softGlow)"
        />
        <path
          d={makeWavePath(185, 980, 895, 980, 30, 3.2, sec * 9 + 1.5, 100)}
          stroke="#ffd166"
          strokeWidth="2.2"
          fill="none"
          opacity="0.85"
        />

        <g transform={`translate(540 905) scale(${pulse}) translate(-540 -905)`}>
          <path d={heartPath} fill="#ff4d83" fillOpacity="0.12" stroke="#ff4d83" strokeWidth="5.5" filter="url(#softGlow)" />
          <path d="M540 850L540 925 M500 890H580" stroke="#ffd8e2" strokeWidth="4" />
        </g>

        <g fill="none" stroke="#ff4d83" opacity="0.52">
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx="540"
              cy="930"
              rx={165 + i * 48}
              ry={82 + i * 26}
              transform={`rotate(${i * 45 + sec * 8} 540 930)`}
              strokeWidth="1.6"
            />
          ))}
        </g>

        <g>
          <rect x="175" y="1340" width="730" height="114" rx="18" fill="#0a1021" fillOpacity="0.9" stroke="#ff4d83" strokeWidth="2" />
          <text x="540" y="1385" fill="#ff8eae" textAnchor="middle" fontSize="18" fontWeight="700" letterSpacing="3">
            DISTANCE: INFINITE LIGHT YEARS
          </text>
          <path d="M260 1404H820" stroke="#ff4d83" opacity="0.7" />
          <text x="540" y="1436" fill="#ffffff" textAnchor="middle" fontSize="26" fontWeight="900" letterSpacing="3">
            QUANTUM BOND: UNBREAKABLE ❤️‍🔥
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ======================== SCENE 6: ER=EPR WORMHOLE & CLASSIFIED VAULT ======================== */
const SceneSix: React.FC<{ sec: number }> = ({ sec }) => {
  const rotation = (sec - 35.7) * 95;
  const open = smooth((sec - 37.65) / 0.75);
  const badgeSpring = spring({
    frame: Math.max(0, (sec - 37.65) * FPS),
    fps: FPS,
    config: { damping: 13, stiffness: 130 },
  });

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <SvgDefs />

        <g fill="none" stroke="#6b6252">
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={`sheetA${i}`}
              d={`M${90 + i * 90} 680 Q${300 + i * 56} ${460 - i * 12} ${500 + i * 55} 700`}
              strokeWidth="1.5"
              opacity="0.62"
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={`sheetB${i}`}
              d={`M${580 + i * 55} 1150 Q${720 + i * 52} ${1320 + i * 10} ${1050 + i * 4} 1110`}
              strokeWidth="1.5"
              opacity="0.62"
            />
          ))}
        </g>

        <text x="230" y="610" fill="#423c32" fontSize="18" fontWeight="900" letterSpacing="3">
          SPACETIME SHEET A
        </text>
        <text x="840" y="1190" fill="#423c32" fontSize="18" fontWeight="900" letterSpacing="3" textAnchor="middle">
          SPACETIME SHEET B
        </text>

        <g opacity="0.8" fill="none" stroke="#d93829">
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse
              key={i}
              cx="540"
              cy="930"
              rx={85 + i * 16}
              ry={38 + i * 7}
              transform={`rotate(${i * 20 + rotation} 540 930)`}
              strokeWidth={i === 4 ? 3 : 1.5}
            />
          ))}
        </g>

        <g transform={`rotate(${rotation * (1 - open * 0.7)} 540 930)`}>
          <circle cx="540" cy="930" r="268" fill="none" stroke="#28241f" strokeWidth="16" opacity="0.92" />
          <circle cx="540" cy="930" r="244" fill="none" stroke="#d93829" strokeWidth="2.5" strokeDasharray="6 9" />

          {Array.from({ length: 36 }, (_, i) => {
            const p1 = polar(540, 930, i % 3 === 0 ? 242 : 252, i * 10);
            const p2 = polar(540, 930, 268, i * 10);
            return <path key={i} d={`M${p1.x} ${p1.y}L${p2.x} ${p2.y}`} stroke="#e5cda5" strokeWidth={i % 3 === 0 ? 4 : 2} />;
          })}

          <circle cx="540" cy="930" r="172" fill="#ede3d1" stroke="#302a22" strokeWidth="8" />
          <circle cx="540" cy="930" r="144" fill="none" stroke="#d93829" strokeWidth="3" strokeDasharray="5 6" />
          <circle cx="540" cy="930" r="42" fill="#d4c3a5" stroke="#342d24" strokeWidth="7" />
          <circle cx="540" cy="930" r="12" fill="#d93829" />
        </g>

        <g transform={`rotate(${mix(-20, 75, open)} 540 930)`}>
          <path d="M540 790L540 860" stroke="#d93829" strokeWidth="13" strokeLinecap="round" />
          <circle cx="540" cy="786" r="24" fill="#d93829" stroke="#f4efe4" strokeWidth="4" />
        </g>

        <g opacity={open} transform={`translate(540 1290) scale(${0.72 + badgeSpring * 0.28}) translate(-540 -1290)`}>
          <rect x="180" y="1205" width="720" height="158" rx="18" fill="#d93829" stroke="#f4efe4" strokeWidth="6" filter="url(#shadow)" />
          <text x="540" y="1265" fill="#fff8ed" fontSize="22" fontWeight="800" textAnchor="middle" letterSpacing="4">
            CLASSIFIED VAULT // ACCESS GRANTED
          </text>
          <text x="540" y="1325" fill="#ffffff" fontSize="37" fontWeight="900" textAnchor="middle" letterSpacing="1">
            PART 2: THE SECRET MECHANISM 🔓
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ======================== SCENE 7: DUAL SMARTPHONES & SATELLITE RADAR ======================== */
const Phone: React.FC<{ x: number; y: number; side: 'left' | 'right'; sec: number }> = ({ x, y, side, sec }) => {
  const isRight = side === 'right';
  const pulse = isRight ? 0.72 + 0.28 * Math.abs(Math.sin(sec * 10)) : 1;
  // Vibrating shake on the right phone when missed call alerts!
  const buzzX = isRight ? Math.sin(sec * 55) * 4 : 0;

  return (
    <g transform={`translate(${x + buzzX} ${y}) rotate(${isRight ? 7 : -7} 130 235)`} filter="url(#shadow)">
      <rect x="0" y="0" width="260" height="500" rx="36" fill="#101725" stroke="#7d9bb6" strokeWidth="3" />
      <rect x="11" y="11" width="238" height="478" rx="29" fill="#070d19" stroke="#2d4964" strokeWidth="1.5" />
      <rect x="82" y="19" width="96" height="10" rx="5" fill="#44546a" />
      <rect x="22" y="46" width="216" height="425" rx="20" fill={isRight ? '#17101a' : '#0b1b2c'} />

      <text x="39" y="80" fill="#d6e8f4" fontSize="13" fontWeight="800" letterSpacing="1.5">
        {isRight ? 'PHONE / INCOMING' : 'SATELLITE / LINK'}
      </text>

      {isRight ? (
        <g opacity={pulse}>
          <circle cx="130" cy="180" r="48" fill="#421b2a" stroke="#ff5265" strokeWidth="2.5" />
          <text x="130" y="196" textAnchor="middle" fontSize="42">
            📞
          </text>
          <text x="130" y="290" fill="#ff6578" textAnchor="middle" fontSize="22" fontWeight="900">
            1 MISSED CALL
          </text>
          <text x="130" y="319" fill="#f4d7dc" textAnchor="middle" fontSize="14" fontWeight="700">
            LDR PARTNER ❤️
          </text>
          <rect x="48" y="355" width="164" height="52" rx="25" fill="#7d2338" stroke="#ff5265" strokeWidth="1.8" />
          <text x="130" y="388" fill="#fff" textAnchor="middle" fontSize="15" fontWeight="900" letterSpacing="2">
            CAUGHT! 🚨
          </text>
        </g>
      ) : (
        <g>
          <circle cx="130" cy="190" r="70" fill="none" stroke="#00e5ff" strokeWidth="1.8" opacity="0.85" />
          <circle cx="130" cy="190" r="46" fill="none" stroke="#00e5ff" strokeDasharray="4 6" />
          <path d="M130 112V268M52 190H208" stroke="#00e5ff" opacity="0.4" />
          <circle cx="130" cy="190" r="9" fill="#00e5ff" filter="url(#hardGlow)" />
          <text x="130" y="300" fill="#00e5ff" textAnchor="middle" fontSize="19" fontWeight="900">
            SIGNAL LOCK
          </text>
          <text x="130" y="326" fill="#bed1e1" textAnchor="middle" fontSize="13" fontWeight="700">
            ZERO DELAY RADAR
          </text>
          <rect x="48" y="355" width="164" height="52" rx="25" fill="#103d50" stroke="#00e5ff" strokeWidth="1.8" />
          <text x="130" y="388" fill="#ffffff" textAnchor="middle" fontSize="14" fontWeight="800" letterSpacing="2">
            TRACKING ON
          </text>
        </g>
      )}
    </g>
  );
};

const SceneSeven: React.FC<{ sec: number }> = ({ sec }) => {
  const commentProgress = clamp((sec - 44.4) / 2.2);
  const typed = '@tag_your_ldr_friend 😂📡'.slice(0, Math.floor(commentProgress * '@tag_your_ldr_friend 😂📡'.length));
  const radar = 1 + ((sec * 1.7) % 1);
  const beamPacket = (sec * 2.4) % 1;

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <SvgDefs />

        <g opacity="0.2" stroke="#5d9bbc" fill="none">
          <circle cx="540" cy="950" r="220" />
          <circle cx="540" cy="950" r="330" />
          <circle cx="540" cy="950" r="440" />
          <path d="M100 950H980M540 500V1410" />
        </g>

        <g transform={`translate(540 950) scale(${radar}) translate(-540 -950)`} opacity="0.45" fill="none" stroke="#00e5ff">
          <circle cx="540" cy="950" r="210" strokeWidth="3" />
        </g>

        <path d="M245 875 Q540 600 835 900" stroke="#00e5ff" strokeWidth="2.5" fill="none" strokeDasharray="8 8" opacity="0.8" />
        <path
          d="M245 875L835 900"
          stroke="#ff5265"
          strokeWidth="4.5"
          fill="none"
          opacity={interp(sec, [40.0, 40.8, 47], [0, 0.95, 0.8])}
          filter="url(#softGlow)"
        />
        <circle cx={mix(245, 835, beamPacket)} cy={mix(875, 900, beamPacket)} r="12" fill="#ffd166" filter="url(#hardGlow)" />

        <g fill="#e7f7ff" fontSize="19" fontWeight="900" letterSpacing="2">
          <text x="340" y="620" textAnchor="middle">
            DELHI
          </text>
          <text x="725" y="1160" textAnchor="middle">
            MUMBAI / LONDON
          </text>
        </g>

        <Phone x={55} y={655} side="left" sec={sec} />
        <Phone x={765} y={645} side="right" sec={sec} />

        <g opacity={interp(sec, [40.6, 41.2, 47], [0, 1, 0.95])}>
          <rect x="320" y="1190" width="440" height="106" rx="16" fill="#101a2b" fillOpacity="0.95" stroke="#ff5265" strokeWidth="2.5" filter="url(#shadow)" />
          <text x="540" y="1233" fill="#ff7180" fontSize="16" fontWeight="800" textAnchor="middle" letterSpacing="2">
            LOCATION &amp; STATUS
          </text>
          <text x="540" y="1272" fill="#ffffff" fontSize="24" fontWeight="900" textAnchor="middle">
            INSTANTLY DETECTED 🚨
          </text>
        </g>

        {sec >= 44.4 && (
          <g opacity={commentProgress} transform={`translate(540 1420) scale(${0.86 + commentProgress * 0.14}) translate(-540 -1420)`}>
            <rect x="230" y="1340" width="620" height="150" rx="22" fill="#101725" fillOpacity="0.97" stroke="#ffd166" strokeWidth="2.5" filter="url(#shadow)" />
            <text x="285" y="1392" fill="#ffd166" fontSize="18" fontWeight="800" letterSpacing="1.5">
              YouTube · TAG YOUR LDR FRIEND 👇
            </text>
            <path d="M285 1416H795" stroke="#45576a" />
            <text x="285" y="1464" fill="#ffffff" fontSize="26" fontWeight="800">
              {typed}
              <tspan fill="#00e5ff">{commentProgress < 1 ? '▍' : ''}</tspan>
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

const SceneVisual: React.FC<{ scene: Scene; sec: number }> = ({ scene, sec }) => {
  switch (scene.id) {
    case 1:
      return <SceneOne sec={sec} />;
    case 2:
      return <SceneTwo sec={sec} />;
    case 3:
      return <SceneThree sec={sec} />;
    case 4:
      return <SceneFour sec={sec} />;
    case 5:
      return <SceneFive sec={sec} />;
    case 6:
      return <SceneSix sec={sec} />;
    case 7:
      return <SceneSeven sec={sec} />;
    default:
      return null;
  }
};

/* ======================== DYNAMIC TOP HERO TYPOGRAPHY ======================== */
const HeroOverlay: React.FC<{
  beat: HeroBeat;
  beatAt: number;
  theme: Theme;
  frame: number;
}> = ({ beat, beatAt, theme, frame }) => {
  const age = Math.max(0, frame - Math.round(beatAt * FPS));

  const pop = spring({
    frame: age,
    fps: FPS,
    config: { damping: 13, stiffness: 160, mass: 0.7 },
  });

  const opacity = interp(age, [0, 7, 16], [0, 0.88, 1]);
  const blur = interp(age, [0, 12, 22], [14, 3, 0]);

  const isPaper = theme === 'paper';
  const ink = isPaper ? '#1e1c19' : '#f5fbff';
  const tagInk = isPaper ? '#5b5143' : '#9eb9cc';

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 102,
          left: 48,
          right: 48,
          height: 270,
          opacity,
          transform: `scale(${0.82 + pop * 0.18})`,
          filter: `blur(${blur}px)`,
          transformOrigin: '50% 44%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <span style={{ width: 42, height: 2.5, background: beat.accent, boxShadow: `0 0 15px ${beat.accent}` }} />
          <span
            style={{
              color: tagInk,
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 17,
              letterSpacing: 4,
              fontWeight: 800,
            }}
          >
            {beat.tag}
          </span>
          <span style={{ width: 42, height: 2.5, background: beat.accent, boxShadow: `0 0 15px ${beat.accent}` }} />
        </div>

        <div
          style={{
            textAlign: 'center',
            color: ink,
            fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
            fontWeight: 900,
            lineHeight: 0.94,
            letterSpacing: -3.2,
            textTransform: 'uppercase',
            textShadow: isPaper ? '0 2px 0 rgba(255,255,255,.3)' : '0 8px 30px rgba(0,0,0,.65)',
          }}
        >
          <div style={{ fontSize: 74, whiteSpace: 'nowrap' }}>{beat.line1}</div>
          <div style={{ fontSize: 76, whiteSpace: 'nowrap', color: beat.accent, marginTop: 4 }}>{beat.line2}</div>
        </div>

        <div
          style={{
            width: 220,
            height: 5,
            margin: '16px auto 0',
            background: beat.accent,
            boxShadow: `0 0 20px ${beat.accent}`,
            transform: `scaleX(${interp(age, [4, 18], [0.15, 1])})`,
            transformOrigin: 'center',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ======================== SYNCED BOTTOM CAPTIONS ======================== */
type WordTiming = { word: string; start: number; end: number };

function getWordTimings(scene: Scene): WordTiming[] {
  const words = scene.caption.trim().split(/\s+/);
  const weights = words.map((word) => {
    const chars = Math.max(2, word.replace(/[^a-zA-Z0-9]/g, '').length);
    const punctuation = /[,;:]$/.test(word) ? 1.6 : /[?!.]$/.test(word) ? 2.8 : 0;
    return chars + punctuation;
  });

  const total = weights.reduce((sum, weight) => sum + weight, 0);
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
  const activeIndex = timings.findIndex((timing) => sec >= timing.start && sec < timing.end);

  const safeIndex =
    sec < scene.speechStart ? 0 : sec >= scene.speechEnd ? timings.length - 1 : Math.max(0, activeIndex);

  const first = Math.floor(safeIndex / 4) * 4;
  const words = timings.slice(first, first + 4);
  const paper = scene.theme === 'paper';

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          top: 1580,
          minHeight: 142,
          borderRadius: 25,
          background: paper ? 'rgba(30,28,25,0.95)' : 'rgba(12,16,30,0.92)',
          border: `1.5px solid ${paper ? 'rgba(255,255,255,.2)' : 'rgba(130,190,220,.28)'}`,
          boxShadow: '0 18px 55px rgba(0,0,0,.42)',
          padding: '22px 28px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px 13px',
            color: '#f7f8fc',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        >
          {words.map((timing, index) => {
            const globalIndex = first + index;
            const isActive = globalIndex === safeIndex && sec >= scene.speechStart && sec < scene.speechEnd;
            const isPast = globalIndex < safeIndex;

            return (
              <span
                key={`${globalIndex}-${timing.word}`}
                style={{
                  display: 'inline-block',
                  color: isActive ? '#08111d' : isPast ? '#a7b6c4' : '#f7f8fc',
                  background: isActive ? '#00e5ff' : 'transparent',
                  borderRadius: 8,
                  padding: isActive ? '3px 10px 5px' : '2px 0',
                  transform: isActive ? 'translateY(-2px) scale(1.06)' : 'none',
                }}
              >
                {timing.word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ReelVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const scene = SCENES.find((item) => sec >= item.start && sec < item.end) ?? SCENES[SCENES.length - 1];

  const activeBeatIndex = scene.heroBeats.reduce((last, beat, index) => (sec >= beat.at ? index : last), 0);
  const beat = scene.heroBeats[activeBeatIndex];

  const sceneFade = interp(
    sec,
    [scene.start, scene.start + 0.16, scene.end - 0.16, scene.end],
    [0, 1, 1, 0.94],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#050814', overflow: 'hidden' }}>
      {scene.theme === 'dark' ? <DarkBackdrop sec={sec} /> : <PaperBackdrop />}

      <AbsoluteFill style={{ opacity: sceneFade }}>
        <SceneVisual scene={scene} sec={sec} />
      </AbsoluteFill>

      <HeroOverlay beat={beat} beatAt={beat.at} theme={scene.theme} frame={frame} />
      <CaptionOverlay scene={scene} sec={sec} />

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
