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
   DIRECTOR'S MULTI-CAMERA EDITION — LAW 04: "ALWAYS SAY LESS THAN NECESSARY"
   1080 x 1920 | 60 FPS | 57.5 Seconds (3450 Frames)
   - 0.0s - 4.2s: Rich Atmospheric Hook with Giant Center-Screen Captions
   - 4.2s - 7.8s: World/Eurasia Map with Green Highlighted Russia & 1825 Pin
   - 7.8s - 39.0s: Crowded Detailed Courtyard with 2.5s-3s Multi-Angle Cuts
   - 39.0s - 57.5s: 48 Laws Book, Law #04, Mouth Lock & Friend Comment CTA
   Zero External Assets Needed. Built-in Procedural SFX.
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 3450; // 57.5 Seconds @ 60 FPS

const GOLD = "#E5C158";
const GOLD_LIGHT = "#FFF3C4";
const CRIMSON = "#FF3B30";
const EMERALD = "#2CE59B";
const CYAN = "#00E5FF";
const PURPLE = "#B983FF";

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. PROCEDURAL SOUND EFFECTS ENGINE (CUSTOM SFX FOR EVERY SCENE & CUT)
   ========================================================================= */

type SfxKind =
  | "hookSlam"
  | "mapRadar"
  | "cutWhoosh"
  | "ropeSnap"
  | "bodyThud"
  | "crowdGasp"
  | "divineChime"
  | "bubblePop"
  | "angerBass"
  | "paperRip"
  | "chainDrop"
  | "lockSlam";

function createCustomSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations: Record<SfxKind, number> = {
    hookSlam: 0.38,
    mapRadar: 0.55,
    cutWhoosh: 0.22,
    ropeSnap: 0.24,
    bodyThud: 0.42,
    crowdGasp: 0.6,
    divineChime: 0.8,
    bubblePop: 0.16,
    angerBass: 0.55,
    paperRip: 0.46,
    chainDrop: 0.38,
    lockSlam: 0.28,
  };

  const duration = durations[kind];
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
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
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const p = i / samples;
    let w = 0;
    let env = 1;

    if (kind === "hookSlam") {
      const f = 145 * Math.pow(1 - p, 1.8) + 38;
      const noise = Math.sin(i * 19.3) * Math.cos(i * 0.7) * Math.exp(-p * 10);
      w = Math.sin(2 * Math.PI * f * t) * 0.8 + noise * 0.4;
      env = Math.pow(1 - p, 2.1);
    } else if (kind === "mapRadar") {
      // Sonar ping + digital map sweep
      const pingF = p < 0.35 ? 880 : 1320;
      w =
        Math.sin(2 * Math.PI * pingF * t) * 0.6 +
        Math.sin(2 * Math.PI * (240 + p * 600) * t) * 0.3;
      env = Math.exp(-p * 4.5);
    } else if (kind === "cutWhoosh") {
      const n = Math.sin(i * 12.9898) * Math.cos(i * 0.21);
      w = n * 0.45 + Math.sin(2 * Math.PI * (150 + Math.sin(p * Math.PI) * 320) * t) * 0.35;
      env = Math.sin(Math.PI * p) * 0.8;
    } else if (kind === "ropeSnap") {
      const crack = Math.sin(i * 41.2) * Math.cos(i * 3.7);
      w = crack * 0.8 + Math.sin(2 * Math.PI * (1100 - p * 800) * t) * 0.4;
      env = Math.exp(-p * 13);
    } else if (kind === "bodyThud") {
      const f = 105 * Math.pow(1 - p, 1.9) + 30;
      w = Math.sin(2 * Math.PI * f * t) * 0.9;
      env = Math.pow(1 - p, 2.3);
    } else if (kind === "crowdGasp") {
      // Breath-like filtered noise swell
      const breath = Math.sin(i * 9.1) * Math.cos(i * 0.45);
      w = breath * 0.5 + Math.sin(2 * Math.PI * (320 - p * 90) * t) * 0.25;
      env = Math.sin(Math.PI * p) * Math.exp(-p * 1.8);
    } else if (kind === "divineChime") {
      w =
        Math.sin(2 * Math.PI * 528 * t) * 0.4 +
        Math.sin(2 * Math.PI * 660 * t) * 0.3 +
        Math.sin(2 * Math.PI * 792 * t) * 0.25 +
        Math.sin(2 * Math.PI * 1056 * t) * 0.15;
      env = Math.sin(Math.PI * p) * Math.exp(-p * 2.0);
    } else if (kind === "bubblePop") {
      const f = 360 + p * 540;
      w = Math.sin(2 * Math.PI * f * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 1.4);
    } else if (kind === "angerBass") {
      const f = 80 * (1 - p * 0.4);
      w = Math.sin(2 * Math.PI * f * t) * 0.85 + Math.sin(2 * Math.PI * f * 2 * t) * 0.25;
      env = Math.pow(1 - p, 1.5);
    } else if (kind === "paperRip") {
      const tear = Math.sin(i * 53.7) * Math.cos(i * 9.3) * (0.6 + 0.4 * Math.sin(p * 40));
      w = tear * 0.85;
      env = Math.sin(Math.PI * p);
    } else if (kind === "chainDrop") {
      w =
        Math.sin(2 * Math.PI * 1400 * t) * 0.5 +
        Math.sin(2 * Math.PI * 2150 * t) * 0.4 +
        Math.sin(i * 29.1) * 0.35;
      env = Math.exp(-p * 9);
    } else if (kind === "lockSlam") {
      w = Math.sin(2 * Math.PI * 1850 * t) * 0.6 + Math.sin(2 * Math.PI * 240 * t) * 0.5;
      env = Math.exp(-p * 12);
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
  hookSlam: createCustomSfx("hookSlam"),
  mapRadar: createCustomSfx("mapRadar"),
  cutWhoosh: createCustomSfx("cutWhoosh"),
  ropeSnap: createCustomSfx("ropeSnap"),
  bodyThud: createCustomSfx("bodyThud"),
  crowdGasp: createCustomSfx("crowdGasp"),
  divineChime: createCustomSfx("divineChime"),
  bubblePop: createCustomSfx("bubblePop"),
  angerBass: createCustomSfx("angerBass"),
  paperRip: createCustomSfx("paperRip"),
  chainDrop: createCustomSfx("chainDrop"),
  lockSlam: createCustomSfx("lockSlam"),
};

/* =========================================================================
   02. SCENE 1 (0.0s - 4.2s): RICH HOOK BACKGROUND + GIANT CENTER CAPTIONS
   ========================================================================= */

