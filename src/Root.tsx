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
   HYPER-KINETIC VFX DEMO: THE FREE SHIPPING TRAP (13 SECONDS)
   Features: Camera Shake, Continuous Zoom, Film Grain, Chromatic Glitch, 3D Snaps
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 780; // 13 Seconds

const NEON_GREEN = "#00FF66";
const CRIMSON = "#FF2A54";
const DARK_BG = "#030407";

// 1. PROCEDURAL SFX
type SfxKind = "heavySlam" | "kaching" | "glitchWhoosh";
function buildSfx(kind: SfxKind): string {
  const sampleRate = 22050;
  const durations = { heavySlam: 0.6, kaching: 0.5, glitchWhoosh: 0.4 };
  const totalSamples = Math.floor(sampleRate * durations[kind]);
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
    const t = i / sampleRate; const p = i / totalSamples;
    let w = 0, env = 1;
    if (kind === "heavySlam") {
      w = Math.sin(2 * Math.PI * (140 * Math.pow(1 - p, 2) + 40) * t);
      env = Math.pow(1 - p, 2.5);
    } else if (kind === "kaching") {
      w = Math.sin(2 * Math.PI * 1480 * t) * 0.5 + Math.sin(2 * Math.PI * 2960 * t) * 0.3;
      env = Math.exp(-p * 8);
    } else if (kind === "glitchWhoosh") {
      w = (Math.random() * 2 - 1) * 0.4 + Math.sin(2 * Math.PI * 150 * t) * 0.5;
      env = Math.sin(Math.PI * p) * Math.pow(1 - p, 1.5);
    }
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, w * env * 0.8)) * 32767, true);
  }
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}
const SFX = { heavySlam: buildSfx("heavySlam"), kaching: buildSfx("kaching"), glitchWhoosh: buildSfx("glitchWhoosh") };

// 2. FILM GRAIN OVERLAY (TEXTURE)
const FilmGrain: React.FC = () => (
  <AbsoluteFill style={{ opacity: 0.12, pointerEvents: "none", zIndex: 100, mixBlendMode: "screen" }}>
    <svg width="100%" height="100%">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </AbsoluteFill>
);

