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
   THE FAKE SCARCITY TRAP — V2 DIRECTOR'S CUT (ZERO DEAD AIR / MACRO ZOOMS)
   1080 x 1920 | 60 FPS | 38.0 Seconds (2280 Frames)
   Fixes from rendered video inspection:
   - Eliminated 4s frozen text holds in Hook & CTA (split into 2 dynamic beats each)
   - Filled empty black gap inside phone app with complete Product Specs & Rating UI
   - Added Dynamic Camera Target Zooms (Zooms to CLOSE [X], then to RED ALERT timer)
   - Live animated scrolling ECG waveform + Fixed 1-line button text wrapping
   - Minimal SFX: Only on Money/Purchase (Ka-Ching) + Red Stock Alert Beep
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2280; // 38.0 Seconds @ 60 FPS

const NEON_GREEN = "#00FF66";
const GREEN_GLOW = "rgba(0, 255, 102, 0.35)";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const CYAN = "#00F0FF";
const DARK_BG = "#050811";
const PAPER_BG = "#F4F0E6";
const PANEL_BG = "rgba(11, 17, 30, 0.96)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. MINIMAL PROCEDURAL SFX (ONLY CASH KA-CHING & 1 RED ALERT BEEP)
   ========================================================================= */
type SfxType = "kaching" | "alertBeep";

