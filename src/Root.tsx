import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  // Audio, Sequence, staticFile // Uncomment when adding audio in public/
} from 'remotion';

// ============================================================================
// 1. AUDIO CHUNK DURATION CONFIG (AUTO-SYNCS ALL 24 SCENES & SUBTITLES)
// Order of your uploaded audio files:
// Chunk 1 = File 1 (Intro)
// Chunk 2 = File 6 (Pixels / Planck Length)
// Chunk 3 = File 4 (Double Slit Experiment)
// Chunk 4 = File 5 (Speed of Light / CPU Clock)
// Chunk 5 = File 2 (DNA Error-Correcting Code)
// Chunk 6 = File 3 (Future Ancestor AI / Outro)
// ============================================================================

const FPS = 60;
const W = 1080;
const H = 1920;

// Adjust any number here if your specific audio file is slightly shorter/longer
const CHUNK_DURATIONS_SEC = [24, 24, 24, 24, 24, 24];

const CHUNK_START_SEC = CHUNK_DURATIONS_SEC.reduce<number[]>((acc, _, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + CHUNK_DURATIONS_SEC[i - 1]);
  return acc;
}, []);

const TOTAL_SECONDS = CHUNK_DURATIONS_SEC.reduce((a, b) => a + b, 0);
const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);

