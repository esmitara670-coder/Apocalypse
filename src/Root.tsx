import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  registerRoot,
} from "remotion";

// ============================================================================
// 0. NATIVE MATH HELPERS & PURE JS BASE64 (ZERO EXTERNAL PACKAGE DEPENDENCIES)
// ============================================================================
const clamp = (min: number, max: number, v: number) =>
  Math.max(min, Math.min(max, v));

const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

const mapRange = (
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  v: number
) => outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

const uint8ToBase64 = (bytes: Uint8Array): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += chars[(triplet >> 18) & 0x3f];
    result += chars[(triplet >> 12) & 0x3f];
    result += i + 1 < len ? chars[(triplet >> 6) & 0x3f] : "=";
    result += i + 2 < len ? chars[triplet & 0x3f] : "=";
  }
  return result;
};

// ============================================================================
// 1. PROCEDURAL 44.1kHz PCM WAV SOUND EFFECTS SYNTHESIZER (NO EXTERNAL FILES)
// ============================================================================
type SfxType =
  | "subImpact"
  | "glassShatter"
  | "uiTick"
  | "neuralPulse"
  | "decoyBuzzer"
  | "targetChime"
  | "laserScan"
  | "flameSizzle"
  | "cinematicRiser";

const createProceduralWav = (type: SfxType, durationSec: number): string => {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  view.setUint32(0, 1179011410, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 1163280727, false); // "WAVE"
  view.setUint32(12, 544501094, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 1635017060, false); // "data"
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    let sample = 0;

    if (type === "subImpact") {
      const freq = 110 * Math.exp(-t * 6.5) + 30;
      const env = Math.exp(-t * 3.8);
      sample =
        (Math.sin(2 * Math.PI * freq * t) * 0.85 +
          Math.sin(4 * Math.PI * freq * t) * 0.15) *
        env;
    } else if (type === "glassShatter") {
      const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const chime1 = Math.sin(2 * Math.PI * 2450 * t);
      const chime2 = Math.sin(2 * Math.PI * 3820 * t);
      const env = Math.exp(-t * 9.0);
      sample = (noise * 0.45 + chime1 * 0.3 + chime2 * 0.25) * env;
    } else if (type === "uiTick") {
      const freq = 1800 * Math.exp(-t * 45);
      const env = Math.exp(-t * 65);
      sample = Math.sin(2 * Math.PI * freq * t) * env * 0.6;
    } else if (type === "neuralPulse") {
      const env = Math.sin(Math.PI * progress) * Math.exp(-t * 4.5);
      sample =
        Math.sin(2 * Math.PI * (420 + Math.sin(t * 30) * 40) * t) * env * 0.55;
    } else if (type === "decoyBuzzer") {
      const env = Math.exp(-t * 5.0);
      sample =
        (Math.sin(2 * Math.PI * 145 * t) +
          0.5 * Math.sin(2 * Math.PI * 290 * t)) *
        0.5 *
        env;
    } else if (type === "targetChime") {
      const env = Math.exp(-t * 4.2);
      sample =
        (Math.sin(2 * Math.PI * 1046.5 * t) +
          Math.sin(2 * Math.PI * 1318.5 * t) +
          Math.sin(2 * Math.PI * 1567.98 * t)) *
        0.28 *
        env;
    } else if (type === "laserScan") {
      const freq = 320 + Math.sin(t * 18) * 220 + progress * 600;
      const env = Math.sin(Math.PI * progress) * 0.45;
      sample = Math.sin(2 * Math.PI * freq * t) * env;
    } else if (type === "flameSizzle") {
      const pseudoNoise = ((Math.sin(i * 78.233) * 43758.5453) % 1) * 0.35;
      const warmPad = Math.sin(2 * Math.PI * 220 * t) * 0.3;
      const env = Math.sin(Math.PI * progress);
      sample = (pseudoNoise + warmPad) * env * 0.5;
    } else if (type === "cinematicRiser") {
      const freq = 80 + Math.pow(progress, 2.4) * 950;
      const env = Math.pow(progress, 1.5) * 0.75;
      sample = Math.sin(2 * Math.PI * freq * t) * env;
    }

    const clamped = clamp(-1, 1, sample);
    view.setInt16(44 + i * 2, clamped * 32767, true);
  }

  return `data:audio/wav;base64,${uint8ToBase64(new Uint8Array(buffer))}`;
};

// ============================================================================
// 2. COLOR PALETTE & CINEMA VOLUMETRIC BACKDROP
// ============================================================================
const THEME = {
  bgObsidian: "#05060a",
  bgCharcoal: "#0c0f17",
  gold: "#f5b041",
  goldBright: "#ffd700",
  cyan: "#00f0ff",
  crimson: "#ff2a5f",
  emerald: "#00e676",
  ivory: "#fdfbf7",
  muted: "#8a99ad",
};

