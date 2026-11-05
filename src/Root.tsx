import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* =========================================================================
   CONTINUOUS 2D STORY WORLD — LAW 04: "ALWAYS SAY LESS THAN NECESSARY"
   1080 x 1920 | 60 FPS | 60 Seconds (3600 Frames)
   Single Cohesive Environment (Royal Balcony + Gallows Courtyard)
   Smooth Camera Panning, Rigged 2D Characters, Thought/Speech Bubbles,
   Context-Specific VFX & Procedural SFX (Zero External Files Needed)
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 3600; // 60.0 Seconds @ 60 FPS

const GOLD = "#E5C158";
const GOLD_LIGHT = "#FFF3C4";
const CRIMSON = "#FF3B30";
const EMERALD = "#2CE59B";
const CYAN = "#00E5FF";
const INK = "#141118";

/* =========================================================================
   01. CONTEXT-SPECIFIC PROCEDURAL SFX GENERATOR (NO EXTERNAL FILES)
   ========================================================================= */

type SfxKind =
  | "snap"
  | "thud"
  | "chime"
  | "pop"
  | "tear"
  | "angerBass"
  | "chain"
  | "lockClick";

function generateStorySfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durationMap: Record<SfxKind, number> = {
    snap: 0.22,
    thud: 0.42,
    chime: 0.75,
    pop: 0.16,
    tear: 0.48,
    angerBass: 0.55,
    chain: 0.35,
    lockClick: 0.2,
  };

  const duration = durationMap[kind];
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, totalSamples * 2, true);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const p = i / totalSamples;
    let wave = 0;
    let env = 1;

    if (kind === "snap") {
      // Sharp whip/rope fiber snap
      const crack = Math.sin(i * 37.2) * Math.cos(i * 4.1);
      wave = crack * 0.75 + Math.sin(2 * Math.PI * (950 - p * 700) * t) * 0.4;
      env = Math.exp(-p * 14);
    } else if (kind === "thud") {
      // Body landing on wooden gallows deck
      const f = 110 * Math.pow(1 - p, 1.8) + 32;
      wave =
        Math.sin(2 * Math.PI * f * t) * 0.85 +
        Math.sin(2 * Math.PI * f * 1.9 * t) * 0.3;
      env = Math.pow(1 - p, 2.4);
    } else if (kind === "chime") {
      // Heavenly divine chord shimmer
      wave =
        Math.sin(2 * Math.PI * 528 * t) * 0.4 +
        Math.sin(2 * Math.PI * 660 * t) * 0.35 +
        Math.sin(2 * Math.PI * 792 * t) * 0.25 +
        Math.sin(2 * Math.PI * 1056 * t) * 0.15;
      env = Math.sin(Math.PI * p) * Math.exp(-p * 2.2);
    } else if (kind === "pop") {
      // Comic speech/thought bubble pop
      const f = 340 + p * 520;
      wave = Math.sin(2 * Math.PI * f * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 1.4);
    } else if (kind === "tear") {
      // Royal pardon paper ripping sound
      const friction =
        Math.sin(i * 53.7) *
        Math.cos(i * 9.3) *
        (0.6 + 0.4 * Math.sin(p * 38));
      wave = friction * 0.8 + Math.sin(2 * Math.PI * 420 * t) * 0.15;
      env = Math.sin(Math.PI * p);
    } else if (kind === "angerBass") {
      // Deep royal wrath rumble
      const f = 82 * (1 - p * 0.45);
      wave =
        Math.sin(2 * Math.PI * f * t) * 0.85 +
        Math.sin(2 * Math.PI * f * 2 * t) * 0.25;
      env = Math.pow(1 - p, 1.5);
    } else if (kind === "chain") {
      // Heavy new rope / iron pulley clank
      wave =
        Math.sin(2 * Math.PI * 1420 * t) * 0.5 +
        Math.sin(2 * Math.PI * 2180 * t) * 0.4 +
        Math.sin(i * 29.1) * 0.3;
      env = Math.exp(-p * 10);
    } else if (kind === "lockClick") {
      // Metallic padlock click on mouth
      wave =
        Math.sin(2 * Math.PI * 1950 * t) * 0.6 +
        Math.sin(2 * Math.PI * 2900 * t) * 0.4;
      env = Math.exp(-p * 18);
    }

    const val = Math.max(-1, Math.min(1, wave * env * 0.72));
    view.setInt16(44 + i * 2, val * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX: Record<SfxKind, string> = {
  snap: generateStorySfx("snap"),
  thud: generateStorySfx("thud"),
  chime: generateStorySfx("chime"),
  pop: generateStorySfx("pop"),
  tear: generateStorySfx("tear"),
  angerBass: generateStorySfx("angerBass"),
  chain: generateStorySfx("chain"),
  lockClick: generateStorySfx("lockClick"),
};

/* =========================================================================
   02. SELECTIVE IMPORTANT HINGLISH PHRASES (ONLY KEY MOMENTS!)
   ========================================================================= */

type FloatingKeyword = {
  startSec: number;
  endSec: number;
  topText?: string;
  mainText: string;
  color: string;
};

const SELECTIVE_KEYWORDS: FloatingKeyword[] = [
  {
    startSec: 0.4,
    endSec: 4.8,
    topText: "KYA AAPKO PATA HAI?",
    mainText: "ZYADA BOLNA = JAAN KA KHATRA! 💀",
    color: CRIMSON,
  },
  {
    startSec: 5.4,
    endSec: 9.2,
    topText: "RUSSIA • 1825",
    mainText: "REBEL KI FAANSI ⛓️",
    color: GOLD,
  },
  {
    startSec: 9.6,
    endSec: 13.0,
    topText: "PAR ACHANAK...",
    mainText: "ROPE TOOT GAYI! 💥",
    color: CRIMSON,
  },
  {
    startSec: 13.5,
    endSec: 20.8,
    topText: "BHAGWAN KA ISHARA",
    mainText: " SAZA MAAF! 🕊️",
    color: EMERALD,
  },
  {
    startSec: 21.6,
    endSec: 28.5,
    topText: "OVERSMART REBEL BOLA:",
    mainText: "DHANG KI ROPE BHI NAHI! 🤡",
    color: CYAN,
  },
  {
    startSec: 29.2,
    endSec: 37.5,
    topText: "RAJA NE PAPER PHAAD DIYA:",
    mainText: "CHALO GALAT SABIT KAREIN! 👑",
    color: CRIMSON,
  },
  {
    startSec: 38.0,
    endSec: 41.3,
    topText: "AGLE HI DIN...",
    mainText: "NAYI MAZBOOT ROPE! ⛓️",
    color: GOLD,
  },
  {
    startSec: 41.6,
    endSec: 47.8,
    topText: "48 LAWS OF POWER",
    mainText: "LAW #04: SAY LESS! 📖",
    color: GOLD,
  },
  {
    startSec: 48.2,
    endSec: 53.2,
    topText: "KHATRE SE BACHNA HAI TOH",
    mainText: "ZUBAAN PAR CONTROL! 🔒",
    color: EMERALD,
  },
  {
    startSec: 53.6,
    endSec: 60.0,
    topText: "KAUN SA DOST BINA SOCHE",
    mainText: "KUCH BHI BAK DETA HAI? 👇",
    color: GOLD,
  },
];

/* =========================================================================
   03. RIGGED 2D CHARACTERS: THE REBEL & THE RUSSIAN TSAR (RAJA)
   ========================================================================= */

const RiggedRebelCharacter: React.FC<{
  x: number;
  y: number;
  rotation?: number;
  pose: "hanging" | "falling" | "sitting" | "mocking" | "locked";
  isTalking?: boolean;
  frame: number;
}> = ({ x, y, rotation = 0, pose, isTalking = false, frame }) => {
  // Joint angles based on pose
  const leftArmDeg =
    pose === "falling"
      ? -135 + Math.sin(frame * 0.6) * 25
      : pose === "mocking"
        ? 25
        : pose === "sitting"
          ? -20
          : 12;

  const rightArmDeg =
    pose === "falling"
      ? 135 - Math.sin(frame * 0.6) * 25
      : pose === "mocking"
        ? -125 + Math.sin(frame * 0.25) * 12 // Pointing up at broken rope!
        : pose === "sitting"
          ? 30
          : -12;

  const legSpread =
    pose === "falling"
      ? 24 + Math.sin(frame * 0.7) * 14
      : pose === "sitting"
        ? 38
        : 8;

  const mouthOpen = isTalking ? 6 + Math.abs(Math.sin(frame * 0.45)) * 12 : 2;

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      {/* Shadow under feet when on ground */}
      {(pose === "sitting" || pose === "mocking") && (
        <ellipse cx="0" cy="185" rx="68" ry="16" fill="rgba(0,0,0,0.45)" />
      )}

      {/* Left Leg */}
      <g transform={`translate(-22 85) rotate(${legSpread})`}>
        <rect x="-14" y="0" width="28" height="88" rx="12" fill="#2A303C" stroke="#151820" strokeWidth="3" />
        <ellipse cx="-4" cy="92" rx="20" ry="11" fill="#1C1613" />
      </g>

      {/* Right Leg */}
      <g transform={`translate(22 85) rotate(${-legSpread})`}>
        <rect x="-14" y="0" width="28" height="88" rx="12" fill="#2A303C" stroke="#151820" strokeWidth="3" />
        <ellipse cx="4" cy="92" rx="20" ry="11" fill="#1C1613" />
      </g>

      {/* Torso (1825 Prisoner Coat & Shirt) */}
      <path
        d="M-48 -28 C-54 20 -50 68 -44 95 L44 95 C50 68 54 20 48 -28 Z"
        fill="#5C4938"
        stroke="#2B2118"
        strokeWidth="4"
      />
      <path d="M-20 -28 L0 25 L20 -28" fill="#D8CEBE" stroke="#8C7E6A" strokeWidth="3" />

      {/* Left Arm */}
      <g transform={`translate(-46 -18) rotate(${leftArmDeg})`}>
        <rect x="-13" y="0" width="26" height="78" rx="12" fill="#4E3D2E" stroke="#2B2118" strokeWidth="3" />
        <circle cx="0" cy="82" r="14" fill="#D9A17C" stroke="#8C5B3C" strokeWidth="3" />
      </g>

      {/* Right Arm (Points up at broken rope when mocking!) */}
      <g transform={`translate(46 -18) rotate(${rightArmDeg})`}>
        <rect x="-13" y="0" width="26" height="78" rx="12" fill="#4E3D2E" stroke="#2B2118" strokeWidth="3" />
        <circle cx="0" cy="82" r="14" fill="#D9A17C" stroke="#8C5B3C" strokeWidth="3" />
        {pose === "mocking" && (
          <rect x="-5" y="88" width="10" height="22" rx="5" fill="#D9A17C" stroke="#8C5B3C" strokeWidth="2.5" />
        )}
      </g>

      {/* Broken Rope Noose Loop Around Neck */}
      <ellipse cx="0" cy="-30" rx="26" ry="10" fill="none" stroke="#C8A97E" strokeWidth="9" />

      {/* Head */}
      <g transform={`translate(0 -72) rotate(${pose === "mocking" ? -8 : 0})`}>
        <ellipse cx="0" cy="0" rx="42" ry="48" fill="#DFA682" stroke="#8C5B3C" strokeWidth="3.5" />
        {/* Messy Rebel Hair */}
        <path
          d="M-44 -15 C-52 -55 12 -65 44 -30 C52 -15 44 0 36 -8 C12 -24 -22 -22 -44 -15 Z"
          fill="#2B221E"
        />

        {/* Eyes & Eyebrows */}
        {pose === "hanging" || pose === "falling" ? (
          <g>
            {/* Wide shocked eyes */}
            <circle cx="-15" cy="-6" r="8" fill="#FFFFFF" stroke="#1E1614" strokeWidth="2.5" />
            <circle cx="15" cy="-6" r="8" fill="#FFFFFF" stroke="#1E1614" strokeWidth="2.5" />
            <circle cx="-15" cy="-6" r="3.5" fill="#1E1614" />
            <circle cx="15" cy="-6" r="3.5" fill="#1E1614" />
            <line x1="-26" y1="-20" x2="-6" y2="-16" stroke="#1E1614" strokeWidth="4" strokeLinecap="round" />
            <line x1="6" y1="-16" x2="26" y2="-20" stroke="#1E1614" strokeWidth="4" strokeLinecap="round" />
          </g>
        ) : pose === "mocking" ? (
          <g>
            {/* Smug over-smart eyebrows & eyes */}
            <path d="M-26 -18 Q-15 -26 -5 -16" fill="none" stroke="#1E1614" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M5 -16 Q15 -26 26 -18" fill="none" stroke="#1E1614" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="-15" cy="-5" r="5" fill="#1E1614" />
            <circle cx="15" cy="-5" r="5" fill="#1E1614" />
          </g>
        ) : (
          <g>
            {/* Relief / Calm eyes */}
            <circle cx="-15" cy="-5" r="5" fill="#1E1614" />
            <circle cx="15" cy="-5" r="5" fill="#1E1614" />
            <path d="M-24 -16 Q-15 -22 -6 -16" fill="none" stroke="#1E1614" strokeWidth="3.5" />
            <path d="M6 -16 Q15 -22 24 -16" fill="none" stroke="#1E1614" strokeWidth="3.5" />
          </g>
        )}

        {/* Mouth (Animated Talking or Locked) */}
        {pose === "locked" ? (
          <g transform="translate(0 22)">
            <rect x="-24" y="-10" width="48" height="22" rx="6" fill={GOLD} stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="0" cy="1" r="4.5" fill="#18120B" />
          </g>
        ) : (
          <ellipse
            cx="0"
            cy="22"
            rx={isTalking ? 14 : 9}
            ry={mouthOpen}
            fill="#3B1618"
            stroke="#1E1614"
            strokeWidth="2.5"
          />
        )}
      </g>
    </g>
  );
};

