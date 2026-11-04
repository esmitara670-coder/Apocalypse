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

/* =========================================================
   THE POWER PLAY — ULTRA-DETAILED CINEMATIC EDITION
   1080 x 1920 | 60 FPS | 68 Seconds (Zero External Files)
   ========================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 4080;

const GOLD = "#D6B46C";
const GOLD_BRIGHT = "#FFE5A3";
const GOLD_DEEP = "#8C6528";
const CREAM = "#F4EDE0";
const DARK = "#07080C";
const CRIMSON = "#E0534C";
const EMERALD = "#4CE09B";

/* =========================================================
   PROCEDURAL SOUND EFFECTS (NO EXTERNAL WAV FILES NEEDED)
   ========================================================= */

type SfxKind = "impact" | "whoosh" | "chisel" | "dust" | "pop";

function buildWavSfx(kind: SfxKind, duration = 0.35, baseFreq = 320): string {
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
    let sample = 0;
    let env = 1;

    if (kind === "impact") {
      const f = baseFreq * (1 - p * 0.75);
      sample =
        Math.sin(2 * Math.PI * f * t) * 0.75 +
        Math.sin(2 * Math.PI * f * 0.5 * t) * 0.35;
      env = Math.pow(1 - p, 2.6);
    } else if (kind === "whoosh") {
      const noise = Math.sin(i * 12.9898) * Math.cos(i * 0.19);
      sample =
        noise * 0.4 + Math.sin(2 * Math.PI * (110 + p * 260) * t) * 0.35;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (kind === "chisel") {
      sample =
        Math.sin(2 * Math.PI * 1850 * t) * 0.6 +
        Math.sin(2 * Math.PI * 3100 * t) * 0.4;
      env = Math.exp(-p * 14);
    } else if (kind === "dust") {
      const shimmer = Math.sin(2 * Math.PI * (900 + (i % 7) * 180) * t);
      sample = shimmer * 0.45;
      env = Math.sin(Math.PI * p) * 0.65;
    } else if (kind === "pop") {
      const f = baseFreq * (1 + p * 0.65);
      sample = Math.sin(2 * Math.PI * f * t);
      env = Math.pow(1 - p, 3);
    }

    const clamped = Math.max(-1, Math.min(1, sample * env * 0.6));
    view.setInt16(44 + i * 2, clamped * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const PROCEDURAL_SFX: Record<SfxKind, string> = {
  impact: buildWavSfx("impact", 0.42, 95),
  whoosh: buildWavSfx("whoosh", 0.36, 220),
  chisel: buildWavSfx("chisel", 0.18, 1800),
  dust: buildWavSfx("dust", 0.55, 1100),
  pop: buildWavSfx("pop", 0.2, 480),
};

/* =========================================================
   SCENE DATA & TIMELINE
   ========================================================= */

type SceneKind =
  | "court"
  | "nose"
  | "silence"
  | "dust"
  | "happy"
  | "law"
  | "action"
  | "cta";

type SceneData = {
  id: number;
  start: number;
  end: number;
  kind: SceneKind;
  label: string;
  titleA: string;
  titleB: string;
  highlight: string;
  subtitle: string;
  accent: string;
};

const SCENES: SceneData[] = [
  {
    id: 1,
    start: 0,
    end: 540,
    kind: "court",
    label: "CHAPTER I — THE ROYAL COMMISSION",
    titleA: "EK RAJA.",
    titleB: "EK MAHAN MURTI.",
    highlight: "ROYAL PALACE COURT",
    subtitle: "Ek baar ek Raja ne ek famous artist se ek murti banwayi.",
    accent: GOLD,
  },
  {
    id: 2,
    start: 540,
    end: 980,
    kind: "nose",
    label: "CHAPTER II — BLIND ARROGANCE",
    titleA: "RAJA BOLA...",
    titleB: "NAAK BADI HAI!",
    highlight: "FALSE FLAW DETECTED!",
    subtitle:
      "Par Raja ne attitude mein aakar kaha ki, “Is murti ki naak thodi badi lag rahi hai!”",
    accent: CRIMSON,
  },
  {
    id: 3,
    start: 980,
    end: 1420,
    kind: "silence",
    label: "CHAPTER III — SUPREME SELF-CONTROL",
    titleA: "ARTIST JAANTA THA.",
    titleB: "PAR CHUP RAHA.",
    highlight: "ZERO ARGUMENT",
    subtitle:
      "Artist janta tha ki naak ekdum perfect hai! Par usne Raja se behes nahi ki.",
    accent: "#B497E7",
  },
  {
    id: 4,
    start: 1420,
    end: 2020,
    kind: "dust",
    label: "CHAPTER IV — THE MASTER ILLUSION",
    titleA: "BINA KAATE...",
    titleB: "DHOOL GIRA DI!",
    highlight: "0.0 MM MARBLE CUT!",
    subtitle:
      "Usne chupchap apne hath mein thodi dhool li, murti ke paas gaya, aur naak ko bina kaate, natak karte hue woh dhool niche gira di!",
    accent: GOLD,
  },
  {
    id: 5,
    start: 2020,
    end: 2500,
    kind: "happy",
    label: "CHAPTER V — EGO SATISFIED",
    titleA: "RAJA KHUSH HUA:",
    titleB: "AB PERFECT HAI!",
    highlight: "ROYAL APPROVAL 100%",
    subtitle:
      "Raja khush ho gaya aur bola, “Wah! Ab naak ekdum perfect lag rahi hai!”",
    accent: EMERALD,
  },
  {
    id: 6,
    start: 2500,
    end: 3100,
    kind: "law",
    label: "ROBERT GREENE — 48 LAWS OF POWER",
    titleA: "LAW NUMBER",
    titleB: "NINE (#09)",
    highlight: "WIN THROUGH ACTIONS",
    subtitle:
      "Robert Greene ke 48 Laws of Power mein yeh hai Law Number 9: “Win through your actions, never through argument.”",
    accent: GOLD,
  },
  {
    id: 7,
    start: 3100,
    end: 3640,
    kind: "action",
    label: "CHAPTER VII — THE PSYCHOLOGY LESSON",
    titleA: "BEHES MAT KARO.",
    titleB: "ACTION DIKHAO.",
    highlight: "ACTIONS > WORDS",
    subtitle:
      "Yani logon se faltu ki behes karke apna waqt aur energy waste mat karo, apna point hamesha apne action se sabit karo!",
    accent: "#F0C36D",
  },
  {
    id: 8,
    start: 3640,
    end: 4080,
    kind: "cta",
    label: "FINAL CHAPTER — TAG YOUR FRIEND",
    titleA: "KAUN HAI AAPKA",
    titleB: "ARGUMENT KING?",
    highlight: "DROP NAME IN COMMENTS 👇",
    subtitle:
      "Waise, aapka kaun sa dost baat-baat par faltu ki behes karta rehta hai? Comment mein uska naam zaroor batana!",
    accent: GOLD,
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

const smooth = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/* =========================================================
   HIGH-DETAIL CLASSICAL ILLUSTRATIONS (3D SHADED SVG)
   ========================================================= */

const DetailedMarbleStatue: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  highlightNose?: boolean;
  frame?: number;
}> = ({ x = 0, y = 0, scale = 1, highlightNose = false, frame = 0 }) => {
  const nosePulse = 1 + Math.sin(frame / 6) * 0.08;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Ornate Classical Pedestal with Fluted Carvings */}
      <rect x="-125" y="340" width="250" height="24" rx="4" fill="#9A9083" />
      <path d="M-105 260 L105 260 L92 340 L-92 340 Z" fill="url(#marblePedestal)" stroke="#6E665C" strokeWidth="3" />
      {[-60, -30, 0, 30, 60].map((px) => (
        <line key={px} x1={px} y1="272" x2={px * 0.88} y2="332" stroke="#5E564D" strokeWidth="4" opacity="0.55" />
      ))}
      <rect x="-140" y="362" width="280" height="32" rx="6" fill="#5D554C" stroke={GOLD} strokeWidth="2" />

      {/* Sculpted Roman Bust Shoulders & Draped Toga */}
      <path
        d="M-125 260 C-120 175 -65 145 -35 135 L35 135 C65 145 120 175 125 260 Z"
        fill="url(#marbleBody)"
        stroke="#8C8275"
        strokeWidth="3.5"
      />
      {/* Toga Folds (3D Classical Drapery) */}
      <path
        d="M-85 165 Q-15 225 75 160 M-95 205 Q0 255 95 195 M-65 245 Q10 265 65 235"
        fill="none"
        stroke="#7A7064"
        strokeWidth="4"
        opacity="0.65"
      />

      {/* Anatomical Neck & Shadows */}
      <path d="M-34 85 L34 85 L40 150 L-40 150 Z" fill="url(#marbleShadow)" />
      <path d="M-18 95 L-6 145 M18 95 L6 145" stroke="#857B6E" strokeWidth="3" opacity="0.5" />

      {/* Classical Sculpted Head */}
      <path
        d="M-68 -20 C-74 -85 0 -105 0 -105 C0 -105 74 -85 68 -20 C68 45 48 96 0 104 C-48 96 -68 45 -68 -20 Z"
        fill="url(#marbleFace)"
        stroke="#968C7E"
        strokeWidth="3.5"
      />

      {/* Half-Face 3D Chiaroscuro Shadow */}
      <path
        d="M0 -105 C42 -95 68 -60 68 -20 C68 45 48 96 0 104 Z"
        fill="#4A433B"
        opacity="0.22"
      />

      {/* Sculpted Curly Greco-Roman Hair */}
      <g fill="#C8BFAF" stroke="#756C60" strokeWidth="2.5">
        <circle cx="-55" cy="-55" r="24" />
        <circle cx="-32" cy="-78" r="26" />
        <circle cx="0" cy="-86" r="28" />
        <circle cx="32" cy="-78" r="26" />
        <circle cx="55" cy="-55" r="24" />
        <circle cx="-66" cy="-22" r="20" />
        <circle cx="66" cy="-22" r="20" />
      </g>

      {/* Golden Laurel Wreath on Statue */}
      <path
        d="M-68 -42 Q0 -75 68 -42"
        fill="none"
        stroke={GOLD}
        strokeWidth="5"
      />

      {/* Deep-Set Classical Eyes & Brow */}
      <path d="M-45 -18 Q-24 -28 -10 -18" fill="none" stroke="#5E564C" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M10 -18 Q24 -28 45 -18" fill="none" stroke="#5E564C" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="-27" cy="-6" rx="12" ry="6" fill="#DED6C6" stroke="#6E655A" strokeWidth="2.5" />
      <ellipse cx="27" cy="-6" rx="12" ry="6" fill="#DED6C6" stroke="#6E655A" strokeWidth="2.5" />

      {/* Sculpted Lips */}
      <path d="M-20 62 Q-8 56 0 60 Q8 56 20 62 Q0 72 -20 62 Z" fill="#B5AA99" stroke="#6E655A" strokeWidth="2" />

      {/* THE STATUE'S NOSE (With 3D Bridge & Nostril Shading) */}
      <g
        transform={
          highlightNose
            ? `translate(0 18) scale(${nosePulse}) translate(0 -18)`
            : undefined
        }
      >
        <path
          d="M-4 -18 L-18 34 L0 42 L14 34 L4 -18 Z"
          fill={highlightNose ? "#FF8A7A" : "#EAE2D3"}
          stroke={highlightNose ? CRIMSON : "#6E655A"}
          strokeWidth={highlightNose ? "4.5" : "3"}
        />
        {/* 3D Side Plane of Nose */}
        <path
          d="M0 -18 L14 34 L0 42 Z"
          fill={highlightNose ? CRIMSON : "#ABA08F"}
          opacity="0.55"
        />
      </g>
    </g>
  );
};

const DetailedKing: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  mood?: "angry" | "happy" | "neutral";
  frame?: number;
}> = ({ x = 0, y = 0, scale = 1, mood = "neutral", frame = 0 }) => {
  const breathe = Math.sin(frame / 15) * 3;

  return (
    <g transform={`translate(${x} ${y + breathe}) scale(${scale})`}>
      {/* Royal Crimson Velvet Cape with Ermine Fur Trim */}
      <path
        d="M-110 85 C-135 160 -150 260 -160 340 L160 340 C150 260 135 160 110 85 Z"
        fill="url(#royalVelvet)"
        stroke={GOLD}
        strokeWidth="5"
      />
      {/* White Fur Collar */}
      <path
        d="M-95 75 Q0 125 95 75 L112 115 Q0 165 -112 115 Z"
        fill="#F4EFE6"
        stroke="#C8BFAF"
        strokeWidth="3"
      />
      {[-70, -35, 0, 35, 70].map((fx) => (
        <circle key={fx} cx={fx} cy={102 + (fx === 0 ? 10 : 0)} r="4.5" fill="#2B2623" />
      ))}

      {/* Heavy Golden Royal Chain & Medallion */}
      <path d="M-65 115 Q0 210 65 115" fill="none" stroke={GOLD} strokeWidth="10" strokeDasharray="12 6" />
      <circle cx="0" cy="172" r="22" fill={GOLD} stroke="#FFF2C2" strokeWidth="3" />
      <circle cx="0" cy="172" r="10" fill={CRIMSON} />

      {/* Face & Royal Beard */}
      <ellipse cx="0" cy="15" rx="52" ry="60" fill="#C68B63" stroke="#8C5B3C" strokeWidth="3" />
      {/* Ears */}
      <circle cx="-54" cy="18" r="11" fill="#B57A52" />
      <circle cx="54" cy="18" r="11" fill="#B57A52" />

      {/* Full Sculpted Beard & Mustache */}
      <path
        d="M-50 22 C-52 75 -25 105 0 112 C25 105 52 75 50 22 C35 42 18 45 0 45 C-18 45 -35 42 -50 22 Z"
        fill="#261E21"
        stroke="#45383D"
        strokeWidth="2"
      />
      {/* Mustache */}
      <path
        d="M-38 34 Q-18 22 0 32 Q18 22 38 34 Q18 46 0 38 Q-18 46 -38 34 Z"
        fill="#171214"
      />

      {/* Dynamic Facial Expressions (Angry vs Happy vs Neutral) */}
      {mood === "angry" && (
        <g>
          <line x1="-35" y1="-12" x2="-10" y2="-2" stroke="#1F1719" strokeWidth="6" strokeLinecap="round" />
          <line x1="35" y1="-12" x2="10" y2="-2" stroke="#1F1719" strokeWidth="6" strokeLinecap="round" />
          <circle cx="-22" cy="4" r="6" fill="#1F1719" />
          <circle cx="22" cy="4" r="6" fill="#1F1719" />
          <path d="M-18 55 Q0 42 18 55" fill="none" stroke="#F4EDE0" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {mood === "happy" && (
        <g>
          <path d="M-35 -8 Q-22 -18 -10 -8" fill="none" stroke="#1F1719" strokeWidth="5" strokeLinecap="round" />
          <path d="M10 -8 Q22 -18 35 -8" fill="none" stroke="#1F1719" strokeWidth="5" strokeLinecap="round" />
          <path d="M-30 4 Q-20 -4 -12 4" fill="none" stroke="#1F1719" strokeWidth="4" strokeLinecap="round" />
          <path d="M12 4 Q20 -4 30 4" fill="none" stroke="#1F1719" strokeWidth="4" strokeLinecap="round" />
          <path d="M-22 46 Q0 68 22 46 Z" fill="#FFF5E4" stroke={GOLD} strokeWidth="2" />
        </g>
      )}

      {mood === "neutral" && (
        <g>
          <line x1="-34" y1="-8" x2="-12" y2="-8" stroke="#1F1719" strokeWidth="5" strokeLinecap="round" />
          <line x1="12" y1="-8" x2="34" y2="-8" stroke="#1F1719" strokeWidth="5" strokeLinecap="round" />
          <circle cx="-22" cy="4" r="5.5" fill="#1F1719" />
          <circle cx="22" cy="4" r="5.5" fill="#1F1719" />
        </g>
      )}

      {/* Nose */}
      <path d="M0 -6 L-8 22 L6 24" fill="none" stroke="#8C5B3C" strokeWidth="4.5" strokeLinecap="round" />

      {/* Imperial Jeweled Crown */}
      <path
        d="M-58 -22 L-72 -92 L-30 -58 L0 -108 L30 -58 L72 -92 L58 -22 Z"
        fill="url(#goldGradient)"
        stroke="#FFF3C4"
        strokeWidth="4"
      />
      <rect x="-58" y="-30" width="116" height="18" rx="5" fill="#B38338" stroke="#FFF3C4" strokeWidth="2.5" />
      <circle cx="0" cy="-95" r="9" fill="#FFF3C4" />
      <circle cx="-48" cy="-72" r="7" fill={CRIMSON} />
      <circle cx="48" cy="-72" r="7" fill={CRIMSON} />
      <circle cx="0" cy="-21" r="6" fill={EMERALD} />
    </g>
  );
};

const DetailedArtist: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  silentLock?: boolean;
  frame?: number;
}> = ({ x = 0, y = 0, scale = 1, silentLock = false, frame = 0 }) => {
  const nod = Math.sin(frame / 16) * 2.5;

  return (
    <g transform={`translate(${x} ${y + nod}) scale(${scale})`}>
      {/* Sculptor's Linen Tunic & Leather Apron */}
      <path
        d="M-85 85 C-100 155 -108 240 -115 310 L115 310 C108 240 100 155 85 85 Z"
        fill="#2C3844"
        stroke="#8C7A60"
        strokeWidth="4"
      />
      {/* Leather Work Apron */}
      <path
        d="M-58 95 L58 95 L72 310 L-72 310 Z"
        fill="#6E4B32"
        stroke={GOLD}
        strokeWidth="2.5"
      />
      {/* Pocket with Chisel & Mallet */}
      <rect x="-42" y="185" width="84" height="55" rx="8" fill="#523622" stroke="#9C7A54" strokeWidth="2" />
      <line x1="-18" y1="150" x2="-18" y2="185" stroke="#D8D2C7" strokeWidth="7" />
      <rect x="8" y="142" width="28" height="16" rx="3" fill="#B38338" />
      <line x1="22" y1="158" x2="22" y2="185" stroke="#5C3D24" strokeWidth="6" />

      {/* Head & Renaissance Beret Hat */}
      <ellipse cx="0" cy="18" rx="44" ry="50" fill="#D19A72" stroke="#8C5B3C" strokeWidth="3" />
      <path
        d="M-52 -12 C-65 -55 15 -72 58 -32 C68 -20 55 -5 42 -10 C15 -22 -25 -20 -52 -12 Z"
        fill="#3B2838"
        stroke={GOLD}
        strokeWidth="3"
      />

      {/* Calm Wise Eyes */}
      <path d="M-28 0 Q-18 -8 -8 0" fill="none" stroke="#231B1E" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 0 Q18 -8 28 0" fill="none" stroke="#231B1E" strokeWidth="4" strokeLinecap="round" />
      <circle cx="-18" cy="8" r="4.5" fill="#231B1E" />
      <circle cx="18" cy="8" r="4.5" fill="#231B1E" />

      {/* Sculpted Goatee & Calm Smile */}
      <path d="M-15 50 Q0 68 15 50 L0 62 Z" fill="#2D2327" />
      {!silentLock ? (
        <path d="M-14 38 Q0 46 14 38" fill="none" stroke="#5A3828" strokeWidth="4" strokeLinecap="round" />
      ) : (
        /* Golden Padlock Over Lips for Scene 3 */
        <g transform="translate(0 40)">
          <rect x="-18" y="-8" width="36" height="28" rx="6" fill={GOLD} stroke="#FFF5D6" strokeWidth="2.5" />
          <path d="M-10 -8 V-18 A10 10 0 0 1 10 -18 V-8" fill="none" stroke={GOLD} strokeWidth="4" />
          <circle cx="0" cy="6" r="4" fill="#1C1618" />
        </g>
      )}
    </g>
  );
};

/* =========================================================
   8 ULTRA-DETAILED CINEMATIC SCENE STAGES
   ========================================================= */

const SceneArt: React.FC<{
  kind: SceneKind;
  frame: number;
  accent: string;
}> = ({ kind, frame, accent }) => {
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 85, mass: 1.05 },
  });

  const floatY = Math.sin(frame / 20) * 6;

  // 48 deterministic golden marble dust particles for Scene 4
  const dustParticles = Array.from({ length: 48 }, (_, i) => ({
    x: 420 + ((i * 23) % 90) - 45,
    y: 225 + (i % 7) * 8,
    r: 2.5 + (i % 5) * 1.3,
    speed: 2.2 + (i % 6) * 0.45,
    drift: Math.sin(i * 1.7) * 28,
    delay: (i * 3) % 75,
  }));

  return (
    <svg
      width="920"
      height="650"
      viewBox="0 0 920 650"
      style={{
        overflow: "visible",
        transform: `translateY(${(1 - entrance) * 45 + floatY}px)`,
      }}
    >
      <defs>
        <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF4CC" />
          <stop offset="48%" stopColor="#D6B46C" />
          <stop offset="100%" stopColor="#825B22" />
        </linearGradient>

        <linearGradient id="marbleFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBF7EE" />
          <stop offset="55%" stopColor="#DED5C5" />
          <stop offset="100%" stopColor="#9E9484" />
        </linearGradient>

        <linearGradient id="marbleBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFE8DA" />
          <stop offset="100%" stopColor="#A69C8E" />
        </linearGradient>

        <linearGradient id="marblePedestal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8A8072" />
          <stop offset="50%" stopColor="#C8BFAF" />
          <stop offset="100%" stopColor="#6E6559" />
        </linearGradient>

        <linearGradient id="marbleShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D8CFC0" />
          <stop offset="100%" stopColor="#7D7366" />
        </linearGradient>

        <linearGradient id="royalVelvet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7A1C2E" />
          <stop offset="100%" stopColor="#330912" />
        </linearGradient>

        <radialGradient id="stageGlow">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="65%" stopColor={accent} stopOpacity="0.06" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>

        <linearGradient id="godRay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_BRIGHT} stopOpacity="0.22" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient Stage Spotlight */}
      <ellipse cx="460" cy="330" rx="440" ry="290" fill="url(#stageGlow)" />

      {/* =========================================================
          SCENE 1: GRAND ROYAL COURT & STATUE UNVEILING
         ========================================================= */}
      {kind === "court" && (
        <g>
          {/* Palace Archway & Volumetric God-Rays */}
          <path
            d="M70 560 V130 Q460 -85 850 130 V560 Z"
            fill="#101119"
            stroke={GOLD}
            strokeWidth="5"
          />
          <polygon points="340,25 580,25 740,560 180,560" fill="url(#godRay)" />

          {/* Fluted Corinthian Palace Columns Left & Right */}
          {[125, 795].map((cx) => (
            <g key={cx}>
              <rect x={cx - 28} y="110" width="56" height="450" fill="#2A262B" stroke={GOLD} strokeWidth="3" />
              <line x1={cx - 12} y1="120" x2={cx - 12} y2="550" stroke="#4A424D" strokeWidth="4" />
              <line x1={cx + 12} y1="120" x2={cx + 12} y2="550" stroke="#4A424D" strokeWidth="4" />
              <rect x={cx - 42} y="95" width="84" height="22" rx="4" fill="url(#goldGradient)" />
              <rect x={cx - 44} y="542" width="88" height="22" rx="4" fill="url(#goldGradient)" />
            </g>
          ))}

          {/* Checkered Royal Marble Floor */}
          <line x1="55" y1="560" x2="865" y2="560" stroke="url(#goldGradient)" strokeWidth="8" />

          {/* Left: King on Golden Throne */}
          <DetailedKing x={245} y={245} scale={0.78} mood="neutral" frame={frame} />

          {/* Center-Right: Towering Classical Marble Statue under Spotlight */}
          <DetailedMarbleStatue x={495} y={220} scale={0.85} frame={frame} />

          {/* Right: Master Artist Holding Chisel */}
          <DetailedArtist x={715} y={275} scale={0.76} frame={frame} />

          {/* Top Telemetry Badge */}
          <g transform="translate(460 75)">
            <rect x="-185" y="-26" width="370" height="48" rx="24" fill="#17151C" stroke={GOLD} strokeWidth="2.5" />
            <text y="6" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="20" fontWeight="900" letterSpacing="4">
              👑 THE ROYAL MASTERPIECE
            </text>
          </g>
        </g>
      )}

      {/* =========================================================
          SCENE 2: THE KING'S ARROGANT COMPLAINT ("NAAK BADI HAI!")
         ========================================================= */}
      {kind === "nose" && (
        <g>
          {/* Left: Close-up of Classical Statue with Pulsing Red Nose Target */}
          <DetailedMarbleStatue
            x={255}
            y={195}
            scale={1.06}
            highlightNose={true}
            frame={frame}
          />

          {/* Animated Red Optical Target Reticle on Statue's Nose */}
          <g transform="translate(255 215)">
            <circle
              r={58 + Math.sin(frame / 5) * 6}
              fill="none"
              stroke={CRIMSON}
              strokeWidth="4"
              strokeDasharray="12 8"
              transform={`rotate(${frame * 1.2})`}
            />
            <line x1="-75" y1="0" x2="-38" y2="0" stroke={CRIMSON} strokeWidth="4" />
            <line x1="38" y1="0" x2="75" y2="0" stroke={CRIMSON} strokeWidth="4" />
            {/* Leader Line to Zoom Magnifier */}
            <path d="M55 -15 L155 -85 L235 -85" fill="none" stroke={CRIMSON} strokeWidth="4" />
          </g>

          {/* Top-Right: Engineering Caliper Magnifier HUD */}
          <g transform="translate(615 155)">
            <circle r="108" fill="#141118" stroke={CRIMSON} strokeWidth="6" />
            {/* Zoomed-in Nose Profile */}
            <path
              d="M-25 -65 L-55 32 L15 48 L35 25 Z"
              fill="#F0E6D6"
              stroke={CRIMSON}
              strokeWidth="5"
            />
            {/* Caliper Measurement Lines */}
            <line x1="-70" y1="-65" x2="65" y2="-65" stroke={GOLD} strokeWidth="3" strokeDasharray="5 5" />
            <line x1="-70" y1="48" x2="65" y2="48" stroke={GOLD} strokeWidth="3" strokeDasharray="5 5" />
            <text x="0" y="84" textAnchor="middle" fill={CRIMSON} fontSize="22" fontWeight="900" letterSpacing="2">
              KING'S EGO: "TOO BIG!"
            </text>
          </g>

          {/* Bottom-Right: Angry Arrogant King Shouting */}
          <DetailedKing x={645} y={355} scale={0.72} mood="angry" frame={frame} />
        </g>
      )}

      {/* =========================================================
          SCENE 3: STRATEGIC SILENCE (ARTIST REFUSES TO ARGUE)
         ========================================================= */}
      {kind === "silence" && (
        <g>
          {/* Sacred Geometry / Chess Strategy Aura Behind Artist */}
          <g transform="translate(460 310)">
            <circle
              r="245"
              fill="none"
              stroke="#B497E7"
              strokeWidth="2.5"
              strokeDasharray="10 14"
              transform={`rotate(${frame * 0.4})`}
            />
            <circle
              r="190"
              fill="none"
              stroke={GOLD}
              strokeWidth="2"
              opacity="0.45"
            />
          </g>

          {/* Left Card: Argument = Royal Wrath (Crossed Out) */}
          <g transform="translate(195 235)">
            <rect x="-125" y="-110" width="250" height="220" rx="22" fill="#1B141E" stroke={CRIMSON} strokeWidth="4" />
            <text y="-55" textAnchor="middle" fill={CRIMSON} fontSize="23" fontWeight="900" letterSpacing="2">
              IF HE ARGUED
            </text>
            <text y="12" textAnchor="middle" fontSize="64">
              🗣️⚔️
            </text>
            <text y="72" textAnchor="middle" fill="#E8B4B0" fontSize="20" fontWeight="800">
              KING'S EGO HURT ❌
            </text>
            <line x1="-95" y1="-80" x2="95" y2="80" stroke={CRIMSON} strokeWidth="9" strokeLinecap="round" />
          </g>

          {/* Center-Right: Calm Artist with Golden Lock on Lips & 200 IQ Mind */}
          <DetailedArtist x={615} y={240} scale={0.96} silentLock={true} frame={frame} />

          {/* Floating Chess Knight Strategy Badge Above Artist */}
          <g transform={`translate(615 ${80 + Math.sin(frame / 10) * 6})`}>
            <rect x="-155" y="-32" width="310" height="60" rx="30" fill="#1D172B" stroke="#B497E7" strokeWidth="3.5" />
            <text y="7" textAnchor="middle" fill="#EFE8FF" fontSize="22" fontWeight="900" letterSpacing="3">
              ♟️ SILENT STRATEGY: ON
            </text>
          </g>
        </g>
      )}

      {/* =========================================================
          SCENE 4: THE FAKE CHISEL & FALLING GOLDEN MARBLE DUST!
         ========================================================= */}
      {kind === "dust" && (
        <g>
          {/* Close-Up of Statue Face on Left */}
          <DetailedMarbleStatue x={265} y={195} scale={1.08} frame={frame} />

          {/* Green Laser Verification Line Showing Chisel NEVER Touches Nose */}
          <line
            x1="342"
            y1="140"
            x2="342"
            y2="290"
            stroke={EMERALD}
            strokeWidth="3.5"
            strokeDasharray="8 6"
          />
          <g transform="translate(342 110)">
            <rect x="-125" y="-24" width="250" height="42" rx="10" fill="#0E261C" stroke={EMERALD} strokeWidth="2.5" />
            <text y="4" textAnchor="middle" fill={EMERALD} fontSize="18" fontWeight="900" letterSpacing="1.5">
              GAP: 3 CM (NO CUT!) ✅
            </text>
          </g>

          {/* Animated Sculptor Hand Pretending to Chisel in Mid-Air */}
          <g
            transform={`translate(${455 + Math.sin(frame / 3.5) * 14} ${
              195 + Math.cos(frame / 3.5) * 8
            })`}
          >
            {/* Steel Chisel Held in Air */}
            <rect
              x="-75"
              y="-8"
              width="95"
              height="16"
              rx="4"
              fill="#D8DEE9"
              stroke="#4C566A"
              strokeWidth="3"
              transform="rotate(-12)"
            />
            {/* Sculptor's Hand Dropping Secret Dust */}
            <path
              d="M0 -25 C35 -35 75 -15 82 22 C75 52 32 62 -10 42 Z"
              fill="#C68B63"
              stroke={GOLD}
              strokeWidth="3.5"
            />
          </g>

          {/* 48 Cascading Golden Marble Dust Particles Falling Down! */}
          {dustParticles.map((p, i) => {
            const localF = (frame + p.delay) % 75;
            const prog = localF / 75;
            const py = p.y + prog * 290;
            const px = p.x + Math.sin(prog * 6 + i) * p.drift;

            return (
              <circle
                key={i}
                cx={px}
                cy={py}
                r={p.r}
                fill={i % 2 === 0 ? "#FFF6D6" : GOLD}
                opacity={clamp(1 - prog * 0.85)}
                filter="url(#glow)"
              />
            );
          })}

          {/* Dust Pile Collecting on Floor */}
          <path
            d="M345 535 Q430 495 515 535 Z"
            fill="url(#goldGradient)"
            opacity="0.85"
          />
          <text
            x="640"
            y="475"
            textAnchor="middle"
            fill={GOLD_BRIGHT}
            fontSize="26"
            fontWeight="900"
            letterSpacing="3"
          >
            FAKE DUST DROPPED ✨
          </text>
          <text
            x="640"
            y="512"
            textAnchor="middle"
            fill="#B8B0A4"
            fontSize="20"
            fontWeight="700"
          >
            STATUE UNTOUCHED (100% SAME)
          </text>
        </g>
      )}

      {/* =========================================================
          SCENE 5: THE KING IS DELIGHTED & CONVINCED
         ========================================================= */}
      {kind === "happy" && (
        <g>
          {/* Radiant Halo Behind Unchanged Statue */}
          <circle cx="265" cy="245" r="195" fill={EMERALD} opacity="0.1" filter="url(#glow)" />
          <DetailedMarbleStatue x={265} y={195} scale={1.02} frame={frame} />

          {/* Secret Truth Tag Under Statue */}
          <g transform="translate(265 535)">
            <rect x="-150" y="-24" width="300" height="46" rx="12" fill="#141F1A" stroke={EMERALD} strokeWidth="2.5" />
            <text y="6" textAnchor="middle" fill={EMERALD} fontSize="19" fontWeight="900" letterSpacing="2">
              ACTUAL CHANGE: 0.0 MM 🤫
            </text>
          </g>

          {/* Right: Overjoyed King Giving Royal Approval */}
          <DetailedKing x={645} y={245} scale={0.86} mood="happy" frame={frame} />

          {/* Royal Golden Approval Seal Stamp */}
          <g transform="translate(645 92)">
            <rect x="-175" y="-34" width="350" height="64" rx="32" fill="#10291E" stroke={EMERALD} strokeWidth="4" />
            <text y="8" textAnchor="middle" fill="#FFFFFF" fontSize="25" fontWeight="900" letterSpacing="3">
              ✅ "WAH! EKDUM PERFECT!"
            </text>
          </g>
        </g>
      )}

      {/* =========================================================
          SCENE 6: ROBERT GREENE — 48 LAWS OF POWER (LAW #09)
         ========================================================= */}
      {kind === "law" && (
        <g transform="translate(460 305)">
          {/* Rotating Celestial Astrolabe Rings */}
          <circle
            r="265"
            fill="none"
            stroke={GOLD}
            strokeWidth="3"
            strokeDasharray="14 10"
            transform={`rotate(${frame * 0.45})`}
          />
          <circle
            r="225"
            fill="none"
            stroke="#9E7B3E"
            strokeWidth="2"
            strokeDasharray="6 12"
            transform={`rotate(${-frame * 0.35})`}
          />

          {/* 3D Royal Hardcover Book with Gold Foil Embossing */}
          <g transform={`rotate(${-4 + Math.sin(frame / 22) * 2.5})`}>
            {/* Book Spine & Pages Thickness */}
            <path d="M-195 -225 L-170 -245 L205 -245 L205 215 L180 235 Z" fill="#E8DEC8" stroke={GOLD_DEEP} strokeWidth="3" />
            {/* Front Crimson & Gold Cover */}
            <rect
              x="-195"
              y="-225"
              width="380"
              height="450"
              rx="16"
              fill="url(#royalVelvet)"
              stroke="url(#goldGradient)"
              strokeWidth="9"
            />
            <rect
              x="-168"
              y="-198"
              width="326"
              height="396"
              rx="8"
              fill="none"
              stroke={GOLD}
              strokeWidth="2.5"
            />

            <text y="-125" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="22" fontWeight="800" letterSpacing="6">
              ROBERT GREENE
            </text>
            <text y="-62" textAnchor="middle" fill="#FFFFFF" fontSize="46" fontWeight="900" letterSpacing="2">
              THE 48 LAWS
            </text>
            <text y="-10" textAnchor="middle" fill={GOLD} fontSize="42" fontWeight="900" letterSpacing="4">
              OF POWER
            </text>

            <line x1="-110" y1="22" x2="110" y2="22" stroke={GOLD} strokeWidth="3" />

            {/* Giant Embossed Law 09 Emblem */}
            <circle cx="0" cy="108" r="64" fill="#171216" stroke="url(#goldGradient)" strokeWidth="5" />
            <text y="95" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="18" fontWeight="900" letterSpacing="3">
              LAW
            </text>
            <text y="138" textAnchor="middle" fill={GOLD} fontSize="52" fontWeight="900">
              #09
            </text>
          </g>
        </g>
      )}

      {/* =========================================================
          SCENE 7: ARGUMENT (ENERGY DRAIN) VS ACTION (CHECKMATE)
         ========================================================= */}
      {kind === "action" && (
        <g>
          {/* LEFT PANEL: FALTU BEHES (ENERGY DRAINED) */}
          <g transform="translate(235 305)">
            <rect
              x="-195"
              y="-235"
              width="390"
              height="470"
              rx="28"
              fill="#1A1216"
              stroke={CRIMSON}
              strokeWidth="4.5"
            />
            <text y="-175" textAnchor="middle" fill={CRIMSON} fontSize="30" fontWeight="900" letterSpacing="3">
              ❌ VERBAL ARGUMENT
            </text>

            {/* Clashing Red Soundwaves */}
            <circle cx="0" cy="-25" r="88" fill="rgba(224,83,76,0.12)" stroke={CRIMSON} strokeWidth="3" strokeDasharray="8 8" />
            <text y="0" textAnchor="middle" fontSize="74">
              🤬⚡🤬
            </text>

            {/* Draining Energy Battery Bar */}
            <rect x="-140" y="105" width="280" height="32" rx="16" fill="#2B1B20" stroke={CRIMSON} strokeWidth="2" />
            <rect x="-134" y="111" width="48" height="20" rx="10" fill={CRIMSON} />
            <text y="178" textAnchor="middle" fill="#F2A29E" fontSize="22" fontWeight="900" letterSpacing="2">
              TIME & ENERGY WASTED: 99%
            </text>
          </g>

          {/* RIGHT PANEL: SILENT ACTION (100% VICTORY) */}
          <g transform="translate(685 305)">
            <rect
              x="-195"
              y="-235"
              width="390"
              height="470"
              rx="28"
              fill="#121E19"
              stroke={EMERALD}
              strokeWidth="4.5"
            />
            <text y="-175" textAnchor="middle" fill={EMERALD} fontSize="30" fontWeight="900" letterSpacing="3">
              ✅ SILENT ACTION
            </text>

            {/* Golden Target Bullseye & Crown */}
            <circle cx="0" cy="-25" r="88" fill="rgba(76,224,155,0.12)" stroke={GOLD} strokeWidth="4" />
            <text y="0" textAnchor="middle" fontSize="74">
              ♟️👑
            </text>

            {/* Full Power Bar */}
            <rect x="-140" y="105" width="280" height="32" rx="16" fill="#142E24" stroke={EMERALD} strokeWidth="2" />
            <rect x="-134" y="111" width="268" height="20" rx="10" fill={EMERALD} />
            <text y="178" textAnchor="middle" fill={EMERALD} fontSize="22" fontWeight="900" letterSpacing="2">
              INSTANT WIN: 100% RESPECT
            </text>
          </g>
        </g>
      )}

      {/* =========================================================
          SCENE 8: INTERACTIVE COMMENT CTA ("TAG THAT FRIEND")
         ========================================================= */}
      {kind === "cta" && (
        <g transform="translate(460 305)">
          <circle
            r="255"
            fill="none"
            stroke={GOLD}
            strokeWidth="3"
            strokeDasharray="12 14"
            transform={`rotate(${frame * 0.5})`}
          />

          {/* Social Comment Card */}
          <rect
            x="-360"
            y="-185"
            width="720"
            height="370"
            rx="34"
            fill="#15141C"
            stroke="url(#goldGradient)"
            strokeWidth="6"
          />

          <text y="-105" textAnchor="middle" fill={GOLD_BRIGHT} fontSize="28" fontWeight="900" letterSpacing="4">
            👑 THE "FALTU BEHES" AWARD GOES TO:
          </text>

          {/* Typing Comment Input Box */}
          <rect
            x="-300"
            y="-45"
            width="600"
            height="105"
            rx="22"
            fill="#0B0B10"
            stroke={GOLD}
            strokeWidth="3"
          />
          <text x="-265" y="20" fill="#FFFFFF" fontSize="36" fontWeight="900">
            @tag_your_argument_friend 😂👇
          </text>

          {/* Pulsing CTA Button */}
          <g transform={`translate(0 120) scale(${1 + Math.sin(frame / 7) * 0.04})`}>
            <rect x="-220" y="-36" width="440" height="72" rx="36" fill="url(#goldGradient)" />
            <text y="10" textAnchor="middle" fill="#17120A" fontSize="27" fontWeight="900" letterSpacing="3">
              COMMENT THEIR NAME NOW!
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};

/* =========================================================
   WORD-BY-WORD SYNCED KARAOKE SUBTITLE CARD
   ========================================================= */

const KaraokeSubtitleCard: React.FC<{
  subtitle: string;
  frame: number;
  duration: number;
  accent: string;
}> = ({ subtitle, frame, duration, accent }) => {
  const words = subtitle.trim().split(/\s+/);
  const startFrame = 12;
  const endFrame = Math.max(startFrame + 30, duration - 18);
  const progress = clamp((frame - startFrame) / (endFrame - startFrame));
  const activeWordIndex = Math.min(
    words.length - 1,
    Math.floor(progress * words.length)
  );

  const fontSize =
    subtitle.length > 130 ? 31 : subtitle.length > 90 ? 34 : 38;

  return (
    <div
      style={{
        position: "absolute",
        top: 1385,
        left: 64,
        right: 64,
        minHeight: 265,
        padding: "32px 36px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${accent}55`,
        borderRadius: 28,
        background:
          "linear-gradient(145deg, rgba(28, 25, 32, 0.96), rgba(12, 12, 18, 0.96))",
        boxShadow: "0 25px 70px rgba(0,0,0,0.55)",
      }}
    >
      {/* Top Accent Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 140,
          height: 5,
          background: accent,
          borderRadius: 20,
          boxShadow: `0 0 20px ${accent}`,
        }}
      />

      {/* Word-by-Word Highlighted Text */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px 12px",
          maxWidth: 860,
          textAlign: "center",
        }}
      >
        {words.map((word, idx) => {
          const isCurrent = idx === activeWordIndex;
          const isSpoken = idx < activeWordIndex;

          return (
            <span
              key={idx}
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize,
                fontWeight: isCurrent ? 900 : 700,
                lineHeight: 1.35,
                color: isCurrent
                  ? "#110E0A"
                  : isSpoken
                    ? CREAM
                    : "rgba(233, 225, 213, 0.48)",
                background: isCurrent ? accent : "transparent",
                padding: isCurrent ? "3px 12px" : "3px 2px",
                borderRadius: 10,
                transform: isCurrent ? "scale(1.06)" : "scale(1)",
                boxShadow: isCurrent ? `0 0 24px ${accent}88` : "none",
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

/* =========================================================
   SCENE SHELL COMPONENT
   ========================================================= */

const Scene: React.FC<{
  data: SceneData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const duration = data.end - data.start;

  const entrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const titlePop = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 11, stiffness: 150, mass: 0.8 },
  });

  const highlightPop = spring({
    frame: Math.max(0, frame - 22),
    fps,
    config: { damping: 9, stiffness: 180, mass: 0.7 },
  });

  const fadeIn = smooth(frame, 0, 15);
  const fadeOut = interpolate(frame, [duration - 15, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flash = interpolate(frame, [0, 3, 12], [0, 0.22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn * fadeOut,
        overflow: "hidden",
        background: `
          radial-gradient(
            ellipse at 50% 42%,
            ${data.accent}22 0%,
            transparent 58%
          ),
          linear-gradient(
            160deg,
            #13121B 0%,
            #08090D 48%,
            #121018 100%
          )
        `,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          position: "absolute",
          top: 86,
          left: 72,
          right: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: entrance,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: data.accent,
              boxShadow: `0 0 20px ${data.accent}`,
            }}
          />
          <span
            style={{
              color: "#E7D9BD",
              fontSize: 21,
              fontWeight: 900,
              letterSpacing: 5,
            }}
          >
            THE POWER PLAY
          </span>
        </div>

        <span
          style={{
            color: "#A59E94",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 3,
          }}
        >
          SCENE {String(data.id).padStart(2, "0")} / 08
        </span>
      </div>

      {/* Section Eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 178,
          width: "100%",
          textAlign: "center",
          color: data.accent,
          fontSize: 21,
          letterSpacing: 5,
          fontWeight: 900,
          opacity: smooth(frame, 4, 20),
        }}
      >
        {data.label}
      </div>

      {/* Main Two-Line Impact Title */}
      <div
        style={{
          position: "absolute",
          top: 238,
          left: 45,
          right: 45,
          textAlign: "center",
          transform: `translateY(${(1 - titlePop) * 40}px) scale(${
            0.9 + titlePop * 0.1
          })`,
          opacity: titlePop,
        }}
      >
        <div
          style={{
            fontSize: data.titleA.length > 17 ? 66 : 78,
            fontWeight: 900,
            lineHeight: 1.05,
            fontFamily: '"Arial Black", "Arial", sans-serif',
            color: CREAM,
            letterSpacing: -2,
            textShadow: "0 12px 35px rgba(0,0,0,0.5)",
          }}
        >
          {data.titleA}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: data.titleB.length > 19 ? 62 : 82,
            fontWeight: 900,
            lineHeight: 1.04,
            fontFamily: '"Arial Black", "Arial", sans-serif',
            color: data.accent,
            letterSpacing: -2.5,
            textShadow: `0 0 40px ${data.accent}40`,
          }}
        >
          {data.titleB}
        </div>
      </div>

      {/* Central High-Detail Visual Stage */}
      <div
        style={{
          position: "absolute",
          top: 525,
          left: 80,
          width: 920,
          height: 650,
        }}
      >
        <SceneArt kind={data.kind} frame={frame} accent={data.accent} />
      </div>

      {/* Highlight Badge */}
      <div
        style={{
          position: "absolute",
          top: 1215,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: highlightPop,
          transform: `scale(${0.7 + highlightPop * 0.3})`,
        }}
      >
        <div
          style={{
            padding: "16px 38px",
            borderRadius: 100,
            background: "linear-gradient(110deg, #F5E1B2, #C69B53, #F5E1B2)",
            color: "#161218",
            fontSize: 25,
            fontWeight: 900,
            letterSpacing: 4,
            boxShadow: "0 12px 45px rgba(214, 180, 108, 0.3)",
          }}
        >
          {data.highlight}
        </div>
      </div>

      {/* Synced Word-by-Word Karaoke Caption Card */}
      <KaraokeSubtitleCard
        subtitle={data.subtitle}
        frame={frame}
        duration={duration}
        accent={data.accent}
      />

      {/* Bottom Branding */}
      <div
        style={{
          position: "absolute",
          bottom: 58,
          left: 75,
          right: 75,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#8D867C",
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: 4,
        }}
      >
        <span>48 LAWS OF POWER • LAW #09</span>
        <span>CHAPTER 0{data.id}</span>
      </div>

      {/* Cinematic Flash Transition */}
      <AbsoluteFill
        style={{
          background: "#FFF3DC",
          opacity: flash,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/* =========================================================
   BUILT-IN PROCEDURAL SFX CUES (ZERO EXTERNAL FILES)
   ========================================================= */

const BUILTIN_SFX_TIMELINE: Array<{
  frame: number;
  kind: SfxKind;
  volume: number;
}> = [
  { frame: 2, kind: "impact", volume: 0.55 },
  { frame: 540, kind: "whoosh", volume: 0.5 },
  { frame: 565, kind: "impact", volume: 0.55 },
  { frame: 980, kind: "whoosh", volume: 0.45 },
  { frame: 1420, kind: "whoosh", volume: 0.5 },
  { frame: 1510, kind: "chisel", volume: 0.45 },
  { frame: 1545, kind: "chisel", volume: 0.45 },
  { frame: 1580, kind: "dust", volume: 0.55 },
  { frame: 2020, kind: "impact", volume: 0.6 },
  { frame: 2500, kind: "impact", volume: 0.65 },
  { frame: 3100, kind: "whoosh", volume: 0.5 },
  { frame: 3640, kind: "pop", volume: 0.6 },
];

/* =========================================================
   MAIN REEL COMPOSITION
   ========================================================= */

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, DURATION], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: DARK, overflow: "hidden" }}>
      {/* Story Scenes */}
      {SCENES.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.start}
          durationInFrames={scene.end - scene.start}
        >
          <Scene data={scene} />
        </Sequence>
      ))}

      {/* Procedural Sound Effects (Works Automatically Without Any External Files!) */}
      {BUILTIN_SFX_TIMELINE.map((cue, idx) => (
        <Sequence key={idx} from={cue.frame} durationInFrames={45} layout="none">
          <Audio src={PROCEDURAL_SFX[cue.kind]} volume={cue.volume} />
        </Sequence>
      ))}

      {/* Bottom Master Progress Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 8,
          width: `${progress}%`,
          background: "linear-gradient(90deg, #8D683B, #F5DCA4, #C79A50)",
          boxShadow: "0 0 25px rgba(218,177,103,0.65)",
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
