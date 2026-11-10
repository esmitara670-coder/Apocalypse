import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* =========================================================================
   VIRAL STOMP / SCATTERED KINETIC TYPOGRAPHY HOOK (4.5 SECONDS)
   Style: Solid Pastel Backgrounds, Mixed Fonts, Cutout Emojis, Pop Sounds
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 270; // 4.5 Seconds

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

// PROCEDURAL SATISFYING 'POP/BUBBLE' SOUND FOR EVERY WORD
function buildPopSfx(): string {
  const sampleRate = 22050;
  const totalSamples = Math.floor(sampleRate * 0.15);
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
    const f = 450 + Math.pow(p, 1.2) * 500; 
    const w = Math.sin(2 * Math.PI * f * t);
    const env = Math.sin(Math.PI * p) * Math.pow(1 - p, 1.5);
    view.setInt16(44 + i * 2, clamp(w * env * 0.8, -1, 1) * 32767, true);
  }
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}
const POP_SFX = buildPopSfx();

// --- SCENE 1 TIMING & LAYOUT (0 - 2.5s) ---
const scene1 = [
  { type: "text", text: "BADI", f: 5, x: 100, y: 220, size: 100, font: "Impact", color: "#111827", rotate: -2 },
  { type: "img", src: "🏢", f: 12, x: -60, y: 300, size: 350, rotate: 10 },
  { type: "text", text: "companies", f: 22, x: 360, y: 340, size: 110, font: "Georgia, serif", color: "#2563EB", style: "italic" },
  { type: "text", text: "aapko", f: 38, x: 220, y: 550, size: 90, font: '"Comic Sans MS", cursive, sans-serif', color: "#475569", rotate: 3 },
  { type: "text", text: "FREE", f: 52, x: 420, y: 650, size: 210, font: "Impact", color: "#FF2A54", rotate: -8 },
  { type: "img", src: "🤑", f: 65, x: 700, y: 800, size: 280, rotate: -15 },
  { type: "text", text: "ke naam", f: 78, x: 120, y: 980, size: 100, font: '"Arial Black", sans-serif', color: "#16A34A", rotate: -3 },
  { type: "text", text: "par", f: 90, x: 620, y: 960, size: 100, font: "Georgia, serif", color: "#111827", style: "italic" },
  { type: "text", text: "kaise", f: 105, x: 300, y: 1180, size: 120, font: "Impact", color: "#D97706", rotate: 4 },
  { type: "img", src: "🤔", f: 115, x: -40, y: 1150, size: 250, rotate: 20 },
  { type: "text", text: "LOOT-TI", f: 125, x: 150, y: 1380, size: 190, font: "Impact", color: "#111827", rotate: -5 },
  { type: "text", text: "HAIN?", f: 138, x: 650, y: 1580, size: 140, font: "Georgia, serif", color: "#FF2A54", rotate: 8 },
];

// --- SCENE 2 TIMING & LAYOUT (2.5s - 4.5s) ---
const scene2 = [
  { type: "img", src: "🕵️‍♂️", f: 155, x: -20, y: 650, size: 450, rotate: -10 }, 
  { type: "text", text: "Chalo", f: 165, x: 180, y: 250, size: 130, font: '"Arial Black", sans-serif', color: "#111827", rotate: -3 },
  { type: "text", text: "aaj", f: 182, x: 650, y: 350, size: 120, font: "Georgia, serif", color: "#FF2A54", style: "italic", rotate: 5 },
  { type: "text", text: "EXACTLY", f: 200, x: 220, y: 580, size: 180, font: "Impact", color: "#2563EB", rotate: -6 },
  { type: "img", src: "👀", f: 210, x: 750, y: 700, size: 250, rotate: 15 },
  { type: "text", text: "dekhte", f: 225, x: 400, y: 920, size: 130, font: '"Arial Black", sans-serif', color: "#111827", rotate: 3 },
  { type: "text", text: "hain.", f: 240, x: 620, y: 1100, size: 150, font: "Georgia, serif", color: "#16A34A", rotate: -4 },
];

const ScatteredElement = ({ item, frame, fps }: any) => {
  const scale = spring({
    frame: frame - item.f,
    fps,
    config: { damping: 11, stiffness: 220 },
  });

  if (frame < item.f) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        transform: `scale(${scale}) rotate(${item.rotate || 0}deg)`,
        fontFamily: item.font || '"Arial Black", sans-serif',
        fontSize: item.size,
        color: item.color || "#000",
        fontStyle: item.style || "normal",
        textShadow: item.type === "text" ? "0px 12px 25px rgba(0,0,0,0.15)" : "none",
        filter: item.type === "img" ? "drop-shadow(0px 25px 35px rgba(0,0,0,0.25))" : "none",
        whiteSpace: "nowrap",
      }}
    >
      {item.type === "text" ? item.text : item.src}
    </div>
  );
};

const ViralHookReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background switches from Pastel Yellow to Light Blue at frame 150
  const bg = frame < 150 ? "#FCECA1" : "#E0F2FE"; 

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      
      {/* RENDER SCENE 1 */}
      {frame < 150 && scene1.map((item, i) => (
        <ScatteredElement key={`s1-${i}`} item={item} frame={frame} fps={fps} />
      ))}
      
      {/* RENDER SCENE 2 */}
      {frame >= 150 && scene2.map((item, i) => (
        <ScatteredElement key={`s2-${i}`} item={item} frame={frame} fps={fps} />
      ))}

      {/* TRIGGER A 'POP' SOUND FOR EVERY SINGLE WORD/IMAGE */}
      {[...scene1, ...scene2].map((item, i) => (
        <Sequence key={`sfx-${i}`} from={item.f} durationInFrames={30} layout="none">
          <Audio src={POP_SFX} volume={0.8} />
        </Sequence>
      ))}
      
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ViralHookReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;

