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
   VOICEOVER-SYNCED EDITION — THE DOPAMINE SLOT MACHINE (16 RAPID UI CUTS)
   1080 x 1920 | 60 FPS | 46 Seconds (2760 Frames) | New Cut Every ~2.8s
   Synced to User's Uploaded ElevenLabs Voiceover:
   - 3D Perspective UI Cards, Camera Shake Keyframes & Shockwave Rings
   - Notification Flood (1 -> 99+), Casino Slot Machine, Dopamine ECG Graph
   - Live Color-to-Grayscale Screen Filter & Daily Screen-Time Bar Chart
   Zero External Assets Required. Built-in Procedural Tech & Glitch SFX.
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2760; // 46.0 Seconds @ 60 FPS

const CYAN = "#00F0FF";
const NEON_GREEN = "#00FF87";
const CRIMSON = "#FF2A54";
const GOLD = "#FFD166";
const PURPLE = "#A855F7";
const DARK_BG = "#05070E";
const CARD_BG = "rgba(14, 20, 36, 0.90)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. PROCEDURAL UI, GLITCH & CASINO SFX ENGINE (ZERO EXTERNAL FILES)
   ========================================================================= */

type SfxType =
  | "uiWhoosh"
  | "notifPing"
  | "glitchSlam"
  | "slotTick"
  | "jackpot"
  | "dopamineUp"
  | "powerDown"
  | "toggleClick"
  | "vaultUnlock";

