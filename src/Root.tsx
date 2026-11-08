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
   THE FREE SHIPPING TRAP — SENPAISPIDER PRO EDITION (V2 UPGRADE)
   1080 x 1920 | 60 FPS | 40.5 Seconds (2430 Frames) | 17 Sub-3s Cuts
   UPGRADES INCLUDED:
   1. Next-Gen Brutalist Hook Typography with Laser Slice & 3D Tunnel Zoom
   2. Interactive 3D Smartphone E-Commerce App UI (T-Shirt Page, Cart, Banner)
   3. Full-Screen Neon Green Vignette Flash on Every Money Beat
   4. 3D Vector Flying Cash Bills Burst ("Money Chora" Effect - Zero Emojis)
   5. Layered Money SFX (Cash Register Ka-Ching + Coin Shower + Bill Flutter)
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2430; // 40.5 Seconds @ 60 FPS

const NEON_GREEN = "#00FF66";
const GREEN_DARK = "#032211";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const CYAN = "#00F0FF";
const DARK_BG = "#030508";
const PANEL_BG = "rgba(9, 14, 22, 0.95)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. LAYERED MONEY & TACTILE UI PROCEDURAL SFX ENGINE
   ========================================================================= */

type SfxKind =
  | "cashKaching"
  | "coinShower"
  | "billFlutter"
  | "markerSwipe"
  | "mechThock"
  | "subDrop"
  | "cardSnap"
  | "laserSlice";

function buildProSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations: Record<SfxKind, number> = {
    cashKaching: 0.58,
    coinShower: 0.45,
    billFlutter: 0.32,
    markerSwipe: 0.24,
    mechThock: 0.14,
    subDrop: 0.48,
    cardSnap: 0.2,
    laserSlice: 0.28,
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
      // Punchy mechanical drawer clack + bright dual silver register bell
      const isDrawer = p < 0.16;
      const f1 = isDrawer ? 1320 : 2637;
      const f2 = isDrawer ? 1980 : 3951;
      const localP = isDrawer ? p / 0.16 : (p - 0.16) / 0.84;
      w =
        Math.sin(2 * Math.PI * f1 * t) * 0.55 +
        Math.sin(2 * Math.PI * f2 * t) * 0.35 +
        Math.sin(2 * Math.PI * 5274 * t) * 0.15;
      env = Math.exp(-localP * 6.5);
    } else if (kind === "coinShower") {
      // Multi-coin rapid metallic cascade
      const freqs = [2349, 2793, 3135, 3951];
      const idx = Math.min(3, Math.floor(p * 4));
      const subP = (p * 4) % 1;
      const f = freqs[idx];
      w =
        Math.sin(2 * Math.PI * f * t) * 0.6 +
        Math.sin(2 * Math.PI * (f * 1.5) * t) * 0.3;
      env = Math.exp(-subP * 8.5);
    } else if (kind === "billFlutter") {
      // Crisp paper money flicking / throwing sound
      const flutter = Math.sin(p * Math.PI * 14);
      const crisp = Math.sin(i * 23.7) * Math.cos(i * 4.3);
      w = crisp * 0.65 * Math.abs(flutter) + Math.sin(2 * Math.PI * 480 * t) * 0.2;
      env = Math.sin(Math.PI * p);
    } else if (kind === "markerSwipe") {
      const glideF = 260 + Math.sin(p * Math.PI) * 400;
      w =
        Math.sin(2 * Math.PI * glideF * t) * 0.65 +
        Math.sin(2 * Math.PI * (glideF * 1.5) * t) * 0.25;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (kind === "mechThock") {
      const bodyF = 185 * Math.exp(-p * 12) + 60;
      const click = Math.sin(2 * Math.PI * 1750 * t) * Math.exp(-p * 26);
      w = Math.sin(2 * Math.PI * bodyF * t) * 0.82 + click * 0.35;
      env = Math.exp(-p * 13);
    } else if (kind === "subDrop") {
      const f = 115 * Math.pow(1 - p * 0.68, 1.4) + 34;
      w =
        Math.sin(2 * Math.PI * f * t) * 0.88 +
        Math.sin(2 * Math.PI * (f * 2) * t) * 0.2;
      env = Math.pow(1 - p, 1.5);
    } else if (kind === "cardSnap") {
      const f = p < 0.4 ? 440 : 660;
      const lp = p < 0.4 ? p / 0.4 : (p - 0.4) / 0.6;
      w = Math.sin(2 * Math.PI * f * t) * 0.78;
      env = Math.exp(-lp * 12);
    } else if (kind === "laserSlice") {
      const f = 1400 - p * 1050;
      w =
        Math.sin(2 * Math.PI * f * t) * 0.6 +
        Math.sin(2 * Math.PI * (f * 0.5) * t) * 0.35;
      env = Math.sin(Math.PI * p) * Math.exp(-p * 3.5);
    }

    const out = clamp(w * env * 0.76, -1, 1);
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
  cashKaching: buildProSfx("cashKaching"),
  coinShower: buildProSfx("coinShower"),
  billFlutter: buildProSfx("billFlutter"),
  markerSwipe: buildProSfx("markerSwipe"),
  mechThock: buildProSfx("mechThock"),
  subDrop: buildProSfx("subDrop"),
  cardSnap: buildProSfx("cardSnap"),
  laserSlice: buildProSfx("laserSlice"),
};

