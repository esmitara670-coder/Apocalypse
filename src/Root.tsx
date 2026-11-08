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
const DURATION = 2430; // 40.5s @ 60 FPS

const NEON_GREEN = "#00FF66";
const GREEN_GLOW = "rgba(0, 255, 102, 0.38)";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const CYAN = "#00F0FF";
const DARK_BG = "#04060A";
const PANEL_BG = "rgba(10, 15, 24, 0.95)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

type SfxKind = "cashKaching" | "coinClink" | "markerSwipe" | "mechThock" | "subDrop" | "cardSnap" | "uiPop";

function buildCrispSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations: Record<SfxKind, number> = {
    cashKaching: 0.5,
    coinClink: 0.32,
    markerSwipe: 0.24,
    mechThock: 0.14,
    subDrop: 0.45,
    cardSnap: 0.2,
    uiPop: 0.16,
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
      const f = 310 + Math.pow(p, 1.5) * 620;
      w = Math.sin(2 * Math.PI * f * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 0.85);
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
  coinClink: buildCrispSfx("coinClink"),
  markerSwipe: buildCrispSfx("markerSwipe"),
  mechThock: buildCrispSfx("mechThock"),
  subDrop: buildCrispSfx("subDrop"),
  cardSnap: buildCrispSfx("cardSnap"),
  uiPop: buildCrispSfx("uiPop"),
};

type CutSpec = {
  id: number;
  startSec: number;
  endSec: number;
  tag: string;
  titleTop: string;
  titleMain: string;
  subLabel: string;
  accent: string;
  primarySfx: SfxKind;
  moneySfx?: { offsetSec: number; kind: SfxKind };
};

