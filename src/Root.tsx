import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  // Audio, staticFile // Uncomment when adding public/voice.mp3
} from 'remotion';

// =========================================================
// 1. DETERMINISTIC MATH & MULTI-SKILL ENGINE
// =========================================================

const W = 1080;
const H = 1920;
const FPS = 60;
const TOTAL_FRAMES = 1800; // 30 Seconds = 10 Shots x 3s (180 frames each)

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// Claude Animation Base: 12 FPS Hand-Drawn Boil
function boil(frame: number, seed: number, amp = 2.5): number {
  const step12fps = Math.floor(frame / 5); // 60fps / 5 = 12fps
  return (hash(step12fps * 91.7 + seed * 37.3) - 0.5) * 2 * amp;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

// =========================================================
// 2. GLOBAL CYBER-HUD & 3D ENVIRONMENT LAYER
// (Ensures NO frame ever looks empty or flat)
// =========================================================

const CyberEnvironment: React.FC<{
  accent: string;
  shotIndex: number;
  title: string;
  metric: string;
}> = ({ accent, shotIndex, title, metric }) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Deep Radial Atmosphere */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${accent}22 0%, #070A12 62%, #030408 100%)`,
        }}
      />

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {/* Moving Perspective Floor & Ceiling Grid */}
        <g opacity={0.22} stroke={accent} strokeWidth={1.5}>
          {Array.from({ length: 14 }).map((_, i) => {
            const xSpread = (i - 6.5) * 220;
            return (
              <React.Fragment key={i}>
                <line x1={540 + xSpread * 0.15} y1={1250} x2={540 + xSpread} y2={1920} />
                <line x1={540 + xSpread * 0.15} y1={670} x2={540 + xSpread} y2={0} opacity={0.4} />
              </React.Fragment>
            );
          })}
          {Array.from({ length: 8 }).map((_, i) => {
            const move = ((frame * 2.5 + i * 80) % 640) / 640;
            const yFloor = 1250 + Math.pow(move, 1.8) * 670;
            return <line key={i} x1={0} y1={yFloor} x2={W} y2={yFloor} opacity={move} />;
          })}
        </g>

        {/* Floating Depth Particles (40 deterministic particles) */}
        {Array.from({ length: 40 }).map((_, i) => {
          const px = (hash(i * 13) * W + frame * (hash(i * 7) - 0.5) * 3 + W) % W;
          const py = (hash(i * 29) * H - frame * (1.2 + hash(i * 19) * 2.5) + H * 10) % H;
          const r = 1.5 + hash(i * 41) * 4;
          return (
            <circle
              key={i}
              cx={px}
              cy={py}
              r={r}
              fill={i % 3 === 0 ? accent : '#FFFFFF'}
              opacity={0.18 + hash(i * 53) * 0.45}
            />
          );
        })}

        {/* Lemo-Opuscar HUD Corner Brackets & Telemetry */}
        <g stroke={accent} strokeWidth={4} fill="none" opacity={0.85}>
          <path d="M 45 110 L 45 55 L 110 55" />
          <path d="M 1035 110 L 1035 55 L 970 55" />
          <path d="M 45 1810 L 45 1865 L 110 1865" />
          <path d="M 1035 1810 L 1035 1865 L 970 1865" />
        </g>

        {/* Top Telemetry Bar */}
        <g transform="translate(75, 75)">
          <rect x={0} y={0} width={930} height={74} rx={12} fill="rgba(8,12,22,0.82)" stroke={`${accent}66`} strokeWidth={2} />
          <circle cx={38} cy={37} r={10} fill={accent} opacity={0.5 + Math.sin(sec * 18) * 0.5} />
          <text x={65} y={45} fill="#FFFFFF" fontSize={24} fontFamily="monospace" fontWeight="900" letterSpacing={2}>
            {`SHOT 0${shotIndex}/10 · ${title}`}
          </text>
          <text x={900} y={45} textAnchor="end" fill={accent} fontSize={24} fontFamily="monospace" fontWeight="bold">
            {metric}
          </text>
        </g>

        {/* Bottom Audio/Neural Waveform Visualizer */}
        <g transform="translate(80, 1815)">
          {Array.from({ length: 46 }).map((_, i) => {
            const h = 8 + Math.abs(Math.sin(sec * 12 + i * 0.45)) * 28;
            return (
              <rect
                key={i}
                x={i * 20}
                y={-h / 2}
                width={10}
                height={h}
                rx={4}
                fill={i % 5 === 0 ? accent : '#3A465E'}
                opacity={0.75}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// =========================================================
// 3. DETAILED ARTICULATED ATOM STICKMAN RIG
// (Claude Animation Base: Boil + Squash/Stretch + Glowing Atom Core)
// =========================================================

const DetailedAtomStickman: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale?: number;
  rot?: number;
  sq?: number;
  pose: 'falling' | 'panic' | 'hyperfocus' | 'catching' | 'exhausted' | 'hero';
  accent?: string;
}> = ({ frame, x, y, scale = 1, rot = 0, sq = 0, pose, accent = '#00F0FF' }) => {
  const b = (seed: number, amp = 2.8) => boil(frame, seed, amp);
  const sx = scale * (1 + sq * 0.35);
  const sy = scale * (1 - sq * 0.35);

  const headX = b(1, 2);
  const headY = -230 + b(2, 2);

  // Dynamic limb coordinates by pose
  const limbs = {
    falling: {
      lShoulder: [-70, -140], lHand: [-155, -240],
      rShoulder: [75, -150], rHand: [160, -210],
      lKnee: [-65, 50], lFoot: [-110, 140],
      rKnee: [75, 20], rFoot: [130, 95],
    },
    panic: {
      lShoulder: [-85, -160], lHand: [-65, -255],
      rShoulder: [85, -160], rHand: [65, -255],
      lKnee: [-55, 75], lFoot: [-70, 175],
      rKnee: [55, 75], rFoot: [70, 175],
    },
    hyperfocus: {
      lShoulder: [-65, -110], lHand: [-115, -35],
      rShoulder: [65, -110], rHand: [115, -35],
      lKnee: [-50, 80], lFoot: [-65, 180],
      rKnee: [50, 80], rFoot: [65, 180],
    },
    catching: {
      lShoulder: [-80, -145], lHand: [-160, -70],
      rShoulder: [95, -155], rHand: [220, -185],
      lKnee: [-85, 65], lFoot: [-140, 145],
      rKnee: [65, 85], rFoot: [40, 180],
    },
    exhausted: {
      lShoulder: [-55, -75], lHand: [-45, 45],
      rShoulder: [55, -75], rHand: [45, 45],
      lKnee: [-70, 95], lFoot: [-85, 180],
      rKnee: [70, 95], rFoot: [85, 180],
    },
    hero: {
      lShoulder: [-75, -115], lHand: [-125, -10],
      rShoulder: [75, -115], rHand: [125, -10],
      lKnee: [-55, 85], lFoot: [-75, 185],
      rKnee: [55, 85], rFoot: [75, 185],
    },
  }[pose];

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot + b(9, 0.8)}) scale(${sx}, ${sy})`}>
      {/* Outer Aura Glow */}
      <circle cx={0} cy={-80} r={190} fill={accent} opacity={0.09} />

      {/* Spine / Ribcage Armor Lines */}
      <path
        d={`M ${headX} ${headY + 82} Q ${b(10, 5)} ${-80} ${b(11, 4)} ${15}`}
        stroke="#F4F6FA"
        strokeWidth={16}
        strokeLinecap="round"
        fill="none"
      />

      {/* Glowing Cyan Atom Core on Chest (Brand Mascot Signature) */}
      <g transform={`translate(${b(12, 2)}, ${-95 + b(13, 2)})`}>
        {[0, 60, 120].map((angle, idx) => {
          const eAngle = (frame * 0.12 + idx * 2.1) % (Math.PI * 2);
          const ex = Math.cos(eAngle) * 78;
          const ey = Math.sin(eAngle) * 26;
          return (
            <g key={idx} transform={`rotate(${angle})`}>
              <ellipse
                cx={0}
                cy={0}
                rx={78}
                ry={26}
                fill="none"
                stroke={accent}
                strokeWidth={3.5}
                opacity={0.75}
              />
              <circle cx={ex} cy={ey} r={7} fill="#FFFFFF" stroke={accent} strokeWidth={3} />
            </g>
          );
        })}
        <circle cx={0} cy={0} r={14} fill={accent} />
        <circle cx={0} cy={0} r={7} fill="#FFFFFF" />
      </g>

      {/* Articulated Arms with Elbows & Boiling Ink */}
      <path
        d={`M 0 -135 Q ${limbs.lShoulder[0] + b(20, 4)} ${limbs.lShoulder[1] + b(21, 4)} ${limbs.lHand[0] + b(22, 4)} ${limbs.lHand[1] + b(23, 4)}`}
        stroke="#F4F6FA"
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M 0 -135 Q ${limbs.rShoulder[0] + b(24, 4)} ${limbs.rShoulder[1] + b(25, 4)} ${limbs.rHand[0] + b(26, 4)} ${limbs.rHand[1] + b(27, 4)}`}
        stroke="#F4F6FA"
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />

      {/* Articulated Legs with Knees */}
      <path
        d={`M 0 15 Q ${limbs.lKnee[0] + b(30, 4)} ${limbs.lKnee[1]} ${limbs.lFoot[0] + b(31, 4)} ${limbs.lFoot[1]}`}
        stroke="#F4F6FA"
        strokeWidth={15}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M 0 15 Q ${limbs.rKnee[0] + b(32, 4)} ${limbs.rKnee[1]} ${limbs.rFoot[0] + b(33, 4)} ${limbs.rFoot[1]}`}
        stroke="#F4F6FA"
        strokeWidth={15}
        strokeLinecap="round"
        fill="none"
      />

      {/* Head with Double Ink Boil */}
      <circle
        cx={headX}
        cy={headY}
        r={84 + b(40, 1.5)}
        fill="#0D121F"
        stroke={accent}
        strokeWidth={4}
        opacity={0.6}
      />
      <circle
        cx={headX}
        cy={headY}
        r={80 + b(41, 1.5)}
        fill="#101626"
        stroke="#F4F6FA"
        strokeWidth={12}
      />

      {/* Expressive Eyes & Dilated Pupils */}
      {(() => {
        const pupilRadius = pose === 'hyperfocus' || pose === 'catching' ? 15 : pose === 'panic' ? 6 : 10;
        const eyeRadius = pose === 'exhausted' ? 12 : 24;
        return (
          <g>
            {/* Left Eye */}
            <ellipse cx={headX - 28} cy={headY - 8} rx={22} ry={eyeRadius} fill="#FFFFFF" />
            <circle cx={headX - 28 + b(50, 1.5)} cy={headY - 8} r={pupilRadius} fill={accent} />
            <circle cx={headX - 28 + b(50, 1.5)} cy={headY - 8} r={pupilRadius * 0.45} fill="#05070B" />

            {/* Right Eye */}
            <ellipse cx={headX + 28} cy={headY - 8} rx={22} ry={eyeRadius} fill="#FFFFFF" />
            <circle cx={headX + 28 + b(51, 1.5)} cy={headY - 8} r={pupilRadius} fill={accent} />
            <circle cx={headX + 28 + b(51, 1.5)} cy={headY - 8} r={pupilRadius * 0.45} fill="#05070B" />

            {/* Eyebrows */}
            <path
              d={
                pose === 'panic' || pose === 'falling'
                  ? `M ${headX - 50} ${headY - 32} L ${headX - 10} ${headY - 46}`
                  : `M ${headX - 50} ${headY - 42} L ${headX - 10} ${headY - 28}`
              }
              stroke="#F4F6FA"
              strokeWidth={7}
              strokeLinecap="round"
            />
            <path
              d={
                pose === 'panic' || pose === 'falling'
                  ? `M ${headX + 50} ${headY - 32} L ${headX + 10} ${headY - 46}`
                  : `M ${headX + 50} ${headY - 42} L ${headX + 10} ${headY - 28}`
              }
              stroke="#F4F6FA"
              strokeWidth={7}
              strokeLinecap="round"
            />
          </g>
        );
      })()}

      {/* Mouth */}
      {pose === 'panic' || pose === 'falling' ? (
        <ellipse cx={headX} cy={headY + 38} rx={20} ry={25} fill="#FF2D55" stroke="#F4F6FA" strokeWidth={5} />
      ) : (
        <path
          d={`M ${headX - 24} ${headY + 36} Q ${headX} ${headY + (pose === 'hero' ? 52 : 26)} ${headX + 24} ${headY + 36}`}
          stroke="#F4F6FA"
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Claude Animation Base: Painted Reaction Emotes (!, Sparks, Sweat) */}
      {(pose === 'falling' || pose === 'panic') && (
        <g transform={`translate(${headX + 115}, ${headY - 95}) rotate(15)`}>
          <path d="M 0 0 L 8 -55 M 22 8 L 42 -42 M -18 12 L -38 -35" stroke="#FF2D55" strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

// =========================================================
// 4. TEN 3-SECOND HIGH-DENSITY SHOTS (180 FRAMES EACH)
// =========================================================

// SHOT 1 (0-3s): Slow-Motion Fall & Suspended Coffee Droplets
const Shot01_SlowMoSlip: React.FC = () => {
  const f = useCurrentFrame();
  const camZoom = interpolate(f, [0, 35, 180], [1.35, 1.0, 1.12], { easing: Easing.out(Easing.cubic) });
  const fallAngle = interpolate(f, [0, 40, 180], [0, -38, -52]);

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#FF2D55" shotIndex={1} title="TIME DILATION HOOK" metric="SPEED: 0.05x" />
      <svg width={W} height={H} style={{ transform: `scale(${camZoom})` }}>
        {/* Speed Lines */}
        {Array.from({ length: 16 }).map((_, i) => {
          const y = 250 + i * 95;
          return (
            <line
              key={i}
              x1={0}
              y1={y}
              x2={W}
              y2={y - 120}
              stroke="#FF2D55"
              strokeWidth={2}
              strokeDasharray="40 90"
              strokeDashoffset={-f * 4}
              opacity={0.35}
            />
          );
        })}

        {/* Floating Coffee Cup & Suspended Liquid Droplets in Mid-Air */}
        <g transform={`translate(${310 - f * 0.4}, ${640 - f * 0.5}) rotate(${-25 - f * 0.3})`}>
          <rect x={-45} y={-55} width={90} height={110} rx={12} fill="#F4F6FA" stroke="#101626" strokeWidth={8} />
          <path d="M 45 -30 C 85 -30, 85 30, 45 30" fill="none" stroke="#F4F6FA" strokeWidth={10} />
          {/* Frozen droplets */}
          {[
            [-70, -90, 16],
            [-120, -140, 22],
            [-40, -165, 14],
            [-165, -95, 18],
            [-95, -210, 12],
          ].map(([dx, dy, r], idx) => (
            <circle
              key={idx}
              cx={dx + Math.sin(f * 0.05 + idx) * 4}
              cy={dy + Math.cos(f * 0.05 + idx) * 4}
              r={r}
              fill="#D97706"
              stroke="#FDE68A"
              strokeWidth={3}
            />
          ))}
        </g>

        {/* HUD Lock Box on Floating Cup */}
        <g transform={`translate(${210 - f * 0.4}, ${490 - f * 0.5})`}>
          <rect x={-90} y={-90} width={180} height={180} fill="none" stroke="#00F0FF" strokeWidth={3} strokeDasharray="20 10" />
          <text x={105} y={-40} fill="#00F0FF" fontSize={24} fontFamily="monospace" fontWeight="bold">
            GRAVITY: FROZEN
          </text>
          <text x={105} y={-8} fill="#FFFFFF" fontSize={28} fontFamily="monospace" fontWeight="900">
            9.8 m/s² → 0.2
          </text>
        </g>

        <DetailedAtomStickman
          frame={f}
          x={620}
          y={1180}
          scale={1.45}
          rot={fallAngle}
          pose="falling"
          accent="#FF2D55"
        />
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 2 (3-6s): Camera Shutter Aperture & 24 FPS -> 240 FPS Overclock
const Shot02_FpsOverclock: React.FC = () => {
  const f = useCurrentFrame();
  const fpsValue = Math.floor(interpolate(f, [20, 130], [24, 240], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const isOverclock = f > 60;
  const accent = isOverclock ? '#00F0FF' : '#F59E0B';

  return (
    <AbsoluteFill>
      <CyberEnvironment accent={accent} shotIndex={2} title="VISUAL CORTEX FPS" metric={`${fpsValue} FPS`} />
      <svg width={W} height={H}>
        {/* Rotating Mechanical Camera Aperture */}
        <g transform="translate(540, 790)">
          <circle cx={0} cy={0} r={340} fill="#0B101D" stroke={accent} strokeWidth={8} />
          <circle cx={0} cy={0} r={285} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeDasharray="12 18" transform={`rotate(${f * 2})`} />

          {/* 8 Aperture Blades */}
          {Array.from({ length: 8 }).map((_, i) => {
            const bladeRot = i * 45 + interpolate(f, [0, 90], [0, 32], { extrapolateRight: 'clamp' });
            return (
              <g key={i} transform={`rotate(${bladeRot})`}>
                <path d="M 90 -40 L 270 -110 L 270 30 Z" fill="rgba(20,30,48,0.9)" stroke={accent} strokeWidth={3} />
              </g>
            );
          })}

          {/* Center FPS DigitRoll Readout */}
          <text x={0} y={20} textAnchor="middle" fill="#FFFFFF" fontSize={125} fontFamily="monospace" fontWeight="900">
            {fpsValue}
          </text>
          <text x={0} y={75} textAnchor="middle" fill={accent} fontSize={32} fontFamily="monospace" fontWeight="bold" letterSpacing={6}>
            {isOverclock ? 'OVERCLOCK ACTIVE' : 'NORMAL FPS'}
          </text>
        </g>

        <DetailedAtomStickman frame={f} x={540} y={1460} scale={1.15} pose="hyperfocus" accent={accent} />
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 3 (6-9s): 3D Neural Brain & Amygdala Hijack Radar
const Shot03_AmygdalaHijack: React.FC = () => {
  const f = useCurrentFrame();
  const rotY = f * 0.035;
  const pulse = Math.sin(f * 0.35) * 0.5 + 0.5;

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#FF2D55" shotIndex={3} title="AMYGDALA HIJACK" metric="LATENCY: 12ms" />
      <svg width={W} height={H}>
        <g transform="translate(540, 820)">
          {/* Radar Sweep Rings */}
          {[160, 280, 400].map((r, i) => (
            <circle key={i} cx={0} cy={0} r={r} fill="none" stroke="#FF2D55" strokeWidth={2} strokeDasharray="24 14" opacity={0.35} />
          ))}
          <line
            x1={0}
            y1={0}
            x2={Math.cos(f * 0.12) * 400}
            y2={Math.sin(f * 0.12) * 400}
            stroke="#FF2D55"
            strokeWidth={6}
            opacity={0.75}
          />

          {/* 95-Node 3D Point-Cloud Brain */}
          {Array.from({ length: 95 }).map((_, i) => {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / 95);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const rawX = Math.sin(phi) * Math.cos(theta);
            const x3d = rawX * 280 + (rawX >= 0 ? 35 : -35);
            const y3d = Math.cos(phi) * 210;
            const z3d = Math.sin(phi) * Math.sin(theta) * 310;

            const rx = x3d * Math.cos(rotY) - z3d * Math.sin(rotY);
            const rz = x3d * Math.sin(rotY) + z3d * Math.cos(rotY);
            const scale3d = 900 / (900 - rz);

            return (
              <g key={i}>
                <line x1={0} y1={20} x2={rx * scale3d} y2={y3d * scale3d} stroke="#00F0FF" strokeWidth={1.2} opacity={0.2} />
                <circle cx={rx * scale3d} cy={y3d * scale3d} r={5.5 * scale3d} fill="#00F0FF" opacity={0.75 * scale3d} />
              </g>
            );
          })}

          {/* Glowing Red Amygdala Core Inside Brain */}
          <circle cx={0} cy={20} r={55 + pulse * 25} fill="rgba(255,45,85,0.35)" />
          <circle cx={0} cy={20} r={34} fill="#FF2D55" stroke="#FFFFFF" strokeWidth={5} />

          {/* Callout Banner */}
          <g transform="translate(0, 340)">
            <rect x={-320} y={-45} width={640} height={90} rx={16} fill="rgba(255,45,85,0.2)" stroke="#FF2D55" strokeWidth={4} />
            <text x={0} y={12} textAnchor="middle" fill="#FFFFFF" fontSize={40} fontFamily="monospace" fontWeight="900">
              ⚠️ AMYGDALA ALARM TRIGGERED
            </text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 4 (9-12s): Circuit Board Breaker (Logic OFF -> Survival ON)
const Shot04_CircuitBreaker: React.FC = () => {
  const f = useCurrentFrame();
  const switched = f >= 55;
  const switchSpring = spring({ frame: f - 55, fps: FPS, config: { damping: 12, stiffness: 220 } });

  return (
    <AbsoluteFill>
      <CyberEnvironment accent={switched ? '#00F0FF' : '#FF9500'} shotIndex={4} title="NEURAL ROUTING" metric={switched ? 'SURVIVAL: ON' : 'ROUTING...'} />
      <svg width={W} height={H}>
        {/* Copper PCB Circuit Traces */}
        {Array.from({ length: 12 }).map((_, i) => {
          const y = 300 + i * 95;
          const activeColor = switched ? '#00F0FF' : '#FF3B30';
          return (
            <g key={i}>
              <path
                d={`M 80 ${y} L 340 ${y} L 420 ${y + 45} L 1000 ${y + 45}`}
                fill="none"
                stroke={activeColor}
                strokeWidth={5}
                opacity={0.35}
              />
              <circle
                cx={interpolate((f * 8 + i * 90) % 920, [0, 920], [80, 1000])}
                cy={y + 22}
                r={8}
                fill={activeColor}
              />
            </g>
          );
        })}

        {/* Dual Heavy Industrial Neural Breakers */}
        <g transform="translate(120, 480)">
          {/* Panel 1: Prefrontal Logic */}
          <rect x={0} y={0} width={840} height={320} rx={24} fill="#0E1525" stroke={switched ? '#475569' : '#00F0FF'} strokeWidth={6} />
          <text x={50} y={95} fill="#94A3B8" fontSize={28} fontFamily="monospace" fontWeight="bold">
            MODULE 01 · PREFRONTAL CORTEX
          </text>
          <text x={50} y={165} fill="#FFFFFF" fontSize={52} fontFamily="sans-serif" fontWeight="900">
            LOGICAL THINKING
          </text>
          <rect x={560} y={90} width={220} height={130} rx={20} fill={switched ? '#FF2D55' : '#10B981'} />
          <text x={670} y={172} textAnchor="middle" fill="#FFFFFF" fontSize={48} fontFamily="monospace" fontWeight="900">
            {switched ? 'OFF' : 'ON'}
          </text>
        </g>

        <g transform={`translate(120, 880) scale(${1 + switchSpring * 0.04})`}>
          {/* Panel 2: Hindbrain Reflex */}
          <rect x={0} y={0} width={840} height={320} rx={24} fill="#0E1525" stroke={switched ? '#00F0FF' : '#475569'} strokeWidth={6} />
          <text x={50} y={95} fill="#00F0FF" fontSize={28} fontFamily="monospace" fontWeight="bold">
            MODULE 02 · REFLEX OVERDRIVE
          </text>
          <text x={50} y={165} fill="#FFFFFF" fontSize={52} fontFamily="sans-serif" fontWeight="900">
            INSTANT SURVIVAL
          </text>
          <rect x={560} y={90} width={220} height={130} rx={20} fill={switched ? '#00F0FF' : '#334155'} />
          <text x={670} y={172} textAnchor="middle" fill="#05070B" fontSize={48} fontFamily="monospace" fontWeight="900">
            {switched ? 'MAX' : 'IDLE'}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 5 (12-15s): Adrenaline Bloodstream Blast & Pupil Dilation
const Shot05_AdrenalineSurge: React.FC = () => {
  const f = useCurrentFrame();
  const pupilSize = interpolate(f, [15, 110], [38, 118], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6)) });

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#F59E0B" shotIndex={5} title="EPINEPHRINE SURGE" metric="HEART: 185 BPM" />
      <svg width={W} height={H}>
        {/* High-Speed Adrenaline Molecules Shooting Upward */}
        {Array.from({ length: 32 }).map((_, i) => {
          const x = 90 + ((i * 89) % 900);
          const y = 1920 - ((f * (18 + (i % 9) * 3) + i * 140) % 2100);
          return (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <line x1={0} y1={0} x2={0} y2={95} stroke="#F59E0B" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
              <circle cx={0} cy={0} r={10} fill="#FEF08A" />
            </g>
          );
        })}

        {/* Extreme Close-Up Cybernetic Eye Dilating */}
        <g transform="translate(540, 780)">
          <circle cx={0} cy={0} r={290} fill="#FFFFFF" stroke="#F59E0B" strokeWidth={14} />
          {/* Iris Fibers */}
          <circle cx={0} cy={0} r={175} fill="#00F0FF" />
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={Math.cos((i * Math.PI) / 12) * 175}
              y2={Math.sin((i * Math.PI) / 12) * 175}
              stroke="#083344"
              strokeWidth={4}
            />
          ))}
          {/* Dilating Pupil */}
          <circle cx={0} cy={0} r={pupilSize} fill="#04060C" stroke="#FEF08A" strokeWidth={4} />
          <circle cx={-55} cy={-55} r={26} fill="#FFFFFF" opacity={0.85} />
        </g>

        <text x={540} y={1220} textAnchor="middle" fill="#FEF08A" fontSize={44} fontFamily="monospace" fontWeight="900">
          LIGHT INTAKE: +340%
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 6 (15-18s): Memory Snapshot Hyper-Stack (Video-Shotcraft 3D Cards)
const Shot06_MemoryHyperStack: React.FC = () => {
  const f = useCurrentFrame();
  const cardCount = Math.min(14, Math.floor(f / 8) + 1);

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#A855F7" shotIndex={6} title="MEMORY WRITE SPEED" metric="1,200 MB/SEC" />
      <svg width={W} height={H}>
        {/* 3D Isometric Stacking Memory Frames */}
        {Array.from({ length: cardCount }).map((_, i) => {
          const age = f - i * 8;
          const pop = clamp(age / 14);
          const yOffset = 1120 - i * 58;
          const xOffset = 540 + Math.sin(i * 0.6) * 25;

          return (
            <g
              key={i}
              transform={`translate(${xOffset}, ${yOffset}) scale(${0.75 + i * 0.022})`}
              opacity={0.25 + (i / 14) * 0.75}
            >
              <rect
                x={-340}
                y={-95}
                width={680}
                height={190}
                rx={18}
                fill="#111827"
                stroke={i === cardCount - 1 ? '#00F0FF' : '#A855F7'}
                strokeWidth={5}
              />
              <text x={-300} y={-25} fill="#00F0FF" fontSize={26} fontFamily="monospace" fontWeight="bold">
                {`SNAPSHOT_FRAME_00${i + 1}.RAW`}
              </text>
              <text x={-300} y={35} fill="#FFFFFF" fontSize={36} fontFamily="sans-serif" fontWeight="900">
                {`HIGH-RES SENSORY LOG #${1040 + i * 7}`}
              </text>
              <rect x={210} y={-45} width={95} height={90} rx={12} fill="#A855F7" opacity={pop} />
              <text x={257} y={15} textAnchor="middle" fill="#FFFFFF" fontSize={34} fontFamily="monospace" fontWeight="900">
                4K
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 7 (18-21s): Split-Screen Clock Paradox (Real Time vs Brain Time)
const Shot07_ClockParadox: React.FC = () => {
  const f = useCurrentFrame();
  const realSec = interpolate(f, [0, 180], [0, 0.5]).toFixed(2);
  const brainSec = interpolate(f, [0, 180], [0, 5.0]).toFixed(2);

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#00F0FF" shotIndex={7} title="TEMPORAL PARADOX" metric="RATIO: 1 : 10" />
      <svg width={W} height={H}>
        {/* Top Clock: Real World Time (Slow) */}
        <g transform="translate(540, 520)">
          <rect x={-420} y={-210} width={840} height={420} rx={28} fill="rgba(15,23,42,0.88)" stroke="#64748B" strokeWidth={5} />
          <text x={0} y={-115} textAnchor="middle" fill="#94A3B8" fontSize={32} fontFamily="monospace" fontWeight="bold">
            REAL WORLD CLOCK
          </text>
          <text x={0} y={45} textAnchor="middle" fill="#FFFFFF" fontSize={135} fontFamily="monospace" fontWeight="900">
            {`${realSec}s`}
          </text>
          <text x={0} y={135} textAnchor="middle" fill="#64748B" fontSize={28} fontFamily="monospace">
            ACTUAL ELAPSED TIME
          </text>
        </g>

        {/* Bottom Clock: Brain Perceived Time (10x Faster) */}
        <g transform="translate(540, 1060)">
          <rect x={-420} y={-210} width={840} height={420} rx={28} fill="rgba(8,28,44,0.92)" stroke="#00F0FF" strokeWidth={6} />
          <text x={0} y={-115} textAnchor="middle" fill="#00F0FF" fontSize={32} fontFamily="monospace" fontWeight="bold">
            BRAIN PERCEIVED CLOCK
          </text>
          <text x={0} y={45} textAnchor="middle" fill="#00F0FF" fontSize={135} fontFamily="monospace" fontWeight="900">
            {`${brainSec}s`}
          </text>
          <text x={0} y={135} textAnchor="middle" fill="#FFFFFF" fontSize={28} fontFamily="monospace" fontWeight="bold">
            10X SUBJECTIVE EXPANSION
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 8 (21-24s): Tachypsychia Reflex Catch (Laser Trajectory Lock)
const Shot08_ReflexCatch: React.FC = () => {
  const f = useCurrentFrame();
  const catchProgress = clamp(f / 95);
  const handReachX = interpolate(catchProgress, [0, 1], [480, 740], { easing: Easing.out(Easing.back(1.4)) });

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#10B981" shotIndex={8} title="TACHYPSYCHIA REFLEX" metric="LOCK ACQUIRED" />
      <svg width={W} height={H}>
        {/* Predictive Trajectory Parabola */}
        <path
          d="M 740 350 Q 750 680 740 940"
          fill="none"
          stroke="#10B981"
          strokeWidth={6}
          strokeDasharray="16 12"
        />

        {/* Falling Smartphone / Object Caught 2 Inches Above Ground */}
        <g transform={`translate(740, ${interpolate(catchProgress, [0, 1], [480, 910])}) rotate(${25 - catchProgress * 25})`}>
          <rect x={-45} y={-85} width={90} height={170} rx={16} fill="#0F172A" stroke="#10B981" strokeWidth={8} />
          <circle cx={0} cy={65} r={8} fill="#10B981" />
          {f > 90 && (
            <circle cx={0} cy={0} r={interpolate(f, [90, 140], [40, 220])} fill="none" stroke="#10B981" strokeWidth={6} opacity={interpolate(f, [90, 140], [1, 0])} />
          )}
        </g>

        <DetailedAtomStickman
          frame={f}
          x={handReachX - 240}
          y={1120}
          scale={1.4}
          rot={16}
          pose="catching"
          accent="#10B981"
        />
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 9 (24-27s): Superhero Landing & Energy Battery Drain
const Shot09_EnergyCrash: React.FC = () => {
  const f = useCurrentFrame();
  const battery = Math.floor(interpolate(f, [10, 140], [100, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const impactSquash = f < 30 ? Math.sin((f / 30) * Math.PI) * 0.35 : Math.sin(f * 0.25) * 0.06;

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#EF4444" shotIndex={9} title="ATP ENERGY DRAIN" metric={`BATTERY: ${battery}%`} />
      <svg width={W} height={H}>
        {/* Giant Battery Drain Bar */}
        <g transform="translate(140, 320)">
          <rect x={0} y={0} width={800} height={130} rx={20} fill="#0F172A" stroke="#EF4444" strokeWidth={6} />
          <rect
            x={16}
            y={16}
            width={(768 * battery) / 100}
            height={98}
            rx={12}
            fill={battery > 30 ? '#F59E0B' : '#EF4444'}
          />
          <text x={400} y={82} textAnchor="middle" fill="#FFFFFF" fontSize={48} fontFamily="monospace" fontWeight="900">
            {`NEURAL ENERGY: ${battery}%`}
          </text>
        </g>

        <DetailedAtomStickman
          frame={f}
          x={540}
          y={1220}
          scale={1.45}
          sq={impactSquash}
          pose="exhausted"
          accent="#EF4444"
        />
      </svg>
    </AbsoluteFill>
  );
};

// SHOT 10 (27-30s): Spotlight Hero Card & Subscribe Payoff
const Shot10_SpotlightOutro: React.FC = () => {
  const f = useCurrentFrame();
  const pop = spring({ frame: f, fps: FPS, config: { damping: 12, stiffness: 160 } });

  return (
    <AbsoluteFill>
      <CyberEnvironment accent="#00F0FF" shotIndex={10} title="SYSTEM ONLINE" metric="@ATOM_STICKMAN" />
      <svg width={W} height={H}>
        {/* Video-Shotcraft Dramatic Spotlight Cone */}
        <polygon points="540,0 120,1520 960,1520" fill="rgba(0, 240, 255, 0.08)" />
        <ellipse cx={540} cy={1420} rx={340} ry={65} fill="rgba(0, 240, 255, 0.18)" />

        {/* Brand Subscribe Badge */}
        <g transform={`translate(540, 360) scale(${pop})`}>
          <rect x={-380} y={-95} width={760} height={190} rx={30} fill="#0B1325" stroke="#00F0FF" strokeWidth={6} />
          <text x={0} y={-15} textAnchor="middle" fill="#00F0FF" fontSize={34} fontFamily="monospace" fontWeight="bold" letterSpacing={4}>
            DECODE YOUR BRAIN
          </text>
          <text x={0} y={52} textAnchor="middle" fill="#FFFFFF" fontSize={62} fontFamily="sans-serif" fontWeight="900">
            SUBSCRIBE · ATOM STICKMAN
          </text>
        </g>

        <DetailedAtomStickman frame={f} x={540} y={1180} scale={1.5} pose="hero" accent="#00F0FF" />
      </svg>
    </AbsoluteFill>
  );
};

// =========================================================
// 5. SUBTITLE & FLASH-CUT COMPOSITOR
// =========================================================

const SUBTITLES = [
  { shot: 0, text: 'Jab tum girne wale hote ho, toh TIME SLOW kyun ho jata hai?', hi: 'TIME SLOW', col: '#FF2D55' },
  { shot: 1, text: 'Normal time pe brain duniya ko 24 FPS pe process karta hai...', hi: '24 FPS', col: '#00F0FF' },
  { shot: 2, text: 'Par khatre mein AMYGDALA pure brain ko hijack kar leta hai!', hi: 'AMYGDALA', col: '#FF2D55' },
  { shot: 3, text: 'Slow logic SHUT DOWN karke, instant survival mode on hota hai.', hi: 'SHUT DOWN', col: '#00F0FF' },
  { shot: 4, text: 'Blood mein ADRENALINE blast hota hai aur pupils khul jaate hain!', hi: 'ADRENALINE', col: '#F59E0B' },
  { shot: 5, text: 'Brain har second 10 GUNA ZYADA memory snapshots save karta hai!', hi: '10 GUNA ZYADA', col: '#A855F7' },
  { shot: 6, text: 'Waqt slow nahi hota... 1 second 5 SECOND jaisa mehsus hota hai!', hi: '5 SECOND', col: '#00F0FF' },
  { shot: 7, text: 'Is biological superpower ko TACHYPSYCHIA kehte hain!', hi: 'TACHYPSYCHIA', col: '#10B981' },
  { shot: 8, text: 'Khatra talte hi brain ki saari ENERGY DRAIN ho jati hai.', hi: 'ENERGY DRAIN', col: '#EF4444' },
  { shot: 9, text: 'Aise hi mind-blowing science ke liye ATOM STICKMAN ko subscribe karo!', hi: 'ATOM STICKMAN', col: '#00F0FF' },
];

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const shotIdx = Math.min(9, Math.floor(frame / 180));
  const frameInShot = frame % 180;
  const sub = SUBTITLES[shotIdx];

  const subPop = spring({
    frame: frameInShot,
    fps: FPS,
    config: { damping: 13, stiffness: 240 },
  });

  // Video-Shotcraft FlashCut transition on every 3-second seam
  const flashOpacity = frameInShot < 6 ? interpolate(frameInShot, [0, 6], [0.75, 0]) : 0;

  const shots = [
    Shot01_SlowMoSlip,
    Shot02_FpsOverclock,
    Shot03_AmygdalaHijack,
    Shot04_CircuitBreaker,
    Shot05_AdrenalineSurge,
    Shot06_MemoryHyperStack,
    Shot07_ClockParadox,
    Shot08_ReflexCatch,
    Shot09_EnergyCrash,
    Shot10_SpotlightOutro,
  ];

  const parts = sub.text.split(sub.hi);

  return (
    <AbsoluteFill style={{ backgroundColor: '#030408' }}>
      {/* Uncomment when adding public/voice.mp3 */}
      {/* <Audio src={staticFile('voice.mp3')} /> */}

      {shots.map((ShotComponent, idx) => (
        <Sequence key={idx} from={idx * 180} durationInFrames={180}>
          <ShotComponent />
        </Sequence>
      ))}

      {/* High-Retention Subtitle Card */}
      <div
        style={{
          position: 'absolute',
          bottom: 155,
          left: 55,
          right: 55,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${interpolate(subPop, [0, 1], [0.82, 1])})`,
        }}
      >
        <div
          style={{
            background: 'rgba(6, 10, 20, 0.94)',
            border: `4px solid ${sub.col}`,
            borderRadius: 26,
            padding: '26px 38px',
            boxShadow: `0 18px 45px rgba(0,0,0,0.85), 0 0 35px ${sub.col}55`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 46,
              fontWeight: 900,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1.25,
            }}
          >
            {parts[0]}
            <span style={{ color: sub.col, textDecoration: 'underline' }}>{sub.hi}</span>
            {parts[1] || ''}
          </span>
        </div>
      </div>

      {/* Seam FlashCut */}
      {flashOpacity > 0 && (
        <AbsoluteFill style={{ backgroundColor: sub.col, opacity: flashOpacity, pointerEvents: 'none' }} />
      )}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
  </>
);

export default RemotionRoot;