const CenterHookStage: React.FC<{ sec: number; frame: number }> = ({ sec, frame }) => {
  const { fps } = useVideoConfig();

  // Two-beat center hook slam synced with voiceover:
  // Beat A (0.0s - 2.1s): "KYA AAPKO PATA HAI... ZYADA BOLNE KI AADAT"
  // Beat B (2.1s - 4.2s): "AAPKI JAAN BHI LE SAKTI HAI! 💀"
  const isBeatB = sec >= 2.1;
  const beatAge = isBeatB ? frame - Math.round(2.1 * FPS) : frame;

  const slamPop = spring({
    frame: Math.max(0, beatAge),
    fps,
    config: { damping: 10, stiffness: 220, mass: 0.7 },
  });

  const scale = interpolate(slamPop, [0, 1], [2.2, 1]);

  const embers = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        x: (i * 149) % WIDTH,
        y: (i * 211) % HEIGHT,
        r: 3 + (i % 5) * 2,
        speed: 1.5 + (i % 4) * 0.7,
      })),
    []
  );

  return (
    <AbsoluteFill
      style={{
        background: isBeatB
          ? "radial-gradient(circle at 50% 50%, #3B0910 0%, #120408 55%, #050509 100%)"
          : "radial-gradient(circle at 50% 50%, #1F1A0D 0%, #0C0B12 58%, #050509 100%)",
        overflow: "hidden",
      }}
    >
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* Rotating Sacred Geometry Background Rings */}
        <g transform={`translate(540 960) rotate(${frame * 0.35})`} opacity="0.22">
          <circle r="440" fill="none" stroke={isBeatB ? CRIMSON : GOLD} strokeWidth="3" strokeDasharray="16 14" />
          <circle r="340" fill="none" stroke={isBeatB ? CRIMSON : GOLD} strokeWidth="2" />
          <polygon
            points="0,-420 363,210 -363,210"
            fill="none"
            stroke={isBeatB ? CRIMSON : GOLD}
            strokeWidth="2"
          />
          <polygon
            points="0,420 363,-210 -363,-210"
            fill="none"
            stroke={isBeatB ? CRIMSON : GOLD}
            strokeWidth="2"
          />
        </g>

        {/* Rising Glowing Embers */}
        {embers.map((e, idx) => {
          const ey = (e.y - frame * e.speed + HEIGHT) % HEIGHT;
          return (
            <circle
              key={idx}
              cx={e.x}
              cy={ey}
              r={e.r}
              fill={isBeatB ? CRIMSON : GOLD}
              opacity={0.35 + (idx % 4) * 0.15}
            />
          );
        })}
      </svg>

      {/* GIANT CENTER-SCREEN CAPTION SLAM */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 55px",
          textAlign: "center",
          transform: `scale(${scale})`,
        }}
      >
        {!isBeatB ? (
          <>
            <div
              style={{
                padding: "12px 32px",
                borderRadius: 100,
                background: "rgba(229,193,88,0.15)",
                border: `3px solid ${GOLD}`,
                color: GOLD_LIGHT,
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: 5,
                marginBottom: 28,
              }}
            >
              ⚠️ KYA AAPKO PATA HAI?
            </div>
            <div
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                fontSize: 92,
                fontWeight: 900,
                lineHeight: 1.04,
                color: "#FFFFFF",
                textShadow: "0 15px 40px rgba(0,0,0,0.9)",
              }}
            >
              ZYADA BOLNE
            </div>
            <div
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                fontSize: 104,
                fontWeight: 900,
                lineHeight: 1.04,
                color: GOLD,
                marginTop: 10,
                textShadow: `0 0 60px ${GOLD}99, 0 15px 40px rgba(0,0,0,0.95)`,
              }}
            >
              KI AADAT... 🗣️
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 120,
                marginBottom: 15,
              }}
            >
              💀
            </div>
            <div
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                fontSize: 88,
                fontWeight: 900,
                lineHeight: 1.02,
                color: "#FFFFFF",
                textShadow: "0 15px 40px rgba(0,0,0,0.95)",
              }}
            >
              AAPKI <span style={{ color: CRIMSON }}>JAAN BHI</span>
            </div>
            <div
              style={{
                fontFamily: '"Arial Black", Impact, sans-serif',
                fontSize: 102,
                fontWeight: 900,
                lineHeight: 1.02,
                color: CRIMSON,
                marginTop: 12,
                textShadow: `0 0 70px ${CRIMSON}, 0 15px 40px rgba(0,0,0,0.95)`,
              }}
            >
              LE SAKTI HAI!
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   03. SCENE 2 (4.2s - 7.8s): WORLD MAP WITH GREEN RUSSIA HIGHLIGHT & 1825
   ========================================================================= */

const RussiaMapScene: React.FC<{ sec: number; frame: number }> = ({ sec, frame }) => {
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - Math.round(4.2 * FPS));

  // Smooth camera zoom into Russia on the map
  const mapZoom = interpolate(localFrame, [0, 180], [1.0, 1.38], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const russiaGlow = spring({
    frame: Math.max(0, localFrame - 12),
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const pinDrop = spring({
    frame: Math.max(0, localFrame - 35),
    fps,
    config: { damping: 10, stiffness: 180 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 48%, #0B2133 0%, #050E17 70%, #03070C 100%)",
        overflow: "hidden",
      }}
    >
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <filter id="greenMapGlow">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Latitude / Longitude Cartographic Grid */}
        <g stroke="#183A54" strokeWidth="1.5" opacity="0.55">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`lat-${i}`} x1="0" y1={i * 125} x2={WIDTH} y2={i * 125} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`lon-${i}`} x1={i * 120} y1="0" x2={i * 120} y2={HEIGHT} />
          ))}
        </g>

        {/* MAP CAMERA ZOOM GROUP */}
        <g
          transform={`translate(540 960) scale(${mapZoom}) translate(-540 -960)`}
        >
          {/* Neighboring Countries / Continents in Muted Slate Blue */}
          {/* Western Europe */}
          <path
            d="M 90 790 L 180 740 L 265 755 L 285 835 L 220 910 L 115 900 Z"
            fill="#16293B"
            stroke="#2B4C6B"
            strokeWidth="3"
          />
          <text x="185" y="845" fill="#527696" fontSize="20" fontWeight="800" textAnchor="middle">
            EUROPE
          </text>

          {/* Scandinavia */}
          <path
            d="M 210 610 L 295 570 L 325 660 L 255 720 Z"
            fill="#16293B"
            stroke="#2B4C6B"
            strokeWidth="3"
          />

          {/* Middle East / Persia */}
          <path
            d="M 260 940 L 440 930 L 475 1065 L 310 1090 Z"
            fill="#16293B"
            stroke="#2B4C6B"
            strokeWidth="3"
          />
          <text x="370" y="1025" fill="#527696" fontSize="18" fontWeight="800" textAnchor="middle">
            PERSIA
          </text>

          {/* Central Asia / Mongolia / China */}
          <path
            d="M 465 920 L 795 905 L 875 1060 L 660 1135 L 485 1060 Z"
            fill="#16293B"
            stroke="#2B4C6B"
            strokeWidth="3"
          />
          <text x="675" y="1020" fill="#527696" fontSize="22" fontWeight="800" textAnchor="middle">
            ASIA
          </text>

          {/* India Subcontinent */}
          <path
            d="M 520 1075 L 645 1085 L 585 1265 L 525 1170 Z"
            fill="#16293B"
            stroke="#2B4C6B"
            strokeWidth="3"
          />

          {/* ===============================================================
              HIGHLIGHTED GREEN RUSSIA TERRITORY (GLOWING EMERALD!)
             =============================================================== */}
          <g opacity={russiaGlow}>
            <path
              d="M 275 745 L 330 620 L 455 575 L 650 560 L 890 595 L 980 685 L 930 825 L 810 895 L 615 910 L 455 915 L 340 875 Z"
              fill={EMERALD}
              fillOpacity={0.32 + Math.sin(localFrame * 0.15) * 0.08}
              stroke={EMERALD}
              strokeWidth="7"
              filter="url(#greenMapGlow)"
            />
            <path
              d="M 275 745 L 330 620 L 455 575 L 650 560 L 890 595 L 980 685 L 930 825 L 810 895 L 615 910 L 455 915 L 340 875 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="12 8"
            />

            {/* Expanding Radar Rings Over Russia */}
            {[0, 1, 2].map((rIdx) => {
              const rad = ((localFrame * 3.2 + rIdx * 85) % 260) + 20;
              return (
                <circle
                  key={rIdx}
                  cx="585"
                  cy="755"
                  r={rad}
                  fill="none"
                  stroke={EMERALD}
                  strokeWidth="4"
                  opacity={clamp(1 - rad / 270)}
                />
              );
            })}

            {/* Bold Country Label Inside Map */}
            <text
              x="610"
              y="765"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="58"
              fontWeight="900"
              letterSpacing="8"
              fontFamily='"Arial Black", Impact, sans-serif'
            >
              RUSSIA
            </text>
          </g>

          {/* Animated Location Pin on St. Petersburg / Moscow */}
          <g
            transform={`translate(435 ${745 - (1 - pinDrop) * 180}) scale(${pinDrop})`}
          >
            <circle cx="0" cy="0" r="14" fill={CRIMSON} stroke="#FFFFFF" strokeWidth="4" />
            <path d="M 0 0 L -24 -58 A 28 28 0 1 1 24 -58 Z" fill={CRIMSON} stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="0" cy="-64" r="10" fill="#FFFFFF" />
            <rect x="-155" y="-145" width="310" height="54" rx="14" fill="#0B1926" stroke={EMERALD} strokeWidth="3.5" />
            <text x="0" y="-110" textAnchor="middle" fill={EMERALD} fontSize="24" fontWeight="900" letterSpacing="2">
              📍 ST. PETERSBURG • 1825
            </text>
          </g>
        </g>

        {/* Top Year & Location Counter Overlay */}
        <g transform="translate(540 245)">
          <rect x="-340" y="-85" width="680" height="170" rx="28" fill="rgba(8, 20, 32, 0.92)" stroke={EMERALD} strokeWidth="5" />
          <text y="-22" textAnchor="middle" fill={EMERALD} fontSize="30" fontWeight="900" letterSpacing="6">
            🌍 HISTORICAL LOCATION LOCKED
          </text>
          <text
            y="52"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="68"
            fontWeight="900"
            fontFamily='"Arial Black", Impact, sans-serif'
          >
            RUSSIA • <tspan fill={GOLD}>1825</tspan>
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* =========================================================================
   04. RIGGED CHARACTERS + CROWD + GUARDS FOR THE DETAILED COURTYARD
   ========================================================================= */