const RiggedTsarCharacter: React.FC<{
  x: number;
  y: number;
  tearProgress: number; // 0 = holding intact pardon paper, 0..1 = ripping it apart!
  isTalking: boolean;
  frame: number;
}> = ({ x, y, tearProgress, isTalking, frame }) => {
  const breathe = Math.sin(frame * 0.08) * 3;
  const mouthH = isTalking ? 6 + Math.abs(Math.sin(frame * 0.45)) * 11 : 3;
  const armPull = interpolate(tearProgress, [0, 0.35, 1], [0, 48, 85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <g transform={`translate(${x} ${y + breathe})`}>
      {/* Ornate Golden Imperial Throne Backrest */}
      <path
        d="M-110 -150 L-125 180 L125 180 L110 -150 Q0 -210 -110 -150 Z"
        fill="#4A121B"
        stroke={GOLD}
        strokeWidth="8"
      />
      <circle cx="-95" cy="-145" r="16" fill={GOLD} />
      <circle cx="95" cy="-145" r="16" fill={GOLD} />

      {/* Royal Crimson Velvet Mantle & Ermine Fur */}
      <path
        d="M-95 10 C-120 75 -130 140 -135 195 L135 195 C130 140 120 75 95 10 Z"
        fill="#7C1324"
        stroke={GOLD}
        strokeWidth="5"
      />
      <path
        d="M-85 5 Q0 52 85 5 L100 45 Q0 88 -100 45 Z"
        fill="#F6F1E6"
        stroke="#C7B9A5"
        strokeWidth="3"
      />
      {[-55, -28, 0, 28, 55].map((d) => (
        <circle key={d} cx={d} cy="30" r="4" fill="#1D181A" />
      ))}

      {/* Tsar Head & Beard */}
      <g transform="translate(0 -52)">
        <ellipse cx="0" cy="0" rx="48" ry="54" fill="#DBA17C" stroke="#8C5B3C" strokeWidth="3.5" />
        {/* Full Royal Beard */}
        <path
          d="M-46 8 C-48 52 -22 76 0 82 C22 76 48 52 46 8 C30 24 14 26 0 26 C-14 26 -30 24 -46 8 Z"
          fill="#22191C"
        />
        {/* Angry Furrowed Eyebrows & Glowing Eyes */}
        <line x1="-34" y1="-22" x2="-8" y2="-10" stroke="#181012" strokeWidth="6.5" strokeLinecap="round" />
        <line x1="34" y1="-22" x2="8" y2="-10" stroke="#181012" strokeWidth="6.5" strokeLinecap="round" />
        <circle cx="-18" cy="-4" r="6" fill={CRIMSON} />
        <circle cx="18" cy="-4" r="6" fill={CRIMSON} />

        {/* Animated Talking Mouth */}
        <ellipse cx="0" cy="30" rx="13" ry={mouthH} fill="#3D0C11" stroke={GOLD} strokeWidth="2" />

        {/* Russian Imperial Crown */}
        <path
          d="M-54 -34 L-66 -98 L-26 -68 L0 -115 L26 -68 L66 -98 L54 -34 Z"
          fill={GOLD}
          stroke="#FFF5CC"
          strokeWidth="4"
        />
        <circle cx="0" cy="-105" r="8" fill="#FFFFFF" />
        <circle cx="-38" cy="-78" r="6" fill={CRIMSON} />
        <circle cx="38" cy="-78" r="6" fill={CRIMSON} />
      </g>

      {/* Left & Right Hands Holding & Ripping the "MAAFI PAPER" */}
      {/* Left Half of Pardon Scroll */}
      <g
        transform={`translate(${-26 - armPull} ${85 + tearProgress * 18}) rotate(${
          -tearProgress * 24
        })`}
      >
        <path
          d="M-65 -45 L0 -45 L-6 -20 L4 0 L-8 22 L0 45 L-65 45 Z"
          fill="#F7EFE0"
          stroke="#8C7A60"
          strokeWidth="3"
        />
        <text x="-32" y="6" textAnchor="middle" fill={CRIMSON} fontSize="16" fontWeight="900">
          MAAFI
        </text>
        {/* Left Hand */}
        <circle cx="-58" cy="0" r="16" fill="#DBA17C" stroke="#8C5B3C" strokeWidth="3" />
      </g>

      {/* Right Half of Pardon Scroll */}
      <g
        transform={`translate(${26 + armPull} ${85 + tearProgress * 18}) rotate(${
          tearProgress * 24
        })`}
      >
        <path
          d="M0 -45 L65 -45 L65 45 L0 45 L-8 22 L4 0 L-6 -20 Z"
          fill="#F7EFE0"
          stroke="#8C7A60"
          strokeWidth="3"
        />
        <text x="32" y="6" textAnchor="middle" fill={CRIMSON} fontSize="16" fontWeight="900">
          PAPER
        </text>
        {/* Right Hand */}
        <circle cx="58" cy="0" r="16" fill="#DBA17C" stroke="#8C5B3C" strokeWidth="3" />
      </g>

      {/* Paper Scraps Fluttering Down When Ripped */}
      {tearProgress > 0.15 &&
        [-28, -10, 12, 30].map((sx, idx) => (
          <rect
            key={idx}
            x={sx * (1 + tearProgress)}
            y={85 + tearProgress * (90 + idx * 32)}
            width="14"
            height="18"
            fill="#F7EFE0"
            opacity={1 - tearProgress * 0.7}
            transform={`rotate(${frame * 4 + idx * 40})`}
          />
        ))}
    </g>
  );
};

/* =========================================================================
   04. COMIC SPEECH & THOUGHT BUBBLES (IN-WORLD POP-UPS)
   ========================================================================= */

const InWorldBubble: React.FC<{
  x: number;
  y: number;
  kind: "thought" | "speech";
  tailDir: "left" | "right";
  header: string;
  body: string;
  accent: string;
  scale: number;
}> = ({ x, y, kind, tailDir, header, body, accent, scale }) => {
  if (scale <= 0.02) return null;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Tail pointing to character */}
      {kind === "speech" ? (
        <polygon
          points={
            tailDir === "down-left" || tailDir === "left"
              ? "-60,75 -20,75 -85,135"
              : "20,75 60,75 85,135"
          }
          fill="#15131D"
          stroke={accent}
          strokeWidth="5"
        />
      ) : (
        <g fill="#15131D" stroke={accent} strokeWidth="4">
          <circle cx={tailDir === "left" ? -55 : 55} cy="105" r="14" />
          <circle cx={tailDir === "left" ? -75 : 75} cy="138" r="8" />
        </g>
      )}

      {/* Main Bubble Card */}
      <rect
        x="-275"
        y="-85"
        width="550"
        height="168"
        rx={kind === "thought" ? 55 : 28}
        fill="#15131D"
        stroke={accent}
        strokeWidth="6"
      />
      <text
        x="0"
        y="-28"
        textAnchor="middle"
        fill={accent}
        fontSize="23"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        letterSpacing="2.5"
      >
        {header}
      </text>
      <text
        x="0"
        y="30"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="31"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        {body}
      </text>
    </g>
  );
};

