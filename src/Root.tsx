import React, { useMemo } from "react";
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
   THE POWER PLAY — LAW 04: "ALWAYS SAY LESS THAN NECESSARY" 
   1080 x 1920 | 60 FPS | 57.5 Seconds (3450 Frames) | Rapid Visual Cut Every ~3s
   No External Assets Required. Built-in Procedural Audio, Shading & Kinetic Slams.
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 3450; // ~57.5 Seconds

const GOLD = "#E5C158";
const GOLD_BRIGHT = "#FFF2C4";
const CREAM = "#F7F2E7";
const DARK = "#05060A";
const CRIMSON = "#FF3B30";
const EMERALD = "#2CE59B";
const CYAN = "#00E5FF";
const PURPLE = "#B983FF";

/* =========================================================================
   01. HIGH-IMPACT PROCEDURAL SOUND EFFECT GENERATOR
   ========================================================================= */

type SfxType = "slam" | "subdrop" | "whoosh" | "rip" | "lock" | "bell";

function synthesizeSfx(type: SfxType, duration = 0.35, freq = 135): string {
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
      const sweep = freq * Math.pow(1 - p, 1.9) + 35;
      const noise = Math.sin(i * 23.4) * Math.cos(i * 0.8) * Math.exp(-p * 11);
      wave =
        Math.sin(2 * Math.PI * sweep * t) * 0.75 +
        Math.sin(2 * Math.PI * sweep * 2.5 * t) * 0.3 +
        noise * 0.45;
      env = Math.pow(1 - p, 2.3);
    } else if (type === "subdrop") {
      const subF = 95 * Math.pow(1 - p * 0.75, 1.4);
      wave =
        Math.sin(2 * Math.PI * subF * t) * 0.85 +
        Math.sin(2 * Math.PI * subF * 0.5 * t) * 0.4;
      env = Math.pow(1 - p, 1.6);
    } else if (type === "whoosh") {
      const noise = Math.sin(i * 12.9898) * Math.cos(i * 0.18);
      wave =
        noise * 0.45 +
        Math.sin(2 * Math.PI * (120 + Math.sin(p * Math.PI) * 380) * t) * 0.4;
      env = Math.sin(Math.PI * p) * 0.9;
    } else if (type === "rip") {
      const tear = Math.sin(i * 47.9) * Math.cos(i * 12.3) * (0.5 + 0.5 * Math.sin(p * 50));
      wave = tear * 0.65 + Math.sin(2 * Math.PI * (500 - p * 300) * t) * 0.25;
      env = Math.pow(1 - p, 1.5) * (0.8 + 0.2 * Math.sin(p * Math.PI * 4));
    } else if (type === "lock") {
      const click = Math.sin(2 * Math.PI * 1800 * t) * 0.55 + Math.sin(2 * Math.PI * 2700 * t) * 0.35;
      env = Math.exp(-p * 16) + (p > 0.08 && p < 0.12 ? Math.exp(-(p - 0.08) * 16) * 0.7 : 0);
      wave = click;
    } else if (type === "bell") {
      wave =
        Math.sin(2 * Math.PI * 1250 * t) * 0.5 +
        Math.sin(2 * Math.PI * 2500 * t) * 0.3 +
        Math.sin(2 * Math.PI * 3750 * t) * 0.15;
      env = Math.exp(-p * 6);
    }

    const val = Math.max(-1, Math.min(1, wave * env * 0.75));
    view.setInt16(44 + i * 2, val * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX_BANK: Record<SfxType, string> = {
  slam: synthesizeSfx("slam", 0.38, 140),
  subdrop: synthesizeSfx("subdrop", 0.52, 98),
  whoosh: synthesizeSfx("whoosh", 0.26, 220),
  rip: synthesizeSfx("rip", 0.45, 600),
  lock: synthesizeSfx("lock", 0.24, 1800),
  bell: synthesizeSfx("bell", 0.5, 1250),
};

/* =========================================================================
   02. SCENE DATA & ACTION TIMELINE
   ========================================================================= */

type SceneKind =
  | "risk"
  | "court"
  | "broken"
  | "rule"
  | "mercy"
  | "mock"
  | "blueprint"
  | "furious"
  | "rip_paper"
  | "retrial"
  | "rope_inspect"
  | "book48"
  | "law04"
  | "overtalk"
  | "mouth_lock"
  | "chat_stream"
  | "cta";

type CutConfig = {
  cutId: number;
  start: number;
  end: number;
  kind: SceneKind;
  tag: string;
  slamTop: string;
  slamMain: string;
  slamSub: string;
  punchBadge: string;
  accent: string;
  camMode: "zoomIn" | "zoomOut" | "panRight" | "panLeft" | "dutch";
};

const RAPID_CUTS: CutConfig[] = [
  {
    cutId: 1,
    start: 0,
    end: 180,
    kind: "risk",
    tag: "⚠️ WARNING // LETHAL SPEECH",
    slamTop: "ZAYADA BOLNA?",
    slamMain: "JAAN BHI LE SAKTA HAI! 💀",
    slamSub: "THE FATAL TALK RISK",
    punchBadge: "MORTAL SPEECH ⚠️",
    accent: CRIMSON,
    camMode: "zoomIn",
  },
  {
    cutId: 2,
    start: 180,
    end: 360,
    kind: "court",
    tag: "🇷🇺 HISTORIC RUSSIA // 1825",
    slamTop: "RUSSIAN REBEL KO",
    slamMain: "FASI DI JA RAHI THI! ⛓️",
    slamSub: "DEATH BY THE SCAFFOLD",
    punchBadge: "1825 REBELLION ⚔️",
    accent: GOLD,
    camMode: "panRight",
  },
  {
    cutId: 3,
    start: 360,
    end: 540,
    kind: "broken",
    tag: "💥 THE BREAKPOINT",
    slamTop: "PAR ACHANAK SE",
    slamMain: "ROPE TOOT GAYI! 💥",
    slamSub: "THE SUDDEN FAILURE",
    punchBadge: "FAILING ROPE 💥",
    accent: CRIMSON,
    camMode: "dutch",
  },
  {
    cutId: 4,
    start: 540,
    end: 720,
    kind: "rule",
    tag: "📜 OLD ROYAL RULE",
    slamTop: "WATH KA RULE THA:",
    slamMain: "AGAR RASSI TOOTE... 📜",
    slamSub: "SCROLL OF DIVINE LAW",
    punchBadge: "LAWS OF ACCIDENT 🛡️",
    accent: GOLD,
    camMode: "zoomOut",
  },
  {
    cutId: 5,
    start: 720,
    end: 900,
    kind: "mercy",
    tag: "🕊️ THE MERCY RULE",
    slamTop: "BHAGWAN KA ISHARA",
    slamMain: "MAAF KAR DO! 🕊️",
    slamSub: "DIVINE FORGIVENESS SEAL",
    punchBadge: "DIVINE RULE 📜",
    accent: EMERALD,
    camMode: "zoomIn",
  },
  {
    cutId: 6,
    start: 900,
    end: 1080,
    kind: "mock",
    tag: "🤬 REBEL'S FOLLY // STUPIDITY",
    slamTop: "PAR REBEL NE",
    slamMain: "OVER SMART BANNA! 🤬",
    slamSub: "COULD NOT HOLD HIS TONGUE",
    punchBadge: "BLUNDER MOUTH 🤬",
    accent: CYAN,
    camMode: "panLeft",
  },
  {
    cutId: 7,
    start: 1080,
    end: 1320,
    kind: "blueprint",
    tag: "🎯 MOCKING CRITICISM",
    slamTop: "BOLA — DEKHO!",
    slamMain: "RASS BI DHANG KI NAHI! 🧶",
    slamSub: "MOCKING THE TSAR'S GEAR",
    punchBadge: "TSAR INSULTED 🚨",
    accent: CRIMSON,
    camMode: "dutch",
  },
  {
    cutId: 8,
    start: 1320,
    end: 1500,
    kind: "furious",
    tag: "👑 ROYAL ANGER // TSAR IMPRESSION",
    slamTop: "JAB RAJA KO",
    slamMain: "PATTA CHALA! 👑",
    slamSub: "THE RULER'S FURIOUS GAZE",
    punchBadge: "IMPERIAL WRATH ⚡",
    accent: GOLD,
    camMode: "zoomIn",
  },
  {
    cutId: 9,
    start: 1500,
    end: 1680,
    kind: "rip_paper",
    tag: "📃 PAPER TEAR // PARDON DENIED",
    slamTop: "USNE MAFI KA",
    slamMain: "PAPER FAAD DIYA! 📃",
    slamSub: "TEARING THE FORGIVENESS SCROLL",
    punchBadge: "RIPPED APART 📃",
    accent: CRIMSON,
    camMode: "zoomIn",
  },
  {
    cutId: 10,
    start: 1680,
    end: 1860,
    kind: "retrial",
    tag: "💀 GALAT SABIT // RETRIAL CHALENGE",
    slamTop: "AUR BOLA — CHALO",
    slamMain: "GALAT SABIT KAREN! 💀",
    slamSub: "SHOW HIM THE POWER",
    punchBadge: "CHALLENGE ON 💥",
    accent: GOLD,
    camMode: "zoomOut",
  },
  {
    cutId: 11,
    start: 1860,
    end: 2040,
    kind: "rope_inspect",
    tag: "⛓️ SCARCITY // TIGHTER NEW ROPE",
    slamTop: "AGLE DIN LAI",
    slamMain: "EK NAYI RASS! ⛓️",
    slamSub: "EXTRA REINFORCED STRENGHT",
    punchBadge: "STRONGER ROPE 🧶",
    accent: EMERALD,
    camMode: "panRight",
  },
  {
    cutId: 12,
    start: 2040,
    end: 2280,
    kind: "book48",
    tag: "📖 THE 48 LAWS OF POWER",
    slamTop: "ROBERT GREENE KE",
    slamMain: "48 LAWS OF POWER 📖",
    slamSub: "THE DARK STRATEGY HANDBOOK",
    punchBadge: "WORLD CLASS LAWS 📖",
    accent: PURPLE,
    camMode: "zoomIn",
  },
  {
    cutId: 13,
    start: 2280,
    end: 2520,
    kind: "law04",
    tag: "📜 LAW #04 // VERBAL RESTRAINT",
    slamTop: "YEH HAI",
    slamMain: "LAW NUMBER 04! ⚡",
    slamSub: "THE SUPREME DEFENSE RULE",
    punchBadge: "LAW #04 ⚡",
    accent: GOLD,
    camMode: "dutch",
  },
  {
    cutId: 14,
    start: 2520,
    end: 2700,
    kind: "overtalk",
    tag: "🎙️ VERBAL ACCIDENTS // THE OVERTALK",
    slamTop: "ZAROORAT SE ZADA BOLNA",
    slamMain: "KHATRE MEIN DALTA HAI! 🚨",
    slamSub: "YOUR WORDS ARE WEAPONS",
    punchBadge: "DANGER TALK 🚨",
    accent: CRIMSON,
    camMode: "panLeft",
  },
  {
    cutId: 15,
    start: 2700,
    end: 2940,
    kind: "mouth_lock",
    tag: "🔒 LOCK THE TONGUE // CONTROL MODE",
    slamTop: "APNI ZUBAAN PAR",
    slamMain: "CONTROL RAKHO! 🔒",
    slamSub: "SILENT BRAVE OPERATION",
    punchBadge: "LOCK THE LIPS 🔒",
    accent: EMERALD,
    camMode: "zoomIn",
  },
  {
    cutId: 16,
    start: 2940,
    end: 3180,
    kind: "chat_stream",
    tag: "💭 YOUR TALKATIVE FRIEND",
    slamTop: "KAUN SA DOST",
    slamMain: "BINA SOCHE BAKTA HAI? 🗣️",
    slamSub: "NEVER-ENDING VERBAL OVERLOAD",
    punchBadge: "DUMB FRIEND 🤡",
    accent: PURPLE,
    camMode: "zoomIn",
  },
  {
    cutId: 17,
    start: 3180,
    end: 3450,
    kind: "cta",
    tag: "💬 SOCIAL INVITATION // EXPOSE THEM",
    slamTop: "COMMENT MEIN USKA",
    slamMain: "NAAM BATTAO! 👇",
    slamSub: "TAG YOUR ARGUMENT FRIEND NOW",
    punchBadge: "TAG THEM 👇",
    accent: GOLD,
    camMode: "zoomOut",
  },
];

/* =========================================================================
   03. HIGH-DETAIL SCALED CUSTOM VECTOR CHARACTERS (SVG SCENERY)
   ========================================================================= */

const DetailedTsarSVG: React.FC<{
  mood: "furious" | "smug" | "challenge";
  scale?: number;
}> = ({ mood, scale = 1 }) => (
  <g transform={`scale(${scale})`}>
    {/* Dark Imperial Velvet Robe */}
    <path
      d="M-135 75 C-165 155 -180 260 -195 350 L195 350 C180 260 165 155 135 75 Z"
      fill="url(#royalCloak)"
      stroke={GOLD}
      strokeWidth="5"
    />
    <path d="M-115 65 Q0 125 115 65 L135 110 Q0 170 -135 110 Z" fill="#F7F3E8" stroke="#D1C5B2" strokeWidth="4.5" />
    {[-80, -40, 0, 40, 80].map((fx) => (
      <circle key={fx} cx={fx} cy={102} r="5.5" fill="#201C1B" />
    ))}

    {/* Royal Chain */}
    <path d="M-72 110 Q0 210 72 110" fill="none" stroke={GOLD} strokeWidth="12" strokeDasharray="14 6" />
    <circle cx="0" cy="175" r="22" fill={GOLD} stroke="#FFE59E" strokeWidth="3" />
    <circle cx="0" cy="175" r="9" fill={CRIMSON} />

    {/* Tsar Imperial head */}
    <ellipse cx="0" cy="-20" rx="66" ry="76" fill="#DFA27E" stroke="#8C5C41" strokeWidth="4" />
    <circle cx="-68" cy="-20" r="12" fill="#C5855E" />
    <circle cx="68" cy="-20" r="12" fill="#C5855E" />

    {/* Imperial Headgear Crown */}
    <path
      d="M-75 -62 L-92 -154 L-38 -110 L0 -178 L38 -110 L92 -154 L75 -62 Z"
      fill="url(#goldGrad)"
      stroke="#FFF5D2"
      strokeWidth="5"
    />
    <rect x="-65" y="-68" width="130" height="20" rx="5" fill="#B38338" stroke="#FFF5D2" strokeWidth="3.5" />
    <circle cx="0" cy="-178" r="11" fill="#FFF8DC" />
    <circle cx="-52" cy="-125" r="8" fill={CRIMSON} />
    <circle cx="52" cy="-125" r="8" fill={CRIMSON} />

    {/* Facial Expressions */}
    {mood === "furious" && (
      <g>
        <line x1="-42" y1="-55" x2="-12" y2="-40" stroke="#1C1517" strokeWidth="8" strokeLinecap="round" />
        <line x1="42" y1="-55" x2="12" y2="-40" stroke="#1C1517" strokeWidth="8" strokeLinecap="round" />
        <circle cx="-25" cy="-28" r="9" fill={CRIMSON} />
        <circle cx="25" cy="-28" r="9" fill={CRIMSON} />
        <rect x="-32" y="32" width="64" height="24" rx="8" fill="#1C1517" />
        <path d="M-64 -4 C-66 65 -30 98 0 108 C30 98 66 65 64 -4 Z" fill="#201518" opacity="0.9" />
      </g>
    )}
    {mood === "smug" && (
      <g>
        <path d="M-42 -45 Q-25 -58 -8 -45" fill="none" stroke="#1C1517" strokeWidth="7" strokeLinecap="round" />
        <path d="M8 -45 Q25 -58 42 -45" fill="none" stroke="#1C1517" strokeWidth="7" strokeLinecap="round" />
        <circle cx="-25" cy="-28" r="7" fill="#1C1517" />
        <circle cx="25" cy="-28" r="7" fill="#1C1517" />
        <path d="M-28 22 Q0 52 28 14 Z" fill="none" stroke="#1C1517" strokeWidth="6" strokeLinecap="round" />
      </g>
    )}
    {mood === "challenge" && (
      <g>
        <line x1="-42" y1="-44" x2="-10" y2="-44" stroke="#1C1517" strokeWidth="7" strokeLinecap="round" />
        <line x1="10" y1="-44" x2="42" y2="-44" stroke="#1C1517" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="-25" cy="-26" rx="8" ry="5" fill="#1C1517" />
        <ellipse cx="25" cy="-26" rx="8" ry="5" fill="#1C1517" />
        <path d="M-20 30 H20" stroke="#1C1517" strokeWidth="7" strokeLinecap="round" />
      </g>
    )}
    {/* Beard outline */}
    <path
      d="M-52 14 C-55 75 -26 102 0 108 C26 102 55 75 52 14 C35 34 18 36 0 36 C-18 36 -35 34 -52 14 Z"
      fill="#171214"
    />
  </g>
);

const DetailedRebelSVG: React.FC<{
  mood: "worried" | "over_confident" | "falling";
  scale?: number;
}> = ({ mood, scale = 1 }) => (
  <g transform={`scale(${scale})`}>
    {/* Loose Rough Shroud Outfit */}
    <path
      d="M-95 72 C-115 140 -124 235 -132 320 L132 320 C124 235 115 140 95 72 Z"
      fill="#3A4048"
      stroke="#7D6F5E"
      strokeWidth="4"
    />
    <rect x="-65" y="85" width="130" height="235" rx="10" fill="#604A3A" stroke={GOLD} strokeWidth="2.5" />
    <path d="M-28 78 L0 145 L28 78" fill="none" stroke="#D1C1AC" strokeWidth="6" />

    {/* Rebel Head with Muck Detail */}
    <ellipse cx="0" cy="8" rx="46" ry="52" fill="#CE9672" stroke="#8C5C3D" strokeWidth="4.5" />
    {/* Ragged Hair */}
    <path d="M-55 -22 C-68 -65 15 -76 58 -36 C68 -24 55 -8 42 -13 C15 -25 -25 -24 -55 -22 Z" fill="#2C2326" />

    {/* Mouth Lock/Expression */}
    {mood === "worried" && (
      <g>
        <path d="M-25 -12 Q-15 -22 -5 -12" fill="none" stroke="#1F1518" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M5 -12 Q15 -22 25 -12" fill="none" stroke="#1F1518" strokeWidth="5.5" strokeLinecap="round" />
        <circle cx="-16" cy="2" r="4.5" fill="#1F1518" />
        <circle cx="16" cy="2" r="4.5" fill="#1F1518" />
        <path d="M-15 32 Q0 20 15 32" fill="none" stroke="#1F1518" strokeWidth="6" />
      </g>
    )}
    {mood === "over_confident" && (
      <g>
        <path d="M-25 -12 Q-18 -22 -10 -18" fill="none" stroke="#1F1518" strokeWidth="5" strokeLinecap="round" />
        <path d="M10 -18 Q18 -22 25 -12" fill="none" stroke="#1F1518" strokeWidth="5" strokeLinecap="round" />
        <circle cx="-15" cy="0" r="5" fill="#1F1518" />
        <circle cx="15" cy="0" r="5" fill="#1F1518" />
        <path d="M-20 22 Q0 46 20 22 Z" fill="#F4EDE0" stroke="#8A4A3C" strokeWidth="3.5" />
      </g>
    )}
    {mood === "falling" && (
      <g>
        <path d="M-28 -8 L-8 -15" stroke="#1F1518" strokeWidth="6" strokeLinecap="round" />
        <path d="M8 -15 L28 -8" stroke="#1F1518" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="-16" cy="2" rx="6" ry="8" fill="#1F1518" />
        <ellipse cx="16" cy="2" rx="6" ry="8" fill="#1F1518" />
        <circle cx="0" cy="35" r="14" fill="#1F1518" />
      </g>
    )}
  </g>
);

/* =========================================================================
   04. 17 POWER VISUAL STAGES (ONE UNIQUE ILLUSTRATION PER CUT)
   ========================================================================= */

const CutVisualStage: React.FC<{
  cutId: number;
  localFrame: number;
  accent: string;
}> = ({ cutId, localFrame, accent }) => {
  const spin = localFrame * 1.5;
  const pulse = 1 + Math.sin(localFrame / 5) * 0.05;

  const dots = useMemo(() => 
    Array.from({ length: 48 }, (_, i) => ({
      x: 480 + ((i * 27) % 110) - 55,
      y: 220 + (i % 8) * 11,
      size: 2.5 + (i % 4) * 1.2,
      drift: Math.sin(i * 1.5) * 32,
    })), []);

  return (
    <svg width="960" height="820" viewBox="0 0 960 820" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="auroraBg">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="65%" stopColor={accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF2C8" />
          <stop offset="48%" stopColor="#D6B46C" />
          <stop offset="100%" stopColor="#7E591F" />
        </linearGradient>
        <linearGradient id="royalCloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6E1528" />
          <stop offset="100%" stopColor="#300912" />
        </linearGradient>
        <filter id="laserRay">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Primary Pulsing Aura */}
      <circle cx="480" cy="410" r={360 * pulse} fill="url(#auroraBg)" />

      {/* Dynamic Reticle Ring */}
      <circle
        cx="480"
        cy="410"
        r="340"
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeDasharray="14 16"
        opacity="0.45"
        transform={`rotate(${spin} 480 410)`}
      />

      {/* SCENE 1: RISK / HIGH-DANGER WARNING SPEECH */}
      {cutId === 1 && (
        <g transform="translate(480 440)">
          {/* Heart Beat EKG Trace and Exclamation Shield */}
          <path d="M-340 120 Q-170 -120 0 120 T340 120" fill="none" stroke={CRIMSON} strokeWidth="4.5" strokeDasharray="10 10" />
          <DetailedRebelSVG mood="falling" scale={1.25} />
          {/* Massive Cyber Alert Border overlay */}
          <g transform="translate(0 -265)">
            <rect x="-240" y="-40" width="480" height="80" rx="40" fill="#2D0A0C" stroke={CRIMSON} strokeWidth="5.5" />
            <text y="10" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="1000" letterSpacing="4">
              🚨 VERBAL DEATH TRAP
            </text>
          </g>
        </g>
      )}

      {/* SCENE 2: SCUFFICOLD & RUSSIAN MILITARY Sentry */}
      {cutId === 2 && (
        <g transform="translate(480 430)">
          <path d="M-330 260 V-210 Q0 -360 330 -210 V260" fill="#14111E" stroke={GOLD} strokeWidth="5.5" />
          <line x1="-310" y1="260" x2="310" y2="260" stroke={GOLD} strokeWidth="9" />
          {/* Scaffold Beam Over Rebel */}
          <g transform="translate(0 -80)">
            <rect x="-18" y="-145" width="36" height="290" fill="#2C2330" stroke={GOLD} strokeWidth="4" />
          </g>
          <DetailedRebelSVG mood="worried" scale={1.08} />
        </g>
      )}

      {/* SCENE 3: SUDDEN RUPTURED ROPE & DRAMATIC FALL */}
      {cutId === 3 && (
        <g transform="translate(480 450)">
          {/* Close examination of frayed rope fiber snap */}
          <g transform={`translate(${190 * Math.sin(localFrame / 7)} -110)`}>
            <circle r="110" fill="#1A0D0F" stroke={CRIMSON} strokeWidth="7" />
            <path d="M-38 -75 C-42 -10 10 -2 38 -55" fill="none" stroke="#D1B898" strokeWidth="24" />
            <path d="M-28 75 C10 15 42 12 34 55" fill="none" stroke="#D1B898" strokeWidth="24" />
            {/* Thread Explosion */}
            <path d="M-38 -8 L38 8 M-12 18 L12 -18" stroke={CRIMSON} strokeWidth="12" />
          </g>
          <DetailedRebelSVG mood="falling" scale={1.12} />
        </g>
      )}

      {/* SCENE 4: SCROLL OF ROYAL/DIVINE ACT PRECEDENT */}
      {cutId === 4 && (
        <g transform="translate(480 410)">
          {/* Spreading Parchment Manuscript */}
          <g transform={`rotate(${-4 + Math.sin(localFrame / 15) * 3})`}>
            <rect x="-240" y="-220" width="480" height="440" rx="20" fill="#F4ECE0" stroke={GOLD} strokeWidth="8" />
            <rect x="-210" y="-190" width="420" height="380" rx="10" fill="none" stroke="#7A6F5C" strokeWidth="3" strokeDasharray="9 6" />
            {/* Symbolic writing bands */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1="-155" y1={-100 + i * 50} x2="155" y2={-100 + i * 50} stroke="#7A6F5C" strokeWidth="6.5" />
            ))}
            <line x1="-95" y1="150" x2="95" y2="150" stroke={CRIMSON} strokeWidth="5.5" />
          </g>
        </g>
      )}

      {/* SCENE 5: TRANSLUCENT SHIELD WITH DIVINE MERCY EMERALD GLOW */}
      {cutId === 5 && (
        <g transform="translate(480 420)">
          {/* Shield of Divine Grace */}
          <circle r="190" fill="none" stroke={EMERALD} strokeWidth="8" strokeDasharray="14 14" transform={`rotate(${-spin})`} />
          <path d="M-135 -145 L0 -245 L135 -145 V35 L0 185 L-135 35 Z" fill="#141E1A" stroke={EMERALD} strokeWidth="8" />
          <polygon points="-55,0 0,48 105,-44" fill="none" stroke={EMERALD} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          <text y="140" textAnchor="middle" fill="#FFFFFF" fontSize="35" fontWeight="1000">
            DIVINE PARDON
          </text>
        </g>
      )}

      {/* SCENE 6: Mocking smart mouth rebel */}
      {cutId === 6 && (
        <g transform="translate(480 440)">
          <DetailedRebelSVG mood="over_confident" scale={1.22} />
          {/* Speech dialogue bubble mocked */}
          <g transform="translate(195 -135)">
            <path d="M-135 60 Q-150 14 0 0 Q145 -10 120 45 Q90 100 0 100 Z" fill="#1F1528" stroke={CYAN} strokeWidth="4.5" />
            <text x="-15" y="55" textAnchor="middle" fill="#E8B8FF" fontSize="26" fontWeight="900">
              SMART MOUTH! 👅
            </text>
          </g>
        </g>
      )}

      {/* SCENE 7: "Dhang ki rope bhi nahi..." Blueprint Insult */}
      {cutId === 7 && (
        <g transform="translate(480 405)">
          <rect x="-340" y="-235" width="680" height="470" rx="24" fill="#0E1E2D" stroke={CRIMSON} strokeWidth="5" />
          {/* Technical blueprint overlay on rope */}
          {[-2, -1, 0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <line x1={i * 115} y1="-235" x2={i * 115} y2="235" stroke={CYAN} strokeWidth="1.5" opacity="0.22" />
              <line x1="-340" y1={i * 85} x2="340" y2={i * 85} stroke={CYAN} strokeWidth="1.5" opacity="0.22" />
            </React.Fragment>
          ))}
          <path d="M-225 100 Q0 -195 225 100" fill="none" stroke={CRIMSON} strokeWidth="14" />
          <polygon points="120,40 180,-10 110,-40" fill={CRIMSON} />
          <circle cx="0" cy="-45" r="45" fill="#0E1E2D" stroke={CRIMSON} strokeWidth="5" />
          <text y="145" textAnchor="middle" fill={CRIMSON} fontSize="35" fontWeight="1000" letterSpacing="2">
            MOCKING "TSAR QUALITY" ❌
          </text>
        </g>
      )}

      {/* SCENE 8: ROYAL ANGER / FURIOUS Tsar Ruler */}
      {cutId === 8 && (
        <g transform="translate(480 430)">
          <DetailedTsarSVG mood="furious" scale={1.2} />
          <g transform="translate(0 -280)">
            <rect x="-225" y="-36" width="450" height="72" rx="36" fill="#2E0A0E" stroke={GOLD} strokeWidth="4.5" />
            <text y="9" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="30" fontWeight="1000" letterSpacing="3">
              👑 IMPERIAL RAGE LEVEL
            </text>
          </g>
        </g>
      )}

      {/* SCENE 9: Ripped / torn mercy papers */}
      {cutId === 9 && (
        <g transform="translate(480 410)">
          {/* Tearing the forgiveness certificate in two fragments */}
          <g transform={`translate(${-45 - localFrame * 0.9} ${localFrame * 0.2}) rotate(${-localFrame * 0.2})`}>
            <rect x="-240" y="-175" width="240" height="350" rx="14" fill="#F3E9DA" stroke={CRIMSON} strokeWidth="5" />
            <path d="M-135 -110 H-30 M-135 -30 H-30 M-135 50 H-30" stroke="#7E7260" strokeWidth="4.5" />
          </g>
          <g transform={`translate(${45 + localFrame * 0.9} ${-localFrame * 0.2}) rotate(${localFrame * 0.2})`}>
            <rect x="0" y="-175" width="240" height="350" rx="14" fill="#F3E9DA" stroke={CRIMSON} strokeWidth="5" />
            <path d="M30 -110 H135 M30 -30 H135 M30 50 H135" stroke="#7E7260" strokeWidth="4.5" />
          </g>
          {/* Shred effect explosion */}
          <g fill={CRIMSON} opacity={1 - (localFrame / 60)}>
            <polygon points="-12,-85 12,-45 0,10 -15,-30" filter="url(#laserRay)" />
            <polygon points="-8,45 8,85 -5,125" filter="url(#laserRay)" />
          </g>
        </g>
      )}

      {/* SCENE 10: Retrial Challenge execution Directive */}
      {cutId === 10 && (
        <g transform="translate(480 440)">
          <DetailedTsarSVG mood="challenge" scale={1.12} />
          {/* Retrial stamp */}
          <g transform={`translate(160 -95) scale(${pulse})`}>
            <circle r="72" fill="#2E0A0E" stroke={CRIMSON} strokeWidth="5" />
            <text y="10" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="1000">
              FASI 2.0
            </text>
          </g>
        </g>
      )}

      {/* SCENE 11: A Strong new rope being inspected */}
      {cutId === 11 && (
        <g transform="translate(480 445)">
          {/* Close examination of new heavy hemp fibers */}
          <path d="M-340 -175 C-170 -175 0 175 340 175" fill="none" stroke="#D2B48C" strokeWidth="32" />
          <path d="M-340 -175 C-170 -175 0 175 340 175" fill="none" stroke="#8B6C42" strokeWidth="12" strokeDasharray="18 12" />
          {/* Laser scale indicators */}
          {(() => {
            const scanY = -240 + ((localFrame * 4.5) % 480);
            return (
              <g>
                <line x1="-280" y1={scanY} x2="280" y2={scanY} stroke={EMERALD} strokeWidth="6" filter="url(#laserRay)" />
                <rect x="-260" y="-235" width="520" height="470" fill="none" stroke={EMERALD} strokeWidth="3.5" strokeDasharray="10 10" />
              </g>
            );
          })()}
        </g>
      )}

      {/* SCENE 12: 48 Laws of Power (Gold embossed heavyweight book) */}
      {cutId === 12 && (
        <g transform={`translate(480 410) rotate(${-4 + Math.sin(localFrame / 20) * 2.8})`}>
          <rect x="-195" y="-245" width="390" height="490" rx="22" fill="#5A1523" stroke={GOLD} strokeWidth="9" />
          <rect x="-165" y="-215" width="330" height="430" rx="12" fill="none" stroke={GOLD_BRIGHT} strokeWidth="3" />
          <text y="-115" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="27" fontWeight="1000" letterSpacing="5">
            ROBERT GREENE
          </text>
          <text y="-32" textAnchor="middle" fill="#FFFFFF" fontSize="62" fontWeight="950">
            48 LAWS
          </text>
          <text y="32" textAnchor="middle" fill={GOLD} fontSize="52" fontWeight="950">
            OF POWER
          </text>
          <circle cy="135" r="48" fill="#1C1014" stroke={GOLD} strokeWidth="4.5" />
          <text y="152" textAnchor="middle" fill={GOLD} fontSize="44" fontWeight="950">
            👑
          </text>
        </g>
      )}

      {/* SCENE 13: "LAW #04" crest/emblem */}
      {cutId === 13 && (
        <g transform={`translate(480 410) scale(${pulse})`}>
          <polygon
            points="0,-275 235,-135 235,135 0,275 -235,135 -235,-135"
            fill="#17120A"
            stroke={GOLD}
            strokeWidth="11"
          />
          <text y="-75" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="38" fontWeight="1000" letterSpacing="7">
            SUPREME LAW
          </text>
          <text y="90" textAnchor="middle" fill={GOLD} fontSize="195" fontWeight="1000">
            #04
          </text>
        </g>
      )}

      {/* SCENE 14: Over-speaking danger danger sign */}
      {cutId === 14 && (
        <g transform="translate(480 410)">
          <circle r="235" fill="none" stroke={CRIMSON} strokeWidth="10" strokeDasharray="18 10" transform={`rotate(${spin})`} />
          <polygon points="0,-190 190,140 -190,140" fill="#2E0A0E" stroke={CRIMSON} strokeWidth="10" />
          <text y="75" textAnchor="middle" fill="#FFFFFF" fontSize="135" fontWeight="1000">
            !
          </text>
        </g>
      )}

      {/* SCENE 15: "APNI ZUBAAN PAR CONTROL" CAGE / MOUTH LOCK */}
      {cutId === 15 && (
        <g transform="translate(480 420)">
          {/* Calm face enclosed in custom protective cage boundary */}
          <DetailedRebelSVG mood="worried" scale={1.22} />
          {/* Glowing Metallic Barrier/Padlock on Lips */}
          <g transform={`translate(0 15) scale(${pulse})`}>
            <rect x="-110" y="-35" width="220" height="15" fill={GOLD} stroke="#FFFFFF" strokeWidth="3" />
            {[-80, -40, 0, 40, 80].map((bx) => (
              <line key={bx} x1={bx} y1="-30" x2={bx} y2="100" stroke={GOLD} strokeWidth="10" />
            ))}
            <rect x="-55" y="45" width="110" height="85" rx="14" fill="#231713" stroke={GOLD} strokeWidth="5.5" />
            <circle cx="0" cy="85" r="14" fill={GOLD} />
          </g>
        </g>
      )}

      {/* SCENE 16: Non-stop silly speech bubbles stream */}
      {cutId === 16 && (
        <g transform="translate(480 410)">
          <circle r="210" fill="#1C142A" stroke={PURPLE} strokeWidth="8.5" />
          <text y="30" textAnchor="middle" fontSize="155">🤡</text>
          <g transform="translate(0 -225)">
            <rect x="-240" y="-38" width="480" height="72" rx="20" fill={PURPLE} />
            <text y="10" textAnchor="middle" fill="#10081C" fontSize="30" fontWeight="1000" letterSpacing="1.5">
              👑 NON-STOP BLA-BLA champ
            </text>
          </g>
        </g>
      )}

      {/* SCENE 17: "TAG YOUR FRIEND" CTA TARGET */}
      {cutId === 17 && (
        <g transform={`translate(480 410) scale(${pulse})`}>
          <rect x="-370" y="-180" width="740" height="360" rx="36" fill="#15141C" stroke="url(#goldGrad)" strokeWidth="9" />
          <text y="-85" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="35" fontWeight="1000" letterSpacing="4">
            💬 COMENTS MEIN USSE EXPOSE KAREN:
          </text>
          <rect x="-300" y="-20" width="600" height="110" rx="22" fill="#0A0A0E" stroke={CYAN} strokeWidth="5" />
          <text x="0" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="42" fontWeight="1000">
            @your_thoughtless_friend 😂👇
          </text>
        </g>
      )}
    </svg>
  );
};

