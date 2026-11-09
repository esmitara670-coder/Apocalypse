import React from "react";
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
const DURATION = 2520; // 42.0 Seconds @ 60 FPS

const NEON_GREEN = "#00FF66";
const GREEN_GLOW = "rgba(0, 255, 102, 0.38)";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const CYAN = "#00F0FF";
const DARK_BG = "#04060A";
const PANEL_BG = "rgba(10, 15, 24, 0.95)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

type SfxKind =
  | "cashKaching"
  | "gemShimmer"
  | "coinClink"
  | "markerSwipe"
  | "mechThock"
  | "subDrop"
  | "cardSnap"
  | "alarmPulse";

function buildCrispSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations: Record<SfxKind, number> = {
    cashKaching: 0.5,
    gemShimmer: 0.48,
    coinClink: 0.32,
    markerSwipe: 0.24,
    mechThock: 0.14,
    subDrop: 0.45,
    cardSnap: 0.2,
    alarmPulse: 0.36,
  };
  const totalSamples = Math.floor(sampleRate * durations[kind]);
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

    if (kind === "cashKaching") {
      const f1 = p < 0.18 ? 1480 : 2960;
      const f2 = p < 0.18 ? 2217 : 4435;
      const sp = p < 0.18 ? p / 0.18 : (p - 0.18) / 0.82;
      w = Math.sin(2 * Math.PI * f1 * t) * 0.55 + Math.sin(2 * Math.PI * f2 * t) * 0.35;
      env = Math.exp(-sp * 7.5);
    } else if (kind === "gemShimmer") {
      const notes = [1318.5, 1760.0, 2217.4, 2637.0];
      const idx = Math.min(3, Math.floor(p * 4));
      const nf = notes[idx];
      const sp = (p * 4) % 1;
      w = Math.sin(2 * Math.PI * nf * t) * 0.6 + Math.sin(2 * Math.PI * nf * 2 * t) * 0.25;
      env = Math.exp(-sp * 5.5) * (1 - p * 0.25);
    } else if (kind === "coinClink") {
      w = Math.sin(2 * Math.PI * 2637 * t) * 0.6 + Math.sin(2 * Math.PI * 3951 * t) * 0.35;
      env = Math.exp(-p * 9.5);
    } else if (kind === "markerSwipe") {
      const gf = 260 + Math.sin(p * Math.PI) * 380;
      w = Math.sin(2 * Math.PI * gf * t) * 0.65;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (kind === "mechThock") {
      const bf = 185 * Math.exp(-p * 12) + 60;
      w = Math.sin(2 * Math.PI * bf * t) * 0.8 + Math.sin(2 * Math.PI * 1750 * t) * Math.exp(-p * 26) * 0.35;
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
      const f = p < 0.5 ? 520 : 380;
      w = Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.35 + Math.sin(2 * Math.PI * f * t) * 0.5;
      env = Math.pow(1 - p, 1.2);
    }
    view.setInt16(44 + i * 2, clamp(w * env * 0.75, -1, 1) * 32767, true);
  }
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX: Record<SfxKind, string> = {
  cashKaching: buildCrispSfx("cashKaching"),
  gemShimmer: buildCrispSfx("gemShimmer"),
  coinClink: buildCrispSfx("coinClink"),
  markerSwipe: buildCrispSfx("markerSwipe"),
  mechThock: buildCrispSfx("mechThock"),
  subDrop: buildCrispSfx("subDrop"),
  cardSnap: buildCrispSfx("cardSnap"),
  alarmPulse: buildCrispSfx("alarmPulse"),
};

type TextStyle = "highlighter" | "wordStagger" | "typewriter" | "flip3D" | "slideSplit" | "letterSnap";

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
  primarySfx: SfxKind;
  extraSfx?: { offsetSec: number; kind: SfxKind };
};