const CUTS: CutSpec[] = [
  { id: 1, startSec: 0.0, endSec: 2.2, tag: "HOOK // 01", titleTop: "BADI COMPANIES AAPKO", titleMain: "'FREE' KE NAAM PAR KAISE LOOT-TI HAIN?", subLabel: "DARK E-COMMERCE PSYCHOLOGY", accent: NEON_GREEN, primarySfx: "markerSwipe", moneySfx: { offsetSec: 0.28, kind: "subDrop" } },
  { id: 2, startSec: 2.2, endSec: 4.2, tag: "HOOK // 02", titleTop: "CHALO AAJ", titleMain: "EXACTLY DEKHTE HAIN.", subLabel: "LIVE CHECKOUT SIMULATION", accent: NEON_GREEN, primarySfx: "mechThock", moneySfx: { offsetSec: 0.22, kind: "cardSnap" } },
  { id: 3, startSec: 4.2, endSec: 6.4, tag: "SHOPPING APP // 03", titleTop: "MAAN LO AAP PHONE PAR EK", titleMain: "T-SHIRT KHARID RAHE HO", subLabel: "PRODUCT SELECTED IN APP", accent: CYAN, primarySfx: "uiPop", moneySfx: { offsetSec: 0.35, kind: "cardSnap" } },
  { id: 4, startSec: 6.4, endSec: 8.6, tag: "ITEM PRICE // 04", titleTop: "APP MEIN T-SHIRT KI PRICE HAI", titleMain: "RS. 400", subLabel: "ADDED TO SHOPPING BAG", accent: NEON_GREEN, primarySfx: "cashKaching" },
  { id: 5, startSec: 8.6, endSec: 10.8, tag: "DELIVERY FEE // 05", titleTop: "AUR DELIVERY CHARGE HAI", titleMain: "+ RS. 50", subLabel: "EXTRA SHIPPING ADDED", accent: CRIMSON, primarySfx: "coinClink" },
  { id: 6, startSec: 10.8, endSec: 13.0, tag: "CART SUMMARY // 06", titleTop: "AAPKA TOTAL BILL HUA", titleMain: "RS. 450", subLabel: "RS. 400 ITEM + RS. 50 SHIPPING", accent: NEON_GREEN, primarySfx: "coinClink", moneySfx: { offsetSec: 0.25, kind: "markerSwipe" } },
  { id: 7, startSec: 13.0, endSec: 15.5, tag: "PAIN POINT // 07", titleTop: "AAPKO LAGTA HAI RS. 50 DELIVERY", titleMain: "PURE WASTE HAI", subLabel: "NOBODY LIKES PAYING SHIPPING", accent: CRIMSON, primarySfx: "subDrop" },
  { id: 8, startSec: 15.5, endSec: 18.2, tag: "APP BANNER // 08", titleTop: "TABHI PHONE PAR BANNER AATA HAI:", titleMain: "FREE SHIPPING ABOVE RS. 500", subLabel: "ADD RS. 100 MORE TO UNLOCK", accent: NEON_GREEN, primarySfx: "markerSwipe", moneySfx: { offsetSec: 0.3, kind: "coinClink" } },
  { id: 9, startSec: 18.2, endSec: 20.6, tag: "THE BAIT // 09", titleTop: "US RS. 50 KI DELIVERY KO", titleMain: "BACHANE KE LIYE...", subLabel: "BRAIN SCROLLS FOR ADD-ONS", accent: GOLD, primarySfx: "mechThock", moneySfx: { offsetSec: 0.2, kind: "coinClink" } },
  { id: 10, startSec: 20.6, endSec: 23.4, tag: "EXTRA ITEM // 10", titleTop: "AAP BEECH MEIN ADD KAR LETE HO:", titleMain: "RS. 150 KA EXTRA ITEM", subLabel: "3-CARD CART EXPANSION", accent: NEON_GREEN, primarySfx: "cardSnap", moneySfx: { offsetSec: 0.25, kind: "cashKaching" } },
  { id: 11, startSec: 23.4, endSec: 26.0, tag: "FINAL CHECKOUT // 11", titleTop: "RESULT? APP MEIN TOTAL BILL BANA", titleMain: "RS. 550", subLabel: "ORDER PAID VIA UPI", accent: NEON_GREEN, primarySfx: "cashKaching" },
  { id: 12, startSec: 26.0, endSec: 28.6, tag: "PROFIT MATH // 12", titleTop: "COMPANY NE CHALAKI SE KHARCH", titleMain: "RS. 100 BADHA DIYA", subLabel: "RS. 450 OLD BILL vs RS. 550 NEW BILL", accent: CRIMSON, primarySfx: "coinClink", moneySfx: { offsetSec: 0.28, kind: "subDrop" } },
  { id: 13, startSec: 28.6, endSec: 31.2, tag: "THE ILLUSION // 13", titleTop: "SIRF US 'FREE' WORD KA", titleMain: "ILLUSION BANAKAR", subLabel: "PSYCHOLOGICAL TRIGGER WORD", accent: NEON_GREEN, primarySfx: "markerSwipe" },
  { id: 14, startSec: 31.2, endSec: 33.6, tag: "DARK PATTERN // 14", titleTop: "ISE KEHTE HAIN", titleMain: "THE FREE SHIPPING TRAP", subLabel: "E-COMMERCE MIND TRICK", accent: CYAN, primarySfx: "subDrop", moneySfx: { offsetSec: 0.22, kind: "cardSnap" } },
  { id: 15, startSec: 33.6, endSec: 36.0, tag: "REALITY CHECK // 15", titleTop: "PICHHLI BAAR US RS. 50 KI", titleMain: "DELIVERY BACHANE KE LIYE...", subLabel: "THINK ABOUT YOUR LAST ORDER", accent: GOLD, primarySfx: "mechThock" },
  { id: 16, startSec: 36.0, endSec: 38.2, tag: "YOUR BILL // 16", titleTop: "AAPNE KITNE RUPEES KA", titleMain: "FALTU SAAMAN KHARIDA THA?", subLabel: "RS. 200? RS. 500? RS. 1,000?", accent: NEON_GREEN, primarySfx: "cashKaching" },
  { id: 17, startSec: 38.2, endSec: 40.5, tag: "COMMENT BELOW // 17", titleTop: "APNI REALITY", titleMain: "COMMENT MEIN BATAO.", subLabel: "DROP YOUR EXTRA SPEND AMOUNT", accent: NEON_GREEN, primarySfx: "uiPop", moneySfx: { offsetSec: 0.25, kind: "coinClink" } },
];

