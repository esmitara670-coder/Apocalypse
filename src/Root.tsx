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
   THE FREE SHIPPING TRAP — SENPAISPIDER DARK MINIMAL & NEON GREEN EDITION
   1080 x 1920 | 60 FPS | 40.5 Seconds (2430 Frames) | 17 Sub-3s Cuts
   - ZERO EMOJIS: Pure Vector Geometry, Wireframes & Clean Kinetic Typography
   - Full-Screen Typography Hook ("CHALO AAJ EXACTLY DEKHTE HAIN")
   - Neon Green Money Highlights (#00FF66) + Crisp Cash & Coin SFX
   - 3-Card Middle Insertion Scene (RS. 400 + RS. 150 EXTRA = RS. 550)
   Zero External Assets Required.
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2430; // 40.5 Seconds @ 60 FPS

const NEON_GREEN = "#00FF66";
const GREEN_GLOW = "rgba(0, 255, 102, 0.35)";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const CYAN = "#00F0FF";
const DARK_BG = "#04060A";
const PANEL_BG = "rgba(10, 15, 24, 0.94)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. SENPAISPIDER-STYLE CRISP MONEY & TACTILE UI SFX ENGINE
   ========================================================================= */

type SfxKind =
  | "cashKaching"
  | "coinClink"
  | "markerSwipe"
  | "mechThock"
  | "subDrop"
  | "cardSnap"
  | "uiPop";

function buildCrispSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations: Record<SfxKind, number> = {
    cashKaching: 0.52,
    coinClink: 0.34,
    markerSwipe: 0.24,
    mechThock: 0.14,
    subDrop: 0.46,
    cardSnap: 0.2,
    uiPop: 0.16,
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

    if (kind === "cashKaching") {
      // Crisp metallic register drawer + high silver bell shimmer
      const f1 = p < 0.18 ? 1480 : 2960;
      const f2 = p < 0.18 ? 2217 : 4435;
      const subP = p < 0.18 ? p / 0.18 : (p - 0.18) / 0.82;
      w =
        Math.sin(2 * Math.PI * f1 * t) * 0.55 +
        Math.sin(2 * Math.PI * f2 * t) * 0.35 +
        Math.sin(2 * Math.PI * (f1 * 1.5) * t) * 0.15;
      env = Math.exp(-subP * 7.5);
    } else if (kind === "coinClink") {
      // High-frequency metallic coin ring
      w =
        Math.sin(2 * Math.PI * 2637 * t) * 0.6 +
        Math.sin(2 * Math.PI * 3951 * t) * 0.35;
      env = Math.exp(-p * 9.5);
    } else if (kind === "markerSwipe") {
      // Smooth felt highlighter brush sweep
      const glideF = 260 + Math.sin(p * Math.PI) * 380;
      w =
        Math.sin(2 * Math.PI * glideF * t) * 0.6 +
        Math.sin(2 * Math.PI * (glideF * 1.5) * t) * 0.25;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (kind === "mechThock") {
      // Deep tactile keyboard switch thock
      const bodyF = 185 * Math.exp(-p * 12) + 60;
      const click = Math.sin(2 * Math.PI * 1750 * t) * Math.exp(-p * 26);
      w = Math.sin(2 * Math.PI * bodyF * t) * 0.8 + click * 0.35;
      env = Math.exp(-p * 13);
    } else if (kind === "subDrop") {
      // Clean dark documentary 808 bass drop
      const f = 110 * Math.pow(1 - p * 0.65, 1.4) + 34;
      w =
        Math.sin(2 * Math.PI * f * t) * 0.88 +
        Math.sin(2 * Math.PI * (f * 2) * t) * 0.18;
      env = Math.pow(1 - p, 1.5);
    } else if (kind === "cardSnap") {
      // Crisp double-tap card lock sound
      const f = p < 0.4 ? 420 : 640;
      const lp = p < 0.4 ? p / 0.4 : (p - 0.4) / 0.6;
      w = Math.sin(2 * Math.PI * f * t) * 0.75;
      env = Math.exp(-lp * 12);
    } else if (kind === "uiPop") {
      const f = 310 + Math.pow(p, 1.5) * 620;
      w = Math.sin(2 * Math.PI * f * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 0.85);
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
  cashKaching: buildCrispSfx("cashKaching"),
  coinClink: buildCrispSfx("coinClink"),
  markerSwipe: buildCrispSfx("markerSwipe"),
  mechThock: buildCrispSfx("mechThock"),
  subDrop: buildCrispSfx("subDrop"),
  cardSnap: buildCrispSfx("cardSnap"),
  uiPop: buildCrispSfx("uiPop"),
};

/* =========================================================================
   02. 17 SUB-3-SECOND CUTS (ZERO EMOJIS, SENPAISPIDER TIMELINE)
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
  tag: string;
  titleTop: string;
  titleMain: string;
  subLabel: string;
  accent: string;
  textStyle: TextAnimStyle;
  fullScreenTypo?: boolean;
  primarySfx: SfxKind;
  moneySfx?: { offsetSec: number; kind: SfxKind };
};

const CUTS: CutSpec[] = [
  // CUT 1 (0.0s - 2.2s): FULL-SCREEN TYPOGRAPHY HOOK PART 1
  {
    id: 1,
    startSec: 0.0,
    endSec: 2.2,
    tag: "SEQUENCE // 01",
    titleTop: "BADI COMPANIES AAPKO",
    titleMain: "'FREE' KE NAAM PAR KAISE LOOT-TI HAIN?",
    subLabel: "DARK MARKETING EXPOSED",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    fullScreenTypo: true,
    primarySfx: "markerSwipe",
    moneySfx: { offsetSec: 0.3, kind: "subDrop" },
  },
  // CUT 2 (2.2s - 4.2s): FULL-SCREEN TYPOGRAPHY HOOK PART 2 ("CHALO AAJ EXACTLY DEKHTE HAIN")
  {
    id: 2,
    startSec: 2.2,
    endSec: 4.2,
    tag: "SEQUENCE // 02",
    titleTop: "CHALO AAJ",
    titleMain: "EXACTLY DEKHTE HAIN.",
    subLabel: "STEP-BY-STEP BREAKDOWN",
    accent: NEON_GREEN,
    textStyle: "wordStagger",
    fullScreenTypo: true,
    primarySfx: "mechThock",
    moneySfx: { offsetSec: 0.22, kind: "cardSnap" },
  },
  // CUT 3 (4.2s - 6.4s): ONLINE T-SHIRT SHOPPING
  {
    id: 3,
    startSec: 4.2,
    endSec: 6.4,
    tag: "SCENARIO // 03",
    titleTop: "MAAN LO AAP ONLINE EK",
    titleMain: "T-SHIRT KHARID RAHE HO",
    subLabel: "STANDARD E-COMMERCE CHECKOUT",
    accent: CYAN,
    textStyle: "slideSplit",
    primarySfx: "cardSnap",
  },
  // CUT 4 (6.4s - 8.6s): PRICE IS RS. 400 (NEON GREEN MONEY HIGHLIGHT + CASH SFX)
  {
    id: 4,
    startSec: 6.4,
    endSec: 8.6,
    tag: "ITEM PRICE // 04",
    titleTop: "T-SHIRT KI PRICE HAI",
    titleMain: "RS. 400",
    subLabel: "BASE PRODUCT VALUE",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    primarySfx: "cashKaching",
  },
  // CUT 5 (8.6s - 10.8s): DELIVERY CHARGE RS. 50
  {
    id: 5,
    startSec: 8.6,
    endSec: 10.8,
    tag: "SHIPPING FEE // 05",
    titleTop: "AUR DELIVERY CHARGE HAI",
    titleMain: "+ RS. 50",
    subLabel: "EXTRA SHIPPING COST",
    accent: CRIMSON,
    textStyle: "flip3D",
    primarySfx: "coinClink",
  },
  // CUT 6 (10.8s - 13.0s): TOTAL HUA RS. 450
  {
    id: 6,
    startSec: 10.8,
    endSec: 13.0,
    tag: "CART TOTAL // 06",
    titleTop: "AAPKA TOTAL BILL HUA",
    titleMain: "RS. 450",
    subLabel: "RS. 400 ITEM + RS. 50 SHIPPING",
    accent: NEON_GREEN,
    textStyle: "letterSnap",
    primarySfx: "coinClink",
    moneySfx: { offsetSec: 0.25, kind: "markerSwipe" },
  },
  // CUT 7 (13.0s - 15.5s): RS. 50 DELIVERY FEELS LIKE A WASTE
  {
    id: 7,
    startSec: 13.0,
    endSec: 15.5,
    tag: "PAIN POINT // 07",
    titleTop: "AAPKO LAGTA HAI KI RS. 50 DENA",
    titleMain: "PURE WASTE HAI",
    subLabel: "LOSS AVERSION TRIGGERED",
    accent: CRIMSON,
    textStyle: "wordStagger",
    primarySfx: "subDrop",
  },
  // CUT 8 (15.5s - 18.2s): BANNER APPEARS: FREE SHIPPING ABOVE RS. 500
  {
    id: 8,
    startSec: 15.5,
    endSec: 18.2,
    tag: "THE BAIT BANNER // 08",
    titleTop: "TABHI SCREEN PAR BANNER DIKHTA HAI:",
    titleMain: "FREE SHIPPING ABOVE RS. 500",
    subLabel: "ADD RS. 100 MORE TO UNLOCK",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    primarySfx: "markerSwipe",
    moneySfx: { offsetSec: 0.3, kind: "coinClink" },
  },
  // CUT 9 (18.2s - 20.6s): TO SAVE THAT RS. 50 DELIVERY
  {
    id: 9,
    startSec: 18.2,
    endSec: 20.6,
    tag: "BRAIN LOGIC // 09",
    titleTop: "AB US RS. 50 KI DELIVERY KO",
    titleMain: "BACHANE KE LIYE...",
    subLabel: "MISSION: AVOID SHIPPING FEE",
    accent: GOLD,
    textStyle: "typewriter",
    primarySfx: "mechThock",
    moneySfx: { offsetSec: 0.2, kind: "coinClink" },
  },
  // CUT 10 (20.6s - 23.4s): HERO 3-CARD SCENE! RS. 150 EXTRA ITEM SLAMS IN THE MIDDLE
  {
    id: 10,
    startSec: 20.6,
    endSec: 23.4,
    tag: "THE TRAP ADDITION // 10",
    titleTop: "AAP BEECH MEIN ADD KAR LETE HO:",
    titleMain: "RS. 150 KA EXTRA ITEM",
    subLabel: "UNPLANNED PURCHASE INSERTED",
    accent: NEON_GREEN,
    textStyle: "flip3D",
    primarySfx: "cardSnap",
    moneySfx: { offsetSec: 0.25, kind: "cashKaching" },
  },
  // CUT 11 (23.4s - 26.0s): RESULT? TOTAL BILL BECOMES RS. 550!
  {
    id: 11,
    startSec: 23.4,
    endSec: 26.0,
    tag: "FINAL BILL // 11",
    titleTop: "RESULT? AAPKA TOTAL BILL BANA",
    titleMain: "RS. 550",
    subLabel: "SHIPPING: RS. 0 [FREE] • TOTAL: RS. 550",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    primarySfx: "cashKaching",
  },
  // CUT 12 (26.0s - 28.6s): COMPANY INCREASED YOUR SPEND BY RS. 100
  {
    id: 12,
    startSec: 26.0,
    endSec: 28.6,
    tag: "PROFIT MATH // 12",
    titleTop: "COMPANY NE CHALAKI SE AAPKA KHARCH",
    titleMain: "RS. 100 BADHA DIYA",
    subLabel: "RS. 450 OLD BILL -> RS. 550 NEW BILL",
    accent: CRIMSON,
    textStyle: "slideSplit",
    primarySfx: "coinClink",
    moneySfx: { offsetSec: 0.28, kind: "subDrop" },
  },
  // CUT 13 (28.6s - 31.2s): ONLY USING THE ILLUSION OF 'FREE'
  {
    id: 13,
    startSec: 28.6,
    endSec: 31.2,
    tag: "THE ILLUSION // 13",
    titleTop: "SIRF US 'FREE' WORD KA",
    titleMain: "ILLUSION BANAKAR",
    subLabel: "PSYCHOLOGICAL TRIGGER WORD",
    accent: NEON_GREEN,
    textStyle: "letterSnap",
    primarySfx: "markerSwipe",
  },
  // CUT 14 (31.2s - 33.6s): THIS IS CALLED THE FREE SHIPPING TRAP
  {
    id: 14,
    startSec: 31.2,
    endSec: 33.6,
    tag: "CONCEPT LOCKED // 14",
    titleTop: "ISE KEHTE HAIN",
    titleMain: "THE FREE SHIPPING TRAP",
    subLabel: "E-COMMERCE DARK PATTERN #04",
    accent: CYAN,
    textStyle: "wordStagger",
    fullScreenTypo: true,
    primarySfx: "subDrop",
    moneySfx: { offsetSec: 0.22, kind: "cardSnap" },
  },
  // CUT 15 (33.6s - 36.0s): CTA PART 1 — TO SAVE RS. 50 DELIVERY
  {
    id: 15,
    startSec: 33.6,
    endSec: 36.0,
    tag: "REALITY CHECK // 15",
    titleTop: "PICHHLI BAAR US RS. 50 KI",
    titleMain: "DELIVERY BACHANE KE LIYE...",
    subLabel: "BE 100% HONEST WITH YOURSELF",
    accent: GOLD,
    textStyle: "typewriter",
    primarySfx: "mechThock",
  },
  // CUT 16 (36.0s - 38.2s): CTA PART 2 — HOW MUCH EXTRA DID YOU BUY?
  {
    id: 16,
    startSec: 36.0,
    endSec: 38.2,
    tag: "YOUR BILL // 16",
    titleTop: "AAPNE KITNE RUPEES KA",
    titleMain: "FALTU SAAMAN KHARIDA THA?",
    subLabel: "RS. 200? RS. 500? RS. 1,000?",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    primarySfx: "cashKaching",
  },
  // CUT 17 (38.2s - 40.5s): CTA PART 3 — DROP REALITY IN COMMENTS
  {
    id: 17,
    startSec: 38.2,
    endSec: 40.5,
    tag: "COMMENT BELOW // 17",
    titleTop: "APNI REALITY",
    titleMain: "COMMENT MEIN BATAO.",
    subLabel: "DROP YOUR EXTRA SPEND AMOUNT",
    accent: NEON_GREEN,
    textStyle: "wordStagger",
    primarySfx: "uiPop",
    moneySfx: { offsetSec: 0.25, kind: "coinClink" },
  },
];

/* =========================================================================
   03. HELPER: INLINE NEON GREEN MONEY PILL RENDERER
   ========================================================================= */

const highlightMoneyTokens = (text: string, accent: string) => {
  const parts = text.split(/(RS\.\s*\d+|'FREE'|FREE|\+\s*RS\.\s*\d+)/g);
  return parts.map((part, i) => {
    const isMoneyOrFree = /^(RS\.\s*\d+|'FREE'|FREE|\+\s*RS\.\s*\d+)$/.test(part);
    if (!isMoneyOrFree) return <React.Fragment key={i}>{part}</React.Fragment>;
    return (
      <span
        key={i}
        style={{
          display: "inline-block",
          padding: "2px 18px",
          margin: "0 6px",
          borderRadius: 10,
          background: NEON_GREEN,
          color: "#030705",
          boxShadow: `0 0 35px ${NEON_GREEN}99`,
          fontWeight: 900,
        }}
      >
        {part}
      </span>
    );
  });
};

/* =========================================================================
   04. FULL-SCREEN KINETIC TYPOGRAPHY STAGE (FOR HOOKS & KEY REVEALS)
   ========================================================================= */

const FullScreenTypographyStage: React.FC<{
  cut: CutSpec;
  localFrame: number;
}> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();

  const words = cut.titleMain.split(" ");
  const sweep = interpolate(localFrame, [8, 34], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 68px",
        textAlign: "center",
      }}
    >
      {/* Top Minimal Architectural Bracket */}
      <div
        style={{
          padding: "10px 28px",
          border: `2px solid ${ NEON_GREEN }`,
          background: "rgba(0, 255, 102, 0.08)",
          color: NEON_GREEN,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 6,
          marginBottom: 36,
        }}
      >
        [ {cut.titleTop} ]
      </div>

      {/* Giant Senpaispider Full-Screen Words */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px 24px",
          maxWidth: 940,
        }}
      >
        {words.map((w, idx) => {
          const wSpring = spring({
            frame: Math.max(0, localFrame - idx * 4),
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.7 },
          });

          const isGreenWord =
            w.includes("FREE") ||
            w.includes("EXACTLY") ||
            w.includes("TRAP");

          return (
            <span
              key={idx}
              style={{
                display: "inline-block",
                overflow: "hidden",
                padding: "4px 6px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  position: "relative",
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: cut.id === 2 ? 104 : 86,
                  fontWeight: 900,
                  lineHeight: 1.04,
                  letterSpacing: -1,
                  color: isGreenWord ? "#040806" : "#FFFFFF",
                  padding: isGreenWord ? "4px 22px" : "0",
                  borderRadius: 12,
                  background: isGreenWord
                    ? `linear-gradient(90deg, ${NEON_GREEN} ${sweep}%, rgba(0,255,102,0.15) ${sweep}%)`
                    : "transparent",
                  boxShadow: isGreenWord ? `0 0 55px ${NEON_GREEN}88` : "none",
                  transform: `translateY(${(1 - wSpring) * 95}px)`,
                }}
              >
                {w}
              </span>
            </span>
          );
        })}
      </div>

      {/* Bottom Telemetry Rule */}
      <div
        style={{
          marginTop: 48,
          display: "flex",
          alignItems: "center",
          gap: 20,
          color: "#64748B",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 5,
        }}
      >
        <div style={{ width: 60, height: 2, background: NEON_GREEN }} />
        <span>{cut.subLabel}</span>
        <div style={{ width: 60, height: 2, background: NEON_GREEN }} />
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   05. 6 DISTINCT TOP HEADLINE ANIMATIONS (ZERO REPETITION)
   ========================================================================= */

