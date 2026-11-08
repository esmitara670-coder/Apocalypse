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
   THE DECOY EFFECT — SATISFYING ASMR SFX & 6 VARIED TEXT ANIMATIONS EDITION
   1080 x 1920 | 60 FPS | 43.0 Seconds (2580 Frames)
   - 6 Distinct Text Animation Styles (No repetitive text slams!)
   - 8 Tactile ASMR Procedural Sounds (Marimba Pop, Mech Thock, Crystal Plink,
     Velvet Swipe, Card Flutter, Warm Sub-Bass, Harmonic Kaching, Bubble Pop)
   Zero External Assets Required.
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
   01. SATISFYING TACTILE / ASMR PROCEDURAL AUDIO ENGINE
   ========================================================================= */

type SfxKind =
  | "marimbaPop"
  | "mechThock"
  | "velvetSwipe"
  | "cardFlutter"
  | "crystalPlink"
  | "harmonicKaching"
  | "warmSub"
  | "bubblePop";

function buildSatisfyingSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations: Record<SfxKind, number> = {
    marimbaPop: 0.22,
    mechThock: 0.14,
    velvetSwipe: 0.28,
    cardFlutter: 0.24,
    crystalPlink: 0.38,
    harmonicKaching: 0.6,
    warmSub: 0.48,
    bubblePop: 0.16,
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

    if (kind === "marimbaPop") {
      // Warm woody marimba/kalimba tone with gentle pitch bend
      const f = 440 + Math.sin(p * Math.PI * 0.5) * 140;
      w =
        Math.sin(2 * Math.PI * f * t) * 0.75 +
        Math.sin(2 * Math.PI * (f * 2) * t) * 0.25;
      env = Math.sin(Math.PI * Math.min(1, p * 8)) * Math.exp(-p * 9);
    } else if (kind === "mechThock") {
      // Satisfying mechanical keyboard "thock" (low body + crisp tap)
      const bodyF = 190 * Math.exp(-p * 12) + 65;
      const tap = Math.sin(2 * Math.PI * 1650 * t) * Math.exp(-p * 28);
      w = Math.sin(2 * Math.PI * bodyF * t) * 0.8 + tap * 0.35;
      env = Math.exp(-p * 14);
    } else if (kind === "velvetSwipe") {
      // Smooth harmonic filter glide (no harsh static noise)
      const glideF = 240 + Math.sin(p * Math.PI) * 340;
      w =
        Math.sin(2 * Math.PI * glideF * t) * 0.65 +
        Math.sin(2 * Math.PI * (glideF * 1.5) * t) * 0.3;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (kind === "cardFlutter") {
      // Crisp double-tap card flip sound
      const f = p < 0.45 ? 380 : 520;
      const localP = p < 0.45 ? p / 0.45 : (p - 0.45) / 0.55;
      w = Math.sin(2 * Math.PI * f * t) * 0.75;
      env = Math.exp(-localP * 11);
    } else if (kind === "crystalPlink") {
      // Pure water-drop / glass harmonic bell
      w =
        Math.sin(2 * Math.PI * 987.77 * t) * 0.6 +
        Math.sin(2 * Math.PI * 1975.5 * t) * 0.3 +
        Math.sin(2 * Math.PI * 2963.3 * t) * 0.1;
      env = Math.exp(-p * 7.5);
    } else if (kind === "harmonicKaching") {
      // Lush Major-9th arpeggio shimmer (C6 -> E6 -> G6 -> B6 -> D7)
      const notes = [1046.5, 1318.5, 1568.0, 1975.5, 2349.3];
      const idx = Math.min(notes.length - 1, Math.floor(p * notes.length));
      const noteF = notes[idx];
      const subP = (p * notes.length) % 1;
      w =
        Math.sin(2 * Math.PI * noteF * t) * 0.6 +
        Math.sin(2 * Math.PI * (noteF * 2) * t) * 0.25;
      env = Math.exp(-subP * 5.5) * (1 - p * 0.3);
    } else if (kind === "warmSub") {
      // Deep, round cinematic 808 sub-bass drop
      const subF = 115 * Math.pow(1 - p * 0.65, 1.4) + 36;
      w =
        Math.sin(2 * Math.PI * subF * t) * 0.85 +
        Math.sin(2 * Math.PI * (subF * 2) * t) * 0.2;
      env = Math.pow(1 - p, 1.6);
    } else if (kind === "bubblePop") {
      // Classic satisfying mouth/water bubble pop (upward pitch sweep)
      const f = 280 + Math.pow(p, 1.6) * 680;
      w = Math.sin(2 * Math.PI * f * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 0.8);
    }

    const out = clamp(w * env * 0.72, -1, 1);
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
  marimbaPop: buildSatisfyingSfx("marimbaPop"),
  mechThock: buildSatisfyingSfx("mechThock"),
  velvetSwipe: buildSatisfyingSfx("velvetSwipe"),
  cardFlutter: buildSatisfyingSfx("cardFlutter"),
  crystalPlink: buildSatisfyingSfx("crystalPlink"),
  harmonicKaching: buildSatisfyingSfx("harmonicKaching"),
  warmSub: buildSatisfyingSfx("warmSub"),
  bubblePop: buildSatisfyingSfx("bubblePop"),
};

/* =========================================================================
   02. 18 CUTS WITH 6 DISTINCT TEXT ANIMATION STYLES & VARIED SFX
   ========================================================================= */

type TextAnimStyle =
  | "wordStagger"
  | "highlighter"
  | "typewriter"
  | "flip3D"
  | "slideSplit"
  | "letterSnap";

type CutSpec = {
  id: number;
  startSec: number;
  endSec: number;
  badge: string;
  titleTop: string;
  titleMain: string;
  subTag: string;
  accent: string;
  textStyle: TextAnimStyle;
  sfx: SfxKind;
  extraSfx?: { offsetSec: number; kind: SfxKind };
};

const RAPID_CUTS: CutSpec[] = [
  // 1 (0.0s - 2.2s)
  {
    id: 1,
    startSec: 0.0,
    endSec: 2.2,
    badge: "HOOK // 01",
    titleTop: "CHALO AAJ DEKHTE HAIN...",
    titleMain: "COMPANIES KAISE LETI HAIN?! 👀",
    subTag: "WAIT FOR IT...",
    accent: GOLD,
    textStyle: "wordStagger",
    sfx: "marimbaPop",
    extraSfx: { offsetSec: 0.25, kind: "bubblePop" },
  },
  // 2 (2.2s - 4.3s)
  {
    id: 2,
    startSec: 2.2,
    endSec: 4.3,
    badge: "POCKET DRAIN // 02",
    titleTop: "MERA MATLAB HAI...",
    titleMain: "JEB KAISE KHAALI KARTI HAIN! 💸",
    subTag: "WALLET BALANCE: ₹0",
    accent: CRIMSON,
    textStyle: "highlighter",
    sfx: "velvetSwipe",
    extraSfx: { offsetSec: 0.35, kind: "warmSub" },
  },
  // 3 (4.3s - 6.2s)
  {
    id: 3,
    startSec: 4.3,
    endSec: 6.2,
    badge: "SECRET FILE // 03",
    titleTop: "ISE DARK PSYCHOLOGY MEIN",
    titleMain: "KYA KEHTE HAIN? 🕵️‍♂️",
    subTag: "CLASSIFIED MARKETING TRICK",
    accent: PURPLE,
    textStyle: "typewriter",
    sfx: "mechThock",
    extraSfx: { offsetSec: 0.18, kind: "mechThock" },
  },
  // 4 (6.2s - 8.2s)
  {
    id: 4,
    startSec: 6.2,
    endSec: 8.2,
    badge: "THE TRAP // 04",
    titleTop: "THE ILLUSION OF CHOICE:",
    titleMain: "THE DECOY EFFECT! 🎯",
    subTag: "BRAIN MANIPULATION FORMULA",
    accent: CYAN,
    textStyle: "letterSnap",
    sfx: "crystalPlink",
    extraSfx: { offsetSec: 0.25, kind: "warmSub" },
  },
  // 5 (8.2s - 10.2s)
  {
    id: 5,
    startSec: 8.2,
    endSec: 10.2,
    badge: "SCENARIO // 05",
    titleTop: "MAAN LO AAP GAYE",
    titleMain: "MOVIE DEKHNE! 🎬",
    subTag: "CINEMA SNACK COUNTER",
    accent: GOLD,
    textStyle: "flip3D",
    sfx: "cardFlutter",
  },
  // 6 (10.2s - 12.6s)
  {
    id: 6,
    startSec: 10.2,
    endSec: 12.6,
    badge: "MENU BOARD // 06",
    titleTop: "SAMNE SIRF 2 OPTIONS HAIN:",
    titleMain: "SMALL ₹100 vs LARGE ₹200 🍿",
    subTag: "2X PRICE DIFFERENCE",
    accent: CYAN,
    textStyle: "slideSplit",
    sfx: "velvetSwipe",
    extraSfx: { offsetSec: 0.3, kind: "crystalPlink" },
  },
  // 7 (12.6s - 15.2s)
  {
    id: 7,
    startSec: 12.6,
    endSec: 15.2,
    badge: "SMART MOVE // 07",
    titleTop: "PAISE BACHANE KE LIYE",
    titleMain: "AAP SMALL HI LOGE, RIGHT? ✅",
    subTag: "LOGICAL BRAIN SAVES ₹100",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    sfx: "bubblePop",
    extraSfx: { offsetSec: 0.4, kind: "crystalPlink" },
  },
  // 8 (15.2s - 17.5s)
  {
    id: 8,
    startSec: 15.2,
    endSec: 17.5,
    badge: "TRAP ACTIVATED // 08",
    titleTop: "LEKIN AB COMPANIES KHELTI HAIN",
    titleMain: "DIRTY MIND GAME! 🧠⚡",
    subTag: "PSYCHOLOGICAL OVERRIDE",
    accent: CRIMSON,
    textStyle: "wordStagger",
    sfx: "warmSub",
    extraSfx: { offsetSec: 0.22, kind: "marimbaPop" },
  },
  // 9 (17.5s - 20.3s)
  {
    id: 9,
    startSec: 17.5,
    endSec: 20.3,
    badge: "THE BAIT // 09",
    titleTop: "BEECH MEIN RAKH DETI HAIN:",
    titleMain: "MEDIUM POPCORN @ ₹180! 🚨",
    subTag: "3-OPTION MENU TRAP",
    accent: GOLD,
    textStyle: "flip3D",
    sfx: "cardFlutter",
    extraSfx: { offsetSec: 0.3, kind: "bubblePop" },
  },
  // 10 (20.3s - 22.3s)
  {
    id: 10,
    startSec: 20.3,
    endSec: 22.3,
    badge: "BRAIN GLITCH // 10",
    titleTop: "AB AAPKA DIMAAG",
    titleMain: "TURANT COMPARE KAREGA: 🤯",
    subTag: "₹180 vs ₹200 = SIRF ₹20!",
    accent: PURPLE,
    textStyle: "typewriter",
    sfx: "mechThock",
    extraSfx: { offsetSec: 0.2, kind: "crystalPlink" },
  },
  // 11 (22.3s - 25.2s)
  {
    id: 11,
    startSec: 22.3,
    endSec: 25.2,
    badge: "GOTCHA! // 11",
    titleTop: "SIRF ₹20 AUR DEKAR",
    titleMain: "LARGE HI LE LETA HOON! 🤑",
    subTag: "YOU SPENT ₹200 INSTEAD OF ₹100!",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    sfx: "harmonicKaching",
  },
  // 12 (25.2s - 27.5s)
  {
    id: 12,
    startSec: 25.2,
    endSec: 27.5,
    badge: "DARK TRUTH // 12",
    titleTop: "YE MEDIUM POPCORN UNHE",
    titleMain: "BECHNA HI NAHI THA! ❌",
    subTag: "DUMMY PRODUCT EXPOSED",
    accent: CRIMSON,
    textStyle: "slideSplit",
    sfx: "velvetSwipe",
    extraSfx: { offsetSec: 0.35, kind: "warmSub" },
  },
  // 13 (27.5s - 29.6s)
  {
    id: 13,
    startSec: 27.5,
    endSec: 29.6,
    badge: "PURE BAIT // 13",
    titleTop: "YE BAS EK",
    titleMain: "FAKE DECOY THA! 🪝",
    subTag: "DESIGNED TO MAKE ₹200 LOOK CHEAP",
    accent: GOLD,
    textStyle: "letterSnap",
    sfx: "crystalPlink",
  },
  // 14 (29.6s - 32.2s)
  {
    id: 14,
    startSec: 29.6,
    endSec: 32.2,
    badge: "MIND CONTROL // 14",
    titleTop: "AAPKE DIMAAG KE DECISION KO",
    titleMain: "CONTROL KARNE KE LIYE! 🎮",
    subTag: "PUPPET MASTER MARKETING",
    accent: CYAN,
    textStyle: "wordStagger",
    sfx: "marimbaPop",
    extraSfx: { offsetSec: 0.25, kind: "bubblePop" },
  },
  // 15 (32.2s - 35.0s)
  {
    id: 15,
    startSec: 32.2,
    endSec: 35.0,
    badge: "STAY AWARE // 15",
    titleTop: "AGLI BAAR SHOPPING MEIN",
    titleMain: "DIMAAG KHULA RAKHNA! 🛡️",
    subTag: "ANTI-DECOY RADAR ON",
    accent: NEON_GREEN,
    textStyle: "flip3D",
    sfx: "cardFlutter",
    extraSfx: { offsetSec: 0.3, kind: "crystalPlink" },
  },
  // 16 (35.0s - 37.5s)
  {
    id: 16,
    startSec: 35.0,
    endSec: 37.5,
    badge: "SALE MAGNET // 16",
    titleTop: "KAUN SA DOST OFFERS DEKHTE HI",
    titleMain: "PAGAL HO JATA HAI? 🛍️",
    subTag: "BUY 1 GET 1 TRAP VICTIM",
    accent: PURPLE,
    textStyle: "slideSplit",
    sfx: "velvetSwipe",
  },
  // 17 (37.5s - 40.0s)
  {
    id: 17,
    startSec: 37.5,
    endSec: 40.0,
    badge: "AWARD GOES TO // 17",
    titleTop: "OFFERS KE CHAKKAR MEIN",
    titleMain: "SABSE BADA BEWAKOOF! 🤡🏆",
    subTag: "#1 MARKETING VICTIM",
    accent: GOLD,
    textStyle: "highlighter",
    sfx: "bubblePop",
    extraSfx: { offsetSec: 0.3, kind: "harmonicKaching" },
  },
  // 18 (40.0s - 43.0s)
  {
    id: 18,
    startSec: 40.0,
    endSec: 43.0,
    badge: "YOUR TURN // 18",
    titleTop: "COMMENT MEIN USE",
    titleMain: "JALDI TAG KARO! 👇",
    subTag: "EXPOSE THAT FRIEND BELOW",
    accent: CYAN,
    textStyle: "wordStagger",
    sfx: "marimbaPop",
    extraSfx: { offsetSec: 0.25, kind: "crystalPlink" },
  },
];

/* =========================================================================
   03. 6 DISTINCT SATISFYING TEXT ANIMATION RENDERERS
   ========================================================================= */

const SatisfyingHeadline: React.FC<{
  cut: CutSpec;
  localFrame: number;
}> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();

  // STYLE 1: WORD-BY-WORD ELASTIC MASK RISE
  if (cut.textStyle === "wordStagger") {
    const words = cut.titleMain.split(" ");
    const topSpring = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 160 },
    });

    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: "#CBD5E1",
            letterSpacing: 4,
            opacity: topSpring,
            transform: `translateY(${(1 - topSpring) * 20}px)`,
            marginBottom: 10,
          }}
        >
          {cut.titleTop}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px 18px",
          }}
        >
          {words.map((word, idx) => {
            const wSpring = spring({
              frame: Math.max(0, localFrame - idx * 4),
              fps,
              config: { damping: 11, stiffness: 190, mass: 0.7 },
            });
            return (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  paddingBottom: 6,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: '"Arial Black", Impact, sans-serif',
                    fontSize: 68,
                    fontWeight: 900,
                    lineHeight: 1.05,
                    color: idx === words.length - 1 ? cut.accent : "#FFFFFF",
                    transform: `translateY(${(1 - wSpring) * 85}px) rotate(${
                      (1 - wSpring) * 6
                    }deg)`,
                    textShadow: `0 10px 25px rgba(0,0,0,0.85)`,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // STYLE 2: GLOWING HIGHLIGHTER MARKER SWEEP
  if (cut.textStyle === "highlighter") {
    const fade = interpolate(localFrame, [0, 12], [0, 1], {
      extrapolateRight: "clamp",
    });
    const sweepPct = interpolate(localFrame, [6, 30], [0, 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return (
      <div style={{ textAlign: "center", opacity: fade }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: "#E2E8F0",
            letterSpacing: 3,
            marginBottom: 14,
          }}
        >
          {cut.titleTop}
        </div>

        <div
          style={{
            position: "relative",
            display: "inline-block",
            padding: "10px 28px",
          }}
        >
          {/* Animated Marker Bar Sweeping Behind Text */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 4,
              bottom: 4,
              width: `${sweepPct}%`,
              background: cut.accent,
              borderRadius: 18,
              boxShadow: `0 0 45px ${cut.accent}99`,
              zIndex: 0,
            }}
          />
          <span
            style={{
              position: "relative",
              zIndex: 1,
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 64,
              fontWeight: 900,
              color: sweepPct > 50 ? "#05070E" : "#FFFFFF",
            }}
          >
            {cut.titleMain}
          </span>
        </div>
      </div>
    );
  }

  // STYLE 3: MECHANICAL TYPEWRITER REVEAL WITH CURSOR
  if (cut.textStyle === "typewriter") {
    const totalChars = cut.titleMain.length;
    const visibleChars = Math.min(
      totalChars,
      Math.floor(
        interpolate(localFrame, [2, 28], [0, totalChars], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      )
    );
    const typedText = cut.titleMain.slice(0, visibleChars);
    const showCursor = localFrame % 12 < 7;

    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: cut.accent,
            letterSpacing: 5,
            fontFamily: "monospace",
            marginBottom: 10,
          }}
        >
          {"> "}
          {cut.titleTop}
        </div>

        <div
          style={{
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 66,
            fontWeight: 900,
            color: "#FFFFFF",
            textShadow: `0 0 35px ${cut.accent}77`,
          }}
        >
          {typedText}
          {showCursor && (
            <span style={{ color: cut.accent, marginLeft: 6 }}>▋</span>
          )}
        </div>
      </div>
    );
  }

  // STYLE 4: 3D SPLIT-FLAP PERSPECTIVE FLIP
  if (cut.textStyle === "flip3D") {
    const flip1 = spring({
      frame: localFrame,
      fps,
      config: { damping: 12, stiffness: 150 },
    });
    const flip2 = spring({
      frame: Math.max(0, localFrame - 7),
      fps,
      config: { damping: 11, stiffness: 165 },
    });

    return (
      <div
        style={{
          textAlign: "center",
          perspective: 900,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: "#E2E8F0",
            letterSpacing: 3,
            transformOrigin: "50% 0%",
            transform: `rotateX(${(1 - flip1) * -88}deg)`,
            opacity: flip1,
          }}
        >
          {cut.titleTop}
        </div>

        <div
          style={{
            marginTop: 10,
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 68,
            fontWeight: 900,
            color: cut.accent,
            transformOrigin: "50% 0%",
            transform: `rotateX(${(1 - flip2) * 88}deg)`,
            opacity: flip2,
            textShadow: `0 0 40px ${cut.accent}88`,
          }}
        >
          {cut.titleMain}
        </div>
      </div>
    );
  }

  // STYLE 5: OPPOSITE HORIZONTAL SPLIT-SLIDE
  if (cut.textStyle === "slideSplit") {
    const slideProgress = spring({
      frame: localFrame,
      fps,
      config: { damping: 14, stiffness: 170 },
    });

    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: "#E2E8F0",
            letterSpacing: 3,
            transform: `translateX(${(1 - slideProgress) * -180}px)`,
            opacity: slideProgress,
          }}
        >
          {cut.titleTop}
        </div>

        <div
          style={{
            marginTop: 10,
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 66,
            fontWeight: 900,
            color: cut.accent,
            transform: `translateX(${(1 - slideProgress) * 180}px)`,
            opacity: slideProgress,
            textShadow: `0 0 40px ${cut.accent}77`,
          }}
        >
          {cut.titleMain}
        </div>
      </div>
    );
  }

  // STYLE 6: MAGNETIC LETTER-SPACING SNAP ("letterSnap")
  const snap = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, stiffness: 175 },
  });
  const spacing = interpolate(snap, [0, 1], [26, 0]);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          color: "#CBD5E1",
          letterSpacing: 4,
          opacity: snap,
        }}
      >
        {cut.titleTop}
      </div>

      <div
        style={{
          marginTop: 10,
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: 70,
          fontWeight: 900,
          color: cut.accent,
          letterSpacing: `${spacing}px`,
          transform: `scale(${0.9 + snap * 0.1})`,
          opacity: snap,
          textShadow: `0 0 45px ${cut.accent}99`,
        }}
      >
        {cut.titleMain}
      </div>
    </div>
  );
};

