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
   REMOTION CAPABILITY TEST (10 SECONDS)
   Features: Kinetic Typography, Smooth UI Elements, Procedural Audio
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 600; // 10 Seconds @ 60 FPS

const NEON_GREEN = "#00FF66";
const CYAN = "#00F0FF";
const DARK_BG = "#05070E";
const PANEL_BG = "rgba(10, 15, 24, 0.95)";

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

// 1. PROCEDURAL SFX FOR TESTING
type SfxKind = "heavySlam" | "uiPop" | "techWhoosh";

function buildTestSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations = { heavySlam: 0.5, uiPop: 0.2, techWhoosh: 0.3 };
  const duration = durations[kind];
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF"); view.setUint32(4, 36 + totalSamples * 2, true);
  writeStr(8, "WAVE"); writeStr(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, "data"); view.setUint32(40, totalSamples * 2, true);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const p = i / totalSamples;
    let w = 0, env = 1;

    if (kind === "heavySlam") {
      w = Math.sin(2 * Math.PI * (120 * Math.pow(1 - p, 2) + 30) * t);
      env = Math.pow(1 - p, 2);
    } else if (kind === "uiPop") {
      w = Math.sin(2 * Math.PI * (400 + p * 600) * t);
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 2);
    } else if (kind === "techWhoosh") {
      const noise = Math.sin(i * 12.98) * Math.cos(i * 0.21);
      w = noise * 0.4 + Math.sin(2 * Math.PI * (200 + p * 400) * t) * 0.3;
      env = Math.sin(Math.PI * p);
    }
    view.setInt16(44 + i * 2, clamp(w * env * 0.8, -1, 1) * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX = {
  heavySlam: buildTestSfx("heavySlam"),
  uiPop: buildTestSfx("uiPop"),
  techWhoosh: buildTestSfx("techWhoosh"),
};

// 2. BACKGROUND GRID
const CyberGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const shift = (frame * 1.5) % 100;
  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,255,102,0.15) 0%, ${DARK_BG} 70%)` }} />
      <AbsoluteFill
        style={{
          opacity: 0.15,
          backgroundImage: `linear-gradient(${NEON_GREEN}44 2px, transparent 2px), linear-gradient(90deg, ${NEON_GREEN}44 2px, transparent 2px)`,
          backgroundSize: "100px 100px",
          transform: `translateY(${shift}px) perspective(500px) rotateX(25deg)`,
          transformOrigin: "bottom center",
        }}
      />
    </AbsoluteFill>
  );
};

// 3. MAIN COMPOSITION
const TestReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const textPop = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 200 } });
  const uiRise = spring({ frame: frame - 180, fps, config: { damping: 14, stiffness: 150 } });
  const closingSlam = spring({ frame: frame - 420, fps, config: { damping: 10, stiffness: 220 } });
  
  const barWidth = interpolate(frame, [220, 380], [10, 100], { extrapolateRight: "clamp" });
  const rotation = frame * 2;

  return (
    <AbsoluteFill style={{ overflow: "hidden", color: "white", fontFamily: '"Arial Black", sans-serif' }}>
      <CyberGrid frame={frame} />

      {/* SCENE 1: KINETIC TYPOGRAPHY (0s - 3s) */}
      <Sequence from={0} durationInFrames={200} layout="none">
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 40, color: CYAN, letterSpacing: 10, transform: `translateY(${(1 - textPop) * 50}px)`, opacity: textPop }}>
            REMOTION ENGINE
          </div>
          <div style={{ fontSize: 90, fontWeight: 900, color: NEON_GREEN, textAlign: "center", transform: `scale(${interpolate(textPop, [0, 1], [0.5, 1])})`, opacity: textPop, marginTop: 20 }}>
            KINETIC<br/>TYPOGRAPHY
          </div>
        </AbsoluteFill>
        <Sequence from={10} durationInFrames={30} layout="none"><Audio src={SFX.heavySlam} volume={0.8} /></Sequence>
      </Sequence>

      {/* SCENE 2: SMOOTH UI & GRAPHS (3s - 7s) */}
      <Sequence from={180} durationInFrames={260} layout="none">
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 800, padding: 50, background: PANEL_BG, borderRadius: 30, border: `4px solid ${CYAN}`, transform: `translateY(${(1 - uiRise) * 150}px)`, opacity: uiRise, boxShadow: `0 0 60px rgba(0, 240, 255, 0.3)` }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#94A3B8" }}>
              <span>SYSTEM TEST</span>
              <span style={{ color: CYAN }}>PROCESSING...</span>
            </div>

            {/* Rotating SVG Radar / Scanner */}
            <div style={{ display: "flex", justifyContent: "center", margin: "40px 0" }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke={CYAN} strokeWidth="4" opacity="0.3" />
                <circle cx="100" cy="100" r="80" fill="none" stroke={NEON_GREEN} strokeWidth="8" strokeDasharray="100 400" transform={`rotate(${rotation} 100 100)`} />
                <circle cx="100" cy="100" r="40" fill="none" stroke={CYAN} strokeWidth="4" strokeDasharray="20 15" transform={`rotate(${-rotation * 1.5} 100 100)`} />
              </svg>
            </div>

            {/* Animated Loading Bar */}
            <div style={{ width: "100%", height: 30, background: "#0F172A", borderRadius: 15, overflow: "hidden", border: `2px solid ${NEON_GREEN}` }}>
              <div style={{ width: `${barWidth}%`, height: "100%", background: NEON_GREEN, boxShadow: `0 0 20px ${NEON_GREEN}` }} />
            </div>
            <div style={{ textAlign: "center", marginTop: 15, fontSize: 35, color: NEON_GREEN }}>
              {Math.floor(barWidth)}% COMPLETE
            </div>
          </div>
        </AbsoluteFill>
        <Sequence from={0} durationInFrames={30} layout="none"><Audio src={SFX.techWhoosh} volume={0.8} /></Sequence>
      </Sequence>

      {/* SCENE 3: FINAL IMPACT (7s - 10s) */}
      <Sequence from={420} durationInFrames={180} layout="none">
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: NEON_GREEN }}>
          <div style={{ fontSize: 130, color: "#000", transform: `scale(${0.5 + closingSlam * 0.5}) rotate(${Math.sin(frame * 0.1) * 2}deg)` }}>
            TEST SUCCESS
          </div>
        </AbsoluteFill>
        <Sequence from={0} durationInFrames={30} layout="none"><Audio src={SFX.heavySlam} volume={1} /></Sequence>
      </Sequence>

    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={TestReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;