/* =========================================================================
   02. 17 SUB-3-SECOND CUTS (WITH MONEY BURST & GREEN FLASH TRIGGERS)
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
  greenScreenFlash?: boolean;
  moneyRain?: boolean;
  primarySfx: SfxKind;
  secondarySfx?: { offsetSec: number; kind: SfxKind };
  tertiarySfx?: { offsetSec: number; kind: SfxKind };
};

const CUTS: CutSpec[] = [
  // CUT 1 (0.0s - 2.2s): UPGRADED BRUTALIST HOOK PART 1 + MONEY RAIN ON "LOOT-TI HAIN"
  {
    id: 1,
    startSec: 0.0,
    endSec: 2.2,
    tag: "EXPOSED // 01",
    titleTop: "BADI COMPANIES AAPKO",
    titleMain: "'FREE' KE NAAM PAR KAISE LOOT-TI HAIN?",
    subLabel: "PSYCHOLOGICAL PRICING BREAKDOWN",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    fullScreenTypo: true,
    greenScreenFlash: true,
    moneyRain: true,
    primarySfx: "markerSwipe",
    secondarySfx: { offsetSec: 0.25, kind: "cashKaching" },
    tertiarySfx: { offsetSec: 0.35, kind: "billFlutter" },
  },
  // CUT 2 (2.2s - 4.2s): UPGRADED HOOK PART 2 — LASER SLICE FULL-SCREEN TYPOGRAPHY
  {
    id: 2,
    startSec: 2.2,
    endSec: 4.2,
    tag: "DEEP DIVE // 02",
    titleTop: "CHALO AAJ",
    titleMain: "EXACTLY DEKHTE HAIN.",
    subLabel: "LIVE E-COMMERCE SIMULATION",
    accent: NEON_GREEN,
    textStyle: "wordStagger",
    fullScreenTypo: true,
    greenScreenFlash: true,
    primarySfx: "laserSlice",
    secondarySfx: { offsetSec: 0.2, kind: "subDrop" },
  },
  // CUT 3 (4.2s - 6.4s): SMARTPHONE APP OPENS — ONLINE T-SHIRT STORE
  {
    id: 3,
    startSec: 4.2,
    endSec: 6.4,
    tag: "MOBILE STORE // 03",
    titleTop: "MAAN LO AAP PHONE PAR EK",
    titleMain: "ONLINE T-SHIRT KHARID RAHE HO",
    subLabel: "APP STORE CHECKOUT SCREEN",
    accent: CYAN,
    textStyle: "slideSplit",
    primarySfx: "cardSnap",
    secondarySfx: { offsetSec: 0.3, kind: "mechThock" },
  },
  // CUT 4 (6.4s - 8.6s): PHONE SHOWS PRICE RS. 400 + GREEN SCREEN FLASH + FLYING CASH
  {
    id: 4,
    startSec: 6.4,
    endSec: 8.6,
    tag: "PRODUCT PRICE // 04",
    titleTop: "T-SHIRT KI PRICE HAI",
    titleMain: "RS. 400",
    subLabel: "ADDED TO MOBILE CART",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    greenScreenFlash: true,
    moneyRain: true,
    primarySfx: "cashKaching",
    secondarySfx: { offsetSec: 0.15, kind: "billFlutter" },
  },
  // CUT 5 (8.6s - 10.8s): PHONE SHOWS DELIVERY CHARGE + RS. 50
  {
    id: 5,
    startSec: 8.6,
    endSec: 10.8,
    tag: "SHIPPING FEE // 05",
    titleTop: "AUR DELIVERY CHARGE HAI",
    titleMain: "+ RS. 50",
    subLabel: "EXTRA SHIPPING FEE APPLIED",
    accent: CRIMSON,
    textStyle: "flip3D",
    greenScreenFlash: true,
    primarySfx: "coinShower",
    secondarySfx: { offsetSec: 0.2, kind: "subDrop" },
  },
  // CUT 6 (10.8s - 13.0s): PHONE CART TOTAL = RS. 450 + GREEN FLASH + MONEY RAIN
  {
    id: 6,
    startSec: 10.8,
    endSec: 13.0,
    tag: "CART TOTAL // 06",
    titleTop: "AAPKA TOTAL BILL HUA",
    titleMain: "RS. 450",
    subTag: "",
    subLabel: "RS. 400 ITEM + RS. 50 DELIVERY",
    accent: NEON_GREEN,
    textStyle: "letterSnap",
    greenScreenFlash: true,
    moneyRain: true,
    primarySfx: "cashKaching",
    secondarySfx: { offsetSec: 0.2, kind: "coinShower" },
  } as CutSpec,
  // CUT 7 (13.0s - 15.5s): PHONE SCREEN SHOWS RS. 50 DELIVERY AS "WASTE"
  {
    id: 7,
    startSec: 13.0,
    endSec: 15.5,
    tag: "PSYCHOLOGY // 07",
    titleTop: "AAPKO LAGTA HAI KI RS. 50 DENA",
    titleMain: "PURE WASTE HAI",
    subLabel: "NOBODY LIKES PAYING FOR SHIPPING",
    accent: CRIMSON,
    textStyle: "wordStagger",
    primarySfx: "subDrop",
    secondarySfx: { offsetSec: 0.25, kind: "cardSnap" },
  },
  // CUT 8 (15.5s - 18.2s): PHONE SCREEN POPS UP "FREE SHIPPING ABOVE RS. 500!" BANNER
  {
    id: 8,
    startSec: 15.5,
    endSec: 18.2,
    tag: "IN-APP BANNER // 08",
    titleTop: "TABHI PHONE PAR BANNER DIKHTA HAI:",
    titleMain: "FREE SHIPPING ABOVE RS. 500",
    subLabel: "UNLOCK FREE DELIVERY OFFER",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    greenScreenFlash: true,
    primarySfx: "laserSlice",
    secondarySfx: { offsetSec: 0.25, kind: "cashKaching" },
  },
  // CUT 9 (18.2s - 20.6s): SAVING THAT RS. 50 DELIVERY
  {
    id: 9,
    startSec: 18.2,
    endSec: 20.6,
    tag: "BRAIN TRAP // 09",
    titleTop: "AB US RS. 50 KI DELIVERY KO",
    titleMain: "BACHANE KE LIYE...",
    subLabel: "CHASING THE 'FREE' TAG",
    accent: GOLD,
    textStyle: "typewriter",
    primarySfx: "mechThock",
    secondarySfx: { offsetSec: 0.22, kind: "coinShower" },
  },
  // CUT 10 (20.6s - 23.4s): HERO 3-CARD SCENE! RS. 150 EXTRA ITEM SLAMS IN THE MIDDLE + MONEY RAIN
  {
    id: 10,
    startSec: 20.6,
    endSec: 23.4,
    tag: "THE INSERTION // 10",
    titleTop: "AAP BEECH MEIN ADD KAR LETE HO:",
    titleMain: "RS. 150 KA EXTRA ITEM",
    subLabel: "400 [TEE] + 150 [EXTRA] = 550",
    accent: NEON_GREEN,
    textStyle: "flip3D",
    greenScreenFlash: true,
    moneyRain: true,
    primarySfx: "cardSnap",
    secondarySfx: { offsetSec: 0.18, kind: "cashKaching" },
    tertiarySfx: { offsetSec: 0.3, kind: "billFlutter" },
  },
  // CUT 11 (23.4s - 26.0s): RESULT? TOTAL BILL RS. 550! (FULL GREEN EXPLOSION + FLYING CASH)
  {
    id: 11,
    startSec: 23.4,
    endSec: 26.0,
    tag: "FINAL RECEIPT // 11",
    titleTop: "RESULT? AAPKA TOTAL BILL BANA",
    titleMain: "RS. 550",
    subLabel: "YOU PAID RS. 550 AT CHECKOUT",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    greenScreenFlash: true,
    moneyRain: true,
    primarySfx: "cashKaching",
    secondarySfx: { offsetSec: 0.15, kind: "coinShower" },
    tertiarySfx: { offsetSec: 0.28, kind: "billFlutter" },
  },
  // CUT 12 (26.0s - 28.6s): COMPANY INCREASED YOUR SPEND BY RS. 100
  {
    id: 12,
    startSec: 26.0,
    endSec: 28.6,
    tag: "PROFIT JUMP // 12",
    titleTop: "COMPANY NE CHALAKI SE AAPKA KHARCH",
    titleMain: "+ RS. 100 BADHA DIYA",
    subLabel: "RS. 450 OLD BILL -> RS. 550 NEW BILL",
    accent: NEON_GREEN,
    textStyle: "slideSplit",
    greenScreenFlash: true,
    moneyRain: true,
    primarySfx: "cashKaching",
    secondarySfx: { offsetSec: 0.25, kind: "subDrop" },
  },
  // CUT 13 (28.6s - 31.2s): ONLY USING THE ILLUSION OF 'FREE'
  {
    id: 13,
    startSec: 28.6,
    endSec: 31.2,
    tag: "THE ILLUSION // 13",
    titleTop: "SIRF US 'FREE' WORD KA",
    titleMain: "ILLUSION BANAKAR",
    subLabel: "MIND MANIPULATION COMPLETE",
    accent: NEON_GREEN,
    textStyle: "letterSnap",
    primarySfx: "markerSwipe",
    secondarySfx: { offsetSec: 0.25, kind: "laserSlice" },
  },
  // CUT 14 (31.2s - 33.6s): THIS IS CALLED THE FREE SHIPPING TRAP
  {
    id: 14,
    startSec: 31.2,
    endSec: 33.6,
    tag: "DARK PATTERN // 14",
    titleTop: "ISE KEHTE HAIN",
    titleMain: "THE FREE SHIPPING TRAP",
    subLabel: "E-COMMERCE RULE #04",
    accent: CYAN,
    textStyle: "wordStagger",
    fullScreenTypo: true,
    greenScreenFlash: true,
    primarySfx: "subDrop",
    secondarySfx: { offsetSec: 0.2, kind: "cardSnap" },
  },
  // CUT 15 (33.6s - 36.0s): CTA PART 1 — TO SAVE RS. 50 DELIVERY
  {
    id: 15,
    startSec: 33.6,
    endSec: 36.0,
    tag: "BE HONEST // 15",
    titleTop: "PICHHLI BAAR US RS. 50 KI",
    titleMain: "DELIVERY BACHANE KE LIYE...",
    subLabel: "THINK ABOUT YOUR LAST ORDER",
    accent: GOLD,
    textStyle: "typewriter",
    primarySfx: "mechThock",
    secondarySfx: { offsetSec: 0.2, kind: "coinShower" },
  },
  // CUT 16 (36.0s - 38.2s): CTA PART 2 — HOW MUCH EXTRA DID YOU BUY?
  {
    id: 16,
    startSec: 36.0,
    endSec: 38.2,
    tag: "YOUR EXTRA BILL // 16",
    titleTop: "AAPNE KITNE RUPEES KA",
    titleMain: "FALTU SAAMAN KHARIDA THA?",
    subLabel: "RS. 200? RS. 500? RS. 1,000?",
    accent: NEON_GREEN,
    textStyle: "highlighter",
    greenScreenFlash: true,
    moneyRain: true,
    primarySfx: "cashKaching",
    secondarySfx: { offsetSec: 0.2, kind: "billFlutter" },
  },
  // CUT 17 (38.2s - 40.5s): CTA PART 3 — DROP REALITY IN COMMENTS
  {
    id: 17,
    startSec: 38.2,
    endSec: 40.5,
    tag: "COMMENT BELOW // 17",
    titleTop: "APNI REALITY",
    titleMain: "COMMENT MEIN BATAO.",
    subLabel: "TYPE YOUR AMOUNT BELOW",
    accent: NEON_GREEN,
    textStyle: "wordStagger",
    greenScreenFlash: true,
    primarySfx: "cardSnap",
    secondarySfx: { offsetSec: 0.2, kind: "coinShower" },
  },
];

/* =========================================================================
   03. VECTOR FLYING CASH BILLS ("MONEY CHORA" EFFECT) + FULL-SCREEN GREEN FLASH
   ========================================================================= */