// 3. MASTER COMPOSITION
const HyperKineticReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- VFX: CONTINUOUS ZOOM & CAMERA SHAKE ---
  const globalZoom = 1 + (frame / DURATION) * 0.12; // Slow push-in over 13s
  // Shake triggers on heavy impacts (frames: 10, 190, 360, 520)
  const shakeEnv = 
    Math.max(0, 1 - Math.abs(frame - 15) / 10) * 20 + 
    Math.max(0, 1 - Math.abs(frame - 195) / 10) * 15 +
    Math.max(0, 1 - Math.abs(frame - 365) / 10) * 25 +
    Math.max(0, 1 - Math.abs(frame - 525) / 10) * 20;
  
  const shakeX = Math.sin(frame * 2.3) * shakeEnv;
  const shakeY = Math.cos(frame * 1.8) * shakeEnv;
  const shakeTilt = Math.sin(frame * 1.5) * (shakeEnv * 0.1);

  // Animations
  const f1 = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 250 } });
  const f2 = spring({ frame: frame - 190, fps, config: { damping: 12, stiffness: 180 } });
  const f3 = spring({ frame: frame - 360, fps, config: { damping: 8, stiffness: 300 } }); // Aggressive snap
  const f4 = spring({ frame: frame - 520, fps, config: { damping: 12, stiffness: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, overflow: "hidden", fontFamily: '"Arial Black", Impact, sans-serif' }}>
      <FilmGrain />
      
      {/* CAMERA WRAPPER */}
      <AbsoluteFill style={{ transform: `scale(${globalZoom}) translate(${shakeX}px, ${shakeY}px) rotate(${shakeTilt}deg)`, transformOrigin: "center center" }}>
        
        {/* BG Grid */}
        <AbsoluteFill style={{ opacity: 0.1, backgroundImage: `linear-gradient(${NEON_GREEN} 2px, transparent 2px), linear-gradient(90deg, ${NEON_GREEN} 2px, transparent 2px)`, backgroundSize: "120px 120px", transform: `translateY(${(frame * 2) % 120}px) perspective(800px) rotateX(30deg)` }} />

        {/* CUT 1: HOOK (0s - 3s) */}
        {frame < 185 && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: 40, color: "#64748B", letterSpacing: 8, transform: `translateY(${(1 - f1) * -50}px)`, opacity: f1 }}>
              BADI COMPANIES AAPKO
            </div>
            <div style={{ marginTop: 20, padding: "10px 40px", background: NEON_GREEN, color: "#000", fontSize: 110, fontWeight: 900, transform: `scale(${0.5 + f1 * 0.5}) rotate(${-2 + (1-f1)*10}deg)`, boxShadow: `0 0 80px ${NEON_GREEN}` }}>
              "FREE"
            </div>
            <div style={{ fontSize: 60, color: "#FFF", marginTop: 20, transform: `translateY(${(1 - f1) * 50}px)`, opacity: f1 }}>
              KE NAAM PAR KAISE LOOT-TI HAI?
            </div>
          </AbsoluteFill>
        )}

        {/* CUT 2: T-SHIRT 400 (3s - 6s) */}
        {frame >= 185 && frame < 355 && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: 800, padding: 60, background: "rgba(10,15,24,0.9)", border: `4px solid ${NEON_GREEN}`, borderRadius: 30, textAlign: "center", transform: `perspective(1000px) rotateX(${(1 - f2) * 90}deg) scale(${0.8 + f2 * 0.2})`, boxShadow: `0 30px 60px rgba(0,0,0,0.8)` }}>
              <div style={{ fontSize: 35, color: "#94A3B8", letterSpacing: 5 }}>ITEM ADDED TO CART</div>
              <div style={{ fontSize: 70, color: "#FFF", margin: "20px 0" }}>OVERSIZED T-SHIRT</div>
              <div style={{ fontSize: 120, color: NEON_GREEN, textShadow: `0 0 50px ${NEON_GREEN}` }}>RS. 400</div>
            </div>
          </AbsoluteFill>
        )}

        {/* CUT 3: + DELIVERY 50 GLITCH (6s - 8.5s) */}
        {frame >= 355 && frame < 515 && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: 800, padding: 60, background: "rgba(30,5,10,0.9)", border: `6px solid ${CRIMSON}`, borderRadius: 30, textAlign: "center", transform: `scale(${1 + (1 - f3) * 0.5})`, boxShadow: `0 0 100px ${CRIMSON}55` }}>
              <div style={{ fontSize: 45, color: "#FFF", letterSpacing: 3 }}>DELIVERY CHARGE</div>
              {/* Chromatic Aberration Effect */}
              <div style={{ fontSize: 130, color: CRIMSON, marginTop: 20, textShadow: `-8px 0px 0px rgba(0,255,255,0.7), 8px 0px 0px rgba(255,0,0,0.7)` }}>
                + RS. 50
              </div>
              <div style={{ marginTop: 20, padding: "10px 30px", background: CRIMSON, color: "#FFF", fontSize: 40, display: "inline-block" }}>PURE WASTE ❌</div>
            </div>
          </AbsoluteFill>
        )}

        {/* CUT 4: FREE SHIPPING BANNER SLAM (8.5s - 13s) */}
        {frame >= 515 && (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: 900, padding: 50, background: NEON_GREEN, borderRadius: 20, textAlign: "center", transform: `translateY(${(1 - f4) * -200}px) scale(${0.9 + f4 * 0.1})`, boxShadow: `0 0 100px ${NEON_GREEN}` }}>
              <div style={{ fontSize: 40, color: "#000", letterSpacing: 4 }}>COMPANY PLAYS A MIND GAME</div>
              <div style={{ fontSize: 90, color: "#000", marginTop: 20, lineHeight: 1 }}>
                FREE SHIPPING <br/>ABOVE RS. 500
              </div>
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* AUDIO TRIGGERS */}
      <Sequence from={10} durationInFrames={30} layout="none"><Audio src={SFX.heavySlam} volume={1} /></Sequence>
      <Sequence from={190} durationInFrames={30} layout="none"><Audio src={SFX.glitchWhoosh} volume={0.8} /></Sequence>
      <Sequence from={360} durationInFrames={30} layout="none"><Audio src={SFX.heavySlam} volume={1} /></Sequence>
      <Sequence from={520} durationInFrames={30} layout="none"><Audio src={SFX.kaching} volume={1} /></Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={HyperKineticReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;