const highlightMoney = (text: string) => {
  const parts = text.split(/(RS\.\s*\d+|'FREE'|FREE|\+\s*RS\.\s*\d+)/g);
  return parts.map((part, i) => {
    if (!/^(RS\.\s*\d+|'FREE'|FREE|\+\s*RS\.\s*\d+)$/.test(part)) return <React.Fragment key={i}>{part}</React.Fragment>;
    return (
      <span key={i} style={{ display: "inline-block", padding: "2px 18px", margin: "0 6px", borderRadius: 10, background: NEON_GREEN, color: "#030705", boxShadow: `0 0 35px ${NEON_GREEN}99`, fontWeight: 900 }}>
        {part}
      </span>
    );
  });
};

/* =========================================================================
   UPGRADED PRO KINETIC TYPOGRAPHY HOOKS (CUT 1, CUT 2 & CUT 14)
   ========================================================================= */
const ProKineticHookStage: React.FC<{ cut: CutSpec; localFrame: number }> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();
  const s1 = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 200 } });
  const s2 = spring({ frame: Math.max(0, localFrame - 7), fps, config: { damping: 10, stiffness: 220 } });
  const s3 = spring({ frame: Math.max(0, localFrame - 14), fps, config: { damping: 12, stiffness: 190 } });
  const sweep = interpolate(localFrame, [10, 36], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // CUT 1: 3D STACKED KINETIC POSTER ("BADI COMPANIES AAPKO 'FREE' KE NAAM PAR KAISE LOOT-TI HAIN?")
  if (cut.id === 1) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 55px" }}>
        <div style={{ transform: `perspective(1000px) rotateX(${(1 - s1) * 25}deg) rotateY(-4deg)`, width: "100%", maxWidth: 940 }}>
          {/* Row 1: Top Sliding Bar */}
          <div style={{ transform: `translateX(${(1 - s1) * -180}px)`, opacity: s1, display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
            <div style={{ width: 18, height: 52, background: NEON_GREEN, boxShadow: `0 0 25px ${NEON_GREEN}` }} />
            <span style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 56, fontWeight: 900, color: "#FFFFFF", letterSpacing: 3 }}>
              BADI COMPANIES AAPKO
            </span>
          </div>

          {/* Row 2: Giant Tilted Neon Green "FREE" Box Slam */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "22px 0", transform: `scale(${interpolate(s2, [0, 1], [1.8, 1])}) rotate(-2deg)`, opacity: s2 }}>
            <div style={{ padding: "14px 44px", borderRadius: 18, background: NEON_GREEN, color: "#030805", fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 118, fontWeight: 900, boxShadow: `0 0 85px ${NEON_GREEN}`, border: "5px solid #FFFFFF" }}>
              "FREE"
            </div>
            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 64, fontWeight: 900, color: "#E2E8F0", lineHeight: 1.05 }}>
              KE NAAM<br />PAR
            </div>
          </div>

          {/* Row 3: Bottom Crimson/White Reveal + Laser Underline */}
          <div style={{ transform: `translateY(${(1 - s3) * 80}px)`, opacity: s3, marginTop: 20 }}>
            <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 88, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.05 }}>
              KAISE <span style={{ color: CRIMSON, textShadow: `0 0 50px ${CRIMSON}` }}>LOOT-TI HAIN?</span>
            </div>
            <div style={{ marginTop: 18, height: 10, width: `${sweep}%`, background: `linear-gradient(90deg, ${NEON_GREEN}, ${CRIMSON})`, borderRadius: 6, boxShadow: `0 0 30px ${NEON_GREEN}` }} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // CUT 2: VIEWFINDER SHUTTER LOCK ("CHALO AAJ EXACTLY DEKHTE HAIN")
  if (cut.id === 2) {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 55px", textAlign: "center" }}>
        <div style={{ fontSize: 68, fontWeight: 900, fontFamily: '"Arial Black", sans-serif', color: "#CBD5E1", letterSpacing: 6, transform: `translateY(${(1 - s1) * -60}px)`, opacity: s1 }}>
          CHALO AAJ
        </div>

        {/* Center Viewfinder Target Box */}
        <div style={{ position: "relative", margin: "28px 0", padding: "26px 64px", background: "rgba(0,255,102,0.12)", border: `4px solid ${NEON_GREEN}`, borderRadius: 20, boxShadow: `0 0 90px ${GREEN_GLOW}`, transform: `scale(${0.7 + s2 * 0.3})`, opacity: s2 }}>
          <div style={{ position: "absolute", top: -12, left: -12, width: 32, height: 32, borderTop: "6px solid #FFF", borderLeft: "6px solid #FFF" }} />
          <div style={{ position: "absolute", top: -12, right: -12, width: 32, height: 32, borderTop: "6px solid #FFF", borderRight: "6px solid #FFF" }} />
          <div style={{ position: "absolute", bottom: -12, left: -12, width: 32, height: 32, borderBottom: "6px solid #FFF", borderLeft: "6px solid #FFF" }} />
          <div style={{ position: "absolute", bottom: -12, right: -12, width: 32, height: 32, borderBottom: "6px solid #FFF", borderRight: "6px solid #FFF" }} />
          <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 112, fontWeight: 900, color: NEON_GREEN, letterSpacing: 4, textShadow: `0 0 50px ${NEON_GREEN}` }}>
            EXACTLY
          </div>
        </div>

        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 92, fontWeight: 900, color: "#FFFFFF", transform: `translateY(${(1 - s3) * 70}px)`, opacity: s3 }}>
          DEKHTE HAIN.
        </div>
      </AbsoluteFill>
    );
  }

  // CUT 14: THE FREE SHIPPING TRAP FULL-SCREEN LOCK
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 55px", textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 900, color: CYAN, letterSpacing: 8, marginBottom: 20 }}>[ {cut.titleTop} ]</div>
      <div style={{ padding: "30px 50px", borderRadius: 24, background: PANEL_BG, border: `5px solid ${NEON_GREEN}`, boxShadow: `0 0 95px ${GREEN_GLOW}`, transform: `scale(${0.85 + s1 * 0.15})` }}>
        <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 88, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.08 }}>
          THE <span style={{ color: NEON_GREEN }}>FREE SHIPPING</span> TRAP
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   REALISTIC 3D SMARTPHONE SHOPPING APP STAGE (CUTS 3, 4, 5, 6, 7, 8, 9, 11)
   ========================================================================= */