const VectorCashBill: React.FC<{
  x: number;
  y: number;
  rot: number;
  scale: number;
  opacity: number;
}> = ({ x, y, rot, scale, opacity }) => {
  if (opacity <= 0.02) return null;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}
      opacity={opacity}
    >
      {/* Outer Crisp Banknote Rectangle */}
      <rect
        x="-85"
        y="-42"
        width="170"
        height="84"
        rx="8"
        fill="#062915"
        stroke={NEON_GREEN}
        strokeWidth="4"
      />
      {/* Inner Security Border */}
      <rect
        x="-73"
        y="-30"
        width="146"
        height="60"
        rx="4"
        fill="none"
        stroke={NEON_GREEN}
        strokeWidth="1.8"
        strokeDasharray="8 5"
      />
      {/* Center Currency Seal */}
      <circle
        cx="0"
        cy="0"
        r="20"
        fill="rgba(0, 255, 102, 0.2)"
        stroke={NEON_GREEN}
        strokeWidth="3"
      />
      <text
        x="0"
        y="9"
        textAnchor="middle"
        fill={NEON_GREEN}
        fontSize="26"
        fontWeight="900"
        fontFamily='"Arial Black", sans-serif'
      >
        ₹
      </text>
      {/* Corner Denominations */}
      <line x1="-62" y1="-16" x2="-36" y2="-16" stroke={NEON_GREEN} strokeWidth="4" />
      <line x1="36" y1="16" x2="62" y2="16" stroke={NEON_GREEN} strokeWidth="4" />
    </g>
  );
};