/* =========================================================================
   05. THE SINGLE CONTINUOUS 2D WORLD (ROYAL BALCONY + GALLOWS COURTYARD)
   ========================================================================= */

const ContinuousStoryWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  // Snowflakes across the 2400px wide Russian Courtyard
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 65 }, (_, i) => ({
        x: (i * 173) % 2400,
        y: (i * 97) % 1920,
        r: 2 + (i % 4) * 1.4,
        speed: 1.4 + (i % 5) * 0.5,
      })),
    []
  );

  // =======================================================================
  // SMOOTH CAMERA PANNING & ZOOM KEYFRAMES ACROSS THE SAME 2D ENVIRONMENT
  // World Coordinates:
  //   - Tsar's Royal Balcony is at World X = 560, Y = 960
  //   - Gallows & Rebel is at World X = 1580, Y = 980
  //   - Center Courtyard is at World X = 1080, Y = 960
  // =======================================================================
  const camX = interpolate(
    sec,
    [
      0.0,  // Hook on Rebel
      4.8,
      5.6,  // Wide shot of Gallows
      9.4,
      10.0, // Zoom in on Rope Snap & Fall
      13.2,
      14.0, // Divine Light on Rebel
      21.2,
      22.0, // Close-up on Oversmart Rebel talking
      28.6,
      29.6, // SMOOTH PAN LEFT TO THE KING (TSAR) ON BALCONY!
      37.6,
      38.5, // SMOOTH PAN RIGHT BACK TO GALLOWS FOR NEW ROPE!
      41.5,
      42.5, // Center wide courtyard for Law 04 & CTA
      60.0,
    ],
    [
      1580,
      1580,
      1420,
      1420,
      1580,
      1580,
      1540,
      1540,
      1580,
      1580,
      560,  // Focused on King!
      560,
      1580, // Back to Gallows!
      1580,
      1120,
      1120,
    ],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  const camY = interpolate(
    sec,
    [0.0, 5.2, 9.5, 10.2, 11.2, 21.5, 29.0, 29.8, 37.8, 38.6, 42.0, 60.0],
    [880, 940, 860, 1040, 1080, 1020, 1020, 910, 910, 940, 960, 960],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const camScale = interpolate(
    sec,
    [0.0, 4.8, 5.6, 9.4, 10.2, 13.5, 21.5, 22.2, 28.6, 29.6, 37.6, 38.5, 41.8, 60.0],
    [1.32, 1.38, 0.96, 1.04, 1.24, 1.12, 1.12, 1.35, 1.35, 1.28, 1.28, 1.15, 0.92, 0.95],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtle single thud impact ONLY at 10.85s when Rebel hits the floor!
  const landingImpact =
    sec >= 10.75 && sec <= 11.25
      ? Math.sin((sec - 10.75) * 55) * Math.exp(-(sec - 10.75) * 10) * 18
      : 0;

  // =======================================================================
  // CHARACTER & OBJECT ANIMATION STATES
  // =======================================================================
  const isRopeBroken = sec >= 10.1;

  // Rebel Y position: hanging at y=860, falls at 10.1s..10.85s to y=1115 (on platform)
  const rebelFallProgress = interpolate(sec, [10.1, 10.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  const rebelY = !isRopeBroken
    ? 865 + Math.sin(frame * 0.08) * 6
    : mix(865, 1115, rebelFallProgress);

  const rebelPose: "hanging" | "falling" | "sitting" | "mocking" | "locked" =
    sec >= 48.0 && sec < 53.5
      ? "locked"
      : !isRopeBroken
        ? "hanging"
        : sec < 10.85
          ? "falling"
          : sec < 21.5
            ? "sitting"
            : "mocking";

  const rebelRotation =
    !isRopeBroken
      ? Math.sin(frame * 0.06) * 3
      : sec < 10.85
        ? rebelFallProgress * 14
        : 0;

  // Divine Light Opacity (13.2s - 21.5s)
  const divineOpacity = interpolate(sec, [13.2, 14.2, 20.6, 21.5], [0, 0.9, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bubble Scales
  const mercyBubbleScale = spring({
    frame: Math.max(0, frame - Math.round(14.0 * FPS)),
    fps,
    config: { damping: 12, stiffness: 150 },
  }) * interpolate(sec, [20.5, 21.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rebelSpeechScale = spring({
    frame: Math.max(0, frame - Math.round(22.2 * FPS)),
    fps,
    config: { damping: 11, stiffness: 170 },
  }) * interpolate(sec, [28.2, 28.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tsarSpeechScale = spring({
    frame: Math.max(0, frame - Math.round(33.8 * FPS)),
    fps,
    config: { damping: 11, stiffness: 170 },
  }) * interpolate(sec, [37.3, 37.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Tsar Paper Rip Progress (happens at 31.5s - 33.2s)
  const paperRipProgress = interpolate(sec, [31.4, 32.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // New Reinforced Rope Drop (happens at 38.2s - 41.5s)
  const newRopeDrop = interpolate(sec, [38.2, 39.4], [-350, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.bounce),
  });

  // Convert Camera Target (camX, camY, camScale) to SVG ViewBox Transform
  const translateX = WIDTH / 2 - camX * camScale;
  const translateY = HEIGHT / 2 - (camY + landingImpact) * camScale;

  return (
    <AbsoluteFill style={{ backgroundColor: "#070913", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#060814" />
            <stop offset="55%" stopColor="#121A30" />
            <stop offset="100%" stopColor="#1E2638" />
          </linearGradient>
          <linearGradient id="divineBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF5C0" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E5C158" stopOpacity="0.0" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fixed Sky Backdrop */}
        <rect width={WIDTH} height={HEIGHT} fill="url(#nightSky)" />

        {/* =================================================================
            WORLD CAMERA TRANSFORM GROUP (PANS & ZOOMS SMOOTHLY!)
           ================================================================= */}
        <g transform={`translate(${translateX} ${translateY}) scale(${camScale})`}>
          {/* 1. DISTANT ST. PETERSBURG PALACE SILHOUETTE (PARALLAX BACKDROP) */}
          <g fill="#0B1020" opacity="0.85">
            <rect x="-200" y="680" width="2600" height="700" />
            {/* Russian Onion Domes & Spires */}
            {[250, 680, 1080, 1450, 1920].map((dx, i) => (
              <g key={i} transform={`translate(${dx} 680)`}>
                <rect x="-45" y="-160" width="90" height="160" />
                <path d="M-55 -160 C-55 -230 0 -260 0 -310 C0 -260 55 -230 55 -160 Z" fill="#151E36" />
                <line x1="0" y1="-310" x2="0" y2="-365" stroke={GOLD} strokeWidth="4" />
              </g>
            ))}
          </g>

          {/* 2. COURTYARD SNOW FLOOR */}
          <rect x="-300" y="1320" width="2800" height="800" fill="#1A2234" />
          <path
            d="M-300 1320 Q400 1290 1100 1325 T2500 1315 L2500 1420 L-300 1420 Z"
            fill="#28334A"
          />

          {/* ===============================================================
              LEFT ZONE (World X: 200..900): TSAR'S IMPERIAL PALACE BALCONY
             =============================================================== */}
          <g transform="translate(560 960)">
            {/* Stone Palace Wall & Arch */}
            <rect x="-340" y="-420" width="680" height="780" rx="18" fill="#1C1926" stroke={GOLD} strokeWidth="6" />
            <path d="M-260 360 V-260 Q0 -410 260 -260 V360 Z" fill="#120E1A" stroke={GOLD} strokeWidth="5" />

            {/* Red Velvet Royal Curtains */}
            <path d="M-260 -260 Q-140 -120 -220 180 L-260 180 Z" fill="#6E1222" stroke={GOLD} strokeWidth="3" />
            <path d="M260 -260 Q140 -120 220 180 L260 180 Z" fill="#6E1222" stroke={GOLD} strokeWidth="3" />

            {/* THE TSAR (RAJA) RIGGED CHARACTER */}
            <RiggedTsarCharacter
              x={0}
              y={-10}
              tearProgress={paperRipProgress}
              isTalking={sec >= 33.5 && sec <= 37.5}
              frame={frame}
            />

            {/* Imperial Balcony Balustrade */}
            <rect x="-360" y="165" width="720" height="36" rx="8" fill={GOLD} />
            <rect x="-340" y="201" width="680" height="160" fill="#2A2433" stroke={GOLD} strokeWidth="4" />
            {[-260, -195, -130, -65, 0, 65, 130, 195, 260].map((bx) => (
              <rect key={bx} x={bx - 10} y="212" width="20" height="135" rx="6" fill="#D5C7B2" />
            ))}

            {/* Tsar's Speech Bubble (33.8s - 37.8s) */}
            <InWorldBubble
              x={40}
              y={-335}
              kind="speech"
              tailDir="left"
              header="👑 FURIOUS RAJA ORDERS:"
              body="“Chalo, use GALAT sabit karte hain!”"
              accent={CRIMSON}
              scale={tsarSpeechScale}
            />
          </g>

          {/* ===============================================================
              RIGHT ZONE (World X: 1150..1950): THE EXECUTION GALLOWS (MONCHO)
             =============================================================== */}
          <g transform="translate(1580 0)">
            {/* DIVINE GOLDEN GOD-RAY FROM SKY (13.2s - 21.5s) */}
            {divineOpacity > 0.01 && (
              <g opacity={divineOpacity}>
                <polygon
                  points="-120,180 120,180 340,1340 -340,1340"
                  fill="url(#divineBeam)"
                />
                <circle cx="0" cy="1080" r="210" fill={GOLD} opacity="0.18" filter="url(#softGlow)" />
              </g>
            )}

            {/* Wooden Gallows Deck & Support Pillars */}
            <rect x="-360" y="1290" width="720" height="42" rx="6" fill="#5A3E28" stroke="#2E1E12" strokeWidth="5" />
            <rect x="-320" y="1332" width="44" height="160" fill="#3E2A1B" />
            <rect x="276" y="1332" width="44" height="160" fill="#3E2A1B" />
            {/* Left Upright Timber Post */}
            <rect x="-260" y="450" width="48" height="840" fill="#4E3522" stroke="#2B1C10" strokeWidth="4" />
            {/* Top Horizontal Crossbeam */}
            <rect x="-290" y="420" width="580" height="52" rx="8" fill="#5A3E28" stroke="#2B1C10" strokeWidth="5" />
            {/* Diagonal Corner Brace */}
            <polygon points="-212,610 -212,550 -60,472 -120,472" fill="#3E2A1B" />

            {/* Trapdoor under Rebel */}
            <rect
              x="-110"
              y="1292"
              width="110"
              height="24"
              fill="#3E2A1B"
              transform={isRopeBroken ? "rotate(65 -110 1292)" : undefined}
            />

            {/* =============================================================
                THE HANGING ROPE (INTACT -> SNAPS AT 10.1s -> NEW ROPE AT 38.2s)
               ============================================================= */}
            {!isRopeBroken ? (
              /* Intact Taut Rope */
              <line
                x1="0"
                y1="472"
                x2="0"
                y2={rebelY - 30}
                stroke="#D2B48C"
                strokeWidth="12"
              />
            ) : (
              /* Snapped Upper Rope Frayed Stub */
              <g>
                <path
                  d={`M 0 472 Q ${Math.sin(frame * 0.25) * 28} 560 ${
                    Math.sin(frame * 0.25) * 42
                  } 635`}
                  fill="none"
                  stroke="#D2B48C"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Snap Spark Burst right at 10.1s..10.6s */}
                {sec >= 10.1 && sec <= 10.65 && (
                  <g transform="translate(0 640)">
                    <circle r={(sec - 10.1) * 220} fill="none" stroke={CRIMSON} strokeWidth="8" opacity={1 - (sec - 10.1) * 1.8} />
                    {[-45, 0, 45, 90, 135, -120].map((deg, idx) => (
                      <line
                        key={idx}
                        x1="0"
                        y1="0"
                        x2={Math.cos((deg * Math.PI) / 180) * 95}
                        y2={Math.sin((deg * Math.PI) / 180) * 95}
                        stroke={GOLD_LIGHT}
                        strokeWidth="6"
                      />
                    ))}
                  </g>
                )}
              </g>
            )}

            {/* NEW REINFORCED GOLDEN-STEEL ROPE DROPPING AT 38.2s */}
            {sec >= 38.0 && (
              <g transform={`translate(115 ${newRopeDrop})`}>
                <line x1="0" y1="472" x2="0" y2="830" stroke={GOLD} strokeWidth="18" />
                <line x1="0" y1="472" x2="0" y2="830" stroke="#7A5922" strokeWidth="8" strokeDasharray="14 10" />
                <ellipse cx="0" cy="865" rx="34" ry="46" fill="none" stroke={GOLD} strokeWidth="16" />
                <rect x="-135" y="610" width="270" height="54" rx="14" fill="#12261E" stroke={EMERALD} strokeWidth="4" />
                <text x="0" y="645" textAnchor="middle" fill={EMERALD} fontSize="23" fontWeight="900">
                  10X STRONGER ROPE ⛓️
                </text>
              </g>
            )}

            {/* =============================================================
                THE RIGGED REBEL CHARACTER
               ============================================================= */}
            <RiggedRebelCharacter
              x={0}
              y={rebelY}
              rotation={rebelRotation}
              pose={rebelPose}
              isTalking={(sec >= 0.3 && sec <= 4.5) || (sec >= 22.0 && sec <= 28.6)}
              frame={frame}
            />

            {/* Snow/Dust Puff when Rebel hits the deck at 10.85s */}
            {sec >= 10.8 && sec <= 11.7 && (
              <g transform="translate(0 1285)" opacity={1 - (sec - 10.8)}>
                <circle cx={-(sec - 10.8) * 180} cy="-10" r="42" fill="#DCE6F7" opacity="0.6" />
                <circle cx={(sec - 10.8) * 180} cy="-10" r="42" fill="#DCE6F7" opacity="0.6" />
                <circle cx="0" cy={-(sec - 10.8) * 95} r="52" fill="#DCE6F7" opacity="0.5" />
              </g>
            )}

            {/* THOUGHT BUBBLE 1: DIVINE MERCY RULE (14.0s - 21.2s) */}
            <InWorldBubble
              x={-30}
              y={740}
              kind="thought"
              tailDir="right"
              header="🕊️ 1825 ROYAL RULE:"
              body="Rope Toot Gayi = Bhagwan Ki Maafi! ✅"
              accent={EMERALD}
              scale={mercyBubbleScale}
            />

            {/* SPEECH BUBBLE 2: REBEL'S OVERSMART MOCKERY (22.2s - 28.8s) */}
            <InWorldBubble
              x={-20}
              y={730}
              kind="speech"
              tailDir="right"
              header="🤬 OVERSMART REBEL SHOUTED:"
              body="“Russia mein dhang ki ROPE bhi nahi banti!”"
              accent={CYAN}
              scale={rebelSpeechScale}
            />
          </g>

          {/* Falling Snowflakes Across Entire Courtyard */}
          {snowflakes.map((s, i) => {
            const sy = (s.y + frame * s.speed) % 1920;
            return (
              <circle
                key={i}
                cx={s.x}
                cy={sy}
                r={s.r}
                fill="#FFFFFF"
                opacity="0.45"
              />
            );
          })}
        </g>

        {/* =================================================================
            FOREGROUND STORY OVERLAYS FOR LAW #04 & FRIEND CTA (41.5s - 60.0s)
            (Appears smoothly over the courtyard so environment stays cohesive!)
           ================================================================= */}
        {sec >= 41.5 && sec < 48.0 && (
          <g
            transform={`translate(540 1020) scale(${spring({
              frame: Math.max(0, frame - Math.round(41.5 * FPS)),
              fps,
              config: { damping: 13, stiffness: 150 },
            })})`}
          >
            <rect x="-340" y="-260" width="680" height="520" rx="34" fill="rgba(14,12,22,0.94)" stroke={GOLD} strokeWidth="8" />
            <text y="-165" textAnchor="middle" fill={GOLD_LIGHT} fontSize="26" fontWeight="900" letterSpacing="5">
              ROBERT GREENE • 48 LAWS OF POWER
            </text>
            <circle cy="-25" r="88" fill="#2A1219" stroke={GOLD} strokeWidth="6" />
            <text y="-4" textAnchor="middle" fill={GOLD} fontSize="68" fontWeight="900">
              #04
            </text>
            <text y="125" textAnchor="middle" fill="#FFFFFF" fontSize="38" fontWeight="900">
              “ALWAYS SAY LESS
            </text>
            <text y="175" textAnchor="middle" fill={GOLD} fontSize="42" fontWeight="900">
              THAN NECESSARY” 🤫
            </text>
          </g>
        )}

        {/* TALKATIVE FRIEND BUBBLE OVERLOAD + COMMENT CTA (53.5s - 60.0s) */}
        {sec >= 53.5 && (
          <g
            transform={`translate(540 1050) scale(${spring({
              frame: Math.max(0, frame - Math.round(53.5 * FPS)),
              fps,
              config: { damping: 13, stiffness: 150 },
            })})`}
          >
            <rect x="-390" y="-250" width="780" height="500" rx="36" fill="rgba(16,14,26,0.95)" stroke={GOLD} strokeWidth="7" />
            {/* Chaotic Speech Bubbles popping around */}
            <rect x="-320" y="-185" width="260" height="70" rx="20" fill="#2B1638" stroke={CYAN} strokeWidth="3.5" />
            <text x="-190" y="-140" textAnchor="middle" fill={CYAN} fontSize="26" fontWeight="900">
              “Bina soche bolna!” 🗣️
            </text>

            <rect x="60" y="-185" width="260" height="70" rx="20" fill="#381622" stroke={CRIMSON} strokeWidth="3.5" />
            <text x="190" y="-140" textAnchor="middle" fill={CRIMSON} fontSize="26" fontWeight="900">
              “24x7 Bak-Bak!” 🤡
            </text>

            <text y="-20" textAnchor="middle" fill={GOLD_LIGHT} fontSize="34" fontWeight="900">
              TAG THAT “OVER-TALKATIVE” FRIEND:
            </text>

            <rect x="-320" y="30" width="640" height="105" rx="24" fill="#09080E" stroke={GOLD} strokeWidth="4" />
            <text x="0" y="96" textAnchor="middle" fill="#FFFFFF" fontSize="40" fontWeight="900">
              @comment_their_name 😂👇
            </text>
          </g>
        )}
      </svg>

      {/* ===================================================================
          SELECTIVE TOP HINGLISH POWER PHRASE (CLEAN & NON-INTRUSIVE!)
         =================================================================== */}
      {(() => {
        const activeKw = SELECTIVE_KEYWORDS.find(
          (k) => sec >= k.startSec && sec <= k.endSec
        );
        if (!activeKw) return null;

        const kwAge = frame - Math.round(activeKw.startSec * FPS);
        const kwPop = spring({
          frame: Math.max(0, kwAge),
          fps,
          config: { damping: 12, stiffness: 180 },
        });

        return (
          <div
            style={{
              position: "absolute",
              top: 95,
              left: 48,
              right: 48,
              textAlign: "center",
              transform: `scale(${0.82 + kwPop * 0.18})`,
              pointerEvents: "none",
            }}
          >
            {activeKw.topText && (
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 24px",
                  borderRadius: 100,
                  background: "rgba(10, 12, 22, 0.85)",
                  border: `2px solid ${activeKw.color}`,
                  color: GOLD_LIGHT,
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: 3,
                  marginBottom: 12,
                }}
              >
                {activeKw.topText}
              </div>
            )}
            <div
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.08,
                color: "#FFFFFF",
                textShadow: `0 0 35px ${activeKw.color}88, 0 10px 28px rgba(0,0,0,0.95)`,
              }}
            >
              <span style={{ color: activeKw.color }}>{activeKw.mainText}</span>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================
          STORY-MATCHED SFX CUES (NO REPETITIVE NOISE!)
         =================================================================== */}
      {/* 1. Initial Hook Pop */}
      <Sequence from={15} durationInFrames={30} layout="none">
        <Audio src={SFX.pop} volume={0.6} />
      </Sequence>

      {/* 2. Rope Snap (10.1s) + Body Thud on Platform (10.85s) */}
      <Sequence from={Math.round(10.1 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.snap} volume={0.85} />
      </Sequence>
      <Sequence from={Math.round(10.85 * FPS)} durationInFrames={40} layout="none">
        <Audio src={SFX.thud} volume={0.85} />
      </Sequence>

      {/* 3. Divine Mercy Light & Thought Bubble (13.6s) */}
      <Sequence from={Math.round(13.6 * FPS)} durationInFrames={55} layout="none">
        <Audio src={SFX.chime} volume={0.7} />
      </Sequence>

      {/* 4. Rebel Oversmart Speech Bubble Pop (22.2s) */}
      <Sequence from={Math.round(22.2 * FPS)} durationInFrames={25} layout="none">
        <Audio src={SFX.pop} volume={0.75} />
      </Sequence>

      {/* 5. Tsar Anger Rumble (29.4s) + Paper Tear (31.5s) + Tsar Speech Bubble (33.8s) */}
      <Sequence from={Math.round(29.4 * FPS)} durationInFrames={45} layout="none">
        <Audio src={SFX.angerBass} volume={0.8} />
      </Sequence>
      <Sequence from={Math.round(31.5 * FPS)} durationInFrames={40} layout="none">
        <Audio src={SFX.tear} volume={0.85} />
      </Sequence>
      <Sequence from={Math.round(33.8 * FPS)} durationInFrames={25} layout="none">
        <Audio src={SFX.pop} volume={0.7} />
      </Sequence>

      {/* 6. New Strong Rope Drop Clank (38.3s) */}
      <Sequence from={Math.round(38.3 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.chain} volume={0.75} />
      </Sequence>

      {/* 7. Mouth Lock Click (48.3s) */}
      <Sequence from={Math.round(48.3 * FPS)} durationInFrames={25} layout="none">
        <Audio src={SFX.lockClick} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ContinuousStoryWorld}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
