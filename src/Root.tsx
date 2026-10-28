import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  random,
} from 'remotion';

const VOICE = "en-IN-PrabhatNeural";

const SCENES = [
  { start: 0, duration: 5, text: "Agar oxygen sirf paanch second ke liye gayab ho jaye," },
  { start: 5, duration: 5, text: "Toh saans rok kar bhi aap nahi bach paoge." },
  { start: 10, duration: 5, text: "Kyunki oxygen hi har concrete building ko jod kar rakhta hai." },
  { start: 15, duration: 5, text: "Hawa ka pressure girte hi kaan ke parde phat jayenge." },
  { start: 20, duration: 5, text: "Din mein aasman kaala hoga aur saare engine band honge." },
  { start: 25, duration: 5, text: "Kyunki zameen ki parat bhi 45 percent oxygen se bani hai." }
];

const W = 1080;
const H = 1920;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* VINTAGE PARCHMENT PAPER BACKGROUND */
const VintagePaperBackground: React.FC<{ figNum: number; sectionTag: string }> = ({
  figNum,
  sectionTag,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 45%, #f6efe0 0%, #eadec5 58%, #d5c4a1 100%)',
        }}
      />

      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ opacity: 0.22 }}>
        {Array.from({ length: 28 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 40}
            y1={0}
            x2={i * 40}
            y2={H}
            stroke="#8c785c"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 48 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * 40}
            x2={W}
            y2={i * 40}
            stroke="#8c785c"
            strokeWidth="1"
          />
        ))}
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 86,
          width: 2,
          backgroundColor: 'rgba(204, 58, 43, 0.32)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 68,
          left: 64,
          right: 64,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 14,
          borderBottom: '2.5px solid #3b2f25',
          color: '#3b2f25',
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 4,
          fontFamily: 'Courier New, monospace',
        }}
      >
        <span>{sectionTag}</span>
        <span>FIG. 0{figNum}</span>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(48, 34, 18, 0.18) 85%, rgba(38, 25, 12, 0.42) 100%)',
        }}
      />

      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ opacity: 0.15 }}>
        {Array.from({ length: 35 }, (_, i) => (
          <circle
            key={i}
            cx={random(`pg-x-${i}`) * W}
            cy={random(`pg-y-${i}`) * H}
            r={1 + random(`pg-r-${i}`) * 2.2}
            fill="#4a3723"
            opacity={0.4 + Math.sin(frame * 0.03 + i) * 0.2}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/* TOP SCIENTIFIC TELEMETRY BAR */
const TopScientificTelemetry: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const o2 = interpolate(frame, [0, 120, 210], [20.9, 20.9, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pressure = interpolate(frame, [0, 900, 1020], [101.3, 101.3, 79.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bonds = interpolate(frame, [0, 600, 760], [100, 100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const skyScatter = interpolate(frame, [0, 1200, 1340], [100, 100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const countdown = interpolate(frame, [120, durationInFrames], [5.0, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const items = [
    { label: 'O2 LEVEL', value: `${o2.toFixed(1)}%`, alert: o2 < 5 },
    { label: 'PRESSURE', value: `${pressure.toFixed(1)} kPa`, alert: pressure < 90 },
    { label: 'Si-O BONDS', value: `${Math.round(bonds)}%`, alert: bonds < 50 },
    { label: 'SKY LIGHT', value: `${Math.round(skyScatter)}%`, alert: skyScatter < 40 },
    { label: 'TIMER', value: `0${countdown.toFixed(2)}s`, alert: true },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 126,
        left: 64,
        right: 64,
        zIndex: 25,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        background: '#2b2119',
        borderRadius: 12,
        padding: '12px 10px',
        border: '2px solid #574435',
        boxShadow: '0 8px 20px rgba(43, 33, 25, 0.18)',
      }}
    >
      {items.map((it, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRight: idx < 4 ? '1px solid rgba(246, 239, 224, 0.18)' : 'none',
          }}
        >
          <span
            style={{
              color: '#bfa88f',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.5,
            }}
          >
            {it.label}
          </span>
          <span
            style={{
              color: it.alert ? '#ff5e4d' : '#f6efe0',
              fontSize: 22,
              fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              marginTop: 3,
            }}
          >
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* EDITORIAL TYPEWRITER HEADLINE */
const EditorialHeadline: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const frame = useCurrentFrame();
  const fullText = `${line1}\n${line2}`;
  const typedLen = Math.min(fullText.length, Math.floor(frame * 0.95));
  const currentStr = fullText.slice(0, typedLen);
  const parts = currentStr.split('\n');
  const firstPart = parts[0] || '';
  const secondPart = parts[1] || '';
  const showCursor1 = typedLen < line1.length;
  const showCursor2 = typedLen >= line1.length && (frame % 30 < 18);

  return (
    <div
      style={{
        position: 'absolute',
        top: 235,
        left: 64,
        right: 64,
        zIndex: 20,
        fontFamily: 'Impact, Arial Black, sans-serif',
        textTransform: 'uppercase',
        lineHeight: 1.05,
      }}
    >
      <div
        style={{
          fontSize: 82,
          fontWeight: 900,
          color: '#362a20',
          letterSpacing: 1.5,
        }}
      >
        {firstPart}
        {showCursor1 && <span style={{ color: '#d43527' }}>|</span>}
      </div>
      <div
        style={{
          fontSize: 82,
          fontWeight: 900,
          color: '#d43527',
          letterSpacing: 1.5,
          marginTop: 6,
        }}
      >
        {secondPart}
        {showCursor2 && <span style={{ color: '#d43527' }}>|</span>}
      </div>
    </div>
  );
};

/* REUSABLE DIAGRAM LABEL BADGE */
const DiagramBadge: React.FC<{
  x: number;
  y: number;
  text: string;
  variant?: 'dark' | 'red';
  delay?: number;
}> = ({ x, y, text, variant = 'dark', delay = 20 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 14, stiffness: 150 },
  });

  const bg = variant === 'red' ? '#d43527' : '#2b2119';
  const w = Math.max(210, text.length * 16 + 44);

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${pop})`}
      style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.22))' }}
    >
      <rect
        x={-w / 2}
        y={-28}
        width={w}
        height={56}
        rx={12}
        fill={bg}
        stroke="#f6efe0"
        strokeWidth="3"
      />
      <text
        x="0"
        y="9"
        textAnchor="middle"
        fill="#f6efe0"
        fontSize="24"
        fontWeight="900"
        letterSpacing="2"
      >
        {text}
      </text>
    </g>
  );
};

/* SCENE 1: Scientific Cross-Section of O2 Molecule & Magnifying Glass */
const Scene1OxygenDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardIn = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });
  const dissolve = interpolate(frame, [130, 230], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const magX = interpolate(frame, [0, 120, 300], [420, 540, 565]);
  const magY = interpolate(frame, [0, 120, 300], [1080, 980, 965]);

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={1} sectionTag="THE BASICS" />
      <EditorialHeadline line1="OXYGEN GAYAB" line2="FOR 5 SECONDS?" />

      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="boxGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8e6e7" />
            <stop offset="100%" stopColor="#b8cdd0" />
          </linearGradient>
          <radialGradient id="atomGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#63cdda" />
            <stop offset="65%" stopColor="#227093" />
            <stop offset="100%" stopColor="#14425a" />
          </radialGradient>
        </defs>

        <g
          transform={`translate(540, 990) scale(${cardIn}) translate(-540, -990)`}
          style={{ filter: 'drop-shadow(0 20px 32px rgba(45, 32, 18, 0.22))' }}
        >
          <rect
            x="150"
            y="600"
            width="780"
            height="720"
            rx="28"
            fill="url(#boxGrad1)"
            stroke="#362a20"
            strokeWidth="6"
          />
          <rect x="153" y="603" width="774" height="120" rx="24" fill="#82aeb8" />
          <line x1="150" y1="720" x2="930" y2="720" stroke="#362a20" strokeWidth="4" />
          <text
            x="540"
            y="675"
            textAnchor="middle"
            fill="#2b2119"
            fontSize="28"
            fontWeight="900"
            letterSpacing="3"
          >
            EARTH ATMOSPHERE // 20.9% O2
          </text>

          <circle
            cx="540"
            cy="985"
            r="210"
            fill="none"
            stroke="#d43527"
            strokeWidth="5"
            strokeDasharray="14 10"
            transform={`rotate(${frame * 0.7} 540 985)`}
          />

          <g opacity={1 - dissolve * 0.88}>
            <rect x="410" y="962" width="260" height="14" rx="7" fill="#362a20" />
            <rect x="410" y="994" width="260" height="14" rx="7" fill="#362a20" />
            <circle
              cx="395"
              cy="985"
              r="92"
              fill="url(#atomGrad)"
              stroke="#362a20"
              strokeWidth="6"
            />
            <text x="395" y="1008" textAnchor="middle" fill="#f6efe0" fontSize="64" fontWeight="900">
              O
            </text>
            <circle
              cx="685"
              cy="985"
              r="92"
              fill="url(#atomGrad)"
              stroke="#362a20"
              strokeWidth="6"
            />
            <text x="685" y="1008" textAnchor="middle" fill="#f6efe0" fontSize="64" fontWeight="900">
              O
            </text>
          </g>

          {dissolve > 0.05 &&
            Array.from({ length: 28 }, (_, i) => {
              const angle = (i / 28) * Math.PI * 2;
              const dist = dissolve * (70 + (i % 4) * 45);
              return (
                <circle
                  key={i}
                  cx={540 + Math.cos(angle) * dist}
                  cy={985 + Math.sin(angle) * dist}
                  r={8 * (1 - dissolve * 0.5)}
                  fill={i % 2 === 0 ? '#d43527' : '#227093'}
                />
              );
            })}

          <g transform={`translate(${magX}, ${magY}) rotate(-28)`}>
            <rect
              x="-16"
              y="135"
              width="32"
              height="185"
              rx="14"
              fill="#6e472b"
              stroke="#2b2119"
              strokeWidth="6"
            />
            <circle
              cx="0"
              cy="0"
              r="140"
              fill="rgba(255, 255, 255, 0.25)"
              stroke="#2b2119"
              strokeWidth="14"
            />
            <path
              d="M-85 -65 A105 105 0 0 1 45 -95"
              stroke="#ffffff"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>

          <DiagramBadge x={300} y={1240} text="COVALENT O2" delay={15} />
          <DiagramBadge
            x={760}
            y={820}
            text={dissolve > 0.3 ? 'STATUS: VANISHED' : 'DURATION: 5.0 SEC'}
            variant="red"
            delay={45}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 2: Dual Anatomical Comparison (Lungs vs Structural Matter) */
const Scene2LungsVsWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leftIn = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 15 } });
  const rightIn = spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 15 } });

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={2} sectionTag="THE MECHANISM" />
      <EditorialHeadline line1="SAANS ROKNA" line2="BEKAAR KYUN HAI?" />

      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <g
          transform={`translate(295, 980) scale(${leftIn}) translate(-295, -980)`}
          style={{ filter: 'drop-shadow(0 16px 26px rgba(45, 32, 18, 0.2))' }}
        >
          <rect
            x="75"
            y="640"
            width="440"
            height="640"
            rx="24"
            fill="#e8d8c8"
            stroke="#362a20"
            strokeWidth="5"
          />
          <path
            d="M295 720 v120 M295 840 l-65 55 M295 840 l65 55"
            stroke="#8c584c"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M270 790 C165 785, 125 910, 145 1060 C160 1135, 255 1110, 275 1020 Z"
            fill="#d98a7c"
            stroke="#362a20"
            strokeWidth="5"
          />
          <path
            d="M320 790 C425 785, 465 910, 445 1060 C430 1135, 335 1110, 315 1020 Z"
            fill="#d98a7c"
            stroke="#362a20"
            strokeWidth="5"
          />
          <DiagramBadge x={295} y={1205} text="FEFDON (LUNGS)" delay={15} />
          <DiagramBadge x={295} y={695} text="HOLD: 60 SEC OK" delay={30} />
        </g>

        <g
          transform={`translate(785, 980) scale(${rightIn}) translate(-785, -980)`}
          style={{ filter: 'drop-shadow(0 16px 26px rgba(45, 32, 18, 0.2))' }}
        >
          <rect
            x="565"
            y="640"
            width="440"
            height="640"
            rx="24"
            fill="#dfd3c3"
            stroke="#362a20"
            strokeWidth="5"
          />
          <rect
            x="640"
            y="770"
            width="120"
            height="290"
            fill="#95a5a6"
            stroke="#362a20"
            strokeWidth="5"
          />
          <rect
            x="790"
            y="730"
            width="135"
            height="330"
            fill="#7f8c8d"
            stroke="#362a20"
            strokeWidth="5"
          />
          <rect
            x="600"
            y="1060"
            width="370"
            height="70"
            rx="8"
            fill="#8c6239"
            stroke="#362a20"
            strokeWidth="5"
          />
          <circle
            cx="785"
            cy="935"
            r="175"
            fill="none"
            stroke="#d43527"
            strokeWidth="5"
            strokeDasharray="12 8"
            transform={`rotate(${-frame * 0.8} 785 935)`}
          />
          <DiagramBadge x={785} y={1205} text="CHAARON TARAF" delay={35} />
          <DiagramBadge x={785} y={695} text="INSTANT COLLAPSE" variant="red" delay={50} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 3: Concrete Microscopic Oxygen Matrix Disintegrating */
const Scene3ConcreteMatrix: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const boxIn = spring({ frame, fps, config: { damping: 16 } });
  const crumble = interpolate(frame, [95, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const nodes = [
    { x: 390, y: 860, type: 'Ca' },
    { x: 540, y: 860, type: 'O' },
    { x: 690, y: 860, type: 'Si' },
    { x: 390, y: 1000, type: 'O' },
    { x: 540, y: 1000, type: 'Ca' },
    { x: 690, y: 1000, type: 'O' },
    { x: 390, y: 1140, type: 'Si' },
    { x: 540, y: 1140, type: 'O' },
    { x: 690, y: 1140, type: 'Ca' },
  ];

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={3} sectionTag="MATERIAL SCIENCE" />
      <EditorialHeadline line1="CONCRETE MEIN" line2="OXYGEN FACTORY!" />

      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <g
          transform={`translate(540, 990) scale(${boxIn}) translate(-540, -990)`}
          style={{ filter: 'drop-shadow(0 20px 32px rgba(45, 32, 18, 0.22))' }}
        >
          <rect
            x="150"
            y="610"
            width="780"
            height="720"
            rx="28"
            fill="#d9d4cc"
            stroke="#362a20"
            strokeWidth="6"
          />
          <rect x="153" y="613" width="774" height="115" rx="24" fill="#a59f95" />
          <line x1="150" y1="728" x2="930" y2="728" stroke="#362a20" strokeWidth="5" />
          <text
            x="540"
            y="682"
            textAnchor="middle"
            fill="#2b2119"
            fontSize="28"
            fontWeight="900"
            letterSpacing="3"
          >
            HOOVER DAM & CONCRETE // Ca-O-Si MATRIX
          </text>

          <g opacity={1 - crumble}>
            <line x1="390" y1="860" x2="690" y2="860" stroke="#362a20" strokeWidth="8" />
            <line x1="390" y1="1000" x2="690" y2="1000" stroke="#362a20" strokeWidth="8" />
            <line x1="390" y1="1140" x2="690" y2="1140" stroke="#362a20" strokeWidth="8" />
            <line x1="390" y1="860" x2="390" y2="1140" stroke="#362a20" strokeWidth="8" />
            <line x1="540" y1="860" x2="540" y2="1140" stroke="#362a20" strokeWidth="8" />
            <line x1="690" y1="860" x2="690" y2="1140" stroke="#362a20" strokeWidth="8" />
          </g>

          <circle
            cx="540"
            cy="1000"
            r="225"
            fill="none"
            stroke="#d43527"
            strokeWidth="5"
            strokeDasharray="14 10"
            transform={`rotate(${frame * 0.6} 540 1000)`}
          />

          {nodes.map((n, i) => {
            const isO = n.type === 'O';
            const dropY = isO ? 0 : crumble * (130 + (i % 3) * 45);
            const driftX = isO ? 0 : crumble * ((i % 2 === 0 ? -1 : 1) * 45);
            const op = isO ? 1 - crumble : 1;
            return (
              <g
                key={i}
                transform={`translate(${n.x + driftX}, ${n.y + dropY})`}
                opacity={op}
              >
                <circle
                  cx="0"
                  cy="0"
                  r={isO ? 44 : 48}
                  fill={isO ?