const MoneySplashAndGreenFlashOverlay: React.FC<{
  activeCut: CutSpec;
  localFrame: number;
}> = ({ activeCut, localFrame }) => {
  // 18 Vector Banknotes bursting outward when moneyRain is active
  const bills = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.2;
        const speed = 11 + (i % 5) * 4.5;
        return {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          rotSpeed: (i % 2 === 0 ? 1 : -1) * (4 + (i % 4) * 2),
          baseRot: i * 28,
          scale: 0.72 + (i % 4) * 0.14,
        };
      }),
    []
  );

  // Full-Screen Neon Green Flash Envelope (peaks at frame 6, decays smoothly)
  const flashIntensity = activeCut.greenScreenFlash
    ? interpolate(localFrame, [0, 6, 38], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 40 }}>
      {/* 1. FULL-SCREEN NEON GREEN VIGNETTE & RADIAL HIGHLIGHT FLASH */}
      {flashIntensity > 0.01 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(0,255,102,${
              flashIntensity * 0.22
            }) 0%, rgba(0,255,102,${flashIntensity * 0.06}) 55%, rgba(0,255,102,${
              flashIntensity * 0.38
            }) 100%)`,
            boxShadow: `inset 0 0 160px rgba(0, 255, 102, ${flashIntensity * 0.75})`,
            border: `6px solid rgba(0, 255, 102, ${flashIntensity * 0.85})`,
          }}
        />
      )}

      {/* 2. FLYING 3D VECTOR CASH BILLS ("MONEY CHORA" BURST) */}
      {activeCut.moneyRain && localFrame <= 75 && (
        <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          {bills.map((b, idx) => {
            const t = localFrame;
            const bx = 540 + b.vx * t * 1.35;
            const by = 980 + b.vy * t * 1.2 + 0.18 * t * t; // Gravity curve
            const brot = b.baseRot + b.rotSpeed * t;
            const bOpacity = interpolate(t, [0, 8, 52, 72], [0, 0.95, 0.85, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <VectorCashBill
                key={idx}
                x={bx}
                y={by}
                rot={brot}
                scale={b.scale}
                opacity={bOpacity}
              />
            );
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
};

/* =========================================================================
   04. UPGRADED HOOK FULL-SCREEN TYPOGRAPHY (CUT 1, CUT 2, CUT 14)
   ========================================================================= */

const UpgradedFullScreenHook: React.FC<{
  cut: CutSpec;
  localFrame: number;
}> = ({ cut, localFrame }) => {
  const { fps } = useVideoConfig();

  const camZoom = interpolate(localFrame, [0, 120], [0.94, 1.08], {
    extrapolateRight: "clamp",
  });

  const laserSweep = interpolate(localFrame, [4, 28], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // CUT 1: "BADI COMPANIES AAPKO 'FREE' KE NAAM PAR KAISE LOOT-TI HAIN?"
  if (cut.id === 1) {
    const p1 = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 200 } });
    const p2 = spring({
      frame: Math.max(0, localFrame - 8),
      fps,
      config: { damping: 11, stiffness: 220 },
    });
    const p3 = spring({
      frame: Math.max(0, localFrame - 18),
      fps,
      config: { damping: 10, stiffness: 240 },
    });

    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${camZoom})`,
          padding: "0 56px",
        }}
      >
        {/* Top Brutalist Frame */}
        <div
          style={{
            fontSize: 38,
            fontWeight: 900,
            color: "#CBD5E1",
            letterSpacing: 8,
            transform: `translateY(${(1 - p1) * -50}px)`,
            opacity: p1,
            marginBottom: 24,
          }}
        >
          BADI COMPANIES AAPKO
        </div>

        {/* Center Giant Neon Green "FREE" Box with Corner Crosshairs */}
        <div
          style={{
            position: "relative",
            padding: "22px 64px",
            background: NEON_GREEN,
            borderRadius: 16,
            boxShadow: `0 0 95px ${NEON_GREEN}`,
            transform: `scale(${interpolate(p2, [0, 1], [1.8, 1])})`,
            opacity: p2,
          }}
        >
          <span
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontSize: 128,
              fontWeight: 900,
              color: "#020604",
              letterSpacing: 4,
            }}
          >
            "FREE"
          </span>
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: "#94A3B8",
            letterSpacing: 7,
            marginTop: 28,
            opacity: p2,
          }}
        >
          KE NAAM PAR
        </div>

        {/* Bottom Slamming "KAISE LOOT-TI HAIN?" */}
        <div
          style={{
            marginTop: 18,
            padding: "16px 42px",
            border: `4px solid ${NEON_GREEN}`,
            background: "rgba(0, 255, 102, 0.12)",
            borderRadius: 14,
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 72,
            fontWeight: 900,
            color: "#FFFFFF",
            textShadow: `0 0 40px ${NEON_GREEN}99`,
            transform: `translateY(${(1 - p3) * 70}px)`,
            opacity: p3,
          }}
        >
          KAISE <span style={{ color: NEON_GREEN }}>LOOT-TI HAIN?</span>
        </div>
      </AbsoluteFill>
    );
  }

  // CUT 2: "CHALO AAJ EXACTLY DEKHTE HAIN." (LASER SLICE SPLIT REVEAL)
  if (cut.id === 2) {
    const slice = spring({
      frame: localFrame,
      fps,
      config: { damping: 12, stiffness: 210 },
    });

    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${camZoom})`,
          padding: "0 56px",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#E2E8F0",
            letterSpacing: 12,
            transform: `translateX(${(1 - slice) * -180}px)`,
            opacity: slice,
            marginBottom: 20,
          }}
        >
          CHALO AAJ
        </div>

        {/* Horizontal Laser Line */}
        <div
          style={{
            width: `${laserSweep * 8.6}px`,
            height: 6,
            background: NEON_GREEN,
            boxShadow: `0 0 35px ${NEON_GREEN}`,
            marginBottom: 26,
          }}
        />

        {/* Giant Green Highlighted "EXACTLY" */}
        <div
          style={{
            padding: "18px 54px",
            borderRadius: 16,
            background: `linear-gradient(90deg, ${NEON_GREEN} ${laserSweep}%, #071A10 ${laserSweep}%)`,
            boxShadow: `0 0 85px ${NEON_GREEN}99`,
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 118,
            fontWeight: 900,
            color: "#020604",
            letterSpacing: 2,
          }}
        >
          EXACTLY
        </div>

        <div
          style={{
            marginTop: 24,
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 88,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: 3,
            transform: `translateX(${(1 - slice) * 180}px)`,
            opacity: slice,
          }}
        >
          DEKHTE HAIN.
        </div>
      </AbsoluteFill>
    );
  }

  // CUT 14: "THE FREE SHIPPING TRAP"
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${camZoom})`,
        padding: "0 56px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: "#94A3B8",
          letterSpacing: 8,
          marginBottom: 22,
        }}
      >
        ISE KEHTE HAIN
      </div>
      <div
        style={{
          padding: "28px 48px",
          borderRadius: 20,
          border: `5px solid ${NEON_GREEN}`,
          background: "rgba(0, 255, 102, 0.14)",
          boxShadow: `0 0 90px ${NEON_GREEN}66`,
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: 82,
          fontWeight: 900,
          lineHeight: 1.08,
          color: "#FFFFFF",
        }}
      >
        THE <span style={{ color: NEON_GREEN }}>FREE SHIPPING</span> TRAP
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   05. INTERACTIVE 3D SMARTPHONE SHOPPING APP STAGE (CUTS 3 TO 8!)
   Shows Online T-Shirt, RS. 400 Price, RS. 50 Delivery & Free Shipping Banner
   directly on the Phone Screen!
   ========================================================================= */

const SmartphoneShoppingStage: React.FC<{
  cutId: number;
  localFrame: number;
}> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, stiffness: 170 },
  });

  const phoneTilt = Math.sin(localFrame * 0.06) * 2.5;

  // Banner drop animation inside the phone screen for Cut 8
  const bannerDrop = spring({
    frame: cutId === 8 ? localFrame : 0,
    fps,
    config: { damping: 11, stiffness: 185 },
  });

  const progressFill = interpolate(localFrame, [5, 50], [25, 80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 650,
        height: 1060,
        borderRadius: 62,
        background: "linear-gradient(165deg, #111927 0%, #06090F 100%)",
        border: `7px solid ${cutId === 8 || cutId === 4 || cutId === 6 ? NEON_GREEN : "#26354D"}`,
        boxShadow:
          cutId === 8 || cutId === 4 || cutId === 6
            ? `0 0 95px rgba(0, 255, 102, 0.45), 0 35px 80px rgba(0,0,0,0.9)`
            : "0 35px 85px rgba(0,0,0,0.9)",
        padding: "24px 32px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transform: `perspective(1100px) rotateY(${phoneTilt}deg) scale(${
          0.9 + pop * 0.1
        })`,
      }}
    >
      {/* 1. PHONE STATUS BAR & DYNAMIC ISLAND NOTCH */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#94A3B8",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 2,
            marginBottom: 18,
          }}
        >
          <span>9:41</span>
          <div
            style={{
              width: 145,
              height: 30,
              borderRadius: 20,
              background: "#000000",
              border: "1px solid #1E293B",
            }}
          />
          <span style={{ color: NEON_GREEN }}>5G // 100%</span>
        </div>

        {/* App Navigation Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 16,
            borderBottom: "2px solid #1E293B",
          }}
        >
          <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>
            URBAN STORE // ONLINE
          </span>
          <span
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              background: "rgba(0, 255, 102, 0.15)",
              border: `1.5px solid ${NEON_GREEN}`,
              color: NEON_GREEN,
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            CART [01]
          </span>
        </div>
      </div>

      {/* 2. CUT 8 IN-APP POPUP BANNER: "FREE SHIPPING ON ORDERS ABOVE RS. 500!" */}
      {cutId === 8 && (
        <div
          style={{
            position: "absolute",
            top: 115,
            left: 26,
            right: 26,
            padding: "22px 24px",
            borderRadius: 22,
            background: "#041F11",
            border: `4px solid ${NEON_GREEN}`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.95), 0 0 55px ${NEON_GREEN}88`,
            transform: `translateY(${(1 - bannerDrop) * -180}px)`,
            zIndex: 25,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 6,
              background: NEON_GREEN,
              color: "#020604",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            SPECIAL OFFER UNLOCKED
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontFamily: '"Arial Black", sans-serif',
              fontSize: 29,
              fontWeight: 900,
              lineHeight: 1.15,
            }}
          >
            FREE SHIPPING ON ORDERS ABOVE{" "}
            <span style={{ color: NEON_GREEN }}>RS. 500!</span>
          </div>

          {/* Progress Bar Inside Phone Banner */}
          <div
            style={{
              marginTop: 14,
              width: "100%",
              height: 20,
              borderRadius: 10,
              background: "#020A05",
              border: `1.5px solid ${NEON_GREEN}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressFill}%`,
                height: "100%",
                background: NEON_GREEN,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              color: GOLD,
              fontSize: 19,
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            ADD JUST RS. 100 MORE FOR FREE DELIVERY!
          </div>
        </div>
      )}

      {/* 3. ONLINE T-SHIRT PRODUCT SHOWCASE INSIDE PHONE */}
      <div
        style={{
          marginTop: cutId === 8 ? 175 : 16,
          padding: 24,
          borderRadius: 28,
          background: "#0B111C",
          border: "2px solid #1E293B",
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* Vector T-Shirt Graphic */}
        <div
          style={{
            width: 190,
            height: 190,
            borderRadius: 20,
            background: "#06090F",
            border: `2px solid ${CYAN}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="135" height="135" viewBox="0 0 170 170">
            <path
              d="M45 25 L65 25 C72 38 98 38 105 25 L125 25 L155 55 L135 80 L120 65 L120 145 L50 145 L50 65 L35 80 L15 55 Z"
              fill="rgba(0, 240, 255, 0.16)"
              stroke={CYAN}
              strokeWidth="5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Product Details & Size Selector */}
        <div style={{ flex: 1 }}>
          <div style={{ color: CYAN, fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>
            BESTSELLER // MENSWEAR
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, marginTop: 4 }}>
            OVERSIZED BLACK TEE
          </div>

          {/* Size Pills */}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {["S", "M", "L", "XL"].map((sz) => (
              <div
                key={sz}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: sz === "L" ? NEON_GREEN : "#131C2E",
                  color: sz === "L" ? "#030805" : "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                {sz}
              </div>
            ))}
          </div>

          {/* Highlighted Price Badge on Phone */}
          <div
            style={{
              marginTop: 16,
              display: "inline-block",
              padding: "8px 22px",
              borderRadius: 10,
              background: cutId >= 4 ? NEON_GREEN : "#1E293B",
              color: cutId >= 4 ? "#020604" : "#FFFFFF",
              fontFamily: '"Arial Black", sans-serif',
              fontSize: 34,
              fontWeight: 900,
              boxShadow: cutId === 4 ? `0 0 40px ${NEON_GREEN}` : "none",
            }}
          >
            PRICE: RS. 400
          </div>
        </div>
      </div>

      {/* 4. LIVE MOBILE CHECKOUT BILL BREAKDOWN */}
      <div
        style={{
          padding: 26,
          borderRadius: 28,
          background: "#080D16",
          border: `2px solid ${cutId === 7 ? CRIMSON : "#1E293B"}`,
        }}
      >
        <div
          style={{
            color: "#64748B",
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 3,
            marginBottom: 14,
          }}
        >
          ORDER SUMMARY // CHECKOUT
        </div>

        {/* Row 1: T-Shirt Price */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid #1E293B",
            fontSize: 26,
            fontWeight: 800,
            color: "#E2E8F0",
          }}
        >
          <span>1x Oversized T-Shirt</span>
          <span style={{ color: NEON_GREEN, fontWeight: 900 }}>RS. 400</span>
        </div>

        {/* Row 2: Delivery Charge (Appears from Cut 5 onwards) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            marginTop: 10,
            borderRadius: 12,
            background:
              cutId >= 5 ? "rgba(255, 42, 84, 0.16)" : "rgba(255,255,255,0.03)",
            border: cutId >= 5 ? `2px solid ${CRIMSON}` : "none",
            fontSize: 26,
            fontWeight: 900,
            color: "#FFFFFF",
          }}
        >
          <span>Delivery Charge</span>
          <span
            style={{
              padding: "4px 16px",
              borderRadius: 8,
              background: cutId >= 5 ? NEON_GREEN : "#334155",
              color: cutId >= 5 ? "#020604" : "#94A3B8",
              fontWeight: 900,
            }}
          >
            {cutId >= 5 ? "+ RS. 50" : "CALCULATING..."}
          </span>
        </div>

        {/* Cut 7 Waste Stamp inside Phone */}
        {cutId === 7 && (
          <div
            style={{
              marginTop: 12,
              padding: "10px",
              borderRadius: 10,
              background: CRIMSON,
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: 900,
              textAlign: "center",
              letterSpacing: 2,
            }}
          >
            RS. 50 FOR SHIPPING = 100% WASTE!
          </div>
        )}

        {/* Row 3: Total Bill Button */}
        <div
          style={{
            marginTop: 18,
            padding: "20px 26px",
            borderRadius: 18,
            background: cutId >= 6 ? NEON_GREEN : "#1E293B",
            color: cutId >= 6 ? "#020604" : "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: '"Arial Black", sans-serif',
            fontSize: 34,
            fontWeight: 900,
            boxShadow: cutId === 6 ? `0 0 50px ${NEON_GREEN}` : "none",
          }}
        >
          <span>{cutId >= 6 ? "TOTAL PAYABLE" : "ADD TO CART"}</span>
          <span>{cutId >= 6 ? "RS. 450" : "RS. 400"}</span>
        </div>
      </div>

      {/* Phone Home Indicator Bar */}
      <div
        style={{
          width: 180,
          height: 7,
          borderRadius: 4,
          background: "#475569",
          margin: "8px auto 0",
        }}
      />
    </div>
  );
};

/* =========================================================================
   06. REMAINING CLEAN VECTOR STAGES (CUTS 9 TO 17)
   ========================================================================= */

const LaterVectorStages: React.FC<{
  cutId: number;
  localFrame: number;
}> = ({ cutId, localFrame }) => {
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 175 },
  });

  // CUT 9: MISSION TO SAVE RS. 50 DELIVERY
  if (cutId === 9) {
    return (
      <div
        style={{
          width: 860,
          padding: 52,
          borderRadius: 28,
          background: PANEL_BG,
          border: `3px solid ${GOLD}`,
          textAlign: "center",
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          YOUR BRAIN'S TARGET
        </div>
        <div
          style={{
            marginTop: 22,
            display: "inline-block",
            padding: "20px 52px",
            borderRadius: 16,
            background: NEON_GREEN,
            color: "#020604",
            fontFamily: '"Arial Black", sans-serif',
            fontSize: 74,
            fontWeight: 900,
            boxShadow: `0 0 60px ${NEON_GREEN}`,
          }}
        >
          SAVE RS. 50 FEE
        </div>
      </div>
    );
  }

  // CUT 10: HERO 3-CARD MIDDLE INSERTION (RS. 400 + RS. 150 EXTRA = RS. 550)
  if (cutId === 10) {
    const midInsert = spring({
      frame: Math.max(0, localFrame - 6),
      fps,
      config: { damping: 10, stiffness: 195 },
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
        {/* Left Card: RS. 400 */}
        <div
          style={{
            flex: 1,
            padding: "40px 20px",
            borderRadius: 24,
            background: PANEL_BG,
            border: "2px solid #334155",
            textAlign: "center",
            opacity: 0.75,
          }}
        >
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>ITEM 01</div>
          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, margin: "12px 0" }}>
            T-SHIRT
          </div>
          <div style={{ color: "#CBD5E1", fontSize: 54, fontWeight: 900 }}>RS. 400</div>
        </div>

        {/* Center Highlighted Card: EXTRA ITEM RS. 150 */}
        <div
          style={{
            flex: 1.28,
            padding: "48px 22px",
            borderRadius: 28,
            background: "#042413",
            border: `6px solid ${NEON_GREEN}`,
            boxShadow: `0 0 110px ${NEON_GREEN}`,
            textAlign: "center",
            transform: `translateY(${(1 - midInsert) * 95}px) scale(${
              0.84 + midInsert * 0.24
            })`,
            zIndex: 15,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 18px",
              borderRadius: 8,
              background: NEON_GREEN,
              color: "#020604",
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
              fontSize: 82,
              fontWeight: 900,
              textShadow: `0 0 40px ${NEON_GREEN}`,
            }}
          >
            RS. 150
          </div>
        </div>

        {/* Right Card: Total RS. 550 */}
        <div
          style={{
            flex: 1,
            padding: "40px 20px",
            borderRadius: 24,
            background: PANEL_BG,
            border: `2px solid ${NEON_GREEN}66`,
            textAlign: "center",
            opacity: 0.85,
          }}
        >
          <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>NEW BILL</div>
          <div style={{ color: NEON_GREEN, fontSize: 32, fontWeight: 900, margin: "12px 0" }}>
            SHIPPING FREE
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 54, fontWeight: 900 }}>RS. 550</div>
        </div>
      </div>
    );
  }

  // CUT 11: TOTAL BILL RS. 550 GIANT NEON GREEN RECEIPT
  if (cutId === 11) {
    const count = Math.floor(
      interpolate(localFrame, [0, 30], [450, 550], { extrapolateRight: "clamp" })
    );
    return (
      <div
        style={{
          width: 860,
          padding: 54,
          borderRadius: 28,
          background: PANEL_BG,
          border: `5px solid ${NEON_GREEN}`,
          boxShadow: `0 0 95px rgba(0,255,102,0.5)`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900, letterSpacing: 4 }}>
          FINAL AMOUNT DEDUCTED
        </div>
        <div
          style={{
            marginTop: 22,
            display: "inline-block",
            padding: "22px 68px",
            borderRadius: 18,
            background: NEON_GREEN,
            color: "#020604",
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 122,
            fontWeight: 900,
            boxShadow: `0 0 75px ${NEON_GREEN}`,
          }}
        >
          RS. {count}
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 800, marginTop: 26 }}>
          RS. 400 + RS. 150 EXTRA = <span style={{ color: NEON_GREEN }}>RS. 550</span>
        </div>
      </div>
    );
  }

  // CUT 12: COMPANY INCREASED YOUR SPEND BY + RS. 100
  if (cutId === 12) {
    return (
      <div
        style={{
          width: 880,
          padding: 48,
          borderRadius: 28,
          background: PANEL_BG,
          border: `4px solid ${NEON_GREEN}`,
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
              OLD BILL (WITH FEE)
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
              background: GREEN_DARK,
              border: `3px solid ${NEON_GREEN}`,
              textAlign: "center",
            }}
          >
            <div style={{ color: NEON_GREEN, fontSize: 22, fontWeight: 900 }}>
              NEW BILL ('FREE' SHIP)
            </div>
            <div style={{ color: "#FFFFFF", fontSize: 60, fontWeight: 900, marginTop: 10 }}>
              RS. 550
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "22px 32px",
            borderRadius: 14,
            background: NEON_GREEN,
            color: "#020604",
            fontSize: 40,
            fontWeight: 900,
            textAlign: "center",
            boxShadow: `0 0 55px ${NEON_GREEN}`,
          }}
        >
          COMPANY PROFIT JUMP: + RS. 100
        </div>
      </div>
    );
  }

  // CUT 13: 'FREE' WORD ILLUSION
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
            padding: "16px 56px",
            borderRadius: 16,
            border: `4px dashed ${NEON_GREEN}`,
            color: NEON_GREEN,
            fontFamily: '"Arial Black", sans-serif',
            fontSize: 98,
            fontWeight: 900,
          }}
        >
          "FREE"
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 900, marginTop: 28 }}>
          SAVED RS. 50 ➔ <span style={{ color: CRIMSON }}>SPENT RS. 150 EXTRA</span>
        </div>
      </div>
    );
  }

  // CUT 15: SAVING RS.