// ============================================================================
// 2. DETERMINISTIC ENGINE (NO Math.random() - 100% REPRODUCIBLE)
// ============================================================================

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// 12 FPS Hand-Drawn Boiling Linework Jitter
function boil(frame: number, seed: number, amp = 2.4): number {
  const step = Math.floor(frame / 5);
  return (hash(step * 97.3 + seed * 31.7) - 0.5) * 2 * amp;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

// ============================================================================
// 3. 24 SYNCHRONIZED SUBTITLES (4 PER AUDIO CHUNK = 24 SUB-SCENES)
// ============================================================================

interface SubItem {
  chunk: number;
  subIdx: number; // 0, 1, 2, 3 within the chunk
  title: string;
  metric: string;
  accent: string;
  text: string;
  hi: string;
}

const SUB_SCENES: SubItem[] = [
  // CHUNK 1: INTRO & SIMULATION HOOK
  { chunk: 0, subIdx: 0, title: 'REALITY_CHECK.EXE', metric: 'SYS: ONLINE', accent: '#00F0FF', text: 'क्या आपकी पूरी ज़िंदगी और यह दुनिया सिर्फ़ एक COMPUTER PROGRAM है?', hi: 'COMPUTER PROGRAM' },
  { chunk: 0, subIdx: 1, title: 'PROBABILITY MATRIX', metric: 'ODDS: 99.9%', accent: '#F59E0B', text: 'Top Scientists और ELON MUSK मानते हैं हम एक Video Game में जी रहे हैं!', hi: 'ELON MUSK' },
  { chunk: 0, subIdx: 2, title: 'SIMULATION THEORY', metric: 'CORE: ACTIVE', accent: '#A855F7', text: 'Science में इसे SIMULATION THEORY कहते हैं—आइए इसे decode करें।', hi: 'SIMULATION THEORY' },
  { chunk: 0, subIdx: 3, title: 'AI CONSCIOUSNESS', metric: 'NODE: HUMAN', accent: '#FF2D55', text: 'क्या हम सच में ARTIFICIAL INTELLIGENCE का एक हिस्सा हैं? आइए देखते हैं!', hi: 'ARTIFICIAL INTELLIGENCE' },

  // CHUNK 2: PROOF 1 - PIXELS & PLANCK LENGTH
  { chunk: 1, subIdx: 0, title: 'PROOF #01 · PIXELS', metric: 'ZOOM: 1000x', accent: '#00F0FF', text: 'पहला सबूत: किसी भी game में पास से देखने पर छोटे PIXELS दिखाई देते हैं।', hi: 'PIXELS' },
  { chunk: 1, subIdx: 1, title: 'VOXEL GEOMETRY', metric: 'MESH: BLOCKS', accent: '#10B981', text: 'Graphics कितने भी real हों, एक limit के बाद सब BLOCKS में बदल जाता है।', hi: 'BLOCKS' },
  { chunk: 1, subIdx: 2, title: 'PLANCK LENGTH', metric: '1.6 × 10⁻³⁵ m', accent: '#F59E0B', text: 'Quantum Physics के अनुसार हमारे Universe का भी एक pixel है—PLANCK LENGTH!', hi: 'PLANCK LENGTH!' },
  { chunk: 1, subIdx: 3, title: 'RESOLUTION LIMIT', metric: 'MIN_RES: LOCKED', accent: '#FF2D55', text: 'क्या यह हमारे Universe का MINIMUM PIXEL RESOLUTION है?', hi: 'MINIMUM PIXEL RESOLUTION' },

  // CHUNK 3: PROOF 2 - DOUBLE SLIT & RENDER OPTIMIZATION
  { chunk: 2, subIdx: 0, title: 'PROOF #02 · QUANTUM', metric: 'SLIT_TEST: ON', accent: '#A855F7', text: 'दूसरा सबूत और भी shocking है—जिसे DOUBLE SLIT EXPERIMENT कहते हैं!', hi: 'DOUBLE SLIT EXPERIMENT' },
  { chunk: 2, subIdx: 1, title: 'FRUSTUM CULLING', metric: 'VRAM SAVED: 78%', accent: '#10B981', text: 'Memory बचाने के लिए game engine सिर्फ़ वही RENDER करता है जो player देखता है।', hi: 'RENDER' },
  { chunk: 2, subIdx: 2, title: 'WAVE FUNCTION', metric: 'STATE: UNOBSERVED', accent: '#00F0FF', text: 'हमारे particles भी तब तक रूप नहीं लेते, जब तक कोई उन्हें OBSERVE न करे!', hi: 'OBSERVE' },
  { chunk: 2, subIdx: 3, title: 'REALITY COLLAPSE', metric: 'STATE: SOLID', accent: '#FF2D55', text: 'जैसे ही हम देखते हैं, वे अचानक SOLID REALITY में render हो जाते हैं!', hi: 'SOLID REALITY' },

  // CHUNK 4: PROOF 3 - SPEED OF LIGHT & CPU CLOCK SPEED
  { chunk: 3, subIdx: 0, title: 'PROOF #03 · LIGHT SPEED', metric: '299,792 KM/S', accent: '#F59E0B', text: 'तीसरा सबूत: Speed of Light 3 LAKH KM/SEC पर फिक्स की गई है।', hi: '3 LAKH KM/SEC' },
  { chunk: 3, subIdx: 1, title: 'RELATIVITY WALL', metric: 'LIMIT: MAX', accent: '#FF2D55', text: 'Einstein के मुताबिक़ कोई भी चीज़ इस SPEED LIMIT को पार नहीं कर सकती।', hi: 'SPEED LIMIT' },
  { chunk: 3, subIdx: 2, title: 'COSMIC PROCESSOR', metric: 'CLOCK: MAX GHz', accent: '#00F0FF', text: 'Light की speed ही हमारे Universe के Processor की MAXIMUM CLOCK SPEED है!', hi: 'MAXIMUM CLOCK SPEED' },
  { chunk: 3, subIdx: 3, title: 'HARDCODED LIMIT', metric: 'CONST: LOCKED', accent: '#10B981', text: 'Hardware क्रैश से बचाने के लिए इस स्पीड को HARDCODE किया गया है।', hi: 'HARDCODE' },

  // CHUNK 5: PROOF 4 - DNA ERROR-CORRECTING CODE
  { chunk: 4, subIdx: 0, title: 'PROOF #04 · DNA CODE', metric: 'HELIX: BINARY', accent: '#10B981', text: 'चौथा सबूत: वैज्ञानिकों को इंसानी DNA में ERROR-CORRECTING CODES मिले हैं!', hi: 'ERROR-CORRECTING CODES' },
  { chunk: 4, subIdx: 1, title: 'SHANNON PARITY 1940', metric: 'BIT_CHECK: OK', accent: '#00F0FF', text: 'यह वही computer codes हैं जो CLAUDE SHANNON ने 1940s में बनाए थे।', hi: 'CLAUDE SHANNON' },
  { chunk: 4, subIdx: 2, title: 'BIO-SOFTWARE MATCH', metric: 'MATCH: 99.99%', accent: '#A855F7', text: 'Biological DNA के अंदर सेम MATHEMATICAL SOFTWARE CODE मिलना इत्तेफ़ाक़ नहीं है!', hi: 'MATHEMATICAL SOFTWARE CODE' },
  { chunk: 4, subIdx: 3, title: 'THE PROGRAMMER', metric: 'AUTHOR: UNKNOWN', accent: '#F59E0B', text: 'क्या किसी SUPER-INTELLIGENT PROGRAMMER ने हमारे जेनेटिक्स का कोड लिखा है?', hi: 'SUPER-INTELLIGENT PROGRAMMER' },

  // CHUNK 6: CONCLUSION - ANCESTOR SIMULATION & OUTRO
  { chunk: 5, subIdx: 0, title: 'THE ARCHITECTS', metric: 'ERA: FUTURE', accent: '#00F0FF', text: 'तो यह Simulation किसने बनाया? शायद FUTURE के इंसानों ने अपने past को देखने के लिए!', hi: 'FUTURE के इंसानों' },
  { chunk: 5, subIdx: 1, title: 'COSMIC HARD DRIVE', metric: 'DRIVE: ACTIVE', accent: '#A855F7', text: 'हम उन्हीं के AI MODELS हैं और एक विशाल Hard Drive के अंदर जी रहे हैं।', hi: 'AI MODELS' },
  { chunk: 5, subIdx: 2, title: 'CODE DIAGNOSTIC', metric: 'STATUS: AWAKE', accent: '#10B981', text: 'अगर आप यह सोच पा रहे हैं, तो आपका CODE बिल्कुल सही काम कर रहा है!', hi: 'CODE' },
  { chunk: 5, subIdx: 3, title: '@ATOM_STICKMAN', metric: 'SUBSCRIBE NOW', accent: '#FF2D55', text: 'Reality के dark secrets जानने के लिए ATOM STICKMAN को अभी Subscribe करें!', hi: 'ATOM STICKMAN' },
];

// ============================================================================
// 4. ULTRA-DETAILED CYBERPUNK MATRIX ENVIRONMENT & HUD
// ============================================================================

const MatrixHudBackdrop: React.FC<{
  frame: number;
  accent: string;
  chunkIdx: number;
  subIdx: number;
  title: string;
  metric: string;
  overallProgress: number;
}> = ({ frame, accent, chunkIdx, subIdx, title, metric, overallProgress }) => {
  const sec = frame / FPS;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Deep Cyber-Void Atmosphere */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 42%, ${accent}26 0%, #060913 58%, #020307 100%)`,
        }}
      />

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {/* Digital Binary Data Rain Columns in Background */}
        <g opacity={0.14} fontFamily="monospace" fontSize={20} fontWeight="bold" fill={accent}>
          {Array.from({ length: 18 }).map((_, col) => {
            const x = 40 + col * 58;
            const speed = 1.5 + (col % 4) * 0.8;
            const yOffset = (frame * speed + col * 190) % 1920;
            return (
              <g key={col} transform={`translate(${x}, ${yOffset - 300})`}>
                {Array.from({ length: 8 }).map((__, row) => {
                  const bit = hash(col * 31 + row * 17 + Math.floor(frame / 10)) > 0.5 ? '1' : '0';
                  return (
                    <text key={row} x={0} y={row * 34} opacity={(row + 1) / 8}>
                      {bit}
                    </text>
                  );
                })}
              </g>
            );
          })}
        </g>

        {/* 3D Perspective Floor & Ceiling Grid */}
        <g opacity={0.26} stroke={accent} strokeWidth={1.6}>
          {Array.from({ length: 15 }).map((_, i) => {
            const spread = (i - 7) * 210;
            return (
              <React.Fragment key={i}>
                <line x1={540 + spread * 0.14} y1={1240} x2={540 + spread} y2={1920} />
                <line x1={540 + spread * 0.14} y1={340} x2={540 + spread} y2={0} opacity={0.35} />
              </React.Fragment>
            );
          })}
          {Array.from({ length: 9 }).map((_, i) => {
            const p = ((frame * 2.2 + i * 75) % 675) / 675;
            const y = 1240 + Math.pow(p, 1.85) * 680;
            return <line key={i} x1={0} y1={y} x2={W} y2={y} opacity={p * 0.9} />;
          })}
        </g>

        {/* Top Chapter Progress Bar & Telemetry Header */}
        <g transform="translate(55, 60)">
          <rect x={0} y={0} width={970} height={92} rx={16} fill="rgba(7, 11, 22, 0.9)" stroke={accent} strokeWidth={3} />
          {/* 6 Chapter Segments */}
          {Array.from({ length: 6 }).map((_, c) => {
            const segW = 152;
            const sx = 16 + c * 158;
            const isDone = c < chunkIdx;
            const isCurrent = c === chunkIdx;
            return (
              <rect
                key={c}
                x={sx}
                y={14}
                width={segW}
                height={10}
                rx={5}
                fill={isDone ? accent : isCurrent ? '#FFFFFF' : '#1E293B'}
                opacity={isCurrent ? 0.6 + Math.sin(sec * 12) * 0.4 : 1}
              />
            );
          })}
          <circle cx={34} cy={60} r={10} fill={accent} />
          <text x={58} y={68} fill="#FFFFFF" fontSize={25} fontFamily="monospace" fontWeight="900" letterSpacing={2}>
            {`CH.0${chunkIdx + 1}.${subIdx + 1} // ${title}`}
          </text>
          <text x={945} y={68} textAnchor="end" fill={accent} fontSize={25} fontFamily="monospace" fontWeight="900">
            {metric}
          </text>
        </g>

        {/* Overall Video Master Timeline Scrub Bar */}
        <rect x={55} y={1855} width={970} height={8} rx={4} fill="#1E293B" />
        <rect x={55} y={1855} width={970 * overallProgress} height={8} rx={4} fill={accent} />
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================================
// 5. ARTICULATED ATOM STICKMAN RIG (WITH 12FPS BOIL & GLOWING ATOM CORE)
// ============================================================================