const CUTS: CutSpec[] = [
  { id: 1, startSec: 0.0, endSec: 2.4, tag: "HOOK // 01", titleTop: "APPS AAPSE DIRECT PAISE LENE KE BAJAYE", titleMain: "'GEMS' YA 'COINS'", subLabel: "DARK MONETIZATION SECRET", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "markerSwipe", extraSfx: { offsetSec: 0.25, kind: "gemShimmer" } },
  { id: 2, startSec: 2.4, endSec: 4.6, tag: "HOOK // 02", titleTop: "KHARIDNE PAR KYUN", titleMain: "MAJBOOR KARTI HAIN?", subLabel: "PSYCHOLOGICAL CURRENCY TRAP", accent: CRIMSON, textStyle: "slideSplit", primarySfx: "subDrop", extraSfx: { offsetSec: 0.22, kind: "cardSnap" } },
  { id: 3, startSec: 4.6, endSec: 6.8, tag: "HOOK // 03", titleTop: "CHALO AAJ INKA", titleMain: "SABSE BADA SCAM DEKHTE HAIN.", subLabel: "STEP-BY-STEP BREAKDOWN", accent: NEON_GREEN, textStyle: "wordStagger", primarySfx: "mechThock", extraSfx: { offsetSec: 0.24, kind: "subDrop" } },
  { id: 4, startSec: 6.8, endSec: 9.2, tag: "IN-APP STORE // 04", titleTop: "MAAN LO AAPKO KISI APP MEIN", titleMain: "PREMIUM ITEM KHARIDNA HAI", subLabel: "DIGITAL STOREFRONT CHECKOUT", accent: CYAN, textStyle: "flip3D", primarySfx: "cardSnap" },
  { id: 5, startSec: 9.2, endSec: 11.4, tag: "REAL VALUE // 05", titleTop: "USKI ASLI KEEMAT HAI", titleMain: "RS. 1000", subLabel: "ACTUAL CASH PRICE", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "cashKaching" },
  { id: 6, startSec: 11.4, endSec: 13.8, tag: "DIRECT PAY // 06", titleTop: "AGAR SCREEN PAR DIRECT LIKHA HO:", titleMain: "PAY RS. 1000", subLabel: "BRAIN INSTANTLY ALERTS YOU", accent: CRIMSON, textStyle: "typewriter", primarySfx: "alarmPulse", extraSfx: { offsetSec: 0.25, kind: "mechThock" } },
  { id: 7, startSec: 13.8, endSec: 16.5, tag: "NEURO RESPONSE // 07", titleTop: "DIRECT CASH DENE PAR TRIGGER HOTA HAI:", titleMain: "PAIN OF PAYING", subLabel: "BRAIN LOSS-AVERSION ALARM: 98%", accent: CRIMSON, textStyle: "letterSnap", primarySfx: "subDrop", extraSfx: { offsetSec: 0.25, kind: "alarmPulse" } },
  { id: 8, startSec: 16.5, endSec: 19.2, tag: "DARK PATTERN // 08", titleTop: "ISI DARD KO MITAANE KE LIYE AATA HAI:", titleMain: "TOKENIZATION", subLabel: "PAIN RECEPTORS NUMBED TO 0%", accent: CYAN, textStyle: "slideSplit", primarySfx: "markerSwipe" },
  { id: 9, startSec: 19.2, endSec: 22.0, tag: "CURRENCY SWAP // 09", titleTop: "AAPKE RS. 1000 CONVERT HOTE HAIN:", titleMain: "1000 GLOWING GEMS MEIN", subLabel: "REAL MONEY -> FAKE DIGITAL TOKENS", accent: NEON_GREEN, textStyle: "flip3D", primarySfx: "gemShimmer", extraSfx: { offsetSec: 0.28, kind: "cashKaching" } },
  { id: 10, startSec: 22.0, endSec: 24.8, tag: "ZERO PAIN // 10", titleTop: "JAB AAP WO GEMS KHARCH KARTE HO...", titleMain: "ASLI PAISA LAGTA HI NAHI", subLabel: "FEELS COMPLETELY PAINLESS", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "coinClink" },
  { id: 11, startSec: 24.8, endSec: 27.4, tag: "GAME ILLUSION // 11", titleTop: "YE SIRF VIDEO GAME KE", titleMain: "VIRTUAL NUMBERS LAGTE HAIN", subLabel: "DISCONNECTED FROM BANK BALANCE", accent: GOLD, textStyle: "typewriter", primarySfx: "mechThock", extraSfx: { offsetSec: 0.22, kind: "gemShimmer" } },
  { id: 12, startSec: 27.4, endSec: 30.2, tag: "BUDGET DRAIN // 12", titleTop: "IS EK TRICK SE AAP UDA DETE HO:", titleMain: "3X ZYADA PAISA", subLabel: "RS. 1000 BUDGET -> RS. 3000 SPENT", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "cashKaching", extraSfx: { offsetSec: 0.3, kind: "subDrop" } },
  { id: 13, startSec: 30.2, endSec: 32.5, tag: "NUMBED BRAIN // 13", titleTop: "AUR AAPKE DIMAAG KO", titleMain: "ZARA BHI DARD NAHI HOTA", subLabel: "PAIN OF PAYING BYPASSED", accent: CRIMSON, textStyle: "wordStagger", primarySfx: "subDrop" },
  { id: 14, startSec: 32.5, endSec: 35.0, tag: "CONCEPT LOCKED // 14", titleTop: "ISE KEHTE HAIN", titleMain: "THE CASHLESS ILLUSION", subLabel: "VIRTUAL CURRENCY TRAP", accent: NEON_GREEN, textStyle: "letterSnap", primarySfx: "markerSwipe", extraSfx: { offsetSec: 0.24, kind: "cardSnap" } },
  { id: 15, startSec: 35.0, endSec: 37.4, tag: "REALITY CHECK // 15", titleTop: "PICHHLI BAAR KAUN SE APP YA GAME MEIN", titleMain: "VIRTUAL COINS KHARIDE THE?", subLabel: "THINK ABOUT YOUR IN-APP PURCHASES", accent: GOLD, textStyle: "slideSplit", primarySfx: "gemShimmer" },
  { id: 16, startSec: 37.4, endSec: 39.6, tag: "TOTAL WASTED // 16", titleTop: "AUR KITNA ASLI PAISA", titleMain: "BARBAAD KIYA THA? [ RS. ??? ]", subLabel: "RS. 500? RS. 2,000? RS. 5,000?", accent: NEON_GREEN, textStyle: "highlighter", primarySfx: "cashKaching" },
  { id: 17, startSec: 39.6, endSec: 42.0, tag: "COMMENT BELOW // 17", titleTop: "APNI REALITY", titleMain: "COMMENT MEIN BATAO.", subLabel: "DROP THE APP NAME & AMOUNT", accent: NEON_GREEN, textStyle: "wordStagger", primarySfx: "cardSnap", extraSfx: { offsetSec: 0.25, kind: "coinClink" } },
];

