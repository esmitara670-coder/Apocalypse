import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  // Audio, Sequence, staticFile // Uncomment when adding public/voice.mp3
} from 'remotion';

// ============================================================================
// 1. MASTER TIMELINE & AUDIO CHUNK SYNC CONFIG
// Audio Order:
// 1: studio_voice.wav[span_6](start_span)[span_6](end_span)
// 2: studio_voice (1).wav[span_7](start_span)[span_7](end_span)
// 3: studio_voice (2).wav[span_8](start_span)[span_8](end_span)
// 4: studio_voice (3).wav[span_9](start_span)[span_9](end_span)
// 5: studio_voice (4).wav[span_10](start_span)[span_10](end_span)
// 6: studio_voice (5).wav[span_11](start_span)[span_11](end_span)
// ============================================================================

const FPS = 60;
const W = 1080;
const H = 1920;

const CHUNK_DURATIONS_SEC = [24, 24, 24, 24, 24, 24];

const CHUNK_START_SEC = CHUNK_DURATIONS_SEC.reduce<number[]>((acc, _, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + CHUNK_DURATIONS_SEC[i - 1]);
  return acc;
}, []);

const TOTAL_SECONDS = CHUNK_DURATIONS_SEC.reduce((a, b) => a + b, 0);
const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);

// ============================================================================
// 2. DETERMINISTIC MATH & 3D PROJECTION ENGINE
// ============================================================================

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function project3D(
  x: number,
  y: number,
  z: number,
  rotX: number,
  rotY: number,
  fov = 950
): { sx: number; sy: number; scale: number; z: number } {
  const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
  const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
  const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
  const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
  const scale = fov / Math.max(180, fov - z2);
  return { sx: x1 * scale, sy: y2 * scale, scale, z: z2 };
}

// ============================================================================
// 3. 18 CINEMATIC CALLOUT SCENES (3 DEEP CALLOUTS PER AUDIO CHUNK)
// ============================================================================

interface CalloutSceneMeta {
  chunk: number;
  stage: number; // 0, 1, 2 within each chunk (8 seconds each)
  code: string;
  macroTitle: string;
  calloutTitle: string;
  calloutSub: string;
  zoomBadge: string;
  accent: string;
  secondary: string;
  subtitle: string;
  highlight: string;
}