const AtomStickmanRig: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale?: number;
  rot?: number;
  pose: 'inspect' | 'mindblown' | 'floating' | 'turning' | 'scanning' | 'hero';
  accent: string;
}> = ({ frame, x, y, scale = 1, rot = 0, pose, accent }) => {
  const b = (seed: number, amp = 2.5) => boil(frame, seed, amp);
  const floatY = pose === 'floating' ? Math.sin(frame * 0.08) * 24 : Math.sin(frame * 0.1) * 6;

  const headX = b(1, 2);
  const headY = -225 + b(2, 2);

  const armMap = {
    inspect: { l: [-75, -135, -135, -65], r: [85, -155, 165, -210] },
    mindblown: { l: [-95, -165, -70, -250], r: [95, -165, 70, -250] },
    floating: { l: [-95, -110, -165, -150], r: [95, -110, 165, -150] },
    turning: { l: [-55, -125, -120, -90], r: [95, -135, 185, -135] },
    scanning: { l: [-70, -120, -95, -20], r: [85, -150, 145, -185] },
    hero: { l: [-80, -115, -130, -15], r: [80, -115, 130, -15] },
  }[pose];

  return (
    <g transform={`translate(${x}, ${y + floatY}) rotate(${rot + b(9, 0.7)}) scale(${scale})`}>
      {/* Holographic Floor Ring Under Character */}
      <ellipse cx={0} cy={175} rx={115} ry={24} fill="none" stroke={accent} strokeWidth={3} strokeDasharray="16 10" opacity={0.6} />
      <ellipse cx={0} cy={175} rx={85} ry={16} fill={accent} opacity={0.18} />

      {/* Torso Spine */}
      <path
        d={`M ${headX} ${headY + 80} Q ${b(10, 4)} -75 ${b(11, 3)} 20`}
        stroke="#F8FAFC"
        strokeWidth={16}
        strokeLinecap="round"
        fill="none"
      />

      {/* Signature Glowing Atom Core on Chest */}
      <g transform={`translate(${b(12, 1.5)}, ${-88 + b(13, 1.5)})`}>
        {[0, 60, 120].map((deg, i) => {
          const ang = (frame * 0.1 + i * 2.09) % (Math.PI * 2);
          return (
            <g key={i} transform={`rotate(${deg})`}>
              <ellipse cx={0} cy={0} rx={74} ry={25} fill="none" stroke={accent} strokeWidth={3.5} opacity={0.85} />
              <circle cx={Math.cos(ang) * 74} cy={Math.sin(ang) * 25} r={6.5} fill="#FFFFFF" stroke={accent} strokeWidth={3} />
            </g>
          );
        })}
        <circle cx={0} cy={0} r={14} fill={accent} />
        <circle cx={0} cy={0} r={6} fill="#FFFFFF" />
      </g>

      {/* Arms */}
      <path
        d={`M 0 -130 Q ${armMap.l[0] + b(20, 3)} ${armMap.l[1]} ${armMap.l[2] + b(21, 4)} ${armMap.l[3]}`}
        stroke="#F8FAFC"
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M 0 -130 Q ${armMap.r[0] + b(22, 3)} ${armMap.r[1]} ${armMap.r[2] + b(23, 4)} ${armMap.r[3]}`}
        stroke="#F8FAFC"
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />

      {/* Legs */}
      <path
        d={`M 0 20 Q ${-55 + b(30, 3)} 95 ${-70 + b(31, 3)} 170`}
        stroke="#F8FAFC"
        strokeWidth={15}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M 0 20 Q ${55 + b(32, 3)} 95 ${70 + b(33, 3)} 170`}
        stroke="#F8FAFC"
        strokeWidth={15}
        strokeLinecap="round"
        fill="none"
      />

      {/* Head */}
      <circle cx={headX} cy={headY} r={80 + b(40, 1.4)} fill="#0B101E" stroke="#F8FAFC" strokeWidth={12} />
      <circle cx={headX} cy={headY} r={86} fill="none" stroke={accent} strokeWidth={2.5} opacity={0.55} />

      {/* Expressive Cyber Eyes */}
      <ellipse cx={headX - 27} cy={headY - 6} rx={20} ry={pose === 'mindblown' ? 25 : 19} fill="#FFFFFF" />
      <ellipse cx={headX + 27} cy={headY - 6} rx={20} ry={pose === 'mindblown' ? 25 : 19} fill="#FFFFFF" />
      <circle cx={headX - 27 + b(41, 1.5)} cy={headY - 6} r={10} fill={accent} />
      <circle cx={headX + 27 + b(42, 1.5)} cy={headY - 6} r={10} fill={accent} />
      <circle cx={headX - 27} cy={headY - 6} r={4} fill="#020617" />
      <circle cx={headX + 27} cy={headY - 6} r={4} fill="#020617" />

      {/* Mouth */}
      {pose === 'mindblown' ? (
        <ellipse cx={headX} cy={headY + 38} rx={16} ry={20} fill={accent} stroke="#F8FAFC" strokeWidth={4} />
      ) : (
        <path
          d={`M ${headX - 22} ${headY + 36} Q ${headX} ${headY + 46} ${headX + 22} ${headY + 36}`}
          stroke="#F8FAFC"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
};

// ============================================================================
// 6. 24 BESPOKE SCIENTIFIC VISUAL ENGINES (1 FOR EVERY SUB-SCENE)
// ============================================================================

const SceneVisualRouter: React.FC<{
  chunk: number;
  subIdx: number;
  localFrame: number;
  subDurationFrames: number;
  globalFrame: number;
  accent: string;
}> = ({ chunk, subIdx, localFrame, subDurationFrames, globalFrame, accent }) => {
  const p = clamp(localFrame / subDurationFrames);
  const pop = spring({ frame: localFrame, fps: FPS, config: { damping: 13, stiffness: 160 } });
  const sec = globalFrame / FPS;

  // ------------------------------------------------------------------------
  // CHUNK 0: SIMULATION HOOK (4 SUB-SHOTS)
  // ------------------------------------------------------------------------
  if (chunk === 0) {
    if (subIdx === 0) {
      // 1A: Wireframe Globe Dissolving Into Matrix Code Blocks
      return (
        <svg width={W} height={H}>
          <g transform={`translate(540, 660) scale(${0.85 + pop * 0.15})`}>
            <circle cx={0} cy={0} r={270} fill="rgba(0,240,255,0.06)" stroke="#00F0FF" strokeWidth={5} strokeDasharray="30 15" />
            {[-160, -80, 0, 80, 160].map((lat, i) => (
              <ellipse key={i} cx={0} cy={lat} rx={Math.sqrt(Math.max(10, 270 * 270 - lat * lat))} ry={36} fill="none" stroke="#00F0FF" strokeWidth={3} opacity={0.65} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <ellipse key={i} cx={0} cy={0} rx={45 + i * 38} ry={270} fill="none" stroke="#00F0FF" strokeWidth={2.5} opacity={0.5} transform={`rotate(${sec * 15 + i * 30})`} />
            ))}
            <text x={0} y={12} textAnchor="middle" fill="#FFFFFF" fontSize={44} fontFamily="monospace" fontWeight="900">
              WORLD_SIM.v9.4
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1290} scale={1.15} pose="inspect" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 1) {
      // 1B: Elon Musk / Scientist Simulation Probability Gauge (99.9%)
      const pct = interpolate(localFrame, [0, subDurationFrames * 0.65], [12.4, 99.9], { extrapolateRight: 'clamp' }).toFixed(1);
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 640)">
            <rect x={-410} y={-230} width={820} height={460} rx={32} fill="#0B1222" stroke="#F59E0B" strokeWidth={6} />
            <text x={0} y={-135} textAnchor="middle" fill="#F59E0B" fontSize={32} fontFamily="monospace" fontWeight="bold" letterSpacing={3}>
              BASE REALITY ODDS: 1 IN BILLIONS
            </text>
            <text x={0} y={35} textAnchor="middle" fill="#FFFFFF" fontSize={145} fontFamily="monospace" fontWeight="900">
              {`${pct}%`}
            </text>
            <text x={0} y={125} textAnchor="middle" fill="#10B981" fontSize={36} fontFamily="sans-serif" fontWeight="900">
              PROBABILITY WE ARE IN A GAME
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1290} scale={1.15} pose="mindblown" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 2) {
      // 1C: 3D Rotating Hologram Hypercube (Tesseract) Around Stickman
      const vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
      ];
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];
      const aY = sec * 1.4;
      const aX = sec * 0.9;
      const project = ([vx, vy, vz]: number[], size: number) => {
        const x1 = vx * Math.cos(aY) - vz * Math.sin(aY);
        const z1 = vx * Math.sin(aY) + vz * Math.cos(aY);
        const y2 = vy * Math.cos(aX) - z1 * Math.sin(aX);
        const z2 = vy * Math.sin(aX) + z1 * Math.cos(aX);
        const s = 700 / (700 - z2 * size);
        return [x1 * size * s, y2 * size * s];
      };
      const outerPts = vertices.map((v) => project(v, 220));
      const innerPts = vertices.map((v) => project(v, 110));

      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 680)">
            {edges.map(([e1, e2], idx) => (
              <React.Fragment key={idx}>
                <line x1={outerPts[e1][0]} y1={outerPts[e1][1]} x2={outerPts[e2][0]} y2={outerPts[e2][1]} stroke="#A855F7" strokeWidth={5} />
                <line x1={innerPts[e1][0]} y1={innerPts[e1][1]} x2={innerPts[e2][0]} y2={innerPts[e2][1]} stroke="#00F0FF" strokeWidth={4} />
              </React.Fragment>
            ))}
            {outerPts.map((pt, idx) => (
              <line key={idx} x1={pt[0]} y1={pt[1]} x2={innerPts[idx][0]} y2={innerPts[idx][1]} stroke="#FFFFFF" strokeWidth={2} opacity={0.5} />
            ))}
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1290} scale={1.15} pose="floating" accent={accent} />
        </svg>
      );
    }
    // 1D: AI Puppet Control Strings Attached to Stickman
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 290)">
          <rect x={-340} y={-50} width={680} height={100} rx={20} fill="#1E1028" stroke="#FF2D55" strokeWidth={5} />
          <text x={0} y={15} textAnchor="middle" fill="#FF2D55" fontSize={40} fontFamily="monospace" fontWeight="900">
            AI_AGENT_CONTROLLER // NPC_01
          </text>
        </g>
        {/* Glowing Laser Puppet Strings */}
        {[
          [320, 340, 390, 1130],
          [540, 340, 540, 1050],
          [760, 340, 690, 1130],
          [420, 340, 470, 1440],
          [660, 340, 610, 1440],
        ].map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF2D55" strokeWidth={4} strokeDasharray="14 10" />
            <circle cx={x2} cy={y2} r={14} fill="#FF2D55" />
          </g>
        ))}
        <AtomStickmanRig frame={globalFrame} x={540} y={1270} scale={1.2} pose="floating" accent={accent} />
      </svg>
    );
  }

  // ------------------------------------------------------------------------
  // CHUNK 1: PROOF 1 - PIXELS & PLANCK LENGTH (4 SUB-SHOTS)
  // ------------------------------------------------------------------------
  if (chunk === 1) {
    if (subIdx === 0) {
      // 2A: Magnifying Loupe Revealing RGB Pixel Matrix
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 660)">
            <circle cx={0} cy={0} r={310} fill="#09101D" stroke="#00F0FF" strokeWidth={12} />
            {Array.from({ length: 7 }).map((_, r) =>
              Array.from({ length: 7 }).map((__, c) => {
                const px = (c - 3) * 68;
                const py = (r - 3) * 68;
                if (px * px + py * py > 250 * 250) return null;
                return (
                  <g key={`${r}-${c}`} transform={`translate(${px - 26}, ${py - 26})`}>
                    <rect x={0} y={0} width={16} height={52} rx={4} fill="#FF2D55" />
                    <rect x={18} y={0} width={16} height={52} rx={4} fill="#10B981" />
                    <rect x={36} y={0} width={16} height={52} rx={4} fill="#3B82F6" />
                  </g>
                );
              })
            )}
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1300} scale={1.1} pose="inspect" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 1) {
      // 2B: Smooth Sphere Morphing Into 3D Voxel Blocks
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 670)">
            {Array.from({ length: 9 }).map((_, r) =>
              Array.from({ length: 9 }).map((__, c) => {
                const dx = c - 4;
                const dy = r - 4;
                if (dx * dx + dy * dy > 18) return null;
                const jiggle = Math.sin(sec * 6 + r + c) * 6;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={dx * 58 - 26}
                    y={dy * 58 - 26 + jiggle}
                    width={52}
                    height={52}
                    rx={6}
                    fill="#10B981"
                    stroke="#052E16"
                    strokeWidth={4}
                  />
                );
              })
            )}
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1300} scale={1.1} pose="scanning" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 2) {
      // 2C: Quantum Laser Caliper Measuring Planck Length (1.6 x 10^-35 m)
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 660)">
            <line x1={-360} y1={-160} x2={-360} y2={160} stroke="#F59E0B" strokeWidth={10} />
            <line x1={360} y1={-160} x2={360} y2={160} stroke="#F59E0B" strokeWidth={10} />
            <line x1={-360} y1={0} x2={360} y2={0} stroke="#00F0FF" strokeWidth={6} strokeDasharray="16 12" />
            <circle cx={0} cy={0} r={45 + Math.sin(sec * 12) * 10} fill="#F59E0B" />
            <circle cx={0} cy={0} r={18} fill="#FFFFFF" />
            <rect x={-330} y={-240} width={660} height={95} rx={16} fill="#111827" stroke="#F59E0B" strokeWidth={4} />
            <text x={0} y={-178} textAnchor="middle" fill="#F59E0B" fontSize={46} fontFamily="monospace" fontWeight="900">
              PLANCK PIXEL: 1.6 × 10⁻³⁵ m
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1300} scale={1.15} pose="mindblown" accent={accent} />
        </svg>
      );
    }
    // 2D: Minimum Resolution Limit Warning HUD
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 660)">
          <rect x={-420} y={-220} width={840} height={440} rx={24} fill="#1A0B16" stroke="#FF2D55" strokeWidth={6} />
          <text x={0} y={-85} textAnchor="middle" fill="#FF2D55" fontSize={40} fontFamily="monospace" fontWeight="900">
            ⚠️ SPACE-TIME LIMIT REACHED
          </text>
          <text x={0} y={20} textAnchor="middle" fill="#FFFFFF" fontSize={68} fontFamily="sans-serif" fontWeight="900">
            UNIVERSE RESOLUTION
          </text>
          <text x={0} y={115} textAnchor="middle" fill="#00F0FF" fontSize={44} fontFamily="monospace" fontWeight="bold">
            NO SUB-PLANCK DATA EXISTS
          </text>
        </g>
        <AtomStickmanRig frame={globalFrame} x={540} y={1300} scale={1.15} pose="inspect" accent={accent} />
      </svg>
    );
  }

  // ------------------------------------------------------------------------
  // CHUNK 2: PROOF 2 - DOUBLE SLIT & FRUSTUM CULLING (4 SUB-SHOTS)
  // ------------------------------------------------------------------------
  if (chunk === 2) {
    if (subIdx === 0) {
      // 3A: Double Slit Particle Cannon
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 680)">
            {/* Barrier with Two Slits */}
            <rect x={-20} y={-280} width={40} height={160} fill="#A855F7" />
            <rect x={-20} y={-50} width={40} height={100} fill="#A855F7" />
            <rect x={-20} y={120} width={40} height={160} fill="#A855F7" />
            {/* Back Detector Wall */}
            <rect x={360} y={-280} width={28} height={560} fill="#1E293B" stroke="#00F0FF" strokeWidth={4} />
            {/* Firing Quantum Photons */}
            {Array.from({ length: 14 }).map((_, i) => {
              const prog = ((localFrame * 3 + i * 25) % 180) / 180;
              const px = interpolate(prog, [0, 1], [-380, 355]);
              const slitY = i % 2 === 0 ? -85 : 85;
              const py = prog < 0.5 ? interpolate(prog, [0, 0.5], [0, slitY]) : slitY + Math.sin(prog * 18 + i) * 95;
              return <circle key={i} cx={px} cy={py} r={12} fill="#00F0FF" />;
            })}
          </g>
          <AtomStickmanRig frame={globalFrame} x={240} y={1310} scale={1.1} pose="scanning" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 1) {
      // 3B: Game Engine Frustum Culling Radar (Rendered Front Cone vs Wireframe Back)
      const coneRot = Math.sin(sec * 2.2) * 35;
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 680)">
            <circle cx={0} cy={0} r={330} fill="#08111E" stroke="#334155" strokeWidth={4} strokeDasharray="16 12" />
            <g transform={`rotate(${coneRot})`}>
              {/* Active Player FOV Cone */}
              <path d="M 0 0 L 290 -180 A 330 330 0 0 1 290 180 Z" fill="rgba(16, 185, 129, 0.28)" stroke="#10B981" strokeWidth={5} />
              <rect x={140} y={-95} width={85} height={85} rx={10} fill="#10B981" />
              <rect x={165} y={20} width={75} height={75} rx={10} fill="#00F0FF" />
            </g>
            {/* Unrendered Culled Objects Behind Player */}
            <rect x={-230} y={-130} width={80} height={80} fill="none" stroke="#475569" strokeWidth={3} strokeDasharray="8 8" />
            <rect x={-210} y={50} width={80} height={80} fill="none" stroke="#475569" strokeWidth={3} strokeDasharray="8 8" />
            <circle cx={0} cy={0} r={28} fill="#FFFFFF" stroke="#10B981" strokeWidth={8} />
            <text x={0} y={285} textAnchor="middle" fill="#10B981" fontSize={32} fontFamily="monospace" fontWeight="900">
              FOV RENDERED · BEHIND UNLOADED
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.1} pose="turning" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 2) {
      // 3C: Unobserved Probability Wave Interference (Observer Eye CLOSED)
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 650)">
            <text x={0} y={-230} textAnchor="middle" fill="#00F0FF" fontSize={36} fontFamily="monospace" fontWeight="900">
              👁️ OBSERVER: OFF (PROBABILITY WAVE)
            </text>
            {[0, 1, 2].map((w) => (
              <path
                key={w}
                d={`M -420 0 Q -210 ${Math.sin(sec * 8 + w) * 220} 0 0 T 420 0`}
                fill="none"
                stroke={w === 0 ? '#00F0FF' : '#A855F7'}
                strokeWidth={8}
                opacity={0.8}
              />
            ))}
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1300} scale={1.15} pose="floating" accent={accent} />
        </svg>
      );
    }
    // 3D: Observer Eye OPENS -> Instant Collapse Into Solid Reality Bars
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 640)">
          <ellipse cx={0} cy={-110} rx={170} ry={95} fill="#0F172A" stroke="#FF2D55" strokeWidth={8} />
          <circle cx={0} cy={-110} r={52} fill="#FF2D55" />
          <circle cx={0} cy={-110} r={20} fill="#FFFFFF" />
          {/* Two Solid Rendered Particle Bands */}
          <rect x={-160} y={40} width={95} height={240} rx={14} fill="#00F0FF" stroke="#FFFFFF" strokeWidth={4} />
          <rect x={65} y={40} width={95} height={240} rx={14} fill="#00F0FF" stroke="#FFFFFF" strokeWidth={4} />
          <text x={0} y={345} textAnchor="middle" fill="#FFFFFF" fontSize={40} fontFamily="monospace" fontWeight="900">
            OBSERVED → SOLID MATTER RENDERED!
          </text>
        </g>
        <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="mindblown" accent={accent} />
      </svg>
    );
  }

  // ------------------------------------------------------------------------
  // CHUNK 3: PROOF 3 - SPEED OF LIGHT & CPU CLOCK SPEED (4 SUB-SHOTS)
  // ------------------------------------------------------------------------
  if (chunk === 3) {
    if (subIdx === 0) {
      // 4A: Cosmic Speedometer Locked at 300,000 km/s
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 680)">
            <path d="M -320 120 A 340 340 0 1 1 320 120" fill="none" stroke="#F59E0B" strokeWidth={26} strokeLinecap="round" />
            <line
              x1={0}
              y1={80}
              x2={240}
              y2={-110 + boil(globalFrame, 5, 8)}
              stroke="#FF2D55"
              strokeWidth={14}
              strokeLinecap="round"
            />
            <circle cx={0} cy={80} r={28} fill="#FFFFFF" />
            <text x={0} y={210} textAnchor="middle" fill="#FFFFFF" fontSize={74} fontFamily="monospace" fontWeight="900">
              3,00,000 KM/S
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="inspect" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 1) {
      // 4B: Einstein Speed Wall Barrier
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 660)">
            <rect x={220} y={-260} width={36} height={520} rx={10} fill="#FF2D55" />
            <circle cx={200} cy={0} r={60 + (localFrame % 30) * 5} fill="none" stroke="#FF2D55" strokeWidth={6} opacity={1 - (localFrame % 30) / 30} />
            <polygon points="-220,-65 185,0 -220,65" fill="#00F0FF" />
            <text x={0} y={320} textAnchor="middle" fill="#FF2D55" fontSize={44} fontFamily="monospace" fontWeight="900">
              EINSTEIN BARRIER: v ≤ c
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="scanning" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 2) {
      // 4C: Giant 64-Pin Quantum CPU Processor Chip
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 660)">
            {/* CPU Gold Pins */}
            {Array.from({ length: 10 }).map((_, i) => {
              const pos = -180 + i * 40;
              return (
                <React.Fragment key={i}>
                  <line x1={pos} y1={-280} x2={pos} y2={280} stroke="#F59E0B" strokeWidth={8} />
                  <line x1={-280} y1={pos} x2={280} y2={pos} stroke="#F59E0B" strokeWidth={8} />
                </React.Fragment>
              );
            })}
            <rect x={-210} y={-210} width={420} height={420} rx={28} fill="#0B1325" stroke="#00F0FF" strokeWidth={8} />
            <rect x={-130} y={-130} width={260} height={260} rx={16} fill="#111C38" stroke="#F59E0B" strokeWidth={4} />
            <text x={0} y={-15} textAnchor="middle" fill="#00F0FF" fontSize={36} fontFamily="monospace" fontWeight="900">
              UNIVERSE_CPU
            </text>
            <text x={0} y={40} textAnchor="middle" fill="#FFFFFF" fontSize={32} fontFamily="monospace" fontWeight="bold">
              MAX CLOCK: c
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="mindblown" accent={accent} />
        </svg>
      );
    }
    // 4D: Hardcoded System Constant Terminal
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 650)">
          <rect x={-430} y={-210} width={860} height={420} rx={24} fill="#06121C" stroke="#10B981" strokeWidth={6} />
          <text x={-380} y={-110} fill="#94A3B8" fontSize={30} fontFamily="monospace">
            // UNIVERSE ENGINE CONFIG
          </text>
          <text x={-380} y={-25} fill="#10B981" fontSize={38} fontFamily="monospace" fontWeight="900">
            const MAX_LIGHT_SPEED = 299792;
          </text>
          <text x={-380} y={55} fill="#F59E0B" fontSize={34} fontFamily="monospace" fontWeight="bold">
            Object.freeze(PHYSICS_ENGINE);
          </text>
          <text x={-380} y={140} fill="#FF2D55" fontSize={34} fontFamily="monospace" fontWeight="900">
            STATUS: HARDCODED BY ADMIN 🔒
          </text>
        </g>
        <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="inspect" accent={accent} />
      </svg>
    );
  }

  // ------------------------------------------------------------------------
  // CHUNK 4: PROOF 4 - DNA ERROR-CORRECTING CODE (4 SUB-SHOTS)
  // ------------------------------------------------------------------------
  if (chunk === 4) {
    if (subIdx === 0 || subIdx === 2) {
      // 5A & 5C: 3D Rotating Binary DNA Double-Helix
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 660)">
            {Array.from({ length: 16 }).map((_, i) => {
              const y = -310 + i * 42;
              const phase = sec * 3.5 + i * 0.45;
              const x1 = Math.sin(phase) * 190;
              const x2 = Math.sin(phase + Math.PI) * 190;
              return (
                <g key={i}>
                  <line x1={x1} y1={y} x2={x2} y2={y} stroke="#A855F7" strokeWidth={4} opacity={0.75} />
                  <circle cx={x1} cy={y} r={13} fill="#10B981" />
                  <circle cx={x2} cy={y} r={13} fill="#00F0FF" />
                  <text x={(x1 + x2) / 2} y={y + 6} textAnchor="middle" fill="#FFFFFF" fontSize={18} fontFamily="monospace" fontWeight="bold">
                    {i % 2 === 0 ? '101' : '010'}
                  </text>
                </g>
              );
            })}
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.12} pose="scanning" accent={accent} />
        </svg>
      );
    }
    if (subIdx === 1) {
      // 5B: Claude Shannon 1940s Error-Correcting Parity Bit Stream
      const fixed = p > 0.45;
      return (
        <svg width={W} height={H}>
          <g transform="translate(540, 650)">
            <text x={0} y={-190} textAnchor="middle" fill="#00F0FF" fontSize={36} fontFamily="monospace" fontWeight="900">
              SHANNON PARITY CHECKSUM (1948)
            </text>
            {['1', '0', '1', fixed ? '1' : 'ERR', '0', '1'].map((bit, i) => {
              const isTarget = i === 3;
              const col = isTarget ? (fixed ? '#10B981' : '#FF2D55') : '#00F0FF';
              return (
                <g key={i} transform={`translate(${(i - 2.5) * 145}, 0)`}>
                  <rect x={-60} y={-85} width={120} height={170} rx={18} fill="#0F172A" stroke={col} strokeWidth={6} />
                  <text x={0} y={20} textAnchor="middle" fill={col} fontSize={48} fontFamily="monospace" fontWeight="900">
                    {bit}
                  </text>
                </g>
              );
            })}
            <text x={0} y={180} textAnchor="middle" fill={fixed ? '#10B981' : '#FF2D55'} fontSize={40} fontFamily="monospace" fontWeight="900">
              {fixed ? '✓ DNA MUTATION AUTO-CORRECTED' : '⚠️ BIT CORRUPTION DETECTED...'}
            </text>
          </g>
          <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="inspect" accent={accent} />
        </svg>
      );
    }
    // 5D: Super-Intelligent Programmer Compiler
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 640)">
          <rect x={-410} y={-210} width={820} height={420} rx={26} fill="#0D1322" stroke="#F59E0B" strokeWidth={6} />
          <text x={-360} y={-110} fill="#F59E0B" fontSize={32} fontFamily="monospace" fontWeight="bold">
            &gt; COMPILING: HUMAN_GENOME.DNA
          </text>
          <text x={-360} y={-30} fill="#00F0FF" fontSize={32} fontFamily="monospace">
            checksum_verify(chromosome_23);
          </text>
          <text x={-360} y={50} fill="#10B981" fontSize={32} fontFamily="monospace">
            0 ERRORS FOUND · AUTHOR: ARCHITECT
          </text>
          <text x={-360} y={135} fill="#FFFFFF" fontSize={40} fontFamily="sans-serif" fontWeight="900">
            BIOLOGY IS COMPILED SOFTWARE
          </text>
        </g>
        <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="mindblown" accent={accent} />
      </svg>
    );
  }

  // ------------------------------------------------------------------------
  // CHUNK 5: CONCLUSION - ANCESTOR SIMULATION & OUTRO (4 SUB-SHOTS)
  // ------------------------------------------------------------------------
  if (subIdx === 0) {
    // 6A: Future Civilization Dyson Megastructure Running Earth Simulations
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 660)">
          {[140, 230, 320].map((r, i) => (
            <circle
              key={i}
              cx={0}
              cy={0}
              r={r}
              fill="none"
              stroke={i === 1 ? '#00F0FF' : '#A855F7'}
              strokeWidth={8}
              strokeDasharray="60 25"
              transform={`rotate(${(i % 2 === 0 ? 1 : -1) * sec * 25})`}
            />
          ))}
          <circle cx={0} cy={0} r={75} fill="#00F0FF" />
          <text x={0} y={390} textAnchor="middle" fill="#FFFFFF" fontSize={38} fontFamily="monospace" fontWeight="900">
            YEAR 4099 · ANCESTOR SIMULATOR
          </text>
        </g>
        <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="floating" accent={accent} />
      </svg>
    );
  }
  if (subIdx === 1) {
    // 6B: Cosmic Hard Drive Platter Storing Humanity
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 660)">
          <circle cx={0} cy={0} r={300} fill="#0B1120" stroke="#A855F7" strokeWidth={10} />
          <circle cx={0} cy={0} r={210} fill="none" stroke="#00F0FF" strokeWidth={3} strokeDasharray="20 12" transform={`rotate(${sec * 90})`} />
          <circle cx={0} cy={0} r={120} fill="none" stroke="#10B981" strokeWidth={3} strokeDasharray="15 10" transform={`rotate(${-sec * 120})`} />
          <circle cx={0} cy={0} r={45} fill="#A855F7" />
          {/* Read/Write Actuator Arm */}
          <polygon points="340,260 40,20 75,-15" fill="#F59E0B" />
          <text x={0} y={375} textAnchor="middle" fill="#A855F7" fontSize={38} fontFamily="monospace" fontWeight="900">
            SECTOR 7G // EARTH_ARCHIVE.ISO
          </text>
        </g>
        <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.15} pose="inspect" accent={accent} />
      </svg>
    );
  }
  if (subIdx === 2) {
    // 6C: Self-Aware Code Diagnostic Passed
    return (
      <svg width={W} height={H}>
        <g transform="translate(540, 640)">
          <circle cx={0} cy={0} r={240} fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth={8} />
          <path d="M -95 10 L -25 80 L 115 -65" fill="none" stroke="#10B981" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
          <text x={0} y={320} textAnchor="middle" fill="#10B981" fontSize={44} fontFamily="monospace" fontWeight="900">
            CONSCIOUSNESS_CODE: VERIFIED
          </text>
        </g>
        <AtomStickmanRig frame={globalFrame} x={540} y={1310} scale={1.2} pose="hero" accent={accent} />
      </svg>
    );
  }
  // 6D: Final Spotlight Hero Card & Subscribe CTA
  return (
    <svg width={W} height={H}>
      <polygon points="540,0 110,1520 970,1520" fill="rgba(255, 45, 85, 0.1)" />
      <g transform={`translate(540, 440) scale(${0.9 + Math.sin(sec * 8) * 0.04})`}>
        <rect x={-410} y={-110} width={820} height={220} rx={34} fill="#140A1D" stroke="#FF2D55" strokeWidth={7} />
        <text x={0} y={-20} textAnchor="middle" fill="#00F0FF" fontSize={36} fontFamily="monospace" fontWeight="900" letterSpacing={4}>
          QUESTION YOUR REALITY
        </text>
        <text x={0} y={55} textAnchor="middle" fill="#FFFFFF" fontSize={64} fontFamily="sans-serif" fontWeight="900">
          SUBSCRIBE · ATOM STICKMAN
        </text>
      </g>
      <AtomStickmanRig frame={globalFrame} x={540} y={1220} scale={1.42} pose="hero" accent="#00F0FF" />
    </svg>
  );
};