const highlightTokens = (text: string) => {
  const parts = text.split(/(RS\.\s*\d+|RS\.\s*\?\?\?|1000\s*GLOWING\s*GEMS|'GEMS'|'COINS'|GEMS|COINS|3X|TOKENIZATION)/g);
  return parts.map((part, i) => {
    if (!/^(RS\.\s*\d+|RS\.\s*\?\?\?|1000\s*GLOWING\s*GEMS|'GEMS'|'COINS'|GEMS|COINS|3X|TOKENIZATION)$/.test(part)) {
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
          color: "#030805",
          boxShadow: `0 0 35px ${NEON_GREEN}99`,
          fontWeight: 900,
        }}
      >
        {part}
      </span>
    );
  });
};

const VectorGem: React.FC<{ size?: number; color?: string }> = ({ size = 90, color = CYAN }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <polygon points="50,6 88,34 50,94 12,34" fill={`${color}33`} stroke={color} strokeWidth="5" strokeLinejoin="round" />
    <polyline points="12,34 88,34" stroke={color} strokeWidth="3.5" />
    <polyline points="50,6 35,34 50,94 65,34 50,6" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.75" />
  </svg>
);

const VectorCoin: React.FC<{ size?: number; color?: string }> = ({ size = 84, color = GOLD }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="42" fill={`${color}26`} stroke={color} strokeWidth="6" />
    <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="8 6" />
    <rect x="42" y="32" width="16" height="36" rx="4" fill={color} />
  </svg>
);

