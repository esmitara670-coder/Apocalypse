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

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2430; // 40.5s @ 60 FPS

const NEON_GREEN = "#00FF66";
const GREEN_GLOW = "rgba(0, 255, 102, 0.35)";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const CYAN = "#00F0FF";
const DARK_BG = "#04060A";
const PANEL_BG = "rgba(10, 15, 24, 0.94)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

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
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
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
      const f1 = p < 0.18 ? 1480 : 2960;
      const f2 = p < 0.18 ? 2217 : 4435;
      const subP = p < 0.18 ? p / 0.18 : (p - 0.18) / 0.82;
      w = Math.sin(2 * Math.PI * f1 * t) * 0.55 + Math.sin(2 * Math.PI * f2 * t) * 0.35;
      env = Math.exp(-subP * 7.5);
    } else if (kind === "coinClink") {
      w = Math.sin(2 * Math.PI * 2637 * t) * 0.6 + Math.sin(2 * Math.PI * 3951 * t) * 0.35;
      env = Math.exp(-p * 9.5);
    } else if (kind === "markerSwipe") {
      const glideF = 260 + Math.sin(p * Math.PI) * 380;
      w = Math.sin(2 * Math.PI * glideF * t) * 0.6 + Math.sin(2 * Math.PI * (glideF * 1.5) * t) * 0.25;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (kind === "mechThock") {
      const bodyF = 185 * Math.exp(-p * 12) + 60;
      const click = Math.sin(2 * Math.PI * 1750 * t) * Math.exp(-p * 26);
      w = Math.sin(2 * Math.PI * bodyF * t) * 0.8 + click * 0.35;
      env = Math.exp(-p * 13);
    } else if (kind === "subDrop") {
      const f = 110 * Math.pow(1 - p * 0.65, 1.4) + 34;
      w = Math.sin(2 * Math.PI * f * t) * 0.88;
      env = Math.pow(1 - p, 1.5);
    } else if (kind === "cardSnap") {
      const f = p < 0.4 ? 420 : 640;
      const lp = p < 0.4 ? p / 0.4 : (p - 0.4) / 0.6;
      w = Math.sin(2 * Math.PI * f * t) * 0.75;
      env = Math.exp(-lp * 12);
    } else {
      const f = 310 + Math.pow(p, 1.5) * 620;
      w = Math.sin(2 * Math.PI * f * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 0.85);
    }

    const out = clamp(w * env * 0.74, -1, 1);
    view.setInt16(44 + i * 2, out * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
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

type TextStyle = "wordStagger" | "highlighter" | "typewriter" | "flip3D" | "slideSplit" | "letterSnap";

type CutSpec = {
  id: number;
  startSec: number;
  endSec: number;
  tag: string;
  titleTop: string;
  titleMain: string;
  subLabel: string;
  accent: string;
  textStyle: TextStyle;
  fullScreenTypo?: boolean;
  primarySfx: SfxKind;
  moneySfx?: { offsetSec: number; kind: SfxKind };
};

const CUTS: CutSpec[] = [
  { id: 1, startSec: 0.0, endSec: 2.2, tag: "SEQUENCE // 01", titleTop: "BADI COMPANIES AAPKO", titleMain: "'FREE' KE NAAM PAR KAISE LOOT-TI HAIN?", subLabel: "DARK MARKETING EXPOSED", accent: NEON_GREEN, textStyle: "highlighter", fullScreenTypo: true, primarySfx: "markerSwipe", moneySfx: { offsetSec: 0.3, kind: "subDrop" } },
  { id: 2, startSec: 2.2, endSec: 4.2, tag: "SEQUENCE // 02", titleTop: "CHALO AAJ", titleMain: "EXACTLY DEKHTE HAIN.", subLabel: "STEP-BY-STEP BREAKDOWN", accent: NEON_GREEN, textStyle: "wordStagger", fullScreenTypo: true, primarySfx: "mechThock", moneySfx: { offsetSec: 0.22, kind: "cardSnap" } },
  { id: 3, startSec: 4.2, endSec: 6.4, tag: "SCENARIO // 03", titleTop: "MAAN LO AAP ONLINE EK", titleMain: "T-SHIRT KHARID RAHE HO", subLabel: "STANDARD E-COMMERCE CHECKOUT", accent: CYAN, textStyle: "slideSplit", primarySfx: "cardSnap" },
  { id: 4, startSec: 6.4, endSec: 8.6, tag: "ITEM PRICE // 04", titleTop: "T-SHIRT KI PRICE HAI", titleMain: "RS. 400", subLabel: "BASE PRODUCT VALUE", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "cashKaching" },
  { id: 5, startSec: 8.6, endSec: 10.8, tag: "SHIPPING FEE // 05", titleTop: "AUR DELIVERY CHARGE HAI", titleMain: "+ RS. 50", subLabel: "EXTRA SHIPPING COST", accent: CRIMSON, textStyle: "flip3D", primarySfx: "coinClink" },
  { id: 6, startSec: 10.8, endSec: 13.0, tag: "CART TOTAL // 06", titleTop: "AAPKA TOTAL BILL HUA", titleMain: "RS. 450", subLabel: "RS. 400 ITEM + RS. 50 SHIPPING", accent: NEON_GREEN, textStyle: "letterSnap", primarySfx: "coinClink", moneySfx: { offsetSec: 0.25, kind: "markerSwipe" } },
  { id: 7, startSec: 13.0, endSec: 15.5, tag: "PAIN POINT // 07", titleTop: "AAPKO LAGTA HAI KI RS. 50 DENA", titleMain: "PURE WASTE HAI", subLabel: "LOSS AVERSION TRIGGERED", accent: CRIMSON, textStyle: "wordStagger", primarySfx: "subDrop" },
  { id: 8, startSec: 15.5, endSec: 18.2, tag: "THE BAIT BANNER // 08", titleTop: "TABHI SCREEN PAR BANNER DIKHTA HAI:", titleMain: "FREE SHIPPING ABOVE RS. 500", subLabel: "ADD RS. 100 MORE TO UNLOCK", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "markerSwipe", moneySfx: { offsetSec: 0.3, kind: "coinClink" } },
  { id: 9, startSec: 18.2, endSec: 20.6, tag: "BRAIN LOGIC // 09", titleTop: "AB US RS. 50 KI DELIVERY KO", titleMain: "BACHANE KE LIYE...", subLabel: "MISSION: AVOID SHIPPING FEE", accent: GOLD, textStyle: "typewriter", primarySfx: "mechThock", moneySfx: { offsetSec: 0.2, kind: "coinClink" } },
  { id: 10, startSec: 20.6, endSec: 23.4, tag: "THE TRAP ADDITION // 10", titleTop: "AAP BEECH MEIN ADD KAR LETE HO:", titleMain: "RS. 150 KA EXTRA ITEM", subLabel: "UNPLANNED PURCHASE INSERTED", accent: NEON_GREEN, textStyle: "flip3D", primarySfx: "cardSnap", moneySfx: { offsetSec: 0.25, kind: "cashKaching" } },
  { id: 11, startSec: 23.4, endSec: 26.0, tag: "FINAL BILL // 11", titleTop: "RESULT? AAPKA TOTAL BILL BANA", titleMain: "RS. 550", subLabel: "SHIPPING: RS. 0 [FREE] • TOTAL: RS. 550", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "cashKaching" },
  { id: 12, startSec: 26.0, endSec: 28.6, tag: "PROFIT MATH // 12", titleTop: "COMPANY NE CHALAKI SE AAPKA KHARCH", titleMain: "RS. 100 BADHA DIYA", subLabel: "RS. 450 OLD BILL -> RS. 550 NEW BILL", accent: CRIMSON, textStyle: "slideSplit", primarySfx: "coinClink", moneySfx: { offsetSec: 0.28, kind: "subDrop" } },
  { id: 13, startSec: 28.6, endSec: 31.2, tag: "THE ILLUSION // 13", titleTop: "SIRF US 'FREE' WORD KA", titleMain: "ILLUSION BANAKAR", subLabel: "PSYCHOLOGICAL TRIGGER WORD", accent: NEON_GREEN, textStyle: "letterSnap", primarySfx: "markerSwipe" },
  { id: 14, startSec: 31.2, endSec: 33.6, tag: "CONCEPT LOCKED // 14", titleTop: "ISE KEHTE HAIN", titleMain: "THE FREE SHIPPING TRAP", subLabel: "E-COMMERCE DARK PATTERN #04", accent: CYAN, textStyle: "wordStagger", fullScreenTypo: true, primarySfx: "subDrop", moneySfx: { offsetSec: 0.22, kind: "cardSnap" } },
  { id: 15, startSec: 33.6, endSec: 36.0, tag: "REALITY CHECK // 15", titleTop: "PICHHLI BAAR US RS. 50 KI", titleMain: "DELIVERY BACHANE KE LIYE...", subLabel: "BE 100% HONEST WITH YOURSELF", accent: GOLD, textStyle: "typewriter", primarySfx: "mechThock" },
  { id: 16, startSec: 36.0, endSec: 38.2, tag: "YOUR BILL // 16", titleTop: "AAPNE KITNE RUPEES KA", titleMain: "FALTU SAAMAN KHARIDA THA?", subLabel: "RS. 200? RS. 500? RS. 1,000?", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "cashKaching" },
  { id: 17, startSec: 38.2, endSec: 40.5, tag: "COMMENT BELOW // 17", titleTop: "APNI REALITY", titleMain: "COMMENT MEIN BATAO.", subLabel: "DROP YOUR EXTRA SPEND AMOUNT", accent: NEON_GREEN, textStyle: "wordStagger", primarySfx: "uiPop", moneySfx: { offsetSec: 0.25, kind: "coinClink" } },
];

const highlightMoneyTokens = (text: string) => {
  const parts = text.split(/(RS\.\s*\d+|'FREE'|FREE|\+\s*RS\.\s*\d+)/g);
  return parts.map((part, i) => {
    if (!/^(RS\.\s*\d+|'FREE'|FREE|\+\s*RS\.\s*\d+)$/.test(part)) {
      return <React.Fragment key={i}>{part}</React.Fragment>;
    }
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

const FullScreenTypographyStage: React.FC<{ cut: CutSpec; localFrame: number }> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();
  const words = cut.titleMain.split(" ");
  const sweep = interpolate(localFrame, [8, 34], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 68px", textAlign: "center" }}>
      <div style={{ padding: "10px 28px", border: `2px solid ${NEON_GREEN}`, background: "rgba(0, 255, 102, 0.08)", color: NEON_GREEN, fontSize: 24, fontWeight: 900, letterSpacing: 6, marginBottom: 36 }}>
        [ {cut.titleTop} ]
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px 24px", maxWidth: 940 }}>
        {words.map((w, idx) => {
          const wSpring = spring({ frame: Math.max(0, localFrame - idx * 4), fps, config: { damping: 12, stiffness: 200, mass: 0.7 } });
          const isGreen = w.includes("FREE") || w.includes("EXACTLY") || w.includes("TRAP");
          return (
            <span key={idx} style={{ display: "inline-block", overflow: "hidden", padding: "4px 6px" }}>
              <span
                style={{
                  display: "inline-block",
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  fontSize: cut.id === 2 ? 104 : 86,
                  fontWeight: 900,
                  lineHeight: 1.04,
                  color: isGreen ? "#040806" : "#FFFFFF",
                  padding: isGreen ? "4px 22px" : "0",
                  borderRadius: 12,
                  background: isGreen ? `linear-gradient(90deg, ${NEON_GREEN} ${sweep}%, rgba(0,255,102,0.15) ${sweep}%)` : "transparent",
                  boxShadow: isGreen ? `0 0 55px ${NEON_GREEN}88` : "none",
                  transform: `translateY(${(1 - wSpring) * 95}px)`,
                }}
              >
                {w}
              </span>
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 20, color: "#64748B", fontSize: 22, fontWeight: 800, letterSpacing: 5 }}>
        <div style={{ width: 60, height: 2, background: NEON_GREEN }} />
        <span>{cut.subLabel}</span>
        <div style={{ width: 60, height: 2, background: NEON_GREEN }} />
      </div>
    </AbsoluteFill>
  );
};

const VariedTopHeadline: React.FC<{ cut: CutSpec; localFrame: number }> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();

  if (cut.textStyle === "highlighter") {
    const barW = interpolate(localFrame, [4, 28], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#94A3B8", letterSpacing: 4, marginBottom: 12 }}>{cut.titleTop}</div>
        <div style={{ position: "relative", display: "inline-block", padding: "8px 32px" }}>
          <div style={{ position: "absolute", left: 0, top: 2, bottom: 2, width: `${barW}%`, background: NEON_GREEN, borderRadius: 12, boxShadow: `0 0 50px ${NEON_GREEN}99` }} />
          <span style={{ position: "relative", fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 66, fontWeight: 900, color: barW > 45 ? "#040806" : "#FFFFFF" }}>
            {cut.titleMain}
          </span>
        </div>
      </div>
    );
  }

  if (cut.textStyle === "typewriter") {
    const len = cut.titleMain.length;
    const chars = Math.min(len, Math.floor(interpolate(localFrame, [2, 26], [0, len], { extrapolateRight: "clamp" })));
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: NEON_GREEN, letterSpacing: 5, fontFamily: "monospace", marginBottom: 10 }}>{"> "}{cut.titleTop}</div>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 64, fontWeight: 900, color: "#FFFFFF" }}>
          {highlightMoneyTokens(cut.titleMain.slice(0, chars))}
          <span style={{ color: NEON_GREEN, marginLeft: 6 }}>_</span>
        </div>
      </div>
    );
  }

  if (cut.textStyle === "flip3D") {
    const f1 = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 165 } });
    return (
      <div style={{ textAlign: "center", perspective: 900 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#CBD5E1", letterSpacing: 4, marginBottom: 10 }}>{cut.titleTop}</div>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 66, fontWeight: 900, color: "#FFFFFF", transformOrigin: "50% 0%", transform: `rotateX(${(1 - f1) * 85}deg)`, opacity: f1 }}>
          {highlightMoneyTokens(cut.titleMain)}
        </div>
      </div>
    );
  }

  if (cut.textStyle === "slideSplit") {
    const s = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 170 } });
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#94A3B8", letterSpacing: 4, transform: `translateX(${(1 - s) * -140}px)`, opacity: s }}>{cut.titleTop}</div>
        <div style={{ marginTop: 10, fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 64, fontWeight: 900, color: "#FFFFFF", transform: `translateX(${(1 - s) * 140}px)`, opacity: s }}>
          {highlightMoneyTokens(cut.titleMain)}
        </div>
      </div>
    );
  }

  if (cut.textStyle === "letterSnap") {
    const snap = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 175 } });
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#94A3B8", letterSpacing: 4 }}>{cut.titleTop}</div>
        <div style={{ marginTop: 10, fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 68, fontWeight: 900, color: "#FFFFFF", letterSpacing: `${interpolate(snap, [0, 1], [22, 0])}px`, opacity: snap }}>
          {highlightMoneyTokens(cut.titleMain)}
        </div>
      </div>
    );
  }

  const words = cut.titleMain.split(" ");
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 900, color: "#94A3B8", letterSpacing: 4, marginBottom: 10 }}>{cut.titleTop}</div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px" }}>
        {words.map((w, i) => {
          const ws = spring({ frame: Math.max(0, localFrame - i * 4), fps, config: { damping: 12, stiffness: 190 } });
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden" }}>
              <span style={{ display: "inline-block", fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 64, fontWeight: 900, color: "#FFFFFF", transform: `translateY(${(1 - ws) * 75}px)` }}>
                {highlightMoneyTokens(w)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

const CleanVectorStage: React.FC<{ cutId: number; localFrame: number }> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 170 } });

  if (cutId === 3) {
    return (
      <div style={{ width: 840, padding: 48, borderRadius: 28, background: PANEL_BG, border: `2px solid ${CYAN}88`, transform: `scale(${0.92 + pop * 0.08})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <div style={{ width: 240, height: 240, borderRadius: 20, background: "#070B12", border: `2px solid ${CYAN}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="160" height="160" viewBox="0 0 170 170">
              <path d="M45 25 L65 25 C72 38 98 38 105 25 L125 25 L155 55 L135 80 L120 65 L120 145 L50 145 L50 65 L35 80 L15 55 Z" fill="rgba(0, 240, 255, 0.12)" stroke={CYAN} strokeWidth="4" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>ESSENTIAL COTTON TEE</div>
            <div style={{ color: "#FFFFFF", fontSize: 44, fontWeight: 900, marginTop: 8 }}>BLACK OVERSIZED FIT</div>
            <div style={{ marginTop: 28, display: "inline-block", padding: "14px 32px", borderRadius: 10, background: NEON_GREEN, color: "#030805", fontSize: 26, fontWeight: 900 }}>
              SELECTED FOR CHECKOUT
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cutId === 4 || cutId === 11) {
    const target = cutId === 4 ? 400 : 550;
    const startVal = cutId === 4 ? 100 : 450;
    const val = Math.floor(interpolate(localFrame, [0, 30], [startVal, target], { extrapolateRight: "clamp" }));
    return (
      <div style={{ width: 840, padding: 54, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 85px ${GREEN_GLOW}`, textAlign: "center" }}>
        <div style={{ color: "#94A3B8", fontSize: 25, fontWeight: 900, letterSpacing: 5 }}>
          {cutId === 4 ? "ITEM SUBTOTAL" : "FINAL AMOUNT PAID"}
        </div>
        <div style={{ marginTop: 24, display: "inline-block", padding: "18px 60px", borderRadius: 18, background: NEON_GREEN, color: "#030805", fontFamily: '"Arial Black", sans-serif', fontSize: 116, fontWeight: 900, boxShadow: `0 0 65px ${NEON_GREEN}` }}>
          RS. {val}
        </div>
      </div>
    );
  }

  if (cutId === 5) {
    return (
      <div style={{ width: 840, padding: 48, borderRadius: 28, background: PANEL_BG, border: `3px solid ${CRIMSON}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "24px 32px", borderRadius: 16, background: "#080C14", marginBottom: 22, color: "#FFF", fontSize: 34, fontWeight: 900 }}>
          <span>ITEM PRICE</span>
          <span>RS. 400</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 32px", borderRadius: 16, background: "rgba(255,42,84,0.14)", border: `3px solid ${CRIMSON}` }}>
          <span style={{ color: "#FFF", fontSize: 34, fontWeight: 900 }}>DELIVERY FEE</span>
          <span style={{ padding: "8px 24px", borderRadius: 10, background: NEON_GREEN, color: "#030805", fontSize: 42, fontWeight: 900, boxShadow: `0 0 35px ${NEON_GREEN}` }}>+ RS. 50</span>
        </div>
      </div>
    );
  }

  if (cutId === 6) {
    return (
      <div style={{ width: 860, padding: 50, borderRadius: 28, background: PANEL_BG, border: `3px solid ${NEON_GREEN}`, textAlign: "center" }}>
        <div style={{ fontSize: 42, fontWeight: 900, color: "#CBD5E1", marginBottom: 26 }}>RS. 400 + RS. 50 =</div>
        <div style={{ display: "inline-block", padding: "20px 64px", borderRadius: 18, background: NEON_GREEN, color: "#030805", fontFamily: '"Arial Black", sans-serif', fontSize: 108, fontWeight: 900, boxShadow: `0 0 65px ${NEON_GREEN}` }}>
          RS. 450
        </div>
      </div>
    );
  }

  if (cutId === 7) {
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `3px solid ${CRIMSON}`, textAlign: "center" }}>
        <div style={{ fontSize: 78, fontWeight: 900, color: "#FFFFFF", margin: "18px 0", textDecoration: "line-through", opacity: 0.45 }}>DELIVERY: RS. 50</div>
        <div style={{ display: "inline-block", padding: "16px 42px", borderRadius: 12, background: CRIMSON, color: "#FFFFFF", fontSize: 40, fontWeight: 900, letterSpacing: 3 }}>
          [ 100% MONEY WASTE ]
        </div>
      </div>
    );
  }

  if (cutId === 8) {
    const barFill = interpolate(localFrame, [0, 45], [30, 80], { extrapolateRight: "clamp" });
    return (
      <div style={{ width: 880, padding: 48, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 85px ${GREEN_GLOW}` }}>
        <div style={{ padding: "18px 28px", borderRadius: 14, background: NEON_GREEN, color: "#030805", fontSize: 32, fontWeight: 900, textAlign: "center", boxShadow: `0 0 40px ${NEON_GREEN}` }}>
          FREE SHIPPING ON ORDERS ABOVE RS. 500
        </div>
        <div style={{ marginTop: 34, width: "100%", height: 34, borderRadius: 17, background: "#090E17", border: `2px solid ${NEON_GREEN}66`, overflow: "hidden" }}>
          <div style={{ width: `${barFill}%`, height: "100%", background: NEON_GREEN }} />
        </div>
        <div style={{ marginTop: 20, textAlign: "center", color: GOLD, fontSize: 28, fontWeight: 900 }}>
          ADD RS. 100 MORE TO UNLOCK FREE DELIVERY
        </div>
      </div>
    );
  }

  if (cutId === 9 || cutId === 15) {
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `3px solid ${GOLD}`, textAlign: "center" }}>
        <div style={{ color: "#94A3B8", fontSize: 25, fontWeight: 900, letterSpacing: 4 }}>CHECKOUT TARGET</div>
        <div style={{ marginTop: 22, display: "inline-block", padding: "20px 48px", borderRadius: 16, border: `4px solid ${NEON_GREEN}`, color: NEON_GREEN, fontSize: 68, fontWeight: 900, fontFamily: '"Arial Black", sans-serif' }}>
          SAVE RS. 50 FEE
        </div>
      </div>
    );
  }

  if (cutId === 10) {
    const midInsert = spring({ frame: Math.max(0, localFrame - 8), fps, config: { damping: 11, stiffness: 190 } });
    return (
      <div style={{ width: 980, display: "flex", gap: 22, alignItems: "center" }}>
        <div style={{ flex: 1, padding: "38px 20px", borderRadius: 24, background: PANEL_BG, border: "2px solid #334155", textAlign: "center", opacity: 0.75 }}>
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>ITEM 01</div>
          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, margin: "12px 0" }}>T-SHIRT</div>
          <div style={{ color: "#CBD5E1", fontSize: 52, fontWeight: 900 }}>RS. 400</div>
        </div>
        <div style={{ flex: 1.25, padding: "46px 22px", borderRadius: 28, background: "#051F12", border: `5px solid ${NEON_GREEN}`, boxShadow: `0 0 95px ${NEON_GREEN}88`, textAlign: "center", transform: `translateY(${(1 - midInsert) * 90}px) scale(${0.84 + midInsert * 0.22})`, zIndex: 10 }}>
          <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 8, background: NEON_GREEN, color: "#030805", fontSize: 20, fontWeight: 900, marginBottom: 14 }}>+ EXTRA ITEM ADDED</div>
          <div style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900 }}>EXTRA ADD-ON</div>
          <div style={{ marginTop: 12, color: NEON_GREEN, fontFamily: '"Arial Black", sans-serif', fontSize: 78, fontWeight: 900 }}>RS. 150</div>
        </div>
        <div style={{ flex: 1, padding: "38px 20px", borderRadius: 24, background: PANEL_BG, border: `2px solid ${NEON_GREEN}66`, textAlign: "center", opacity: 0.85 }}>
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>SHIPPING</div>
          <div style={{ color: NEON_GREEN, fontSize: 32, fontWeight: 900, margin: "12px 0" }}>UNLOCKED</div>
          <div style={{ color: NEON_GREEN, fontSize: 52, fontWeight: 900 }}>FREE</div>
        </div>
      </div>
    );
  }

  if (cutId === 12) {
    return (
      <div style={{ width: 880, padding: 46, borderRadius: 28, background: PANEL_BG, border: `3px solid ${CRIMSON}` }}>
        <div style={{ display: "flex", gap: 28, marginBottom: 30 }}>
          <div style={{ flex: 1, padding: 32, borderRadius: 20, background: "#080C14", border: "2px solid #334155", textAlign: "center" }}>
            <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>OLD BILL</div>
            <div style={{ color: "#FFFFFF", fontSize: 58, fontWeight: 900, marginTop: 10 }}>RS. 450</div>
          </div>
          <div style={{ flex: 1, padding: 32, borderRadius: 20, background: "rgba(255,42,84,0.14)", border: `3px solid ${CRIMSON}`, textAlign: "center" }}>
            <div style={{ color: CRIMSON, fontSize: 22, fontWeight: 900 }}>NEW BILL</div>
            <div style={{ color: "#FFFFFF", fontSize: 58, fontWeight: 900, marginTop: 10 }}>RS. 550</div>
          </div>
        </div>
        <div style={{ padding: "20px 32px", borderRadius: 14, background: NEON_GREEN, color: "#030805", fontSize: 38, fontWeight: 900, textAlign: "center", boxShadow: `0 0 50px ${NEON_GREEN}` }}>
          EXTRA SPENT FROM YOUR POCKET: + RS. 100
        </div>
      </div>
    );
  }

  if (cutId === 13) {
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `3px solid ${NEON_GREEN}`, textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "16px 54px", borderRadius: 16, border: `4px dashed ${NEON_GREEN}`, color: NEON_GREEN, fontFamily: '"Arial Black", sans-serif', fontSize: 94, fontWeight: 900 }}>
          "FREE"
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, marginTop: 26 }}>
          TO SAVE RS. 50 ➔ <span style={{ color: CRIMSON }}>YOU SPENT RS. 150</span>
        </div>
      </div>
    );
  }

  if (cutId === 16) {
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 85px ${GREEN_GLOW}`, textAlign: "center" }}>
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>UNPLANNED EXTRA CART VALUE</div>
        <div style={{ marginTop: 22, display: "inline-block", padding: "18px 60px", borderRadius: 16, background: NEON_GREEN, color: "#030805", fontFamily: '"Arial Black", sans-serif', fontSize: 104, fontWeight: 900 }}>
          RS. ???
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 880, padding: 52, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 90px ${GREEN_GLOW}`, textAlign: "center" }}>
      <div style={{ color: NEON_GREEN, fontSize: 28, fontWeight: 900, letterSpacing: 5 }}>[ CONFESSION BOX // COMMENTS ]</div>
      <div style={{ marginTop: 26, padding: "32px 36px", borderRadius: 16, background: "#06090F", border: `2px solid ${NEON_GREEN}`, color: "#FFFFFF", fontSize: 38, fontWeight: 900 }}>
        "Maine RS. ___ ka extra saaman kharida tha."
      </div>
    </div>
  );
};

const FreeShippingTrapReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeCut = CUTS.find((c) => sec >= c.startSec && sec < c.endSec) ?? CUTS[CUTS.length - 1];
  const localFrame = Math.max(0, frame - Math.round(activeCut.startSec * FPS));
  const progress = interpolate(frame, [0, DURATION], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = (frame * 1.1) % 80;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${activeCut.accent}1F 0%, rgba(4,6,10,0.94) 62%, ${DARK_BG} 100%)` }} />
      <AbsoluteFill style={{ opacity: 0.12, backgroundImage: `linear-gradient(${activeCut.accent}33 1px, transparent 1px), linear-gradient(90deg, ${activeCut.accent}33 1px, transparent 1px)`, backgroundSize: "80px 80px", transform: `translateY(${shift}px)` }} />

      <div style={{ position: "absolute", top: 28, left: 48, right: 48, display: "flex", gap: 5, height: 5 }}>
        {CUTS.map((c) => {
          const fill = sec >= c.endSec ? 1 : sec <= c.startSec ? 0 : (sec - c.startSec) / (c.endSec - c.startSec);
          return (
            <div key={c.id} style={{ flex: 1, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: NEON_GREEN }} />
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", top: 68, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ padding: "8px 22px", border: `2px solid ${activeCut.accent}`, background: "rgba(0,0,0,0.6)", color: activeCut.accent, fontSize: 19, fontWeight: 900, letterSpacing: 4 }}>
          {activeCut.tag}
        </div>
        <div style={{ color: "#64748B", fontSize: 20, fontWeight: 900, letterSpacing: 4 }}>
          {String(activeCut.id).padStart(2, "0")} // 17
        </div>
      </div>

      {activeCut.fullScreenTypo ? (
        <FullScreenTypographyStage cut={activeCut} localFrame={localFrame} />
      ) : (
        <>
          <div style={{ position: "absolute", top: 175, left: 48, right: 48 }}>
            <VariedTopHeadline cut={activeCut} localFrame={localFrame} />
            <div style={{ marginTop: 16, textAlign: "center", fontSize: 20, fontWeight: 800, color: "#64748B", letterSpacing: 5 }}>
              {activeCut.subLabel}
            </div>
          </div>
          <div style={{ position: "absolute", top: 480, left: 0, right: 0, bottom: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CleanVectorStage cutId={activeCut.id} localFrame={localFrame} />
          </div>
        </>
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${progress}%`, background: NEON_GREEN, boxShadow: `0 0 25px ${NEON_GREEN}` }} />

      {CUTS.map((c) => (
        <React.Fragment key={`sfx-${c.id}`}>
          <Sequence from={Math.round(c.startSec * FPS)} durationInFrames={35} layout="none">
            <Audio src={SFX[c.primarySfx]} volume={0.8} />
          </Sequence>
          {c.moneySfx && (
            <Sequence from={Math.round((c.startSec + c.moneySfx.offsetSec) * FPS)} durationInFrames={35} layout="none">
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
