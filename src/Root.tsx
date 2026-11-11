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
   THE FAKE SCARCITY TRAP — STRAIGHT EDITORIAL TYPOGRAPHY & OPTICAL SHADOW
   1080 x 1920 | 60 FPS | 38.0 Seconds (2280 Frames) | 10 Scenes
   - ZERO EMOJIS, ZERO TILTED TEXT (100% Straight Vertical Multi-Font Stack)
   - Safe 920px Max-Width Bounds (Zero Text Overflow / Clipping)
   - Ghost Motion-Blur Shadow + Optical Lens Vignette + Smooth Camera Zoom
   - Pop-In Word Animation (Video 2 Style) + Typing SFX Bursts & Whooshes
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2280; // 38.0 Seconds @ 60 FPS

const NEON_GREEN = "#00FF66";
const CRIMSON = "#E11D48";
const PAPER_BG = "#F4F0E6";
const DARK_BG = "#090D16";
const INK_DARK = "#0F172A";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. PROCEDURAL AUDIO: SCENE WHOOSH, TYPING SFX BURST & CASH KA-CHING
   ========================================================================= */
type SfxType = "whoosh" | "zoomWhoosh" | "typingBurst" | "kaching";

function buildSfx(type: SfxType): string {
  const sampleRate = 22050;
  const durations: Record<SfxType, number> = {
    whoosh: 0.38,
    zoomWhoosh: 0.52,
    typingBurst: 0.48,
    kaching: 0.5,
  };
  const totalSamples = Math.floor(sampleRate * durations[type]);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
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

    if (type === "whoosh") {
      const f = 120 + Math.sin(p * Math.PI) * 260;
      const air = Math.sin(i * 12.9898) * Math.cos(i * 0.35) * 0.25;
      w = Math.sin(2 * Math.PI * f * t) * 0.65 + air;
      env = Math.sin(Math.PI * p) * Math.pow(1 - p * 0.3, 1.3);
    } else if (type === "zoomWhoosh") {
      const f = 90 + Math.sin(p * Math.PI) * 180;
      w = Math.sin(2 * Math.PI * f * t) * 0.75 + Math.sin(2 * Math.PI * (f * 1.5) * t) * 0.25;
      env = Math.sin(Math.PI * p);
    } else if (type === "typingBurst") {
      // 6 rapid mechanical keyboard clacks inside one 0.48s burst
      const step = (p * 6) % 1;
      const bodyF = 230 * Math.exp(-step * 14) + 85;
      const click = Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-step * 30);
      w = Math.sin(2 * Math.PI * bodyF * t) * 0.75 + click * 0.45;
      env = Math.exp(-step * 10);
    } else {
      const f1 = p < 0.18 ? 1480 : 2960;
      const f2 = p < 0.18 ? 2217 : 4435;
      const sp = p < 0.18 ? p / 0.18 : (p - 0.18) / 0.82;
      w = Math.sin(2 * Math.PI * f1 * t) * 0.55 + Math.sin(2 * Math.PI * f2 * t) * 0.35;
      env = Math.exp(-sp * 7.5);
    }

    view.setInt16(44 + i * 2, clamp(w * env * 0.78, -1, 1) * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX: Record<SfxType, string> = {
  whoosh: buildSfx("whoosh"),
  zoomWhoosh: buildSfx("zoomWhoosh"),
  typingBurst: buildSfx("typingBurst"),
  kaching: buildSfx("kaching"),
};

/* =========================================================================
   02. OPTICAL LENS VIGNETTE SHADOW (VIDEO 1 STYLE)
   ========================================================================= */
const OpticalShadowVignette: React.FC<{ frame: number; dark?: boolean }> = ({
  frame,
  dark = false,
}) => {
  const dx = Math.sin(frame * 0.025) * 12;
  const dy = Math.cos(frame * 0.02) * 10;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 40 }}>
      <AbsoluteFill
        style={{
          background: dark
            ? `radial-gradient(circle at ${50 + dx}% ${50 + dy}%, transparent 42%, rgba(0,0,0,0.75) 100%)`
            : `radial-gradient(circle at ${50 + dx}% ${50 + dy}%, transparent 45%, rgba(15,23,42,0.32) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* =========================================================================
   03. STRAIGHT POP-IN WORD BLOCK WITH GHOST SHADOW (VIDEO 1 + 2 HYBRID)
   ========================================================================= */
type FontKind = "serifItalic" | "impact" | "mono" | "sansBold";

const FONT_MAP: Record<FontKind, { family: string; style?: "normal" | "italic"; weight: number }> = {
  serifItalic: { family: "Georgia, 'Times New Roman', serif", style: "italic", weight: 700 },
  impact: { family: "Impact, 'Arial Black', sans-serif", style: "normal", weight: 900 },
  mono: { family: "'Courier New', monospace", style: "normal", weight: 800 },
  sansBold: { family: "'Arial Black', sans-serif", style: "normal", weight: 900 },
};

const ShadowPopLine: React.FC<{
  text: string;
  localFrame: number;
  appearFrame: number;
  font: FontKind;
  size: number;
  color: string;
  boxBg?: string;
  letterSpacing?: number;
}> = ({
  text,
  localFrame,
  appearFrame,
  font,
  size,
  color,
  boxBg,
  letterSpacing = 1,
}) => {
  const { fps } = useVideoConfig();
  const rel = localFrame - appearFrame;
  if (rel < 0) return null;

  const pop = spring({
    frame: rel,
    fps,
    config: { damping: 13, stiffness: 175, mass: 0.8 },
  });

  const scale = interpolate(pop, [0, 1], [1.32, 1]);
  const yOff = interpolate(pop, [0, 1], [34, 0]);
  const ghostY = interpolate(pop, [0, 1], [38, 0]);
  const ghostBlur = interpolate(pop, [0, 1], [22, 0]);
  const ghostAlpha = interpolate(pop, [0, 0.7, 1], [0.6, 0.3, 0.14]);

  const fSpec = FONT_MAP[font];

  return (
    <div
      style={{
        position: "relative",
        maxWidth: 920,
        textAlign: "center",
        transform: `translateY(${yOff}px) scale(${scale})`,
        opacity: clamp(rel / 6, 0, 1),
      }}
    >
      {/* Ghost Motion-Blur Shadow Layer */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ghostY,
          fontFamily: fSpec.family,
          fontStyle: fSpec.style,
          fontWeight: fSpec.weight,
          fontSize: size,
          letterSpacing,
          lineHeight: 1.08,
          color: "#000000",
          opacity: ghostAlpha,
          filter: `blur(${6 + ghostBlur}px)`,
          pointerEvents: "none",
        }}
      >
        {text}
      </div>

      {/* Main Crisp Straight Text Layer */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          fontFamily: fSpec.family,
          fontStyle: fSpec.style,
          fontWeight: fSpec.weight,
          fontSize: size,
          letterSpacing,
          lineHeight: 1.08,
          color,
          backgroundColor: boxBg || "transparent",
          padding: boxBg ? "10px 32px" : "0 10px",
          borderRadius: boxBg ? 10 : 0,
          boxShadow: boxBg ? "0 18px 42px rgba(0,0,0,0.28)" : "none",
          textShadow: boxBg ? "none" : "0 10px 24px rgba(0,0,0,0.16)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* =========================================================================
   04. CLEAN VECTOR UI CARDS (SNEAKER APP, TIMER & WAREHOUSE)
   ========================================================================= */
const SneakerAppCard: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, localFrame - 15), fps, config: { damping: 13, stiffness: 160 } });

  return (
    <div
      style={{
        width: 820,
        padding: "36px 42px",
        borderRadius: 24,
        background: "#111827",
        border: "3px solid #334155",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 36,
        marginTop: 24,
        transform: `scale(${0.88 + pop * 0.12})`,
        opacity: clamp((localFrame - 15) / 10, 0, 1),
      }}
    >
      {/* Clean Geometric Vector Sneaker Icon */}
      <div
        style={{
          width: 220,
          height: 170,
          borderRadius: 18,
          background: "#090D16",
          border: `2px solid ${NEON_GREEN}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="170" height="110" viewBox="0 0 170 110">
          <path
            d="M20 80 L155 80 C158 62 140 52 115 48 L82 22 L62 28 L55 48 L22 42 Z"
            fill="rgba(0,255,102,0.18)"
            stroke={NEON_GREEN}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <line x1="18" y1="90" x2="156" y2="90" stroke="#FFFFFF" strokeWidth="6" />
        </svg>
      </div>

      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 22, color: "#94A3B8", fontWeight: 800 }}>
          STREETWEAR // EDITION 01
        </div>
        <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 38, color: "#FFFFFF", marginTop: 6 }}>
          URBAN HIGH SNEAKER
        </div>
        <div
          style={{
            marginTop: 16,
            display: "inline-block",
            padding: "8px 26px",
            borderRadius: 10,
            background: NEON_GREEN,
            color: "#05080F",
            fontFamily: "Impact, sans-serif",
            fontSize: 46,
            letterSpacing: 2,
          }}
        >
          RS. 2000
        </div>
      </div>
    </div>
  );
};

