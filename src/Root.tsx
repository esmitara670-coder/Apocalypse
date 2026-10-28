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

const VintagePaperBackground: React.FC<{ figNum: number; sectionTag: string }> = ({
  figNum,
  sectionTag,
}) => {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 45%, #f6efe0 0%, #eadec5 58%, #d5c4a1 100%)',
        }}
      />
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
    </AbsoluteFill>
  );
};

const TopScientificTelemetry: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const o2 = interpolate(frame, [0, 120, 210], [20.9, 20.9, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const countdown = interpolate(frame, [120, durationInFrames], [5.0, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 126,
        left: 64,
        right: 64,
        zIndex: 25,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        background: '#2b2119',
        borderRadius: 12,
        padding: '12px 16px',
        border: '2px solid #574435',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#bfa88f', fontSize: 13, fontWeight: 800 }}>O2 LEVEL</span>
        <span style={{ color: o2 < 5 ? '#ff5e4d' : '#f6efe0', fontSize: 22, fontWeight: 900 }}>{o2.toFixed(1)}%</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#bfa88f', fontSize: 13, fontWeight: 800 }}>BONDS</span>
        <span style={{ color: '#f6efe0', fontSize: 22, fontWeight: 900 }}>STABLE</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#bfa88f', fontSize: 13, fontWeight: 800 }}>TIMER</span>
        <span style={{ color: '#ff5e4d', fontSize: 22, fontWeight: 900 }}>0{countdown.toFixed(2)}s</span>
      </div>
    </div>
  );
};

const EditorialHeadline: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
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
      <div style={{ fontSize: 82, fontWeight: 900, color: '#362a20' }}>{line1}</div>
      <div style={{ fontSize: 82, fontWeight: 900, color: '#d43527', marginTop: 6 }}>{line2}</div>
    </div>
  );
};

const DiagramBadge: React.FC<{ x: number; y: number; text: string; variant?: 'dark' | 'red' }> = ({
  x,
  y,
  text,
  variant = 'dark',
}) => {
  const bg = variant === 'red' ? '#d43527' : '#2b2119';
  const w = Math.max(210, text.length * 16 + 44);
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-w / 2} y={-28} width={w} height={56} rx={12} fill={bg} stroke="#f6efe0" strokeWidth="3" />
      <text x="0" y="9" textAnchor="middle" fill="#f6efe0" fontSize="24" fontWeight="900">
        {text}
      </text>
    </g>
  );
};

const Scene1: React.FC = () => (
  <AbsoluteFill>
    <VintagePaperBackground figNum={1} sectionTag="THE BASICS" />
    <EditorialHeadline line1="OXYGEN GAYAB" line2="FOR 5 SECONDS?" />
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="150" y="600" width="780" height="720" rx="28" fill="#d8e6e7" stroke="#362a20" strokeWidth="6" />
      <DiagramBadge text="COVALENT O2" x={540} y={960} />
    </svg>
  </AbsoluteFill>
);

const Scene2: React.FC = () => (
  <AbsoluteFill>
    <VintagePaperBackground figNum={2} sectionTag="THE MECHANISM" />
    <EditorialHeadline line1="SAANS ROKNA" line2="BEKAAR KYUN HAI?" />
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="150" y="600" width="780" height="720" rx="28" fill="#e8d8c8" stroke="#362a20" strokeWidth="6" />
      <DiagramBadge text="FEFDON (LUNGS)" x={540} y={960} />
    </svg>
  </AbsoluteFill>
);

const Scene3: React.FC = () => (
  <AbsoluteFill>
    <VintagePaperBackground figNum={3} sectionTag="MATERIAL SCIENCE" />
    <EditorialHeadline line1="CONCRETE MEIN" line2="OXYGEN FACTORY!" />
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="150" y="600" width="780" height="720" rx="28" fill="#d9d4cc" stroke="#362a20" strokeWidth="6" />
      <DiagramBadge text="CEMENT GLUE" x={540} y={960} />
    </svg>
  </AbsoluteFill>
);

const Scene4: React.FC = () => (
  <AbsoluteFill>
    <VintagePaperBackground figNum={4} sectionTag="HUMAN ANATOMY" />
    <EditorialHeadline line1="PRESSURE -21%" line2="KAAN KE PARDE!" />
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="150" y="600" width="780" height="720" rx="28" fill="#e6b89c" stroke="#362a20" strokeWidth="6" />
      <DiagramBadge text="KAAN KA PARDA" variant="red" x={540} y={960} />
    </svg>
  </AbsoluteFill>
);

const Scene5: React.FC = () => (
  <AbsoluteFill>
    <VintagePaperBackground figNum={5} sectionTag="APPLIED PHYSICS" />
    <EditorialHeadline line1="KAALA AASMAN" line2="& ENGINE DEAD!" />
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="150" y="600" width="780" height="720" rx="28" fill="#dfd6c7" stroke="#362a20" strokeWidth="6" />
      <DiagramBadge text="ENGINES STALLED" variant="red" x={540} y={960} />
    </svg>
  </AbsoluteFill>
);

const Scene6: React.FC = () => (
  <AbsoluteFill>
    <VintagePaperBackground figNum={6} sectionTag="GEOLOGY // SUMMARY" />
    <EditorialHeadline line1="ZAMEEN KA 45%" line2="HISSA OXYGEN HAI!" />
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="150" y="600" width="780" height="720" rx="28" fill="#e5dac7" stroke="#362a20" strokeWidth="6" />
      <DiagramBadge text="CRUST = 45% O2" x={540} y={960} />
    </svg>
  </AbsoluteFill>
);

const EditorialPaperCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneIndex = Math.min(SCENES.length - 1, Math.floor(frame / (5 * fps)));
  const scene = SCENES[sceneIndex];
  const localFrame = frame - scene.start * fps;
  const progress = clamp01(localFrame / (3.5 * fps));
  const words = scene.text.split(' ');
  const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        bottom: 165,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '14px 24px' }}>
        {words.map((word, idx) => {
          const isActive = idx === activeWordIndex;
          return (
            <span
              key={idx}
              style={{
                padding: '6px 16px',
                borderRadius: 10,
                fontSize: 40,
                fontWeight: 900,
                backgroundColor: isActive ? '#e06324' : 'transparent',
                color: isActive ? '#ffffff' : '#2b2119',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const ScienceReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#eadec5' }}>
      <TopScientificTelemetry />
      {SCENES.map((scene, index) => (
        <Sequence key={index} from={scene.start * 60} durationInFrames={scene.duration * 60}>
          {index === 0 && <Scene1 />}
          {index === 1 && <Scene2 />}
          {index === 2 && <Scene3 />}
          {index === 3 && <Scene4 />}
          {index === 4 && <Scene5 />}
          {index === 5 && <Scene6 />}
        </Sequence>
      ))}
      <Audio src={staticFile('voice.mp3')} />
      <EditorialPaperCaptions />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ScienceReel}
      durationInFrames={1800}
      fps={60}
      width={1080}
      height={1920}
    />
  );
};