/* =========================================================================
   05. CAMERA SHAKE KEYFRAMING & THE IMPACT WHOOSH SFX ENGINE
   ========================================================================= */

const RapidCutScene: React.FC<{ cut: CutConfig }> = ({ cut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = cut.end - cut.start;

  // Springs for 2 discrete text/visual impact timestamps per Cut
  const mainSlamSpring = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 9, stiffness: 245, mass: 0.62 },
  });

  const secondarySlamSpring = spring({
    frame: Math.max(0, frame - 64),
    fps,
    config: { damping: 8, stiffness: 260, mass: 0.58 },
  });

  // Calculate explosive, dual-slam keyframe shake
  const shake1 = interpolate(frame, [3, 7, 22], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake2 = interpolate(frame, [64, 68, 80], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 22 * shake1 + 18 * shake2;
  const shakeX = Math.sin(frame * 2.8) * scale;
  const shakeY = Math.cos(frame * 3.5) * scale;
  const shakeRot = Math.sin(frame * 1.9) * (scale * 0.08);

  // continuous slow Cinematic panning per cut config
  const camProgress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let panScale = 1;
  let panX = 0;
  let panRot = 0;

  if (cut.camMode === "zoomIn") {
    panScale = interpolate(camProgress, [0, 1], [0.93, 1.14]);
  } else if (cut.camMode === "zoomOut") {
    panScale = interpolate(camProgress, [0, 1], [1.15, 0.94]);
  } else if (cut.camMode === "panRight") {
    panScale = 1.05;
    panX = interpolate(camProgress, [0, 1], [-32, 32]);
  } else if (cut.camMode === "panLeft") {
    panScale = 1.05;
    panX = interpolate(camProgress, [0, 1], [32, -32]);
  } else if (cut.camMode === "dutch") {
    panScale = interpolate(camProgress, [0, 1], [0.96, 1.08]);
    panRot = interpolate(camProgress, [0, 1], [-2.8, 2.8]);
  }

  const wordScale = interpolate(mainSlamSpring, [0, 1], [2.7, 1]);
  const badgeScale = interpolate(secondarySlamSpring, [0, 1], [2.3, 1]);

  const flashOpacity =
    interpolate(frame, [0, 4, 15], [0, 0.36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) +
    interpolate(frame, [64, 67, 76], [0, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const shockwaveR = interpolate(frame, [3, 26], [35, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shockwaveOpacity = interpolate(frame, [3, 26], [0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at 50% 45%, ${cut.accent}24 0%, transparent 64%),
          linear-gradient(165deg, #10121B 0%, #05060A 52%, #0E0C17 100%)
        `,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX + panX}px, ${shakeY}px) rotate(${shakeRot + panRot}deg) scale(${panScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <circle cx="540" cy="960" r={shockwaveR} fill="none" stroke={cut.accent} strokeWidth="12" opacity={shockwaveOpacity} />
        </svg>

        {/* EYE-CATCHING TOP TELEMETRY TAG HEADER */}
        <div style={{ position: "absolute", top: 72, left: 65, right: 65, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ padding: "10px 24px", borderRadius: 100, background: "rgba(255,255,255,0.06)", border: `2px solid ${cut.accent}`, color: cut.accent, fontSize: 19, fontWeight: 900, letterSpacing: 4 }}>
            {cut.tag}
          </div>
          <div style={{ color: "#9A9285", fontSize: 21, fontWeight: 900, letterSpacing: 3 }}>
            SCENE {String(cut.cutId).padStart(2, "0")} / 17
          </div>
        </div>

        {/* DYNAMIC SHOCKING TYPOGRAPHY SLAM ("DHAKKA MERE ASBE!") */}
        <div style={{ position: "absolute", top: 178, left: 45, right: 45, textAlign: "center", transform: `scale(${wordScale})`, opacity: Math.min(1, frame / 4) }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: CREAM, letterSpacing: 4, fontFamily: '"Arial Black", Impact, sans-serif', textShadow: "0 8px 25px rgba(0,0,0,0.8)" }}>
            {cut.slamTop}
          </div>
          <div style={{ marginTop: 8, fontSize: cut.slamMain.length > 16 ? 74 : 88, fontWeight: 900, lineHeight: 1.02, color: cut.accent, letterSpacing: -2, fontFamily: '"Arial Black", Impact, sans-serif', textShadow: `0 0 52px ${cut.accent}99, 0 14px 35px rgba(0,0,0,0.95)` }}>
            {cut.slamMain}
          </div>
          <div style={{ marginTop: 14, fontSize: 25, fontWeight: 800, color: "#9A9285", letterSpacing: 6 }}>
            {cut.slamSub}
          </div>
        </div>

        {/* HIGH-IMPACT SVG STAGES IN CENTER */}
        <div style={{ position: "absolute", top: 495, left: 60, width: 960, height: 820 }}>
          <CutVisualStage cutId={cut.cutId} localFrame={frame} accent={cut.accent} />
        </div>

        {/* DYNAMIC PUNCH BADGE SLAMMING AT ~64 FRAMES FOR CLIMAX */}
        {frame >= 64 && (
          <div style={{ position: "absolute", bottom: 180, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${badgeScale}) rotate(-2deg)` }}>
            <div style={{ padding: "24px 62px", borderRadius: 28, background: `linear-gradient(135deg, ${cut.accent}, #FFF2C4)`, color: "#0A090E", fontSize: 46, fontWeight: 900, fontFamily: '"Arial Black", Impact, sans-serif', letterSpacing: 3, boxShadow: `0 0 65px ${cut.accent}AA, 0 20px 48px rgba(0,0,0,0.85)`, border: "5px solid #FFFFFF" }}>
              {cut.punchBadge}
            </div>
          </div>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flashOpacity, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/* =========================================================================
   06. MAIN COMPOSITION & SYNTHETIC SFX TRIGGERS ON TRANSITIONS
   ========================================================================= */

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, DURATION], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: DARK, overflow: "hidden" }}>
      {RAPID_CUTS.map((cut) => (
        <Sequence key={cut.cutId} from={cut.start} durationInFrames={cut.end - cut.start}>
          <RapidCutScene cut={cut} />
        </Sequence>
      ))}

      {/* Synchronized transitions sound alerts */}
      {RAPID_CUTS.map((cut) => (
        <React.Fragment key={`sfx-${cut.cutId}`}>
          <Sequence from={cut.start} durationInFrames={30} layout="none">
            <Audio src={SFX_BANK.whoosh} volume={0.52} />
          </Sequence>
          <Sequence from={cut.start + 3} durationInFrames={35} layout="none">
            <Audio src={cut.cutId % 2 === 0 ? SFX_BANK.slam : SFX_BANK.subdrop} volume={0.72} />
          </Sequence>
          <Sequence from={cut.start + 64} durationInFrames={35} layout="none">
            <Audio
              src={
                cut.kind === "rip_paper"
                  ? SFX_BANK.rip
                  : cut.kind === "rope_inspect"
                    ? SFX_BANK.lock
                    : cut.kind === "chat_stream"
                      ? SFX_BANK.bell
                      : SFX_BANK.slam
              }
              volume={0.68}
            />
          </Sequence>
        </React.Fragment>
      ))}

      {/* Horizontal mini tracking indicator bars */}
      <div style={{ position: "absolute", top: 24, left: 45, right: 45, display: "flex", gap: 6, height: 6, zIndex: 100 }}>
        {RAPID_CUTS.map((c) => {
          const fill =
            frame >= c.end ? 1 : frame <= c.start ? 0 : (frame - c.start) / (c.end - c.start);
          return (
            <div key={c.cutId} style={{ flex: 1, background: "rgba(255,255,255,0.18)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: c.accent }} />
            </div>
          );
        })}
      </div>

      {/* Master Base Linear Progress Track */}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 10, width: `${progress}%`, background: "linear-gradient(90deg, #8D683B, #FFF2C4, #E5C158)", boxShadow: "0 0 25px rgba(229,193,88,0.8)", zIndex: 100 }} />
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