const SCENES: CalloutSceneMeta[] = [
  // CHUNK 1: SIMULATION THEORY & NEURAL REALITY[span_12](start_span)[span_12](end_span)
  {
    chunk: 0,
    stage: 0,
    code: 'SYS.01 // CORTEX_DECODE',
    macroTitle: 'GLOBAL CONSCIOUSNESS MATRIX',
    calloutTitle: 'SYNAPTIC CELLULAR INTERFACE',
    calloutSub: 'NEURAL CELLS → BINARY PACKETS',
    zoomBadge: 'MAGNIFICATION: 4,500x',
    accent: '#00F0FF',
    secondary: '#3B82F6',
    subtitle: 'क्या आपकी पूरी ज़िंदगी और यह दुनिया सिर्फ़ एक COMPUTER PROGRAM हो सकती है?',
    highlight: 'COMPUTER PROGRAM',
  },
  {
    chunk: 0,
    stage: 1,
    code: 'SYS.02 // BOSTROM_ODDS',
    macroTitle: 'ASTROPHYSICAL SIMULATION GRID',
    calloutTitle: 'BASE REALITY PROBABILITY',
    calloutSub: 'ELON MUSK & SCIENTIST CONSENSUS',
    zoomBadge: 'CONFIDENCE: 99.99%',
    accent: '#F59E0B',
    secondary: '#00F0FF',
    subtitle: 'Top Scientists और ELON MUSK मानते हैं कि हम किसी Video Game में जी रहे हैं!',
    highlight: 'ELON MUSK',
  },
  {
    chunk: 0,
    stage: 2,
    code: 'SYS.03 // AI_CONSCIOUSNESS',
    macroTitle: 'SYNTHETIC COGNITION CORE',
    calloutTitle: 'NEURAL WEIGHTS & SYNAPSES',
    calloutSub: 'ARTIFICIAL INTELLIGENCE SUBSTRATE',
    zoomBadge: 'DEEP SCAN: LAYER 128',
    accent: '#A855F7',
    secondary: '#EC4899',
    subtitle: 'इसे SIMULATION THEORY कहते हैं—क्या हम सच में AI का एक हिस्सा हैं?',
    highlight: 'SIMULATION THEORY',
  },

  // CHUNK 2: PIXELS & PLANCK LENGTH[span_13](start_span)[span_13](end_span)
  {
    chunk: 1,
    stage: 0,
    code: 'PRF.01 // OPTICAL_PIXELATION',
    macroTitle: 'MACRO MATTER CONTINUUM',
    calloutTitle: 'SUB-PIXEL RGB MATRIX',
    calloutSub: 'SMOOTH GEOMETRY → DISCRETE BLOCKS',
    zoomBadge: 'ZOOM: 10,000x',
    accent: '#00F0FF',
    secondary: '#10B981',
    subtitle: 'पहला सबूत: किसी भी game को पास से देखने पर छोटे-छोटे PIXELS दिखाई देते हैं।',
    highlight: 'PIXELS',
  },
  {
    chunk: 1,
    stage: 1,
    code: 'PRF.01 // VOXEL_BREAKDOWN',
    macroTitle: 'ATOMIC LATTICE MESH',
    calloutTitle: 'QUANTUM VOXEL QUANTIZATION',
    calloutSub: 'POLYGON LIMIT REACHED',
    zoomBadge: 'ZOOM: 10¹⁸x',
    accent: '#10B981',
    secondary: '#00F0FF',
    subtitle: 'Graphics कितने भी real हों, एक limit के बाद सब कुछ BLOCKS में बदल जाता है।',
    highlight: 'BLOCKS',
  },
  {
    chunk: 1,
    stage: 2,
    code: 'PRF.01 // PLANCK_SCALE',
    macroTitle: 'SPACE-TIME FABRIC HORIZON',
    calloutTitle: 'PLANCK LENGTH FOAM (1.6×10⁻³⁵m)',
    calloutSub: 'MINIMUM UNIVERSE PIXEL RESOLUTION',
    zoomBadge: 'SCALE: 10⁻³⁵ METERS',
    accent: '#F43F5E',
    secondary: '#F59E0B',
    subtitle: 'इस Universe का भी एक सबसे छोटा pixel है—जिसे PLANCK LENGTH कहते हैं!',
    highlight: 'PLANCK LENGTH',
  },

  // CHUNK 3: DOUBLE SLIT & FRUSTUM CULLING[span_14](start_span)[span_14](end_span)
  {
    chunk: 2,
    stage: 0,
    code: 'PRF.02 // ENGINE_CULLING',
    macroTitle: 'WORLD RENDERING PIPELINE',
    calloutTitle: 'FRUSTUM CULLING OPTIMIZER',
    calloutSub: 'UNOBSERVED ZONES DE-ALLOCATED',
    zoomBadge: 'VRAM SAVED: 82.4%',
    accent: '#10B981',
    secondary: '#00F0FF',
    subtitle: 'दूसरा सबूत: DOUBLE SLIT EXPERIMENT! Game सिर्फ़ वही हिस्सा render करता है जो दिखता है।',
    highlight: 'DOUBLE SLIT EXPERIMENT!',
  },
  {
    chunk: 2,
    stage: 1,
    code: 'PRF.02 // WAVE_SUPERPOSITION',
    macroTitle: 'QUANTUM INTERFERENCE CHAMBER',
    calloutTitle: 'UNOBSERVED PROBABILITY WAVE',
    calloutSub: 'PARTICLE IN SUPERPOSITION (ψ)',
    zoomBadge: 'OBSERVER: INACTIVE',
    accent: '#A855F7',
    secondary: '#00F0FF',
    subtitle: 'हमारे दुनिया के particles भी तब तक रूप नहीं लेते, जब तक कोई उन्हें OBSERVE न करे!',
    highlight: 'OBSERVE',
  },
  {
    chunk: 2,
    stage: 2,
    code: 'PRF.02 // STATE_COLLAPSE',
    macroTitle: 'PHOTON DETECTOR ARRAY',
    calloutTitle: 'WAVE-FUNCTION COLLAPSE',
    calloutSub: 'INSTANT SOLID MATTER RENDERING',
    zoomBadge: 'OBSERVER: LOCKED',
    accent: '#00F0FF',
    secondary: '#F43F5E',
    subtitle: 'जैसे ही हम देखते हैं, वे अचानक एक SOLID REALITY में render हो जाते हैं!',
    highlight: 'SOLID REALITY',
  },

  // CHUNK 4: SPEED OF LIGHT & PROCESSOR CLOCK[span_15](start_span)[span_15](end_span)
  {
    chunk: 3,
    stage: 0,
    code: 'PRF.03 // PHOTON_VELOCITY',
    macroTitle: 'RELATIVISTIC LIGHT CONE',
    calloutTitle: 'CAUSALITY SPEED CEILING',
    calloutSub: 'c = 299,792,458 METERS / SEC',
    zoomBadge: 'LORENTZ γ → ∞',
    accent: '#F59E0B',
    secondary: '#F43F5E',
    subtitle: 'तीसरा सबूत: Speed of Light 3 LAKH KM/SEC पर फिक्स की गई है।',
    highlight: '3 LAKH KM/SEC',
  },
  {
    chunk: 3,
    stage: 1,
    code: 'PRF.03 // COSMIC_PROCESSOR',
    macroTitle: 'UNIVERSAL SILICON ARCHITECTURE',
    calloutTitle: 'PROCESSOR CLOCK FREQUENCY',
    calloutSub: 'MAX CYCLE RATE PER PLANCK TIME',
    zoomBadge: 'CLOCK: 1.85 × 10⁴³ Hz',
    accent: '#00F0FF',
    secondary: '#F59E0B',
    subtitle: 'Light की speed ही हमारे Universe के Computer Processor की MAXIMUM CLOCK SPEED है!',
    highlight: 'MAXIMUM CLOCK SPEED',
  },
  {
    chunk: 3,
    stage: 2,
    code: 'PRF.03 // KERNEL_HARDCODE',
    macroTitle: 'PHYSICS ENGINE FIRMWARE',
    calloutTitle: 'HARDWARE OVERFLOW PROTECTION',
    calloutSub: 'CONSTANT LOCKED IN KERNEL',
    zoomBadge: 'ACCESS: READ-ONLY',
    accent: '#F43F5E',
    secondary: '#00F0FF',
    subtitle: 'Hardware के लिए इसे पार करना impossible है, इसलिए इसे HARDCODE किया गया है!',
    highlight: 'HARDCODE',
  },

  // CHUNK 5: DNA ERROR-CORRECTING CODE[span_16](start_span)[span_16](end_span)
  {
    chunk: 4,
    stage: 0,
    code: 'PRF.04 // GENOME_SEQUENCER',
    macroTitle: 'CHIRAL DOUBLE-HELIX CHROMOSOME',
    calloutTitle: 'NUCLEOTIDE QUATERNARY CODE',
    calloutSub: 'A · T · C · G → BINARY BITSTREAM',
    zoomBadge: 'SCALE: 2.0 NANOMETERS',
    accent: '#10B981',
    secondary: '#00F0FF',
    subtitle: 'चौथा सबूत: वैज्ञानिकों को Human DNA के अंदर ERROR-CORRECTING CODES मिले हैं!',
    highlight: 'ERROR-CORRECTING CODES',
  },
  {
    chunk: 4,
    stage: 1,
    code: 'PRF.04 // SHANNON_PARITY',
    macroTitle: 'GENETIC REPLICATION BUS',
    calloutTitle: 'CLAUDE SHANNON 1948 CHECKSUM',
    calloutSub: 'AUTOMATIC MUTATION BIT-REPAIR',
    zoomBadge: 'PARITY CHECK: PASSED',
    accent: '#00F0FF',
    secondary: '#10B981',
    subtitle: 'ये बिल्कुल वही computer codes हैं जो CLAUDE SHANNON ने 1940s में बनाए थे!',
    highlight: 'CLAUDE SHANNON',
  },
  {
    chunk: 4,
    stage: 2,
    code: 'PRF.04 // BIO_COMPILER',
    macroTitle: 'CELLULAR TRANSCRIPTION ENGINE',
    calloutTitle: 'COMPILED MATHEMATICAL DNA',
    calloutSub: 'SUPER-INTELLIGENT ARCHITECT CODE',
    zoomBadge: 'SYNTAX ERRORS: 0',
    accent: '#A855F7',
    secondary: '#00F0FF',
    subtitle: 'क्या किसी SUPER-INTELLIGENT PROGRAMMER ने हमारे जेनेटिक्स का कोड लिखा है?',
    highlight: 'SUPER-INTELLIGENT PROGRAMMER',
  },

  // CHUNK 6: ANCESTOR SIMULATION & HARD DRIVE OUTRO[span_17](start_span)[span_17](end_span)
  {
    chunk: 5,
    stage: 0,
    code: 'END.01 // DYSON_SWARM',
    macroTitle: 'TYPE-III MATRIOSHKA MEGASTRUCTURE',
    calloutTitle: 'ANCESTOR SIMULATION NODE',
    calloutSub: 'POST-HUMAN HISTORICAL ARCHIVE',
    zoomBadge: 'EPOCH: YEAR 2026',
    accent: '#00F0FF',
    secondary: '#A855F7',
    subtitle: 'शायद FUTURE के इंसानों ने अपने past को स्टडी करने के लिए यह Simulation बनाया है!',
    highlight: 'FUTURE के इंसानों',
  },
  {
    chunk: 5,
    stage: 1,
    code: 'END.02 // QUANTUM_STORAGE',
    macroTitle: 'HOLOGRAPHIC DATA HORIZON',
    calloutTitle: 'COSMIC HARD-DRIVE SECTOR',
    calloutSub: '8 BILLION AI AGENTS EXECUTING',
    zoomBadge: 'STORAGE: 10¹²⁰ BITS',
    accent: '#F59E0B',
    secondary: '#00F0FF',
    subtitle: 'हम उन्हीं के AI MODELS हैं और एक विशाल Hard Drive के अंदर जी रहे हैं!',
    highlight: 'AI MODELS',
  },
  {
    chunk: 5,
    stage: 2,
    code: 'END.03 // REALITY_AWAKENED',
    macroTitle: 'SELF-AWARE NODE DIAGNOSTIC',
    calloutTitle: 'ATOM STICKMAN // DECODE REALITY',
    calloutSub: 'SUBSCRIBE TO ACCESS NEXT FILE',
    zoomBadge: 'CODE STATUS: AWAKE',
    accent: '#F43F5E',
    secondary: '#00F0FF',
    subtitle: 'ऐसे ही dark science secrets के लिए ATOM STICKMAN को अभी Subscribe करें!',
    highlight: 'ATOM STICKMAN',
  },
];

// ============================================================================
// 4. DEEP SPACE PLEXUS PARTICLE NETWORK & SVG GLOW FILTERS
// ============================================================================