const CinemaBackdrop: React.FC<{
  primaryGlow: string;
  secondaryGlow?: string;
  localFrame: number;
}> = ({ primaryGlow, secondaryGlow = THEME.cyan, localFrame }) => {
  const pulse = 0.85 + Math.sin(localFrame * 0.06) * 0.15;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -200,
          background: `
            radial-gradient(circle at 50% 52%, ${primaryGlow}28 0%, transparent 55%),
            radial-gradient(circle at 20% 30%, ${secondaryGlow}18 0%, transparent 45%),
            radial-gradient(circle at 80% 75%, ${primaryGlow}14 0%, transparent 50%)
          `,
          opacity: pulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)",
          boxShadow: "inset 0 0 220px rgba(0,0,0,0.92)",
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// 3. SHARED DOCUMENTARY HUD, AUDIO WAVEFORM & WORD-BY-WORD KINETIC CAPTIONS
// ============================================================================
const DocumentaryHUD: React.FC<{
  chapterNum: string;
  chapterTitle: string;
  psychMetricLabel: string;
  psychMetricValue: string;
  accentColor?: string;
}> = ({
  chapterNum,
  chapterTitle,
  psychMetricLabel,
  psychMetricValue,
  accentColor = THEME.gold,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sec = (frame / fps).toFixed(2);
  const progress = (frame / durationInFrames) * 100;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${THEME.gold}, ${THEME.cyan})`,
            boxShadow: `0 0 20px ${THEME.gold}`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 48,
          left: 48,
          right: 48,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            background: "rgba(5, 6, 10, 0.86)",
            borderLeft: `4px solid ${accentColor}`,
            padding: "12px 22px",
            borderRadius: "0 12px 12px 0",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            borderRight: "1px solid rgba(255,255,255,0.12)",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: accentColor,
              letterSpacing: 3,
              fontWeight: 700,
            }}
          >
            PSYCHOLOGY FILE // {chapterNum}
          </div>
          <div
            style={{
              fontSize: 26,
              color: THEME.ivory,
              fontWeight: 800,
              marginTop: 4,
            }}
          >
            {chapterTitle}
          </div>
        </div>

        <div
          style={{
            background: "rgba(5, 6, 10, 0.86)",
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "12px 22px",
            borderRadius: 12,
            textAlign: "right",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ fontSize: 16, color: THEME.muted, letterSpacing: 2 }}>
            {psychMetricLabel}
          </div>
          <div
            style={{
              fontSize: 26,
              color: accentColor,
              fontWeight: 800,
              marginTop: 2,
            }}
          >
            {psychMetricValue}
          </div>
          <div style={{ fontSize: 14, color: THEME.cyan, marginTop: 4 }}>
            TC: 00:{sec.padStart(5, "0")}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 48,
          bottom: 340,
          display: "flex",
          alignItems: "flex-end",
          gap: 5,
          height: 60,
        }}
      >
        {Array.from({ length: 14 }).map((_, i) => {
          const barH =
            12 +
            Math.abs(
              Math.sin(frame * 0.28 + i * 0.7) * Math.cos(frame * 0.15 - i)
            ) *
              46;
          return (
            <div
              key={i}
              style={{
                width: 5,
                height: barH,
                borderRadius: 3,
                backgroundColor: i % 2 === 0 ? accentColor : THEME.cyan,
                opacity: 0.8,
                boxShadow: `0 0 8px ${i % 2 === 0 ? accentColor : THEME.cyan}`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const HinglishSpeakerCaption: React.FC<{
  lines: string;
  highlightWords: string[];
  localFrame: number;
  duration: number;
}> = ({ lines, highlightWords, localFrame, duration }) => {
  const words = useMemo(() => lines.split(" "), [lines]);
  const currentWordIdx = Math.floor(
    mapRange(8, duration - 22, 0, words.length, localFrame)
  );
  const panelOpacity = interpolate(
    localFrame,
    [0, 10, duration - 10, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 72,
        left: 48,
        right: 48,
        opacity: panelOpacity,
        background:
          "linear-gradient(180deg, rgba(12, 15, 23, 0.9) 0%, rgba(5, 6, 10, 0.97) 100%)",
        border: "1px solid rgba(245, 176, 65, 0.45)",
        borderRadius: 24,
        padding: "26px 32px",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.85), 0 0 35px rgba(245, 176, 65, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 11px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 35,
          fontWeight: 800,
          lineHeight: 1.34,
          textAlign: "center",
        }}
      >
        {words.map((word, i) => {
          const clean = word.replace(/[^a-zA-Z0-9₹]/g, "").toLowerCase();
          const isKeyword = highlightWords.some(
            (kw) => kw.toLowerCase() === clean || word.includes("₹")
          );
          const isActive = i === currentWordIdx;
          const isRevealed = i <= currentWordIdx;

          return (
            <span
              key={i}
              style={{
                color: isActive
                  ? THEME.cyan
                  : isKeyword && isRevealed
                  ? THEME.goldBright
                  : isRevealed
                  ? THEME.ivory
                  : "rgba(255,255,255,0.28)",
                transform: isActive
                  ? "scale(1.08) translateY(-2px)"
                  : "scale(1)",
                textShadow: isActive
                  ? `0 0 22px ${THEME.cyan}`
                  : isKeyword && isRevealed
                  ? `0 0 16px rgba(245,176,65,0.6)`
                  : "none",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 1: THE HOOK — MISSING ₹ SYMBOL (0–7s | 210 Frames)
// ============================================================================
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shatterStart = 65;
  const isShattered = frame >= shatterStart;
  const postShatter = Math.max(0, frame - shatterStart);

  const cardPush = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 65 },
  });

  const shards = useMemo(() => {
    return Array.from({ length: 85 }).map((_, i) => {
      const angle = (i / 85) * Math.PI * 2;
      const speed = 7 + (i % 7) * 3.2;
      const elevation = ((i * 17) % 100) / 50 - 1;
      return {
        vx: Math.cos(angle) * speed,
        vy: elevation * 9 - 2,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (4 + (i % 5) * 3),
        size: 12 + (i % 4) * 6,
        baseX: ((i % 9) - 4) * 18,
        baseY: (Math.floor(i / 9) - 4.5) * 22,
        color: i % 2 === 0 ? THEME.goldBright : THEME.cyan,
      };
    });
  }, []);

  const tiltY = Math.sin(frame * 0.03) * 10;
  const tiltX = 6 - cardPush * 4;
  const shockwaveScale = interpolate(postShatter, [0, 50], [0.2, 3.8], {
    extrapolateRight: "clamp",
  });
  const shockwaveOpacity = interpolate(postShatter, [0, 10, 50], [0, 0.95, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgObsidian }}>
      <CinemaBackdrop
        primaryGlow={isShattered ? THEME.emerald : THEME.crimson}
        secondaryGlow={THEME.gold}
        localFrame={frame}
      />

      {/* Top Live Price Comparison Cards */}
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 56,
          right: 56,
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "24px 28px",
            borderRadius: 20,
            background: "rgba(255, 42, 95, 0.14)",
            border: `2px solid ${
              isShattered ? "rgba(255,42,95,0.3)" : THEME.crimson
            }`,
            opacity: isShattered ? 0.45 : 1,
            transform: isShattered ? "scale(0.95)" : "scale(1.03)",
            boxShadow: !isShattered ? `0 0 35px rgba(255,42,95,0.35)` : "none",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: "monospace",
              color: THEME.crimson,
              fontWeight: 700,
            }}
          >
            AMATEUR MENU (PAIN TRIGGER)
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: THEME.ivory,
              marginTop: 8,
            }}
          >
            <span
              style={{
                color: THEME.crimson,
                textDecoration: isShattered ? "line-through" : "none",
              }}
            >
              ₹
            </span>
            650.00
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "24px 28px",
            borderRadius: 20,
            background: isShattered
              ? "rgba(0, 230, 118, 0.16)"
              : "rgba(255,255,255,0.04)",
            border: `2px solid ${
              isShattered ? THEME.emerald : "rgba(255,255,255,0.15)"
            }`,
            boxShadow: isShattered
              ? "0 0 45px rgba(0, 230, 118, 0.4)"
              : "none",
            transform: isShattered ? "scale(1.05)" : "scale(0.95)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: "monospace",
              color: THEME.emerald,
              fontWeight: 700,
            }}
          >
            5-STAR LUXURY MENU (TRICK)
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: THEME.ivory,
              marginTop: 8,
            }}
          >
            650
          </div>
        </div>
      </div>

      {/* 3D Perspective Luxury Menu Tablet & Shattering ₹ Construct */}
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 0,
          right: 0,
          height: 920,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          perspective: 1200,
        }}
      >
        <div
          style={{
            width: 560,
            height: 740,
            borderRadius: 32,
            background: "linear-gradient(145deg, #121724 0%, #070a12 100%)",
            border: `2px solid ${THEME.gold}`,
            boxShadow: `0 30px 90px rgba(0,0,0,0.9), 0 0 50px rgba(245, 176, 65, 0.22), inset 0 0 30px rgba(245, 176, 65, 0.12)`,
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${interpolate(
              cardPush,
              [0, 1],
              [0.86, 1]
            )})`,
            padding: 44,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div
            style={{
              textAlign: "center",
              borderBottom: "1px solid rgba(245,176,65,0.3)",
              paddingBottom: 20,
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 18,
                color: THEME.gold,
                letterSpacing: 6,
              }}
            >
              ★ LE GRAND BISTRO // FINE DINING ★
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 36,
              margin: "auto 0",
            }}
          >
            {[
              {
                name: "Truffle Wild Mushroom Risotto",
                price: "620",
                highlight: false,
              },
              {
                name: "Herb-Crusted Norwegian Salmon",
                price: "890",
                highlight: false,
              },
              {
                name: "Chef's Signature Artisanal Pasta",
                price: "650",
                highlight: true,
              },
              {
                name: "Valrhona Dark Chocolate Fondant",
                price: "480",
                highlight: false,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 22px",
                  borderRadius: 14,
                  background: item.highlight
                    ? "rgba(245, 176, 65, 0.12)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    item.highlight ? THEME.gold : "rgba(255,255,255,0.07)"
                  }`,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: item.highlight ? THEME.goldBright : THEME.ivory,
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 28,
                    fontWeight: 900,
                    color: THEME.cyan,
                    textShadow: `0 0 12px ${THEME.cyan}`,
                  }}
                >
                  {item.price}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              textAlign: "center",
              fontFamily: "monospace",
              fontSize: 15,
              color: THEME.muted,
              letterSpacing: 3,
            }}
          >
            ZERO CURRENCY SYMBOLS DETECTED
          </div>
        </div>

        {/* Pre-Shatter Giant Glowing 3D-Styled ₹ Symbol */}
        {!isShattered && (
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,42,95,0.35) 0%, transparent 70%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${1 + Math.sin(frame * 0.3) * 0.08})`,
              boxShadow: `0 0 80px ${THEME.crimson}`,
              border: `3px solid ${THEME.crimson}`,
            }}
          >
            <span
              style={{
                fontSize: 190,
                fontWeight: 900,
                color: THEME.ivory,
                textShadow: `0 0 35px ${THEME.crimson}, 0 0 70px ${THEME.crimson}`,
              }}
            >
              ₹
            </span>
          </div>
        )}

        {/* Post-Shatter Shockwave & 85 Exploding Crystal Shards */}
        {isShattered && (
          <svg
            width="1080"
            height="920"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            <circle
              cx="540"
              cy="460"
              r={110 * shockwaveScale}
              fill="none"
              stroke={THEME.cyan}
              strokeWidth="6"
              opacity={shockwaveOpacity}
            />
            {shards.map((s, idx) => {
              const x = 540 + s.baseX + s.vx * postShatter;
              const y =
                460 +
                s.baseY +
                s.vy * postShatter +
                0.18 * postShatter * postShatter;
              const rot = s.rotSpeed * postShatter;
              const op = interpolate(postShatter, [0, 110], [1, 0], {
                extrapolateRight: "clamp",
              });
              return (
                <g
                  key={idx}
                  transform={`translate(${x}, ${y}) rotate(${rot})`}
                  opacity={op}
                >
                  <polygon
                    points={`0,${-s.size} ${s.size * 0.8},0 0,${s.size} ${
                      -s.size * 0.8
                    },0`}
                    fill={s.color}
                    style={{ filter: `drop-shadow(0 0 10px ${s.color})` }}
                  />
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <DocumentaryHUD
        chapterNum="01 / HOOK"
        chapterTitle="THE MISSING ₹ SYMBOL MYSTERY"
        psychMetricLabel="GUILT TRIGGER"
        psychMetricValue={isShattered ? "SUPPRESSED (-78%)" : "ACTIVE (HIGH)"}
        accentColor={isShattered ? THEME.emerald : THEME.crimson}
      />

      <HinglishSpeakerCaption
        lines="Kya aapne kabhi notice kiya hai ki bade restaurants ke menu card par price ke aage ₹ ka sign kyu nahi hota? Yeh koi printing mistake nahi, balki aapke subconscious mind ko guilt-free rakhne ki ek calculated psychological trick hai!"
        highlightWords={[
          "notice",
          "restaurants",
          "₹",
          "mistake",
          "subconscious",
          "psychological",
          "trick",
        ]}
        localFrame={frame}
        duration={210}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 2: CURRENCY SYMBOL REMOVAL — 3D PROJECTED BRAIN (7–15s | 240 Frames)
// ============================================================================
const Scene2PainOfPaying: React.FC = () => {
  const frame = useCurrentFrame();
  const painLevel = Math.round(
    mapRange(0, 1, 94, 16, clamp(0, 1, (frame - 80) / 55))
  );
  const isCalm = frame >= 105;
  const activeColor = isCalm ? THEME.cyan : THEME.crimson;

  const nodes3D = useMemo(() => {
    return Array.from({ length: 52 }).map((_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 52);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return {
        x: Math.sin(phi) * Math.cos(theta) * 290,
        y: Math.cos(phi) * 240,
        z: Math.sin(phi) * Math.sin(theta) * 260,
      };
    });
  }, []);

  const rotAngle = frame * 0.022;
  const projectedNodes = nodes3D.map((n, idx) => {
    const rx = n.x * Math.cos(rotAngle) - n.z * Math.sin(rotAngle);
    const rz = n.x * Math.sin(rotAngle) + n.z * Math.cos(rotAngle);
    const scale = 700 / (700 + rz);
    return {
      id: idx,
      px: 540 + rx * scale,
      py: 980 + n.y * scale,
      scale,
      rz,
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgObsidian }}>
      <CinemaBackdrop
        primaryGlow={activeColor}
        secondaryGlow={isCalm ? THEME.emerald : THEME.gold}
        localFrame={frame}
      />

      {/* Top Neural Telemetry Dashboard */}
      <div
        style={{
          position: "absolute",
          top: 225,
          left: 56,
          right: 56,
          padding: "28px 34px",
          borderRadius: 22,
          background: "rgba(12, 15, 23, 0.92)",
          border: `2px solid ${activeColor}`,
          boxShadow: `0 0 45px ${activeColor}33`,
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 20, color: THEME.muted }}>
              INSULAR CORTEX // &quot;PAIN OF PAYING&quot; INDEX
            </div>
            <div
              style={{
                fontSize: 33,
                fontWeight: 800,
                color: isCalm ? THEME.emerald : THEME.crimson,
                marginTop: 6,
              }}
            >
              {isCalm
                ? "PLAIN NUMBER: '650' (NO PAIN)"
                : "SYMBOL DETECTED: '₹650' (PAIN SPIKE)"}
            </div>
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: activeColor,
              textShadow: `0 0 20px ${activeColor}`,
            }}
          >
            {painLevel}%
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            height: 18,
            borderRadius: 9,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${painLevel}%`,
              height: "100%",
              background: isCalm
                ? `linear-gradient(90deg, ${THEME.emerald}, ${THEME.cyan})`
                : THEME.crimson,
              boxShadow: `0 0 20px ${activeColor}`,
            }}
          />
        </div>
      </div>

      {/* 3D Rotating Neural Hemisphere SVG */}
      <svg
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <circle
          cx="540"
          cy="980"
          r="330"
          fill="none"
          stroke={activeColor}
          strokeWidth="2"
          strokeDasharray="16 12"
          opacity="0.45"
          transform={`rotate(${frame * 0.4} 540 980)`}
        />
        <circle
          cx="540"
          cy="980"
          r="375"
          fill="none"
          stroke={isCalm ? THEME.emerald : THEME.crimson}
          strokeWidth="1.5"
          strokeDasharray="8 18"
          opacity="0.3"
          transform={`rotate(${-frame * 0.3} 540 980)`}
        />

        {projectedNodes.map((a, i) =>
          projectedNodes.slice(i + 1, i + 5).map((b, j) => {
            const dist = Math.hypot(a.px - b.px, a.py - b.py);
            if (dist > 175) return null;
            return (
              <line
                key={`${i}-${j}`}
                x1={a.px}
                y1={a.py}
                x2={b.px}
                y2={b.py}
                stroke={activeColor}
                strokeWidth={1.8 * a.scale}
                opacity={(1 - dist / 175) * 0.65}
              />
            );
          })
        )}

        {projectedNodes.map((n) => {
          const pulse = 1 + Math.sin(frame * 0.22 + n.id) * 0.3;
          const nodeColor = isCalm
            ? n.id % 2 === 0
              ? THEME.cyan
              : THEME.emerald
            : THEME.crimson;
          return (
            <circle
              key={n.id}
              cx={n.px}
              cy={n.py}
              r={8 * n.scale * pulse}
              fill={nodeColor}
              opacity={0.4 + 0.6 * n.scale}
              style={{ filter: `drop-shadow(0 0 12px ${nodeColor})` }}
            />
          );
        })}
      </svg>

      <DocumentaryHUD
        chapterNum="02 / NEUROSCIENCE"
        chapterTitle="THE PAIN OF PAYING EFFECT"
        psychMetricLabel="SPENDING FRICTION"
        psychMetricValue={`${painLevel}% CORTEX LOAD`}
        accentColor={activeColor}
      />

      <HinglishSpeakerCaption
        lines="Research se pata chalta hai ki jab number ke aage currency sign nahi hota, toh brain use seedha paise kharch hone ke dard se connect nahi karta, aur log freely order karte hain."
        highlightWords={[
          "Research",
          "currency",
          "brain",
          "dard",
          "freely",
          "order",
        ]}
        localFrame={frame}
        duration={240}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 3: THE DECOY EFFECT / ANCHOR PRICE (15–24s | 270 Frames)
// ============================================================================
const Scene3DecoyEffect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anchorHeight = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const targetLocked = frame >= 95;
  const targetPop = spring({
    frame: Math.max(0, frame - 95),
    fps,
    config: { damping: 12, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgObsidian }}>
      <CinemaBackdrop
        primaryGlow={targetLocked ? THEME.emerald : THEME.crimson}
        secondaryGlow={THEME.gold}
        localFrame={frame}
      />

      {/* Top Comparison Cards */}
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 48,
          right: 48,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            background: "rgba(31, 9, 19, 0.9)",
            border: `2px solid ${THEME.crimson}`,
            borderRadius: 22,
            padding: 28,
            opacity: targetLocked ? 0.58 : 1,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: THEME.crimson,
              fontWeight: 700,
            }}
          >
            THE DECOY ANCHOR
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: THEME.ivory,
              marginTop: 8,
            }}
          >
            Royal Truffle Platter
          </div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: THEME.crimson,
              marginTop: 12,
            }}
          >
            1800
          </div>
          <div style={{ fontSize: 18, color: THEME.muted, marginTop: 8 }}>
            Purpose: Shock your price reference
          </div>
        </div>

        <div
          style={{
            background: "rgba(7, 38, 25, 0.94)",
            border: `3px solid ${targetLocked ? THEME.emerald : THEME.gold}`,
            borderRadius: 22,
            padding: 28,
            transform: targetLocked ? "scale(1.05)" : "scale(0.96)",
            boxShadow: targetLocked
              ? "0 0 45px rgba(0, 230, 118, 0.45)"
              : "none",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: THEME.emerald,
              fontWeight: 700,
            }}
          >
            {targetLocked ? "✓ BRAIN FEELS 'SENSIBLE'" : "HIGH-MARGIN TARGET"}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: THEME.ivory,
              marginTop: 8,
            }}
          >
            Chef&apos;s Signature Pasta
          </div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: THEME.emerald,
              marginTop: 12,
            }}
          >
            650
          </div>
          <div style={{ fontSize: 18, color: THEME.ivory, marginTop: 8 }}>
            Feels 64% cheaper next to 1800!
          </div>
        </div>
      </div>

      {/* 3D Perspective Monolith Pillars */}
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 90,
          right: 90,
          height: 760,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-end",
          paddingBottom: 60,
          borderBottom: "3px solid rgba(255,255,255,0.15)",
        }}
      >
        <div
          style={{
            width: 320,
            height: 620 * anchorHeight,
            borderRadius: "24px 24px 0 0",
            background:
              "linear-gradient(180deg, rgba(255,42,95,0.38) 0%, rgba(31,9,19,0.95) 100%)",
            border: `3px solid ${THEME.crimson}`,
            boxShadow: `0 0 50px rgba(255,42,95,${targetLocked ? 0.2 : 0.6})`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 32,
            opacity: targetLocked ? 0.55 : 1,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 20,
              color: THEME.crimson,
              letterSpacing: 3,
              fontWeight: 800,
            }}
          >
            ANCHOR TRAP
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              color: THEME.ivory,
              textShadow: `0 0 25px ${THEME.crimson}`,
            }}
          >
            1800
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: THEME.muted,
              textAlign: "center",
            }}
          >
            LOW SALES // HIGH PRICE SHOCK
          </div>
        </div>

        <div
          style={{
            width: 340,
            height: 360 * anchorHeight,
            borderRadius: "24px 24px 0 0",
            background: targetLocked
              ? "linear-gradient(180deg, rgba(0,230,118,0.42) 0%, rgba(7,38,25,0.96) 100%)"
              : "linear-gradient(180deg, rgba(245,176,65,0.25) 0%, rgba(20,24,36,0.95) 100%)",
            border: `3px solid ${targetLocked ? THEME.emerald : THEME.gold}`,
            boxShadow: targetLocked
              ? `0 0 70px rgba(0,230,118,0.65)`
              : "none",
            transform: `scale(${targetLocked ? 1 + targetPop * 0.06 : 1})`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 32,
            position: "relative",
          }}
        >
          {targetLocked && (
            <div
              style={{
                position: "absolute",
                top: -78,
                padding: "12px 26px",
                borderRadius: 999,
                background: THEME.emerald,
                color: "#04120b",
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 900,
                boxShadow: `0 0 30px ${THEME.emerald}`,
              }}
            >
              ★ SWEET SPOT LOCKED
            </div>
          )}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 20,
              color: targetLocked ? THEME.emerald : THEME.gold,
              letterSpacing: 2,
              fontWeight: 800,
            }}
          >
            PROFIT MAGNET
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              color: THEME.ivory,
              textShadow: `0 0 25px ${THEME.emerald}`,
            }}
          >
            650
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: THEME.ivory,
              textAlign: "center",
            }}
          >
            82% CUSTOMERS PICK THIS
          </div>
        </div>
      </div>

      <DocumentaryHUD
        chapterNum="03 / ANCHORING"
        chapterTitle="THE DECOY EFFECT (PRICE ANCHOR)"
        psychMetricLabel="PERCEIVED BARGAIN"
        psychMetricValue={
          targetLocked ? "+210% CONVERSION" : "SETTING ANCHOR..."
        }
        accentColor={targetLocked ? THEME.emerald : THEME.crimson}
      />

      <HinglishSpeakerCaption
        lines="Menu me ek bohot zyada mehngi dish add kar di jaati hai jaise 1800 ka platter, taaki uske neeche waali 650 ki dish aapko automatically sasti aur sensible lagne lage."
        highlightWords={[
          "mehngi",
          "1800",
          "650",
          "automatically",
          "sasti",
          "sensible",
        ]}
        localFrame={frame}
        duration={270}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 4: THE GOLDEN TRIANGLE RULE (24–33s | 270 Frames)
// ============================================================================
const Scene4GoldenTriangle: React.FC = () => {
  const frame = useCurrentFrame();
  const step = frame < 80 ? 1 : frame < 150 ? 2 : 3;

  const p = clamp(0, 1, frame / 210);
  let reticleX = 540;
  let reticleY = 1020;
  if (p < 0.35) {
    reticleX = 540;
    reticleY = 1020;
  } else if (p < 0.7) {
    const t = mapRange(0.35, 0.7, 0, 1, p);
    reticleX = lerp(540, 770, t);
    reticleY = lerp(1020, 690, t);
  } else {
    const t = mapRange(0.7, 1, 0, 1, p);
    reticleX = lerp(770, 310, t);
    reticleY = 690;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgObsidian }}>
      <CinemaBackdrop
        primaryGlow={THEME.goldBright}
        secondaryGlow={THEME.cyan}
        localFrame={frame}
      />

      <div
        style={{
          position: "absolute",
          top: 225,
          left: 56,
          right: 56,
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          fontFamily: "monospace",
        }}
      >
        {[
          { id: 1, title: "1. CENTER STAGE", desc: "First Eye Fixation" },
          { id: 2, title: "2. TOP-RIGHT", desc: "Highest Margin Dish" },
          { id: 3, title: "3. TOP-LEFT", desc: "Best-Seller Anchor" },
        ].map((item) => {
          const active = step >= item.id;
          return (
            <div
              key={item.id}
              style={{
                flex: 1,
                padding: "18px 20px",
                borderRadius: 16,
                background: active
                  ? "rgba(245, 176, 65, 0.18)"
                  : "rgba(12,15,23,0.85)",
                border: `2px solid ${
                  active ? THEME.goldBright : "rgba(255,255,255,0.12)"
                }`,
                boxShadow: active ? `0 0 25px rgba(245,176,65,0.3)` : "none",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: active ? THEME.goldBright : THEME.muted,
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 16, color: THEME.ivory, marginTop: 4 }}>
                {item.desc}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          top: 460,
          left: 140,
          right: 140,
          height: 920,
          borderRadius: 28,
          background:
            "linear-gradient(180deg, rgba(14,20,34,0.92) 0%, rgba(7,10,18,0.96) 100%)",
          border: `2px solid ${THEME.gold}`,
          boxShadow: "0 25px 80px rgba(0,0,0,0.85)",
        }}
      />

      <svg
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {step >= 2 && (
          <line
            x1="540"
            y1="1020"
            x2="770"
            y2="690"
            stroke={THEME.goldBright}
            strokeWidth="6"
            strokeDasharray="14 10"
            style={{ filter: `drop-shadow(0 0 12px ${THEME.goldBright})` }}
          />
        )}
        {step >= 3 && (
          <>
            <line
              x1="770"
              y1="690"
              x2="310"
              y2="690"
              stroke={THEME.goldBright}
              strokeWidth="6"
              strokeDasharray="14 10"
              style={{ filter: `drop-shadow(0 0 12px ${THEME.goldBright})` }}
            />
            <line
              x1="310"
              y1="690"
              x2="540"
              y2="1020"
              stroke={THEME.goldBright}
              strokeWidth="6"
              strokeDasharray="14 10"
              style={{ filter: `drop-shadow(0 0 12px ${THEME.goldBright})` }}
            />
          </>
        )}

        {[
          { cx: 540, cy: 1020, label: "1. CENTER FIXATION", minStep: 1 },
          { cx: 770, cy: 690, label: "2. HIGHEST PROFIT", minStep: 2 },
          { cx: 310, cy: 690, label: "3. SIGNATURE ANCHOR", minStep: 3 },
        ].map((node, idx) => {
          const active = step >= node.minStep;
          return (
            <g key={idx}>
              <circle
                cx={node.cx}
                cy={node.cy}
                r={active ? 54 : 36}
                fill={
                  active ? "rgba(255, 215, 0, 0.18)" : "rgba(255,255,255,0.04)"
                }
                stroke={active ? THEME.goldBright : "#475569"}
                strokeWidth="4"
                style={{
                  filter: active
                    ? `drop-shadow(0 0 20px ${THEME.goldBright})`
                    : "none",
                }}
              />
              <circle
                cx={node.cx}
                cy={node.cy}
                r="14"
                fill={active ? THEME.goldBright : "#475569"}
              />
              <text
                x={node.cx}
                y={node.cy + 85}
                textAnchor="middle"
                fill={active ? THEME.goldBright : THEME.muted}
                fontFamily="monospace"
                fontSize="20"
                fontWeight="800"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        <g
          transform={`translate(${reticleX}, ${reticleY}) rotate(${frame * 4})`}
        >
          <circle
            r="72"
            fill="none"
            stroke={THEME.cyan}
            strokeWidth="3"
            strokeDasharray="22 14"
          />
          <circle r="44" fill="none" stroke={THEME.cyan} strokeWidth="2" />
          <line
            x1="-85"
            y1="0"
            x2="-52"
            y2="0"
            stroke={THEME.cyan}
            strokeWidth="3"
          />
          <line
            x1="52"
            y1="0"
            x2="85"
            y2="0"
            stroke={THEME.cyan}
            strokeWidth="3"
          />
          <line
            x1="0"
            y1="-85"
            x2="0"
            y2="-52"
            stroke={THEME.cyan}
            strokeWidth="3"
          />
          <line
            x1="0"
            y1="52"
            x2="0"
            y2="85"
            stroke={THEME.cyan}
            strokeWidth="3"
          />
        </g>
      </svg>

      <DocumentaryHUD
        chapterNum="04 / EYE TRACKING"
        chapterTitle="THE GOLDEN TRIANGLE RULE"
        psychMetricLabel="PROFIT PLACEMENT"
        psychMetricValue={`ZONE ${step} OF 3 ACTIVE`}
        accentColor={THEME.goldBright}
      />

      <HinglishSpeakerCaption
        lines="Jab bhi koi menu open karta hai, toh eye movement sabse pehle page ke center me jaati hai, fir top-right, aur fir top-left. Restaurants apne highest-profit items bilkul isi triangle path par place karte hain."
        highlightWords={[
          "eye",
          "center",
          "top-right",
          "top-left",
          "highest-profit",
          "triangle",
        ]}
        localFrame={frame}
        duration={270}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 5: DESCRIPTIVE SENSORY WORDS (33–41s | 240 Frames)
// ============================================================================
const Scene5DescriptiveWords: React.FC = () => {
  const frame = useCurrentFrame();
  const upgraded = frame >= 75;
  const cravingScore = Math.round(
    mapRange(0, 1, 28, 96, clamp(0, 1, (frame - 70) / 50))
  );

  const embers = useMemo(() => {
    return Array.from({ length: 75 }).map((_, i) => ({
      x: 160 + ((i * 53) % 760),
      speed: 3.5 + (i % 5) * 1.4,
      r: 3 + (i % 4) * 2.5,
      wobble: (i % 7) * 0.8,
    }));
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgObsidian }}>
      <CinemaBackdrop
        primaryGlow={upgraded ? THEME.goldBright : "#475569"}
        secondaryGlow={upgraded ? THEME.crimson : "#334155"}
        localFrame={frame}
      />

      <div
        style={{
          position: "absolute",
          top: 230,
          left: 56,
          right: 56,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            padding: "22px 30px",
            borderRadius: 18,
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(255,255,255,0.15)",
            opacity: upgraded ? 0.45 : 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 16,
                color: THEME.muted,
              }}
            >
              GENERIC LABEL (LOW DOPAMINE)
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: THEME.ivory }}>
              Plain Burger
            </div>
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, color: THEME.muted }}>
            250
          </div>
        </div>

        <div
          style={{
            padding: "28px 32px",
            borderRadius: 22,
            background: upgraded
              ? "linear-gradient(135deg, rgba(45, 24, 6, 0.95), rgba(15, 10, 4, 0.95))"
              : "rgba(15, 23, 42, 0.4)",
            border: `3px solid ${
              upgraded ? THEME.goldBright : "rgba(255,255,255,0.1)"
            }`,
            boxShadow: upgraded ? "0 0 55px rgba(245, 176, 65, 0.5)" : "none",
            transform: upgraded ? "scale(1.03)" : "scale(0.95)",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: THEME.goldBright,
              fontWeight: 700,
            }}
          >
            ★ SENSORY TRIGGER WORDS (+27% SALES BOOST)
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: THEME.ivory,
              marginTop: 8,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: THEME.goldBright }}>Smoked Charcoal</span>{" "}
            <span style={{ color: THEME.cyan }}>Artisanal BBQ</span> Burger
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 18,
              fontFamily: "monospace",
              fontSize: 24,
              color: THEME.emerald,
              fontWeight: 800,
            }}
          >
            <span>CRAVING INDEX: {cravingScore}%</span>
            <span>PRICE: 650 (ACCEPTED)</span>
          </div>
        </div>
      </div>

      <svg
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {upgraded &&
          embers.map((e, idx) => {
            const cy = 1450 - ((frame * e.speed + idx * 35) % 720);
            const cx = e.x + Math.sin(frame * 0.08 + idx) * 24 * e.wobble;
            const op = interpolate(cy, [730, 1100, 1450], [0, 0.95, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={e.r}
                fill={idx % 2 === 0 ? THEME.goldBright : "#ff5722"}
                opacity={op}
                style={{ filter: `drop-shadow(0 0 10px ${THEME.goldBright})` }}
              />
            );
          })}

        <g transform={`translate(540, 1080) rotate(${frame * 1.4})`}>
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="0"
              rx="220"
              ry="75"
              fill="none"
              stroke={upgraded ? THEME.goldBright : "#475569"}
              strokeWidth={upgraded ? "4" : "2"}
              transform={`rotate(${deg})`}
              style={{
                filter: upgraded ? `drop-shadow(0 0 18px ${THEME.gold})` : "none",
              }}
            />
          ))}
          <circle
            cx="0"
            cy="0"
            r="68"
            fill={upgraded ? THEME.goldBright : "#334155"}
            style={{
              filter: upgraded
                ? `drop-shadow(0 0 35px ${THEME.goldBright})`
                : "none",
            }}
          />
        </g>
      </svg>

      <DocumentaryHUD
        chapterNum="05 / NEUROLINGUISTICS"
        chapterTitle="SENSORY WORD ENGINEERING"
        psychMetricLabel="PERCEIVED VALUE"
        psychMetricValue={`+${cravingScore}% CRAVING`}
        accentColor={THEME.goldBright}
      />

      <HinglishSpeakerCaption
        lines="Sirf Burger likhne ke bajaye Smoked Charcoal BBQ Burger—aise sensory words padh kar dimag me dish ki perceived value aur craving dono badh jaati hain."
        highlightWords={[
          "Burger",
          "Smoked",
          "Charcoal",
          "BBQ",
          "sensory",
          "perceived",
          "craving",
        ]}
        localFrame={frame}
        duration={240}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 6: OUTRO / MIND GAME TAKEAWAY (41–48s | 210 Frames)
// ============================================================================
const Scene6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const octVerts = [
    [0, -200, 0],
    [0, 200, 0],
    [-190, 0, 0],
    [190, 0, 0],
    [0, 0, -190],
    [0, 0, 190],
  ];
  const edges = [
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 4],
    [4, 3],
    [3, 5],
    [5, 2],
  ];
  const angle = frame * 0.03;
  const proj = octVerts.map(([x, y, z]) => {
    const rx = x * Math.cos(angle) - z * Math.sin(angle);
    const rz = x * Math.sin(angle) + z * Math.cos(angle);
    const s = 650 / (650 + rz);
    return { x: 540 + rx * s, y: 1210 + y * s };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgObsidian }}>
      <CinemaBackdrop
        primaryGlow={THEME.goldBright}
        secondaryGlow={THEME.cyan}
        localFrame={frame}
      />

      <svg
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <circle
          cx="540"
          cy="1210"
          r="240"
          fill="none"
          stroke={THEME.gold}
          strokeWidth="2"
          strokeDasharray="12 10"
          opacity="0.45"
        />
        {edges.map(([i, j], idx) => (
          <line
            key={idx}
            x1={proj[i].x}
            y1={proj[i].y}
            x2={proj[j].x}
            y2={proj[j].y}
            stroke={THEME.cyan}
            strokeWidth="3.5"
            style={{ filter: `drop-shadow(0 0 12px ${THEME.cyan})` }}
          />
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          top: 280,
          left: 52,
          right: 52,
          transform: `scale(${cardScale})`,
          background: "rgba(5, 8, 16, 0.94)",
          border: `3px solid ${THEME.goldBright}`,
          borderRadius: 28,
          padding: "42px 36px",
          textAlign: "center",
          boxShadow: "0 0 70px rgba(245, 176, 65, 0.45)",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 22,
            color: THEME.cyan,
            letterSpacing: 4,
            fontWeight: 700,
          }}
        >
          MENU ENGINEERING DECODED
        </div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: THEME.ivory,
            lineHeight: 1.18,
            marginTop: 16,
            textShadow: `0 0 25px rgba(245, 176, 65, 0.65)`,
          }}
        >
          IT&apos;S NOT JUST A MENU. IT&apos;S A{" "}
          <span style={{ color: THEME.goldBright }}>MIND GAME.</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 32,
            fontFamily: "monospace",
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(0,230,118,0.1)",
              border: `1px solid ${THEME.emerald}`,
              color: THEME.emerald,
            }}
          >
            ✓ NO &apos;₹&apos; = NO PAIN
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,42,95,0.1)",
              border: `1px solid ${THEME.crimson}`,
              color: THEME.crimson,
            }}
          >
            ✓ 1800 DECOY ANCHOR
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,215,0,0.1)",
              border: `1px solid ${THEME.goldBright}`,
              color: THEME.goldBright,
            }}
          >
            ✓ GOLDEN TRIANGLE
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(0,240,255,0.1)",
              border: `1px solid ${THEME.cyan}`,
              color: THEME.cyan,
            }}
          >
            ✓ SENSORY WORDS
          </div>
        </div>
      </div>

      <DocumentaryHUD
        chapterNum="06 / VERDICT"
        chapterTitle="THE SUBCONSCIOUS MIND GAME"
        psychMetricLabel="AWARENESS LEVEL"
        psychMetricValue="100% DECODED"
        accentColor={THEME.goldBright}
      />

      <HinglishSpeakerCaption
        lines="Agli baar jab aap restaurant me baithe aur menu khule, toh yaad rakhna—aap sirf khana nahi choose kar rahe, balki unke banaye mind game ka part ban rahe ho!"
        highlightWords={["restaurant", "menu", "khana", "mind", "game"]}
        localFrame={frame}
        duration={210}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// MASTER COMPOSITION WITH EMBEDDED PROCEDURAL SOUND DESIGN (1440 Frames / 48s)
// ============================================================================
export const MenuPsychologyDocumentary: React.FC = () => {
  const sfx = useMemo(
    () => ({
      subImpact: createProceduralWav("subImpact", 1.4),
      glassShatter: createProceduralWav("glassShatter", 0.9),
      uiTick: createProceduralWav("uiTick", 0.18),
      neuralPulse: createProceduralWav("neuralPulse", 1.1),
      decoyBuzzer: createProceduralWav("decoyBuzzer", 0.8),
      targetChime: createProceduralWav("targetChime", 1.2),
      laserScan: createProceduralWav("laserScan", 1.5),
      flameSizzle: createProceduralWav("flameSizzle", 1.8),
      cinematicRiser: createProceduralWav("cinematicRiser", 2.0),
    }),
    []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgObsidian }}>
      <Sequence from={0} durationInFrames={210}>
        <Scene1Hook />
      </Sequence>
      <Sequence from={210} durationInFrames={240}>
        <Scene2PainOfPaying />
      </Sequence>
      <Sequence from={450} durationInFrames={270}>
        <Scene3DecoyEffect />
      </Sequence>
      <Sequence from={720} durationInFrames={270}>
        <Scene4GoldenTriangle />
      </Sequence>
      <Sequence from={990} durationInFrames={240}>
        <Scene5DescriptiveWords />
      </Sequence>
      <Sequence from={1230} durationInFrames={210}>
        <Scene6Outro />
      </Sequence>

      {/* Embedded Procedural Sound Tracks */}
      <Sequence from={0} durationInFrames={45}>
        <Audio src={sfx.subImpact} volume={0.85} />
      </Sequence>
      <Sequence from={65} durationInFrames={30}>
        <Audio src={sfx.glassShatter} volume={0.75} />
      </Sequence>
      <Sequence from={210} durationInFrames={45}>
        <Audio src={sfx.subImpact} volume={0.7} />
      </Sequence>
      <Sequence from={240} durationInFrames={35}>
        <Audio src={sfx.neuralPulse} volume={0.65} />
      </Sequence>
      <Sequence from={315} durationInFrames={40}>
        <Audio src={sfx.targetChime} volume={0.7} />
      </Sequence>
      <Sequence from={465} durationInFrames={30}>
        <Audio src={sfx.decoyBuzzer} volume={0.65} />
      </Sequence>
      <Sequence from={545} durationInFrames={40}>
        <Audio src={sfx.targetChime} volume={0.85} />
      </Sequence>
      <Sequence from={730} durationInFrames={45}>
        <Audio src={sfx.laserScan} volume={0.6} />
      </Sequence>
      <Sequence from={800} durationInFrames={15}>
        <Audio src={sfx.uiTick} volume={0.8} />
      </Sequence>
      <Sequence from={870} durationInFrames={15}>
        <Audio src={sfx.uiTick} volume={0.8} />
      </Sequence>
      <Sequence from={1065} durationInFrames={55}>
        <Audio src={sfx.flameSizzle} volume={0.7} />
      </Sequence>
      <Sequence from={1080} durationInFrames={40}>
        <Audio src={sfx.targetChime} volume={0.75} />
      </Sequence>
      <Sequence from={1180} durationInFrames={60}>
        <Audio src={sfx.cinematicRiser} volume={0.65} />
      </Sequence>
      <Sequence from={1230} durationInFrames={45}>
        <Audio src={sfx.subImpact} volume={0.95} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={MenuPsychologyDocumentary}
        durationInFrames={1440}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MenuPricingPsychology"
        component={MenuPsychologyDocumentary}
        durationInFrames={1440}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

registerRoot(RemotionRoot);
