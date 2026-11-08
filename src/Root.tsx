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
   THE DECOY EFFECT — 18 SUB-3-SECOND VOICEOVER-SYNCED CUTS EDITION
   1080 x 1920 | 60 FPS | 43.0 Seconds (2580 Frames)
   Every 4s-5s sentence is split into 2.0s - 2.9s rapid visual micro-scenes!
   Zero External Assets Required. Built-in Procedural UI, Cash & Glitch SFX.
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2580; // 43.0 Seconds @ 60 FPS

const CYAN = "#00F0FF";
const NEON_GREEN = "#00FF87";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const PURPLE = "#A855F7";
const DARK_BG = "#05070E";
const CARD_BG = "rgba(14, 20, 36, 0.92)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. PROCEDURAL SOUND EFFECTS ENGINE (NO EXTERNAL AUDIO FILES)
   ========================================================================= */

type SfxKind =
  | "whoosh"
  | "pop"
  | "glitchSlam"
  | "kaching"
  | "buzzer"
  | "ding"
  | "stampSlam"
  | "radarPing";

function buildDecoySfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations: Record<SfxKind, number> = {
    whoosh: 0.2,
    pop: 0.15,
    glitchSlam: 0.36,
    kaching: 0.52,
    buzzer: 0.28,
    ding: 0.35,
    stampSlam: 0.32,
    radarPing: 0.38,
  };

  const duration = durations[kind];
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
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
    let w = 0;
    let env = 1;

    if (kind === "whoosh") {
      const noise = Math.sin(i * 12.9898) * Math.cos(i * 0.22);
      w =
        noise * 0.35 +
        Math.sin(2 * Math.PI * (190 + Math.sin(p * Math.PI) * 440) * t) * 0.45;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (kind === "pop") {
      const f = 360 + p * 560;
      w = Math.sin(2 * Math.PI * f * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 1.4);
    } else if (kind === "glitchSlam") {
      const f = 140 * Math.pow(1 - p, 1.8) + 36;
      const crush = Math.sign(Math.sin(2 * Math.PI * 540 * t)) * 0.35;
      w = Math.sin(2 * Math.PI * f * t) * 0.8 + crush * Math.exp(-p * 7);
      env = Math.pow(1 - p, 2.0);
    } else if (kind === "kaching") {
      // Crisp metallic coin + cash register bell
      const f1 = p < 0.22 ? 1318.5 : 2637;
      w =
        Math.sin(2 * Math.PI * f1 * t) * 0.6 +
        Math.sin(2 * Math.PI * (f1 * 1.5) * t) * 0.3;
      env = Math.exp(-((p % 0.22) * 11));
    } else if (kind === "buzzer") {
      w =
        Math.sign(Math.sin(2 * Math.PI * 145 * t)) * 0.45 +
        Math.sin(2 * Math.PI * 290 * t) * 0.35;
      env = Math.pow(1 - p, 1.3);
    } else if (kind === "ding") {
      w =
        Math.sin(2 * Math.PI * 1174.6 * t) * 0.65 +
        Math.sin(2 * Math.PI * 2349.3 * t) * 0.25;
      env = Math.exp(-p * 6.5);
    } else if (kind === "stampSlam") {
      const f = 115 * Math.pow(1 - p, 2.1) + 32;
      w = Math.sin(2 * Math.PI * f * t) * 0.9;
      env = Math.pow(1 - p, 2.3);
    } else if (kind === "radarPing") {
      const f = p < 0.4 ? 880 : 1320;
      w = Math.sin(2 * Math.PI * f * t) * 0.65;
      env = Math.exp(-p * 5.5);
    }

    const out = clamp(w * env * 0.74, -1, 1);
    view.setInt16(44 + i * 2, out * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX: Record<SfxKind, string> = {
  whoosh: buildDecoySfx("whoosh"),
  pop: buildDecoySfx("pop"),
  glitchSlam: buildDecoySfx("glitchSlam"),
  kaching: buildDecoySfx("kaching"),
  buzzer: buildDecoySfx("buzzer"),
  ding: buildDecoySfx("ding"),
  stampSlam: buildDecoySfx("stampSlam"),
  radarPing: buildDecoySfx("radarPing"),
};

/* =========================================================================
   02. 18 RAPID SUB-3-SECOND VISUAL CUTS (SPLIT 2s + 2s / 2s + 3s)
   ========================================================================= */

type CutSpec = {
  id: number;
  startSec: number;
  endSec: number;
  badge: string;
  titleTop: string;
  titleMain: string;
  subTag: string;
  accent: string;
  shake?: boolean;
};

const RAPID_CUTS: CutSpec[] = [
  // 1 (0.0s - 2.2s | 2.2s): "Chalo aaj dekhte hain, badi companies aapki kaise leti hain..."
  {
    id: 1,
    startSec: 0.0,
    endSec: 2.2,
    badge: "HOOK // 01",
    titleTop: "CHALO AAJ DEKHTE HAIN...",
    titleMain: "COMPANIES KAISE LETI HAIN?! 👀",
    subTag: "WAIT FOR IT...",
    accent: GOLD,
  },
  // 2 (2.2s - 4.3s | 2.1s): "...Mera matlab hai, aapki jeb kaise khaali karti hain!"
  {
    id: 2,
    startSec: 2.2,
    endSec: 4.3,
    badge: "POCKET DRAIN // 02",
    titleTop: "MERA MATLAB HAI...",
    titleMain: "JEB KAISE KHAALI KARTI HAIN! 💸",
    subTag: "WALLET BALANCE: ₹0",
    accent: CRIMSON,
    shake: true,
  },
  // 3 (4.3s - 6.2s | 1.9s): "Ise dark psychology mein kehte hain..."
  {
    id: 3,
    startSec: 4.3,
    endSec: 6.2,
    badge: "SECRET FILE // 03",
    titleTop: "ISE DARK PSYCHOLOGY MEIN",
    titleMain: "KYA KEHTE HAIN? 🕵️‍♂️",
    subTag: "CLASSIFIED MARKETING TRICK",
    accent: PURPLE,
  },
  // 4 (6.2s - 8.2s | 2.0s): "...The Decoy Effect!"
  {
    id: 4,
    startSec: 6.2,
    endSec: 8.2,
    badge: "THE TRAP // 04",
    titleTop: "THE ILLUSION OF CHOICE:",
    titleMain: "THE DECOY EFFECT! 🎯",
    subTag: "BRAIN MANIPULATION FORMULA",
    accent: CYAN,
    shake: true,
  },
  // 5 (8.2s - 10.2s | 2.0s): "Maan lo aap movie dekhne gaye."
  {
    id: 5,
    startSec: 8.2,
    endSec: 10.2,
    badge: "SCENARIO // 05",
    titleTop: "MAAN LO AAP GAYE",
    titleMain: "MOVIE DEKHNE! 🎬",
    subTag: "CINEMA SNACK COUNTER",
    accent: GOLD,
  },
  // 6 (10.2s - 12.6s | 2.4s): "Small Popcorn 100 rupees ka hai, aur Large 200 ka."
  {
    id: 6,
    startSec: 10.2,
    endSec: 12.6,
    badge: "MENU BOARD // 06",
    titleTop: "SAMNE SIRF 2 OPTIONS HAIN:",
    titleMain: "SMALL ₹100 vs LARGE ₹200 🍿",
    subTag: "2X PRICE DIFFERENCE",
    accent: CYAN,
  },
  // 7 (12.6s - 15.2s | 2.6s): "Aap paise bachane ke liye hamesha Small loge, right?"
  {
    id: 7,
    startSec: 12.6,
    endSec: 15.2,
    badge: "SMART MOVE // 07",
    titleTop: "PAISE BACHANE KE LIYE",
    titleMain: "AAP SMALL HI LOGE, RIGHT? ✅",
    subTag: "LOGICAL BRAIN SAVES ₹100",
    accent: NEON_GREEN,
  },
  // 8 (15.2s - 17.5s | 2.3s): "Lekin ab companies khelti hain mind game!"
  {
    id: 8,
    startSec: 15.2,
    endSec: 17.5,
    badge: "TRAP ACTIVATED // 08",
    titleTop: "LEKIN AB COMPANIES KHELTI HAIN",
    titleMain: "DIRTY MIND GAME! 🧠⚡",
    subTag: "PSYCHOLOGICAL OVERRIDE",
    accent: CRIMSON,
    shake: true,
  },
  // 9 (17.5s - 20.3s | 2.8s): "Wo beech mein ek Medium Popcorn rakh deti hain, 180 rupees ka!"
  {
    id: 9,
    startSec: 17.5,
    endSec: 20.3,
    badge: "THE BAIT // 09",
    titleTop: "BEECH MEIN RAKH DETI HAIN:",
    titleMain: "MEDIUM POPCORN @ ₹180! 🚨",
    subTag: "3-OPTION MENU TRAP",
    accent: GOLD,
    shake: true,
  },
  // 10 (20.3s - 22.3s | 2.0s): "Ab aapka dimaag kahega—"
  {
    id: 10,
    startSec: 20.3,
    endSec: 22.3,
    badge: "BRAIN GLITCH // 10",
    titleTop: "AB AAPKA DIMAAG",
    titleMain: "TURANT COMPARE KAREGA: 🤯",
    subTag: "₹180 vs ₹200 = SIRF ₹20!",
    accent: PURPLE,
  },
  // 11 (22.3s - 25.2s | 2.9s): "Bhai sirf 20 rupees aur dekar Large mil raha hai, wahi le leta hoon!"
  {
    id: 11,
    startSec: 22.3,
    endSec: 25.2,
    badge: "GOTCHA! // 11",
    titleTop: "SIRF ₹20 AUR DEKAR",
    titleMain: "LARGE HI LE LETA HOON! 🤑",
    subTag: "YOU SPENT ₹200 INSTEAD OF ₹100!",
    accent: NEON_GREEN,
    shake: true,
  },
  // 12 (25.2s - 27.5s | 2.3s): "Ye Medium Popcorn unhe bechna hi nahi tha!"
  {
    id: 12,
    startSec: 25.2,
    endSec: 27.5,
    badge: "DARK TRUTH // 12",
    titleTop: "YE MEDIUM POPCORN UNHE",
    titleMain: "BECHNA HI NAHI THA! ❌",
    subTag: "DUMMY PRODUCT EXPOSED",
    accent: CRIMSON,
  },
  // 13 (27.5s - 29.6s | 2.1s): "Ye bas ek Decoy tha..."
  {
    id: 13,
    startSec: 27.5,
    endSec: 29.6,
    badge: "PURE BAIT // 13",
    titleTop: "YE BAS EK",
    titleMain: "FAKE DECOY THA! 🪝",
    subTag: "DESIGNED TO MAKE ₹200 LOOK CHEAP",
    accent: GOLD,
  },
  // 14 (29.6s - 32.2s | 2.6s): "...aapke dimaag ke decision ko control karne ke liye!"
  {
    id: 14,
    startSec: 29.6,
    endSec: 32.2,
    badge: "MIND CONTROL // 14",
    titleTop: "AAPKE DIMAAG KE DECISION KO",
    titleMain: "CONTROL KARNE KE LIYE! 🎮",
    subTag: "PUPPET MASTER MARKETING",
    accent: CYAN,
    shake: true,
  },
  // 15 (32.2s - 35.0s | 2.8s): "Agli baar shopping karte waqt apna dimaag khula rakhna!"
  {
    id: 15,
    startSec: 32.2,
    endSec: 35.0,
    badge: "STAY AWARE // 15",
    titleTop: "AGLI BAAR SHOPPING MEIN",
    titleMain: "DIMAAG KHULA RAKHNA! 🛡️",
    subTag: "ANTI-DECOY RADAR ON",
    accent: NEON_GREEN,
  },
  // 16 (35.0s - 37.5s | 2.5s): "Waise aapka kaun sa dost offers ke chakkar mein..."
  {
    id: 16,
    startSec: 35.0,
    endSec: 37.5,
    badge: "SALE MAGNET // 16",
    titleTop: "KAUN SA DOST OFFERS DEKHTE HI",
    titleMain: "PAGAL HO JATA HAI? 🛍️",
    subTag: "BUY 1 GET 1 TRAP VICTIM",
    accent: PURPLE,
  },
  // 17 (37.5s - 40.0s | 2.5s): "...sabse zyada bewakoof banta hai?"
  {
    id: 17,
    startSec: 37.5,
    endSec: 40.0,
    badge: "AWARD GOES TO // 17",
    titleTop: "OFFERS KE CHAKKAR MEIN",
    titleMain: "SABSE BADA BEWAKOOF! 🤡🏆",
    subTag: "#1 MARKETING VICTIM",
    accent: GOLD,
    shake: true,
  },
  // 18 (40.0s - 43.0s | 3.0s): "Comment mein use jaldi Tag karo!"
  {
    id: 18,
    startSec: 40.0,
    endSec: 43.0,
    badge: "YOUR TURN // 18",
    titleTop: "COMMENT MEIN USE",
    titleMain: "JALDI TAG KARO! 👇",
    subTag: "EXPOSE THAT FRIEND BELOW",
    accent: CYAN,
  },
];

/* =========================================================================
   03. CYBERNETIC BACKGROUND GRID & FLOATING PARTICLES
   ========================================================================= */

const CyberAtmosphere: React.FC<{ accent: string; frame: number }> = ({
  accent,
  frame,
}) => {
  const shift = (frame * 1.5) % 90;
  const particles = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        x: (i * 193 + 51) % WIDTH,
        y: (i * 271 + 83) % HEIGHT,
        size: 3 + (i % 4) * 1.5,
        speed: 0.9 + (i % 5) * 0.35,
      })),
    []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 54%, ${accent}28 0%, rgba(6,10,20,0.9) 58%, ${DARK_BG} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage: `
            linear-gradient(${accent}44 1px, transparent 1px),
            linear-gradient(90deg, ${accent}44 1px, transparent 1px)
          `,
          backgroundSize: "90px 90px",
          transform: `translateY(${shift}px)`,
        }}
      />
      {particles.map((p, i) => {
        const py = (p.y - frame * p.speed + HEIGHT) % HEIGHT;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: py,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: i % 3 === 0 ? "#FFF" : accent,
              opacity: 0.25 + (i % 4) * 0.12,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* =========================================================================
   04. 18 UNIQUE MICRO-SCENE VISUAL WIDGETS (NEW VISUAL EVERY ~2.2s!)
   ========================================================================= */

const MicroSceneWidget: React.FC<{
  cutId: number;
  localFrame: number;
  accent: string;
}> = ({ cutId, localFrame, accent }) => {
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 175 },
  });

  // CUT 1 (0.0s - 2.2s): CORPORATE EVIL EYE SCANNER & SUSPENSE QUESTION
  if (cutId === 1) {
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${GOLD}`,
          boxShadow: `0 0 85px ${GOLD}44`,
          textAlign: "center",
          transform: `scale(${0.85 + pop * 0.15})`,
        }}
      >
        <svg width="760" height="320" viewBox="0 0 760 320">
          <g transform="translate(380 160)">
            <circle
              r="140"
              fill="none"
              stroke={GOLD}
              strokeWidth="4"
              strokeDasharray="16 12"
              transform={`rotate(${localFrame * 2})`}
            />
            <path
              d="M-210 0 Q0 -150 210 0 Q0 150 -210 0 Z"
              fill="rgba(255,209,102,0.12)"
              stroke={GOLD}
              strokeWidth="6"
            />
            <circle cx={Math.sin(localFrame * 0.12) * 35} cy="0" r="52" fill={CRIMSON} />
            <circle cx={Math.sin(localFrame * 0.12) * 35} cy="0" r="22" fill="#000" />
          </g>
        </svg>
        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: 3,
            marginTop: 12,
          }}
        >
          🏢 BIG BRANDS vs <span style={{ color: GOLD }}>YOUR BRAIN 🧠</span>
        </div>
      </div>
    );
  }

  // CUT 2 (2.2s - 4.3s): WALLET DRAINING FROM ₹2,500 TO ₹0
  if (cutId === 2) {
    const moneyLeft = Math.max(
      0,
      Math.floor(interpolate(localFrame, [5, 85], [2500, 0]))
    );
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${CRIMSON}`,
          boxShadow: `0 0 90px ${CRIMSON}55`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 105, marginBottom: 10 }}>👛💸💨</div>
        <div style={{ color: "#94A3B8", fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>
          YOUR POCKET BALANCE
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 900,
            color: moneyLeft === 0 ? CRIMSON : "#FFFFFF",
            fontFamily: '"Arial Black", monospace',
            margin: "12px 0",
          }}
        >
          ₹{moneyLeft}
        </div>
        <div
          style={{
            padding: "16px 36px",
            borderRadius: 100,
            display: "inline-block",
            background: CRIMSON,
            color: "#FFF",
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          JEB SAAF! 🚨
        </div>
      </div>
    );
  }

  // CUT 3 (4.3s - 6.2s): CLASSIFIED DARK PSYCHOLOGY DOSSIER
  if (cutId === 3) {
    return (
      <div
        style={{
          width: 860,
          padding: 50,
          borderRadius: 42,
          background: "linear-gradient(155deg, #1E1035, #090612)",
          border: `5px solid ${PURPLE}`,
          boxShadow: `0 0 85px ${PURPLE}55`,
          textAlign: "center",
          transform: `scale(${0.85 + pop * 0.15})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 30px",
            borderRadius: 12,
            border: `3px solid ${CRIMSON}`,
            color: CRIMSON,
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: 5,
            marginBottom: 24,
          }}
        >
          📁 TOP SECRET // MARKETING
        </div>
        <div style={{ fontSize: 110, margin: "10px 0" }}>🧠🔒</div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: "#FFFFFF",
            fontFamily: '"Arial Black", sans-serif',
            marginTop: 14,
          }}
        >
          DARK PSYCHOLOGY CHAPTER #07
        </div>
      </div>
    );
  }

  // CUT 4 (6.2s - 8.2s): THE DECOY EFFECT 3D EMBLEM
  if (cutId === 4) {
    return (
      <div
        style={{
          width: 880,
          padding: 52,
          borderRadius: 44,
          background: CARD_BG,
          border: `6px solid ${CYAN}`,
          boxShadow: `0 0 95px ${CYAN}66`,
          textAlign: "center",
          transform: `scale(${0.84 + pop * 0.16})`,
        }}
      >
        <div style={{ fontSize: 115 }}>🎯🪤</div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            color: CYAN,
            fontFamily: '"Arial Black", sans-serif',
            letterSpacing: 2,
            marginTop: 14,
            textShadow: `0 0 40px ${CYAN}`,
          }}
        >
          THE DECOY EFFECT
        </div>
        <div
          style={{
            color: GOLD,
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 4,
            marginTop: 14,
          }}
        >
          “FAKE CHOICE = REAL PROFIT”
        </div>
      </div>
    );
  }

  // CUT 5 (8.2s - 10.2s): CINEMA HALL MARQUEE & VIP TICKET
  if (cutId === 5) {
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: "linear-gradient(145deg, #2A1215, #0D0814)",
          border: `5px solid ${GOLD}`,
          boxShadow: `0 0 85px ${GOLD}55`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: GOLD,
            letterSpacing: 6,
            marginBottom: 22,
          }}
        >
          ✨ PVR / CINEMA SNACK COUNTER ✨
        </div>
        <div
          style={{
            padding: "36px 40px",
            borderRadius: 30,
            background: "#120D1D",
            border: `4px dashed ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <span style={{ fontSize: 110 }}>🎟️🍿</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#FFF", fontSize: 46, fontWeight: 900 }}>
              MOVIE NIGHT
            </div>
            <div style={{ color: CYAN, fontSize: 28, fontWeight: 800, marginTop: 8 }}>
              INTERVAL POPCORN TIME!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CUT 6 (10.2s - 12.6s): SMALL ₹100 VS LARGE ₹200 (2-COLUMN PRICING)
  if (cutId === 6) {
    return (
      <div
        style={{
          width: 900,
          display: "flex",
          gap: 36,
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        {/* Small ₹100 */}
        <div
          style={{
            flex: 1,
            padding: "44px 28px",
            borderRadius: 38,
            background: CARD_BG,
            border: `4px solid ${CYAN}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 95 }}>🍿</div>
          <div style={{ color: "#FFF", fontSize: 42, fontWeight: 900, marginTop: 18 }}>
            SMALL
          </div>
          <div
            style={{
              color: CYAN,
              fontSize: 82,
              fontWeight: 900,
              fontFamily: '"Arial Black", sans-serif',
              marginTop: 10,
            }}
          >
            ₹100
          </div>
        </div>

        {/* Large ₹200 */}
        <div
          style={{
            flex: 1,
            padding: "44px 28px",
            borderRadius: 38,
            background: CARD_BG,
            border: `4px solid ${GOLD}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 130 }}>🍿</div>
          <div style={{ color: "#FFF", fontSize: 42, fontWeight: 900, marginTop: 8 }}>
            LARGE
          </div>
          <div
            style={{
              color: GOLD,
              fontSize: 82,
              fontWeight: 900,
              fontFamily: '"Arial Black", sans-serif',
              marginTop: 10,
            }}
          >
            ₹200
          </div>
        </div>
      </div>
    );
  }

  // CUT 7 (12.6s - 15.2s): USER PICKS SMALL ₹100 (SAVES MONEY)
  if (cutId === 7) {
    return (
      <div
        style={{
          width: 900,
          display: "flex",
          gap: 36,
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        {/* Selected Small ₹100 */}
        <div
          style={{
            flex: 1,
            padding: "44px 28px",
            borderRadius: 38,
            background: "#0B291E",
            border: `6px solid ${NEON_GREEN}`,
            boxShadow: `0 0 75px ${NEON_GREEN}66`,
            textAlign: "center",
            transform: "scale(1.06)",
          }}
        >
          <div style={{ fontSize: 95 }}>🍿</div>
          <div style={{ color: "#FFF", fontSize: 40, fontWeight: 900, marginTop: 14 }}>
            SMALL • ₹100
          </div>
          <div
            style={{
              marginTop: 20,
              padding: "14px 20px",
              borderRadius: 16,
              background: NEON_GREEN,
              color: "#05140E",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            ✅ YOU PICK THIS!
          </div>
        </div>

        {/* Rejected Large ₹200 */}
        <div
          style={{
            flex: 1,
            padding: "44px 28px",
            borderRadius: 38,
            background: CARD_BG,
            border: "4px solid #334155",
            textAlign: "center",
            opacity: 0.45,
          }}
        >
          <div style={{ fontSize: 120 }}>🍿</div>
          <div style={{ color: "#94A3B8", fontSize: 40, fontWeight: 900, marginTop: 14 }}>
            LARGE • ₹200
          </div>
          <div
            style={{
              marginTop: 20,
              padding: "14px 20px",
              borderRadius: 16,
              background: CRIMSON,
              color: "#FFF",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            ❌ TOO EXPENSIVE
          </div>
        </div>
      </div>
    );
  }

  // CUT 8 (15.2s - 17.5s): COMPANIES PLAY MIND GAME (CHESS + BRAIN)
  if (cutId === 8) {
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${CRIMSON}`,
          boxShadow: `0 0 85px ${CRIMSON}55`,
          textAlign: "center",
          transform: `scale(${0.85 + pop * 0.15})`,
        }}
      >
        <div style={{ fontSize: 125 }}>♟️🧠⚡</div>
        <div
          style={{
            fontSize: 66,
            fontWeight: 900,
            color: CRIMSON,
            fontFamily: '"Arial Black", sans-serif',
            marginTop: 16,
          }}
        >
          MIND GAME ACTIVATED!
        </div>
        <div style={{ color: "#FFF", fontSize: 32, fontWeight: 800, marginTop: 14 }}>
          Goal: Make You Spend <span style={{ color: GOLD }}>₹200 Willingly!</span>
        </div>
      </div>
    );
  }

  // CUT 9 (17.5s - 20.3s): MEDIUM ₹180 SLAMS INTO THE MIDDLE!
  if (cutId === 9) {
    const midSlam = spring({
      frame: Math.max(0, localFrame - 12),
      fps,
      config: { damping: 9, stiffness: 220 },
    });

    return (
      <div
        style={{
          width: 960,
          display: "flex",
          gap: 22,
          alignItems: "center",
        }}
      >
        {/* Small ₹100 */}
        <div
          style={{
            flex: 1,
            padding: "36px 16px",
            borderRadius: 30,
            background: CARD_BG,
            border: "3px solid #475569",
            textAlign: "center",
            opacity: 0.65,
          }}
        >
          <div style={{ fontSize: 75 }}>🍿</div>
          <div style={{ color: "#FFF", fontSize: 32, fontWeight: 900, marginTop: 10 }}>
            SMALL
          </div>
          <div style={{ color: "#94A3B8", fontSize: 54, fontWeight: 900 }}>₹100</div>
        </div>

        {/* NEW MEDIUM ₹180 (THE DECOY!) */}
        <div
          style={{
            flex: 1.15,
            padding: "44px 18px",
            borderRadius: 34,
            background: "#2B0C16",
            border: `6px solid ${GOLD}`,
            boxShadow: `0 0 85px ${GOLD}77`,
            textAlign: "center",
            transform: `scale(${interpolate(midSlam, [0, 1], [2.1, 1.06])})`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: GOLD,
              color: "#000",
              padding: "6px 16px",
              borderRadius: 100,
              fontSize: 22,
              fontWeight: 900,
              display: "inline-block",
              marginBottom: 12,
            }}
          >
            🚨 NEW MIDDLE OPTION
          </div>
          <div style={{ fontSize: 105 }}>🍿</div>
          <div style={{ color: "#FFF", fontSize: 38, fontWeight: 900, marginTop: 8 }}>
            MEDIUM
          </div>
          <div
            style={{
              color: GOLD,
              fontSize: 76,
              fontWeight: 900,
              fontFamily: '"Arial Black", sans-serif',
            }}
          >
            ₹180
          </div>
        </div>

        {/* Large ₹200 */}
        <div
          style={{
            flex: 1,
            padding: "36px 16px",
            borderRadius: 30,
            background: CARD_BG,
            border: "3px solid #475569",
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          <div style={{ fontSize: 115 }}>🍿</div>
          <div style={{ color: "#FFF", fontSize: 32, fontWeight: 900, marginTop: 10 }}>
            LARGE
          </div>
          <div style={{ color: "#FFF", fontSize: 54, fontWeight: 900 }}>₹200</div>
        </div>
      </div>
    );
  }

  // CUT 10 (20.3s - 22.3s): BRAIN MATH EQUATION (₹200 - ₹180 = ONLY ₹20!)
  if (cutId === 10) {
    return (
      <div
        style={{
          width: 880,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${PURPLE}`,
          boxShadow: `0 0 85px ${PURPLE}55`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ color: PURPLE, fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>
          🧠 INSTANT BRAIN CALCULATION
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 900,
            color: "#FFFFFF",
            fontFamily: '"Arial Black", sans-serif',
            margin: "24px 0",
          }}
        >
          ₹200 − ₹180 = <span style={{ color: NEON_GREEN }}>SIRF ₹20!</span>
        </div>
        <div
          style={{
            padding: "20px 36px",
            borderRadius: 22,
            background: "rgba(0,255,135,0.15)",
            border: `2px solid ${NEON_GREEN}`,
            color: NEON_GREEN,
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          “Sirf ₹20 extra mein HUGE Bucket?!” 🤯
        </div>
      </div>
    );
  }

  // CUT 11 (22.3s - 25.2s): USER BUYS LARGE ₹200 ("WAHI LE LETA HOON!")
  if (cutId === 11) {
    return (
      <div
        style={{
          width: 880,
          padding: 48,
          borderRadius: 44,
          background: "linear-gradient(155deg, #0D2E22, #071410)",
          border: `6px solid ${NEON_GREEN}`,
          boxShadow: `0 0 95px ${NEON_GREEN}66`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 135 }}>🍿🤑✨</div>
        <div
          style={{
            fontSize: 74,
            fontWeight: 900,
            color: NEON_GREEN,
            fontFamily: '"Arial Black", sans-serif',
            marginTop: 10,
          }}
        >
          LARGE ₹200 SOLD! 🔔
        </div>
        <div
          style={{
            marginTop: 22,
            padding: "18px 34px",
            borderRadius: 20,
            background: "#06120D",
            border: `2px solid ${GOLD}`,
            color: GOLD,
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          Aap aaye the ₹100 kharch karne ➔ De aaye ₹200! 😂
        </div>
      </div>
    );
  }

  // CUT 12 (25.2s - 27.5s): MEDIUM ₹180 STAMPED "NOT MEANT TO SELL!"
  if (cutId === 12) {
    const stampScale = spring({
      frame: Math.max(0, localFrame - 10),
      fps,
      config: { damping: 8, stiffness: 250 },
    });

    return (
      <div
        style={{
          width: 780,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: "4px solid #475569",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ fontSize: 115, opacity: 0.45 }}>🍿</div>
        <div style={{ color: "#94A3B8", fontSize: 48, fontWeight: 900 }}>
          MEDIUM • ₹180
        </div>

        {/* Giant Angled Red Stamp */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(-12deg) scale(${interpolate(
              stampScale,
              [0, 1],
              [2.4, 1]
            )})`,
            padding: "22px 48px",
            borderRadius: 20,
            background: "rgba(255, 42, 84, 0.95)",
            border: "6px solid #FFFFFF",
            color: "#FFFFFF",
            fontSize: 52,
            fontWeight: 900,
            fontFamily: '"Arial Black", sans-serif',
            whiteSpace: "nowrap",
            boxShadow: `0 0 70px ${CRIMSON}`,
          }}
        >
          0% SALES TARGET ❌
        </div>
      </div>
    );
  }

  // CUT 13 (27.5s - 29.6s): FISHING HOOK BAIT X-RAY ("YE BAS EK DECOY THA")
  if (cutId === 13) {
    const sway = Math.sin(localFrame * 0.12) * 14;
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${GOLD}`,
          boxShadow: `0 0 85px ${GOLD}55`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 135,
            transform: `translateX(${sway}px)`,
          }}
        >
          🪝🍿
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 900,
            color: GOLD,
            fontFamily: '"Arial Black", sans-serif',
            marginTop: 14,
          }}
        >
          100% MARKETING BAIT!
        </div>
        <div style={{ color: "#FFF", fontSize: 32, fontWeight: 800, marginTop: 12 }}>
          Medium ka kaam sirf <span style={{ color: NEON_GREEN }}>Large bikwana tha!</span>
        </div>
      </div>
    );
  }

  // CUT 14 (29.6s - 32.2s): PUPPET STRINGS CONTROLLING BRAIN DECISION
  if (cutId === 14) {
    const tilt = Math.sin(localFrame * 0.14) * 10;
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${CYAN}`,
          boxShadow: `0 0 90px ${CYAN}55`,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 80, marginBottom: -15 }}>
          <div style={{ width: 5, height: 95, background: CYAN }} />
          <div style={{ width: 5, height: 95, background: CYAN }} />
        </div>
        <div
          style={{
            fontSize: 130,
            transform: `rotate(${tilt}deg)`,
            display: "inline-block",
          }}
        >
          🧠🎮
        </div>
        <div
          style={{
            marginTop: 24,
            padding: "20px 38px",
            borderRadius: 22,
            background: CYAN,
            color: "#041016",
            fontSize: 46,
            fontWeight: 900,
            fontFamily: '"Arial Black", sans-serif',
          }}
        >
          DECISION REMOTE-CONTROLLED!
        </div>
      </div>
    );
  }

  // CUT 15 (32.2s - 35.0s): ANTI-SCAM SHIELD BLOCKING FAKE OFFERS
  if (cutId === 15) {
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${NEON_GREEN}`,
          boxShadow: `0 0 85px ${NEON_GREEN}55`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 115 }}>🛡️👁️⚡</div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 900,
            color: NEON_GREEN,
            fontFamily: '"Arial Black", sans-serif',
            marginTop: 14,
          }}
        >
          DECOY RADAR: ON!
        </div>
        <div style={{ color: "#FFF", fontSize: 32, fontWeight: 800, marginTop: 14 }}>
          Shopping karte waqt <span style={{ color: GOLD }}>Middle Price Trap</span> pehchano!
        </div>
      </div>
    );
  }

  // CUT 16 (35.0s - 37.5s): GIANT "SALE 50% OFF" MAGNET PULLING FRIEND
  if (cutId === 16) {
    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${PURPLE}`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 120 }}>🧲🛍️🏃‍♂️</div>
        <div
          style={{
            marginTop: 20,
            padding: "18px 36px",
            borderRadius: 20,
            background: CRIMSON,
            color: "#FFF",
            fontSize: 44,
            fontWeight: 900,
            display: "inline-block",
          }}
        >
          “BUY 2 GET 1 FREE!” 🏷️
        </div>
      </div>
    );
  }

  // CUT 17 (37.5s - 40.0s): #1 BEWAKOOF FRIEND AWARD TROPHY
  if (cutId === 17) {
    return (
      <div
        style={{
          width: 860,
          padding: 50,
          borderRadius: 44,
          background: CARD_BG,
          border: `6px solid ${GOLD}`,
          boxShadow: `0 0 90px ${GOLD}66`,
          textAlign: "center",
          transform: `scale(${0.85 + pop * 0.15})`,
        }}
      >
        <div style={{ fontSize: 125 }}>🤡🏆</div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 900,
            color: GOLD,
            fontFamily: '"Arial Black", sans-serif',
            marginTop: 14,
          }}
        >
          #1 OFFER VICTIM AWARD
        </div>
        <div style={{ color: "#FFF", fontSize: 32, fontWeight: 800, marginTop: 12 }}>
          Har “Fake Sale” mein sabse pehle phasta hai! 😂
        </div>
      </div>
    );
  }

  // CUT 18 (40.0s - 43.0s): INTERACTIVE COMMENT TAG BOX
  return (
    <div
      style={{
        width: 880,
        padding: 52,
        borderRadius: 44,
        background: CARD_BG,
        border: `6px solid ${CYAN}`,
        boxShadow: `0 0 95px ${CYAN}66`,
        textAlign: "center",
        transform: `scale(${0.92 + Math.sin(localFrame * 0.18) * 0.04})`,
      }}
    >
      <div style={{ color: GOLD, fontSize: 34, fontWeight: 900, letterSpacing: 4 }}>
        💬 COMMENT MEIN USE JALDI TAG KARO:
      </div>
      <div
        style={{
          marginTop: 28,
          padding: "32px 36px",
          borderRadius: 26,
          background: "#070A12",
          border: `4px solid ${NEON_GREEN}`,
          color: "#FFFFFF",
          fontSize: 46,
          fontWeight: 900,
        }}
      >
        @tag_your_bewakoof_friend 😂👇
      </div>
    </div>
  );
};

/* =========================================================================
   05. MASTER REEL ORCHESTRATOR
   ========================================================================= */

const DecoyRapidReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeCut =
    RAPID_CUTS.find((c) => sec >= c.startSec && sec < c.endSec) ??
    RAPID_CUTS[RAPID_CUTS.length - 1];

  const cutStartFrame = Math.round(activeCut.startSec * FPS);
  const localFrame = Math.max(0, frame - cutStartFrame);

  const titleSlam = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, stiffness: 225, mass: 0.65 },
  });

  const shakeEnv = activeCut.shake
    ? interpolate(localFrame, [0, 5, 18], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const shakeX = Math.sin(localFrame * 2.9) * shakeEnv * 18;
  const shakeY = Math.cos(localFrame * 3.6) * shakeEnv * 18;

  const progress = interpolate(frame, [0, DURATION], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <CyberAtmosphere accent={activeCut.accent} frame={frame} />

      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {/* TOP 18-SEGMENT MICRO-CUT PROGRESS BAR */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 45,
            right: 45,
            display: "flex",
            gap: 5,
            height: 6,
          }}
        >
          {RAPID_CUTS.map((c) => {
            const fill =
              sec >= c.endSec
                ? 1
                : sec <= c.startSec
                  ? 0
                  : (sec - c.startSec) / (c.endSec - c.startSec);
            return (
              <div
                key={c.id}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.16)",
                  borderRadius: 4,
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

        {/* TELEMETRY HEADER */}
        <div
          style={{
            position: "absolute",
            top: 74,
            left: 60,
            right: 60,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "10px 26px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.08)",
              border: `2px solid ${activeCut.accent}`,
              color: activeCut.accent,
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 3.5,
            }}
          >
            {activeCut.badge}
          </div>
          <div
            style={{
              color: "#94A3B8",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 3,
            }}
          >
            CUT {String(activeCut.id).padStart(2, "0")} / 18
          </div>
        </div>

        {/* SLAMMING HINGLISH HEADLINE */}
        <div
          style={{
            position: "absolute",
            top: 175,
            left: 45,
            right: 45,
            textAlign: "center",
            transform: `scale(${interpolate(titleSlam, [0, 1], [1.9, 1])})`,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#E2E8F0",
              letterSpacing: 3,
            }}
          >
            {activeCut.titleTop}
          </div>
          <div
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 70,
              fontWeight: 900,
              lineHeight: 1.05,
              color: activeCut.accent,
              marginTop: 8,
              textShadow: `0 0 45px ${activeCut.accent}88, 0 12px 30px rgba(0,0,0,0.95)`,
            }}
          >
            {activeCut.titleMain}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 22,
              fontWeight: 800,
              color: "#94A3B8",
              letterSpacing: 5,
            }}
          >
            {activeCut.subTag}
          </div>
        </div>

        {/* CENTER INTERACTIVE WIDGET STAGE */}
        <div
          style={{
            position: "absolute",
            top: 480,
            left: 0,
            right: 0,
            bottom: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MicroSceneWidget
            cutId={activeCut.id}
            localFrame={localFrame}
            accent={activeCut.accent}
          />
        </div>
      </AbsoluteFill>

      {/* BOTTOM MASTER PROGRESS BAR */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 10,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${CYAN}, ${NEON_GREEN}, ${GOLD})`,
          boxShadow: `0 0 25px ${CYAN}`,
        }}
      />

      {/* ===================================================================
          SECOND-BY-SECOND PROCEDURAL SFX TIMELINE
         =================================================================== */}
      {/* Transition Whoosh on every ~2.2s cut */}
      {RAPID_CUTS.map((c) => (
        <Sequence
          key={`whoosh-${c.id}`}
          from={Math.round(c.startSec * FPS)}
          durationInFrames={18}
          layout="none"
        >
          <Audio src={SFX.whoosh} volume={0.45} />
        </Sequence>
      ))}

      {/* Cut 2 (2.2s): Wallet Drain Glitch Slam */}
      <Sequence from={Math.round(2.2 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.glitchSlam} volume={0.85} />
      </Sequence>

      {/* Cut 4 (6.2s): "The Decoy Effect" Radar Ping */}
      <Sequence from={Math.round(6.2 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.radarPing} volume={0.8} />
      </Sequence>

      {/* Cut 7 (12.8s): Small ₹100 Selection Ding */}
      <Sequence from={Math.round(12.8 * FPS)} durationInFrames={25} layout="none">
        <Audio src={SFX.ding} volume={0.8} />
      </Sequence>

      {/* Cut 8 (15.2s): Mind Game Glitch Slam */}
      <Sequence from={Math.round(15.2 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.glitchSlam} volume={0.8} />
      </Sequence>

      {/* Cut 9 (17.7s): Medium ₹180 Slam Buzzer */}
      <Sequence from={Math.round(17.7 * FPS)} durationInFrames={28} layout="none">
        <Audio src={SFX.buzzer} volume={0.75} />
      </Sequence>

      {/* Cut 11 (22.4s): Buying Large ₹200 Cash Register KA-CHING! */}
      <Sequence from={Math.round(22.4 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.kaching} volume={0.9} />
      </Sequence>

      {/* Cut 12 (25.4s): "Bechna hi nahi tha" Stamp Slam */}
      <Sequence from={Math.round(25.4 * FPS)} durationInFrames={28} layout="none">
        <Audio src={SFX.stampSlam} volume={0.85} />
      </Sequence>

      {/* Cut 14 (29.6s): Decision Hijacked Glitch + Cut 18 Pop */}
      <Sequence from={Math.round(29.6 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.glitchSlam} volume={0.8} />
      </Sequence>
      <Sequence from={Math.round(40.1 * FPS)} durationInFrames={20} layout="none">
        <Audio src={SFX.pop} volume={0.85} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={DecoyRapidReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