const PlexusParticleField: React.FC<{ frame: number; accent: string; secondary: string }> = ({
  frame,
  accent,
  secondary,
}) => {
  // 55 Deterministic 3D Plexus Nodes that connect when close
  const nodes = Array.from({ length: 55 }, (_, i) => {
    const speedX = (hash(i * 11) - 0.5) * 1.4;
    const speedY = -0.6 - hash(i * 23) * 1.2;
    const x = ((hash(i * 37) * W + frame * speedX) % W + W) % W;
    const y = ((hash(i * 53) * H + frame * speedY) % H + H) % H;
    const r = 2 + hash(i * 71) * 4.5;
    const depth = 0.3 + hash(i * 89) * 0.7;
    return { x, y, r, depth, isAccent: i % 2 === 0 };
  });

  return (
    <g>
      {/* Dynamic Connecting Filaments Between Nearby Particles */}
      {nodes.map((a, i) =>
        nodes.slice(i + 1, i + 10).map((b, j) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 210) return null;
          const op = (1 - dist / 210) * 0.28;
          return (
            <line
              key={`${i}-${j}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={a.isAccent ? accent : secondary}
              strokeWidth={1.5}
              opacity={op}
            />
          );
        })
      )}

      {/* Glowing Particle Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r * 2.8}
            fill={n.isAccent ? accent : secondary}
            opacity={n.depth * 0.16}
          />
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={i % 5 === 0 ? '#FFFFFF' : n.isAccent ? accent : secondary}
            opacity={n.depth * 0.85}
          />
        </g>
      ))}
    </g>
  );
};

// ============================================================================
// 5. UPPER CANVAS: MACRO 3D HOLOGRAPHIC MODELS (NO STICKMAN!)
// Returns the exact (targetX, targetY) where the Laser Callout Line locks on!
// ============================================================================

const MacroHologramStage: React.FC<{
  chunk: number;
  stage: number;
  frame: number;
  localFrame: number;
  accent: string;
  secondary: string;
}> = ({ chunk, stage, frame, localFrame, accent, secondary }) => {
  const sec = frame / FPS;
  const cx = 540;
  const cy = 470;

  // --------------------------------------------------------------------------
  // CHUNK 0: 3D HOLOGRAPHIC NEURAL BRAIN CORTEX (140 3D NODES + SYNAPSE WEB)
  // --------------------------------------------------------------------------
  if (chunk === 0) {
    const rotY = sec * 0.55 + stage * 0.8;
    const rotX = 0.22 + Math.sin(sec * 0.7) * 0.1;

    const brainNodes = Array.from({ length: 130 }, (_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 130);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const rawX = Math.sin(phi) * Math.cos(theta);
      const rawY = Math.cos(phi);
      const rawZ = Math.sin(phi) * Math.sin(theta);

      // Sculpt into realistic 2-hemisphere elongated brain shape
      const hemiGap = rawX >= 0 ? 28 : -28;
      const bx = rawX * 235 + hemiGap;
      const by = rawY * 165 - Math.abs(rawX) * 25;
      const bz = rawZ * 275;

      return project3D(bx, by, bz, rotX, rotY);
    });

    return (
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Outer Holographic Gimbal Rings */}
        {[310, 260].map((r, idx) => (
          <ellipse
            key={idx}
            cx={0}
            cy={0}
            rx={r}
            ry={r * 0.34}
            fill="none"
            stroke={idx === 0 ? accent : secondary}
            strokeWidth={idx === 0 ? 3 : 1.5}
            strokeDasharray={idx === 0 ? '28 14 8 14' : '12 18'}
            opacity={0.45}
            transform={`rotate(${(idx === 0 ? 1 : -1) * sec * 18})`}
          />
        ))}

        {/* Deep Neural Pathways Inside Brain */}
        {brainNodes.map((pt, i) => {
          const next = brainNodes[(i * 7 + 3) % brainNodes.length];
          const next2 = brainNodes[(i * 13 + 5) % brainNodes.length];
          const isFiring = (i + Math.floor(frame / 4)) % 11 === 0;
          return (
            <g key={i}>
              <line
                x1={pt.sx}
                y1={pt.sy}
                x2={next.sx}
                y2={next.sy}
                stroke={isFiring ? '#FFFFFF' : accent}
                strokeWidth={isFiring ? 2.4 : 1.1}
                opacity={clamp(pt.scale * (isFiring ? 0.65 : 0.22), 0.08, 0.75)}
              />
              {i % 3 === 0 && (
                <line
                  x1={pt.sx}
                  y1={pt.sy}
                  x2={next2.sx}
                  y2={next2.sy}
                  stroke={secondary}
                  strokeWidth={0.9}
                  opacity={0.16}
                />
              )}
              <circle
                cx={pt.sx}
                cy={pt.sy}
                r={(isFiring ? 6.5 : 3.8) * pt.scale}
                fill={isFiring ? '#FFFFFF' : i % 4 === 0 ? secondary : accent}
                opacity={clamp(pt.scale * 0.9, 0.2, 1)}
              />
            </g>
          );
        })}

        {/* Glowing Core Thalamus */}
        <circle cx={0} cy={-10} r={65} fill={accent} opacity={0.18} filter="url(#neon-glow)" />
      </g>
    );
  }

  // --------------------------------------------------------------------------
  // CHUNK 1: 3D ATOMIC & VOXEL LATTICE SPHERE (MATTER PIXELATION)
  // --------------------------------------------------------------------------
  if (chunk === 1) {
    const rotY = sec * 0.65;
    const rotX = 0.35;
    const cubeCoords: [number, number, number][] = [];
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -2; z <= 2; z++) {
          if (x * x + y * y + z * z <= 6) {
            cubeCoords.push([x * 78, y * 78, z * 78]);
          }
        }
      }
    }

    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <circle cx={0} cy={0} r={285} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="8 12" opacity={0.4} />
        {cubeCoords.map(([vx, vy, vz], i) => {
          const p = project3D(vx, vy, vz, rotX, rotY);
          const size = 34 * p.scale;
          const pulse = Math.sin(sec * 5 + i * 0.4) > 0.65;
          return (
            <g key={i} transform={`translate(${p.sx}, ${p.sy})`}>
              <rect
                x={-size / 2}
                y={-size / 2}
                width={size}
                height={size}
                rx={4}
                fill={pulse ? accent : 'rgba(12, 22, 44, 0.82)'}
                stroke={pulse ? '#FFFFFF' : accent}
                strokeWidth={2}
                opacity={clamp(p.scale * 0.85, 0.2, 0.95)}
              />
            </g>
          );
        })}
      </g>
    );
  }

  // --------------------------------------------------------------------------
  // CHUNK 2: 3D QUANTUM INTERFERENCE & FRUSTUM RADAR DOME
  // --------------------------------------------------------------------------
  if (chunk === 2) {
    const sweepDeg = Math.sin(sec * 1.8) * 42;
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        {[110, 195, 280].map((r, i) => (
          <circle
            key={i}
            cx={0}
            cy={0}
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            strokeDasharray={i % 2 === 0 ? '20 10' : '6 14'}
            opacity={0.35}
          />
        ))}
        {/* Rotating Observer FOV Frustum Cone */}
        <g transform={`rotate(${sweepDeg})`}>
          <path
            d="M 0 0 L 250 -145 A 285 285 0 0 1 250 145 Z"
            fill={`${accent}28`}
            stroke={accent}
            strokeWidth={4}
            filter="url(#neon-glow)"
          />
          {/* Solid Rendered Nodes Inside Observer Cone */}
          {[
            [140, -55],
            [185, 25],
            [215, -35],
            [115, 45],
          ].map(([nx, ny], idx) => (
            <rect
              key={idx}
              x={nx - 16}
              y={ny - 16}
              width={32}
              height={32}
              rx={6}
              fill={accent}
              stroke="#FFFFFF"
              strokeWidth={2.5}
            />
          ))}
        </g>
        {/* Unobserved Ghost Wireframe Nodes Outside Cone */}
        {[
          [-160, -90],
          [-190, 60],
          [-95, 145],
          [-80, -165],
        ].map(([gx, gy], idx) => (
          <circle
            key={idx}
            cx={gx}
            cy={gy}
            r={18}
            fill="none"
            stroke="#64748B"
            strokeWidth={2}
            strokeDasharray="5 5"
            opacity={0.55}
          />
        ))}
        <circle cx={0} cy={0} r={24} fill="#FFFFFF" stroke={accent} strokeWidth={6} />
      </g>
    );
  }

  // --------------------------------------------------------------------------
  // CHUNK 3: 3D COSMIC QUANTUM PROCESSOR WAFER & LIGHT CONE
  // --------------------------------------------------------------------------
  if (chunk === 3) {
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Motherbd / Wafer Bus Traces */}
        {Array.from({ length: 16 }).map((_, i) => {
          const ang = (i * Math.PI) / 8;
          const x1 = Math.cos(ang) * 110;
          const y1 = Math.sin(ang) * 110;
          const x2 = Math.cos(ang) * 285;
          const y2 = Math.sin(ang) * 285;
          const pulsePos = ((frame * 4 + i * 20) % 175) / 175;
          const px = interpolate(pulsePos, [0, 1], [x1, x2]);
          const py = interpolate(pulsePos, [0, 1], [y1, y2]);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth={3} opacity={0.4} />
              <circle cx={px} cy={py} r={6} fill="#FFFFFF" filter="url(#neon-glow)" />
            </g>
          );
        })}
        <rect
          x={-135}
          y={-135}
          width={270}
          height={270}
          rx={24}
          fill="#070E1E"
          stroke={accent}
          strokeWidth={6}
          transform={`rotate(${sec * 12})`}
        />
        <rect
          x={-95}
          y={-95}
          width={190}
          height={190}
          rx={14}
          fill="#0F172A"
          stroke={secondary}
          strokeWidth={4}
        />
        <text x={0} y={-10} textAnchor="middle" fill="#FFFFFF" fontSize={32} fontFamily="monospace" fontWeight="900">
          COSMIC_ALU
        </text>
        <text x={0} y={32} textAnchor="middle" fill={accent} fontSize={26} fontFamily="monospace" fontWeight="bold">
          299,792 KM/S
        </text>
      </g>
    );
  }

  // --------------------------------------------------------------------------
  // CHUNK 4: 3D DOUBLE-HELIX DNA STRAND WITH BASE-PAIR RUNGS
  // --------------------------------------------------------------------------
  if (chunk === 4) {
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        {Array.from({ length: 15 }).map((_, i) => {
          const y = -245 + i * 35;
          const phase = sec * 3.2 + i * 0.48;
          const x1 = Math.sin(phase) * 185;
          const z1 = Math.cos(phase);
          const x2 = Math.sin(phase + Math.PI) * 185;
          const isTargetRung = i === 8;

          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={isTargetRung ? '#FFFFFF' : secondary}
                strokeWidth={isTargetRung ? 6 : 3.5}
                opacity={0.75}
              />
              <circle
                cx={x1}
                cy={y}
                r={z1 > 0 ? 13 : 8}
                fill={isTargetRung ? '#FFFFFF' : accent}
                filter={isTargetRung ? 'url(#neon-glow)' : undefined}
              />
              <circle
                cx={x2}
                cy={y}
                r={z1 < 0 ? 13 : 8}
                fill={isTargetRung ? '#FFFFFF' : secondary}
              />
            </g>
          );
        })}
      </g>
    );
  }

  // --------------------------------------------------------------------------
  // CHUNK 5: TYPE-III DYSON SWARM MEGASTRUCTURE & COSMIC ARCHIVE
  // --------------------------------------------------------------------------
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {[275, 210, 145].map((r, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={0}
          rx={r}
          ry={r * (0.42 + i * 0.18)}
          fill="none"
          stroke={i % 2 === 0 ? accent : secondary}
          strokeWidth={5}
          strokeDasharray="36 18 10 18"
          transform={`rotate(${(i % 2 === 0 ? 1 : -1) * sec * 22 + i * 35})`}
        />
      ))}
      <circle cx={0} cy={0} r={68} fill={accent} filter="url(#neon-glow)" />
      <circle cx={0} cy={0} r={38} fill="#FFFFFF" />
    </g>
  );
};

// ============================================================================
// 6. LOWER CANVAS: FUTURISTIC HOLOGRAPHIC CALLOUT SCREEN & MICRO-SIMULATIONS
// (Connected to the Macro Object via an Animated Laser Leader Line!)
// ============================================================================

const FuturisticCalloutScreen: React.FC<{
  meta: CalloutSceneMeta;
  frame: number;
  localFrame: number;
  stageDurationFrames: number;
}> = ({ meta, frame, localFrame, stageDurationFrames }) => {
  const sec = frame / FPS;
  const { accent, secondary, chunk, stage } = meta;

  // Target lock coordinates on the upper Macro Object
  const originOffsets: [number, number][] = [
    [615, 445], // Stage 0 lock point
    [455, 505], // Stage 1 lock point
    [575, 395], // Stage 2 lock point
  ];
  const [origX, origY] = originOffsets[stage % 3];

  // Elbow and Callout Screen Anchor Coordinates
  const elbowX = stage === 1 ? 230 : 845;
  const elbowY = 665;
  const dockX = 540;
  const dockY = 760;

  // Progressive Animation Timings:
  // 1. Target reticle locks on (frames 0..22)
  // 2. Laser line shoots out from macro object to screen dock (frames 12..48)
  // 3. Futuristic Screen unfolds cleanly (frames 32..68)
  const reticleScale = spring({ frame: localFrame, fps: FPS, config: { damping: 12, stiffness: 200 } });
  const lineDraw = interpolate(localFrame, [10, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const screenOpen = spring({
    frame: Math.max(0, localFrame - 28),
    fps: FPS,
    config: { damping: 14, stiffness: 150 },
  });

  const pathLength = 900;
  const laserPath = `M ${origX} ${origY} L ${elbowX} ${elbowY} L ${dockX} ${dockY}`;

  // Travelling Energy Pulse Along the Laser Line
  const pulseT = ((localFrame * 2.5) % 100) / 100;
  const pulseX =
    pulseT < 0.5
      ? interpolate(pulseT, [0, 0.5], [origX, elbowX])
      : interpolate(pulseT, [0.5, 1], [elbowX, dockX]);
  const pulseY =
    pulseT < 0.5
      ? interpolate(pulseT, [0, 0.5], [origY, elbowY])
      : interpolate(pulseT, [0.5, 1], [elbowY, dockY]);

  return (
    <g>
      {/* 1. PULSING TARGET RETICLE ON MACRO OBJECT */}
      <g transform={`translate(${origX}, ${origY}) scale(${reticleScale})`}>
        <circle
          cx={0}
          cy={0}
          r={38 + Math.sin(sec * 10) * 5}
          fill="none"
          stroke={accent}
          strokeWidth={3}
          strokeDasharray="14 8"
          transform={`rotate(${sec * 65})`}
        />
        <circle cx={0} cy={0} r={18} fill={`${accent}44`} stroke="#FFFFFF" strokeWidth={2.5} />
        <circle cx={0} cy={0} r={6} fill="#FFFFFF" filter="url(#neon-glow)" />
        {/* Corner Target Brackets */}
        <path
          d="M -28 -14 L -28 -28 L -14 -28 M 28 -14 L 28 -28 L 14 -28 M -28 14 L -28 28 L -14 28 M 28 14 L 28 28 L 14 28"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3}
        />
      </g>

      {/* 2. ANIMATED LASER LEADER LINE (MACRO -> MICRO SCREEN) */}
      <path
        d={laserPath}
        fill="none"
        stroke={accent}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - lineDraw)}
        opacity={0.35}
        filter="url(#neon-glow)"
      />
      <path
        d={laserPath}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - lineDraw)}
      />

      {/* Elbow Telemetry Node & Travelling Data Packet */}
      {lineDraw > 0.45 && (
        <g transform={`translate(${elbowX}, ${elbowY})`}>
          <circle cx={0} cy={0} r={9} fill="#050A18" stroke={accent} strokeWidth={4} />
          <text
            x={stage === 1 ? -18 : 18}
            y={-14}
            textAnchor={stage === 1 ? 'end' : 'start'}
            fill={accent}
            fontSize={20}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {meta.zoomBadge}
          </text>
        </g>
      )}
      {lineDraw > 0.9 && (
        <circle cx={pulseX} cy={pulseY} r={8} fill="#FFFFFF" filter="url(#neon-glow)" />
      )}

      {/* 3. FUTURISTIC GLASSMORPHIC CALLOUT SCREEN (760..1460 Y) */}
      <g
        transform={`translate(540, 1105) scale(${interpolate(screenOpen, [0, 1], [0.75, 1])})`}
        opacity={clamp(screenOpen * 1.2)}
      >
        {/* Outer Chamfered Sci-Fi Frame Glow */}
        <polygon
          points="-455,-345 420,-345 455,-310 455,345 -420,345 -455,310"
          fill="rgba(6, 12, 28, 0.92)"
          stroke={accent}
          strokeWidth={4}
          filter="url(#neon-glow)"
        />
        <polygon
          points="-455,-345 420,-345 455,-310 455,345 -420,345 -455,310"
          fill="url(#hud-glass)"
          stroke={accent}
          strokeWidth={3}
        />

        {/* Top Header Bar Inside Callout Screen */}
        <path
          d="M -452 -342 L 418 -342 L 452 -308 L 452 -255 L -452 -255 Z"
          fill={`${accent}24`}
        />
        <line x1={-452} y1={-255} x2={452} y2={-255} stroke={accent} strokeWidth={2.5} />
        <circle cx={-410} cy={-298} r={10} fill={accent} />
        <text x={-382} y={-289} fill="#FFFFFF" fontSize={27} fontFamily="monospace" fontWeight="900" letterSpacing={2}>
          {meta.calloutTitle}
        </text>
        <text x={425} y={-290} textAnchor="end" fill={accent} fontSize={22} fontFamily="monospace" fontWeight="bold">
          {meta.calloutSub}
        </text>

        {/* Subtle Moving Scanline Inside Viewport */}
        <line
          x1={-440}
          y1={-240 + ((frame * 3.5) % 510)}
          x2={440}
          y2={-240 + ((frame * 3.5) % 510)}
          stroke={accent}
          strokeWidth={2}
          opacity={0.22}
        />

        {/* =================================================================
            BESPOKE MICRO-SIMULATION VIEWPORT INSIDE THE FUTURISTIC SCREEN
        ================================================================= */}
        <g transform="translate(0, 15)">
          {/* CHUNK 0, STAGE 0: FIRING BRAIN CELLS (NEURONS & SYNAPSES -> BINARY) */}
          {chunk === 0 && stage === 0 && (
            <g>
              {/* Dendrite / Axon Filaments Connecting 5 Detailed Neural Cells */}
              {[
                [-260, -85, 0, 15],
                [0, 15, 255, -75],
                [-260, -85, -180, 145],
                [0, 15, 190, 150],
                [-180, 145, 190, 150],
              ].map(([x1, y1, x2, y2], idx) => {
                const t = ((frame * 0.035 + idx * 0.25) % 1);
                const sx = interpolate(t, [0, 1], [x1, x2]);
                const sy = interpolate(t, [0, 1], [y1, y2]);
                return (
                  <g key={idx}>
                    <path
                      d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 35} ${x2} ${y2}`}
                      fill="none"
                      stroke={accent}
                      strokeWidth={5}
                      opacity={0.55}
                    />
                    {/* Action Potential Binary Impulse Travelling Between Cells */}
                    <circle cx={sx} cy={sy - 14} r={10} fill="#FFFFFF" filter="url(#neon-glow)" />
                    <text x={sx} y={sy - 30} textAnchor="middle" fill={accent} fontSize={22} fontFamily="monospace" fontWeight="900">
                      {idx % 2 === 0 ? '101' : '010'}
                    </text>
                  </g>
                );
              })}

              {/* 5 High-Detail Biological Soma Cells with Glowing Nuclei */}
              {[
                [-260, -85, 58],
                [0, 15, 74],
                [255, -75, 56],
                [-180, 145, 50],
                [190, 150, 52],
              ].map(([cxCell, cyCell, rad], idx) => {
                const pulse = 1 + Math.sin(sec * 7 + idx) * 0.08;
                return (
                  <g key={idx} transform={`translate(${cxCell}, ${cyCell}) scale(${pulse})`}>
                    <circle cx={0} cy={0} r={rad} fill="rgba(0, 240, 255, 0.16)" stroke={accent} strokeWidth={4} filter="url(#neon-glow)" />
                    <circle cx={0} cy={0} r={rad * 0.55} fill="#0F172A" stroke={secondary} strokeWidth={3} />
                    <circle cx={0} cy={0} r={rad * 0.25} fill="#FFFFFF" />
                    <text x={0} y={rad + 28} textAnchor="middle" fill="#E2E8F0" fontSize={19} fontFamily="monospace" fontWeight="bold">
                      {`CELL_0${idx + 1} [ACTIVE]`}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* CHUNK 0, STAGE 1: SIMULATION PROBABILITY SERVER RACKS (99.99%) */}
          {chunk === 0 && stage === 1 && (
            <g>
              <g transform="translate(-180, 0)">
                <circle cx={0} cy={0} r={175} fill="none" stroke="#1E293B" strokeWidth={28} />
                <circle
                  cx={0}
                  cy={0}
                  r={175}
                  fill="none"
                  stroke={accent}
                  strokeWidth={28}
                  strokeDasharray={1100}
                  strokeDashoffset={1100 * (1 - clamp(localFrame / 75) * 0.999)}
                  strokeLinecap="round"
                  transform="rotate(-90)"
                  filter="url(#neon-glow)"
                />
                <text x={0} y={18} textAnchor="middle" fill="#FFFFFF" fontSize={68} fontFamily="monospace" fontWeight="900">
                  99.9%
                </text>
                <text x={0} y={62} textAnchor="middle" fill={accent} fontSize={22} fontFamily="monospace" fontWeight="bold">
                  SIMULATED ODDS
                </text>
              </g>
              {/* Right Side Server Blade Telemetry */}
              <g transform="translate(65, -145)">
                {['BASE REALITY: 0.0001%', 'ANCESTOR SIMS: 10¹²', 'GPU FLOPS: 10⁸⁴/SEC', 'STATUS: INSIDE GAME'].map((label, i) => (
                  <g key={i} transform={`translate(0, ${i * 78})`}>
                    <rect x={0} y={0} width={340} height={60} rx={10} fill="rgba(15,23,42,0.9)" stroke={i === 3 ? accent : '#334155'} strokeWidth={3} />
                    <text x={22} y={38} fill={i === 3 ? accent : '#FFFFFF'} fontSize={24} fontFamily="monospace" fontWeight="bold">
                      {label}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          )}

          {/* CHUNK 0, STAGE 2: AI DEEP NEURAL NETWORK WEIGHT MATRIX */}
          {chunk === 0 && stage === 2 && (
            <g>
              {[-280, -95, 95, 280].map((layerX, col) =>
                [-140, -45, 45, 140].map((nodeY, row) => (
                  <g key={`${col}-${row}`}>
                    {col < 3 &&
                      [-140, -45, 45, 140].map((nextY, nRow) => (
                        <line
                          key={nRow}
                          x1={layerX}
                          y1={nodeY}
                          x2={layerX + 185}
                          y2={nextY}
                          stroke={(row + nRow + Math.floor(frame / 6)) % 5 === 0 ? '#FFFFFF' : accent}
                          strokeWidth={2}
                          opacity={0.35}
                        />
                      ))}
                    <circle cx={layerX} cy={nodeY} r={22} fill="#090D1A" stroke={accent} strokeWidth={4} />
                    <circle cx={layerX} cy={nodeY} r={9} fill="#FFFFFF" />
                  </g>
                ))
              )}
            </g>
          )}

          {/* CHUNK 1, STAGE 0: SUB-PIXEL RGB DIODE MICROSCOPY */}
          {chunk === 1 && stage === 0 && (
            <g>
              {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 6 }).map((__, c) => {
                  const px = (c - 2.5) * 130;
                  const py = (r - 1.5) * 105;
                  return (
                    <g key={`${r}-${c}`} transform={`translate(${px - 45}, ${py - 36})`}>
                      <rect x={0} y={0} width={96} height={76} rx={8} fill="#080D1A" stroke="#334155" strokeWidth={2} />
                      <rect x={8} y={8} width={22} height={60} rx={4} fill="#F43F5E" />
                      <rect x={37} y={8} width={22} height={60} rx={4} fill="#10B981" />
                      <rect x={66} y={8} width={22} height={60} rx={4} fill="#3B82F6" />
                    </g>
                  );
                })
              )}
            </g>
          )}

          {/* CHUNK 1, STAGE 1: SMOOTH WAVE VS QUANTIZED VOXEL STEPPING */}
          {chunk === 1 && stage === 1 && (
            <g>
              {/* Quantized Step Blocks */}
              {Array.from({ length: 14 }).map((_, i) => {
                const bx = -360 + i * 54;
                const bh = Math.sin(i * 0.5 + sec * 3) * 130;
                return (
                  <rect
                    key={i}
                    x={bx}
                    y={bh >= 0 ? 0 : bh}
                    width={48}
                    height={Math.abs(bh) + 24}
                    rx={6}
                    fill={`${accent}44`}
                    stroke={accent}
                    strokeWidth={3}
                  />
                );
              })}
              <line x1={-390} y1={0} x2={390} y2={0} stroke="#FFFFFF" strokeWidth={3} opacity={0.5} />
            </g>
          )}

          {/* CHUNK 1, STAGE 2: PLANCK LENGTH QUANTUM FOAM (1.6 x 10^-35 m) */}
          {chunk === 1 && stage === 2 && (
            <g>
              {Array.from({ length: 18 }).map((_, i) => {
                const ang = (i / 18) * Math.PI * 2 + sec * 0.5;
                const rad = (i % 3) * 75 + 45;
                const hx = Math.cos(ang) * rad * 1.4;
                const hy = Math.sin(ang) * rad * 0.85;
                return (
                  <circle
                    key={i}
                    cx={hx}
                    cy={hy}
                    r={32 + Math.sin(sec * 8 + i) * 8}
                    fill="none"
                    stroke={i % 2 === 0 ? accent : secondary}
                    strokeWidth={3}
                  />
                );
              })}
              <line x1={-340} y1={145} x2={340} y2={145} stroke="#FFFFFF" strokeWidth={4} />
              <line x1={-340} y1={120} x2={-340} y2={170} stroke={accent} strokeWidth={6} />
              <line x1={340} y1={120} x2={340} y2={170} stroke={accent} strokeWidth={6} />
              <text x={0} y={205} textAnchor="middle" fill="#FFFFFF" fontSize={36} fontFamily="monospace" fontWeight="900">
                1 PLANCK PIXEL = 1.616 × 10⁻³⁵ METERS
              </text>
            </g>
          )}

          {/* CHUNK 2, STAGE 0: FRUSTUM CULLING MEMORY GRAPH */}
          {chunk === 2 && stage === 0 && (
            <g>
              <g transform="translate(-200, 0)">
                <rect x={-180} y={-150} width={340} height={300} rx={18} fill="#091526" stroke={accent} strokeWidth={4} />
                <text x={-10} y={-90} textAnchor="middle" fill={accent} fontSize={26} fontFamily="monospace" fontWeight="900">
                  VISIBLE VIEWPORT
                </text>
                <text x={-10} y={10} textAnchor="middle" fill="#FFFFFF" fontSize={54} fontFamily="monospace" fontWeight="900">
                  RENDERED
                </text>
                <text x={-10} y={85} textAnchor="middle" fill="#10B981" fontSize={28} fontFamily="monospace" fontWeight="bold">
                  100% GEOMETRY ACTIVE
                </text>
              </g>
              <g transform="translate(200, 0)">
                <rect x={-160} y={-150} width={340} height={300} rx={18} fill="#090D16" stroke="#475569" strokeWidth={4} strokeDasharray="14 10" />
                <text x={10} y={-90} textAnchor="middle" fill="#94A3B8" fontSize={26} fontFamily="monospace" fontWeight="900">
                  BEHIND PLAYER
                </text>
                <text x={10} y={10} textAnchor="middle" fill="#64748B" fontSize={54} fontFamily="monospace" fontWeight="900">
                  CULLED
                </text>
                <text x={10} y={85} textAnchor="middle" fill="#F43F5E" fontSize={28} fontFamily="monospace" fontWeight="bold">
                  0% GPU MEMORY USED
                </text>
              </g>
            </g>
          )}

          {/* CHUNK 2, STAGE 1: UNOBSERVED QUANTUM PROBABILITY WAVE */}
          {chunk === 2 && stage === 1 && (
            <g>
              {[-1, 0, 1].map((w) => (
                <path
                  key={w}
                  d={Array.from({ length: 36 })
                    .map((_, i) => {
                      const x = -380 + i * 22;
                      const y = Math.sin(i * 0.45 - sec * 7 + w) * (115 - Math.abs(w) * 30);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={w === 0 ? '#FFFFFF' : accent}
                  strokeWidth={w === 0 ? 6 : 3.5}
                  filter="url(#neon-glow)"
                />
              ))}
              <text x={0} y={185} textAnchor="middle" fill={accent} fontSize={30} fontFamily="monospace" fontWeight="900">
                ψ(x,t) SUPERPOSITION — NO SOLID POSITION
              </text>
            </g>
          )}

          {/* CHUNK 2, STAGE 2: WAVE COLLAPSE INTO SOLID PARTICLE BANDS */}
          {chunk === 2 && stage === 2 && (
            <g>
              {[-240, -120, 0, 120, 240].map((bx, i) => (
                <g key={i} transform={`translate(${bx}, 0)`}>
                  <rect x={-32} y={-140} width={64} height={260} rx={10} fill={`${accent}33`} stroke={accent} strokeWidth={4} />
                  {Array.from({ length: 8 }).map((__, dot) => (
                    <circle
                      key={dot}
                      cx={((dot * 19) % 36) - 18}
                      cy={-110 + dot * 30}
                      r={6}
                      fill="#FFFFFF"
                    />
                  ))}
                </g>
              ))}
              <text x={0} y={185} textAnchor="middle" fill="#FFFFFF" fontSize={30} fontFamily="monospace" fontWeight="900">
                OBSERVER DETECTED → WAVE COLLAPSED TO MATTER
              </text>
            </g>
          )}

          {/* CHUNK 3, STAGE 0: LORENTZ RELATIVISTIC SPEED BARRIER */}
          {chunk === 3 && stage === 0 && (
            <g>
              <line x1={-340} y1={130} x2={340} y2={130} stroke="#64748B" strokeWidth={4} />
              <line x1={-340} y1={-160} x2={-340} y2={130} stroke="#64748B" strokeWidth={4} />
              {/* Red Speed of Light Asymptote Wall */}
              <line x1={260} y1={-170} x2={260} y2={130} stroke="#F43F5E" strokeWidth={6} strokeDasharray="16 10" />
              <path
                d="M -340 125 Q 120 115 248 -165"
                fill="none"
                stroke={accent}
                strokeWidth={8}
                filter="url(#neon-glow)"
              />
              <text x={240} y={-130} textAnchor="end" fill="#F43F5E" fontSize={30} fontFamily="monospace" fontWeight="900">
                c = 300,000 KM/S LIMIT
              </text>
            </g>
          )}

          {/* CHUNK 3, STAGE 1: CPU CLOCK OSCILLATOR WAVEFORM */}
          {chunk === 3 && stage === 1 && (
            <g>
              <path
                d={Array.from({ length: 16 })
                  .map((_, i) => {
                    const x = -360 + i * 48;
                    const y = i % 2 === 0 ? -95 : 95;
                    const nx = x + 48;
                    return `${i === 0 ? `M ${x} ${y}` : ''} L ${nx} ${y} L ${nx} ${-y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={accent}
                strokeWidth={6}
                filter="url(#neon-glow)"
              />
              <text x={0} y={175} textAnchor="middle" fill="#FFFFFF" fontSize={32} fontFamily="monospace" fontWeight="900">
                1 PIXEL PER CLOCK TICK = SPEED OF LIGHT
              </text>
            </g>
          )}

          {/* CHUNK 3, STAGE 2: KERNEL HARDCODED PHYSICS CONSTANTS */}
          {chunk === 3 && stage === 2 && (
            <g transform="translate(-370, -120)">
              <text x={0} y={0} fill="#94A3B8" fontSize={28} fontFamily="monospace">
                // UNIVERSE_KERNEL_CONFIG.H
              </text>
              <text x={0} y={60} fill="#00F0FF" fontSize={34} fontFamily="monospace" fontWeight="900">
                #define MAX_CLOCK_SPEED_C 299792458
              </text>
              <text x={0} y={120} fill="#F59E0B" fontSize={32} fontFamily="monospace" fontWeight="bold">
                #define PLANCK_VOXEL_MIN 1.616e-35
              </text>
              <rect x={0} y={160} width={740} height={70} rx={12} fill="rgba(244,63,94,0.2)" stroke="#F43F5E" strokeWidth={3} />
              <text x={370} y={206} textAnchor="middle" fill="#FFFFFF" fontSize={32} fontFamily="monospace" fontWeight="900">
                🔒 HARDWARE LIMIT: CANNOT OVERCLOCK
              </text>
            </g>
          )}

          {/* CHUNK 4, STAGE 0: DNA NUCLEOTIDE -> BINARY BIT SEQUENCER */}
          {chunk === 4 && stage === 0 && (
            <g>
              {[
                ['ADENINE (A)', '00', '#10B981'],
                ['THYMINE (T)', '01', '#00F0FF'],
                ['CYTOSINE (C)', '10', '#F59E0B'],
                ['GUANINE (G)', '11', '#A855F7'],
              ].map(([base, bits, col], i) => (
                <g key={i} transform={`translate(${(i - 1.5) * 205}, 0)`}>
                  <rect x={-90} y={-140} width={180} height={260} rx={18} fill="#091326" stroke={col} strokeWidth={4} />
                  <text x={0} y={-75} textAnchor="middle" fill={col} fontSize={23} fontFamily="monospace" fontWeight="900">
                    {base}
                  </text>
                  <text x={0} y={35} textAnchor="middle" fill="#FFFFFF" fontSize={78} fontFamily="monospace" fontWeight="900">
                    {bits}
                  </text>
                  <text x={0} y={95} textAnchor="middle" fill="#94A3B8" fontSize={20} fontFamily="monospace">
                    2-BIT CODON
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* CHUNK 4, STAGE 1: CLAUDE SHANNON ERROR-CORRECTING HAMMING CODE */}
          {chunk === 4 && stage === 1 && (
            <g>
              {['1', '0', '1', localFrame > 95 ? '1' : 'ERR', '0', '1', '1'].map((bit, i) => {
                const isTarget = i === 3;
                const repaired = localFrame > 95;
                const col = isTarget ? (repaired ? '#10B981' : '#F43F5E') : '#00F0FF';
                return (
                  <g key={i} transform={`translate(${(i - 3) * 115}, -20)`}>
                    <rect x={-48} y={-85} width={96} height={150} rx={14} fill="#091224" stroke={col} strokeWidth={5} />
                    <text x={0} y={10} textAnchor="middle" fill={col} fontSize={42} fontFamily="monospace" fontWeight="900">
                      {bit}
                    </text>
                  </g>
                );
              })}
              <text
                x={0}
                y={155}
                textAnchor="middle"
                fill={localFrame > 95 ? '#10B981' : '#F43F5E'}
                fontSize={32}
                fontFamily="monospace"
                fontWeight="900"
              >
                {localFrame > 95
                  ? '✓ SHANNON PARITY BIT: DNA MUTATION REPAIRED'
                  : '⚠️ BIT FLIP DETECTED — RUNNING PARITY REPAIR...'}
              </text>
            </g>
          )}

          {/* CHUNK 4, STAGE 2: GENETIC SOFTWARE COMPILER */}
          {chunk === 4 && stage === 2 && (
            <g transform="translate(-370, -125)">
              <text x={0} y={0} fill={accent} fontSize={30} fontFamily="monospace" fontWeight="bold">
                &gt; DECOMPILING CHROMOSOME_23.BIN...
              </text>
              <text x={0} y={58} fill="#FFFFFF" fontSize={28} fontFamily="monospace">
                error_correction: SHANNON_HAMMING_1948
              </text>
              <text x={0} y={112} fill="#10B981" fontSize={28} fontFamily="monospace">
                coincidence_probability: 0.00000001%
              </text>
              <rect x={0} y={155} width={740} height={74} rx={14} fill={`${accent}28`} stroke={accent} strokeWidth={4} />
              <text x={370} y={204} textAnchor="middle" fill="#FFFFFF" fontSize={34} fontFamily="monospace" fontWeight="900">
                SIGNATURE: SUPER-INTELLIGENT CODER
              </text>
            </g>
          )}

          {/* CHUNK 5, STAGE 0: ANCESTOR SIMULATION SERVER CLUSTER */}
          {chunk === 5 && stage === 0 && (
            <g>
              {[-250, 0, 250].map((sx, i) => (
                <g key={i} transform={`translate(${sx}, 0)`}>
                  <rect x={-105} y={-145} width={210} height={270} rx={16} fill="#091428" stroke={i === 1 ? '#FFFFFF' : accent} strokeWidth={4} />
                  <text x={0} y={-85} textAnchor="middle" fill={accent} fontSize={24} fontFamily="monospace" fontWeight="bold">
                    {`SIM_NODE_0${i + 1}`}
                  </text>
                  <circle cx={0} cy={10} r={52} fill="none" stroke={secondary} strokeWidth={4} strokeDasharray="16 8" transform={`rotate(${sec * 40})`} />
                  <text x={0} y={100} textAnchor="middle" fill="#FFFFFF" fontSize={24} fontFamily="monospace" fontWeight="900">
                    {i === 1 ? 'EARTH 2026' : `EARTH ${1920 + i * 90}`}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* CHUNK 5, STAGE 1: HOLOGRAPHIC HARD DRIVE PLATTER */}
          {chunk === 5 && stage === 1 && (
            <g>
              <circle cx={-160} cy={0} r={155} fill="#081020" stroke={accent} strokeWidth={6} />
              <circle cx={-160} cy={0} r={105} fill="none" stroke="#00F0FF" strokeWidth={3} strokeDasharray="18 10" transform={`rotate(${sec * 95}, -160, 0)`} />
              <circle cx={-160} cy={0} r={32} fill={accent} />
              <g transform="translate(60, -110)">
                <text x={0} y={0} fill={accent} fontSize={30} fontFamily="monospace" fontWeight="900">
                  HARD_DRIVE_MOUNTED
                </text>
                <text x={0} y={60} fill="#FFFFFF" fontSize={36} fontFamily="sans-serif" fontWeight="900">
                  8 BILLION AI AGENTS
                </text>
                <text x={0} y={115} fill="#10B981" fontSize={28} fontFamily="monospace" fontWeight="bold">
                  MEMORY READ/WRITE: OK
                </text>
              </g>
            </g>
          )}

          {/* CHUNK 5, STAGE 2: FINAL SUBSCRIBE COMMAND TERMINAL */}
          {chunk === 5 && stage === 2 && (
            <g>
              <rect x={-370} y={-135} width={740} height={250} rx={26} fill="rgba(244,63,94,0.16)" stroke={accent} strokeWidth={5} filter="url(#neon-glow)" />
              <text x={0} y={-45} textAnchor="middle" fill="#00F0FF" fontSize={32} fontFamily="monospace" fontWeight="900" letterSpacing={4}>
                CONSCIOUSNESS DIAGNOSTIC: PASSED
              </text>
              <text x={0} y={35} textAnchor="middle" fill="#FFFFFF" fontSize={58} fontFamily="sans-serif" fontWeight="900">
                SUBSCRIBE · ATOM STICKMAN
              </text>
              <text x={0} y={90} textAnchor="middle" fill={accent} fontSize={28} fontFamily="monospace" fontWeight="bold">
                [ QUESTION YOUR REALITY ]
              </text>
            </g>
          )}
        </g>

        {/* Bottom Telemetry Status Strip Inside Callout Screen */}
        <line x1={-452} y1={275} x2={452} y2={275} stroke={`${accent}66`} strokeWidth={2} />
        <g transform="translate(-415, 315)">
          <text x={0} y={0} fill="#94A3B8" fontSize={21} fontFamily="monospace">
            {`TELEMETRY_STREAM: LIVE // FRAME_${String(frame).padStart(5, '0')}`}
          </text>
          <text x={830} y={0} textAnchor="end" fill={accent} fontSize={21} fontFamily="monospace" fontWeight="bold">
            LOCK_CONFIRMED ●
          </text>
        </g>
      </g>
    </g>
  );
};

// ============================================================================
// 7. MASTER COMPOSITOR (FULL-SCREEN 2.5D CAMERA + HUD + SUBTITLES)
// ============================================================================

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const overallProgress = clamp(frame / TOTAL_FRAMES);

  // Locate active audio chunk (0..5) and stage (0..2)
  let activeChunk = 0;
  for (let i = 0; i < 6; i++) {
    if (sec >= CHUNK_START_SEC[i]) activeChunk = i;
  }

  const chunkElapsed = Math.max(0, sec - CHUNK_START_SEC[activeChunk]);
  const chunkDuration = CHUNK_DURATIONS_SEC[activeChunk];
  const stageDuration = chunkDuration / 3;
  const activeStage = Math.min(2, Math.floor(chunkElapsed / stageDuration));

  const stageElapsed = chunkElapsed - activeStage * stageDuration;
  const localFrame = Math.floor(stageElapsed * FPS);
  const stageDurationFrames = Math.floor(stageDuration * FPS);

  const meta =
    SCENES.find((s) => s.chunk === activeChunk && s.stage === activeStage) || SCENES[0];

  // Smooth 2.5D Camera Motion: Starts slightly zoomed on Macro Object, then settles full-screen
  const camScale = interpolate(localFrame, [0, 45, stageDurationFrames], [1.08, 1.0, 1.03], {
    easing: Easing.out(Easing.cubic),
  });
  const camY = interpolate(localFrame, [0, 45], [55, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const subPop = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 14, stiffness: 220 },
  });

  const seamFlash = localFrame < 6 ? interpolate(localFrame, [0, 6], [0.45, 0]) : 0;
  const parts = meta.subtitle.split(meta.highlight);

  return (
    <AbsoluteFill style={{ backgroundColor: '#02040A', overflow: 'hidden' }}>
      {/*
        ====================================================================
        AUDIO SETUP:
        Merge your 6 audio files in order (studio_voice.wav, (1), (2), (3), (4), (5))
        into public/voice.mp3 and uncomment below:
        <Audio src={staticFile('voice.mp3')} />
        ====================================================================
      */}

      {/* Radial Deep Space Atmosphere */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 26%, ${meta.accent}28 0%, ${meta.secondary}12 38%, #030611 72%, #010206 100%)`,
        }}
      />

      <svg
        width={W}
        height={H}
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${camY}px) scale(${camScale})`,
        }}
      >
        <defs>
          {/* Real SVG Neon Bloom Filter */}
          <filter id="neon-glow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Futuristic Glassmorphic Panel Gradient */}
          <linearGradient id="hud-glass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B152C" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#060B18" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0E1B38" stopOpacity="0.95" />
          </linearGradient>

          <pattern id="cyber-grid" width="90" height="90" patternUnits="userSpaceOnUse">
            <path d="M 90 0 L 0 0 0 90" fill="none" stroke={meta.accent} strokeWidth="1" opacity="0.12" />
          </pattern>
        </defs>

        {/* Background Technical Grid */}
        <rect width={W} height={H} fill="url(#cyber-grid)" />

        {/* 1. PLEXUS PARTICLE NETWORK */}
        <PlexusParticleField frame={frame} accent={meta.accent} secondary={meta.secondary} />

        {/* 2. UPPER MACRO 3D HOLOGRAM */}
        <MacroHologramStage
          chunk={activeChunk}
          stage={activeStage}
          frame={frame}
          localFrame={localFrame}
          accent={meta.accent}
          secondary={meta.secondary}
        />

        {/* 3. LASER LEADER LINE & FUTURISTIC CALLOUT MICRO-SCREEN */}
        <FuturisticCalloutScreen
          meta={meta}
          frame={frame}
          localFrame={localFrame}
          stageDurationFrames={stageDurationFrames}
        />
      </svg>

      {/* 4. TOP DOCUMENTARY TELEMETRY HEADER */}
      <svg width={W} height={190} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        <g transform="translate(48, 45)">
          <rect
            x={0}
            y={0}
            width={984}
            height={96}
            rx={16}
            fill="rgba(5, 10, 22, 0.9)"
            stroke={meta.accent}
            strokeWidth={3}
          />
          {Array.from({ length: 6 }).map((_, c) => (
            <rect
              key={c}
              x={18 + c * 159}
              y={14}
              width={151}
              height={8}
              rx={4}
              fill={c < activeChunk ? meta.accent : c === activeChunk ? '#FFFFFF' : '#1E293B'}
            />
          ))}
          <text x={24} y={66} fill={meta.accent} fontSize={23} fontFamily="monospace" fontWeight="900">
            {meta.code}
          </text>
          <text x={960} y={66} textAnchor="end" fill="#FFFFFF" fontSize={24} fontFamily="monospace" fontWeight="900">
            {meta.macroTitle}
          </text>
        </g>
      </svg>

      {/* 5. BURNED-IN HIGH-RETENTION SUBTITLE BAR */}
      <div
        style={{
          position: 'absolute',
          bottom: 72,
          left: 48,
          right: 48,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${interpolate(subPop, [0, 1], [0.88, 1])})`,
        }}
      >
        <div
          style={{
            background: 'rgba(4, 8, 18, 0.95)',
            border: `3.5px solid ${meta.accent}`,
            borderRadius: 24,
            padding: '24px 36px',
            boxShadow: `0 16px 45px rgba(0,0,0,0.92), 0 0 32px ${meta.accent}55`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              color: '#F8FAFC',
              fontSize: 40,
              fontWeight: 900,
              fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif",
              lineHeight: 1.32,
            }}
          >
            {parts[0]}
            <span
              style={{
                color: meta.accent,
                textDecoration: 'underline',
                textShadow: `0 0 20px ${meta.accent}`,
              }}
            >
              {meta.highlight}
            </span>
            {parts[1] || ''}
          </span>
        </div>
      </div>

      {/* Master Progress Bar at Bottom Edge */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 48,
          width: 984,
          height: 6,
          backgroundColor: '#0F172A',
          borderRadius: 3,
        }}
      >
        <div
          style={{
            width: `${overallProgress * 100}%`,
            height: '100%',
            backgroundColor: meta.accent,
            borderRadius: 3,
            boxShadow: `0 0 14px ${meta.accent}`,
          }}
        />
      </div>

      {/* Subtle FlashCut Transition */}
      {seamFlash > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: meta.accent,
            opacity: seamFlash,
            pointerEvents: 'none',
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ============================================================================
// 8. REMOTION ROOT REGISTRATION
// ============================================================================

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