function buildTechSfx(type: SfxType): string {
  const sampleRate = 22050;
  const durationMap: Record<SfxType, number> = {
    uiWhoosh: 0.22,
    notifPing: 0.26,
    glitchSlam: 0.38,
    slotTick: 0.08,
    jackpot: 0.65,
    dopamineUp: 0.45,
    powerDown: 0.5,
    toggleClick: 0.16,
    vaultUnlock: 0.32,
  };

  const duration = durationMap[type];
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
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
    let wave = 0;
    let env = 1;

    if (type === "uiWhoosh") {
      const noise = Math.sin(i * 12.9898) * Math.cos(i * 0.21);
      wave =
        noise * 0.35 +
        Math.sin(2 * Math.PI * (180 + Math.sin(p * Math.PI) * 440) * t) * 0.45;
      env = Math.sin(Math.PI * p) * 0.85;
    } else if (type === "notifPing") {
      const freq = p < 0.32 ? 1046.5 : 1567.98;
      wave =
        Math.sin(2 * Math.PI * freq * t) * 0.65 +
        Math.sin(2 * Math.PI * freq * 2 * t) * 0.25;
      env = Math.exp(-p * 6.5);
    } else if (type === "glitchSlam") {
      const f = 145 * Math.pow(1 - p, 1.8) + 38;
      const bitcrush = Math.sign(Math.sin(2 * Math.PI * 580 * t)) * 0.38;
      wave = Math.sin(2 * Math.PI * f * t) * 0.8 + bitcrush * Math.exp(-p * 7);
      env = Math.pow(1 - p, 2.0);
    } else if (type === "slotTick") {
      wave = Math.sin(2 * Math.PI * 1950 * t) * 0.75;
      env = Math.exp(-p * 22);
    } else if (type === "jackpot") {
      const f = p < 0.25 ? 587 : p < 0.5 ? 784 : p < 0.75 ? 987 : 1174;
      wave =
        Math.sin(2 * Math.PI * f * t) * 0.65 +
        Math.sin(2 * Math.PI * f * 2 * t) * 0.25;
      env = Math.exp(-(p % 0.25) * 8);
    } else if (type === "dopamineUp") {
      const sweepF = 280 + p * p * 1150;
      wave = Math.sin(2 * Math.PI * sweepF * t) * 0.75;
      env = Math.sin(Math.PI * p);
    } else if (type === "powerDown") {
      const dropF = 680 * Math.pow(1 - p * 0.82, 1.6);
      wave = Math.sin(2 * Math.PI * dropF * t) * 0.75;
      env = Math.pow(1 - p, 1.4);
    } else if (type === "toggleClick") {
      wave =
        Math.sin(2 * Math.PI * 2400 * t) * 0.65 +
        Math.sin(2 * Math.PI * 820 * t) * 0.4;
      env = Math.exp(-p * 24);
    } else if (type === "vaultUnlock") {
      const f = p < 0.5 ? 640 : 1280;
      wave = Math.sin(2 * Math.PI * f * t) * 0.7;
      env = Math.exp(-((p % 0.5) * 14));
    }

    const sample = clamp(wave * env * 0.75, -1, 1);
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX: Record<SfxType, string> = {
  uiWhoosh: buildTechSfx("uiWhoosh"),
  notifPing: buildTechSfx("notifPing"),
  glitchSlam: buildTechSfx("glitchSlam"),
  slotTick: buildTechSfx("slotTick"),
  jackpot: buildTechSfx("jackpot"),
  dopamineUp: buildTechSfx("dopamineUp"),
  powerDown: buildTechSfx("powerDown"),
  toggleClick: buildTechSfx("toggleClick"),
  vaultUnlock: buildTechSfx("vaultUnlock"),
};

/* =========================================================================
   02. 16 VOICEOVER-SYNCED RAPID UI CUTS (~2.8s PER CUT)
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
  heavyShake?: boolean;
};

const UI_CUTS: CutSpec[] = [
  // 0.0s - 2.5s: "Kya aapko lagta hai ki aap apna phone chalate ho?"
  {
    id: 1,
    startSec: 0.0,
    endSec: 2.5,
    badge: "SYSTEM QUESTION // 01",
    titleTop: "KYA AAPKO LAGTA HAI",
    titleMain: "AAP PHONE CHALATE HO? 📱",
    subTag: "USER CONTROL ILLUSION",
    accent: CYAN,
  },
  // 2.5s - 5.8s: "Bilkul galat! Asal mein aapka phone aapko chala raha hai!"
  {
    id: 2,
    startSec: 2.5,
    endSec: 5.8,
    badge: "REALITY ALERT // 02",
    titleTop: "BILKUL GALAT! ❌",
    titleMain: "PHONE AAPKO CHALA RAHA HAI!",
    subTag: "ATTENTION HIJACKED: 99.8%",
    accent: CRIMSON,
    heavyShake: true,
  },
  // 5.8s - 8.2s: "Instagram aur YouTube jaisi badi tech companies..."
  {
    id: 3,
    startSec: 5.8,
    endSec: 8.2,
    badge: "BIG TECH MATRIX // 03",
    titleTop: "INSTAGRAM & YOUTUBE",
    titleMain: "TECH GIANTS KA JAAL 🌐",
    subTag: "BILLION-DOLLAR ALGORITHMS",
    accent: PURPLE,
  },
  // 8.2s - 10.3s: "...aapke dimaag ke saath ek khatarnaak game khelti hain,"
  {
    id: 4,
    startSec: 8.2,
    endSec: 10.3,
    badge: "NEURAL TARGET // 04",
    titleTop: "AAPKE DIMAAG KE SAATH",
    titleMain: "KHATARNAAK MIND GAME! 🧠",
    subTag: "SUBCONSCIOUS TARGETING",
    accent: CRIMSON,
    heavyShake: true,
  },
  // 10.3s - 12.8s: "jise kehte hain Variable Reward System."
  {
    id: 5,
    startSec: 10.3,
    endSec: 12.8,
    badge: "PSYCHOLOGY FORMULA // 05",
    titleTop: "ISE KEHTE HAIN",
    titleMain: "VARIABLE REWARD SYSTEM 🎯",
    subTag: "UNPREDICTABLE REWARD LOOP",
    accent: GOLD,
  },
  // 12.8s - 16.5s: "Yeh theek wahi trick hai jo casino ki slot machines mein..."
  {
    id: 6,
    startSec: 12.8,
    endSec: 16.5,
    badge: "CASINO TRICK // 06",
    titleTop: "BILKUL CASINO KI",
    titleMain: "SLOT MACHINE KI TARAH! 🎰",
    subTag: "SPINNING FOR DOPAMINE",
    accent: NEON_GREEN,
    heavyShake: true,
  },
  // 16.5s - 19.5s: "Jab bhi aap screen neeche kheechte ho aur naya notification ya reel aata hai,"
  {
    id: 7,
    startSec: 16.5,
    endSec: 19.5,
    badge: "TRIGGER ACTION // 07",
    titleTop: "JAB BHI SCREEN KHEENCHTE HO",
    titleMain: "NAYA REEL & NOTIFICATION! 🔔",
    subTag: "PULL-TO-REFRESH TRIGGER",
    accent: CYAN,
  },
  // 19.5s - 22.8s: "toh aapke dimaag mein turant Dopamine release hota hai."
  {
    id: 8,
    startSec: 19.5,
    endSec: 22.8,
    badge: "CHEMICAL SPIKE // 08",
    titleTop: "DIMAAG MEIN TURANT",
    titleMain: "DOPAMINE RELEASE! ⚡",
    subTag: "+400% NEURO-SPIKE DETECTED",
    accent: NEON_GREEN,
    heavyShake: true,
  },
  // 22.8s - 25.4s: "Aur jab kuch achha nahi milta..."
  {
    id: 9,
    startSec: 22.8,
    endSec: 25.4,
    badge: "CHEMICAL CRASH // 09",
    titleTop: "AUR JAB KUCH NA MILE...",
    titleMain: "DOPAMINE CRASH & ANXIETY! 📉",
    subTag: "CRAVING DEFICIT: CRITICAL",
    accent: CRIMSON,
  },
  // 25.4s - 28.0s: "...toh aapka dimaag bechain hokar baar-baar scroll karta rehta hai."
  {
    id: 10,
    startSec: 25.4,
    endSec: 28.0,
    badge: "ZOMBIE LOOP // 10",
    titleTop: "BECHAIN HOKAR BAAR-BAAR",
    titleMain: "INFINITE SCROLLING! ♾️",
    subTag: "ENDLESS FEED ADDICTION",
    accent: PURPLE,
  },
  // 28.0s - 31.0s: "Is jaal se bachne ka ek secret psychological hack hai."
  {
    id: 11,
    startSec: 28.0,
    endSec: 31.0,
    badge: "ESCAPE PROTOCOL // 11",
    titleTop: "IS JAAL SE BACHNE KA",
    titleMain: "SECRET BRAIN HACK! 🔓",
    subTag: "PSYCHOLOGICAL OVERRIDE",
    accent: GOLD,
  },
  // 31.0s - 34.5s: "Bas apne phone ki setting mein jakar Grayscale mode on kar do."
  {
    id: 12,
    startSec: 31.0,
    endSec: 34.5,
    badge: "SETTINGS OVERRIDE // 12",
    titleTop: "PHONE SETTINGS MEIN ON KARO:",
    titleMain: "GRAYSCALE MODE! 🔘",
    subTag: "KILL THE COLOR TRIGGERS",
    accent: CYAN,
  },
  // 34.5s - 37.2s: "Screen black and white hote hi Dopamine gir jayega..."
  {
    id: 13,
    startSec: 34.5,
    endSec: 37.2,
    badge: "MONOCHROME SHIELD // 13",
    titleTop: "SCREEN BLACK & WHITE HOTE HI",
    titleMain: "DOPAMINE DROP! 📉",
    subTag: "STIMULATION REDUCED BY 85%",
    accent: GOLD,
  },
  // 37.2s - 40.0s: "...aur aapka dimaag turant control mein aa jayega."
  {
    id: 14,
    startSec: 37.2,
    endSec: 40.0,
    badge: "SYSTEM RESTORED // 14",
    titleTop: "AAPKA DIMAAG TURANT",
    titleMain: "100% CONTROL MEIN! ✅",
    subTag: "FOCUS & WILLPOWER LOCKED",
    accent: NEON_GREEN,
    heavyShake: true,
  },
  // 40.0s - 43.0s: "Waise imandari se batana, aapka daily screen time kitne ghante ka hai?"
  {
    id: 15,
    startSec: 40.0,
    endSec: 43.0,
    badge: "REALITY STATS // 15",
    titleTop: "AAPKA DAILY SCREEN-TIME",
    titleMain: "KITNE GHANTE KA HAI? 📊",
    subTag: "BE 100% HONEST!",
    accent: GOLD,
  },
  // 43.0s - 46.0s: "Comment mein sach-sach zaroor batana."
  {
    id: 16,
    startSec: 43.0,
    endSec: 46.0,
    badge: "YOUR TURN // 16",
    titleTop: "COMMENT MEIN APNA",
    titleMain: "SACH-SACH BATAO! 👇",
    subTag: "DROP YOUR HOURS BELOW",
    accent: CYAN,
  },
];

/* =========================================================================
   03. CYBERNETIC GRID & FLOATING DATA PARTICLES BACKGROUND
   ========================================================================= */

const CyberGridAtmosphere: React.FC<{ accent: string; frame: number }> = ({
  accent,
  frame,
}) => {
  const gridShift = (frame * 1.4) % 90;

  const nodes = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: (i * 197 + 43) % WIDTH,
        y: (i * 283 + 91) % HEIGHT,
        size: 3 + (i % 4) * 1.5,
        speed: 0.8 + (i % 5) * 0.35,
      })),
    []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden" }}>
      {/* Radial Center Spotlight */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 52%, ${accent}26 0%, rgba(7, 11, 22, 0.88) 58%, ${DARK_BG} 100%)`,
        }}
      />

      {/* Moving Perspective Grid */}
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage: `
            linear-gradient(${accent}44 1px, transparent 1px),
            linear-gradient(90deg, ${accent}44 1px, transparent 1px)
          `,
          backgroundSize: "90px 90px",
          transform: `translateY(${gridShift}px)`,
        }}
      />

      {/* Floating Data Particles */}
      {nodes.map((n, i) => {
        const py = (n.y - frame * n.speed + HEIGHT) % HEIGHT;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.x,
              top: py,
              width: n.size,
              height: n.size,
              borderRadius: "50%",
              background: i % 3 === 0 ? "#FFFFFF" : accent,
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
   04. 16 INTERACTIVE UI & MOTION GRAPHICS STAGES (ONE PER CUT!)
   ========================================================================= */

const CutWidgetStage: React.FC<{
  cutId: number;
  localFrame: number;
  accent: string;
}> = ({ cutId, localFrame, accent }) => {
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 165 },
  });

  const tiltDeg = Math.sin(localFrame * 0.06) * 4;

  // CUT 1: 3D TILTED SMARTPHONE WITH FINGER SWIPE
  if (cutId === 1) {
    const feedOffset = (localFrame * 5.5) % 240;
    return (
      <div
        style={{
          width: 490,
          height: 830,
          borderRadius: 56,
          background: "linear-gradient(160deg, #16223B, #080C16)",
          border: `6px solid ${CYAN}`,
          boxShadow: `0 0 85px ${CYAN}44, 0 35px 80px rgba(0,0,0,0.9)`,
          position: "relative",
          overflow: "hidden",
          transform: `perspective(1000px) rotateY(${tiltDeg}deg) scale(${
            0.85 + pop * 0.15
          })`,
        }}
      >
        <div
          style={{
            width: 150,
            height: 34,
            borderRadius: 20,
            background: "#000",
            margin: "22px auto",
          }}
        />
        <div
          style={{
            padding: "10px 32px",
            transform: `translateY(-${feedOffset}px)`,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 205,
                borderRadius: 26,
                marginBottom: 22,
                background:
                  i % 2 === 0
                    ? "linear-gradient(135deg, #1E293B, #0F172A)"
                    : "linear-gradient(135deg, #172554, #0F172A)",
                border: `2px solid ${CYAN}55`,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  width: "65%",
                  height: 22,
                  borderRadius: 10,
                  background: CYAN,
                }}
              />
              <div
                style={{
                  width: "90%",
                  height: 16,
                  borderRadius: 8,
                  background: "#475569",
                }}
              />
              <div style={{ display: "flex", gap: 18, fontSize: 28, color: "#FFF" }}>
                <span>❤️ 24.8K</span>
                <span>💬 1.2K</span>
              </div>
            </div>
          ))}
        </div>
        {/* Glowing Finger Touch Circle */}
        <div
          style={{
            position: "absolute",
            bottom: 140 + Math.sin(localFrame * 0.18) * 95,
            left: "50%",
            transform: "translateX(-50%)",
            width: 86,
            height: 86,
            borderRadius: "50%",
            background: `${CYAN}55`,
            border: "4px solid #FFFFFF",
            boxShadow: `0 0 40px ${CYAN}`,
          }}
        />
      </div>
    );
  }

  // CUT 2: NOTIFICATION COUNTER EXPLOSION (1 -> 99+) & RED ALERT BANNERS
  if (cutId === 2) {
    const count = Math.min(
      99,
      Math.floor(interpolate(localFrame, [0, 95], [1, 99]))
    );
    const banners = [
      { app: "Instagram", text: "🔥 54 new reels waiting for you!", delay: 4 },
      { app: "YouTube Shorts", text: "⚡ Don't miss this viral clip!", delay: 14 },
      { app: "Dopamine Trap", text: "🚨 Brain Control Hijacked (99.8%)", delay: 24 },
      { app: "System Override", text: "⚠️ You cannot stop scrolling!", delay: 34 },
    ];

    return (
      <div style={{ width: 880, height: 820 }}>
        <div
          style={{
            margin: "0 auto 32px",
            width: 360,
            height: 145,
            borderRadius: 40,
            background: CRIMSON,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            fontWeight: 900,
            color: "#FFF",
            fontFamily: '"Arial Black", sans-serif',
            boxShadow: `0 0 85px ${CRIMSON}`,
            border: "5px solid #FFFFFF",
          }}
        >
          🔔 +{count}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {banners.map((b, i) => {
            const bPop = spring({
              frame: Math.max(0, localFrame - b.delay),
              fps,
              config: { damping: 12, stiffness: 190 },
            });
            return (
              <div
                key={i}
                style={{
                  padding: "22px 34px",
                  borderRadius: 26,
                  background: CARD_BG,
                  border: `3px solid ${CRIMSON}`,
                  transform: `scale(${bPop}) translateX(${(1 - bPop) * 80}px)`,
                  opacity: bPop,
                  boxShadow: "0 18px 45px rgba(0,0,0,0.65)",
                }}
              >
                <div
                  style={{
                    color: CRIMSON,
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 2,
                  }}
                >
                  {b.app.toUpperCase()} • NOW
                </div>
                <div
                  style={{
                    color: "#FFFFFF",
                    fontSize: 32,
                    fontWeight: 800,
                    marginTop: 4,
                  }}
                >
                  {b.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // CUT 3: INSTAGRAM & YOUTUBE ALGORITHM CARDS
  if (cutId === 3) {
    return (
      <div
        style={{
          width: 880,
          padding: 46,
          borderRadius: 42,
          background: CARD_BG,
          border: `4px solid ${PURPLE}`,
          boxShadow: `0 0 80px ${PURPLE}44`,
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 28 }}>
          <div
            style={{
              flex: 1,
              padding: "44px 24px",
              borderRadius: 32,
              background: "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)",
              textAlign: "center",
              color: "#FFF",
              fontWeight: 900,
              fontSize: 40,
              boxShadow: "0 20px 50px rgba(253,29,29,0.45)",
            }}
          >
            📸 INSTAGRAM
            <div style={{ fontSize: 23, marginTop: 12, opacity: 0.92 }}>
              REELS HOOK ENGINE
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "44px 24px",
              borderRadius: 32,
              background: "linear-gradient(135deg, #FF0000, #990000)",
              textAlign: "center",
              color: "#FFF",
              fontWeight: 900,
              fontSize: 40,
              boxShadow: "0 20px 50px rgba(255,0,0,0.45)",
            }}
          >
            ▶️ YOUTUBE
            <div style={{ fontSize: 23, marginTop: 12, opacity: 0.92 }}>
              SHORTS AUTOPLAY
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 34,
            padding: 30,
            borderRadius: 26,
            background: "#080C16",
            border: `2px solid ${PURPLE}`,
            textAlign: "center",
            color: "#FFFFFF",
            fontSize: 32,
            fontWeight: 800,
          }}
        >
          Goal: <span style={{ color: GOLD }}>Keep You Scrolling Forever! ♾️</span>
        </div>
      </div>
    );
  }

  // CUT 4: NEURAL BRAIN TARGET HUD (MIND GAME)
  if (cutId === 4) {
    const lockPct = interpolate(localFrame, [0, 90], [65, 99.4], {
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          width: 860,
          padding: 46,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${CRIMSON}`,
          boxShadow: `0 0 85px ${CRIMSON}44`,
          textAlign: "center",
        }}
      >
        <svg width="760" height="360" viewBox="0 0 760 360">
          <g transform="translate(380 180)">
            <circle
              r="155"
              fill="none"
              stroke={CRIMSON}
              strokeWidth="4"
              strokeDasharray="16 10"
              transform={`rotate(${localFrame * 1.8})`}
            />
            <circle
              r="115"
              fill="rgba(255,42,84,0.12)"
              stroke={GOLD}
              strokeWidth="3"
            />
            <line x1="-185" y1="0" x2="-90" y2="0" stroke={CRIMSON} strokeWidth="6" />
            <line x1="90" y1="0" x2="185" y2="0" stroke={CRIMSON} strokeWidth="6" />
            <text y="32" textAnchor="middle" fontSize="105">
              🧠
            </text>
          </g>
        </svg>

        <div
          style={{
            fontSize: 68,
            fontWeight: 900,
            color: CRIMSON,
            fontFamily: '"Arial Black", sans-serif',
          }}
        >
          BRAIN HIJACK: {lockPct.toFixed(1)}%
        </div>
      </div>
    );
  }

  // CUT 5: VARIABLE REWARD SYSTEM (3 MYSTERY REWARD CARDS)
  if (cutId === 5) {
    return (
      <div
        style={{
          width: 880,
          padding: 46,
          borderRadius: 42,
          background: CARD_BG,
          border: `4px solid ${GOLD}`,
          textAlign: "center",
          transform: `scale(${0.88 + pop * 0.12})`,
        }}
      >
        <div
          style={{
            color: GOLD,
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: 4,
            marginBottom: 28,
          }}
        >
          🎲 UNPREDICTABLE REWARD SCHEDULE
        </div>

        <div style={{ display: "flex", gap: 22 }}>
          {[
            { top: "SWIPE #1", main: "BORING 😐", col: "#64748B" },
            { top: "SWIPE #2", main: "VIRAL HIT! 🔥", col: NEON_GREEN },
            { top: "SWIPE #3", main: "MYSTERY ❓", col: GOLD },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "46px 18px",
                borderRadius: 28,
                background: "#080C16",
                border: `4px solid ${c.col}`,
                boxShadow: i === 1 ? `0 0 45px ${NEON_GREEN}55` : "none",
              }}
            >
              <div style={{ color: "#94A3B8", fontSize: 22, fontWeight: 800 }}>
                {c.top}
              </div>
              <div
                style={{
                  color: c.col,
                  fontSize: 34,
                  fontWeight: 900,
                  marginTop: 22,
                }}
              >
                {c.main}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // CUT 6: CASINO SLOT MACHINE (SPINNING REELS -> 777 JACKPOT!)
  if (cutId === 6) {
    const symbols = ["❤️", "💬", "🔥", "💎", "7️⃣"];
    const isJackpot = localFrame > 110;

    return (
      <div
        style={{
          width: 880,
          padding: 48,
          borderRadius: 46,
          background: "linear-gradient(160deg, #1E1338, #090612)",
          border: `6px solid ${GOLD}`,
          boxShadow: `0 0 90px ${GOLD}55`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: GOLD,
            letterSpacing: 6,
            marginBottom: 30,
          }}
        >
          🎰 SOCIAL MEDIA SLOT MACHINE 🎰
        </div>

        <div style={{ display: "flex", gap: 26, justifyContent: "center" }}>
          {[0, 1, 2].map((reelIdx) => {
            const symIdx = isJackpot
              ? 4 // Locks on 7️⃣!
              : Math.floor((localFrame * 0.48 + reelIdx * 2) % symbols.length);
            return (
              <div
                key={reelIdx}
                style={{
                  width: 225,
                  height: 255,
                  borderRadius: 30,
                  background: "#070912",
                  border: `5px solid ${isJackpot ? NEON_GREEN : GOLD}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 120,
                  boxShadow: isJackpot
                    ? `0 0 55px ${NEON_GREEN}`
                    : "inset 0 15px 35px #000",
                }}
              >
                {symbols[symIdx]}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 34,
            padding: "20px 44px",
            borderRadius: 100,
            display: "inline-block",
            background: isJackpot ? NEON_GREEN : CRIMSON,
            color: "#06080E",
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: 3,
          }}
        >
          {isJackpot ? "JACKPOT HIT: DOPAMINE RUSH! ⚡" : "SPINNING THE REELS..."}
        </div>
      </div>
    );
  }

  // CUT 7: PULL-TO-REFRESH SPRING UI & NEW REEL POPUP
  if (cutId === 7) {
    const pullY = interpolate(
      localFrame,
      [0, 35, 55],
      [0, 115, 0],
      {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.back(1.7)),
      }
    );

    return (
      <div
        style={{
          width: 840,
          padding: 44,
          borderRadius: 42,
          background: CARD_BG,
          border: `4px solid ${CYAN}`,
          textAlign: "center",
        }}
      >
        {/* Pull-to-refresh spinner */}
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: "50%",
            margin: "0 auto 24px",
            border: `6px solid ${CYAN}`,
            borderTopColor: "transparent",
            transform: `translateY(${pullY * 0.4}px) rotate(${localFrame * 9}deg)`,
          }}
        />

        <div
          style={{
            padding: 36,
            borderRadius: 30,
            background: "#0B1324",
            border: `3px solid ${NEON_GREEN}`,
            transform: `translateY(${pullY}px)`,
            boxShadow: `0 0 55px ${NEON_GREEN}44`,
          }}
        >
          <div style={{ color: NEON_GREEN, fontSize: 28, fontWeight: 900 }}>
            🔔 NEW REEL UNLOCKED!
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 48,
              fontWeight: 900,
              marginTop: 14,
            }}
          >
            ❤️ +12,400 Likes • 🔥 Trending
          </div>
        </div>
      </div>
    );
  }

  // CUT 8: LIVE DOPAMINE SPIKE ECG WAVEFORM (+400%)
  if (cutId === 8) {
    const surge = Math.min(
      400,
      Math.floor(interpolate(localFrame, [0, 110], [100, 400]))
    );

    return (
      <div
        style={{
          width: 880,
          padding: 44,
          borderRadius: 42,
          background: CARD_BG,
          border: `5px solid ${NEON_GREEN}`,
          boxShadow: `0 0 85px ${NEON_GREEN}55`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <span style={{ color: NEON_GREEN, fontSize: 28, fontWeight: 900, letterSpacing: 3 }}>
            ⚡ BRAIN DOPAMINE LEVEL
          </span>
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 60,
              fontWeight: 900,
              fontFamily: '"Arial Black", sans-serif',
            }}
          >
            +{surge}%
          </span>
        </div>

        <svg width="790" height="330" viewBox="0 0 790 330">
          <polyline
            fill="none"
            stroke={NEON_GREEN}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,240 120,240 170,190 210,270 270,35 320,300 375,120 430,250 510,25 570,290 640,75 790,75"
            strokeDasharray="1400"
            strokeDashoffset={interpolate(localFrame, [0, 95], [1400, 0], {
              extrapolateRight: "clamp",
            })}
          />
        </svg>
      </div>
    );
  }

  // CUT 9: DOPAMINE CRASH TO 8% & ANXIETY METER
  if (cutId === 9) {
    const level = Math.max(
      8,
      Math.floor(interpolate(localFrame, [0, 100], [92, 8]))
    );

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
        }}
      >
        <div style={{ color: CRIMSON, fontSize: 30, fontWeight: 900, letterSpacing: 4 }}>
          ⚠️ DOPAMINE CRASH DETECTED
        </div>
        <div
          style={{
            fontSize: 132,
            fontWeight: 900,
            color: CRIMSON,
            fontFamily: '"Arial Black", sans-serif',
            margin: "16px 0",
          }}
        >
          {level}% 📉
        </div>
        <div
          style={{
            width: "100%",
            height: 44,
            borderRadius: 22,
            background: "#1E1218",
            border: `2px solid ${CRIMSON}`,
            overflow: "hidden",
          }}
        >
          <div style={{ width: `${level}%`, height: "100%", background: CRIMSON }} />
        </div>
      </div>
    );
  }

  // CUT 10: INFINITE SCROLLING & LATE NIGHT CLOCK (01:00 AM -> 04:45 AM)
  if (cutId === 10) {
    const hr = Math.min(4, 1 + Math.floor(localFrame / 38));
    const mn = Math.floor((localFrame * 2.1) % 60);

    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `4px solid ${PURPLE}`,
          textAlign: "center",
        }}
      >
        <div style={{ color: GOLD, fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>
          🕒 ENDLESS NIGHT SCROLLING
        </div>
        <div
          style={{
            fontSize: 116,
            fontWeight: 900,
            color: "#FFFFFF",
            fontFamily: '"Arial Black", monospace',
            margin: "18px 0 30px",
          }}
        >
          0{hr}:{String(mn).padStart(2, "0")} AM
        </div>
        <div
          style={{
            padding: "24px 36px",
            borderRadius: 26,
            background: "rgba(168, 85, 247, 0.2)",
            border: `2px solid ${PURPLE}`,
            color: "#FFF",
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          “Bas ek last Reel...” ➔ 4 Hours Wasted! 🧟‍♂️
        </div>
      </div>
    );
  }

  // CUT 11: SECRET PSYCHOLOGICAL HACK VAULT UNLOCK
  if (cutId === 11) {
    return (
      <div
        style={{
          width: 860,
          padding: 50,
          borderRadius: 44,
          background: CARD_BG,
          border: `5px solid ${GOLD}`,
          boxShadow: `0 0 90px ${GOLD}55`,
          textAlign: "center",
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 115, marginBottom: 18 }}>🔓🧠</div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: GOLD,
            fontFamily: '"Arial Black", sans-serif',
          }}
        >
          SECRET PSYCHOLOGICAL HACK
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 800, marginTop: 18 }}>
          1-Minute Settings Change to Break the Loop!
        </div>
      </div>
    );
  }

  // CUT 12 & 13: PHONE SETTINGS PANEL & GRAYSCALE MODE TOGGLE SWITCH
  if (cutId === 12 || cutId === 13) {
    const isToggleOn = cutId === 13 || localFrame > 45;
    const knobSlide = spring({
      frame: isToggleOn ? (cutId === 13 ? 60 : localFrame - 45) : 0,
      fps,
      config: { damping: 12, stiffness: 180 },
    });

    return (
      <div
        style={{
          width: 860,
          padding: 48,
          borderRadius: 42,
          background: CARD_BG,
          border: `4px solid ${CYAN}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.85)",
        }}
      >
        <div
          style={{
            color: "#94A3B8",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 3,
            marginBottom: 28,
          }}
        >
          ⚙️ SETTINGS ▸ ACCESSIBILITY ▸ DISPLAY
        </div>

        <div
          style={{
            padding: "36px 34px",
            borderRadius: 30,
            background: "#131C31",
            border: `4px solid ${GOLD}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 42, fontWeight: 900 }}>
              🔘 Grayscale Mode
            </div>
            <div style={{ color: GOLD, fontSize: 25, fontWeight: 700, marginTop: 8 }}>
              Turns Screen 100% Black & White
            </div>
          </div>

          <div
            style={{
              width: 144,
              height: 78,
              borderRadius: 40,
              background: isToggleOn ? NEON_GREEN : "#334155",
              padding: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                background: "#FFFFFF",
                transform: `translateX(${knobSlide * 66}px)`,
              }}
            />
          </div>
        </div>

        {cutId === 13 && (
          <div
            style={{
              marginTop: 28,
              padding: "22px 30px",
              borderRadius: 22,
              background: "#1E293B",
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            Colors Gayab ➔ Dopamine Stimulation Drops by 85%! 📉
          </div>
        )}
      </div>
    );
  }

  // CUT 14: BRAIN 100% IN CONTROL SHIELD
  if (cutId === 14) {
    return (
      <div
        style={{
          width: 860,
          padding: 50,
          borderRadius: 44,
          background: CARD_BG,
          border: `5px solid ${NEON_GREEN}`,
          textAlign: "center",
          boxShadow: `0 0 90px ${NEON_GREEN}55`,
          transform: `scale(${0.86 + pop * 0.14})`,
        }}
      >
        <div style={{ fontSize: 110, marginBottom: 14 }}>🛡️🧠✅</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: NEON_GREEN,
            fontFamily: '"Arial Black", sans-serif',
          }}
        >
          DIMAAG 100% CONTROL MEIN!
        </div>
        <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 800, marginTop: 16 }}>
          No Colors = No Casino Trap = Pure Focus!
        </div>
      </div>
    );
  }

  // CUT 15: DAILY SCREEN-TIME BAR CHART
  if (cutId === 15) {
    const bars = [
      { day: "MON", h: 5.2, col: CYAN },
      { day: "TUE", h: 6.4, col: CYAN },
      { day: "WED", h: 7.5, col: GOLD },
      { day: "THU", h: 8.6, col: CRIMSON },
      { day: "TODAY", h: 9.4, col: CRIMSON },
    ];

    return (
      <div
        style={{
          width: 860,
          padding: 46,
          borderRadius: 42,
          background: CARD_BG,
          border: `4px solid ${GOLD}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 34,
          }}
        >
          <span style={{ color: "#94A3B8", fontSize: 26, fontWeight: 900 }}>
            📊 DAILY SCREEN-TIME REPORT
          </span>
          <span
            style={{
              color: CRIMSON,
              fontSize: 62,
              fontWeight: 900,
              fontFamily: '"Arial Black", sans-serif',
            }}
          >
            9h 24m / DAY ⚠️
          </span>
        </div>

        <div
          style={{
            height: 320,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            gap: 24,
          }}
        >
          {bars.map((b, i) => {
            const grow = spring({
              frame: Math.max(0, localFrame - i * 7),
              fps,
              config: { damping: 12, stiffness: 145 },
            });
            return (
              <div key={i} style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    color: "#FFF",
                    fontSize: 22,
                    fontWeight: 900,
                    marginBottom: 8,
                  }}
                >
                  {b.h}h
                </div>
                <div
                  style={{
                    height: b.h * 26 * grow,
                    borderRadius: "16px 16px 6px 6px",
                    background: b.col,
                    boxShadow: `0 0 30px ${b.col}66`,
                  }}
                />
                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: 22,
                    fontWeight: 800,
                    marginTop: 12,
                  }}
                >
                  {b.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // CUT 16: COMMENT CTA BOX
  return (
    <div
      style={{
        width: 880,
        padding: 50,
        borderRadius: 44,
        background: CARD_BG,
        border: `6px solid ${CYAN}`,
        boxShadow: `0 0 90px ${CYAN}55`,
        textAlign: "center",
        transform: `scale(${0.92 + Math.sin(localFrame * 0.16) * 0.04})`,
      }}
    >
      <div style={{ color: GOLD, fontSize: 32, fontWeight: 900, letterSpacing: 4 }}>
        💬 COMMENT MEIN SACH-SACH BATAO:
      </div>
      <div
        style={{
          marginTop: 28,
          padding: "32px 36px",
          borderRadius: 26,
          background: "#070A12",
          border: `3px solid ${NEON_GREEN}`,
          color: "#FFFFFF",
          fontSize: 44,
          fontWeight: 900,
        }}
      >
        “Mera Daily Screen-time ___ hrs hai! 👇”
      </div>
    </div>
  );
};

/* =========================================================================
   05. MASTER COMPOSITION + CAMERA SHAKE + REAL-TIME GRAYSCALE FILTER
   ========================================================================= */

const DopamineSlotMachineReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const activeCut =
    UI_CUTS.find((c) => sec >= c.startSec && sec < c.endSec) ??
    UI_CUTS[UI_CUTS.length - 1];

  const cutStartFrame = Math.round(activeCut.startSec * FPS);
  const localFrame = Math.max(0, frame - cutStartFrame);

  const titleSlam = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, stiffness: 220, mass: 0.68 },
  });

  // Camera Shake on heavy impact cuts (Cut 2, 4, 6, 8, 14)
  const shakeEnv = activeCut.heavyShake
    ? interpolate(localFrame, [0, 5, 20], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const shakeX = Math.sin(localFrame * 2.8) * shakeEnv * 18;
  const shakeY = Math.cos(localFrame * 3.5) * shakeEnv * 18;

  // LIVE GRAYSCALE FILTER WHEN "SCREEN BLACK & WHITE HOTE HI" PLAYS (32.0s - 37.2s)!
  const grayscalePct = interpolate(
    sec,
    [31.8, 32.5, 36.8, 37.4],
    [0, 100, 100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  const progress = interpolate(frame, [0, DURATION], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        filter: `grayscale(${grayscalePct}%)`,
        overflow: "hidden",
      }}
    >
      <CyberGridAtmosphere accent={activeCut.accent} frame={frame} />

      <AbsoluteFill
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* TOP 16-SEGMENT STORY PROGRESS BAR */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 50,
            right: 50,
            display: "flex",
            gap: 6,
            height: 6,
          }}
        >
          {UI_CUTS.map((c) => {
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

        {/* TOP TELEMETRY HEADER */}
        <div
          style={{
            position: "absolute",
            top: 76,
            left: 65,
            right: 65,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "10px 26px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.07)",
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
            CUT {String(activeCut.id).padStart(2, "0")} / 16
          </div>
        </div>

        {/* SLAMMING HINGLISH HEADLINE */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 48,
            right: 48,
            textAlign: "center",
            transform: `scale(${interpolate(titleSlam, [0, 1], [1.9, 1])})`,
          }}
        >
          <div
            style={{
              fontSize: 38,
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
              fontSize: 72,
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

        {/* CENTER INTERACTIVE UI & DATA STAGE */}
        <div
          style={{
            position: "absolute",
            top: 485,
            left: 0,
            right: 0,
            bottom: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CutWidgetStage
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
          VOICEOVER-SYNCED PROCEDURAL SFX TIMELINE
         =================================================================== */}
      {/* Transition Whoosh on every ~2.8s UI Cut */}
      {UI_CUTS.map((c) => (
        <Sequence
          key={`whoosh-${c.id}`}
          from={Math.round(c.startSec * FPS)}
          durationInFrames={20}
          layout="none"
        >
          <Audio src={SFX.uiWhoosh} volume={0.45} />
        </Sequence>
      ))}

      {/* 2.5s: "Bilkul Galat!" Glitch Slam + Rapid Notification Pings */}
      <Sequence from={Math.round(2.5 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.glitchSlam} volume={0.85} />
      </Sequence>
      {[2.9, 3.25, 3.6, 3.95].map((tSec, i) => (
        <Sequence
          key={`ping-${i}`}
          from={Math.round(tSec * FPS)}
          durationInFrames={25}
          layout="none"
        >
          <Audio src={SFX.notifPing} volume={0.75} />
        </Sequence>
      ))}

      {/* 8.2s: "Khatarnaak game" Glitch Slam */}
      <Sequence from={Math.round(8.2 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.glitchSlam} volume={0.75} />
      </Sequence>

      {/* 12.8s - 16.5s: Casino Slot Machine Spinning Ticks + Jackpot Hit */}
      {[13.0, 13.3, 13.6, 13.9, 14.2, 14.5].map((tSec, i) => (
        <Sequence
          key={`slot-${i}`}
          from={Math.round(tSec * FPS)}
          durationInFrames={12}
          layout="none"
        >
          <Audio src={SFX.slotTick} volume={0.7} />
        </Sequence>
      ))}
      <Sequence from={Math.round(14.7 * FPS)} durationInFrames={45} layout="none">
        <Audio src={SFX.jackpot} volume={0.85} />
      </Sequence>

      {/* 17.2s: Notification Pull Ping */}
      <Sequence from={Math.round(17.2 * FPS)} durationInFrames={25} layout="none">
        <Audio src={SFX.notifPing} volume={0.8} />
      </Sequence>

      {/* 19.5s: Dopamine Surge Up + 22.8s: Dopamine Crash Power-Down */}
      <Sequence from={Math.round(19.6 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.dopamineUp} volume={0.85} />
      </Sequence>
      <Sequence from={Math.round(22.9 * FPS)} durationInFrames={40} layout="none">
        <Audio src={SFX.powerDown} volume={0.85} />
      </Sequence>

      {/* 28.0s: Secret Hack Vault Unlock */}
      <Sequence from={Math.round(28.1 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.vaultUnlock} volume={0.8} />
      </Sequence>

      {/* 31.8s: Grayscale Mode Switch Click */}
      <Sequence from={Math.round(31.8 * FPS)} durationInFrames={20} layout="none">
        <Audio src={SFX.toggleClick} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={DopamineSlotMachineReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
