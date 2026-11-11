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

/* =========================================================================
   EDITORIAL KINETIC TYPOGRAPHY + OPTICAL SHADOW & ZOOM REEL (16 SECONDS)
   - ZERO EMOJIS, ZERO CROOKED/TILTED TEXT (100% Straight Vertical Stacks)
   - Multi-Font Editorial Lockups (Serif Italic + Impact + Monospace + Sans)
   - Optical Ghost Shadow Trail & Lens Shadow Sweep (from Video 1)
   - SFX ONLY on Scene Transitions (Whoosh) + 2 Typing Sequences
   ========================================================================= */

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 960; // 16.0 Seconds @ 60 FPS

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

/* =========================================================================
   01. CLEAN PROCEDURAL SFX (SCENE WHOOSH + REALISTIC TYPING ONLY)
   ========================================================================= */
type SfxType = "cinematicWhoosh" | "deepZoomWhoosh" | "typeKey";

function buildCleanSfx(type: SfxType): string {
  const sampleRate = 22050;
  const durations: Record<SfxType, number> = {
    cinematicWhoosh: 0.42,
    deepZoomWhoosh: 0.55,
    typeKey: 0.065,
  };
  const totalSamples = Math.floor(sampleRate * durations[type]);
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

    if (type === "cinematicWhoosh") {
      const sweepF = 110 + Math.sin(p * Math.PI) * 280;
      const air = Math.sin(i * 12.9898) * Math.cos(i * 0.35) * 0.28;
      w = Math.sin(2 * Math.PI * sweepF * t) * 0.65 + air;
      env = Math.sin(Math.PI * p) * Math.pow(1 - p * 0.3, 1.4);
    } else if (type === "deepZoomWhoosh") {
      const f = 95 + Math.sin(p * Math.PI) * 190;
      w =
        Math.sin(2 * Math.PI * f * t) * 0.75 +
        Math.sin(2 * Math.PI * (f * 1.5) * t) * 0.25;
      env = Math.sin(Math.PI * p);
    } else {
      // Crisp mechanical typewriter key click
      const bodyF = 240 * Math.exp(-p * 18) + 80;
      const click = Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-p * 35);
      w = Math.sin(2 * Math.PI * bodyF * t) * 0.75 + click * 0.4;
      env = Math.exp(-p * 16);
    }

    view.setInt16(44 + i * 2, clamp(w * env * 0.78, -1, 1) * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const SFX = {
  whoosh: buildCleanSfx("cinematicWhoosh"),
  zoomWhoosh: buildCleanSfx("deepZoomWhoosh"),
  typeKey: buildCleanSfx("typeKey"),
};

/* =========================================================================
   02. REUSABLE OPTICAL SHADOW + MOTION-BLUR GHOST TEXT (VIDEO 1 STYLE)
   ========================================================================= */
const OpticalShadowText: React.FC<{
  text: string;
  localFrame: number;
  startFrame: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: number | string;
  letterSpacing?: number;
  bgBoxColor?: string;
  textColorInBox?: string;
}> = ({
  text,
  localFrame,
  startFrame,
  fontSize,
  fontFamily,
  color,
  fontStyle = "normal",
  fontWeight = 900,
  letterSpacing = 0,
  bgBoxColor,
  textColorInBox,
}) => {
  const { fps } = useVideoConfig();
  const rel = localFrame - startFrame;
  if (rel < 0) return null;

  const progress = spring({
    frame: rel,
    fps,
    config: { damping: 14, stiffness: 155, mass: 0.85 },
  });

  // Smooth zoom-in settle + ghost shadow convergence
  const scale = interpolate(progress, [0, 1], [1.45, 1]);
  const yOffset = interpolate(progress, [0, 1], [42, 0]);
  const shadowSpread = interpolate(progress, [0, 1], [48, 0]);
  const shadowBlur = interpolate(progress, [0, 1], [26, 0]);
  const shadowOpacity = interpolate(progress, [0, 0.7, 1], [0.65, 0.35, 0.16]);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        transform: `translateY(${yOffset}px) scale(${scale})`,
        opacity: clamp(rel / 8, 0, 1),
      }}
    >
      {/* GHOST ECHO SHADOW LAYER 1 (Soft Motion Blur Trail behind text) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: shadowSpread * 0.6,
          width: "100%",
          fontFamily,
          fontSize,
          fontStyle,
          fontWeight,
          letterSpacing,
          color: "#000000",
          opacity: shadowOpacity,
          filter: `blur(${8 + shadowBlur}px)`,
          transform: `scale(${1 + (1 - progress) * 0.22})`,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>

      {/* MAIN CRISP TEXT LAYER */}
      <div
        style={{
          position: "relative",
          fontFamily,
          fontSize,
          fontStyle,
          fontWeight,
          letterSpacing,
          color: bgBoxColor ? textColorInBox || "#FFFFFF" : color,
          backgroundColor: bgBoxColor || "transparent",
          padding: bgBoxColor ? "8px 34px" : "0",
          borderRadius: bgBoxColor ? 8 : 0,
          boxShadow: bgBoxColor
            ? `0 22px 48px rgba(0, 0, 0, 0.28)`
            : "none",
          textShadow: bgBoxColor
            ? "none"
            : `0px 14px 28px rgba(0, 0, 0, 0.18)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* =========================================================================
   03. TYPEWRITER TEXT WITH BLINKING CURSOR & SHADOW
   ========================================================================= */
const TypewriterLine: React.FC<{
  text: string;
  localFrame: number;
  startFrame: number;
  durationFrames: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}> = ({
  text,
  localFrame,
  startFrame,
  durationFrames,
  fontSize,
  fontFamily,
  color,
}) => {
  const rel = localFrame - startFrame;
  if (rel < 0) return null;

  const chars = Math.floor(
    interpolate(rel, [0, durationFrames], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const visible = text.slice(0, chars);
  const cursorVisible = rel < durationFrames + 35 && Math.floor(rel / 8) % 2 === 0;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight: 700,
        color,
        letterSpacing: 1,
        textShadow: "0px 10px 24px rgba(0,0,0,0.16)",
        whiteSpace: "nowrap",
      }}
    >
      {visible}
      {cursorVisible && (
        <span style={{ color: "#E11D48", marginLeft: 4, fontWeight: 400 }}>|</span>
      )}
    </div>
  );
};

/* =========================================================================
   04. OPTICAL LENS SHADOW OVERLAY (LIKE 00:03.5 OF VIDEO 1)
   ========================================================================= */
const OpticalLensShadowOverlay: React.FC<{ frame: number; darkTheme?: boolean }> = ({
  frame,
  darkTheme = false,
}) => {
  const driftX = Math.sin(frame * 0.025) * 90;
  const driftY = Math.cos(frame * 0.02) * 60;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 50 }}>
      {/* Soft Moving Optical Vignette Shadow */}
      <AbsoluteFill
        style={{
          background: darkTheme
            ? `radial-gradient(circle at ${50 + driftX * 0.15}% ${
                50 + driftY * 0.15
              }%, transparent 38%, rgba(0, 0, 0, 0.72) 100%)`
            : `radial-gradient(circle at ${52 + driftX * 0.15}% ${
                48 + driftY * 0.15
              }%, transparent 42%, rgba(15, 23, 42, 0.34) 100%)`,
        }}
      />
      {/* Subtle Top & Bottom Cinematic Shadow Bars */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -80,
          right: -80,
          height: 260,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 100%)",
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -80,
          right: -80,
          height: 280,
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.32) 0%, transparent 100%)",
          filter: "blur(20px)",
        }}
      />
    </AbsoluteFill>
  );
};

/* =========================================================================
   05. MASTER 4-SCENE COMPOSITION (16 SECONDS TOTAL)
   ========================================================================= */
const EditorialHookReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // SCENE TIMINGS (Comfortable, non-rushed durations):
  // Scene 1: 0 - 240 (0.0s - 4.0s | 4.0s) -> Macro Zoom-Out + Stacked Hook
  // Scene 2: 240 - 465 (4.0s - 7.75s | 3.75s) -> Typing + Camera Zoom-In on "EXACTLY"
  // Scene 3: 465 - 720 (7.75s - 12.0s | 4.25s) -> T-Shirt RS. 400 + RS. 50 Delivery Stack
  // Scene 4: 720 - 960 (12.0s - 16.0s | 4.0s) -> Free Shipping Illusion -> RS. 550 Reveal

  // --- SCENE 1 CAMERA (Starts zoomed in like Video 1, settles, then pushes in) ---
  const s1InitialZoom = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 90, mass: 1.1 },
  });
  const s1PunchZoom = spring({
    frame: Math.max(0, frame - 95),
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const camScale1 =
    interpolate(s1InitialZoom, [0, 1], [2.4, 1.0]) +
    interpolate(s1PunchZoom, [0, 1], [0, 0.16]);

  // --- SCENE 2 CAMERA (Smooth Zoom-In when "EXACTLY" appears) ---
  const s2Local = Math.max(0, frame - 240);
  const s2Zoom = spring({
    frame: Math.max(0, s2Local - 80),
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const camScale2 = interpolate(s2Zoom, [0, 1], [1.0, 1.24]);
  const camY2 = interpolate(s2Zoom, [0, 1], [0, 45]);

  // --- SCENE 3 CAMERA (Slow cinematic push-in) ---
  const s3Local = Math.max(0, frame - 465);
  const camScale3 = interpolate(s3Local, [0, 255], [0.96, 1.14], {
    extrapolateRight: "clamp",
  });

  // --- SCENE 4 CAMERA (Starts macro on FREE SHIPPING, pulls out to full stack) ---
  const s4Local = Math.max(0, frame - 720);
  const s4PullOut = spring({
    frame: Math.max(0, s4Local - 55),
    fps,
    config: { damping: 15, stiffness: 110 },
  });
  const camScale4 = interpolate(s4PullOut, [0, 1], [1.35, 1.0]);
  const camY4 = interpolate(s4PullOut, [0, 1], [140, 0]);

  // TYPING SOUND FRAMES
  // Typing 1 in Scene 1 ("Badi companies aapko" -> frames 8 to 44)
  const typeFramesScene1 = [8, 13, 18, 23, 28, 33, 38, 43];
  // Typing 2 in Scene 2 ("dekhte hain." -> frames 240+115 = 355 to 395)
  const typeFramesScene2 = [355, 361, 367, 373, 379, 385, 391];

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#F5F2EB" }}>
      {/* ===================================================================
          SCENE 1 (0.0s - 4.0s): STRAIGHT MULTI-FONT STACK + GHOST SHADOW
         =================================================================== */}
      {frame < 240 && (
        <AbsoluteFill style={{ backgroundColor: "#F4F0E6" }}>
          <OpticalLensShadowOverlay frame={frame} />

          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${camScale1})`,
            }}
          >
            {/* Straight Vertical Stack (Top to Bottom, 0deg Rotation) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
              }}
            >
              {/* Line 1: Typed Intro (Courier Monospace) */}
              <TypewriterLine
                text="Badi companies aapko"
                localFrame={frame}
                startFrame={6}
                durationFrames={40}
                fontSize={52}
                fontFamily='"Courier New", monospace'
                color="#334155"
              />

              {/* Line 2: Giant Straight Impact Block with Ink Box & Ghost Shadow */}
              <OpticalShadowText
                text="FREE"
                localFrame={frame}
                startFrame={48}
                fontSize={195}
                fontFamily="Impact, 'Arial Black', sans-serif"
                color="#FFFFFF"
                letterSpacing={6}
                bgBoxColor="#111827"
                textColorInBox="#F8FAFC"
              />

              {/* Line 3: Elegant Italic Serif */}
              <OpticalShadowText
                text="ke naam par"
                localFrame={frame}
                startFrame={78}
                fontSize={76}
                fontFamily="Georgia, 'Times New Roman', serif"
                fontStyle="italic"
                fontWeight={700}
                color="#475569"
              />

              {/* Line 4: Heavy Crimson Sans */}
              <OpticalShadowText
                text="KAISE LOOT-TI HAIN?"
                localFrame={frame}
                startFrame={102}
                fontSize={92}
                fontFamily="'Arial Black', Impact, sans-serif"
                color="#E11D48"
                letterSpacing={1}
              />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          SCENE 2 (4.0s - 7.75s): EDITORIAL STACK + ZOOM-IN + TYPING
         =================================================================== */}
      {frame >= 240 && frame < 465 && (
        <AbsoluteFill style={{ backgroundColor: "#0B0F17" }}>
          <OpticalLensShadowOverlay frame={frame} darkTheme />

          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${camScale2}) translateY(${camY2}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              {/* Top Row: Serif Italic */}
              <OpticalShadowText
                text="Chalo aaj"
                localFrame={s2Local}
                startFrame={8}
                fontSize={74}
                fontFamily="Georgia, serif"
                fontStyle="italic"
                color="#94A3B8"
              />

              {/* Center Hero Word: Giant Highlight Box (Camera Zooms Into This!) */}
              <OpticalShadowText
                text="EXACTLY"
                localFrame={s2Local}
                startFrame={36}
                fontSize={168}
                fontFamily="Impact, 'Arial Black', sans-serif"
                color="#05080F"
                letterSpacing={5}
                bgBoxColor="#00FF66"
                textColorInBox="#05080F"
              />

              {/* Bottom Row: Typewriter Reveal with Cursor */}
              <div style={{ marginTop: 12 }}>
                <TypewriterLine
                  text="dekhte hain."
                  localFrame={s2Local}
                  startFrame={112}
                  durationFrames={40}
                  fontSize={72}
                  fontFamily='"Courier New", monospace'
                  color="#F8FAFC"
                />
              </div>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          SCENE 3 (7.75s - 12.0s): STRAIGHT PRICE STACK (RS. 400 + RS. 50)
         =================================================================== */}
      {frame >= 465 && frame < 720 && (
        <AbsoluteFill style={{ backgroundColor: "#F4F0E6" }}>
          <OpticalLensShadowOverlay frame={frame} />

          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${camScale3})`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 22,
              }}
            >
              <OpticalShadowText
                text="Online ek T-Shirt"
                localFrame={s3Local}
                startFrame={6}
                fontSize={68}
                fontFamily="Georgia, serif"
                fontStyle="italic"
                color="#334155"
              />

              <OpticalShadowText
                text="PRICE: RS. 400"
                localFrame={s3Local}
                startFrame={38}
                fontSize={132}
                fontFamily="Impact, 'Arial Black', sans-serif"
                color="#0F172A"
                letterSpacing={3}
              />

              <OpticalShadowText
                text="+ RS. 50 Delivery Charge"
                localFrame={s3Local}
                startFrame={92}
                fontSize={58}
                fontFamily='"Courier New", monospace'
                color="#E11D48"
              />

              <OpticalShadowText
                text="LAGTA HAI PURE WASTE"
                localFrame={s3Local}
                startFrame={140}
                fontSize={72}
                fontFamily="'Arial Black', sans-serif"
                color="#FFFFFF"
                bgBoxColor="#E11D48"
                textColorInBox="#FFFFFF"
              />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          SCENE 4 (12.0s - 16.0s): MACRO ZOOM OUT TRAP MATH (RS. 550 BILL)
         =================================================================== */}
      {frame >= 720 && (
        <AbsoluteFill style={{ backgroundColor: "#090D16" }}>
          <OpticalLensShadowOverlay frame={frame} darkTheme />

          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${camScale4}) translateY(${camY4}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 22,
              }}
            >
              <OpticalShadowText
                text="FREE SHIPPING ABOVE RS. 500"
                localFrame={s4Local}
                startFrame={5}
                fontSize={64}
                fontFamily="'Arial Black', sans-serif"
                color="#05080F"
                bgBoxColor="#00FF66"
                textColorInBox="#05080F"
              />

              <OpticalShadowText
                text="Rs. 50 bachane ke chakkar mein"
                localFrame={s4Local}
                startFrame={60}
                fontSize={58}
                fontFamily="Georgia, serif"
                fontStyle="italic"
                color="#94A3B8"
              />

              <OpticalShadowText
                text="+ RS. 150 EXTRA ITEM"
                localFrame={s4Local}
                startFrame={98}
                fontSize={86}
                fontFamily='"Courier New", monospace'
                color="#FACC15"
              />

              <OpticalShadowText
                text="TOTAL BILL: RS. 550"
                localFrame={s4Local}
                startFrame={138}
                fontSize={114}
                fontFamily="Impact, 'Arial Black', sans-serif"
                color="#FFFFFF"
                letterSpacing={3}
                bgBoxColor="#E11D48"
                textColorInBox="#FFFFFF"
              />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* ===================================================================
          AUDIO TIMELINE: ONLY SCENE WHOOSHES + 2 TYPING SEQUENCES
         =================================================================== */}
      {/* Scene Transition & Camera Zoom Whooshes ONLY */}
      <Sequence from={0} durationInFrames={35} layout="none">
        <Audio src={SFX.zoomWhoosh} volume={0.8} />
      </Sequence>
      <Sequence from={95} durationInFrames={30} layout="none">
        <Audio src={SFX.whoosh} volume={0.65} />
      </Sequence>
      <Sequence from={240} durationInFrames={35} layout="none">
        <Audio src={SFX.whoosh} volume={0.85} />
      </Sequence>
      <Sequence from={320} durationInFrames={35} layout="none">
        <Audio src={SFX.zoomWhoosh} volume={0.75} />
      </Sequence>
      <Sequence from={465} durationInFrames={35} layout="none">
        <Audio src={SFX.whoosh} volume={0.85} />
      </Sequence>
      <Sequence from={720} durationInFrames={35} layout="none">
        <Audio src={SFX.zoomWhoosh} volume={0.85} />
      </Sequence>

      {/* Typing SFX Sequence 1 ("Badi companies aapko") */}
      {typeFramesScene1.map((f, i) => (
        <Sequence key={`t1-${i}`} from={f} durationInFrames={10} layout="none">
          <Audio src={SFX.typeKey} volume={0.65} />
        </Sequence>
      ))}

      {/* Typing SFX Sequence 2 ("dekhte hain.") */}
      {typeFramesScene2.map((f, i) => (
        <Sequence key={`t2-${i}`} from={f} durationInFrames={10} layout="none">
          <Audio src={SFX.typeKey} volume={0.65} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={EditorialHookReel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export default RemotionRoot;