const RiggedRebel: React.FC<{
  x: number;
  y: number;
  rotation?: number;
  pose: "hanging" | "falling" | "sitting" | "mocking" | "locked";
  isTalking?: boolean;
  frame: number;
}> = ({ x, y, rotation = 0, pose, isTalking = false, frame }) => {
  const leftArmDeg =
    pose === "falling"
      ? -140 + Math.sin(frame * 0.6) * 28
      : pose === "mocking"
        ? 25
        : pose === "sitting"
          ? -22
          : 12;

  const rightArmDeg =
    pose === "falling"
      ? 140 - Math.sin(frame * 0.6) * 28
      : pose === "mocking"
        ? -130 + Math.sin(frame * 0.25) * 14
        : pose === "sitting"
          ? 28
          : -12;

  const legSpread =
    pose === "falling"
      ? 26 + Math.sin(frame * 0.7) * 15
      : pose === "sitting"
        ? 40
        : 8;

  const mouthOpen = isTalking ? 7 + Math.abs(Math.sin(frame * 0.45)) * 12 : 2.5;

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      {(pose === "sitting" || pose === "mocking") && (
        <ellipse cx="0" cy="185" rx="70" ry="16" fill="rgba(0,0,0,0.5)" />
      )}

      {/* Legs */}
      <g transform={`translate(-22 85) rotate(${legSpread})`}>
        <rect x="-14" y="0" width="28" height="88" rx="12" fill="#2A303C" stroke="#141820" strokeWidth="3" />
        <ellipse cx="-4" cy="92" rx="20" ry="11" fill="#1C1613" />
      </g>
      <g transform={`translate(22 85) rotate(${-legSpread})`}>
        <rect x="-14" y="0" width="28" height="88" rx="12" fill="#2A303C" stroke="#141820" strokeWidth="3" />
        <ellipse cx="4" cy="92" rx="20" ry="11" fill="#1C1613" />
      </g>

      {/* Prisoner Coat */}
      <path
        d="M-48 -28 C-54 20 -50 68 -44 95 L44 95 C50 68 54 20 48 -28 Z"
        fill="#5C4938"
        stroke="#2B2118"
        strokeWidth="4"
      />
      <path d="M-20 -28 L0 25 L20 -28" fill="#D8CEBE" stroke="#8C7E6A" strokeWidth="3" />

      {/* Arms */}
      <g transform={`translate(-46 -18) rotate(${leftArmDeg})`}>
        <rect x="-13" y="0" width="26" height="78" rx="12" fill="#4E3D2E" stroke="#2B2118" strokeWidth="3" />
        <circle cx="0" cy="82" r="14" fill="#D9A17C" stroke="#8C5B3C" strokeWidth="3" />
      </g>
      <g transform={`translate(46 -18) rotate(${rightArmDeg})`}>
        <rect x="-13" y="0" width="26" height="78" rx="12" fill="#4E3D2E" stroke="#2B2118" strokeWidth="3" />
        <circle cx="0" cy="82" r="14" fill="#D9A17C" stroke="#8C5B3C" strokeWidth="3" />
      </g>

      {/* Rope Collar */}
      <ellipse cx="0" cy="-30" rx="26" ry="10" fill="none" stroke="#C8A97E" strokeWidth="9" />

      {/* Head */}
      <g transform={`translate(0 -72) rotate(${pose === "mocking" ? -8 : 0})`}>
        <ellipse cx="0" cy="0" rx="42" ry="48" fill="#DFA682" stroke="#8C5B3C" strokeWidth="3.5" />
        <path
          d="M-44 -15 C-52 -55 12 -65 44 -30 C52 -15 44 0 36 -8 C12 -24 -22 -22 -44 -15 Z"
          fill="#2B221E"
        />

        {pose === "hanging" || pose === "falling" ? (
          <g>
            <circle cx="-15" cy="-6" r="8" fill="#FFFFFF" stroke="#1E1614" strokeWidth="2.5" />
            <circle cx="15" cy="-6" r="8" fill="#FFFFFF" stroke="#1E1614" strokeWidth="2.5" />
            <circle cx="-15" cy="-6" r="3.5" fill="#1E1614" />
            <circle cx="15" cy="-6" r="3.5" fill="#1E1614" />
          </g>
        ) : pose === "mocking" ? (
          <g>
            <path d="M-26 -18 Q-15 -26 -5 -16" fill="none" stroke="#1E1614" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M5 -16 Q15 -26 26 -18" fill="none" stroke="#1E1614" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="-15" cy="-5" r="5" fill="#1E1614" />
            <circle cx="15" cy="-5" r="5" fill="#1E1614" />
          </g>
        ) : (
          <g>
            <circle cx="-15" cy="-5" r="5" fill="#1E1614" />
            <circle cx="15" cy="-5" r="5" fill="#1E1614" />
          </g>
        )}

        {pose === "locked" ? (
          <g transform="translate(0 22)">
            <rect x="-26" y="-12" width="52" height="26" rx="6" fill={GOLD} stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="0" cy="1" r="5" fill="#18120B" />
          </g>
        ) : (
          <ellipse
            cx="0"
            cy="22"
            rx={isTalking ? 14 : 9}
            ry={mouthOpen}
            fill="#3B1618"
            stroke="#1E1614"
            strokeWidth="2.5"
          />
        )}
      </g>
    </g>
  );
};

