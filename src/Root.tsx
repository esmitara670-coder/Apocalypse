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
   THE FAKE SCARCITY TRAP — DETAILED VISUAL SCENES + MINIMAL MONEY SFX
   1080 x 1920 | 60 FPS | 38.0 Seconds (2280 Frames)
   - Detailed Interactive Scenes: Smartphone Sneaker App, Stock Depletion Bar,
     Flip-Clock Timer, Brain FOMO ECG Graph, UPI Payment Receipt, Warehouse Grid
   - Typography ONLY on Short Bridge Cuts (Hook & Closing Concept)
   - SFX ONLY on Money/Purchase Moments (Ka-Ching) + 1 Stock Alert Beep
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
  const duration = type === "kaching" ? 0.52 : 0.34;
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
      // Crisp metallic coin + cash register bell
      const f1 = p < 0.18 ? 1480 : 2960;
      const f2 = p < 0.18 ? 2217 : 4435;
      const sp = p < 0.18 ? p / 0.18 : (p - 0.18) / 0.82;
      w =
        Math.sin(2 * Math.PI * f1 * t) * 0.55 +
        Math.sin(2 * Math.PI * f2 * t) * 0.35 +
        Math.sin(2 * Math.PI * (f1 * 1.5) * t) * 0.15;
      env = Math.exp(-sp * 7.5);
    } else {
      // Clean double radar beep for "Only 1 Left" alert
      const f = p < 0.45 ? 880 : 1174.6;
      const lp = p < 0.45 ? p / 0.45 : (p - 0.45) / 0.55;
      w = Math.sin(2 * Math.PI * f * t) * 0.65;
      env = Math.exp(-lp * 8.5);
    }

    view.setInt16(44 + i * 2, clamp(w * env * 0.8, -1, 1) * 32767, true);
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
   02. STRAIGHT SHADOW TYPOGRAPHY (USED ONLY FOR HOOK & CLOSING BRIDGES)
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
}> = ({ text, localFrame, appearFrame, font, size, color, boxBg }) => {
  const { fps } = useVideoConfig();
  const rel = localFrame - appearFrame;
  if (rel < 0) return null;

  const pop = spring({ frame: rel, fps, config: { damping: 14, stiffness: 170 } });
  const scale = interpolate(pop, [0, 1], [1.3, 1]);
  const yOff = interpolate(pop, [0, 1], [32, 0]);
  const ghostBlur = interpolate(pop, [0, 1], [22, 0]);
  const ghostAlpha = interpolate(pop, [0, 0.7, 1], [0.55, 0.28, 0.12]);
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
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: (1 - pop) * 35,
          fontFamily: fSpec.family,
          fontStyle: fSpec.style,
          fontWeight: fSpec.weight,
          fontSize: size,
          color: "#000000",
          opacity: ghostAlpha,
          filter: `blur(${6 + ghostBlur}px)`,
          pointerEvents: "none",
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "relative",
          display: "inline-block",
          fontFamily: fSpec.family,
          fontStyle: fSpec.style,
          fontWeight: fSpec.weight,
          fontSize: size,
          lineHeight: 1.08,
          color,
          backgroundColor: boxBg || "transparent",
          padding: boxBg ? "10px 32px" : "0 10px",
          borderRadius: boxBg ? 10 : 0,
          boxShadow: boxBg ? "0 18px 40px rgba(0,0,0,0.28)" : "none",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* =========================================================================
   03. DETAILED CUSTOM SVG SNEAKER ILLUSTRATION
   ========================================================================= */
const DetailedSneakerSvg: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <svg width={320 * scale} height={200 * scale} viewBox="0 0 320 200">
    {/* Glowing Ground Shadow */}
    <ellipse cx="160" cy="178" rx="130" ry="12" fill="rgba(0, 255, 102, 0.2)" />
    {/* Midsole & Outsole */}
    <path
      d="M25 145 L295 145 C302 145 305 168 290 170 L30 170 C18 170 18 145 25 145 Z"
      fill="#F8FAFC"
      stroke="#0F172A"
      strokeWidth="4"
    />
    <path d="M35 162 L285 162" stroke={NEON_GREEN} strokeWidth="5" />
    {/* Main Sneaker Upper Body */}
    <path
      d="M30 145 L35 72 L95 72 L135 35 L165 45 L160 80 L285 112 C298 118 298 145 288 145 Z"
      fill="#1E293B"
      stroke={CYAN}
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    {/* Heel Counter & Toe Cap Overlay */}
    <path
      d="M30 145 L35 88 L88 105 L78 145 Z"
      fill="rgba(255, 42, 84, 0.85)"
      stroke="#FFFFFF"
      strokeWidth="2.5"
    />
    {/* Iconic Side Swoosh / Stripe */}
    <path
      d="M85 102 L195 128 L235 105"
      fill="none"
      stroke={NEON_GREEN}
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Laces */}
    <line x1="145" y1="58" x2="175" y2="52" stroke="#FFFFFF" strokeWidth="4" />
    <line x1="158" y1="72" x2="188" y2="66" stroke="#FFFFFF" strokeWidth="4" />
    <line x1="172" y1="86" x2="202" y2="80" stroke="#FFFFFF" strokeWidth="4" />
  </svg>
);