function buildMinimalSfx(type: SfxType): string {
  const sampleRate = 22050;
  const duration = type === "kaching" ? 0.52 : 0.36;
  const totalSamples = Math.floor(sampleRate * duration);
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

    if (type === "kaching") {
      const f1 = p < 0.18 ? 1480 : 2960;
      const f2 = p < 0.18 ? 2217 : 4435;
      const sp = p < 0.18 ? p / 0.18 : (p - 0.18) / 0.82;
      w =
        Math.sin(2 * Math.PI * f1 * t) * 0.55 +
        Math.sin(2 * Math.PI * f2 * t) * 0.35 +
        Math.sin(2 * Math.PI * (f1 * 1.5) * t) * 0.15;
      env = Math.exp(-sp * 7.5);
    } else {
      const f = p < 0.45 ? 880 : 1174.6;
      const lp = p < 0.45 ? p / 0.45 : (p - 0.45) / 0.55;
      w = Math.sin(2 * Math.PI * f * t) * 0.68;
      env = Math.exp(-lp * 8.5);
    }

    view.setInt16(44 + i * 2, clamp(w * env * 0.82, -1, 1) * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX = {
  kaching: buildMinimalSfx("kaching"),
  alertBeep: buildMinimalSfx("alertBeep"),
};

/* =========================================================================
   02. OPTICAL SHADOW VIGNETTE & STRAIGHT SHADOW POP TYPOGRAPHY
   ========================================================================= */
const OpticalVignette: React.FC<{ frame: number; dark?: boolean }> = ({ frame, dark = false }) => {
  const dx = Math.sin(frame * 0.03) * 10;
  const dy = Math.cos(frame * 0.025) * 8;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 40,
        background: dark
          ? `radial-gradient(circle at ${50 + dx}% ${50 + dy}%, transparent 45%, rgba(0,0,0,0.72) 100%)`
          : `radial-gradient(circle at ${50 + dx}% ${50 + dy}%, transparent 46%, rgba(15,23,42,0.28) 100%)`,
      }}
    />
  );
};

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
}> = ({ text, localFrame, appearFrame, font, size, color, boxBg, letterSpacing = 1 }) => {
  const { fps } = useVideoConfig();
  const rel = localFrame - appearFrame;
  if (rel < 0) return null;

  const pop = spring({ frame: rel, fps, config: { damping: 13, stiffness: 175, mass: 0.85 } });
  const scale = interpolate(pop, [0, 1], [1.36, 1]);
  const yOff = interpolate(pop, [0, 1], [36, 0]);
  const ghostBlur = interpolate(pop, [0, 1], [24, 0]);
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
      {/* Ghost Motion-Blur Echo Shadow */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: (1 - pop) * 38,
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

      {/* Main Crisp Layer */}
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
          padding: boxBg ? "12px 36px" : "0 10px",
          borderRadius: boxBg ? 12 : 0,
          boxShadow: boxBg ? "0 20px 45px rgba(0,0,0,0.32)" : "none",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* =========================================================================
   03. DETAILED SNEAKER VECTOR WITH FLOATING MOTION
   ========================================================================= */
const DetailedSneakerSvg: React.FC<{ scale?: number; floatY?: number }> = ({
  scale = 1,
  floatY = 0,
}) => (
  <svg
    width={320 * scale}
    height={195 * scale}
    viewBox="0 0 320 195"
    style={{ transform: `translateY(${floatY}px)` }}
  >
    <ellipse cx="160" cy="176" rx="128" ry="11" fill="rgba(0, 255, 102, 0.22)" />
    <path
      d="M25 142 L295 142 C302 142 305 165 290 167 L30 167 C18 167 18 142 25 142 Z"
      fill="#F8FAFC"
      stroke="#0F172A"
      strokeWidth="4"
    />
    <path d="M35 159 L285 159" stroke={NEON_GREEN} strokeWidth="5" />
    <path
      d="M30 142 L35 69 L95 69 L135 32 L165 42 L160 77 L285 109 C298 115 298 142 288 142 Z"
      fill="#1E293B"
      stroke={CYAN}
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    <path
      d="M30 142 L35 85 L88 102 L78 142 Z"
      fill="rgba(255, 42, 84, 0.88)"
      stroke="#FFFFFF"
      strokeWidth="2.5"
    />
    <path
      d="M85 99 L195 125 L235 102"
      fill="none"
      stroke={NEON_GREEN}
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="145" y1="55" x2="175" y2="49" stroke="#FFFFFF" strokeWidth="4" />
    <line x1="158" y1="69" x2="188" y2="63" stroke="#FFFFFF" strokeWidth="4" />
    <line x1="172" y1="83" x2="202" y2="77" stroke="#FFFFFF" strokeWidth="4" />
  </svg>
);

/* =========================================================================
   04. DYNAMIC CAMERA SMARTPHONE SCENE (SCENES 2, 3, 4, 6)
   - Zero Empty Black Gap inside Phone
   - Camera actively zooms to the exact story focal point in every cut!
   ========================================================================= */
const DynamicSneakerPhoneScene: React.FC<{
  mode: "browsing" | "hesitate" | "scarcityAttack" | "purchased";
  localFrame: number;
  sceneDuration: number;
}> = ({ mode, localFrame, sceneDuration }) => {
  const { fps } = useVideoConfig();
  const enterPop = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 150 } });
  const shoeFloat = Math.sin(localFrame * 0.1) * 5;

  // --- DYNAMIC CAMERA TARGETING PER SCENE ---
  let camScale = 1;
  let camX = 0;
  let camY = 0;

  if (mode === "browsing") {
    // Smooth zoom-in onto the Sneaker & RS. 2000 price badge
    camScale = interpolate(localFrame, [0, sceneDuration], [0.96, 1.18], {
      extrapolateRight: "clamp",
    });
    camY = interpolate(localFrame, [0, sceneDuration], [0, 55], {
      extrapolateRight: "clamp",
    });
  } else if (mode === "hesitate") {
    // Camera zooms toward top-right CLOSE [X] button as finger moves there
    const focusClose = spring({
      frame: Math.max(0, localFrame - 18),
      fps,
      config: { damping: 14, stiffness: 120 },
    });
    camScale = interpolate(focusClose, [0, 1], [1.0, 1.26]);
    camX = interpolate(focusClose, [0, 1], [0, -70]);
    camY = interpolate(focusClose, [0, 1], [0, 110]);
  } else if (mode === "scarcityAttack") {
    // Aggressive camera punch-in onto the lower RED ALERT + TIMER box + impact shake
    const attackZoom = spring({
      frame: Math.max(0, localFrame - 8),
      fps,
      config: { damping: 11, stiffness: 180 },
    });
    const shakeEnv = Math.max(0, 1 - Math.abs(localFrame - 12) / 10) * 14;
    camScale = interpolate(attackZoom, [0, 1], [0.98, 1.28]);
    camX = Math.sin(localFrame * 2.4) * shakeEnv;
    camY = interpolate(attackZoom, [0, 1], [0, -145]) + Math.cos(localFrame * 2.1) * shakeEnv;
  } else if (mode === "purchased") {
    // Zooms into BUY button click, then pulls out slightly for the UPI Receipt slam
    const receiptPop = spring({
      frame: Math.max(0, localFrame - 30),
      fps,
      config: { damping: 12, stiffness: 170 },
    });
    camScale = interpolate(receiptPop, [0, 1], [1.18, 1.04]);
    camY = interpolate(receiptPop, [0, 1], [-110, -20]);
  }

  // Stock bar drains from 9 down to 1 in "scarcityAttack"
  const stockCount =
    mode === "scarcityAttack"
      ? Math.max(1, Math.floor(interpolate(localFrame, [4, 42], [9, 1], { extrapolateRight: "clamp" })))
      : 1;
  const stockPct =
    mode === "scarcityAttack"
      ? interpolate(localFrame, [4, 42], [78, 11], { extrapolateRight: "clamp" })
      : 11;

  // Live ticking seconds + milliseconds for urgency
  const secLeft = Math.max(41, 59 - Math.floor(localFrame / 15));
  const msLeft = String(99 - ((localFrame * 3) % 99)).padStart(2, "0");

  // Finger Cursor Coordinates
  const cursorX =
    mode === "hesitate"
      ? interpolate(localFrame, [8, 55], [310, 520], { extrapolateRight: "clamp" })
      : mode === "purchased"
        ? interpolate(localFrame, [0, 26], [460, 320], { extrapolateRight: "clamp" })
        : 320;
  const cursorY =
    mode === "hesitate"
      ? interpolate(localFrame, [8, 55], [720, 122], { extrapolateRight: "clamp" })
      : mode === "purchased"
        ? interpolate(localFrame, [0, 26], [680, 1050], { extrapolateRight: "clamp" })
        : 720;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 54%, ${
            mode === "scarcityAttack" ? "rgba(255,42,84,0.24)" : "rgba(0,255,102,0.16)"
          } 0%, ${DARK_BG} 72%)`,
        }}
      />

      {/* Top Narrative Header Bar (Pinned cleanly at top) */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 50,
          right: 50,
          textAlign: "center",
          zIndex: 30,
          padding: "16px 28px",
          borderRadius: 18,
          background: "rgba(5, 8, 17, 0.86)",
          border: "1px solid #1E293B",
        }}
      >
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 34, color: "#CBD5E1" }}>
          {mode === "browsing" && "Maan lo aap phone par ek Sneaker dekh rahe ho"}
          {mode === "hesitate" && "Aap sochte ho — 'Abhi rehne deta hoon, baad mein lunga'"}
          {mode === "scarcityAttack" && "Tabhi price ke theek niche RED ALERT aata hai!"}
          {mode === "purchased" && "Jo chahiye bhi nahi tha, aap turant kharid lete ho!"}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 58,
            color: mode === "scarcityAttack" ? CRIMSON : NEON_GREEN,
            letterSpacing: 2,
          }}
        >
          {mode === "browsing" && "PRICE: RS. 2000"}
          {mode === "hesitate" && "ABHI REHNE DETA HOON..."}
          {mode === "scarcityAttack" && "HURRY! ONLY 1 LEFT IN STOCK!"}
          {mode === "purchased" && "INSTANTLY PAID: RS. 2000"}
        </div>
      </div>

      {/* CAMERA RIG WRAPPING THE 3D SMARTPHONE */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 150,
          transform: `translate(${camX}px, ${camY}px) scale(${camScale * (0.94 + enterPop * 0.06)})`,
        }}
      >
        <div
          style={{
            width: 650,
            height: 1190,
            borderRadius: 58,
            background: "#090E1A",
            border: `10px solid ${mode === "scarcityAttack" ? CRIMSON : "#263248"}`,
            boxShadow: `0 35px 90px rgba(0,0,0,0.92), 0 0 75px ${
              mode === "scarcityAttack" ? "rgba(255,42,84,0.4)" : "rgba(0,255,102,0.22)"
            }`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              height: 54,
              background: "#050811",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 36px",
              color: "#94A3B8",
              fontFamily: "'Courier New', monospace",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            <span>9:41</span>
            <div style={{ width: 125, height: 24, borderRadius: 14, background: "#000" }} />
            <span style={{ color: NEON_GREEN }}>5G • 99%</span>
          </div>

          {/* App Navbar */}
          <div
            style={{
              padding: "16px 28px",
              background: "#0D1526",
              borderBottom: "2px solid #1E293B",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 23, color: "#FFF", letterSpacing: 2 }}>
              SNKR // STORE
            </span>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                background: mode === "hesitate" && localFrame > 42 ? CRIMSON : "#1E293B",
                border: mode === "hesitate" ? "2px solid #FFF" : "none",
                color: "#FFF",
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 18,
              }}
            >
              CLOSE [X]
            </div>
          </div>

          {/* App Inner Body — Completely Filled with Real E-Commerce UI (No Empty Gap!) */}
          <div
            style={{
              flex: 1,
              padding: "22px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* 1. Sneaker Product Showcase Card */}
            <div
              style={{
                padding: "20px 22px",
                borderRadius: 22,
                background: "#060A14",
                border: "2px solid #1E293B",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: CYAN, fontFamily: "'Courier New', monospace", fontSize: 18, fontWeight: 800 }}>
                  AIR CYBER HIGH // EDITION 01
                </span>
                <span style={{ color: GOLD, fontFamily: "'Arial Black', sans-serif", fontSize: 18 }}>
                  4.9 ★ (1,420)
                </span>
              </div>

              <DetailedSneakerSvg scale={0.92} floatY={shoeFloat} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {["UK 7", "UK 8", "UK 9", "UK 10"].map((sz, i) => (
                    <div
                      key={sz}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: i === 2 ? NEON_GREEN : "#0F172A",
                        color: i === 2 ? "#040806" : "#64748B",
                        fontFamily: "'Arial Black', sans-serif",
                        fontSize: 16,
                      }}
                    >
                      {sz}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: "8px 24px",
                    borderRadius: 10,
                    background: NEON_GREEN,
                    color: "#040806",
                    fontFamily: "Impact, sans-serif",
                    fontSize: 42,
                    boxShadow: `0 0 32px ${NEON_GREEN}`,
                  }}
                >
                  RS. 2000
                </div>
              </div>
            </div>

            {/* 2. Middle Spec / Dynamic Story Module (Fills the middle of the phone!) */}
            {mode === "browsing" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    padding: "18px 22px",
                    borderRadius: 16,
                    background: "#0D1526",
                    border: "2px solid #1E293B",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ color: "#94A3B8", fontFamily: "'Courier New', monospace", fontSize: 17, fontWeight: 800 }}>
                      DELIVERY ESTIMATE
                    </div>
                    <div style={{ color: "#FFFFFF", fontFamily: "'Arial Black', sans-serif", fontSize: 22, marginTop: 4 }}>
                      STANDARD SHIPPING • 3 DAYS
                    </div>
                  </div>
                  <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(0,255,102,0.15)", color: NEON_GREEN, fontFamily: "'Arial Black', sans-serif", fontSize: 18 }}>
                    AVAILABLE
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px 22px",
                    borderRadius: 16,
                    background: "#0D1526",
                    border: "2px solid #1E293B",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#94A3B8",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  <span>7-DAY EASY EXCHANGE</span>
                  <span style={{ color: CYAN }}>CASH ON DELIVERY</span>
                </div>
              </div>
            )}

            {mode === "hesitate" && (
              <div
                style={{
                  padding: "26px 24px",
                  borderRadius: 20,
                  background: "#131C31",
                  border: `3px dashed ${GOLD}`,
                  textAlign: "center",
                }}
              >
                <div style={{ color: GOLD, fontFamily: "'Courier New', monospace", fontSize: 19, fontWeight: 900, marginBottom: 8 }}>
                  [ USER NORMAL THOUGHT ]
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 30, color: "#FFFFFF" }}>
                  "Abhi rehne deta hoon, baad mein aaram se kharid lunga."
                </div>
              </div>
            )}

            {mode === "scarcityAttack" && (
              <div
                style={{
                  padding: "22px 24px",
                  borderRadius: 22,
                  background: "rgba(255, 42, 84, 0.18)",
                  border: `4px solid ${CRIMSON}`,
                  boxShadow: `0 0 55px rgba(255,42,84,0.45)`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "Impact, sans-serif", fontSize: 38, color: "#FFFFFF", letterSpacing: 1 }}>
                    HURRY! ONLY {stockCount} LEFT IN STOCK!
                  </span>
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      background: CRIMSON,
                      color: "#FFF",
                      fontFamily: "'Courier New', monospace",
                      fontSize: 17,
                      fontWeight: 900,
                    }}
                  >
                    SELLING FAST
                  </span>
                </div>

                {/* Draining Red Bar */}
                <div
                  style={{
                    marginTop: 14,
                    width: "100%",
                    height: 22,
                    borderRadius: 11,
                    background: "#090D16",
                    border: `2px solid ${CRIMSON}`,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ width: `${stockPct}%`, height: "100%", background: CRIMSON }} />
                </div>

                {/* Live Millisecond Countdown */}
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: "#060911",
                    border: `2px solid ${GOLD}`,
                  }}
                >
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 19, color: GOLD, fontWeight: 900 }}>
                    DEAL ENDS IN:
                  </span>
                  <span style={{ fontFamily: "Impact, sans-serif", fontSize: 38, color: GOLD, letterSpacing: 2 }}>
                    00 : 04 : {secLeft} : {msLeft}
                  </span>
                </div>
              </div>
            )}

            {mode === "purchased" && (
              <div
                style={{
                  padding: "24px",
                  borderRadius: 20,
                  background: "#052916",
                  border: `4px solid ${NEON_GREEN}`,
                  boxShadow: `0 0 55px ${GREEN_GLOW}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 20, color: NEON_GREEN, fontWeight: 900 }}>
                  UPI PAYMENT DEBited // FOMO TRIGGERED
                </div>
                <div style={{ fontFamily: "Impact, sans-serif", fontSize: 50, color: "#FFFFFF", marginTop: 6 }}>
                  PAID RS. 2000 INSTANTLY!
                </div>
              </div>
            )}

            {/* 3. Bottom Checkout CTA Button (Clean Single-Line Text!) */}
            <div
              style={{
                padding: "24px 0",
                borderRadius: 18,
                background: mode === "scarcityAttack" ? CRIMSON : NEON_GREEN,
                color: mode === "scarcityAttack" ? "#FFFFFF" : "#040806",
                fontFamily: "Impact, 'Arial Black', sans-serif",
                fontSize: 34,
                textAlign: "center",
                letterSpacing: 2,
                whiteSpace: "nowrap",
                boxShadow: `0 0 40px ${mode === "scarcityAttack" ? CRIMSON : NEON_GREEN}`,
              }}
            >
              {mode === "purchased" && localFrame > 26
                ? "ORDER CONFIRMED • RS. 2000"
                : "BUY NOW • RS. 2000"}
            </div>
          </div>

          {/* Touch Cursor */}
          {(mode === "hesitate" || mode === "purchased") && (
            <div
              style={{
                position: "absolute",
                left: cursorX,
                top: cursorY,
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.38)",
                border: "4px solid #FFFFFF",
                boxShadow: `0 0 32px ${CYAN}`,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* =========================================================================
   05. LIVE ANIMATED BRAIN FOMO ECG MONITOR (SCENE 5)
   ========================================================================= */
const LiveBrainFomoScene: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 160 } });
  const panicLevel = Math.floor(interpolate(localFrame, [0, 75], [40, 99], { extrapolateRight: "clamp" }));
  const camZoom = interpolate(localFrame, [0, 220], [0.96, 1.08], { extrapolateRight: "clamp" });

  // Dynamic live-oscillating ECG points so waveform NEVER freezes
  const pts = Array.from({ length: 28 })
    .map((_, i) => {
      const x = i * 29;
      const isPeak = i % 4 === 1;
      const isTrough = i % 4 === 2;
      const pulse = Math.sin(localFrame * 0.35 + i * 0.9) * 22;
      const y = isPeak ? 28 + pulse : isTrough ? 182 - pulse : 115 + pulse * 0.3;
      return `${x},${clamp(y, 12, 198)}`;
    })
    .join(" ");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 60px",
        transform: `scale(${camZoom})`,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 34 }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 40, color: "#94A3B8" }}>
          Isse aapke brain mein trigger hota hai
        </div>
        <div style={{ fontFamily: "Impact, sans-serif", fontSize: 84, color: CRIMSON, letterSpacing: 3, marginTop: 8 }}>
          FOMO (FEAR OF MISSING OUT)
        </div>
      </div>

      <div
        style={{
          width: 900,
          padding: 46,
          borderRadius: 28,
          background: PANEL_BG,
          border: `4px solid ${CRIMSON}`,
          boxShadow: `0 0 85px rgba(255,42,84,0.38)`,
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 24, color: "#E2E8F0", fontWeight: 900 }}>
            NEURAL FOMO SPIKE // LIVE
          </span>
          <span
            style={{
              padding: "6px 18px",
              borderRadius: 8,
              background: CRIMSON,
              color: "#FFF",
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 20,
            }}
          >
            LOGIC: OFF // PANIC: {panicLevel}%
          </span>
        </div>

        <div style={{ padding: "24px", borderRadius: 18, background: "#050811", border: "2px solid #1E293B" }}>
          <svg width="790" height="210" viewBox="0 0 790 210">
            <polyline fill="none" stroke={CRIMSON} strokeWidth="7" strokeLinejoin="round" points={pts} />
          </svg>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 28 }}>
          <div
            style={{
              flex: 1,
              padding: "22px",
              borderRadius: 16,
              background: "#090E1A",
              border: "2px solid #334155",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#94A3B8", fontFamily: "'Courier New', monospace", fontSize: 20 }}>
              BRAIN THINKING
            </div>
            <div style={{ color: "#64748B", fontFamily: "Impact, sans-serif", fontSize: 50, marginTop: 8 }}>
              SOCHNA BAND!
            </div>
          </div>
          <div
            style={{
              flex: 1.2,
              padding: "22px",
              borderRadius: 16,
              background: "rgba(255,42,84,0.16)",
              border: `3px solid ${CRIMSON}`,
              textAlign: "center",
            }}
          >
            <div style={{ color: "#FFFFFF", fontFamily: "'Courier New', monospace", fontSize: 20 }}>
              FEAR RESPONSE
            </div>
            <div style={{ color: GOLD, fontFamily: "Impact, sans-serif", fontSize: 48, marginTop: 8 }}>
              "HAATH SE NIKAL JAYEGA!"
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   06. WAREHOUSE REALITY SCENE (SCENE 7)
   ========================================================================= */
const WarehouseRealityScene: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();
  const camZoom = interpolate(localFrame, [0, 270], [0.96, 1.07], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 55px",
        transform: `scale(${camZoom})`,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 38, color: "#94A3B8" }}>
          Jabki unke asli warehouse mein
        </div>
        <div style={{ fontFamily: "Impact, sans-serif", fontSize: 78, color: NEON_GREEN, letterSpacing: 2, marginTop: 8 }}>
          HAZARON PIECES PADE HOTE HAIN!
        </div>
      </div>

      <div
        style={{
          width: 900,
          padding: "24px 36px",
          borderRadius: 22,
          background: "rgba(255,42,84,0.14)",
          border: `3px solid ${CRIMSON}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 26,
        }}
      >
        <div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 20, color: "#FDA4AF", fontWeight: 900 }}>
            FAKE FRONTEND ILLUSION
          </div>
          <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 34, color: "#FFFFFF", marginTop: 4 }}>
            ON YOUR PHONE SCREEN:
          </div>
        </div>
        <div
          style={{
            padding: "12px 28px",
            borderRadius: 10,
            background: CRIMSON,
            color: "#FFF",
            fontFamily: "Impact, sans-serif",
            fontSize: 48,
          }}
        >
          "ONLY 1 LEFT!"
        </div>
      </div>

      <div
        style={{
          width: 900,
          padding: "36px",
          borderRadius: 26,
          background: PANEL_BG,
          border: `4px solid ${NEON_GREEN}`,
          boxShadow: `0 0 80px ${GREEN_GLOW}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 22, color: NEON_GREEN, fontWeight: 900 }}>
            ACTUAL WAREHOUSE INVENTORY
          </span>
          <span
            style={{
              padding: "6px 20px",
              borderRadius: 8,
              background: NEON_GREEN,
              color: "#040806",
              fontFamily: "Impact, sans-serif",
              fontSize: 32,
            }}
          >
            10,480+ BOXES IN STOCK
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const boxPop = spring({
              frame: Math.max(0, localFrame - i * 3),
              fps,
              config: { damping: 12, stiffness: 180 },
            });
            return (
              <div
                key={i}
                style={{
                  height: 74,
                  borderRadius: 10,
                  background: "#0B1528",
                  border: `2px solid ${NEON_GREEN}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: `scale(${boxPop})`,
                }}
              >
                <div style={{ width: "75%", height: 10, background: NEON_GREEN, borderRadius: 4, marginBottom: 6 }} />
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: 14, color: "#E2E8F0", fontWeight: 900 }}>
                  BOX #{101 + i}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   07. MASTER TIMELINE ORCHESTRATOR (ZERO DEAD AIR)
   ========================================================================= */
const ScarcityDirectorCutReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  // Hook & Closing Camera Moves (Never static!)
  const hook1Zoom = interpolate(frame, [0, 198], [1.14, 0.98], { extrapolateRight: "clamp" });
  const hook2Zoom = interpolate(frame - 198, [0, 192], [0.95, 1.1], { extrapolateRight: "clamp" });
  const close1Zoom = interpolate(frame - Math.round(31.8 * FPS), [0, 180], [1.12, 0.98], { extrapolateRight: "clamp" });
  const close2Zoom = interpolate(frame - Math.round(34.8 * FPS), [0, 192], [0.95, 1.08], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: DARK_BG }}>
      {/* ===================================================================
          HOOK BEAT 1A (0.0s - 3.3s): PAPER EDITORIAL + RED ALERT BADGE
         =================================================================== */}
      {sec < 3.3 && (
        <AbsoluteFill style={{ backgroundColor: PAPER_BG }}>
          <OpticalVignette frame={frame} />
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: "0 70px",
              transform: `scale(${hook1Zoom})`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <ShadowPopLine
                text="Online shopping karte waqt ye"
                localFrame={frame}
                appearFrame={2}
                font="serifItalic"
                size={64}
                color="#334155"
              />
              <ShadowPopLine
                text="ONLY 2 LEFT IN STOCK"
                localFrame={frame}
                appearFrame={26}
                font="impact"
                size={104}
                color="#FFFFFF"
                boxBg={CRIMSON}
                letterSpacing={3}
              />
              <ShadowPopLine
                text="ka red alert dekha hai?"
                localFrame={frame}
                appearFrame={56}
                font="mono"
                size={56}
                color="#0F172A"
              />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          HOOK BEAT 1B (3.3s - 6.5s): DARK CONTRAST FLIP — "DIRTY MIND GAME"
         =================================================================== */}
      {sec >= 3.3 && sec < 6.5 && (
        <AbsoluteFill style={{ backgroundColor: DARK_BG }}>
          <OpticalVignette frame={frame} dark />
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: "0 70px",
              transform: `scale(${hook2Zoom})`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <ShadowPopLine
                text="Chalo aaj iske peeche ka"
                localFrame={frame - Math.round(3.3 * FPS)}
                appearFrame={4}
                font="serifItalic"
                size={64}
                color="#94A3B8"
              />
              <ShadowPopLine
                text="DIRTY MIND GAME"
                localFrame={frame - Math.round(3.3 * FPS)}
                appearFrame={26}
                font="impact"
                size={112}
                color="#040806"
                boxBg={NEON_GREEN}
                letterSpacing={3}
              />
              <ShadowPopLine
                text="DEKHTE HAIN."
                localFrame={frame - Math.round(3.3 * FPS)}
                appearFrame={52}
                font="sansBold"
                size={76}
                color="#FFFFFF"
              />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          SCENE 2 (6.5s - 11.2s): PHONE APP — SNEAKER RS. 2000 (CAMERA ZOOM)
         =================================================================== */}
      {sec >= 6.5 && sec < 11.2 && (
        <DynamicSneakerPhoneScene
          mode="browsing"
          localFrame={frame - Math.round(6.5 * FPS)}
          sceneDuration={Math.round(4.7 * FPS)}
        />
      )}

      {/* ===================================================================
          SCENE 3 (11.2s - 14.8s): PHONE APP — CAMERA ZOOMS TO CLOSE [X]
         =================================================================== */}
      {sec >= 11.2 && sec < 14.8 && (
        <DynamicSneakerPhoneScene
          mode="hesitate"
          localFrame={frame - Math.round(11.2 * FPS)}
          sceneDuration={Math.round(3.6 * FPS)}
        />
      )}

      {/* ===================================================================
          SCENE 4 (14.8s - 19.5s): CAMERA MACRO ZOOM ON RED ALERT & TIMER
         =================================================================== */}
      {sec >= 14.8 && sec < 19.5 && (
        <DynamicSneakerPhoneScene
          mode="scarcityAttack"
          localFrame={frame - Math.round(14.8 * FPS)}
          sceneDuration={Math.round(4.7 * FPS)}
        />
      )}

      {/* ===================================================================
          SCENE 5 (19.5s - 23.2s): LIVE ANIMATED BRAIN FOMO ECG MONITOR
         =================================================================== */}
      {sec >= 19.5 && sec < 23.2 && (
        <LiveBrainFomoScene localFrame={frame - Math.round(19.5 * FPS)} />
      )}

      {/* ===================================================================
          SCENE 6 (23.2s - 27.2s): INSTANT RS. 2000 PURCHASE + UPI RECEIPT
         =================================================================== */}
      {sec >= 23.2 && sec < 27.2 && (
        <DynamicSneakerPhoneScene
          mode="purchased"
          localFrame={frame - Math.round(23.2 * FPS)}
          sceneDuration={Math.round(4.0 * FPS)}
        />
      )}

      {/* ===================================================================
          SCENE 7 (27.2s - 31.8s): WAREHOUSE 10,000+ BOXES REALITY
         =================================================================== */}
      {sec >= 27.2 && sec < 31.8 && (
        <WarehouseRealityScene localFrame={frame - Math.round(27.2 * FPS)} />
      )}

      {/* ===================================================================
          CLOSING BEAT 8A (31.8s - 34.8s): THE SCARCITY TRAP CONCEPT LOCK
         =================================================================== */}
      {sec >= 31.8 && sec < 34.8 && (
        <AbsoluteFill style={{ backgroundColor: PAPER_BG }}>
          <OpticalVignette frame={frame} />
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: "0 70px",
              transform: `scale(${close1Zoom})`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <ShadowPopLine
                text="Ise dark psychology mein kehte hain"
                localFrame={frame - Math.round(31.8 * FPS)}
                appearFrame={4}
                font="serifItalic"
                size={62}
                color="#334155"
              />
              <ShadowPopLine
                text="THE SCARCITY TRAP"
                localFrame={frame - Math.round(31.8 * FPS)}
                appearFrame={26}
                font="impact"
                size={108}
                color="#FFFFFF"
                boxBg="#0F172A"
                letterSpacing={3}
              />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          CLOSING BEAT 8B (34.8s - 38.0s): DARK HIGH-IMPACT COMMENT CTA
         =================================================================== */}
      {sec >= 34.8 && (
        <AbsoluteFill style={{ backgroundColor: DARK_BG }}>
          <OpticalVignette frame={frame} dark />
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: "0 70px",
              transform: `scale(${close2Zoom})`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <ShadowPopLine
                text="Is 'Only 1 Left' ke chakkar mein"
                localFrame={frame - Math.round(34.8 * FPS)}
                appearFrame={4}
                font="mono"
                size={52}
                color={NEON_GREEN}
              />
              <ShadowPopLine
                text="kabhi jaldbazi mein shopping ki hai?"
                localFrame={frame - Math.round(34.8 * FPS)}
                appearFrame={26}
                font="serifItalic"
                size={62}
                color="#FFFFFF"
              />
              <ShadowPopLine
                text="REALITY COMMENT MEIN BATAO"
                localFrame={frame - Math.round(34.8 * FPS)}
                appearFrame={52}
                font="impact"
                size={84}
                color="#FFFFFF"
                boxBg={CRIMSON}
                letterSpacing={2}
              />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          MINIMAL SFX TIMELINE (ONLY MONEY KA-CHING & 1 STOCK ALERT BEEP)
         =================================================================== */}
      {/* 1. Sneaker Price RS. 2000 Reveal (6.9s) */}
      <Sequence from={Math.round(6.9 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.kaching} volume={0.85} />
      </Sequence>

      {/* 2. "Only 1 Left in Stock" Red Alert Trigger (15.0s) */}
      <Sequence from={Math.round(15.0 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.alertBeep} volume={0.78} />
      </Sequence>

      {/* 3. Instant Purchase of RS. 2000 Sneaker (23.7s) */}
      <Sequence from={Math.round(23.7 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.kaching} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ScarcityDirectorCutReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