const RiggedTsar: React.FC<{
  x: number;
  y: number;
  tearProgress: number;
  isTalking: boolean;
  frame: number;
}> = ({ x, y, tearProgress, isTalking, frame }) => {
  const breathe = Math.sin(frame * 0.08) * 3;
  const mouthH = isTalking ? 6 + Math.abs(Math.sin(frame * 0.45)) * 11 : 3;
  const armPull = interpolate(tearProgress, [0, 0.35, 1], [0, 52, 92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <g transform={`translate(${x} ${y + breathe})`}>
      {/* Golden Throne */}
      <path
        d="M-115 -155 L-130 185 L130 185 L115 -155 Q0 -215 -115 -155 Z"
        fill="#4A121B"
        stroke={GOLD}
        strokeWidth="8"
      />
      <circle cx="-95" cy="-145" r="16" fill={GOLD} />
      <circle cx="95" cy="-145" r="16" fill={GOLD} />

      {/* Royal Cloak */}
      <path
        d="M-95 10 C-120 75 -130 140 -135 195 L135 195 C130 140 120 75 95 10 Z"
        fill="#7C1324"
        stroke={GOLD}
        strokeWidth="5"
      />
      <path
        d="M-85 5 Q0 52 85 5 L100 45 Q0 88 -100 45 Z"
        fill="#F6F1E6"
        stroke="#C7B9A5"
        strokeWidth="3"
      />

      {/* Tsar Head */}
      <g transform="translate(0 -52)">
        <ellipse cx="0" cy="0" rx="48" ry="54" fill="#DBA17C" stroke="#8C5B3C" strokeWidth="3.5" />
        <path
          d="M-46 8 C-48 52 -22 76 0 82 C22 76 48 52 46 8 C30 24 14 26 0 26 C-14 26 -30 24 -46 8 Z"
          fill="#22191C"
        />
        <line x1="-34" y1="-22" x2="-8" y2="-10" stroke="#181012" strokeWidth="6.5" strokeLinecap="round" />
        <line x1="34" y1="-22" x2="8" y2="-10" stroke="#181012" strokeWidth="6.5" strokeLinecap="round" />
        <circle cx="-18" cy="-4" r="6.5" fill={CRIMSON} />
        <circle cx="18" cy="-4" r="6.5" fill={CRIMSON} />
        <ellipse cx="0" cy="30" rx="13" ry={mouthH} fill="#3D0C11" stroke={GOLD} strokeWidth="2" />

        {/* Crown */}
        <path
          d="M-54 -34 L-66 -98 L-26 -68 L0 -115 L26 -68 L66 -98 L54 -34 Z"
          fill={GOLD}
          stroke="#FFF5CC"
          strokeWidth="4"
        />
        <circle cx="0" cy="-105" r="8" fill="#FFFFFF" />
      </g>

      {/* Ripping the Pardon Scroll */}
      <g transform={`translate(${-26 - armPull} ${85 + tearProgress * 18}) rotate(${-tearProgress * 25})`}>
        <path d="M-68 -45 L0 -45 L-6 -20 L4 0 L-8 22 L0 45 L-68 45 Z" fill="#F7EFE0" stroke="#8C7A60" strokeWidth="3" />
        <text x="-34" y="6" textAnchor="middle" fill={CRIMSON} fontSize="16" fontWeight="900">
          MAAFI
        </text>
        <circle cx="-60" cy="0" r="16" fill="#DBA17C" stroke="#8C5B3C" strokeWidth="3" />
      </g>

      <g transform={`translate(${26 + armPull} ${85 + tearProgress * 18}) rotate(${tearProgress * 25})`}>
        <path d="M0 -45 L68 -45 L68 45 L0 45 L-8 22 L4 0 L-6 -20 Z" fill="#F7EFE0" stroke="#8C7A60" strokeWidth="3" />
        <text x="34" y="6" textAnchor="middle" fill={CRIMSON} fontSize="16" fontWeight="900">
          PAPER
        </text>
        <circle cx="60" cy="0" r="16" fill="#DBA17C" stroke="#8C5B3C" strokeWidth="3" />
      </g>
    </g>
  );
};

/* =========================================================================
   05. MULTI-CAMERA COURTYARD STAGE (CUTS CAMERA ANGLES EVERY 2.5s - 3s!)
   ========================================================================= */

type CameraShot = {
  shotId: number;
  startSec: number;
  endSec: number;
  camX: number;
  camY: number;
  camScale: number;
  camRot?: number;
  shotLabel: string;
  headlineTop: string;
  headlineMain: string;
  accent: string;
};

// 10 Distinct Camera Angles inside the Detailed Courtyard (7.8s - 39.0s)
const COURTYARD_CAMERA_CUTS: CameraShot[] = [
  {
    shotId: 1,
    startSec: 7.8,
    endSec: 9.6,
    camX: 1480,
    camY: 980,
    camScale: 0.88,
    shotLabel: "CAM 01 // WIDE COURTYARD & CROWD",
    headlineTop: "1825 • ST. PETERSBURG SQUARE",
    headlineMain: "BHEED KE SAMNE FAANSI! ⛓️",
    accent: GOLD,
  },
  {
    shotId: 2,
    startSec: 9.6,
    endSec: 11.4,
    camX: 1580,
    camY: 645, // Extreme Close-Up on the snapping rope!
    camScale: 1.95,
    camRot: -3,
    shotLabel: "CAM 02 // MACRO ROPE SNAP",
    headlineTop: "PAR ACHANAK...",
    headlineMain: "ROPE TOOT GAYI! 💥",
    accent: CRIMSON,
  },
  {
    shotId: 3,
    startSec: 11.4,
    endSec: 14.5,
    camX: 1450,
    camY: 1160, // Crowd gasping & Rebel on floor
    camScale: 1.08,
    shotLabel: "CAM 03 // CROWD SHOCK & DIVINE SIGN",
    headlineTop: "PURI BHEED CHAUK GAYI:",
    headlineMain: "BHAGWAN KA ISHARA! 🕊️",
    accent: GOLD,
  },
  {
    shotId: 4,
    startSec: 14.5,
    endSec: 18.2,
    camX: 1580,
    camY: 980, // Medium Close-Up on Rebel & Mercy Thought Bubble
    camScale: 1.32,
    shotLabel: "CAM 04 // ROYAL PARDON LAW",
    headlineTop: "US WAQT KA RULE THA:",
    headlineMain: "INSAN KO MAAF KAR DO! ✅",
    accent: EMERALD,
  },
  {
    shotId: 5,
    startSec: 18.2,
    endSec: 21.8,
    camX: 1580,
    camY: 1030, // Dutch-angle close-up on Rebel becoming over-smart
    camScale: 1.65,
    camRot: 3.5,
    shotLabel: "CAM 05 // CLOSE-UP: REBEL'S EGO",
    headlineTop: "PAR REBEL BANA",
    headlineMain: "OVER-SMART! 😏",
    accent: CYAN,
  },
  {
    shotId: 6,
    startSec: 21.8,
    endSec: 25.5,
    camX: 1560,
    camY: 920, // Framing Rebel pointing up + Speech Bubble
    camScale: 1.25,
    shotLabel: "CAM 06 // THE FATAL INSULT",
    headlineTop: "ZOR SE CHILLAYA:",
    headlineMain: "DHANG KI ROPE BHI NAHI! 🤡",
    accent: CRIMSON,
  },
  {
    shotId: 7,
    startSec: 25.5,
    endSec: 29.0,
    camX: 560,
    camY: 920, // Instant Cut to Royal Palace Balcony!
    camScale: 1.15,
    shotLabel: "CAM 07 // ROYAL PALACE BALCONY",
    headlineTop: "JAB YEH BAAT",
    headlineMain: "RAJA KO PATA CHALI! ⚡",
    accent: GOLD,
  },
  {
    shotId: 8,
    startSec: 29.0,
    endSec: 32.5,
    camX: 560,
    camY: 1035, // Extreme Close-Up on Tsar's hands ripping the paper!
    camScale: 2.05,
    camRot: -2.5,
    shotLabel: "CAM 08 // MACRO: PARDON RIPPED",
    headlineTop: "GUSSE MEIN RAJA NE",
    headlineMain: "MAAFI PAPER PHAAD DIYA! 📄💥",
    accent: CRIMSON,
  },
  {
    shotId: 9,
    startSec: 32.5,
    endSec: 35.8,
    camX: 560,
    camY: 850, // Low-angle shot of Tsar & Speech Bubble
    camScale: 1.32,
    shotLabel: "CAM 09 // THE KING'S ORDER",
    headlineTop: "AUR BOLA — CHALO,",
    headlineMain: "USE GALAT SABIT KAREIN! 👑",
    accent: GOLD,
  },
  {
    shotId: 10,
    startSec: 35.8,
    endSec: 39.0,
    camX: 1640,
    camY: 820, // Cut back to Gallows: Heavy New Rope Drops!
    camScale: 1.42,
    shotLabel: "CAM 10 // NEXT DAY: REINFORCED ROPE",
    headlineTop: "AUR AGLE HI DIN...",
    headlineMain: "NAYI MAZBOOT ROPE! ⛓️",
    accent: EMERALD,
  },
];

const DetailedCourtyardMultiCam: React.FC<{ sec: number; frame: number }> = ({
  sec,
  frame,
}) => {
  const { fps } = useVideoConfig();

  // Select current camera angle cut (changes every ~2.5s - 3s!)
  const activeShot =
    COURTYARD_CAMERA_CUTS.find((s) => sec >= s.startSec && sec < s.endSec) ??
    COURTYARD_CAMERA_CUTS[COURTYARD_CAMERA_CUTS.length - 1];

  const shotAgeFrames = Math.max(0, frame - Math.round(activeShot.startSec * FPS));
  const shotDurationFrames = Math.max(
    1,
    Math.round((activeShot.endSec - activeShot.startSec) * FPS)
  );
  const shotProgress = clamp(shotAgeFrames / shotDurationFrames);

  // Subtle dynamic push-in within each camera angle so the shot is always alive
  const liveScale = activeShot.camScale * (1 + shotProgress * 0.06);
  const liveCamY =
    activeShot.shotId === 2 && sec >= 10.1
      ? mix(645, 1080, clamp((sec - 10.1) / 0.75)) // Follow Rebel falling down in Shot 2!
      : activeShot.camY;

  const isRopeBroken = sec >= 10.0;
  const rebelFallT = clamp((sec - 10.0) / 0.75);
  const rebelY = !isRopeBroken ? 865 : mix(865, 1115, rebelFallT);

  const rebelPose: "hanging" | "falling" | "sitting" | "mocking" = !isRopeBroken
    ? "hanging"
    : sec < 10.75
      ? "falling"
      : sec < 18.2
        ? "sitting"
        : "mocking";

  const paperRipT = clamp((sec - 29.3) / 1.4);
  const newRopeDropY = interpolate(sec, [36.0, 37.1], [-360, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.bounce),
  });

  // 42 Crowd Spectators across the courtyard foreground & midground
  const crowdMembers = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        x: 220 + i * 48 + (i % 3) * 11,
        y: 1365 + (i % 3) * 28,
        scale: 0.82 + (i % 4) * 0.08,
        hatType: i % 3,
        color: i % 2 === 0 ? "#182030" : "#232B3E",
      })),
    []
  );

  const translateX = WIDTH / 2 - activeShot.camX * liveScale;
  const translateY = HEIGHT / 2 - liveCamY * liveScale;

  return (
    <AbsoluteFill style={{ backgroundColor: "#070A14", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="courtyardSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#070A16" />
            <stop offset="50%" stopColor="#151F38" />
            <stop offset="100%" stopColor="#26324B" />
          </linearGradient>
          <linearGradient id="divineRay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF6C4" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#E5C158" stopOpacity="0.0" />
          </linearGradient>
          <radialGradient id="torchGlow">
            <stop offset="0%" stopColor="#FF9F43" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FF9F43" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#courtyardSky)" />

        {/* =================================================================
            MULTI-CAMERA WORLD VIEWPORT
           ================================================================= */}
        <g
          transform={`translate(${translateX} ${translateY}) scale(${liveScale}) rotate(${
            activeShot.camRot ?? 0
          } ${activeShot.camX} ${liveCamY})`}
        >
          {/* 1. DETAILED ST. PETERSBURG WINTER PALACE & DOMES (BACKGROUND) */}
          <g>
            {/* Distant Cathedral Domes */}
            {[280, 720, 1140, 1520, 1960].map((dx, i) => (
              <g key={i} transform={`translate(${dx} 660)`}>
                <rect x="-55" y="-210" width="110" height="210" fill="#11182B" stroke="#263554" strokeWidth="2" />
                <path
                  d="M-65 -210 C-65 -290 0 -325 0 -385 C0 -325 65 -290 65 -210 Z"
                  fill="#1C2842"
                  stroke={GOLD}
                  strokeWidth="2.5"
                />
                <line x1="0" y1="-385" x2="0" y2="-445" stroke={GOLD} strokeWidth="4" />
              </g>
            ))}

            {/* Illuminated Palace Facade with Arched Windows & Columns */}
            <rect x="50" y="640" width="2150" height="680" fill="#161E31" stroke={GOLD} strokeWidth="4" />
            {Array.from({ length: 18 }, (_, i) => {
              const wx = 135 + i * 115;
              return (
                <g key={i} transform={`translate(${wx} 740)`}>
                  {/* Illuminated Warm Palace Window */}
                  <rect
                    x="-26"
                    y="0"
                    width="52"
                    height="95"
                    rx="26"
                    fill="#FFE08C"
                    opacity={0.35 + (i % 3) * 0.15}
                  />
                  {/* Classical Column Between Windows */}
                  <rect x="44" y="-80" width="22" height="620" fill="#232E47" />
                </g>
              );
            })}

            {/* Waving Imperial Flags Along Roofline */}
            {[350, 850, 1320, 1820].map((fx, i) => {
              const wave = Math.sin(frame * 0.15 + i) * 12;
              return (
                <g key={i} transform={`translate(${fx} 640)`}>
                  <line x1="0" y1="0" x2="0" y2="-130" stroke={GOLD} strokeWidth="5" />
                  <path
                    d={`M 0 -125 Q 45 ${-135 + wave} 95 ${-115 - wave} L 95 ${
                      -65 - wave
                    } Q 45 ${-85 + wave} 0 -75 Z`}
                    fill={i % 2 === 0 ? CRIMSON : GOLD}
                  />
                </g>
              );
            })}
          </g>

          {/* 2. COBBLESTONE & SNOW COURTYARD GROUND */}
          <rect x="-200" y="1310" width="2600" height="700" fill="#1C2538" />

          {/* Burning Iron Fire Braziers / Torches Lighting the Square */}
          {[960, 1240, 1880].map((tx, idx) => (
            <g key={idx} transform={`translate(${tx} 1230)`}>
              <circle cx="0" cy="-45" r="140" fill="url(#torchGlow)" />
              <line x1="-18" y1="80" x2="0" y2="-15" stroke="#2D2520" strokeWidth="8" />
              <line x1="18" y1="80" x2="0" y2="-15" stroke="#2D2520" strokeWidth="8" />
              <path d="M-32 -15 L32 -15 L20 12 L-20 12 Z" fill="#3B312B" stroke={GOLD} strokeWidth="2" />
              <path
                d={`M-22 -15 Q 0 ${-75 - Math.sin(frame * 0.4 + idx) * 18} 22 -15 Z`}
                fill="#FF9F43"
              />
              <path
                d={`M-12 -15 Q 0 ${-55 - Math.cos(frame * 0.5 + idx) * 12} 12 -15 Z`}
                fill="#FFF2A6"
              />
            </g>
          ))}

          {/* 3. LEFT ZONE (X=560): TSAR'S ROYAL BALCONY */}
          <g transform="translate(560 960)">
            <rect x="-340" y="-420" width="680" height="780" rx="18" fill="#1C1926" stroke={GOLD} strokeWidth="6" />
            <path d="M-260 360 V-260 Q0 -410 260 -260 V360 Z" fill="#120E1A" stroke={GOLD} strokeWidth="5" />
            <path d="M-260 -260 Q-140 -120 -220 180 L-260 180 Z" fill="#6E1222" stroke={GOLD} strokeWidth="3" />
            <path d="M260 -260 Q140 -120 220 180 L260 180 Z" fill="#6E1222" stroke={GOLD} strokeWidth="3" />

            <RiggedTsar
              x={0}
              y={-10}
              tearProgress={paperRipT}
              isTalking={sec >= 32.5 && sec <= 35.8}
              frame={frame}
            />

            <rect x="-360" y="165" width="720" height="36" rx="8" fill={GOLD} />
            <rect x="-340" y="201" width="680" height="160" fill="#2A2433" stroke={GOLD} strokeWidth="4" />

            {/* Tsar's Speech Bubble in Shot 9 */}
            {sec >= 32.5 && sec < 35.8 && (
              <g transform="translate(20 -310)">
                <rect x="-270" y="-75" width="540" height="145" rx="26" fill="#15121E" stroke={CRIMSON} strokeWidth="6" />
                <text x="0" y="-20" textAnchor="middle" fill={CRIMSON} fontSize="22" fontWeight="900" letterSpacing="2">
                  👑 FURIOUS RAJA ORDERS:
                </text>
                <text x="0" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontWeight="900">
                  “Chalo, use GALAT sabit karte hain!”
                </text>
              </g>
            )}
          </g>

          {/* 4. RIGHT ZONE (X=1580): GALLOWS + IMPERIAL GUARDS + REBEL */}
          <g transform="translate(1580 0)">
            {/* Divine Golden Sky Beam (11.4s - 18.2s) */}
            {sec >= 11.4 && sec < 18.2 && (
              <polygon points="-130,180 130,180 360,1340 -360,1340" fill="url(#divineRay)" />
            )}

            {/* Imperial Soldiers Standing Guard with Halberds/Spears */}
            {[-295, 295].map((gx, idx) => (
              <g key={idx} transform={`translate(${gx} 1185)`}>
                {/* Spear */}
                <line x1={idx === 0 ? -28 : 28} y1="-190" x2={idx === 0 ? -28 : 28} y2="110" stroke="#C8BFAF" strokeWidth="6" />
                <polygon
                  points={
                    idx === 0
                      ? "-28,-230 -40,-185 -16,-185"
                      : "28,-230 16,-185 40,-185"
                  }
                  fill={GOLD}
                />
                {/* Soldier Uniform & Shako Helmet */}
                <path d="M-32 0 L32 0 L40 105 L-40 105 Z" fill="#163828" stroke={GOLD} strokeWidth="3" />
                <circle cx="0" cy="-28" r="22" fill="#D59B76" />
                <rect x="-24" y="-72" width="48" height="36" rx="6" fill="#141820" stroke={GOLD} strokeWidth="3" />
              </g>
            ))}

            {/* Wooden Gallows Platform */}
            <rect x="-360" y="1290" width="720" height="42" rx="6" fill="#5A3E28" stroke="#2E1E12" strokeWidth="5" />
            <rect x="-260" y="450" width="48" height="840" fill="#4E3522" stroke="#2B1C10" strokeWidth="4" />
            <rect x="-290" y="420" width="580" height="52" rx="8" fill="#5A3E28" stroke="#2B1C10" strokeWidth="5" />

            {/* Rope Logic */}
            {!isRopeBroken ? (
              <line x1="0" y1="472" x2="0" y2={rebelY - 30} stroke="#D2B48C" strokeWidth="14" />
            ) : (
              <g>
                <path
                  d={`M 0 472 Q ${Math.sin(frame * 0.3) * 28} 560 ${
                    Math.sin(frame * 0.3) * 42
                  } 635`}
                  fill="none"
                  stroke="#D2B48C"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Bright Snap Explosion in Macro Shot 2 */}
                {sec >= 10.0 && sec <= 10.6 && (
                  <g transform="translate(0 630)">
                    <circle
                      r={(sec - 10.0) * 240}
                      fill="none"
                      stroke={CRIMSON}
                      strokeWidth="10"
                      opacity={clamp(1 - (sec - 10.0) * 1.7)}
                    />
                    {[-60, -20, 20, 60, 120, -120].map((ang, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1="0"
                        x2={Math.cos((ang * Math.PI) / 180) * 110}
                        y2={Math.sin((ang * Math.PI) / 180) * 110}
                        stroke={GOLD_LIGHT}
                        strokeWidth="7"
                      />
                    ))}
                  </g>
                )}
              </g>
            )}

            {/* New Reinforced Rope in Shot 10 (35.8s - 39.0s) */}
            {sec >= 35.8 && (
              <g transform={`translate(110 ${newRopeDropY})`}>
                <line x1="0" y1="472" x2="0" y2="830" stroke={GOLD} strokeWidth="20" />
                <ellipse cx="0" cy="865" rx="36" ry="48" fill="none" stroke={GOLD} strokeWidth="16" />
              </g>
            )}

            {/* The Rebel Character */}
            <RiggedRebel
              x={0}
              y={rebelY}
              rotation={sec >= 10.0 && sec < 10.75 ? rebelFallT * 15 : 0}
              pose={rebelPose}
              isTalking={sec >= 18.5 && sec <= 25.4}
              frame={frame}
            />

            {/* Mercy Thought Bubble in Shot 4 */}
            {sec >= 14.5 && sec < 18.2 && (
              <g transform="translate(0 755)">
                <rect x="-260" y="-75" width="520" height="140" rx="50" fill="#12211B" stroke={EMERALD} strokeWidth="6" />
                <text x="0" y="-18" textAnchor="middle" fill={EMERALD} fontSize="22" fontWeight="900">
                  🕊️ DIVINE PARDON RULE:
                </text>
                <text x="0" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontWeight="900">
                  “Rope Toot Gayi = Bhagwan Ki Maafi!”
                </text>
              </g>
            )}

            {/* Rebel Mocking Speech Bubble in Shot 6 */}
            {sec >= 21.8 && sec < 25.5 && (
              <g transform="translate(-20 745)">
                <rect x="-285" y="-75" width="570" height="145" rx="26" fill="#141829" stroke={CYAN} strokeWidth="6" />
                <text x="0" y="-18" textAnchor="middle" fill={CYAN} fontSize="22" fontWeight="900">
                  🤬 OVERSMART REBEL SHOUTED:
                </text>
                <text x="0" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="29" fontWeight="900">
                  “Russia mein dhang ki ROPE bhi nahi banti!”
                </text>
              </g>
            )}
          </g>

          {/* 5. FOREGROUND PACKED CROWD OF 42 SPECTATORS! */}
          <g>
            {crowdMembers.map((person, idx) => {
              // Crowd jumps & raises arms when rope snaps (10.0s - 14.5s)
              const isShocked = sec >= 10.1 && sec <= 14.5;
              const jumpY = isShocked ? Math.abs(Math.sin(frame * 0.35 + idx)) * -22 : 0;

              return (
                <g
                  key={idx}
                  transform={`translate(${person.x} ${person.y + jumpY}) scale(${person.scale})`}
                >
                  {/* Shoulders & Coat */}
                  <path
                    d="M-36 85 C-36 25 -20 5 0 5 C20 5 36 25 36 85 Z"
                    fill={person.color}
                    stroke="#0D121C"
                    strokeWidth="3"
                  />
                  {/* Head */}
                  <circle cx="0" cy="-18" r="20" fill="#2A3346" />
                  {/* Russian Winter Ushanka / Fur Hat */}
                  {person.hatType === 0 && (
                    <rect x="-22" y="-42" width="44" height="20" rx="6" fill="#3D2E24" />
                  )}
                  {/* Raised Arms when shocked */}
                  {isShocked && idx % 3 === 0 && (
                    <line x1="24" y1="25" x2="42" y2="-35" stroke={person.color} strokeWidth="10" strokeLinecap="round" />
                  )}
                  {/* Crowd Gasp Icons in Shot 3 */}
                  {sec >= 11.4 && sec < 14.2 && idx % 7 === 0 && (
                    <g transform="translate(0 -75)">
                      <rect x="-28" y="-24" width="56" height="38" rx="12" fill={GOLD} />
                      <text y="2" textAnchor="middle" fill="#141008" fontSize="22" fontWeight="900">
                        😱!
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* ===================================================================
          CAMERA SHOT HUD & IMPACT HEADLINE FOR CURRENT 2.5s ANGLE
         =================================================================== */}
      <div
        style={{
          position: "absolute",
          top: 75,
          left: 50,
          right: 50,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 24px",
            borderRadius: 100,
            background: "rgba(8, 12, 22, 0.88)",
            border: `2px solid ${activeShot.accent}`,
            color: activeShot.accent,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 3.5,
            marginBottom: 14,
          }}
        >
          {activeShot.shotLabel}
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: GOLD_LIGHT,
            letterSpacing: 3,
            textShadow: "0 6px 20px rgba(0,0,0,0.95)",
          }}
        >
          {activeShot.headlineTop}
        </div>

        <div
          style={{
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: 68,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#FFFFFF",
            marginTop: 6,
            textShadow: `0 0 40px ${activeShot.accent}99, 0 12px 30px rgba(0,0,0,0.95)`,
          }}
        >
          <span style={{ color: activeShot.accent }}>{activeShot.headlineMain}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   06. FINALE SCENES (39.0s - 57.5s): 48 LAWS BOOK, LAW #04, LOCK & CTA
   ========================================================================= */

const FinaleMultiAngleStage: React.FC<{ sec: number; frame: number }> = ({
  sec,
  frame,
}) => {
  const { fps } = useVideoConfig();

  // 6 Rapid Angles for the Finale (every ~3 seconds):
  // 11 (39.0s - 41.8s): Robert Greene's 48 Laws 3D Book
  // 12 (41.8s - 44.5s): Law #04 Golden Crest ("Always Say Less Than Necessary")
  // 13 (44.5s - 47.2s): Danger Meter of Over-Talking
  // 14 (47.2s - 50.0s): Golden Padlock Slamming on Lips
  // 15 (50.0s - 53.5s): Non-Stop Blabbering Friend
  // 16 (53.5s - 57.5s): Interactive YouTube Comment Box CTA
  const subScene =
    sec < 41.8
      ? 11
      : sec < 44.5
        ? 12
        : sec < 47.2
          ? 13
          : sec < 50.0
            ? 14
            : sec < 53.5
              ? 15
              : 16;

  const subStartSec =
    subScene === 11
      ? 39.0
      : subScene === 12
        ? 41.8
        : subScene === 13
          ? 44.5
          : subScene === 14
            ? 47.2
            : subScene === 15
              ? 50.0
              : 53.5;

  const pop = spring({
    frame: Math.max(0, frame - Math.round(subStartSec * FPS)),
    fps,
    config: { damping: 11, stiffness: 180 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 48%, #22162B 0%, #0B0A14 62%, #050509 100%)",
        overflow: "hidden",
      }}
    >
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <g transform={`translate(540 960) scale(${0.85 + pop * 0.15})`}>
          {/* Rotating Background Ring */}
          <circle
            r="370"
            fill="none"
            stroke={GOLD}
            strokeWidth="2.5"
            strokeDasharray="14 14"
            opacity="0.35"
            transform={`rotate(${frame * 0.5})`}
          />

          {/* ANGLE 11: 48 LAWS OF POWER BOOK */}
          {subScene === 11 && (
            <g>
              <rect x="-220" y="-280" width="440" height="560" rx="24" fill="#5E1122" stroke={GOLD} strokeWidth="10" />
              <rect x="-185" y="-245" width="370" height="490" rx="14" fill="none" stroke={GOLD_LIGHT} strokeWidth="3" />
              <text y="-135" textAnchor="middle" fill={GOLD_LIGHT} fontSize="28" fontWeight="900" letterSpacing="6">
                ROBERT GREENE
              </text>
              <text y="-40" textAnchor="middle" fill="#FFFFFF" fontSize="68" fontWeight="900">
                48 LAWS
              </text>
              <text y="35" textAnchor="middle" fill={GOLD} fontSize="56" fontWeight="900">
                OF POWER
              </text>
              <circle cy="150" r="54" fill="#171014" stroke={GOLD} strokeWidth="5" />
              <text y="168" textAnchor="middle" fill={GOLD} fontSize="46" fontWeight="900">
                📖
              </text>
            </g>
          )}

          {/* ANGLE 12: LAW NUMBER 04 CREST */}
          {subScene === 12 && (
            <g>
              <polygon
                points="0,-310 270,-155 270,155 0,310 -270,155 -270,-155"
                fill="#17120A"
                stroke={GOLD}
                strokeWidth="12"
              />
              <text y="-110" textAnchor="middle" fill={GOLD_LIGHT} fontSize="36" fontWeight="900" letterSpacing="6">
                LAW NUMBER
              </text>
              <text y="45" textAnchor="middle" fill={GOLD} fontSize="175" fontWeight="900">
                #04
              </text>
              <text y="145" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="900">
                “ALWAYS SAY LESS
              </text>
              <text y="190" textAnchor="middle" fill={EMERALD} fontSize="34" fontWeight="900">
                THAN NECESSARY”
              </text>
            </g>
          )}

          {/* ANGLE 13: OVER-TALKING DANGER METER */}
          {subScene === 13 && (
            <g>
              <polygon points="0,-240 240,180 -240,180" fill="#2B090E" stroke={CRIMSON} strokeWidth="12" />
              <text y="95" textAnchor="middle" fill="#FFFFFF" fontSize="155" fontWeight="900">
                !
              </text>
              <rect x="-310" y="230" width="620" height="85" rx="20" fill="#1C090D" stroke={CRIMSON} strokeWidth="4" />
              <text y="284" textAnchor="middle" fill={CRIMSON} fontSize="36" fontWeight="900">
                ZYADA BOLNA = 100% KHATRA 🚨
              </text>
            </g>
          )}

          {/* ANGLE 14: GOLDEN PADLOCK ON MOUTH */}
          {subScene === 14 && (
            <g>
              <path
                d="M-110 -50 V-150 A110 110 0 0 1 110 -150 V-50"
                fill="none"
                stroke={GOLD}
                strokeWidth="36"
                strokeLinecap="round"
              />
              <rect x="-180" y="-55" width="360" height="280" rx="42" fill="#12241D" stroke={EMERALD} strokeWidth="12" />
              <circle cx="0" cy="70" r="36" fill={GOLD} />
              <text y="295" textAnchor="middle" fill={EMERALD} fontSize="42" fontWeight="900">
                APNI ZUBAAN PAR CONTROL! 🔒
              </text>
            </g>
          )}

          {/* ANGLE 15: NON-STOP BLABBERING FRIEND */}
          {subScene === 15 && (
            <g>
              <circle r="210" fill="#1F132E" stroke={PURPLE} strokeWidth="9" />
              <text y="45" textAnchor="middle" fontSize="175">
                🤡
              </text>
              <rect x="-330" y="-260" width="280" height="75" rx="20" fill="#2B1638" stroke={CYAN} strokeWidth="4" />
              <text x="-190" y="-212" textAnchor="middle" fill={CYAN} fontSize="28" fontWeight="900">
                “Bina soche bolna!”
              </text>
              <rect x="50" y="-260" width="280" height="75" rx="20" fill="#381622" stroke={CRIMSON} strokeWidth="4" />
              <text x="190" y="-212" textAnchor="middle" fill={CRIMSON} fontSize="28" fontWeight="900">
                “24x7 Bak-Bak!”
              </text>
            </g>
          )}

          {/* ANGLE 16: CENTER COMMENT BOX CTA */}
          {subScene === 16 && (
            <g>
              <rect x="-390" y="-200" width="780" height="400" rx="38" fill="#15141D" stroke={GOLD} strokeWidth="10" />
              <text y="-95" textAnchor="middle" fill={GOLD_LIGHT} fontSize="34" fontWeight="900" letterSpacing="3">
                💬 COMMENT MEIN USKA NAAM BATAO:
              </text>
              <rect x="-320" y="-25" width="640" height="115" rx="24" fill="#09090D" stroke={EMERALD} strokeWidth="5" />
              <text x="0" y="46" textAnchor="middle" fill="#FFFFFF" fontSize="42" fontWeight="900">
                @tag_your_talkative_friend 😂👇
              </text>
            </g>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* =========================================================================
   07. MASTER COMPOSITION & TIMELINE ORCHESTRATOR
   ========================================================================= */

const DirectorStoryReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060A", overflow: "hidden" }}>
      {/* STAGE 1 (0.0s - 4.2s): CENTER HOOK STAGE */}
      {sec < 4.2 && <CenterHookStage sec={sec} frame={frame} />}

      {/* STAGE 2 (4.2s - 7.8s): EURASIA MAP WITH GREEN RUSSIA HIGHLIGHT */}
      {sec >= 4.2 && sec < 7.8 && <RussiaMapScene sec={sec} frame={frame} />}

      {/* STAGE 3 (7.8s - 39.0s): DETAILED COURTYARD WITH 2.5s CAMERA ANGLE CUTS */}
      {sec >= 7.8 && sec < 39.0 && (
        <DetailedCourtyardMultiCam sec={sec} frame={frame} />
      )}

      {/* STAGE 4 (39.0s - 57.5s): FINALE MULTI-ANGLE STAGE */}
      {sec >= 39.0 && <FinaleMultiAngleStage sec={sec} frame={frame} />}

      {/* ===================================================================
          PRECISION PROCEDURAL SFX TIMELINE
         =================================================================== */}
      {/* Hook Slams */}
      <Sequence from={2} durationInFrames={30} layout="none">
        <Audio src={SFX.hookSlam} volume={0.8} />
      </Sequence>
      <Sequence from={Math.round(2.1 * FPS)} durationInFrames={30} layout="none">
        <Audio src={SFX.hookSlam} volume={0.85} />
      </Sequence>

      {/* Russia Map Green Highlight Radar Ping (4.2s & 4.8s) */}
      <Sequence from={Math.round(4.2 * FPS)} durationInFrames={40} layout="none">
        <Audio src={SFX.mapRadar} volume={0.8} />
      </Sequence>

      {/* Camera Angle Cut Whooshes inside Courtyard */}
      {COURTYARD_CAMERA_CUTS.map((shot) => (
        <Sequence
          key={`whoosh-${shot.shotId}`}
          from={Math.round(shot.startSec * FPS)}
          durationInFrames={20}
          layout="none"
        >
          <Audio src={SFX.cutWhoosh} volume={0.45} />
        </Sequence>
      ))}

      {/* Rope Snap (10.0s) + Body Thud (10.75s) + Crowd Gasp (11.4s) */}
      <Sequence from={Math.round(10.0 * FPS)} durationInFrames={25} layout="none">
        <Audio src={SFX.ropeSnap} volume={0.9} />
      </Sequence>
      <Sequence from={Math.round(10.75 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.bodyThud} volume={0.85} />
      </Sequence>
      <Sequence from={Math.round(11.4 * FPS)} durationInFrames={45} layout="none">
        <Audio src={SFX.crowdGasp} volume={0.75} />
      </Sequence>

      {/* Divine Mercy Chime (14.5s) */}
      <Sequence from={Math.round(14.5 * FPS)} durationInFrames={55} layout="none">
        <Audio src={SFX.divineChime} volume={0.75} />
      </Sequence>

      {/* Rebel Mocking Bubble Pop (21.8s) */}
      <Sequence from={Math.round(21.8 * FPS)} durationInFrames={20} layout="none">
        <Audio src={SFX.bubblePop} volume={0.8} />
      </Sequence>

      {/* Tsar Anger Rumble (25.5s) + Paper Rip (29.3s) */}
      <Sequence from={Math.round(25.5 * FPS)} durationInFrames={40} layout="none">
        <Audio src={SFX.angerBass} volume={0.85} />
      </Sequence>
      <Sequence from={Math.round(29.3 * FPS)} durationInFrames={40} layout="none">
        <Audio src={SFX.paperRip} volume={0.9} />
      </Sequence>

      {/* New Heavy Rope Clank (36.0s) */}
      <Sequence from={Math.round(36.0 * FPS)} durationInFrames={35} layout="none">
        <Audio src={SFX.chainDrop} volume={0.8} />
      </Sequence>

      {/* Mouth Lock Slam (47.2s) */}
      <Sequence from={Math.round(47.2 * FPS)} durationInFrames={25} layout="none">
        <Audio src={SFX.lockSlam} volume={0.85} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={DirectorStoryReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
