import React from 'react';
import {
  AbsoluteFill,
  Composition,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  // Audio, staticFile // Uncomment when you add public/voice.mp3
} from 'remotion';

// ==========================================
// 1. DETERMINISTIC ENGINE & HELPERS
// (Lemo-Opuscar + Claude Animation + Shotcraft)
// ==========================================

// Deterministic hash (no Math.random())
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// Boiling seed: steps at 12 fps (every 2.5 frames at 30fps)
function boilJitter(frame: number, key: number, amp: number): number {
  const boilStep = Math.floor(frame / 2.5);
  return (hash(boilStep * 97.3 + key * 31.7) - 0.5) * 2 * amp;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = clamp(x);
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

// Master Beat Grid: 128 BPM
const BPM = 128;
function beatPulse(frame: number, fps: number, decay = 6): number {
  const sec = frame / fps;
  const beatPos = (sec * (BPM / 60)) % 1;
  return Math.exp(-beatPos * decay);
}

// ==========================================
// 2. MASTER TIMELINE & SUBTITLES
// ==========================================

interface SubtitleCue {
  t0: number;
  t1: number;
  text: string;
  highlight: string;
  accent: string;
}

const SUBTITLES: SubtitleCue[] = [
  { t0: 0.2, t1: 3.0, text: 'Socho agar tum aaj raat NA SOYO...', highlight: 'NA SOYO...', accent: '#FF3B30' },
  { t0: 3.1, t1: 7.2, text: 'Sirf 24 HOURS without sleep...', highlight: '24 HOURS', accent: '#00F0FF' },
  { t0: 7.3, t1: 12.0, text: 'Dimaag DRUNKEN STATE mein chala jayega!', highlight: 'DRUNKEN STATE', accent: '#FF9500' },
  { t0: 12.2, t1: 18.0, text: '48 Hours: MICROSLEEPS shuru.', highlight: 'MICROSLEEPS', accent: '#FF3B30' },
  { t0: 18.1, t1: 24.8, text: 'Brain 4 second ke liye SHUT DOWN ho jayega.', highlight: 'SHUT DOWN', accent: '#FF2D55' },
  { t0: 25.0, t1: 30.5, text: '72 Hours: Dark HALLUCINATIONS.', highlight: 'HALLUCINATIONS.', accent: '#BF5AF2' },
  { t0: 30.6, t1: 35.0, text: 'Shadows MONSTERS ban jayengi.', highlight: 'MONSTERS', accent: '#FF3B30' },
  { t0: 35.2, t1: 40.5, text: 'Aur 11 DAYS baad? Complete system failure.', highlight: '11 DAYS', accent: '#FF3B30' },
  { t0: 40.6, t1: 44.5, text: 'Video band karo, chup-chaap SO JAO!', highlight: 'SO JAO!', accent: '#30D158' },
];

// ==========================================
// 3. REUSABLE VISUAL COMPONENTS
// ==========================================

const AtomStickman: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale?: number;
  sq?: number;
  dy?: number;
  mood: 'tired' | 'dizzy' | 'shock' | 'scared' | 'collapsed';
  inkColor?: string;
}> = ({ frame, x, y, scale = 1, sq = 0, dy = 0, mood, inkColor = '#F4F1EA' }) => {
  const j = (k: number, a = 3) => boilJitter(frame, k, a);
  const sx = scale * (1 + sq * 0.35);
  const sy = scale * (1 - sq * 0.35);

  const isCollapsed = mood === 'collapsed';
  const rot = isCollapsed ? 82 : mood === 'scared' ? -8 + j(90, 2) : j(91, 1.2);

  const headX = j(1, 2.5);
  const headY = -220 + j(2, 2.5);

  return (
    <g transform={`translate(${x}, ${y + dy}) rotate(${rot}) scale(${sx}, ${sy})`}>
      {/* Ground Shadow */}
      <ellipse
        cx={0}
        cy={140}
        rx={95 * (1 + sq * 0.3)}
        ry={22}
        fill="rgba(0,0,0,0.55)"
      />

      {/* Atomic Orbit Rings around torso */}
      <ellipse
        cx={j(3, 2)}
        cy={-70 + j(4, 2)}
        rx={95}
        ry={34}
        fill="none"
        stroke="#00F0FF"
        strokeWidth={4}
        strokeDasharray="14 8"
        opacity={0.45}
        transform={`rotate(${25 + frame * 2})`}
      />
      <ellipse
        cx={j(5, 2)}
        cy={-70 + j(6, 2)}
        rx={95}
        ry={34}
        fill="none"
        stroke="#FF3B30"
        strokeWidth={4}
        opacity={0.35}
        transform={`rotate(${-25 - frame * 2})`}
      />

      {/* Torso */}
      <path
        d={`M ${headX} ${headY + 75} Q ${j(10, 8)} ${-60 + j(11, 5)} ${j(12, 3)} ${20 + j(13, 3)}`}
        stroke={inkColor}
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />

      {/* Legs */}
      <path
        d={`M ${j(12, 3)} ${20} Q ${-45 + j(14, 5)} ${80} ${-55 + j(15, 4)} ${135}`}
        stroke={inkColor}
        strokeWidth={13}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${j(12, 3)} ${20} Q ${45 + j(16, 5)} ${80} ${55 + j(17, 4)} ${135}`}
        stroke={inkColor}
        strokeWidth={13}
        strokeLinecap="round"
        fill="none"
      />

      {/* Arms */}
      {mood === 'scared' ? (
        <>
          <path
            d={`M 0 -115 Q ${-95 + j(20, 6)} -140 ${-65 + j(21, 6)} -210`}
            stroke={inkColor}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M 0 -115 Q ${95 + j(22, 6)} -140 ${65 + j(23, 6)} -210`}
            stroke={inkColor}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <path
            d={`M 0 -115 Q ${-70 + j(24, 5)} -60 ${-85 + j(25, 5)} 5`}
            stroke={inkColor}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M 0 -115 Q ${70 + j(26, 5)} -60 ${85 + j(27, 5)} 5`}
            stroke={inkColor}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}

      {/* Head */}
      <circle
        cx={headX}
        cy={headY}
        r={76 + j(30, 1.8)}
        fill="#161922"
        stroke={inkColor}
        strokeWidth={12}
      />

      {/* Eyes */}
      {mood === 'collapsed' ? (
        <g stroke="#FF3B30" strokeWidth={8} strokeLinecap="round">
          <line x1={headX - 38} y1={headY - 18} x2={headX - 14} y2={headY + 6} />
          <line x1={headX - 14} y1={headY - 18} x2={headX - 38} y2={headY + 6} />
          <line x1={headX + 14} y1={headY - 18} x2={headX + 38} y2={headY + 6} />
          <line x1={headX + 38} y1={headY - 18} x2={headX + 14} y2={headY + 6} />
        </g>
      ) : (
        <g>
          <circle cx={headX - 26 + j(40, 1.5)} cy={headY - 8} r={mood === 'scared' ? 22 : 17} fill="#FFE5E5" />
          <circle cx={headX - 26 + j(41, 2)} cy={headY - 8} r={mood === 'scared' ? 6 : 8} fill="#FF2D55" />
          <path
            d={`M ${headX - 44} ${headY + 14} Q ${headX - 26} ${headY + 26} ${headX - 8} ${headY + 14}`}
            stroke="#FF3B30"
            strokeWidth={4}
            fill="none"
            opacity={0.8}
          />

          <circle cx={headX + 26 + j(42, 1.5)} cy={headY - 8} r={mood === 'scared' ? 22 : 17} fill="#FFE5E5" />
          <circle cx={headX + 26 + j(43, 2)} cy={headY - 8} r={mood === 'scared' ? 6 : 8} fill="#FF2D55" />
          <path
            d={`M ${headX + 8} ${headY + 14} Q ${headX + 26} ${headY + 26} ${headX + 44} ${headY + 14}`}
            stroke="#FF3B30"
            strokeWidth={4}
            fill="none"
            opacity={0.8}
          />
        </g>
      )}

      {/* Mouth */}
      {mood === 'scared' || mood === 'shock' ? (
        <ellipse
          cx={headX + j(50, 2)}
          cy={headY + 36}
          rx={18}
          ry={24}
          fill="#FF2D55"
          stroke={inkColor}
          strokeWidth={5}
        />
      ) : (
        <path
          d={`M ${headX - 22} ${headY + 38} Q ${headX} ${headY + 28 + j(51, 3)} ${headX + 22} ${headY + 38}`}
          stroke={inkColor}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
};

const HourCounterBadge: React.FC<{ hours: number; label: string; color: string }> = ({
  hours,
  label,
  color,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 90,
        left: 70,
        padding: '18px 34px',
        background: 'rgba(10, 14, 24, 0.85)',
        border: `3px solid ${color}`,
        borderRadius: 20,
        boxShadow: `0 0 35px ${color}55`,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 16px ${color}`,
        }}
      />
      <div>
        <div style={{ color: '#9BA3B0', fontSize: 22, letterSpacing: 3, fontWeight: 700 }}>
          {label}
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 54, fontWeight: 900, letterSpacing: 2 }}>
          {String(Math.floor(hours)).padStart(2, '0')} HRS AWAKE
        </div>
      </div>
    </div>
  );
};

