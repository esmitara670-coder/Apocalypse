import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* =========================================================================
   THE POWER PLAY — KINETIC SLAM & 20 RAPID CUTS EDITION (NO BOTTOM CAPTION)
   1080 x 1920 | 60 FPS | 68 Seconds (4080 Frames) | New Visual Every ~3.2s
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 4080;

const GOLD = "#E5C158";
const GOLD_BRIGHT = "#FFF0B8";
const CREAM = "#F7F2E7";
const DARK = "#06070B";
const CRIMSON = "#FF3B30";
const EMERALD = "#2CE59B";
const CYAN = "#00E5FF";
const PURPLE = "#B983FF";

/* =========================================================================
   01. HEAVY PROCEDURAL SFX ENGINE (BASS DROP, METALLIC SLAM, WHOOSH, SHATTER)
   ========================================================================= */

type SfxType = "slam" | "subdrop" | "whoosh" | "chisel" | "dust" | "shatter";

function synthesizeSfx(type: SfxType, duration = 0.35, freq = 140): string {
  const sampleRate = 22050;
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

    if (type === "slam") {
      // Heavy cinematic anvil/thud slam when words hit screen
      const sweep = freq * Math.pow(1 - p, 1.8) + 42;
      const noise = Math.sin(i * 19.13) * Math.cos(i * 0.73) * Math.exp(-p * 9);
      wave =
        Math.sin(2 * Math.PI * sweep * t) * 0.8 +
        Math.sin(2 * Math.PI * sweep * 2.4 * t) * 0.35 +
        noise * 0.45;
      env = Math.pow(1 - p, 2.2);
    } else if (type === "subdrop") {
      // Deep 808 sub-bass drop
      const subF = 115 * Math.pow(1 - p * 0.68, 1.5);
      wave =
        Math.sin(2 * Math.PI * subF * t) * 0.9 +
        Math.sin(2 * Math.PI * subF * 0.5 * t) * 0.4;
      env = Math.pow(1 - p, 1.7);
    } else if (type === "whoosh") {
      // Fast transition whip-whoosh
      const pseudoNoise = Math.sin(i * 12.9898) * Math.cos(i * 0.23);
      wave =
        pseudoNoise * 0.5 +
        Math.sin(2 * Math.PI * (140 + Math.sin(p * Math.PI) * 420) * t) * 0.45;
      env = Math.sin(Math.PI * p) * 0.9;
    } else if (type === "chisel") {
      // High metallic ring
      wave =
        Math.sin(2 * Math.PI * 2100 * t) * 0.6 +
        Math.sin(2 * Math.PI * 3450 * t) * 0.45;
      env = Math.exp(-p * 15);
    } else if (type === "dust") {
      // Magical high shimmer
      wave =
        Math.sin(2 * Math.PI * (1200 + (i % 9) * 210) * t) * 0.45 +
        Math.sin(2 * Math.PI * 2400 * t) * 0.25;
      env = Math.sin(Math.PI * p) * 0.7;
    } else if (type === "shatter") {
      // Glass / stone break burst
      const burst = Math.sin(i * 43.7) * Math.cos(i * 7.1);
      wave =
        burst * 0.65 +
        Math.sin(2 * Math.PI * (900 - p * 500) * t) * 0.4;
      env = Math.pow(1 - p, 2.8);
    }

    const sampleVal = Math.max(-1, Math.min(1, wave * env * 0.75));
    view.setInt16(44 + i * 2, sampleVal * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX_BANK: Record<SfxType, string> = {
  slam: synthesizeSfx("slam", 0.36, 150),
  subdrop: synthesizeSfx("subdrop", 0.48, 110),
  whoosh: synthesizeSfx("whoosh", 0.28, 260),
  chisel: synthesizeSfx("chisel", 0.18, 2100),
  dust: synthesizeSfx("dust", 0.5, 1400),
  shatter: synthesizeSfx("shatter", 0.38, 800),
};

/* =========================================================================
   02. 20 RAPID VISUAL CUTS (~3.2s EACH) WITH SLAMMING HINGLISH POWER WORDS
   ========================================================================= */

type CutConfig = {
  cutId: number;
  start: number;
  end: number;
  tag: string;
  slamTop: string;
  slamMain: string;
  slamSub: string;
  punchBadge: string;
  accent: string;
  camMode: "zoomIn" | "zoomOut" | "panRight" | "panLeft" | "dutch";
};

const RAPID_CUTS: CutConfig[] = [
  // 0.0s - 9.0s: THE COMMISSION (3 Cuts)
  {
    cutId: 1,
    start: 0,
    end: 180,
    tag: "ACT 01 // ROYAL DECREE",
    slamTop: "EK BAAR",
    slamMain: "EK RAJA THA! 👑",
    slamSub: "SUPREME POWER & EGO",
    punchBadge: "ROYAL EMPIRE ⚡",
    accent: GOLD,
    camMode: "zoomIn",
  },
  {
    cutId: 2,
    start: 180,
    end: 360,
    tag: "ACT 02 // THE MASTER",
    slamTop: "BULAYA EK",
    slamMain: "FAMOUS ARTIST! 🎨",
    slamSub: "GENIUS SCULPTOR",
    punchBadge: "MASTER CRAFTSMAN 🔨",
    accent: CYAN,
    camMode: "panRight",
  },
  {
    cutId: 3,
    start: 360,
    end: 540,
    tag: "ACT 03 // THE CREATION",
    slamTop: "BANWAYI EK",
    slamMain: "SHANDAAR MURTI! 🗿",
    slamSub: "PURE MARBLE PERFECTION",
    punchBadge: "100% MASTERPIECE ✨",
    accent: GOLD,
    camMode: "zoomOut",
  },

  // 9.0s - 16.3s: THE COMPLAINT (2 Cuts)
  {
    cutId: 4,
    start: 540,
    end: 760,
    tag: "ACT 04 // ROYAL ARROGANCE",
    slamTop: "PAR RAJA NE DIKHAYA",
    slamMain: "FULL ATTITUDE! 😤",
    slamSub: "BLIND EGO SPEAKS",
    punchBadge: "FAKE CRITICISM 🚨",
    accent: CRIMSON,
    camMode: "dutch",
  },
  {
    cutId: 5,
    start: 760,
    end: 980,
    tag: "ACT 05 // THE FLAW CLAIM",
    slamTop: "BOLA — IS MURTI KI",
    slamMain: "NAAK BADI HAI! 👃",
    slamSub: "POINTING AT THE NOSE",
    punchBadge: "TOO BIG?! ❌",
    accent: CRIMSON,
    camMode: "zoomIn",
  },

  // 16.3s - 23.6s: THE SILENT TRUTH (2 Cuts)
  {
    cutId: 6,
    start: 980,
    end: 1200,
    tag: "ACT 06 // GOLDEN RATIO",
    slamTop: "ARTIST JAANTA THA",
    slamMain: "NAAK PERFECT HAI! 📐",
    slamSub: "MATHEMATICALLY FLAWLESS",
    punchBadge: "0.0 MM ERROR ✅",
    accent: EMERALD,
    camMode: "panLeft",
  },
  {
    cutId: 7,
    start: 1200,
    end: 1420,
    tag: "ACT 07 // SELF CONTROL",
    slamTop: "PAR RAJA SE",
    slamMain: "BEHES NAHI KI! 🤫",
    slamSub: "LIPS LOCKED IN SILENCE",
    punchBadge: "ZERO ARGUMENT 🔒",
    accent: PURPLE,
    camMode: "zoomIn",
  },

  // 23.6s - 33.6s: THE DUST TRICK (3 Cuts)
  {
    cutId: 8,
    start: 1420,
    end: 1620,
    tag: "ACT 08 // SECRET WEAPON",
    slamTop: "CHUPCHAP HATH MEIN",
    slamMain: "THODI DHOOL LI! ✨",
    slamSub: "HIDDEN MARBLE POWDER",
    punchBadge: "SECRET TRICK ✊",
    accent: GOLD,
    camMode: "zoomIn",
  },
  {
    cutId: 9,
    start: 1620,
    end: 1820,
    tag: "ACT 09 // THE ACTING",
    slamTop: "BINA NAAK KAATE",
    slamMain: "NATAK SHURU KIYA! 🎭",
    slamSub: "CHISEL HITTING EMPTY AIR",
    punchBadge: "GAP: 3 CM (NO CUT!) ⚡",
    accent: CYAN,
    camMode: "dutch",
  },
  {
    cutId: 10,
    start: 1820,
    end: 2020,
    tag: "ACT 10 // THE ILLUSION",
    slamTop: "AUR UPAR SE",
    slamMain: "DHOOL GIRA DI! 🌪️",
    slamSub: "FAKE DUST RAINING DOWN",
    punchBadge: "200 IQ ILLUSION 🧠",
    accent: GOLD,
    camMode: "zoomOut",
  },

  // 33.6s - 41.6s: KING CONVINCED (2 Cuts)
  {
    cutId: 11,
    start: 2020,
    end: 2260,
    tag: "ACT 11 // ROYAL DELIGHT",
    slamTop: "DEKHTE HI",
    slamMain: "RAJA KHUSH HUA! 🤩",
    slamSub: "FOOLED BY HIS OWN EYES",
    punchBadge: "EGO SATISFIED 👑",
    accent: EMERALD,
    camMode: "zoomIn",
  },
  {
    cutId: 12,
    start: 2260,
    end: 2500,
    tag: "ACT 12 // THE VERDICT",
    slamTop: "BOLA — WAH!",
    slamMain: "AB PERFECT HAI! ✅",
    slamSub: "EVEN THOUGH NOTHING CHANGED",
    punchBadge: "SAME NOSE! 😂",
    accent: EMERALD,
    camMode: "panRight",
  },

  // 41.6s - 51.6s: 48 LAWS OF POWER (3 Cuts)
  {
    cutId: 13,
    start: 2500,
    end: 2700,
    tag: "ACT 13 // THE PLAYBOOK",
    slamTop: "ROBERT GREENE KI",
    slamMain: "48 LAWS OF POWER 📖",
    slamSub: "WORLD'S DARKEST STRATEGY BOOK",
    punchBadge: "PSYCHOLOGY BIBLE 🔥",
    accent: GOLD,
    camMode: "zoomIn",
  },
  {
    cutId: 14,
    start: 2700,
    end: 2900,
    tag: "ACT 14 // THE GOLDEN RULE",
    slamTop: "YEH HAI",
    slamMain: "LAW NUMBER 09! ⚡",
    slamSub: "THE SUPREME POWER LAW",
    punchBadge: "LAW #09 UNLOCKED 🔓",
    accent: GOLD,
    camMode: "dutch",
  },
  {
    cutId: 15,
    start: 2900,
    end: 3100,
    tag: "ACT 15 // CORE COMMAND",
    slamTop: "NEVER ARGUE.",
    slamMain: "WIN BY ACTIONS! ♟️",
    slamSub: "ACTIONS CRUSH WORDS",
    punchBadge: "CHECKMATE Move 👑",
    accent: CYAN,
    camMode: "zoomOut",
  },

  // 51.6s - 60.6s: REAL LIFE LESSON (3 Cuts)
  {
    cutId: 16,
    start: 3100,
    end: 3280,
    tag: "ACT 16 // TOXIC DEBATES",
    slamTop: "LOGON SE FALTU",
    slamMain: "BEHES MAT KARO! ❌",
    slamSub: "ARGUMENTS BREED RESENTMENT",
    punchBadge: "STOP ARGUING 🛑",
    accent: CRIMSON,
    camMode: "dutch",
  },
  {
    cutId: 17,
    start: 3280,
    end: 3460,
    tag: "ACT 17 // PROTECT ENERGY",
    slamTop: "APNA WAQT AUR",
    slamMain: "ENERGY BACHAO! 🔋",
    slamSub: "DON'T DRAIN YOUR BRAIN",
    punchBadge: "SAVE 100% FOCUS ⚡",
    accent: GOLD,
    camMode: "panLeft",
  },
  {
    cutId: 18,
    start: 3460,
    end: 3640,
    tag: "ACT 18 // PROVE IT",
    slamTop: "APNA HAR POINT",
    slamMain: "ACTION SE SABIT KARO! 🎯",
    slamSub: "LET RESULTS MAKE THE NOISE",
    punchBadge: "BULLSEYE IMPACT 💥",
    accent: EMERALD,
    camMode: "zoomIn",
  },

  // 60.6s - 68.0s: FUNNY FRIEND CTA (2 Cuts)
  {
    cutId: 19,
    start: 3640,
    end: 3860,
    tag: "ACT 19 // THAT ONE FRIEND",
    slamTop: "KAUN SA DOST KARTA HAI",
    slamMain: "DIN BHAR BEHES? 🗣️",
    slamSub: "ARGUES ON EVERY SINGLE TOPIC",
    punchBadge: "FALTU DEBATE KING 🤡",
    accent: PURPLE,
    camMode: "dutch",
  },
  {
    cutId: 20,
    start: 3860,
    end: 4080,
    tag: "ACT 20 // EXPOSE THEM",
    slamTop: "COMMENT MEIN USKA",
    slamMain: "NAAM BATAO! 👇",
    slamSub: "TAG YOUR ARGUMENTATIVE FRIEND",
    punchBadge: "DROP NAME BELOW 🔥",
    accent: GOLD,
    camMode: "zoomIn",
  },
];

/* =========================================================================
   03. REUSABLE HIGH-DETAIL ILLUSTRATION PRIMITIVES
   ========================================================================= */

const MarbleBustSVG: React.FC<{
  scale?: number;
  redNose?: boolean;
  frame: number;
}> = ({ scale = 1, redNose = false, frame }) => {
  const pulse = 1 + Math.sin(frame / 4) * 0.08;
  return (
    <g transform={`scale(${scale})`}>
      {/* Pedestal */}
      <rect x="-135" y="250" width="270" height="32" rx="6" fill="#6E655A" stroke={GOLD} strokeWidth="3" />
      <path d="M-105 160 L105 160 L92 250 L-92 250 Z" fill="#9E9486" stroke="#5C5349" strokeWidth="4" />
      {/* Toga Shoulders */}
      <path
        d="M-145 160 C-135 65 -75 35 -35 25 L35 25 C75 35 135 65 145 160 Z"
        fill="#E5DDD0"
        stroke="#8C8274"
        strokeWidth="4"
      />
      <path d="M-95 65 Q0 135 95 65 M-110 115 Q0 165 110 115" fill="none" stroke="#9E9383" strokeWidth="5" />
      {/* Neck */}
      <rect x="-38" y="-35" width="76" height="70" fill="#CFC6B6" />
      {/* Sculpted Head */}
      <path
        d="M-78 -135 C-85 -215 0 -235 0 -235 C0 -235 85 -215 78 -135 C78 -55 55 0 0 8 C-55 0 -78 -55 -78 -135 Z"
        fill="#F4EFE4"
        stroke="#8C8274"
        strokeWidth="4"
      />
      {/* 3D Shadow Half */}
      <path d="M0 -235 C55 -220 78 -180 78 -135 C78 -55 55 0 0 8 Z" fill="#4A4238" opacity="0.22" />
      {/* Roman Curly Hair */}
      <g fill="#C8BFAF" stroke="#6E655A" strokeWidth="3">
        <circle cx="-62" cy="-175" r="28" />
        <circle cx="-34" cy="-202" r="30" />
        <circle cx="0" cy="-212" r="32" />
        <circle cx="34" cy="-202" r="30" />
        <circle cx="62" cy="-175" r="28" />
      </g>
      {/* Eyes & Lips */}
      <line x1="-48" y1="-132" x2="-14" y2="-132" stroke="#5C5349" strokeWidth="6" strokeLinecap="round" />
      <line x1="14" y1="-132" x2="48" y2="-132" stroke="#5C5349" strokeWidth="6" strokeLinecap="round" />
      <path d="M-24 -42 Q0 -30 24 -42" fill="none" stroke="#6E655A" strokeWidth="5" strokeLinecap="round" />
      {/* Nose */}
      <g transform={redNose ? `translate(0 -95) scale(${pulse}) translate(0 95)` : undefined}>
        <path
          d="M-6 -135 L-24 -70 L0 -60 L18 -70 L6 -135 Z"
          fill={redNose ? CRIMSON : "#EAE2D3"}
          stroke={redNose ? "#FFFFFF" : "#5C5349"}
          strokeWidth="4"
        />
      </g>
    </g>
  );
};

const RoyalKingSVG: React.FC<{
  mood: "angry" | "happy" | "proud";
  scale?: number;
}> = ({ mood, scale = 1 }) => (
  <g transform={`scale(${scale})`}>
    {/* Cape */}
    <path
      d="M-135 65 C-165 155 -180 260 -190 340 L190 340 C180 260 165 155 135 65 Z"
      fill="#6B1426"
      stroke={GOLD}
      strokeWidth="6"
    />
    {/* Fur Collar */}
    <path d="M-110 55 Q0 115 110 55 L130 105 Q0 165 -130 105 Z" fill="#F7F2E7" stroke="#BFB5A4" strokeWidth="3" />
    {/* Head */}
    <ellipse cx="0" cy="-15" rx="64" ry="74" fill="#C98A60" stroke="#7A4B2A" strokeWidth="4" />
    {/* Beard */}
    <path
      d="M-62 -5 C-65 65 -30 98 0 108 C30 98 65 65 62 -5 C42 22 20 26 0 26 C-20 26 -42 22 -62 -5 Z"
      fill="#1F181B"
    />
    {/* Eyes & Mouth */}
    {mood === "angry" && (
      <g>
        <line x1="-44" y1="-48" x2="-12" y2="-32" stroke="#1A1114" strokeWidth="8" strokeLinecap="round" />
        <line x1="44" y1="-48" x2="12" y2="-32" stroke="#1A1114" strokeWidth="8" strokeLinecap="round" />
        <circle cx="-26" cy="-26" r="8" fill={CRIMSON} />
        <circle cx="26" cy="-26" r="8" fill={CRIMSON} />
        <rect x="-24" y="34" width="48" height="22" rx="8" fill={CRIMSON} />
      </g>
    )}
    {mood === "happy" && (
      <g>
        <path d="M-44 -42 Q-26 -58 -12 -42" fill="none" stroke="#1A1114" strokeWidth="7" strokeLinecap="round" />
        <path d="M12 -42 Q26 -58 44 -42" fill="none" stroke="#1A1114" strokeWidth="7" strokeLinecap="round" />
        <path d="M-28 28 Q0 58 28 28 Z" fill="#FFFFFF" stroke={GOLD} strokeWidth="3" />
      </g>
    )}
    {mood === "proud" && (
      <g>
        <line x1="-42" y1="-40" x2="-12" y2="-40" stroke="#1A1114" strokeWidth="7" strokeLinecap="round" />
        <line x1="12" y1="-40" x2="42" y2="-40" stroke="#1A1114" strokeWidth="7" strokeLinecap="round" />
        <circle cx="-26" cy="-24" r="7" fill="#1A1114" />
        <circle cx="26" cy="-24" r="7" fill="#1A1114" />
      </g>
    )}
    {/* Crown */}
    <path
      d="M-72 -62 L-88 -148 L-36 -105 L0 -168 L36 -105 L88 -148 L72 -62 Z"
      fill={GOLD}
      stroke="#FFF4C8"
      strokeWidth="5"
    />
    <circle cx="0" cy="-148" r="11" fill="#FFFFFF" />
    <circle cx="-55" cy="-120" r="9" fill={CRIMSON} />
    <circle cx="55" cy="-120" r="9" fill={CRIMSON} />
  </g>
);

/* =========================================================================
   04. 20 UNIQUE VISUAL STAGES (ONE FOR EVERY 3-SECOND CUT!)
   ========================================================================= */

const CutVisualStage: React.FC<{
  cutId: number;
  localFrame: number;
  accent: string;
}> = ({ cutId, localFrame, accent }) => {
  const spin = localFrame * 1.4;
  const pulse = 1 + Math.sin(localFrame / 5) * 0.06;

  return (
    <svg width="960" height="820" viewBox="0 0 960 820" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="centerAura">
          <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
          <stop offset="65%" stopColor={accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dynamic Pulsing Aura Behind Every Visual */}
      <circle cx="480" cy="410" r={360 * pulse} fill="url(#centerAura)" />

      {/* Rotating Cyber/Royal Geometry Ring */}
      <circle
        cx="480"
        cy="410"
        r="330"
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeDasharray="14 18"
        opacity="0.45"
        transform={`rotate(${spin} 480 410)`}
      />

      {/* CUT 1: GIANT KING ON THRONE & GOLDEN GATES */}
      {cutId === 1 && (
        <g transform="translate(480 430)">
          <path d="M-320 260 V-220 Q0 -380 320 -220 V260 Z" fill="#12101B" stroke={GOLD} strokeWidth="6" />
          {[-240, 240].map((x) => (
            <rect key={x} x={x - 24} y="-210" width="48" height="470" fill="#2B2230" stroke={GOLD} strokeWidth="4" />
          ))}
          <RoyalKingSVG mood="proud" scale={1.15} />
        </g>
      )}

      {/* CUT 2: FAMOUS SCULPTOR & GOLDEN CHISEL BLUEPRINT */}
      {cutId === 2 && (
        <g transform="translate(480 410)">
          <rect x="-330" y="-250" width="660" height="500" rx="28" fill="#0B192C" stroke={CYAN} strokeWidth="5" />
          {/* Blueprint Grid */}
          {[-2, -1, 0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <line x1={i * 110} y1="-250" x2={i * 110} y2="250" stroke={CYAN} strokeWidth="1.5" opacity="0.25" />
              <line x1="-330" y1={i * 80} x2="330" y2={i * 80} stroke={CYAN} strokeWidth="1.5" opacity="0.25" />
            </React.Fragment>
          ))}
          {/* Giant Crossed Sculptor Mallet & Chisel */}
          <g transform={`scale(${pulse})`}>
            <rect x="-220" y="-22" width="440" height="44" rx="10" fill={GOLD} stroke="#FFFFFF" strokeWidth="4" transform="rotate(-35)" />
            <rect x="-220" y="-22" width="440" height="44" rx="10" fill={CYAN} stroke="#FFFFFF" strokeWidth="4" transform="rotate(35)" />
            <circle r="72" fill="#0B192C" stroke={GOLD} strokeWidth="6" />
            <text y="24" textAnchor="middle" fontSize="68">🎨</text>
          </g>
        </g>
      )}

      {/* CUT 3: TOWERING MARBLE STATUE UNDER GOD-RAYS */}
      {cutId === 3 && (
        <g transform="translate(480 460)">
          <polygon points="-180,-380 180,-380 340,280 -340,280" fill={GOLD} opacity="0.16" />
          <MarbleBustSVG scale={1.28} frame={localFrame} />
          {/* Sparkles around statue */}
          {[-220, 220, -160, 180].map((sx, i) => (
            <circle
              key={i}
              cx={sx}
              cy={-180 + (i % 2) * 160}
              r={10 + (localFrame % 8)}
              fill={GOLD_BRIGHT}
              filter="url(#neonGlow)"
            />
          ))}
        </g>
      )}

      {/* CUT 4: ANGRY KING POINTING WITH EGO METER */}
      {cutId === 4 && (
        <g transform="translate(480 430)">
          <RoyalKingSVG mood="angry" scale={1.18} />
          {/* Danger Ego Gauge */}
          <g transform="translate(0 -275)">
            <rect x="-240" y="-40" width="480" height="72" rx="36" fill="#2A090D" stroke={CRIMSON} strokeWidth="5" />
            <text y="10" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="900" letterSpacing="4">
              ⚠️ KING'S EGO LEVEL: 999%
            </text>
          </g>
        </g>
      )}

      {/* CUT 5: EXTREME MACRO ZOOM ON STATUE NOSE + RED CALIPER */}
      {cutId === 5 && (
        <g transform="translate(480 440)">
          <MarbleBustSVG scale={1.45} redNose={true} frame={localFrame} />
          {/* Giant Red Target Reticle Locked on Nose */}
          <g transform="translate(0 -125)">
            <circle
              r={115 * pulse}
              fill="none"
              stroke={CRIMSON}
              strokeWidth="8"
              strokeDasharray="22 14"
              transform={`rotate(${localFrame * 3})`}
            />
            <line x1="-170" y1="0" x2="-75" y2="0" stroke={CRIMSON} strokeWidth="8" />
            <line x1="75" y1="0" x2="170" y2="0" stroke={CRIMSON} strokeWidth="8" />
            <rect x="135" y="-45" width="240" height="80" rx="16" fill={CRIMSON} />
            <text x="255" y="10" textAnchor="middle" fill="#FFFFFF" fontSize="34" fontWeight="900">
              TOO BIG?!
            </text>
          </g>
        </g>
      )}

      {/* CUT 6: GOLDEN RATIO FIBONACCI LASER SCAN ON STATUE */}
      {cutId === 6 && (
        <g transform="translate(480 445)">
          <MarbleBustSVG scale={1.25} frame={localFrame} />
          {/* Green Laser Scan Bar Moving Up & Down */}
          {(() => {
            const scanY = -260 + ((localFrame * 5) % 420);
            return (
              <g>
                <line x1="-280" y1={scanY} x2="280" y2={scanY} stroke={EMERALD} strokeWidth="8" filter="url(#neonGlow)" />
                <rect x="-260" y="-250" width="520" height="440" fill="none" stroke={EMERALD} strokeWidth="4" strokeDasharray="12 12" />
              </g>
            );
          })()}
          <g transform="translate(0 -305)">
            <rect x="-250" y="-36" width="500" height="68" rx="18" fill="#082419" stroke={EMERALD} strokeWidth="4" />
            <text y="10" textAnchor="middle" fill={EMERALD} fontSize="30" fontWeight="900" letterSpacing="3">
              ✅ SYMMETRY SCAN: 100.0%
            </text>
          </g>
        </g>
      )}

      {/* CUT 7: GIANT GOLDEN PADLOCK SLAMMING ON LIPS */}
      {cutId === 7 && (
        <g transform="translate(480 410)">
          {/* Crossed-out Speech Bubbles Behind */}
          <g opacity="0.35">
            <rect x="-340" y="-220" width="240" height="140" rx="24" fill="#2A1820" stroke={CRIMSON} strokeWidth="5" />
            <line x1="-320" y1="-200" x2="-120" y2="-100" stroke={CRIMSON} strokeWidth="10" />
            <rect x="100" y="-220" width="240" height="140" rx="24" fill="#2A1820" stroke={CRIMSON} strokeWidth="5" />
            <line x1="120" y1="-200" x2="320" y2="-100" stroke={CRIMSON} strokeWidth="10" />
          </g>
          {/* Giant Metallic Padlock */}
          <g transform={`scale(${0.9 + pulse * 0.12})`}>
            <path
              d="M-110 -40 V-135 A110 110 0 0 1 110 -135 V-40"
              fill="none"
              stroke={GOLD}
              strokeWidth="36"
              strokeLinecap="round"
            />
            <rect x="-175" y="-45" width="350" height="270" rx="42" fill="#1F172B" stroke={GOLD} strokeWidth="12" />
            <circle cx="0" cy="75" r="36" fill={GOLD} />
            <rect x="-14" y="85" width="28" height="65" rx="8" fill={GOLD} />
          </g>
        </g>
      )}

      {/* CUT 8: HAND SCOOPING GLOWING GOLDEN MARBLE DUST */}
      {cutId === 8 && (
        <g transform="translate(480 420)">
          {/* Glowing Pile of Marble Dust */}
          <path d="M-280 180 Q0 -60 280 180 Z" fill={GOLD} opacity="0.85" filter="url(#neonGlow)" />
          {/* Artist's Fist Closing Around Dust */}
          <g transform={`translate(0 ${-40 + Math.sin(localFrame / 5) * 18})`}>
            <circle r="115" fill="#C98A60" stroke={GOLD_BRIGHT} strokeWidth="8" />
            <text y="28" textAnchor="middle" fontSize="110">✊</text>
          </g>
          {/* Rising Sparkles */}
          {Array.from({ length: 18 }, (_, i) => {
            const ang = (i / 18) * Math.PI * 2;
            const rad = 140 + ((localFrame * 3 + i * 25) % 140);
            return (
              <circle
                key={i}
                cx={Math.cos(ang) * rad}
                cy={Math.sin(ang) * rad}
                r="8"
                fill={GOLD_BRIGHT}
                filter="url(#neonGlow)"
              />
            );
          })}
        </g>
      )}

      {/* CUT 9: FAKE CHISEL IN AIR (GREEN 3CM GAP LASER PROOF!) */}
      {cutId === 9 && (
        <g transform="translate(480 440)">
          <MarbleBustSVG scale={1.25} frame={localFrame} />
          {/* Green Laser Barrier Showing Chisel DOES NOT Touch Nose */}
          <line x1="95" y1="-260" x2="95" y2="60" stroke={EMERALD} strokeWidth="6" strokeDasharray="12 8" />
          {/* Oscillating Chisel & Hammer in Empty Air */}
          <g transform={`translate(${195 + Math.sin(localFrame * 0.8) * 22} -110)`}>
            <rect x="-85" y="-16" width="170" height="32" rx="8" fill={CYAN} stroke="#FFFFFF" strokeWidth="4" />
            <text x="0" y="-42" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="28" fontWeight="900">
              🔨 FAKE TAP!
            </text>
          </g>
        </g>
      )}

      {/* CUT 10: 60 GOLDEN DUST PARTICLES RAINING DOWN */}
      {cutId === 10 && (
        <g transform="translate(480 410)">
          <MarbleBustSVG scale={1.15} frame={localFrame} />
          {/* 50 Falling Golden Marble Dust Particles */}
          {Array.from({ length: 50 }, (_, i) => {
            const prog = ((localFrame * 2.5 + i * 7) % 120) / 120;
            const px = -160 + ((i * 37) % 320) + Math.sin(prog * 8 + i) * 25;
            const py = -240 + prog * 520;
            return (
              <circle
                key={i}
                cx={px}
                cy={py}
                r={4 + (i % 5) * 1.8}
                fill={i % 2 === 0 ? "#FFFFFF" : GOLD}
                opacity={1 - prog * 0.7}
                filter="url(#neonGlow)"
              />
            );
          })}
        </g>
      )}

      {/* CUT 11: OVERJOYED KING WITH CROWN SPARKLES */}
      {cutId === 11 && (
        <g transform="translate(480 430)">
          <RoyalKingSVG mood="happy" scale={1.25} />
          <g transform="translate(0 -285)">
            <rect x="-240" y="-40" width="480" height="76" rx="38" fill="#09291E" stroke={EMERALD} strokeWidth="5" />
            <text y="10" textAnchor="middle" fill={EMERALD} fontSize="34" fontWeight="900" letterSpacing="3">
              🤩 ROYAL MIND BLOWN!
            </text>
          </g>
        </g>
      )}

      {/* CUT 12: BEFORE VS AFTER SPLIT (0.0 MM DIFFERENCE!) */}
      {cutId === 12 && (
        <g transform="translate(480 410)">
          <rect x="-410" y="-250" width="380" height="480" rx="28" fill="#101926" stroke={CYAN} strokeWidth="5" />
          <text x="-220" y="-185" textAnchor="middle" fill={CYAN} fontSize="30" fontWeight="900">
            BEFORE
          </text>
          <g transform="translate(-220 40) scale(0.68)">
            <MarbleBustSVG frame={localFrame} />
          </g>

          <rect x="30" y="-250" width="380" height="480" rx="28" fill="#0E241B" stroke={EMERALD} strokeWidth="5" />
          <text x="220" y="-185" textAnchor="middle" fill={EMERALD} fontSize="30" fontWeight="900">
            AFTER (0% CUT)
          </text>
          <g transform="translate(220 40) scale(0.68)">
            <MarbleBustSVG frame={localFrame} />
          </g>

          <circle r="68" fill={GOLD} stroke="#FFFFFF" strokeWidth="6" />
          <text y="16" textAnchor="middle" fill="#141008" fontSize="48" fontWeight="900">
            =
          </text>
        </g>
      )}

      {/* CUT 13: THE 48 LAWS OF POWER 3D MONOLITH BOOK */}
      {cutId === 13 && (
        <g transform={`translate(480 410) rotate(${-5 + Math.sin(localFrame / 10) * 3})`}>
          <rect x="-210" y="-260" width="420" height="520" rx="24" fill="#5E1122" stroke={GOLD} strokeWidth="10" />
          <rect x="-180" y="-230" width="360" height="460" rx="14" fill="none" stroke={GOLD_BRIGHT} strokeWidth="3" />
          <text y="-120" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="28" fontWeight="900" letterSpacing="6">
            ROBERT GREENE
          </text>
          <text y="-35" textAnchor="middle" fill="#FFFFFF" fontSize="64" fontWeight="900">
            48 LAWS
          </text>
          <text y="35" textAnchor="middle" fill={GOLD} fontSize="54" fontWeight="900">
            OF POWER
          </text>
          <circle cy="145" r="52" fill="#171014" stroke={GOLD} strokeWidth="5" />
          <text y="162" textAnchor="middle" fill={GOLD} fontSize="46" fontWeight="900">
            👑
          </text>
        </g>
      )}

      {/* CUT 14: GIANT FORGED "LAW #09" EMBLEM */}
      {cutId === 14 && (
        <g transform={`translate(480 410) scale(${pulse})`}>
          <polygon
            points="0,-290 250,-145 250,145 0,290 -250,145 -250,-145"
            fill="#19130B"
            stroke={GOLD}
            strokeWidth="12"
          />
          <text y="-85" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="42" fontWeight="900" letterSpacing="8">
            SUPREME LAW
          </text>
          <text y="95" textAnchor="middle" fill={GOLD} fontSize="210" fontWeight="900">
            #09
          </text>
        </g>
      )}

      {/* CUT 15: GOLDEN CHESS KNIGHT SMASHING SPEECH BUBBLE */}
      {cutId === 15 && (
        <g transform="translate(480 410)">
          {/* Shattered Argument Bubble */}
          <rect
            x="-260"
            y="40"
            width="520"
            height="170"
            rx="28"
            fill="#2B1419"
            stroke={CRIMSON}
            strokeWidth="6"
            strokeDasharray="18 10"
          />
          <text y="140" textAnchor="middle" fill={CRIMSON} fontSize="46" fontWeight="900">
            ❌ "ARGUMENTS" CRUSHED
          </text>
          {/* Giant Golden Chess Piece Above */}
          <g transform={`translate(0 ${-110 + Math.sin(localFrame / 4) * 14})`}>
            <circle r="130" fill="#122430" stroke={CYAN} strokeWidth="8" />
            <text y="42" textAnchor="middle" fontSize="135">
              ♟️
            </text>
          </g>
        </g>
      )}

      {/* CUT 16: TOXIC ARGUMENT CLASH (RED LIGHTNING) */}
      {cutId === 16 && (
        <g transform="translate(480 410)">
          <circle cx="-210" cy="0" r="135" fill="#2A0F15" stroke={CRIMSON} strokeWidth="8" />
          <text x="-210" y="38" textAnchor="middle" fontSize="110">🤬</text>
          <circle cx="210" cy="0" r="135" fill="#2A0F15" stroke={CRIMSON} strokeWidth="8" />
          <text x="210" y="38" textAnchor="middle" fontSize="110">😡</text>
          <text x="0" y="35" textAnchor="middle" fontSize="115">⚡</text>
        </g>
      )}

      {/* CUT 17: BATTERY & HOURGLASS DRAINING TO 0% */}
      {cutId === 17 && (
        <g transform="translate(480 410)">
          <rect x="-280" y="-130" width="520" height="260" rx="36" fill="#141824" stroke={GOLD} strokeWidth="10" />
          <rect x="240" y="-55" width="38" height="110" rx="12" fill={GOLD} />
          {/* Battery Charge Bar */}
          {(() => {
            const charge = interpolate(localFrame, [0, 140], [18, 100], { extrapolateRight: "clamp" });
            return (
              <rect
                x="-245"
                y="-95"
                width={(charge / 100) * 450}
                height="190"
                rx="22"
                fill={EMERALD}
              />
            );
          })()}
          <text x="-20" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="64" fontWeight="900">
            100% POWER ⚡
          </text>
        </g>
      )}

      {/* CUT 18: GOLDEN ARROW HITTING BULLSEYE TARGET */}
      {cutId === 18 && (
        <g transform="translate(480 410)">
          <circle r="260" fill="#10241B" stroke={EMERALD} strokeWidth="12" />
          <circle r="185" fill="#17382A" stroke="#FFFFFF" strokeWidth="10" />
          <circle r="110" fill={CRIMSON} stroke="#FFFFFF" strokeWidth="10" />
          <circle r="45" fill={GOLD} />
          {/* Arrow Piercing Center */}
          <line x1="260" y1="-260" x2="0" y2="0" stroke={GOLD_BRIGHT} strokeWidth="16" strokeLinecap="round" />
        </g>
      )}

      {/* CUT 19: FUNNY DEBATE KING FRIEND SILHOUETTE */}
      {cutId === 19 && (
        <g transform="translate(480 410)">
          <circle r="220" fill="#1F132E" stroke={PURPLE} strokeWidth="8" />
          <text y="35" textAnchor="middle" fontSize="165">🤡</text>
          <g transform="translate(0 -235)">
            <rect x="-250" y="-42" width="500" height="76" rx="22" fill={PURPLE} />
            <text y="10" textAnchor="middle" fill="#12091C" fontSize="34" fontWeight="900" letterSpacing="2">
              👑 "FALTU BEHES" CHAMPION
            </text>
          </g>
        </g>
      )}

      {/* CUT 20: GIANT PULSING COMMENT BOX CTA */}
      {cutId === 20 && (
        <g transform={`translate(480 410) scale(${pulse})`}>
          <rect x="-380" y="-190" width="760" height="380" rx="40" fill="#16141D" stroke={GOLD} strokeWidth="10" />
          <text y="-85" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="36" fontWeight="900" letterSpacing="4">
            💬 TAG YOUR DEBATE KING FRIEND:
          </text>
          <rect x="-310" y="-25" width="620" height="115" rx="24" fill="#09090D" stroke={CYAN} strokeWidth="5" />
          <text x="0" y="46" textAnchor="middle" fill="#FFFFFF" fontSize="44" fontWeight="900">
            @tag_that_friend 😂👇
          </text>
        </g>
      )}
    </svg>
  );
};

/* =========================================================================
   05. CAMERA KEYFRAME RIG + KINETIC SLAMMING WORDS (NO BOTTOM CAPTION!)
   ========================================================================= */

const RapidCutScene: React.FC<{ cut: CutConfig }> = ({ cut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = cut.end - cut.start;

  // 1. Primary Slam (Frame 4) & Secondary Badge Slam (Frame 65)
  const mainSlamSpring = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 9, stiffness: 240, mass: 0.65 },
  });

  const secondarySlamSpring = spring({
    frame: Math.max(0, frame - 62),
    fps,
    config: { damping: 8, stiffness: 260, mass: 0.6 },
  });

  // 2. Violent Camera Shake Keyframes on Both Slam Impacts (Frame 3..18 & Frame 62..76)
  const impact1Env = interpolate(frame, [3, 7, 20], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const impact2Env = interpolate(frame, [62, 66, 78], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const totalShake = impact1Env * 22 + impact2Env * 18;
  const shakeX = Math.sin(frame * 2.9) * totalShake;
  const shakeY = Math.cos(frame * 3.7) * totalShake;
  const shakeRot = Math.sin(frame * 2.1) * (totalShake * 0.09);

  // 3. Continuous Camera Keyframe Motion Across the 3-Second Cut
  const camProgress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let keyframeScale = 1;
  let keyframeX = 0;
  let keyframeRot = 0;

  if (cut.camMode === "zoomIn") {
    keyframeScale = interpolate(camProgress, [0, 1], [0.94, 1.12]);
  } else if (cut.camMode === "zoomOut") {
    keyframeScale = interpolate(camProgress, [0, 1], [1.14, 0.95]);
  } else if (cut.camMode === "panRight") {
    keyframeScale = 1.05;
    keyframeX = interpolate(camProgress, [0, 1], [-35, 35]);
  } else if (cut.camMode === "panLeft") {
    keyframeScale = 1.05;
    keyframeX = interpolate(camProgress, [0, 1], [35, -35]);
  } else if (cut.camMode === "dutch") {
    keyframeScale = interpolate(camProgress, [0, 1], [0.96, 1.08]);
    keyframeRot = interpolate(camProgress, [0, 1], [-2.5, 2.5]);
  }

  // Slam Scale: drops from 2.6x down to 1.0x!
  const mainWordScale = interpolate(mainSlamSpring, [0, 1], [2.6, 1]);
  const badgeScale = interpolate(secondarySlamSpring, [0, 1], [2.4, 1]);

  // Flash & Shockwave Ring on Slam
  const flashOpacity =
    interpolate(frame, [0, 4, 14], [0, 0.38, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) +
    interpolate(frame, [62, 65, 75], [0, 0.25, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const shockwaveR = interpolate(frame, [3, 28], [40, 820], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shockwaveOpacity = interpolate(frame, [3, 28], [0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at 50% 45%, ${cut.accent}26 0%, transparent 62%),
          linear-gradient(165deg, #12131F 0%, #06070B 52%, #100E18 100%)
        `,
        overflow: "hidden",
      }}
    >
      {/* CAMERA RIG WRAPPER WITH KEYFRAMES & IMPACT SHAKE */}
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX + keyframeX}px, ${shakeY}px) rotate(${
            shakeRot + keyframeRot
          }deg) scale(${keyframeScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* Expanding Shockwave Ring on Slam Impact */}
        <svg
          width={WIDTH}
          height={HEIGHT}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <circle
            cx="540"
            cy="960"
            r={shockwaveR}
            fill="none"
            stroke={cut.accent}
            strokeWidth="12"
            opacity={shockwaveOpacity}
          />
        </svg>

        {/* TOP TELEMETRY HEADER */}
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 65,
            right: 65,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "10px 24px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.07)",
              border: `2px solid ${cut.accent}`,
              color: cut.accent,
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 4,
            }}
          >
            {cut.tag}
          </div>
          <div
            style={{
              color: "#9E9689",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 3,
            }}
          >
            CUT {String(cut.cutId).padStart(2, "0")} / 20
          </div>
        </div>

        {/* ===============================================================
            TOP SLAMMING KINETIC HINGLISH HEADLINE ("DHAKKA MERE ASBE!")
           =============================================================== */}
        <div
          style={{
            position: "absolute",
            top: 175,
            left: 40,
            right: 40,
            textAlign: "center",
            transform: `scale(${mainWordScale})`,
            opacity: Math.min(1, frame / 4),
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              color: CREAM,
              letterSpacing: 4,
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow: "0 8px 25px rgba(0,0,0,0.8)",
            }}
          >
            {cut.slamTop}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: cut.slamMain.length > 16 ? 78 : 92,
              fontWeight: 900,
              lineHeight: 1.02,
              color: cut.accent,
              letterSpacing: -2,
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow: `0 0 55px ${cut.accent}99, 0 14px 35px rgba(0,0,0,0.95)`,
            }}
          >
            {cut.slamMain}
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 24,
              fontWeight: 800,
              color: "#B8B2A6",
              letterSpacing: 6,
            }}
          >
            {cut.slamSub}
          </div>
        </div>

        {/* ===============================================================
            CENTER DYNAMIC VISUAL STAGE (NEW ILLUSTRATION EVERY ~3s)
           =============================================================== */}
        <div
          style={{
            position: "absolute",
            top: 495,
            left: 60,
            width: 960,
            height: 820,
          }}
        >
          <CutVisualStage
            cutId={cut.cutId}
            localFrame={frame}
            accent={cut.accent}
          />
        </div>

        {/* ===============================================================
            SECONDARY MID-CUT SLAMMING PUNCH BADGE (HITS AT FRAME 62!)
           =============================================================== */}
        {frame >= 62 && (
          <div
            style={{
              position: "absolute",
              bottom: 185,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              transform: `scale(${badgeScale}) rotate(-2deg)`,
            }}
          >
            <div
              style={{
                padding: "26px 64px",
                borderRadius: 28,
                background: `linear-gradient(135deg, ${cut.accent}, #FFF3C4)`,
                color: "#09080C",
                fontSize: 48,
                fontWeight: 900,
                fontFamily: '"Arial Black", Impact, sans-serif',
                letterSpacing: 3,
                boxShadow: `0 0 70px ${cut.accent}AA, 0 22px 50px rgba(0,0,0,0.85)`,
                border: "5px solid #FFFFFF",
              }}
            >
              {cut.punchBadge}
            </div>
          </div>
        )}
      </AbsoluteFill>

      {/* SCREEN FLASH ON SLAM IMPACTS */}
      <AbsoluteFill
        style={{
          background: "#FFFFFF",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/* =========================================================================
   06. MAIN REEL COMPOSITION + AUTOMATIC SFX TRIGGERS ON EVERY CUT & SLAM
   ========================================================================= */

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, DURATION], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: DARK, overflow: "hidden" }}>
      {/* 20 RAPID VISUAL CUTS */}
      {RAPID_CUTS.map((cut) => (
        <Sequence
          key={cut.cutId}
          from={cut.start}
          durationInFrames={cut.end - cut.start}
        >
          <RapidCutScene cut={cut} />
        </Sequence>
      ))}

      {/* AUTOMATIC PROCEDURAL SFX FOR EVERY CUT + EVERY MID-CUT WORD SLAM */}
      {RAPID_CUTS.map((cut) => (
        <React.Fragment key={`sfx-${cut.cutId}`}>
          {/* Cut Entrance Whoosh + Main Word Slam */}
          <Sequence from={cut.start} durationInFrames={30} layout="none">
            <Audio src={SFX_BANK.whoosh} volume={0.55} />
          </Sequence>
          <Sequence from={cut.start + 3} durationInFrames={35} layout="none">
            <Audio
              src={cut.cutId % 2 === 0 ? SFX_BANK.slam : SFX_BANK.subdrop}
              volume={0.75}
            />
          </Sequence>

          {/* Mid-Cut Secondary Punch Badge Slam at +62 frames */}
          <Sequence from={cut.start + 62} durationInFrames={35} layout="none">
            <Audio
              src={
                cut.cutId === 9
                  ? SFX_BANK.chisel
                  : cut.cutId === 10
                    ? SFX_BANK.dust
                    : cut.cutId === 15
                      ? SFX_BANK.shatter
                      : SFX_BANK.slam
              }
              volume={0.7}
            />
          </Sequence>
        </React.Fragment>
      ))}

      {/* TOP 20-CUT STORY PROGRESS BAR */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 45,
          right: 45,
          display: "flex",
          gap: 6,
          height: 6,
          zIndex: 100,
        }}
      >
        {RAPID_CUTS.map((c) => {
          const fill =
            frame >= c.end
              ? 1
              : frame <= c.start
                ? 0
                : (frame - c.start) / (c.end - c.start);
          return (
            <div
              key={c.cutId}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.18)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  background: c.accent,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* BOTTOM MASTER PROGRESS BAR */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 10,
          width: `${progress}%`,
          background: "linear-gradient(90deg, #8D683B, #FFF0B8, #E5C158)",
          boxShadow: "0 0 25px rgba(229,193,88,0.8)",
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