/* =========================================================================
   04. CYBERNETIC BACKGROUND GRID & FLOATING PARTICLES
   ========================================================================= */

const CyberAtmosphere: React.FC<{ accent: string; frame: number }> = ({
  accent,
  frame,
}) => {
  const shift = (frame * 1.4) % 90;
  const particles = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
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
          background: `radial-gradient(circle at 50% 54%, ${accent}25 0%, rgba(6,10,20,0.92) 58%, ${DARK_BG} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.14,
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
              opacity: 0.22 + (i % 4) * 0.12,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* =========================================================================
   05. 18 MICRO-SCENE VISUAL WIDGETS (SMOOTH SPRING MOTION)
   ========================================================================= */

const MicroSceneWidget: React.FC<{
  cutId: number;
  localFrame: number;
  accent: string;
}> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, stiffness: 165 },
  });

  // CUT 1: CORPORATE EYE SCANNER
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
          transform: `translateY(${(1 - pop) * 45}px) scale(${0.9 + pop * 0.1})`,
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
              transform={`rotate(${localFrame * 1.8})`}
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
        <div style={{ fontSize: 40, fontWeight: 900, color: "#FFFFFF", letterSpacing: 3 }}>
          🏢 BIG BRANDS vs <span style={{ color: GOLD }}>YOUR BRAIN 🧠</span>
        </div>
      </div>
    );
  }

  // CUT 2: WALLET DRAINING ₹2,500 -> ₹0
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
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div style={{ fontSize: 105, marginBottom: 10 }}>👛💸💨</div>
        <div style={{ color: "#94A3B8", fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>
          YOUR POCKET BALANCE
        </div>
        <div
          style={{
            fontSize: 124,
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

  // CUT 3: CLASSIFIED DARK PSYCHOLOGY DOSSIER
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
          transform: `translateY(${(1 - pop) * 40}px)`,
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
            fontSize: 52,
            fontWeight: 900,
            color: "#FFFFFF",
            fontFamily: '"Arial Black", sans-serif',
            marginTop: 14,
          }}
        >
          DARK PSYCHOLOGY SECRET
        </div>
      </div>
    );
  }

  // CUT 4: THE DECOY EFFECT EMBLEM
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
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 115 }}>🎯🪤</div>
        <div
          style={{
            fontSize: 74,
            fontWeight: 900,
            color: CYAN,
            fontFamily: '"Arial Black", sans-serif',
            letterSpacing: 2,
            marginTop: 14,
          }}
        >
          THE DECOY EFFECT
        </div>
        <div style={{ color: GOLD, fontSize: 32, fontWeight: 900, letterSpacing: 4, marginTop: 14 }}>
          “FAKE CHOICE = REAL PROFIT”
        </div>
      </div>
    );
  }

  // CUT 5: CINEMA SNACK COUNTER
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
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900, color: GOLD, letterSpacing: 6, marginBottom: 22 }}>
          ✨ CINEMA SNACK COUNTER ✨
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
            <div style={{ color: "#FFF", fontSize: 46, fontWeight: 900 }}>MOVIE NIGHT</div>
            <div style={{ color: CYAN, fontSize: 28, fontWeight: 800, marginTop: 8 }}>
              INTERVAL POPCORN TIME!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CUT 6: SMALL ₹100 VS LARGE ₹200
  if (cutId === 6) {
    return (
      <div style={{ width: 900, display: "flex", gap: 36, transform: `scale(${0.88 + pop * 0.12})` }}>
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
          <div style={{ color: "#FFF", fontSize: 42, fontWeight: 900, marginTop: 18 }}>SMALL</div>
          <div style={{ color: CYAN, fontSize: 80, fontWeight: 900, fontFamily: '"Arial Black", sans-serif' }}>
            ₹100
          </div>
        </div>

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
          <div style={{ color: "#FFF", fontSize: 42, fontWeight: 900, marginTop: 8 }}>LARGE</div>
          <div style={{ color: GOLD, fontSize: 80, fontWeight: 900, fontFamily: '"Arial Black", sans-serif' }}>
            ₹200
          </div>
        </div>
      </div>
    );
  }

  // CUT 7: USER PICKS SMALL ₹100
  if (cutId === 7) {
    return (
      <div style={{ width: 900, display: "flex", gap: 36, transform: `scale(${0.9 + pop * 0.1})` }}>
        <div
          style={{
            flex: 1,
            padding: "44px 28px",
            borderRadius: 38,
            background: "#0B291E",
            border: `6px solid ${NEON_GREEN}`,
            boxShadow: `0 0 75px ${NEON_GREEN}66`,
            textAlign: "center",
            transform: "scale(1.05)",
          }}
        >
          <div style={{ fontSize: 95 }}>🍿</div>
          <div style={{ color: "#FFF", fontSize: 40, fontWeight: 900, marginTop: 14 }}>SMALL • ₹100</div>
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
          <div style={{ color: "#94A3B8", fontSize: 40, fontWeight: 900, marginTop: 14 }}>LARGE • ₹200</div>
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

  // CUT 8: MIND GAME ACTIVATED
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
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 125 }}>♟️🧠⚡</div>
        <div
          style={{
            fontSize: 64,
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

  // CUT 9: MEDIUM ₹180 RISES IN THE MIDDLE
  if (cutId === 9) {
    const midRise = spring({
      frame: Math.max(0, localFrame - 10),
      fps,
      config: { damping: 12, stiffness: 175 },
    });

    return (
      <div style={{ width: 960, display: "flex", gap: 22, alignItems: "center" }}>
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
          <div style={{ color: "#FFF", fontSize: 32, fontWeight: 900, marginTop: 10 }}>SMALL</div>
          <div style={{ color: "#94A3B8", fontSize: 54, fontWeight: 900 }}>₹100</div>
        </div>

        <div
          style={{
            flex: 1.15,
            padding: "44px 18px",
            borderRadius: 34,
            background: "#2B0C16",
            border: `6px solid ${GOLD}`,
            boxShadow: `0 0 85px ${GOLD}77`,
            textAlign: "center",
            transform: `translateY(${(1 - midRise) * 90}px) scale(${0.85 + midRise * 0.2})`,
            opacity: midRise,
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
          <div style={{ color: "#FFF", fontSize: 38, fontWeight: 900, marginTop: 8 }}>MEDIUM</div>
          <div style={{ color: GOLD, fontSize: 74, fontWeight: 900, fontFamily: '"Arial Black", sans-serif' }}>
            ₹180
          </div>
        </div>

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
          <div style={{ color: "#FFF", fontSize: 32, fontWeight: 900, marginTop: 10 }}>LARGE</div>
          <div style={{ color: "#FFF", fontSize: 54, fontWeight: 900 }}>₹200</div>
        </div>
      </div>
    );
  }

  // CUT 10: BRAIN MATH (₹200 - ₹180 = ₹20)
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
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div style={{ color: PURPLE, fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>
          🧠 INSTANT BRAIN CALCULATION
        </div>
        <div
          style={{
            fontSize: 80,
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

  // CUT 11: LARGE ₹200 SOLD
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
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div style={{ fontSize: 135 }}>🍿🤑✨</div>
        <div
          style={{
            fontSize: 72,
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

  // CUT 12: MEDIUM ₹180 STAMPED 0% SALES TARGET
  if (cutId === 12) {
    const stampPop = spring({
      frame: Math.max(0, localFrame - 10),
      fps,
      config: { damping: 11, stiffness: 190 },
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
        <div style={{ color: "#94A3B8", fontSize: 48, fontWeight: 900 }}>MEDIUM • ₹180</div>

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(-10deg) scale(${stampPop})`,
            padding: "22px 48px",
            borderRadius: 20,
            background: "rgba(255, 42, 84, 0.95)",
            border: "6px solid #FFFFFF",
            color: "#FFFFFF",
            fontSize: 50,
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

  // CUT 13: FISHING HOOK BAIT
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
        <div style={{ fontSize: 135, transform: `translateX(${sway}px)` }}>🪝🍿</div>
        <div
          style={{
            fontSize: 66,
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

  // CUT 14: PUPPET STRINGS CONTROLLING BRAIN
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
        <div style={{ fontSize: 130, transform: `rotate(${tilt}deg)`, display: "inline-block" }}>
          🧠🎮
        </div>
        <div
          style={{
            marginTop: 24,
            padding: "20px 38px",
            borderRadius: 22,
            background: CYAN,
            color: "#041016",
            fontSize: 44,
            fontWeight: 900,
            fontFamily: '"Arial Black", sans-serif',
          }}
        >
          DECISION REMOTE-CONTROLLED!
        </div>
      </div>
    );
  }

  // CUT 15: ANTI-DECOY SHIELD
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
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div style={{ fontSize: 115 }}>🛡️👁️⚡</div>
        <div
          style={{
            fontSize: 60,
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

  // CUT 16: SALE MAGNET
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
          transform: `scale(${0.88 + pop * 0.12})`,
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

  // CUT 17: #1 OFFER VICTIM TROPHY
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
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div style={{ fontSize: 125 }}>🤡🏆</div>
        <div
          style={{
            fontSize: 56,
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

  // CUT 18: COMMENT TAG BOX
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
        transform: `scale(${0.92 + Math.sin(localFrame * 0.16) * 0.03})`,
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
   06. MASTER REEL COMPOSITION
   ========================================================================= */

const DecoySatisfyingReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeCut =
    RAPID_CUTS.find((c) => sec >= c.startSec && sec < c.endSec) ??
    RAPID_CUTS[RAPID_CUTS.length - 1];

  const cutStartFrame = Math.round(activeCut.startSec * FPS);
  const localFrame = Math.max(0, frame - cutStartFrame);

  const progress = interpolate(frame, [0, DURATION], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <CyberAtmosphere accent={activeCut.accent} frame={frame} />

      {/* TOP 18-SEGMENT PROGRESS BAR */}
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
          STYLE: {activeCut.textStyle.toUpperCase()} • {String(activeCut.id).padStart(2, "0")}/18
        </div>
      </div>

      {/* VARIED SATISFYING TEXT ANIMATION STAGE */}
      <div
        style={{
          position: "absolute",
          top: 175,
          left: 45,
          right: 45,
        }}
      >
        <SatisfyingHeadline cut={activeCut} localFrame={localFrame} />
        <div
          style={{
            marginTop: 14,
            textAlign: "center",
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
          top: 485,
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
          VARIED SATISFYING ASMR SFX TIMELINE (UNIQUE PER CUT STYLE!)
         =================================================================== */}
      {RAPID_CUTS.map((c) => (
        <React.Fragment key={`sfx-${c.id}`}>
          <Sequence
            from={Math.round(c.startSec * FPS)}
            durationInFrames={35}
            layout="none"
          >
            <Audio src={SFX[c.sfx]} volume={0.78} />
          </Sequence>

          {c.extraSfx && (
            <Sequence
              from={Math.round((c.startSec + c.extraSfx.offsetSec) * FPS)}
              durationInFrames={35}
              layout="none"
            >
              <Audio src={SFX[c.extraSfx.kind]} volume={0.75} />
            </Sequence>
          )}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={DecoySatisfyingReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