// ============================================================================
// 7. MASTER COMPOSITOR (REEL)
// ============================================================================

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const overallProgress = clamp(frame / TOTAL_FRAMES);

  // Locate active audio chunk (0..5) and sub-shot (0..3)
  let activeChunk = 0;
  for (let i = 0; i < 6; i++) {
    if (sec >= CHUNK_START_SEC[i]) activeChunk = i;
  }

  const chunkElapsedSec = Math.max(0, sec - CHUNK_START_SEC[activeChunk]);
  const chunkTotalSec = CHUNK_DURATIONS_SEC[activeChunk];
  const subDurationSec = chunkTotalSec / 4;
  const activeSubIdx = Math.min(3, Math.floor(chunkElapsedSec / subDurationSec));

  const subElapsedSec = chunkElapsedSec - activeSubIdx * subDurationSec;
  const localFrame = Math.floor(subElapsedSec * FPS);
  const subDurationFrames = Math.floor(subDurationSec * FPS);

  const currentMeta =
    SUB_SCENES.find((s) => s.chunk === activeChunk && s.subIdx === activeSubIdx) || SUB_SCENES[0];

  const subPop = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 14, stiffness: 220 },
  });

  // Subtle FlashCut on every 6-second sub-scene transition
  const seamFlash = localFrame < 6 ? interpolate(localFrame, [0, 6], [0.55, 0]) : 0;

  const textParts = currentMeta.text.split(currentMeta.hi);

  return (
    <AbsoluteFill style={{ backgroundColor: '#020307', overflow: 'hidden' }}>
      {/*
        ====================================================================
        HOW TO ENABLE YOUR AUDIO IN GITHUB:
        1. If you merged the 6 audio files (in order: 1, 6, 4, 5, 2, 3) into
           public/voice.mp3, uncomment the line below:
           <Audio src={staticFile('voice.mp3')} />
        ====================================================================
      */}

      <MatrixHudBackdrop
        frame={frame}
        accent={currentMeta.accent}
        chunkIdx={activeChunk}
        subIdx={activeSubIdx}
        title={currentMeta.title}
        metric={currentMeta.metric}
        overallProgress={overallProgress}
      />

      <SceneVisualRouter
        chunk={activeChunk}
        subIdx={activeSubIdx}
        localFrame={localFrame}
        subDurationFrames={subDurationFrames}
        globalFrame={frame}
        accent={currentMeta.accent}
      />

      {/* High-Retention Burned-In Hindi/English Subtitle Card */}
      <div
        style={{
          position: 'absolute',
          bottom: 115,
          left: 48,
          right: 48,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${interpolate(subPop, [0, 1], [0.86, 1])})`,
        }}
      >
        <div
          style={{
            background: 'rgba(5, 9, 20, 0.94)',
            border: `4px solid ${currentMeta.accent}`,
            borderRadius: 28,
            padding: '26px 38px',
            boxShadow: `0 18px 50px rgba(0,0,0,0.9), 0 0 35px ${currentMeta.accent}55`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 42,
              fontWeight: 900,
              fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif",
              lineHeight: 1.32,
            }}
          >
            {textParts[0]}
            <span
              style={{
                color: currentMeta.accent,
                textDecoration: 'underline',
                textShadow: `0 0 22px ${currentMeta.accent}`,
              }}
            >
              {currentMeta.hi}
            </span>
            {textParts[1] || ''}
          </span>
        </div>
      </div>

      {/* Seam Flash Overlay */}
      {seamFlash > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: currentMeta.accent,
            opacity: seamFlash,
            pointerEvents: 'none',
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// ============================================================================
// 8. REMOTION ROOT REGISTRATION (MATCHES YOUR GITHUB ACTIONS 'Reel' ID)
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