const ProKineticHookStage: React.FC<{ cut: CutSpec; localFrame: number }> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();
  const s1 = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 200 } });
  const s2 = spring({ frame: Math.max(0, localFrame - 7), fps, config: { damping: 10, stiffness: 220 } });
  const s3 = spring({ frame: Math.max(0, localFrame - 14), fps, config: { damping: 12, stiffness: 190 } });
  const sweep = interpolate(localFrame, [8, 34], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  if (cut.id === 1) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 55px" }}>
        <div style={{ transform: `perspective(1000px) rotateX(${(1 - s1) * 24}deg) rotateY(-4deg)`, width: "100%", maxWidth: 940 }}>
          <div style={{ transform: `translateX(${(1 - s1) * -160}px)`, opacity: s1, marginBottom: 18 }}>
            <span style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 44, fontWeight: 900, color: "#94A3B8", letterSpacing: 3 }}>
              APPS AAPSE <span style={{ color: CRIMSON, textDecoration: "line-through" }}>DIRECT PAISE</span> LENE KE BAJAYE
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, margin: "24px 0", transform: `scale(${interpolate(s2, [0, 1], [1.75, 1])}) rotate(-2deg)`, opacity: s2 }}>
            <div style={{ padding: "18px 42px", borderRadius: 18, background: NEON_GREEN, color: "#030805", fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 98, fontWeight: 900, boxShadow: `0 0 85px ${NEON_GREEN}`, border: "5px solid #FFFFFF" }}>
              "GEMS & COINS"
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, transform: `translateY(${(1 - s3) * 60}px)`, opacity: s3, marginTop: 22 }}>
            <VectorGem size={78} color={NEON_GREEN} />
            <VectorCoin size={74} color={GOLD} />
            <div style={{ flex: 1, height: 10, width: `${sweep}%`, background: `linear-gradient(90deg, ${NEON_GREEN}, ${CYAN})`, borderRadius: 6, boxShadow: `0 0 30px ${NEON_GREEN}` }} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (cut.id === 2) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 55px", textAlign: "center" }}>
        <div style={{ fontSize: 56, fontWeight: 900, fontFamily: '"Arial Black", sans-serif', color: "#CBD5E1", letterSpacing: 4, transform: `translateX(${(1 - s1) * -180}px)`, opacity: s1 }}>
          KHARIDNE PAR KYUN
        </div>
        <div style={{ margin: "24px 0", padding: "22px 54px", borderRadius: 18, background: CRIMSON, color: "#FFFFFF", fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 102, fontWeight: 900, boxShadow: `0 0 85px ${CRIMSON}`, border: "4px solid #FFFFFF", transform: `scale(${0.75 + s2 * 0.25})` }}>
          MAJBOOR
        </div>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 84, fontWeight: 900, color: NEON_GREEN, transform: `translateX(${(1 - s3) * 180}px)`, opacity: s3 }}>
          KARTI HAIN?
        </div>
      </AbsoluteFill>
    );
  }

  if (cut.id === 3) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 55px", textAlign: "center" }}>
        <div style={{ fontSize: 56, fontWeight: 900, fontFamily: '"Arial Black", sans-serif', color: "#CBD5E1", letterSpacing: 6, opacity: s1 }}>
          CHALO AAJ INKA
        </div>
        <div style={{ position: "relative", margin: "28px 0", padding: "26px 56px", background: "rgba(0,255,102,0.12)", border: `4px solid ${NEON_GREEN}`, borderRadius: 20, boxShadow: `0 0 90px ${GREEN_GLOW}`, transform: `scale(${0.75 + s2 * 0.25})` }}>
          <div style={{ position: "absolute", top: -12, left: -12, width: 32, height: 32, borderTop: "6px solid #FFF", borderLeft: "6px solid #FFF" }} />
          <div style={{ position: "absolute", top: -12, right: -12, width: 32, height: 32, borderTop: "6px solid #FFF", borderRight: "6px solid #FFF" }} />
          <div style={{ position: "absolute", bottom: -12, left: -12, width: 32, height: 32, borderBottom: "6px solid #FFF", borderLeft: "6px solid #FFF" }} />
          <div style={{ position: "absolute", bottom: -12, right: -12, width: 32, height: 32, borderBottom: "6px solid #FFF", borderRight: "6px solid #FFF" }} />
          <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 88, fontWeight: 900, color: NEON_GREEN, letterSpacing: 3, textShadow: `0 0 45px ${NEON_GREEN}` }}>
            SABSE BADA SCAM
          </div>
        </div>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 82, fontWeight: 900, color: "#FFFFFF", opacity: s3 }}>
          DEKHTE HAIN.
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 55px", textAlign: "center" }}>
      <div style={{ fontSize: 38, fontWeight: 900, color: CYAN, letterSpacing: 8, marginBottom: 22 }}>[ {cut.titleTop} ]</div>
      <div style={{ padding: "32px 52px", borderRadius: 24, background: PANEL_BG, border: `5px solid ${NEON_GREEN}`, boxShadow: `0 0 95px ${GREEN_GLOW}`, transform: `scale(${0.85 + s1 * 0.15})` }}>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 84, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.08 }}>
          THE <span style={{ color: NEON_GREEN }}>CASHLESS</span> ILLUSION
        </div>
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
        <div style={{ fontSize: 28, fontWeight: 900, color: "#94A3B8", letterSpacing: 4, marginBottom: 10 }}>{cut.titleTop}</div>
        <div style={{ position: "relative", display: "inline-block", padding: "8px 30px" }}>
          <div style={{ position: "absolute", left: 0, top: 2, bottom: 2, width: `${barW}%`, background: NEON_GREEN, borderRadius: 12, boxShadow: `0 0 50px ${NEON_GREEN}99` }} />
          <span style={{ position: "relative", fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 62, fontWeight: 900, color: barW > 45 ? "#040806" : "#FFFFFF" }}>
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
        <div style={{ fontSize: 26, fontWeight: 900, color: NEON_GREEN, letterSpacing: 4, fontFamily: "monospace", marginBottom: 8 }}>{"> "}{cut.titleTop}</div>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 60, fontWeight: 900, color: "#FFFFFF" }}>
          {highlightTokens(cut.titleMain.slice(0, chars))}
          <span style={{ color: NEON_GREEN, marginLeft: 6 }}>_</span>
        </div>
      </div>
    );
  }

  if (cut.textStyle === "flip3D") {
    const f1 = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 165 } });
    return (
      <div style={{ textAlign: "center", perspective: 900 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#CBD5E1", letterSpacing: 4, marginBottom: 8 }}>{cut.titleTop}</div>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 62, fontWeight: 900, color: "#FFFFFF", transformOrigin: "50% 0%", transform: `rotateX(${(1 - f1) * 85}deg)`, opacity: f1 }}>
          {highlightTokens(cut.titleMain)}
        </div>
      </div>
    );
  }

  if (cut.textStyle === "slideSplit") {
    const s = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 170 } });
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#94A3B8", letterSpacing: 4, transform: `translateX(${(1 - s) * -140}px)`, opacity: s }}>{cut.titleTop}</div>
        <div style={{ marginTop: 8, fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 60, fontWeight: 900, color: "#FFFFFF", transform: `translateX(${(1 - s) * 140}px)`, opacity: s }}>
          {highlightTokens(cut.titleMain)}
        </div>
      </div>
    );
  }

  const snap = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 175 } });
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#94A3B8", letterSpacing: 4 }}>{cut.titleTop}</div>
      <div style={{ marginTop: 8, fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 62, fontWeight: 900, color: "#FFFFFF", letterSpacing: `${interpolate(snap, [0, 1], [18, 0])}px`, opacity: snap }}>
        {highlightTokens(cut.titleMain)}
      </div>
    </div>
  );
};