/* =========================================================================
   04. DETAILED INTERACTIVE SMARTPHONE SNEAKER APP (SCENES 2, 3, 4, 6)
   ========================================================================= */
const DetailedSneakerPhoneScene: React.FC<{
  mode: "browsing" | "hesitate" | "scarcityAttack" | "purchased";
  localFrame: number;
}> = ({ mode, localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 150 } });

  // Stock bar drains from 10 down to 1 in "scarcityAttack" mode
  const stockCount =
    mode === "scarcityAttack"
      ? Math.max(1, Math.floor(interpolate(localFrame, [5, 45], [9, 1], { extrapolateRight: "clamp" })))
      : 1;
  const stockPct = mode === "scarcityAttack" ? interpolate(localFrame, [5, 45], [75, 12], { extrapolateRight: "clamp" }) : 12;

  // Countdown Timer ticking down
  const secLeft = Math.max(41, 59 - Math.floor(localFrame / 18));

  // Cursor animation for "hesitate" (moves to Close X) or "purchased" (clicks BUY NOW)
  const cursorX =
    mode === "hesitate"
      ? interpolate(localFrame, [10, 65], [290, 495], { extrapolateRight: "clamp" })
      : mode === "purchased"
        ? interpolate(localFrame, [0, 30], [420, 290], { extrapolateRight: "clamp" })
        : 290;
  const cursorY =
    mode === "hesitate"
      ? interpolate(localFrame, [10, 65], [780, 125], { extrapolateRight: "clamp" })
      : mode === "purchased"
        ? interpolate(localFrame, [0, 30], [620, 960], { extrapolateRight: "clamp" })
        : 780;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, justifyContent: "center", alignItems: "center" }}>
      {/* Subtle Radial Glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 54%, ${
            mode === "scarcityAttack" ? "rgba(255,42,84,0.22)" : "rgba(0,255,102,0.16)"
          } 0%, ${DARK_BG} 70%)`,
        }}
      />

      {/* Compact Context Caption at Very Top */}
      <div style={{ position: "absolute", top: 75, left: 60, right: 60, textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 36, color: "#94A3B8" }}>
          {mode === "browsing" && "Maan lo aap phone par ek Sneaker dekh rahe ho"}
          {mode === "hesitate" && "Aap sochte ho — 'Abhi rehne deta hoon, baad mein lunga'"}
          {mode === "scarcityAttack" && "Tabhi price ke niche RED ALERT aur TIMER aata hai!"}
          {mode === "purchased" && "Result? Jo chahiye nahi tha, aap turant kharid lete ho!"}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 64,
            color: mode === "scarcityAttack" ? CRIMSON : NEON_GREEN,
            letterSpacing: 2,
          }}
        >
          {mode === "browsing" && "PRICE: RS. 2000"}
          {mode === "hesitate" && "CLOSING THE APP..."}
          {mode === "scarcityAttack" && "HURRY! ONLY 1 LEFT IN STOCK!"}
          {mode === "purchased" && "ORDER PAID: RS. 2000"}
        </div>
      </div>

      {/* 3D SMARTPHONE FRAME */}
      <div
        style={{
          marginTop: 140,
          width: 640,
          height: 1180,
          borderRadius: 62,
          background: "#090E1A",
          border: `10px solid ${mode === "scarcityAttack" ? CRIMSON : "#263248"}`,
          boxShadow: `0 35px 90px rgba(0,0,0,0.9), 0 0 70px ${
            mode === "scarcityAttack" ? "rgba(255,42,84,0.35)" : "rgba(0,255,102,0.2)"
          }`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          transform: `scale(${0.92 + pop * 0.08})`,
        }}
      >
        {/* Phone Status Bar */}
        <div
          style={{
            height: 58,
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
          <div style={{ width: 130, height: 26, borderRadius: 16, background: "#000" }} />
          <span style={{ color: NEON_GREEN }}>5G • 99%</span>
        </div>

        {/* App Top Bar with Close 'X' Button */}
        <div
          style={{
            padding: "18px 30px",
            background: "#0D1526",
            borderBottom: "2px solid #1E293B",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 24, color: "#FFF", letterSpacing: 2 }}>
            SNKR // STORE
          </span>
          <div
            style={{
              padding: "6px 18px",
              borderRadius: 8,
              background: mode === "hesitate" && localFrame > 50 ? CRIMSON : "#1E293B",
              color: "#FFF",
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 18,
            }}
          >
            CLOSE [X]
          </div>
        </div>

        {/* App Content Body */}
        <div style={{ flex: 1, padding: "24px 30px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Sneaker Showcase Box */}
          <div
            style={{
              padding: "22px",
              borderRadius: 24,
              background: "#060A14",
              border: "2px solid #1E293B",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: CYAN, fontFamily: "'Courier New', monospace", fontSize: 18, fontWeight: 800 }}>
                AIR CYBER HIGH // 01
              </span>
              <span style={{ color: GOLD, fontFamily: "'Arial Black', sans-serif", fontSize: 18 }}>
                4.9 ★ (1.4k)
              </span>
            </div>

            <DetailedSneakerSvg scale={0.95} />

            {/* Size Pills + Green Price Highlight */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
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
                  boxShadow: `0 0 35px ${NEON_GREEN}`,
                }}
              >
                RS. 2000
              </div>
            </div>
          </div>

          {/* DYNAMIC LOWER SECTION BASED ON STORY SCENE */}
          {mode === "hesitate" && (
            <div
              style={{
                padding: "24px",
                borderRadius: 20,
                background: "#131C31",
                border: "2px dashed #64748B",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 28, color: "#E2E8F0" }}>
                "Abhi zaroorat nahi hai... baad mein dekhunga."
              </div>
            </div>
          )}

          {mode === "scarcityAttack" && (
            <div
              style={{
                padding: "22px 24px",
                borderRadius: 22,
                background: "rgba(255, 42, 84, 0.16)",
                border: `4px solid ${CRIMSON}`,
                boxShadow: `0 0 50px rgba(255,42,84,0.4)`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "Impact, sans-serif", fontSize: 36, color: "#FFFFFF", letterSpacing: 1 }}>
                  HURRY! ONLY {stockCount} LEFT IN STOCK!
                </span>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: CRIMSON,
                    color: "#FFF",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  HIGH DEMAND
                </span>
              </div>

              {/* Draining Red Inventory Progress Bar */}
              <div
                style={{
                  marginTop: 14,
                  width: "100%",
                  height: 20,
                  borderRadius: 10,
                  background: "#090D16",
                  border: `2px solid ${CRIMSON}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: `${stockPct}%`, height: "100%", background: CRIMSON }} />
              </div>

              {/* Flip-Clock Reverse Countdown Timer */}
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
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: 20, color: GOLD, fontWeight: 900 }}>
                  OFFER EXPIRES IN:
                </span>
                <span style={{ fontFamily: "Impact, sans-serif", fontSize: 38, color: GOLD, letterSpacing: 3 }}>
                  00 : 04 : {secLeft}
                </span>
              </div>
            </div>
          )}

          {mode === "purchased" && localFrame > 32 && (
            <div
              style={{
                padding: "22px 24px",
                borderRadius: 20,
                background: "#052916",
                border: `4px solid ${NEON_GREEN}`,
                boxShadow: `0 0 55px ${GREEN_GLOW}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 20, color: NEON_GREEN, fontWeight: 900 }}>
                UPI PAYMENT SUCCESSFUL
              </div>
              <div style={{ fontFamily: "Impact, sans-serif", fontSize: 52, color: "#FFFFFF", marginTop: 6 }}>
                PAID RS. 2000 INSTANTLY!
              </div>
            </div>
          )}

          {/* Bottom Checkout CTA Button */}
          <div
            style={{
              padding: "24px 0",
              borderRadius: 18,
              background: mode === "scarcityAttack" ? CRIMSON : NEON_GREEN,
              color: mode === "scarcityAttack" ? "#FFFFFF" : "#040806",
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 36,
              textAlign: "center",
              letterSpacing: 2,
              boxShadow: `0 0 40px ${mode === "scarcityAttack" ? CRIMSON : NEON_GREEN}`,
            }}
          >
            {mode === "purchased" && localFrame > 32
              ? "ORDER CONFIRMED [ RS. 2000 ]"
              : "BUY NOW • RS. 2000"}
          </div>
        </div>

        {/* Animated Touch Cursor inside Phone */}
        {(mode === "hesitate" || mode === "purchased") && (
          <div
            style={{
              position: "absolute",
              left: cursorX,
              top: cursorY,
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.35)",
              border: "4px solid #FFFFFF",
              boxShadow: `0 0 30px ${CYAN}`,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   05. DETAILED SCENE 5: BRAIN FOMO NEURAL ECG MONITOR
   ========================================================================= */
const BrainFomoMonitorScene: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 160 } });
  const panicLevel = Math.floor(interpolate(localFrame, [0, 50], [35, 99], { extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 40, color: "#94A3B8" }}>
          Isse aapke brain mein trigger hota hai
        </div>
        <div style={{ fontFamily: "Impact, sans-serif", fontSize: 86, color: CRIMSON, letterSpacing: 3, marginTop: 8 }}>
          FOMO (FEAR OF MISSING OUT)
        </div>
      </div>

      {/* Neural Telemetry Dashboard Card */}
      <div
        style={{
          width: 900,
          padding: 46,
          borderRadius: 28,
          background: PANEL_BG,
          border: `4px solid ${CRIMSON}`,
          boxShadow: `0 0 85px rgba(255,42,84,0.35)`,
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 24, color: "#E2E8F0", fontWeight: 900 }}>
            BRAIN DECISION MONITOR
          </span>
          <span style={{ padding: "6px 18px", borderRadius: 8, background: CRIMSON, color: "#FFF", fontFamily: "'Arial Black', sans-serif", fontSize: 20 }}>
            LOGIC: OFF // PANIC: {panicLevel}%
          </span>
        </div>

        {/* High-Frequency ECG Panic Waveform */}
        <div style={{ padding: "24px", borderRadius: 18, background: "#050811", border: "2px solid #1E293B" }}>
          <svg width="790" height="210" viewBox="0 0 790 210">
            <polyline
              fill="none"
              stroke={CRIMSON}
              strokeWidth="7"
              strokeLinejoin="round"
              points="0,140 80,140 120,30 160,190 210,15 255,195 310,45 360,175 415,10 465,195 520,35 575,180 630,20 685,160 790,140"
            />
          </svg>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 28 }}>
          <div style={{ flex: 1, padding: "22px", borderRadius: 16, background: "#090E1A", border: "2px solid #334155", textAlign: "center" }}>
            <div style={{ color: "#94A3B8", fontFamily: "'Courier New', monospace", fontSize: 20 }}>LOGICAL THINKING</div>
            <div style={{ color: "#64748B", fontFamily: "Impact, sans-serif", fontSize: 52, marginTop: 8 }}>0% SHUTDOWN</div>
          </div>
          <div style={{ flex: 1, padding: "22px", borderRadius: 16, background: "rgba(255,42,84,0.16)", border: `3px solid ${CRIMSON}`, textAlign: "center" }}>
            <div style={{ color: "#FFFFFF", fontFamily: "'Courier New', monospace", fontSize: 20 }}>IMPULSE URGENCY</div>
            <div style={{ color: GOLD, fontFamily: "Impact, sans-serif", fontSize: 52, marginTop: 8 }}>
              "ABHI NAHI LIYA TOH GAYA!"
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   06. DETAILED SCENE 7: APP "ONLY 1 LEFT" VS 10,000+ WAREHOUSE BOXES GRID
   ========================================================================= */
const WarehouseRealityScene: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, justifyContent: "center", alignItems: "center", padding: "0 55px" }}>
      <div style={{ textAlign: "center", marginBottom: 34 }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 38, color: "#94A3B8" }}>
          Jabki unke asli warehouse mein
        </div>
        <div style={{ fontFamily: "Impact, sans-serif", fontSize: 78, color: NEON_GREEN, letterSpacing: 2, marginTop: 8 }}>
          HAZARON PIECES PADE HOTE HAIN!
        </div>
      </div>

      {/* Top Card: What the App Lies to You */}
      <div
        style={{
          width: 900,
          padding: "26px 36px",
          borderRadius: 22,
          background: "rgba(255,42,84,0.14)",
          border: `3px solid ${CRIMSON}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 20, color: "#FDA4AF", fontWeight: 900 }}>
            FAKE FRONTEND ILLUSION
          </div>
          <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 34, color: "#FFFFFF", marginTop: 4 }}>
            WHAT YOU SEE ON PHONE:
          </div>
        </div>
        <div style={{ padding: "12px 28px", borderRadius: 10, background: CRIMSON, color: "#FFF", fontFamily: "Impact, sans-serif", fontSize: 48 }}>
          "ONLY 1 LEFT!"
        </div>
      </div>

      {/* Bottom Giant Warehouse Inventory Shelving Grid (24 Animated Shoeboxes) */}
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
            BACKEND WAREHOUSE REALITY
          </span>
          <span style={{ padding: "6px 20px", borderRadius: 8, background: NEON_GREEN, color: "#040806", fontFamily: "Impact, sans-serif", fontSize: 32 }}>
            STOCK: 10,480 UNITS
          </span>
        </div>

        {/* 6x4 Grid of Sneaker Boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const boxPop = spring({
              frame: Math.max(0, localFrame - i * 2),
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
   07. MASTER TIMELINE ORCHESTRATOR (38 SECONDS)
   ========================================================================= */
const ScarcityDetailedReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  // SCENE BREAKDOWN:
  // 1 (0.0s - 6.5s): Typography Hook Bridge ("Only 2 Left in Stock... Dirty Mind Game")
  // 2 (6.5s - 11.2s): Detailed Phone App — Browsing Sneaker @ RS. 2000 (SFX: Ka-Ching)
  // 3 (11.2s - 14.8s): Detailed Phone App — Hesitating / Cursor moves to Close [X]
  // 4 (14.8s - 19.5s): Detailed Phone App — Red Stock Drain Bar + Live Timer (SFX: Alert Beep)
  // 5 (19.5s - 23.2s): Detailed Brain FOMO ECG Monitor (Logic 0%, Panic 99%)
  // 6 (23.2s - 27.2s): Detailed Phone App — Cursor clicks BUY NOW -> Paid RS. 2000 (SFX: Ka-Ching)
  // 7 (27.2s - 31.8s): Detailed Warehouse Split Reality (24 Animated Sneaker Boxes vs 1 Left)
  // 8 (31.8s - 38.0s): Typography Closing Bridge ("The Scarcity Trap" + Comment CTA)

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: DARK_BG }}>
      {/* SCENE 1 (0.0s - 6.5s): TYPOGRAPHY HOOK BRIDGE */}
      {sec < 6.5 && (
        <AbsoluteFill style={{ backgroundColor: PAPER_BG, justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <ShadowPopLine text="Online shopping karte waqt" localFrame={frame} appearFrame={4} font="serifItalic" size={58} color="#334155" />
            <ShadowPopLine text="ONLY 2 LEFT IN STOCK" localFrame={frame} appearFrame={30} font="impact" size={96} color="#FFFFFF" boxBg={CRIMSON} />
            <ShadowPopLine text="ka red alert dekha hai?" localFrame={frame} appearFrame={62} font="mono" size={52} color="#0F172A" />
            <ShadowPopLine text="Chalo aaj iske peeche ka" localFrame={frame} appearFrame={135} font="serifItalic" size={56} color="#475569" />
            <ShadowPopLine text="DIRTY MIND GAME DEKHTE HAIN" localFrame={frame} appearFrame={165} font="impact" size={82} color="#FFFFFF" boxBg="#0F172A" />
          </div>
        </AbsoluteFill>
      )}

      {/* SCENE 2 (6.5s - 11.2s): DETAILED PHONE APP — SNEAKER RS. 2000 */}
      {sec >= 6.5 && sec < 11.2 && (
        <DetailedSneakerPhoneScene mode="browsing" localFrame={frame - Math.round(6.5 * FPS)} />
      )}

      {/* SCENE 3 (11.2s - 14.8s): DETAILED PHONE APP — USER HESITATES */}
      {sec >= 11.2 && sec < 14.8 && (
        <DetailedSneakerPhoneScene mode="hesitate" localFrame={frame - Math.round(11.2 * FPS)} />
      )}

      {/* SCENE 4 (14.8s - 19.5s): DETAILED PHONE APP — SCARCITY BAR & LIVE TIMER */}
      {sec >= 14.8 && sec < 19.5 && (
        <DetailedSneakerPhoneScene mode="scarcityAttack" localFrame={frame - Math.round(14.8 * FPS)} />
      )}

      {/* SCENE 5 (19.5s - 23.2s): DETAILED BRAIN FOMO ECG MONITOR */}
      {sec >= 19.5 && sec < 23.2 && (
        <BrainFomoMonitorScene localFrame={frame - Math.round(19.5 * FPS)} />
      )}

      {/* SCENE 6 (23.2s - 27.2s): DETAILED PHONE APP — INSTANT RS. 2000 PURCHASE */}
      {sec >= 23.2 && sec < 27.2 && (
        <DetailedSneakerPhoneScene mode="purchased" localFrame={frame - Math.round(23.2 * FPS)} />
      )}

      {/* SCENE 7 (27.2s - 31.8s): DETAILED WAREHOUSE INVENTORY REALITY */}
      {sec >= 27.2 && sec < 31.8 && (
        <WarehouseRealityScene localFrame={frame - Math.round(27.2 * FPS)} />
      )}

      {/* SCENE 8 (31.8s - 38.0s): TYPOGRAPHY CLOSING & CTA BRIDGE */}
      {sec >= 31.8 && (
        <AbsoluteFill style={{ backgroundColor: PAPER_BG, justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <ShadowPopLine text="Ise dark psychology mein kehte hain" localFrame={frame - Math.round(31.8 * FPS)} appearFrame={4} font="serifItalic" size={56} color="#334155" />
            <ShadowPopLine text="THE SCARCITY TRAP" localFrame={frame - Math.round(31.8 * FPS)} appearFrame={28} font="impact" size={102} color="#FFFFFF" boxBg="#0F172A" />
            <ShadowPopLine text="Is 'Only 1 Left' ke chakkar mein" localFrame={frame - Math.round(31.8 * FPS)} appearFrame={95} font="mono" size={48} color={CRIMSON} />
            <ShadowPopLine text="kabhi jaldbazi mein shopping ki hai?" localFrame={frame - Math.round(31.8 * FPS)} appearFrame={125} font="serifItalic" size={58} color="#0F172A" />
            <ShadowPopLine text="REALITY COMMENT MEIN BATAO" localFrame={frame - Math.round(31.8 * FPS)} appearFrame={158} font="impact" size={78} color="#FFFFFF" boxBg={CRIMSON} />
          </div>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          MINIMAL SFX TIMELINE (ONLY MONEY KA-CHING & 1 STOCK ALERT BEEP)
         =================================================================== */}
      {/* 1. Sneaker Price RS. 2000 Reveal (7.0s) */}
      <Sequence from={Math.round(7.0 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.kaching} volume={0.85} />
      </Sequence>

      {/* 2. "Only 1 Left in Stock" Red Alert Trigger (15.0s) */}
      <Sequence from={Math.round(15.0 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.alertBeep} volume={0.75} />
      </Sequence>

      {/* 3. Instant Purchase of RS. 2000 Sneaker (23.8s) */}
      <Sequence from={Math.round(23.8 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.kaching} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ScarcityDetailedReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