const ScarcityTimerCard: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const secLeft = Math.max(51, 59 - Math.floor(localFrame / 25));
  const pulse = 1 + Math.sin(localFrame * 0.25) * 0.03;

  return (
    <div
      style={{
        width: 840,
        padding: "36px 40px",
        borderRadius: 22,
        background: "rgba(225, 29, 72, 0.14)",
        border: `4px solid ${CRIMSON}`,
        boxShadow: `0 0 65px rgba(225,29,72,0.4)`,
        textAlign: "center",
        marginTop: 22,
        transform: `scale(${pulse})`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "10px 30px",
          borderRadius: 8,
          background: CRIMSON,
          color: "#FFFFFF",
          fontFamily: "Impact, sans-serif",
          fontSize: 54,
          letterSpacing: 3,
        }}
      >
        HURRY! ONLY 1 LEFT IN STOCK
      </div>
      <div
        style={{
          marginTop: 20,
          fontFamily: "'Courier New', monospace",
          fontSize: 48,
          fontWeight: 900,
          color: "#FACC15",
          letterSpacing: 4,
        }}
      >
        DEAL ENDS IN: 00:04:{secLeft}
      </div>
    </div>
  );
};

const WarehouseComparisonCard: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, localFrame - 18), fps, config: { damping: 13, stiffness: 165 } });

  return (
    <div
      style={{
        width: 880,
        display: "flex",
        gap: 26,
        marginTop: 26,
        transform: `scale(${0.88 + pop * 0.12})`,
        opacity: clamp((localFrame - 18) / 10, 0, 1),
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "34px 24px",
          borderRadius: 20,
          background: "#111827",
          border: `3px solid ${CRIMSON}`,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 22, color: "#94A3B8", fontWeight: 800 }}>
          ON YOUR APP SCREEN
        </div>
        <div style={{ fontFamily: "Impact, sans-serif", fontSize: 64, color: CRIMSON, marginTop: 14 }}>
          ONLY 1 LEFT
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 24, color: "#E2E8F0", marginTop: 8 }}>
          Fake urgency alert
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "34px 24px",
          borderRadius: 20,
          background: "#062415",
          border: `4px solid ${NEON_GREEN}`,
          boxShadow: `0 0 55px rgba(0,255,102,0.3)`,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 22, color: NEON_GREEN, fontWeight: 800 }}>
          IN REAL WAREHOUSE
        </div>
        <div style={{ fontFamily: "Impact, sans-serif", fontSize: 64, color: "#FFFFFF", marginTop: 14 }}>
          10,000+ BOXES
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 24, color: NEON_GREEN, marginTop: 8 }}>
          Full stock available
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   05. SCENE DEFINITIONS (10 SCENES, 38 SECONDS TOTAL)
   ========================================================================= */