const PhoneShoppingAppStage: React.FC<{ cutId: number; localFrame: number }> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 13, stiffness: 170 } });
  const bannerDrop = spring({ frame: cutId === 8 ? localFrame : 25, fps, config: { damping: 11, stiffness: 180 } });
  const tapScale = cutId === 3 && localFrame > 35 ? interpolate(localFrame, [35, 45, 55], [1, 0.9, 1], { extrapolateRight: "clamp" }) : 1;

  return (
    <div
      style={{
        width: 580,
        height: 1060,
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
      {/* Phone Status Bar & Dynamic Island Notch */}
      <div style={{ height: 64, background: "#05080F", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 36px", color: "#94A3B8", fontSize: 18, fontWeight: 800 }}>
        <span>9:41</span>
        <div style={{ width: 140, height: 30, borderRadius: 20, background: "#000000", border: "1px solid #1E293B" }} />
        <span style={{ color: NEON_GREEN }}>5G • 98%</span>
      </div>

      {/* Shopping App Top Navbar */}
      <div style={{ padding: "18px 32px", background: "#0B111E", borderBottom: "2px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 900, letterSpacing: 3 }}>SHOP.IN</span>
        <div style={{ padding: "6px 18px", borderRadius: 100, background: "rgba(0,255,102,0.15)", border: `2px solid ${NEON_GREEN}`, color: NEON_GREEN, fontSize: 18, fontWeight: 900 }}>
          BAG [{cutId >= 11 ? "02" : "01"}]
        </div>
      </div>

      {/* CUT 8 & 9: FREE SHIPPING PROMO BANNER INSIDE THE PHONE APP! */}
      {(cutId === 8 || cutId === 9) && (
        <div style={{ margin: "16px 24px 0", padding: "18px 20px", borderRadius: 18, background: "#052414", border: `3px solid ${NEON_GREEN}`, boxShadow: `0 0 40px ${GREEN_GLOW}`, transform: `translateY(${(1 - bannerDrop) * -80}px)` }}>
          <div style={{ color: NEON_GREEN, fontSize: 23, fontWeight: 900, textAlign: "center", letterSpacing: 1 }}>
            FREE SHIPPING ON ORDERS ABOVE RS. 500!
          </div>
          <div style={{ marginTop: 12, height: 18, borderRadius: 9, background: "#09131C", overflow: "hidden", border: `1px solid ${NEON_GREEN}` }}>
            <div style={{ width: "80%", height: "100%", background: NEON_GREEN }} />
          </div>
          <div style={{ marginTop: 8, color: GOLD, fontSize: 18, fontWeight: 900, textAlign: "center" }}>
            CURRENT CART: RS. 400 • ADD RS. 100 MORE!
          </div>
        </div>
      )}

      {/* MAIN APP BODY CONTENT */}
      <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* T-SHIRT PRODUCT CARD INSIDE PHONE APP */}
        <div style={{ padding: 24, borderRadius: 24, background: "#0E1626", border: cutId === 4 ? `4px solid ${NEON_GREEN}` : "2px solid #1E293B", display: "flex", gap: 24, alignItems: "center", boxShadow: cutId === 4 ? `0 0 45px ${GREEN_GLOW}` : "none" }}>
          {/* T-Shirt Vector Preview Box */}
          <div style={{ width: 175, height: 185, borderRadius: 18, background: "#060A12", border: `2px solid ${CYAN}66`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <svg width="125" height="125" viewBox="0 0 170 170">
              <path d="M45 25 L65 25 C72 38 98 38 105 25 L125 25 L155 55 L135 80 L120 65 L120 145 L50 145 L50 65 L35 80 L15 55 Z" fill="#111C2D" stroke={CYAN} strokeWidth="5" strokeLinejoin="round" />
            </svg>
            <div style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 8px", borderRadius: 6, background: GOLD, color: "#000", fontSize: 14, fontWeight: 900 }}>
              4.9 ★
            </div>
          </div>

          {/* Product Details inside App */}
          <div style={{ flex: 1 }}>
            <div style={{ color: CYAN, fontSize: 17, fontWeight: 900, letterSpacing: 2 }}>URBAN STREETWEAR</div>
            <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 900, marginTop: 4 }}>OVERSIZED BLACK TEE</div>

            {/* Size Selector Pills */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {["S", "M", "L", "XL"].map((sz) => (
                <div key={sz} style={{ width: 42, height: 36, borderRadius: 8, background: sz === "M" ? NEON_GREEN : "#070B12", color: sz === "M" ? "#030805" : "#64748B", border: sz === "M" ? `2px solid #FFF` : "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>
                  {sz}
                </div>
              ))}
            </div>

            {/* Price Tag */}
            <div style={{ marginTop: 16, display: "inline-block", padding: cutId === 4 ? "8px 24px" : "4px 14px", borderRadius: 10, background: cutId === 4 ? NEON_GREEN : "transparent", color: cutId === 4 ? "#030805" : NEON_GREEN, fontFamily: '"Arial Black", sans-serif', fontSize: cutId === 4 ? 44 : 34, fontWeight: 900 }}>
              RS. 400
            </div>
          </div>
        </div>

        {/* DYNAMIC LOWER APP SECTION BASED ON CUT */}
        {cutId === 3 || cutId === 4 ? (
          /* CUT 3 & 4: PRODUCT SPECS + ADD TO CART BUTTON + FINGER TAP */
          <div style={{ position: "relative" }}>
            <div style={{ padding: 22, borderRadius: 20, background: "#0B111E", border: "1px solid #1E293B", marginBottom: 22, display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: 20, fontWeight: 800 }}>
              <span>100% HEAVY COTTON</span>
              <span style={{ color: NEON_GREEN }}>IN STOCK</span>
            </div>
            <div style={{ padding: "26px 0", borderRadius: 20, background: NEON_GREEN, color: "#030805", fontSize: 30, fontWeight: 900, textAlign: "center", letterSpacing: 2, transform: `scale(${tapScale})`, boxShadow: `0 0 45px ${NEON_GREEN}` }}>
              {cutId === 4 ? "ADDED TO BAG [ RS. 400 ]" : "ADD TO SHOPPING BAG"}
            </div>
            {/* Glowing Touch Indicator on Button */}
            {cutId === 3 && localFrame > 25 && (
              <div style={{ position: "absolute", bottom: 18, right: 90, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.35)", border: "4px solid #FFFFFF", boxShadow: `0 0 30px ${CYAN}`, transform: `scale(${tapScale})` }} />
            )}
          </div>
        ) : (
          /* CUT 5, 6, 7, 8, 9, 11: IN-APP BILLING & CHECKOUT BREAKDOWN */
          <div style={{ padding: 26, borderRadius: 24, background: "#0B111E", border: "2px solid #1E293B", position: "relative" }}>
            <div style={{ color: "#64748B", fontSize: 18, fontWeight: 900, letterSpacing: 3, marginBottom: 16 }}>
              ORDER SUMMARY // CHECKOUT
            </div>

            {/* Row 1: T-Shirt Price */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1E293B", color: "#E2E8F0", fontSize: 24, fontWeight: 800 }}>
              <span>1x Oversized Black Tee</span>
              <span>RS. 400</span>
            </div>

            {/* Row 2 (Only in Cut 11): Extra Item RS. 150 Added! */}
            {cutId === 11 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", margin: "10px 0", borderRadius: 12, background: "rgba(0,255,102,0.15)", border: `2px solid ${NEON_GREEN}`, color: NEON_GREEN, fontSize: 24, fontWeight: 900 }}>
                <span>+ 1x Extra Socks/Cap</span>
                <span>RS. 150</span>
              </div>
            )}

            {/* Row 3: Delivery Charge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", marginTop: 10, borderRadius: 12, background: cutId === 5 || cutId === 7 ? "rgba(255,42,84,0.18)" : "transparent", border: cutId === 5 || cutId === 7 ? `2px solid ${CRIMSON}` : "none" }}>
              <span style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 900 }}>Delivery Charge</span>
              {cutId === 11 ? (
                <span style={{ padding: "4px 14px", borderRadius: 8, background: NEON_GREEN, color: "#030805", fontSize: 24, fontWeight: 900 }}>FREE (RS. 0)</span>
              ) : (
                <span style={{ padding: "4px 16px", borderRadius: 8, background: cutId === 5 ? NEON_GREEN : CRIMSON, color: cutId === 5 ? "#030805" : "#FFF", fontSize: 28, fontWeight: 900 }}>+ RS. 50</span>
              )}
            </div>

            {/* CUT 7 STAMP: RS. 50 WASTE! */}
            {cutId === 7 && (
              <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%, -50%) rotate(-8deg)", padding: "12px 32px", borderRadius: 12, background: CRIMSON, border: "4px solid #FFF", color: "#FFF", fontSize: 30, fontWeight: 900, whiteSpace: "nowrap", boxShadow: `0 0 40px ${CRIMSON}` }}>
                RS. 50 = MONEY WASTE!
              </div>
            )}

            {/* Total Payable Bar */}
            <div style={{ marginTop: 20, padding: "18px 24px", borderRadius: 16, background: cutId === 6 || cutId === 11 ? NEON_GREEN : "#131C2E", color: cutId === 6 || cutId === 11 ? "#030805" : "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: cutId === 6 || cutId === 11 ? `0 0 45px ${NEON_GREEN}` : "none" }}>
              <span style={{ fontSize: 26, fontWeight: 900 }}>TOTAL PAYABLE</span>
              <span style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 44, fontWeight: 900 }}>
                {cutId === 11 ? "RS. 550" : "RS. 450"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   SPECIAL STAGES FOR CUT 10 (3-CARD SLAM) & CUTS 12-17
   ========================================================================= */
const SpecialDeckStage: React.FC<{ cutId: number; localFrame: number }> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 185 } });

  // CUT 10: HERO 3-CARD MIDDLE INSERTION (RS. 400 + RS. 150 EXTRA = RS. 550)
  if (cutId === 10) {
    const mid = spring({ frame: Math.max(0, localFrame - 6), fps, config: { damping: 10, stiffness: 200 } });
    return (
      <div style={{ width: 980, display: "flex", gap: 22, alignItems: "center" }}>
        <div style={{ flex: 1, padding: "40px 20px", borderRadius: 24, background: PANEL_BG, border: "2px solid #334155", textAlign: "center", opacity: 0.75 }}>
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>IN CART</div>
          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, margin: "12px 0" }}>T-SHIRT</div>
          <div style={{ color: "#CBD5E1", fontSize: 52, fontWeight: 900 }}>RS. 400</div>
        </div>
        <div style={{ flex: 1.28, padding: "48px 22px", borderRadius: 28, background: "#051F12", border: `5px solid ${NEON_GREEN}`, boxShadow: `0 0 95px ${NEON_GREEN}88`, textAlign: "center", transform: `translateY(${(1 - mid) * 90}px) scale(${0.84 + mid * 0.22})`, zIndex: 10 }}>
          <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 8, background: NEON_GREEN, color: "#030805", fontSize: 20, fontWeight: 900, marginBottom: 14 }}>+ EXTRA ITEM ADDED</div>
          <div style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900 }}>SOCKS / CAP</div>
          <div style={{ marginTop: 12, color: NEON_GREEN, fontFamily: '"Arial Black", sans-serif', fontSize: 80, fontWeight: 900 }}>RS. 150</div>
        </div>
        <div style={{ flex: 1, padding: "40px 20px", borderRadius: 24, background: PANEL_BG, border: `2px solid ${NEON_GREEN}66`, textAlign: "center", opacity: 0.85 }}>
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>DELIVERY</div>
          <div style={{ color: NEON_GREEN, fontSize: 32, fontWeight: 900, margin: "12px 0" }}>UNLOCKED</div>
          <div style={{ color: NEON_GREEN, fontSize: 52, fontWeight: 900 }}>FREE</div>
        </div>
      </div>
    );
  }

  // CUT 12: SIDE-BY-SIDE BILL COMPARISON (+ RS. 100 LOSS)
  if (cutId === 12) {
    return (
      <div style={{ width: 880, padding: 48, borderRadius: 28, background: PANEL_BG, border: `3px solid ${CRIMSON}`, transform: `scale(${0.9 + pop * 0.1})` }}>
        <div style={{ display: "flex", gap: 28, marginBottom: 30 }}>
          <div style={{ flex: 1, padding: 32, borderRadius: 20, background: "#080C14", border: "2px solid #334155", textAlign: "center" }}>
            <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>WITH RS. 50 DELIVERY</div>
            <div style={{ color: "#FFFFFF", fontSize: 60, fontWeight: 900, marginTop: 10 }}>RS. 450</div>
          </div>
          <div style={{ flex: 1, padding: 32, borderRadius: 20, background: "rgba(255,42,84,0.14)", border: `3px solid ${CRIMSON}`, textAlign: "center" }}>
            <div style={{ color: CRIMSON, fontSize: 22, fontWeight: 900 }}>WITH 'FREE' SHIPPING</div>
            <div style={{ color: "#FFFFFF", fontSize: 60, fontWeight: 900, marginTop: 10 }}>RS. 550</div>
          </div>
        </div>
        <div style={{ padding: "20px 32px", borderRadius: 14, background: NEON_GREEN, color: "#030805", fontSize: 38, fontWeight: 900, textAlign: "center", boxShadow: `0 0 50px ${NEON_GREEN}` }}>
          EXTRA SPENT FROM YOUR POCKET: + RS. 100
        </div>
      </div>
    );
  }

  // CUT 13: "FREE" ILLUSION TRAP
  if (cutId === 13) {
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `3px solid ${NEON_GREEN}`, textAlign: "center", transform: `scale(${0.9 + pop * 0.1})` }}>
        <div style={{ display: "inline-block", padding: "16px 54px", borderRadius: 16, border: `4px dashed ${NEON_GREEN}`, color: NEON_GREEN, fontFamily: '"Arial Black", sans-serif', fontSize: 96, fontWeight: 900 }}>
          "FREE"
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, marginTop: 26 }}>
          TO SAVE RS. 50 ➔ <span style={{ color: CRIMSON }}>YOU SPENT RS. 150 EXTRA</span>
        </div>
      </div>
    );
  }

  // CUT 15 & 16: CTA REALITY QUESTION
  if (cutId === 15 || cutId === 16) {
    return (
      <div style={{ width: 860, padding: 52, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 85px ${GREEN_GLOW}`, textAlign: "center", transform: `scale(${0.9 + pop * 0.1})` }}>
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          {cutId === 15 ? "YOUR LAST ONLINE ORDER" : "UNPLANNED EXTRA CART VALUE"}
        </div>
        <div style={{ marginTop: 22, display: "inline-block", padding: "18px 56px", borderRadius: 16, background: NEON_GREEN, color: "#030805", fontFamily: '"Arial Black", sans-serif', fontSize: cutId === 15 ? 72 : 104, fontWeight: 900 }}>
          {cutId === 15 ? "SAVE RS. 50 FEE" : "RS. ???"}
        </div>
      </div>
    );
  }

  // CUT 17: COMMENT BOX CTA
  return (
    <div style={{ width: 880, padding: 52, borderRadius: 28, background: PANEL_BG, border: `4px solid ${NEON_GREEN}`, boxShadow: `0 0 90px ${GREEN_GLOW}`, textAlign: "center", transform: `scale(${0.9 + pop * 0.1})` }}>
      <div style={{ color: NEON_GREEN, fontSize: 28, fontWeight: 900, letterSpacing: 5 }}>[ CONFESSION BOX // COMMENTS ]</div>
      <div style={{ marginTop: 26, padding: "32px 36px", borderRadius: 16, background: "#06090F", border: `2px solid ${NEON_GREEN}`, color: "#FFFFFF", fontSize: 38, fontWeight: 900 }}>
        "Maine RS. ___ ka extra saaman kharida tha."
      </div>
    </div>
  );
};

/* =========================================================================
   MASTER COMPOSITION
   ========================================================================= */
const FreeShippingTrapReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeCut = CUTS.find((c) => sec >= c.startSec && sec < c.endSec) ?? CUTS[CUTS.length - 1];
  const localFrame = Math.max(0, frame - Math.round(activeCut.startSec * FPS));
  const headPop = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 185 } });
  const progress = interpolate(frame, [0, DURATION], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = (frame * 1.1) % 80;

  const isFullHook = activeCut.id === 1 || activeCut.id === 2 || activeCut.id === 14;
  const isPhoneScene = [3, 4, 5, 6, 7, 8, 9, 11].includes(activeCut.id);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${activeCut.accent}22 0%, rgba(4,6,10,0.95) 62%, ${DARK_BG} 100%)` }} />
      <AbsoluteFill style={{ opacity: 0.13, backgroundImage: `linear-gradient(${activeCut.accent}33 1px, transparent 1px), linear-gradient(90deg, ${activeCut.accent}33 1px, transparent 1px)`, backgroundSize: "80px 80px", transform: `translateY(${shift}px)` }} />

      {/* Top 17-Segment Timeline */}
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

      {/* Telemetry Header */}
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
          {/* Top Compact Headline */}
          <div style={{ position: "absolute", top: 150, left: 48, right: 48, textAlign: "center", transform: `translateY(${(1 - headPop) * 35}px)`, opacity: headPop }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#94A3B8", letterSpacing: 4, marginBottom: 8 }}>
              {activeCut.titleTop}
            </div>
            <div style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 60, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.06 }}>
              {highlightMoney(activeCut.titleMain)}
            </div>
          </div>

          {/* Center Phone App or 3-Card Stage */}
          <div style={{ position: "absolute", top: 380, left: 0, right: 0, bottom: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isPhoneScene ? (
              <PhoneShoppingAppStage cutId={activeCut.id} localFrame={localFrame} />
            ) : (
              <SpecialDeckStage cutId={activeCut.id} localFrame={localFrame} />
            )}
          </div>
        </>
      )}

      {/* Bottom Progress Bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${progress}%`, background: NEON_GREEN, boxShadow: `0 0 25px ${NEON_GREEN}` }} />

      {/* SFX Triggers */}
      {CUTS.map((c) => (
        <React.Fragment key={`sfx-${c.id}`}>
          <Sequence from={Math.round(c.startSec * FPS)} durationInFrames={35} layout="none">
            <Audio src={SFX[c.primarySfx]} volume={0.82} />
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
