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
   SCATTERED KINETIC TYPOGRAPHY (IMPROVED VERSION)
   - Limited SFX (Only on impact words)
   - Dynamic Sizes (Tiny words mixed with Giant words)
   - Continuous Zoom (Hero words keep zooming in after popping)
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 270; // 4.5 Seconds

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

// SOFTER ORGANIC POP SOUND
function buildPopSfx(): string {
  const sampleRate = 22050;
  const totalSamples = Math.floor(sampleRate * 0.12);
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
    const f = 350 + Math.pow(p, 1.5) * 350; // Softer frequency sweep
    const w = Math.sin(2 * Math.PI * f * t);
    const env = Math.sin(Math.PI * p) * Math.pow(1 - p, 1.2);
    view.setInt16(44 + i * 2, clamp(w * env * 0.7, -1, 1) * 32767, true);
  }
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}
const POP_SFX = buildPopSfx();

// --- SCENE 1 (0 - 2.5s) ---
// sfx: true (triggers sound), zoom: true (keeps scaling up)
const scene1 = [
  { type: "text", text: "BADI", f: 5, x: 150, y: 300, size: 70, font: "Impact", color: "#111827", rotate: -4 },
  { type: "img", src: "🏢", f: 12, x: 80, y: 400, size: 180, rotate: 12, sfx: true },
  { type: "text", text: "companies", f: 20, x: 380, y: 380, size: 90, font: "Georgia, serif", color: "#2563EB", style: "italic" },
  { type: "text", text: "aapko", f: 35, x: 180, y: 650, size: 60, font: '"Comic Sans MS", cursive, sans-serif', color: "#475569", rotate: 5 },
  
  // GIANT HERO WORD (With Zoom & SFX)
  { type: "text", text: "FREE", f: 45, x: 250, y: 680, size: 260, font: "Impact", color: "#FF2A54", rotate: -6, zoom: true, sfx: true },
  
  { type: "text", text: "ke naam", f: 70, x: 160, y: 1050, size: 70, font: '"Arial Black", sans-serif', color: "#16A34A", rotate: -3 },
  { type: "text", text: "par", f: 80, x: 550, y: 1100, size: 80, font: "Georgia, serif", color: "#111827", style: "italic" },
  { type: "img", src: "🤑", f: 90, x: 700, y: 950, size: 220, rotate: -15, sfx: true },
  { type: "text", text: "kaise", f: 100, x: 280, y: 1250, size: 90, font: "Impact", color: "#D97706", rotate: 6 },
  
  // GIANT HERO WORD (With Zoom & SFX)
  { type: "text", text: "LOOT-TI", f: 115, x: 120, y: 1380, size: 240, font: "Impact", color: "#111827", rotate: -4, zoom: true, sfx: true },
  
  { type: "text", text: "HAIN?", f: 135, x: 720, y: 1620, size: 100, font: "Georgia, serif", color: "#FF2A54", rotate: 8 },
];

// --- SCENE 2 (2.5s - 4.5s) ---
const scene2 = [
  { type: "img", src: "🕵️‍♂️", f: 155, x: 80, y: 750, size: 250, rotate: -10, sfx: true }, 
  { type: "text", text: "Chalo", f: 165, x: 220, y: 350, size: 90, font: '"Arial Black", sans-serif', color: "#111827", rotate: -3 },
  { type: "text", text: "aaj", f: 180, x: 620, y: 400, size: 100, font: "Georgia, serif", color: "#FF2A54", style: "italic", rotate: 5 },
  
  // GIANT HERO WORD (With Zoom & SFX)
  { type: "text", text: "EXACTLY", f: 195, x: 140, y: 650, size: 230, font: "Impact", color: "#2563EB", rotate: -6, zoom: true, sfx: true },
  
  { type: "img", src: "👀", f: 215, x: 750, y: 920, size: 200, rotate: 15, sfx: true },
  { type: "text", text: "dekhte", f: 225, x: 350, y: 1120, size: 110, font: '"Arial Black", sans-serif', color: "#111827", rotate: 3 },
  { type: "text", text: "hain.", f: 240, x: 680, y: 1300, size: 120, font: "Georgia, serif", color: "#16A34A", rotate: -4 },
];

const ScatteredElement = ({ item, frame, fps }: any) => {
  // Initial spring pop
  const popScale = spring({
    frame: frame - item.f,
    fps,
    config: { damping: 12, stiffness: 220 },
  });

  // Continuous slow zoom for specific hero words
  const continuousZoom = item.zoom 
    ? interpolate(frame - item.f, [0, 90], [1, 1.25], { extrapolateRight: "clamp" }) 
    : 1;

  const finalScale = popScale * continuousZoom;

  if (frame < item.f) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        transform: `scale(${finalScale}) rotate(${item.rotate || 0}deg)`,
        fontFamily: item.font || '"Arial Black", sans-serif',
        fontSize: item.size,
        color: item.color || "#000",
        fontStyle: item.style || "normal",
        textShadow: item.type === "text" ? "0px 10px 20px rgba(0,0,0,0.12)" : "none",
        filter: item.type === "img" ? "drop-shadow(0px 15px 25px rgba(0,0,0,0.2))" : "none",
        whiteSpace: "nowrap",
        transformOrigin: "center center",
      }}
    >
      {item.type === "text" ? item.text : item.src}
    </div>
  );
};

const ViralHookReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background switches at frame 150
  const bg = frame < 150 ? "#FCECA1" : "#E0F2FE"; 

  // Filter out only items that have sfx: true
  const sfxTriggers = [...scene1, ...scene2].filter(item => item.sfx);

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

      {/* RENDER AUDIO TRIGGERS (ONLY FOR SELECTED WORDS) */}
      {sfxTriggers.map((item, i) => (
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