type LineSpec = {
  text: string;
  appear: number;
  font: FontKind;
  size: number;
  color: string;
  boxBg?: string;
};

type SceneSpec = {
  id: number;
  startSec: number;
  endSec: number;
  dark: boolean;
  zoomType: "macroOut" | "pushIn" | "punchCenter";
  typingBurstAt?: number[];
  kachingAt?: number;
  customCard?: "sneaker" | "timer" | "warehouse";
  lines: LineSpec[];
};

const SCENES: SceneSpec[] = [
  // SCENE 1 (0.0s - 3.8s): HOOK PART 1
  {
    id: 1,
    startSec: 0.0,
    endSec: 3.8,
    dark: false,
    zoomType: "macroOut",
    typingBurstAt: [8, 65],
    lines: [
      { text: "Online shopping karte waqt", appear: 4, font: "serifItalic", size: 58, color: "#334155" },
      { text: "ONLY 2 LEFT IN STOCK", appear: 32, font: "impact", size: 96, color: "#FFFFFF", boxBg: CRIMSON },
      { text: "ka red alert dekha hai?", appear: 64, font: "mono", size: 52, color: INK_DARK },
    ],
  },
  // SCENE 2 (3.8s - 7.2s): HOOK PART 2
  {
    id: 2,
    startSec: 3.8,
    endSec: 7.2,
    dark: true,
    zoomType: "punchCenter",
    typingBurstAt: [10, 62],
    lines: [
      { text: "Chalo aaj iske peeche ka", appear: 6, font: "serifItalic", size: 60, color: "#94A3B8" },
      { text: "DIRTY MIND GAME", appear: 34, font: "impact", size: 108, color: "#05080F", boxBg: NEON_GREEN },
      { text: "DEKHTE HAIN.", appear: 62, font: "sansBold", size: 74, color: "#FFFFFF" },
    ],
  },
  // SCENE 3 (7.2s - 11.2s): SNEAKER IN APP (RS. 2000)
  {
    id: 3,
    startSec: 7.2,
    endSec: 11.2,
    dark: true,
    zoomType: "pushIn",
    typingBurstAt: [8],
    kachingAt: 36,
    customCard: "sneaker",
    lines: [
      { text: "Maan lo aap phone par", appear: 4, font: "serifItalic", size: 56, color: "#94A3B8" },
      { text: "EK SNEAKER DEKH RAHE HO", appear: 22, font: "impact", size: 84, color: "#FFFFFF" },
    ],
  },
  // SCENE 4 (11.2s - 15.0s): "ABHI REHNE DETA HOON"
  {
    id: 4,
    startSec: 11.2,
    endSec: 15.0,
    dark: false,
    zoomType: "pushIn",
    typingBurstAt: [8, 60],
    lines: [
      { text: "Aap normal sochte ho —", appear: 6, font: "mono", size: 50, color: "#475569" },
      { text: "ABHI REHNE DETA HOON", appear: 32, font: "impact", size: 92, color: "#FFFFFF", boxBg: INK_DARK },
      { text: "baad mein aaram se kharid lunga.", appear: 60, font: "serifItalic", size: 58, color: "#334155" },
    ],
  },
  // SCENE 5 (15.0s - 19.2s): RED ALERT & TIMER ATTACK
  {
    id: 5,
    startSec: 15.0,
    endSec: 19.2,
    dark: true,
    zoomType: "punchCenter",
    typingBurstAt: [10],
    customCard: "timer",
    lines: [
      { text: "Tabhi company aapke", appear: 4, font: "serifItalic", size: 56, color: "#94A3B8" },
      { text: "DIMAAG PAR ATTACK KARTI HAI", appear: 24, font: "impact", size: 78, color: "#FFFFFF" },
    ],
  },
  // SCENE 6 (19.2s - 23.2s): FOMO TRIGGERED
  {
    id: 6,
    startSec: 19.2,
    endSec: 23.2,
    dark: false,
    zoomType: "punchCenter",
    typingBurstAt: [8, 68],
    lines: [
      { text: "Isse brain mein trigger hota hai", appear: 4, font: "serifItalic", size: 56, color: "#334155" },
      { text: "F. O. M. O.", appear: 30, font: "impact", size: 132, color: "#FFFFFF", boxBg: CRIMSON },
      { text: "FEAR OF MISSING OUT", appear: 56, font: "mono", size: 54, color: INK_DARK },
      { text: "DIMAAG SOCHNA BAND!", appear: 82, font: "sansBold", size: 68, color: CRIMSON },
    ],
  },
  // SCENE 7 (23.2s - 27.2s): INSTANTLY BUY FOR RS. 2000
  {
    id: 7,
    startSec: 23.2,
    endSec: 27.2,
    dark: true,
    zoomType: "macroOut",
    typingBurstAt: [8],
    kachingAt: 58,
    lines: [
      { text: "Jo cheez abhi chahiye bhi nahi thi", appear: 6, font: "serifItalic", size: 56, color: "#94A3B8" },
      { text: "AAP TURANT KHARID LETE HO", appear: 32, font: "sansBold", size: 64, color: "#FFFFFF" },
      { text: "PAID: RS. 2000", appear: 58, font: "impact", size: 116, color: "#05080F", boxBg: NEON_GREEN },
    ],
  },
  // SCENE 8 (27.2s - 31.2s): WAREHOUSE REALITY
  {
    id: 8,
    startSec: 27.2,
    endSec: 31.2,
    dark: true,
    zoomType: "pushIn",
    typingBurstAt: [10],
    customCard: "warehouse",
    lines: [
      { text: "Jabki unke asli warehouse mein", appear: 4, font: "serifItalic", size: 56, color: "#94A3B8" },
      { text: "HAZARON PIECES PADE HOTE HAIN", appear: 26, font: "impact", size: 74, color: NEON_GREEN },
    ],
  },
  // SCENE 9 (31.2s - 34.6s): THE SCARCITY TRAP LOCK
  {
    id: 9,
    startSec: 31.2,
    endSec: 34.6,
    dark: false,
    zoomType: "punchCenter",
    typingBurstAt: [6, 40],
    lines: [
      { text: "Ise dark psychology mein kehte hain", appear: 4, font: "serifItalic", size: 56, color: "#334155" },
      { text: "THE SCARCITY TRAP", appear: 32, font: "impact", size: 104, color: "#FFFFFF", boxBg: INK_DARK },
    ],
  },
  // SCENE 10 (34.6s - 38.0s): EDGY CTA
  {
    id: 10,
    startSec: 34.6,
    endSec: 38.0,
    dark: true,
    zoomType: "pushIn",
    typingBurstAt: [8, 56],
    lines: [
      { text: "ONLY 1 LEFT KE CHAKKAR MEIN", appear: 4, font: "mono", size: 50, color: NEON_GREEN },
      { text: "kabhi jaldbazi mein shopping ki hai?", appear: 28, font: "serifItalic", size: 58, color: "#FFFFFF" },
      { text: "REALITY COMMENT MEIN BATAO", appear: 56, font: "impact", size: 80, color: "#05080F", boxBg: NEON_GREEN },
    ],
  },
];