const PhoneAppStoreStage: React.FC<{ cutId: number; localFrame: number }> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 170 } });
  const isGemMode = cutId === 10;

  return (
    <div
      style={{
        width: 580,
        height: 1040,
        borderRadius: 64,
        background: "#080C14",
        border: "10px solid #263248",
        boxShadow: `0 0 90px rgba(0, 255, 102, 0.22), 0 35px 80px rgba(0,0,0,0.95)`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transform: `perspective(1100px) rotateY(${Math.sin(localFrame * 0.05) * 3}deg) scale(${0.92 + pop * 0.08})`,
      }}
    >
      <div style={{ height: 60, background: "#05080F", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 36px", color: "#94A3B8", fontSize: 18, fontWeight: 800 }}>
        <span>9:41</span>
        <div style={{ width: 135, height: 28, borderRadius: 20, background: "#000000", border: "1px solid #1E293B" }} />
        <span style={{ color: NEON_GREEN }}>5G • 100%</span>
      </div>

      <div style={{ padding: "18px 30px", background: "#0B111E", borderBottom: "2px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 900, letterSpacing: 3 }}>NEXUS // STORE</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px", borderRadius: 100, background: "rgba(0,255,102,0.14)", border: `2px solid ${NEON_GREEN}` }}>
          <VectorGem size={24} color={NEON_GREEN} />
          <span style={{ color: NEON_GREEN, fontSize: 18, fontWeight: 900 }}>
            {isGemMode ? "1000 GEMS" : "RS. 1000"}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, padding: "26px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ padding: 26, borderRadius: 26, background: "#0E1626", border: cutId === 5 ? `4px solid ${NEON_GREEN}` : `2px solid ${CYAN}66`, textAlign: "center", boxShadow: cutId === 5 ? `0 0 50px ${GREEN_GLOW}` : "none" }}>
          <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: 8, background: "rgba(0,240,255,0.14)", color: CYAN, fontSize: 17, fontWeight: 900, letterSpacing: 3, marginBottom: 16 }}>
            MYTHIC BUNDLE // TIER 01
          </div>

          <div style={{ width: 190, height: 190, margin: "0 auto", borderRadius: 24, background: "#060A12", border: `2px solid ${CYAN}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="130" height="130" viewBox="0 0 120 120">
              <path d="M60 10 L102 28 V62 C102 88 60 108 60 108 C60 108 18 88 18 62 V28 Z" fill="rgba(0,240,255,0.15)" stroke={CYAN} strokeWidth="5" />
              <polygon points="60,28 78,58 60,88 42,58" fill={NEON_GREEN} />
            </svg>
          </div>

          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, marginTop: 18 }}>
            CYBER PHANTOM PASS
          </div>

          <div style={{ marginTop: 16, display: "inline-block", padding: "10px 32px", borderRadius: 12, background: cutId === 5 ? NEON_GREEN : "#070B12", color: cutId === 5 ? "#030805" : NEON_GREEN, border: `2px solid ${NEON_GREEN}`, fontFamily: '"Arial Black", sans-serif', fontSize: 42, fontWeight: 900 }}>
            {isGemMode ? "1000 GEMS" : "RS. 1000"}
          </div>
        </div>

        <div>
          {cutId === 6 ? (
            <div style={{ padding: 20, borderRadius: 18, background: "rgba(255,42,84,0.18)", border: `3px solid ${CRIMSON}`, marginBottom: 18, textAlign: "center" }}>
              <div style={{ color: CRIMSON, fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>
                [ BRAIN WARNING: REAL MONEY LEAVING BANK ]
              </div>
            </div>
          ) : isGemMode ? (
            <div style={{ padding: 20, borderRadius: 18, background: "rgba(0,255,102,0.14)", border: `2px solid ${NEON_GREEN}`, marginBottom: 18, textAlign: "center" }}>
              <div style={{ color: NEON_GREEN, fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>
                [ BRAIN PAIN RECEPTOR: 0% • FEELS FREE! ]
              </div>
            </div>
          ) : null}

          <div
            style={{
              padding: "26px 0",
              borderRadius: 20,
              background: cutId === 6 ? CRIMSON : NEON_GREEN,
              color: cutId === 6 ? "#FFFFFF" : "#030805",
              fontSize: 30,
              fontWeight: 900,
              textAlign: "center",
              letterSpacing: 2,
              boxShadow: `0 0 45px ${cutId === 6 ? CRIMSON : NEON_GREEN}`,
            }}
          >
            {cutId === 6 ? "PAY RS. 1000 CASH NOW" : isGemMode ? "UNLOCK WITH 1000 GEMS" : "BUY PREMIUM PASS"}
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecialDeckStage: React.FC<{ cutId: number; localFrame: number }> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 185 } });

  if (cutId === 7 || cutId === 8 || cutId === 13) {
    const isHighPain = cutId === 7;
    const painVal = isHighPain
      ? Math.floor(interpolate(localFrame, [0, 30], [20, 98], { extrapolateRight: "clamp" }))
      : Math.floor(interpolate(localFrame, [0, 30], [98, 0], { extrapolateRight: "clamp" }));

    return (
      <div style={{ width: 880, padding: 48, borderRadius: 28, background: PANEL_BG, border: `4px solid ${isHighPain ? CRIMSON : NEON_GREEN}`, boxShadow: `0 0 85px ${isHighPain ? "rgba(255,42,84,0.35)" : GREEN_GLOW}`, textAlign: "center", transform: `scale(${0.9 + pop * 0.1})` }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: 24, fontWeight: 900, letterSpacing: 3, marginBottom: 24 }}>
          <span>NEURAL PAIN SENSOR</span>
          <span style={{ color: isHighPain ? CRIMSON : NEON_GREEN }}>
            {isHighPain ? "STATUS: CRITICAL PAIN" : "STATUS: NUMBED [0%]"}
          </span>
        </div>

        <svg width="780" height="220" viewBox="0 0 780 220">
          {isHighPain ? (
            <polyline
              fill="none"
              stroke={CRIMSON}
              strokeWidth="8"
              points="0,150 110,150 150,40 195,195 250,20 300,190 360,80 420,160 490,25 545,195 610,60 780,60"
            />
          ) : (
            <line x1="0" y1="110" x2="780" y2="110" stroke={NEON_GREEN} strokeWidth="8" strokeDasharray="18 10" />
          )}
        </svg>

        <div style={{ marginTop: 20, display: "inline-block", padding: "16px 48px", borderRadius: 14, background: isHighPain ? CRIMSON : NEON_GREEN, color: isHighPain ? "#FFFFFF" : "#030805", fontFamily: '"Arial Black", sans-serif', fontSize: 64, fontWeight: 900 }}>
          PAIN LEVEL: {painVal}%
        </div>
      </div>
    );
  }

  if (cutId === 9) {
    const mid = spring({ frame: Math.max(0, localFrame - 6), fps, config: { damping: 10, stiffness: 200 } });
    return (
      <div style={{ width: 980, display: "flex", gap: 22, alignItems: "center" }}>
        <div style={{ flex: 1, padding: "40px 18px", borderRadius: 24, background: PANEL_BG, border: "2px solid #334155", textAlign: "center", opacity: 0.75 }}>
          <div style={{ color: "#94A3B8", fontSize: 20, fontWeight: 800 }}>REAL MONEY</div>
          <div style={{ color: "#FFFFFF", fontSize: 30, fontWeight: 900, margin: "14px 0" }}>HARD CASH</div>
          <div style={{ color: CRIMSON, fontSize: 48, fontWeight: 900 }}>RS. 1000</div>
        </div>

        <div style={{ flex: 1.3, padding: "46px 22px", borderRadius: 28, background: "#051F12", border: `5px solid ${NEON_GREEN}`, boxShadow: `0 0 95px ${NEON_GREEN}88`, textAlign: "center", transform: `translateY(${(1 - mid) * 90}px) scale(${0.84 + mid * 0.22})`, zIndex: 10 }}>
          <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 8, background: NEON_GREEN, color: "#030805", fontSize: 19, fontWeight: 900, marginBottom: 16 }}>
            TOKENIZATION ENGINE
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "10px 0" }}>
            <VectorGem size={76} color={NEON_GREEN} />
            <VectorCoin size={72} color={GOLD} />
          </div>
          <div style={{ marginTop: 12, color: NEON_GREEN, fontFamily: '"Arial Black", sans-serif', fontSize: 58, fontWeight: 900 }}>
            1000 GEMS
          </div>
        </div>

        <div style={{ flex: 1, padding: "40px 18px", borderRadius: 24, background: PANEL_BG, border: `2px solid ${NEON_GREEN}66`, textAlign: "center", opacity: 0.85 }}>
          <div style={{ color: "#94A3B8", fontSize: 20, fontWeight: 800 }}>BRAIN PAIN</div>
          <div style={{ color: NEON_GREEN, fontSize: 30, fontWeight: 900, margin: "14px 0" }}>REMOVED</div>
          <div style={{ color: NEON_GREEN, fontSize: 48, fontWeight: 900 }}>0% PAIN</div>
        </div>
      </div>
    );
  }

  if (cutId === 11) {
    const gemsLeft = Math.max(0, Math.floor(interpolate(localFrame, [5, 90], [1000, 0])));
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `4px solid ${GOLD}`, textAlign: "center", transform: `scale(${0.9 + pop * 0.1})` }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20 }}>
          <VectorGem size={84} color={CYAN} />
          <VectorCoin size={84} color={GOLD} />
        </div>
        <div style={{ color: "#94A3B8", fontSize: 24, fontWeight: 900, letterSpacing: 4 }}>
          VIRTUAL GAME BALANCE
        </div>
        <div style={{ fontFamily: '"Arial Black", monospace', fontSize: 112, fontWeight: 900, color: GOLD, margin: "14px 0" }}>
          {gemsLeft} TOKENS
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 800 }}>
          FEELS LIKE A GAME SCORE — <span style={{ color: CRIMSON }}>NOT REAL BANK CASH!</span>
        </div>
      </div>
    );
  }

  if (cutId === 12) {
    const barGrow = spring({ frame: Math.max(0, localFrame - 8), fps, config: { damping: 12, stiffness: 160 } });
    return (
      <div style={{ width: 880, padding: 48, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 85px ${GREEN_GLOW}` }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 340, paddingBottom: 20, borderBottom: "2px solid #1E293B" }}>
          <div style={{ textAlign: "center", width: 260 }}>
            <div style={{ color: "#CBD5E1", fontSize: 28, fontWeight: 900, marginBottom: 10 }}>RS. 1000</div>
            <div style={{ height: 100 * barGrow, borderRadius: "14px 14px 0 0", background: "#334155" }} />
            <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800, marginTop: 14 }}>PLANNED BUDGET</div>
          </div>

          <div style={{ textAlign: "center", width: 280 }}>
            <div style={{ color: NEON_GREEN, fontSize: 42, fontWeight: 900, marginBottom: 10 }}>RS. 3000 [3X]</div>
            <div style={{ height: 260 * barGrow, borderRadius: "14px 14px 0 0", background: NEON_GREEN, boxShadow: `0 0 50px ${NEON_GREEN}` }} />
            <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 900, marginTop: 14 }}>SPENT VIA GEMS</div>
          </div>
        </div>
      </div>
    );
  }

  if (cutId === 15 || cutId === 16) {
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 85px ${GREEN_GLOW}`, textAlign: "center", transform: `scale(${0.9 + pop * 0.1})` }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20 }}>
          <VectorGem size={72} color={NEON_GREEN} />
          <VectorCoin size={72} color={GOLD} />
        </div>
        <div style={{ color: "#94A3B8", fontSize: 25, fontWeight: 900, letterSpacing: 4 }}>
          {cutId === 15 ? "YOUR LAST IN-APP PURCHASE" : "TOTAL REAL CASH WASTED"}
        </div>
        <div style={{ marginTop: 22, display: "inline-block", padding: "18px 56px", borderRadius: 16, background: NEON_GREEN, color: "#030805", fontFamily: '"Arial Black", sans-serif', fontSize: cutId === 15 ? 64 : 102, fontWeight: 900, boxShadow: `0 0 55px ${NEON_GREEN}` }}>
          {cutId === 15 ? "WHICH APP / GAME?" : "RS. ???"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 880, padding: 52, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 90px ${GREEN_GLOW}`, textAlign: "center", transform: `scale(${0.9 + pop * 0.1})` }}>
      <div style={{ color: NEON_GREEN, fontSize: 28, fontWeight: 900, letterSpacing: 5 }}>[ CONFESSION BOX // COMMENTS ]</div>
      <div style={{ marginTop: 26, padding: "32px 36px", borderRadius: 16, background: "#06090F", border: `2px solid ${NEON_GREEN}`, color: "#FFFFFF", fontSize: 38, fontWeight: 900 }}>
        "Maine ___ app mein RS. ___ udaye the."
      </div>
    </div>
  );
};

const CashlessIllusionReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeCut = CUTS.find((c) => sec >= c.startSec && sec < c.endSec) ?? CUTS[CUTS.length - 1];
  const localFrame = Math.max(0, frame - Math.round(activeCut.startSec * FPS));
  const progress = interpolate(frame, [0, DURATION], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = (frame * 1.1) % 80;

  const isFullHook = [1, 2, 3, 14].includes(activeCut.id);
  const isPhoneScene = [4, 5, 6, 10].includes(activeCut.id);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${activeCut.accent}22 0%, rgba(4,6,10,0.95) 62%, ${DARK_BG} 100%)` }} />
      <AbsoluteFill style={{ opacity: 0.13, backgroundImage: `linear-gradient(${activeCut.accent}33 1px, transparent 1px), linear-gradient(90deg, ${activeCut.accent}33 1px, transparent 1px)`, backgroundSize: "80px 80px", transform: `translateY(${shift}px)` }} />

      <div style={{ position: "absolute", top: 26, left: 48, right: 48, display: "flex", gap: 5, height: 5 }}>
        {CUTS.map((c) => {
          const fill = sec >= c.endSec ? 1 : sec <= c.startSec ? 0 : (sec - c.startSec) / (c.endSec - c.startSec);
          return (
            <div key={c.id} style={{ flex: 1, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: NEON_GREEN }} />
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", top: 62, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ padding: "8px 22px", border: `2px solid ${activeCut.accent}`, background: "rgba(0,0,0,0.65)", color: activeCut.accent, fontSize: 19, fontWeight: 900, letterSpacing: 4 }}>
          {activeCut.tag}
        </div>
        <div style={{ color: "#64748B", fontSize: 20, fontWeight: 900, letterSpacing: 4 }}>
          {String(activeCut.id).padStart(2, "0")} // 17
        </div>
      </div>

      {isFullHook ? (
        <ProKineticHookStage cut={activeCut} localFrame={localFrame} />
      ) : (
        <>
          <div style={{ position: "absolute", top: 150, left: 48, right: 48 }}>
            <VariedTopHeadline cut={activeCut} localFrame={localFrame} />
            <div style={{ marginTop: 14, textAlign: "center", fontSize: 19, fontWeight: 800, color: "#64748B", letterSpacing: 5 }}>
              {activeCut.subLabel}
            </div>
          </div>

          <div style={{ position: "absolute", top: 390, left: 0, right: 0, bottom: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isPhoneScene ? (
              <PhoneAppStoreStage cutId={activeCut.id} localFrame={localFrame} />
            ) : (
              <SpecialDeckStage cutId={activeCut.id} localFrame={localFrame} />
            )}
          </div>
        </>
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${progress}%`, background: NEON_GREEN, boxShadow: `0 0 25px ${NEON_GREEN}` }} />

      {CUTS.map((c) => (
        <React.Fragment key={`sfx-${c.id}`}>
          <Sequence from={Math.round(c.startSec * FPS)} durationInFrames={35} layout="none">
            <Audio src={SFX[c.primarySfx]} volume={0.82} />
          </Sequence>
          {c.extraSfx && (
            <Sequence from={Math.round((c.startSec + c.extraSfx.offsetSec) * FPS)} durationInFrames={35} layout="none">
              <Audio src={SFX[c.extraSfx.kind]} volume={0.78} />
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
      component={CashlessIllusionReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