const VariedTopHeadline: React.FC<{
  cut: CutSpec;
  localFrame: number;
}> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();

  if (cut.textStyle === "highlighter") {
    const barW = interpolate(localFrame, [4, 28], [0, 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: "#94A3B8",
            letterSpacing: 4,
            marginBottom: 12,
          }}
        >
          {cut.titleTop}
        </div>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            padding: "8px 32px",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 2,
              bottom: 2,
              width: `${barW}%`,
              background: NEON_GREEN,
              borderRadius: 12,
              boxShadow: `0 0 50px ${NEON_GREEN}99`,
            }}
          />
          <span
            style={{
              position: "relative",
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 66,
              fontWeight: 900,
              color: barW > 45 ? "#040806" : "#FFFFFF",
            }}
          >
            {cut.titleMain}
          </span>
        </div>
      </div>
    );
  }

  if (cut.textStyle === "typewriter") {
    const len = cut.titleMain.length;
    const chars = Math.min(
      len,
      Math.floor(interpolate(localFrame, [2, 26], [0, len], { extrapolateRight: "clamp" }))
    );
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: NEON_GREEN,
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
            fontSize: 64,
            fontWeight: 900,
            color: "#FFFFFF",
          }}
        >
          {highlightMoneyTokens(cut.titleMain.slice(0, chars), cut.accent)}
          <span style={{ color: NEON_GREEN, marginLeft: 6 }}>_</span>
        </div>
      </div>
    );
  }

  if (cut.textStyle === "flip3D") {
    const f1 = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 165 } });
    return (
      <div style={{ textAlign: "center", perspective: 900 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: "#CBD5E1",
            letterSpacing: 4,
            marginBottom: 10,
          }}
        >
          {cut.titleTop}
        </div>
        <div
          style={{
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 66,
            fontWeight: 900,
            color: "#FFFFFF",
            transformOrigin: "50% 0%",
            transform: `rotateX(${(1 - f1) * 85}deg)`,
            opacity: f1,
          }}
        >
          {highlightMoneyTokens(cut.titleMain, cut.accent)}
        </div>
      </div>
    );
  }

  if (cut.textStyle === "slideSplit") {
    const s = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 170 } });
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: "#94A3B8",
            letterSpacing: 4,
            transform: `translateX(${(1 - s) * -140}px)`,
            opacity: s,
          }}
        >
          {cut.titleTop}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 64,
            fontWeight: 900,
            color: "#FFFFFF",
            transform: `translateX(${(1 - s) * 140}px)`,
            opacity: s,
          }}
        >
          {highlightMoneyTokens(cut.titleMain, cut.accent)}
        </div>
      </div>
    );
  }

  if (cut.textStyle === "letterSnap") {
    const snap = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 175 } });
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#94A3B8", letterSpacing: 4 }}>
          {cut.titleTop}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 68,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: `${interpolate(snap, [0, 1], [22, 0])}px`,
            opacity: snap,
          }}
        >
          {highlightMoneyTokens(cut.titleMain, cut.accent)}
        </div>
      </div>
    );
  }

  // Default: wordStagger
  const words = cut.titleMain.split(" ");
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: "#94A3B8",
          letterSpacing: 4,
          marginBottom: 10,
        }}
      >
        {cut.titleTop}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px" }}>
        {words.map((w, i) => {
          const ws = spring({
            frame: Math.max(0, localFrame - i * 4),
            fps,
            config: { damping: 12, stiffness: 190 },
          });
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden" }}>
              <span
                style={{
                  display: "inline-block",
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: 64,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  transform: `translateY(${(1 - ws) * 75}px)`,
                }}
              >
                {highlightMoneyTokens(w, cut.accent)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================================
   06. CLEAN VECTOR & NEON GREEN UI STAGE WIDGETS (ZERO EMOJIS!)
   ========================================================================= */

const CleanVectorStage: React.FC<{
  cutId: number;
  localFrame: number;
}> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, stiffness: 170 },
  });

  // CUT 3: CLEAN VECTOR E-COMMERCE T-SHIRT PRODUCT CARD
  if (cutId === 3) {
    return (
      <div
        style={{
          width: 840,
          padding: 48,
          borderRadius: 28,
          background: PANEL_BG,
          border: `2px solid ${CYAN}88`,
          boxShadow: `0 25px 70px rgba(0,0,0,0.85)`,
          transform: `translateY(${(1 - pop) * 40}px) scale(${0.92 + pop * 0.08})`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #1E293B",
            paddingBottom: 18,
            marginBottom: 32,
            color: "#64748B",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 3,
          }}
        >
          <span>STORE // APPAREL</span>
          <span style={{ color: CYAN }}>IN STOCK [01]</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          {/* Clean Geometric SVG T-Shirt Wireframe */}
          <div
            style={{
              width: 260,
              height: 260,
              borderRadius: 20,
              background: "#070B12",
              border: `2px solid ${CYAN}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="170" height="170" viewBox="0 0 170 170">
              <path
                d="M45 25 L65 25 C72 38 98 38 105 25 L125 25 L155 55 L135 80 L120 65 L120 145 L50 145 L50 65 L35 80 L15 55 Z"
                fill="rgba(0, 240, 255, 0.12)"
                stroke={CYAN}
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
              ESSENTIAL COTTON TEE
            </div>
            <div style={{ color: "#FFFFFF", fontSize: 46, fontWeight: 900, marginTop: 8 }}>
              BLACK OVERSIZED FIT
            </div>
            <div
              style={{
                marginTop: 28,
                display: "inline-block",
                padding: "14px 32px",
                borderRadius: 10,
                background: NEON_GREEN,
                color: "#030805",
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 2,
              }}
            >
              SELECTED FOR CHECKOUT
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CUT 4: PRICE IS RS. 400 (GIANT NEON GREEN PRICE HIGHLIGHT)
  if (cutId === 4) {
    const count = Math.floor(
      interpolate(localFrame, [0, 28], [100, 400], { extrapolateRight: "clamp" })
    );
    return (
      <div
        style={{
          width: 840,
          padding: 56,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${NEON_GREEN}`,
          boxShadow: `0 0 80px ${GREEN_GLOW}`,
          textAlign: "center",
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 24, fontWeight: 900, letterSpacing: 5 }}>
          ITEM SUBTOTAL
        </div>
        <div
          style={{
            marginTop: 24,
            display: "inline-block",
            padding: "18px 56px",
            borderRadius: 18,
            background: NEON_GREEN,
            color: "#030805",
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 120,
            fontWeight: 900,
            boxShadow: `0 0 65px ${NEON_GREEN}`,
          }}
        >
          RS. {count}
        </div>
        <div style={{ color: "#CBD5E1", fontSize: 26, fontWeight: 800, marginTop: 28, letterSpacing: 3 }}>
          1 X OVERSIZED T-SHIRT
        </div>
      </div>
    );
  }

  // CUT 5: DELIVERY CHARGE + RS. 50
  if (cutId === 5) {
    return (
      <div
        style={{
          width: 840,
          padding: 48,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${CRIMSON}`,
          boxShadow: `0 0 70px rgba(255, 42, 84, 0.3)`,
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 32px",
            borderRadius: 16,
            background: "#080C14",
            marginBottom: 22,
          }}
        >
          <span style={{ color: "#94A3B8", fontSize: 30, fontWeight: 800 }}>
            ITEM PRICE
          </span>
          <span style={{ color: "#FFFFFF", fontSize: 36, fontWeight: 900 }}>
            RS. 400
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "30px 32px",
            borderRadius: 16,
            background: "rgba(255, 42, 84, 0.14)",
            border: `3px solid ${CRIMSON}`,
          }}
        >
          <span style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900 }}>
            STANDARD DELIVERY FEE
          </span>
          <span
            style={{
              padding: "8px 24px",
              borderRadius: 10,
              background: NEON_GREEN,
              color: "#030805",
              fontSize: 42,
              fontWeight: 900,
              boxShadow: `0 0 35px ${NEON_GREEN}`,
            }}
          >
            + RS. 50
          </span>
        </div>
      </div>
    );
  }

  // CUT 6: TOTAL HUA RS. 450
  if (cutId === 6) {
    return (
      <div
        style={{
          width: 860,
          padding: 50,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${NEON_GREEN}`,
          boxShadow: `0 0 75px ${GREEN_GLOW}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
            fontSize: 44,
            fontWeight: 900,
            color: "#CBD5E1",
            marginBottom: 30,
          }}
        >
          <span>RS. 400</span>
          <span style={{ color: NEON_GREEN }}>+</span>
          <span>RS. 50</span>
          <span style={{ color: NEON_GREEN }}>=</span>
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "20px 64px",
            borderRadius: 18,
            background: NEON_GREEN,
            color: "#030805",
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 108,
            fontWeight: 900,
            boxShadow: `0 0 65px ${NEON_GREEN}`,
          }}
        >
          RS. 450
        </div>
      </div>
    );
  }

  // CUT 7: RS. 50 DELIVERY FEELS LIKE A WASTE
  if (cutId === 7) {
    return (
      <div
        style={{
          width: 860,
          padding: 52,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${CRIMSON}`,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          CUSTOMER BRAIN REACTION
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 900,
            color: "#FFFFFF",
            margin: "24px 0",
            textDecoration: "line-through",
            opacity: 0.45,
          }}
        >
          DELIVERY: RS. 50
        </div>
        <div
          style={{
            display: "inline-block",
            padding: "16px 42px",
            borderRadius: 12,
            background: CRIMSON,
            color: "#FFFFFF",
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: 3,
            boxShadow: `0 0 50px ${CRIMSON}`,
          }}
        >
          [ 100% MONEY WASTE ]
        </div>
      </div>
    );
  }

  // CUT 8: FREE SHIPPING ON ORDERS ABOVE RS. 500 BANNER
  if (cutId === 8) {
    const barFill = interpolate(localFrame, [0, 45], [30, 80], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return (
      <div
        style={{
          width: 880,
          padding: 48,
          borderRadius: 28,
          background: PANEL_BG,
          border: `4px solid ${NEON_GREEN}`,
          boxShadow: `0 0 85px ${GREEN_GLOW}`,
        }}
      >
        <div
          style={{
            padding: "18px 28px",
            borderRadius: 14,
            background: NEON_GREEN,
            color: "#030805",
            fontSize: 34,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 2,
            boxShadow: `0 0 40px ${NEON_GREEN}`,
          }}
        >
          UNLOCK FREE SHIPPING ON ORDERS ABOVE RS. 500
        </div>

        <div style={{ marginTop: 36 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#CBD5E1",
              fontSize: 24,
              fontWeight: 900,
              marginBottom: 14,
            }}
          >
            <span>CURRENT CART: RS. 400</span>
            <span style={{ color: NEON_GREEN }}>TARGET: RS. 500</span>
          </div>
          <div
            style={{
              width: "100%",
              height: 34,
              borderRadius: 17,
              background: "#090E17",
              border: `2px solid ${NEON_GREEN}66`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barFill}%`,
                height: "100%",
                background: NEON_GREEN,
                boxShadow: `0 0 30px ${NEON_GREEN}`,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 22,
              textAlign: "center",
              color: GOLD,
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            ONLY RS. 100 AWAY FROM FREE DELIVERY
          </div>
        </div>
      </div>
    );
  }

  // CUT 9: TO SAVE RS. 50 DELIVERY...
  if (cutId === 9) {
    return (
      <div
        style={{
          width: 860,
          padding: 50,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${GOLD}`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          YOUR GOAL AT CHECKOUT
        </div>
        <div
          style={{
            marginTop: 24,
            display: "inline-block",
            padding: "20px 48px",
            borderRadius: 16,
            border: `4px solid ${NEON_GREEN}`,
            background: "rgba(0, 255, 102, 0.12)",
            color: NEON_GREEN,
            fontSize: 64,
            fontWeight: 900,
            fontFamily: '"Arial Black", sans-serif',
          }}
        >
          SAVE RS. 50 FEE
        </div>
      </div>
    );
  }

  // CUT 10: THE HERO 3-CARD MIDDLE INSERTION (RS. 400 + RS. 150 EXTRA = RS. 550)
  // Built just like the 100 - 180 - 200 scene the user loved!
  if (cutId === 10) {
    const midInsert = spring({
      frame: Math.max(0, localFrame - 8),
      fps,
      config: { damping: 11, stiffness: 190 },
    });

    return (
      <div
        style={{
          width: 980,
          display: "flex",
          gap: 22,
          alignItems: "center",
        }}
      >
        {/* Left Card: Original T-Shirt RS. 400 */}
        <div
          style={{
            flex: 1,
            padding: "38px 20px",
            borderRadius: 24,
            background: PANEL_BG,
            border: "2px solid #334155",
            textAlign: "center",
            opacity: 0.75,
          }}
        >
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>
            ITEM 01
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, margin: "12px 0" }}>
            T-SHIRT
          </div>
          <div style={{ color: "#CBD5E1", fontSize: 52, fontWeight: 900 }}>
            RS. 400
          </div>
        </div>

        {/* Center Highlighted Card: EXTRA ITEM RS. 150 SLAMS IN! */}
        <div
          style={{
            flex: 1.25,
            padding: "46px 22px",
            borderRadius: 28,
            background: "#051F12",
            border: `5px solid ${NEON_GREEN}`,
            boxShadow: `0 0 95px ${NEON_GREEN}88`,
            textAlign: "center",
            transform: `translateY(${(1 - midInsert) * 95}px) scale(${
              0.82 + midInsert * 0.24
            })`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 18px",
              borderRadius: 8,
              background: NEON_GREEN,
              color: "#030805",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 2,
              marginBottom: 14,
            }}
          >
            + EXTRA ITEM ADDED
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900 }}>
            SOCKS / CAP
          </div>
          <div
            style={{
              marginTop: 12,
              color: NEON_GREEN,
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 78,
              fontWeight: 900,
              textShadow: `0 0 35px ${NEON_GREEN}`,
            }}
          >
            RS. 150
          </div>
        </div>

        {/* Right Card: Shipping Unlocked */}
        <div
          style={{
            flex: 1,
            padding: "38px 20px",
            borderRadius: 24,
            background: PANEL_BG,
            border: `2px solid ${NEON_GREEN}66`,
            textAlign: "center",
            opacity: 0.85,
          }}
        >
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>
            SHIPPING
          </div>
          <div style={{ color: NEON_GREEN, fontSize: 32, fontWeight: 900, margin: "12px 0" }}>
            UNLOCKED
          </div>
          <div style={{ color: NEON_GREEN, fontSize: 52, fontWeight: 900 }}>
            FREE
          </div>
        </div>
      </div>
    );
  }

  // CUT 11: RESULT? TOTAL BILL RS. 550!
  if (cutId === 11) {
    const bill = Math.floor(
      interpolate(localFrame, [0, 32], [450, 550], { extrapolateRight: "clamp" })
    );
    return (
      <div
        style={{
          width: 860,
          padding: 52,
          borderRadius: 28,
          background: PANEL_BG,
          border: `4px solid ${NEON_GREEN}`,
          boxShadow: `0 0 90px ${GREEN_GLOW}`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          FINAL AMOUNT PAID
        </div>
        <div
          style={{
            marginTop: 22,
            display: "inline-block",
            padding: "20px 64px",
            borderRadius: 18,
            background: NEON_GREEN,
            color: "#030805",
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 118,
            fontWeight: 900,
            boxShadow: `0 0 70px ${NEON_GREEN}`,
          }}
        >
          RS. {bill}
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 30, fontWeight: 800, marginTop: 26 }}>
          RS. 400 + RS. 150 EXTRA = <span style={{ color: NEON_GREEN }}>RS. 550</span>
        </div>
      </div>
    );
  }

  // CUT 12: SIDE-BY-SIDE COMPARISON (+ RS. 100 EXTRA SPENT)
  if (cutId === 12) {
    return (
      <div
        style={{
          width: 880,
          padding: 46,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${CRIMSON}`,
        }}
      >
        <div style={{ display: "flex", gap: 28, marginBottom: 30 }}>
          <div
            style={{
              flex: 1,
              padding: 32,
              borderRadius: 20,
              background: "#080C14",
              border: "2px solid #334155",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>
              WITH DELIVERY FEE
            </div>
            <div style={{ color: "#FFFFFF", fontSize: 60, fontWeight: 900, marginTop: 10 }}>
              RS. 450
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: 32,
              borderRadius: 20,
              background: "rgba(255, 42, 84, 0.14)",
              border: `3px solid ${CRIMSON}`,
              textAlign: "center",
            }}
          >
            <div style={{ color: CRIMSON, fontSize: 22, fontWeight: 900 }}>
              WITH 'FREE' SHIPPING
            </div>
            <div style={{ color: "#FFFFFF", fontSize: 60, fontWeight: 900, marginTop: 10 }}>
              RS. 550
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "20px 32px",
            borderRadius: 14,
            background: NEON_GREEN,
            color: "#030805",
            fontSize: 38,
            fontWeight: 900,
            textAlign: "center",
            boxShadow: `0 0 50px ${NEON_GREEN}`,
          }}
        >
          NET LOSS TO YOUR POCKET: + RS. 100
        </div>
      </div>
    );
  }

  // CUT 13: 'FREE' WORD ILLUSION WIREFRAME
  if (cutId === 13) {
    return (
      <div
        style={{
          width: 860,
          padding: 52,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${NEON_GREEN}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "16px 54px",
            borderRadius: 16,
            border: `4px dashed ${NEON_GREEN}`,
            color: NEON_GREEN,
            fontFamily: '"Arial Black", sans-serif',
            fontSize: 96,
            fontWeight: 900,
          }}
        >
          "FREE"
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900, marginTop: 28 }}>
          ILLUSION OF SAVING RS. 50 ➔ <span style={{ color: CRIMSON }}>COST YOU RS. 150</span>
        </div>
      </div>
    );
  }

  // CUT 15: SAVING RS. 50 QUESTION CARD
  if (cutId === 15) {
    return (
      <div
        style={{
          width: 860,
          padding: 50,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${GOLD}`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 24, fontWeight: 900, letterSpacing: 4 }}>
          YOUR LAST ONLINE ORDER
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 78,
            fontWeight: 900,
            color: NEON_GREEN,
            fontFamily: '"Arial Black", sans-serif',
          }}
        >
          TO SAVE RS. 50...
        </div>
      </div>
    );
  }

  // CUT 16: HOW MUCH EXTRA DID YOU BUY? (RS. ???)
  if (cutId === 16) {
    return (
      <div
        style={{
          width: 860,
          padding: 52,
          borderRadius: 28,
          background: PANEL_BG,
          border: `4px solid ${NEON_GREEN}`,
          boxShadow: `0 0 85px ${GREEN_GLOW}`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          UNPLANNED EXTRA CART VALUE
        </div>
        <div
          style={{
            marginTop: 22,
            display: "inline-block",
            padding: "18px 60px",
            borderRadius: 16,
            background: NEON_GREEN,
            color: "#030805",
            fontFamily: '"Arial Black", sans-serif',
            fontSize: 104,
            fontWeight: 900,
            boxShadow: `0 0 60px ${NEON_GREEN}`,
          }}
        >
          RS. ???
        </div>
      </div>
    );
  }

  // CUT 17: CLEAN SENPAISPIDER COMMENT BOX CTA
  return (
    <div
      style={{
        width: 880,
        padding: 52,
        borderRadius: 28,
        background: PANEL_BG,
        border: `4px solid ${NEON_GREEN}`,
        boxShadow: `0 0 90px ${GREEN_GLOW}`,
        textAlign: "center",
      }}
    >
      <div style={{ color: NEON_GREEN, fontSize: 28, fontWeight: 900, letterSpacing: 5 }}>
        [ CONFESSION BOX // COMMENTS ]
      </div>
      <div
        style={{
          marginTop: 26,
          padding: "32px 36px",
          borderRadius: 16,
          background: "#06090F",
          border: `2px solid ${NEON_GREEN}`,
          color: "#FFFFFF",
          fontSize: 40,
          fontWeight: 900,
          letterSpacing: 1,
        }}
      >
        "Maine RS. ___ ka extra saaman kharida tha."
      </div>
    </div>
  );
};

/* =========================================================================
   07. DARK ARCHITECTURAL GRID BACKGROUND
   ========================================================================= */

const SenpaiDarkBackdrop: React.FC<{ accent: string; frame: number }> = ({
  accent,
  frame,
}) => {
  const shift = (frame * 1.1) % 80;
  const dots = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: (i * 199 + 67) % WIDTH,
        y: (i * 263 + 41) % HEIGHT,
        s: 2 + (i % 3) * 1.5,
        v: 0.7 + (i % 4) * 0.3,
      })),
    []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accent}1F 0%, rgba(4,6,10,0.94) 62%, ${DARK_BG} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.12,
          backgroundImage: `
            linear-gradient(${accent}33 1px, transparent 1px),
            linear-gradient(90deg, ${accent}33 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          transform: `translateY(${shift}px)`,
        }}
      />
      {dots.map((d, i) => {
        const py = (d.y - frame * d.v + HEIGHT) % HEIGHT;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: py,
              width: d.s,
              height: d.s,
              background: NEON_GREEN,
              opacity: 0.25,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* =========================================================================
   08. MASTER COMPOSITION ORCHESTRATOR
   ========================================================================= */

const FreeShippingTrapReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeCut =
    CUTS.find((c) => sec >= c.startSec && sec < c.endSec) ??
    CUTS[CUTS.length - 1];

  const cutStartFrame = Math.round(activeCut.startSec * FPS);
  const localFrame = Math.max(0, frame - cutStartFrame);

  const progress = interpolate(frame, [0, DURATION], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <SenpaiDarkBackdrop accent={activeCut.accent} frame={frame} />

      {/* TOP 17-SEGMENT PROGRESS TIMELINE */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 48,
          right: 48,
          display: "flex",
          gap: 5,
          height: 5,
        }}
      >
        {CUTS.map((c) => {
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
                background: "rgba(255,255,255,0.14)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  background: NEON_GREEN,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* MINIMAL TELEMETRY HEADER */}
      <div
        style={{
          position: "absolute",
          top: 68,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "8px 22px",
            border: `2px solid ${activeCut.accent}`,
            background: "rgba(0,0,0,0.6)",
            color: activeCut.accent,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 4,
          }}
        >
          {activeCut.tag}
        </div>
        <div
          style={{
            color: "#64748B",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 4,
          }}
        >
          {String(activeCut.id).padStart(2, "0")} // 17
        </div>
      </div>

      {/* RENDER EITHER FULL-SCREEN TYPOGRAPHY OR SPLIT HEADLINE + VECTOR STAGE */}
      {activeCut.fullScreenTypo ? (
        <FullScreenTypographyStage cut={activeCut} localFrame={localFrame} />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              top: 175,
              left: 48,
              right: 48,
            }}
          >
            <VariedTopHeadline cut={activeCut} localFrame={localFrame} />
            <div
              style={{
                marginTop: 16,
                textAlign: "center",
                fontSize: 20,
                fontWeight: 800,
                color: "#64748B",
                letterSpacing: 5,
              }}
            >
              {activeCut.subLabel}
            </div>
          </div>

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
            <CleanVectorStage cutId={activeCut.id} localFrame={localFrame} />
          </div>
        </>
      )}

      {/* BOTTOM NEON GREEN PROGRESS BAR */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 8,
          width: `${progress}%`,
          background: NEON_GREEN,
          boxShadow: `0 0 25px ${NEON_GREEN}`,
        }}
      />

      {/* ===================================================================
          CRISP MONEY & TACTILE UI SFX TIMELINE
         =================================================================== */}
      {CUTS.map((c) => (
        <React.Fragment key={`sfx-${c.id}`}>
          <Sequence
            from={Math.round(c.startSec * FPS)}
            durationInFrames={35}
            layout="none"
          >
            <Audio src={SFX[c.primarySfx]} volume={0.8} />
          </Sequence>

          {c.moneySfx && (
            <Sequence
              from={Math.round((c.startSec + c.moneySfx.offsetSec) * FPS)}
              durationInFrames={35}
              layout="none"
            >
              <Audio src={SFX[c.moneySfx.kind]} volume={0.78} />
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
      component={FreeShippingTrapReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