/* =========================================================================
   06. MASTER COMPOSITION
   ========================================================================= */
const ScarcityTrapReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeScene =
    SCENES.find((s) => sec >= s.startSec && sec < s.endSec) ??
    SCENES[SCENES.length - 1];

  const startFrame = Math.round(activeScene.startSec * FPS);
  const endFrame = Math.round(activeScene.endSec * FPS);
  const sceneDuration = Math.max(1, endFrame - startFrame);
  const localFrame = Math.max(0, frame - startFrame);

  // SAFE CAMERA ZOOM (Never exceeds 1.12x after settle so text NEVER overflows!)
  let camScale = 1;
  if (activeScene.zoomType === "macroOut") {
    const settle = spring({
      frame: localFrame,
      fps,
      config: { damping: 16, stiffness: 105 },
    });
    camScale = interpolate(settle, [0, 1], [1.45, 1.0]);
  } else if (activeScene.zoomType === "punchCenter") {
    const punch = spring({
      frame: Math.max(0, localFrame - 34),
      fps,
      config: { damping: 14, stiffness: 130 },
    });
    camScale = interpolate(punch, [0, 1], [0.96, 1.09]);
  } else {
    camScale = interpolate(localFrame, [0, sceneDuration], [0.96, 1.08], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: activeScene.dark ? DARK_BG : PAPER_BG,
        overflow: "hidden",
      }}
    >
      <OpticalShadowVignette frame={frame} dark={activeScene.dark} />

      {/* CENTERED SAFE STAGE (100% Straight Vertical Stack) */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 70px",
          transform: `scale(${camScale})`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            width: "100%",
            maxWidth: 920,
          }}
        >
          {activeScene.lines.map((ln, idx) => (
            <ShadowPopLine
              key={idx}
              text={ln.text}
              localFrame={localFrame}
              appearFrame={ln.appear}
              font={ln.font}
              size={ln.size}
              color={ln.color}
              boxBg={ln.boxBg}
            />
          ))}

          {activeScene.customCard === "sneaker" && (
            <SneakerAppCard localFrame={localFrame} />
          )}
          {activeScene.customCard === "timer" && (
            <ScarcityTimerCard localFrame={localFrame} />
          )}
          {activeScene.customCard === "warehouse" && (
            <WarehouseComparisonCard localFrame={localFrame} />
          )}
        </div>
      </AbsoluteFill>

      {/* ===================================================================
          AUDIO TRIGGERS: SCENE WHOOSHES + TYPING SFX BURSTS + KA-CHING
         =================================================================== */}
      {SCENES.map((sc) => {
        const sFrame = Math.round(sc.startSec * FPS);
        return (
          <React.Fragment key={`audio-${sc.id}`}>
            {/* Scene Change Whoosh */}
            <Sequence from={sFrame} durationInFrames={35} layout="none">
              <Audio
                src={sc.zoomType === "macroOut" ? SFX.zoomWhoosh : SFX.whoosh}
                volume={0.82}
              />
            </Sequence>

            {/* Typing Sound Effect Bursts (Background SFX while words pop) */}
            {sc.typingBurstAt?.map((offsetF, i) => (
              <Sequence
                key={`type-${sc.id}-${i}`}
                from={sFrame + offsetF}
                durationInFrames={32}
                layout="none"
              >
                <Audio src={SFX.typingBurst} volume={0.65} />
              </Sequence>
            ))}

            {/* Money Cash Register Sound on RS. 2000 */}
            {sc.kachingAt !== undefined && (
              <Sequence
                from={sFrame + sc.kachingAt}
                durationInFrames={35}
                layout="none"
              >
                <Audio src={SFX.kaching} volume={0.88} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ScarcityTrapReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