const BrushWipeOverlay: React.FC<{ progress: number; color?: string }> = ({
  progress,
  color = '#07090E',
}) => {
  if (progress <= 0 || progress >= 1) return null;
  const bands = 7;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, zIndex: 90 }}>
      {Array.from({ length: bands }).map((_, i) => {
        const delay = i * 0.04;
        const p = clamp((progress - delay) / (1 - bands * 0.04));
        const xStart =
          p < 0.5
            ? interpolate(p, [0, 0.5], [-1200, -50])
            : interpolate(p, [0.5, 1], [-50, 1200]);
        const y = i * (1920 / bands);
        return (
          <rect
            key={i}
            x={xStart}
            y={y - 20}
            width={1300}
            height={1920 / bands + 45}
            rx={40}
            fill={color}
          />
        );
      })}
    </svg>
  );
};

// ==========================================
// 4. MAIN VIDEO COMPONENT (ALL 5 SCENES)
// ==========================================

export const NeverSleepVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const pulse = beatPulse(frame, fps);

  const camX = Math.sin(sec * 1.8) * 10;
  const camY = Math.cos(sec * 2.3) * 10;

  const wipe1 = sec > 2.75 && sec < 3.35 ? (sec - 2.75) / 0.6 : 0;
  const wipe2 = sec > 24.7 && sec < 25.3 ? (sec - 24.7) / 0.6 : 0;

  const activeSub = SUBTITLES.find((s) => sec >= s.t0 && sec <= s.t1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07090F',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Uncomment when you upload public/voice.mp3 */}
      {/* <Audio src={staticFile('voice.mp3')} /> */}

      {/* Background Subtle Grid */}
      <svg width={1080} height={1920} style={{ position: 'absolute', opacity: 0.14 }}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#00F0FF" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#grid)" />
      </svg>

      {/* SCENE 1: THE HOOK (0s - 3s) */}
      {sec < 3.05 && (
        <AbsoluteFill
          style={{
            transform: `translate(${camX}px, ${camY}px) scale(${interpolate(sec, [0, 3], [1, 1.12])})`,
          }}
        >
          <HourCounterBadge hours={0} label="EXPERIMENT START" color="#FF3B30" />

          <div
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              width: 750,
              height: 750,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,59,48,${0.22 + pulse * 0.2}) 0%, transparent 70%)`,
            }}
          />

          <svg width={1080} height={1920}>
            {(() => {
              const dropSpring = spring({
                frame: frame - 32,
                fps,
                config: { damping: 11, stiffness: 180 },
              });
              const clockY = interpolate(dropSpring, [0, 1], [-400, 620]);
              const impactSquash =
                frame >= 34 && frame <= 45 ? Math.sin(((frame - 34) / 11) * Math.PI) * 0.38 : 0;

              return (
                <>
                  {frame >= 28 && (
                    <g
                      transform={`translate(540, ${clockY}) rotate(${boilJitter(frame, 77, 8)}) scale(${1 + impactSquash * 0.25}, ${1 - impactSquash * 0.25})`}
                    >
                      <circle cx={0} cy={0} r={135} fill="#1C1F2B" stroke="#FF3B30" strokeWidth={14} />
                      <line x1={0} y1={0} x2={0} y2={-80} stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
                      <line
                        x1={0}
                        y1={0}
                        x2={65}
                        y2={20}
                        stroke="#FF3B30"
                        strokeWidth={10}
                        strokeLinecap="round"
                        transform={`rotate(${frame * 18})`}
                      />
                    </g>
                  )}

                  <AtomStickman
                    frame={frame}
                    x={540}
                    y={1280}
                    scale={1.45}
                    sq={impactSquash}
                    dy={impactSquash * 55}
                    mood={frame > 34 ? 'shock' : 'tired'}
                  />
                </>
              );
            })()}
          </svg>
        </AbsoluteFill>
      )}

      {/* SCENE 2: 24 HOURS - 3D HOLOGRAM BRAIN HUD (3s - 12s) */}
      {sec >= 3.05 && sec < 12.1 && (
        <AbsoluteFill>
          <HourCounterBadge
            hours={interpolate(sec, [3.1, 5.5], [1, 24], { extrapolateRight: 'clamp' })}
            label="COGNITIVE DECLINE"
            color="#00F0FF"
          />

          <svg width={1080} height={1920}>
            <g transform="translate(540, 780)">
              {[180, 290, 380].map((r, idx) => (
                <ellipse
                  key={idx}
                  cx={0}
                  cy={190 + idx * 25}
                  rx={r}
                  ry={r * 0.26}
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth={idx === 1 ? 4 : 2}
                  strokeDasharray={idx % 2 === 0 ? '18 12' : '40 15'}
                  opacity={0.45}
                  transform={`rotate(${(idx % 2 === 0 ? 1 : -1) * frame * 0.8})`}
                />
              ))}

              {Array.from({ length: 75 }).map((_, i) => {
                const phi = Math.acos(1 - (2 * (i + 0.5)) / 75);
                const theta = Math.PI * (1 + Math.sqrt(5)) * i;
                const rotY = sec * 1.3;

                const rawX = Math.sin(phi) * Math.cos(theta);
                const hemiOffset = rawX >= 0 ? 35 : -35;
                const x3d = rawX * 230 + hemiOffset;
                const y3d = Math.cos(phi) * 175;
                const z3d = Math.sin(phi) * Math.sin(theta) * 260;

                const rx = x3d * Math.cos(rotY) - z3d * Math.sin(rotY);
                const rz = x3d * Math.sin(rotY) + z3d * Math.cos(rotY);
                const depthScale = 900 / (900 - rz);

                const sx = rx * depthScale;
                const sy = y3d * depthScale;
                const isAlertNode = i % 7 === 0 && sec > 6.5;

                return (
                  <g key={i}>
                    <line
                      x1={0}
                      y1={0}
                      x2={sx}
                      y2={sy}
                      stroke={isAlertNode ? '#FF3B30' : '#00F0FF'}
                      strokeWidth={1.2}
                      opacity={0.22 * depthScale}
                    />
                    <circle
                      cx={sx}
                      cy={sy}
                      r={(isAlertNode ? 9 : 5.5) * depthScale}
                      fill={isAlertNode ? '#FF3B30' : '#00F0FF'}
                      opacity={clamp(depthScale * 0.85, 0.2, 1)}
                    />
                  </g>
                );
              })}

              {sec > 5.2 && (
                <g transform={`translate(140, -120) scale(${easeOutBack((sec - 5.2) * 2)})`}>
                  <rect
                    x={-55}
                    y={-55}
                    width={110}
                    height={110}
                    fill="none"
                    stroke="#FF9500"
                    strokeWidth={4}
                    strokeDasharray="25 15"
                  />
                  <line x1={55} y1={-55} x2={135} y2={-115} stroke="#FF9500" strokeWidth={4} />
                  <rect
                    x={135}
                    y={-165}
                    width={295}
                    height={95}
                    rx={12}
                    fill="rgba(255,149,0,0.18)"
                    stroke="#FF9500"
                    strokeWidth={3}
                  />
                  <text x={155} y={-125} fill="#FF9500" fontSize={22} fontFamily="monospace" fontWeight="bold">
                    BAC EQUIVALENT
                  </text>
                  <text x={155} y={-88} fill="#FFFFFF" fontSize={34} fontFamily="monospace" fontWeight="900">
                    0.10% DRUNK
                  </text>
                </g>
              )}
            </g>

            <AtomStickman
              frame={frame}
              x={540 + Math.sin(sec * 4) * 35}
              y={1420}
              scale={1.1}
              sq={Math.sin(sec * 5) * 0.08}
              mood="dizzy"
            />
          </svg>
        </AbsoluteFill>
      )}

      {/* SCENE 3: 48 HOURS - MICROSLEEP GLITCH (12.1s - 25s) */}
      {sec >= 12.1 && sec < 25.0 && (
        <AbsoluteFill>
          {(() => {
            const isBlackout =
              (sec > 15.0 && sec < 15.25) ||
              (sec > 18.2 && sec < 20.6) ||
              (sec > 22.0 && sec < 22.2);

            if (isBlackout) {
              return (
                <AbsoluteFill
                  style={{
                    backgroundColor: '#000000',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      color: '#FF2D55',
                      fontSize: 56,
                      fontFamily: 'monospace',
                      fontWeight: 900,
                      letterSpacing: 6,
                      border: '4px solid #FF2D55',
                      padding: '24px 48px',
                      boxShadow: '0 0 50px rgba(255, 45, 85, 0.5)',
                    }}
                  >
                    [BRAIN OFFLINE: 04.0s]
                  </div>
                </AbsoluteFill>
              );
            }

            return (
              <AbsoluteFill>
                <HourCounterBadge
                  hours={interpolate(sec, [12.1, 14.5], [24, 48], { extrapolateRight: 'clamp' })}
                  label="MICROSLEEP WARNING"
                  color="#FF2D55"
                />

                {Array.from({ length: 6 }).map((_, idx) => {
                  const yPos = hash(Math.floor(frame / 2) * 19 + idx) * 1920;
                  const showBar = pulse > 0.65;
                  if (!showBar) return null;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        top: yPos,
                        left: 0,
                        width: '100%',
                        height: 28,
                        backgroundColor:
                          idx % 2 === 0 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(255, 45, 85, 0.35)',
                      }}
                    />
                  );
                })}

                <svg width={1080} height={1920}>
                  <AtomStickman
                    frame={frame}
                    x={540 + boilJitter(frame, 88, 14)}
                    y={1180}
                    scale={1.55}
                    sq={pulse * 0.22}
                    mood="shock"
                  />
                </svg>
              </AbsoluteFill>
            );
          })()}
        </AbsoluteFill>
      )}

      {/* SCENE 4: 72 HOURS - HALLUCINATIONS (25s - 35s) */}
      {sec >= 25.0 && sec < 35.1 && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle at 50% 60%, #1A0B2E 0%, #050508 80%)',
          }}
        >
          <HourCounterBadge
            hours={interpolate(sec, [25.0, 27.5], [48, 72], { extrapolateRight: 'clamp' })}
            label="REALITY BREAKDOWN"
            color="#BF5AF2"
          />

          <svg width={1080} height={1920}>
            {[-320, 320].map((sideX, idx) => {
              const creepIn = interpolate(sec, [25.2, 34.5], [0.6, 1.25], {
                extrapolateRight: 'clamp',
              });
              const mx = 540 + sideX * (1.5 - creepIn * 0.45) + boilJitter(frame, idx * 10 + 1, 12);
              const my = 720 + Math.sin(sec * 3 + idx) * 40;
              return (
                <g key={idx} transform={`translate(${mx}, ${my}) scale(${creepIn})`}>
                  <ellipse
                    cx={0}
                    cy={0}
                    rx={170 + boilJitter(frame, idx + 20, 18)}
                    ry={340 + boilJitter(frame, idx + 30, 22)}
                    fill="rgba(12, 5, 22, 0.9)"
                    stroke="#BF5AF2"
                    strokeWidth={5}
                  />
                  <circle cx={-45} cy={-90} r={18} fill="#FF3B30" />
                  <circle cx={45} cy={-90} r={18} fill="#FF3B30" />
                </g>
              );
            })}

            <AtomStickman
              frame={frame}
              x={540}
              y={1350}
              scale={1.35}
              sq={Math.sin(frame * 0.8) * 0.12}
              mood="scared"
            />
          </svg>
        </AbsoluteFill>
      )}

      {/* SCENE 5: 11 DAYS PAYOFF & SPOTLIGHT OUTRO (35.1s - 45s) */}
      {sec >= 35.1 && (
        <AbsoluteFill style={{ backgroundColor: '#040507' }}>
          <HourCounterBadge
            hours={interpolate(sec, [35.1, 37.5], [72, 264], { extrapolateRight: 'clamp' })}
            label="FATAL THRESHOLD (11 DAYS)"
            color="#FF3B30"
          />

          <svg width={1080} height={1920}>
            <polygon points="540,0 160,1550 920,1550" fill="rgba(255, 255, 255, 0.07)" />
            <ellipse cx={540} cy={1450} rx={360} ry={70} fill="rgba(255, 255, 255, 0.12)" />

            {(() => {
              const progress = clamp((sec - 35.5) / 6.5);
              const endX = interpolate(progress, [0, 1], [80, 1000]);
              return (
                <g>
                  <path
                    d="M 80 650 L 260 650 L 300 520 L 345 810 L 390 460 L 435 760 L 470 650 L 1000 650"
                    fill="none"
                    stroke="#FF3B30"
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={1200}
                    strokeDashoffset={1200 * (1 - progress)}
                  />
                  <circle cx={endX} cy={650} r={16} fill="#FF3B30" />
                </g>
              );
            })()}

            <AtomStickman frame={frame} x={520} y={1360} scale={1.3} mood="collapsed" />
          </svg>
        </AbsoluteFill>
      )}

      {/* BURNED-IN HIGH-RETENTION SUBTITLES */}
      {activeSub && (
        <div
          style={{
            position: 'absolute',
            bottom: 240,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0 60px',
            zIndex: 80,
          }}
        >
          {(() => {
            const subPop = spring({
              frame: Math.max(0, Math.floor((sec - activeSub.t0) * fps)),
              fps,
              config: { damping: 12, stiffness: 220 },
            });
            const parts = activeSub.text.split(activeSub.highlight);

            return (
              <div
                style={{
                  transform: `scale(${interpolate(subPop, [0, 1], [0.75, 1])})`,
                  background: 'rgba(8, 10, 18, 0.92)',
                  border: `3px solid ${activeSub.accent}`,
                  borderRadius: 28,
                  padding: '28px 42px',
                  textAlign: 'center',
                  boxShadow: `0 18px 50px rgba(0,0,0,0.85), 0 0 30px ${activeSub.accent}44`,
                }}
              >
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: 52,
                    fontWeight: 900,
                    lineHeight: 1.25,
                  }}
                >
                  {parts[0]}
                  <span
                    style={{
                      color: activeSub.accent,
                      textDecoration: 'underline',
                      textShadow: `0 0 24px ${activeSub.accent}`,
                    }}
                  >
                    {activeSub.highlight}
                  </span>
                  {parts[1] || ''}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* BrushWipe Transitions */}
      <BrushWipeOverlay progress={wipe1} color="#00F0FF" />
      <BrushWipeOverlay progress={wipe2} color="#BF5AF2" />
    </AbsoluteFill>
  );
};

// ==========================================
// 5. REMOTION ROOT REGISTRATION
// ==========================================

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NeverSleepShorts"
        component={NeverSleepVideo}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Fallback IDs so your existing GitHub Actions workflow finds it automatically */}
      <Composition
        id="MyComp"
        component={NeverSleepVideo}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Main"
        component={NeverSleepVideo}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

export default RemotionRoot;
