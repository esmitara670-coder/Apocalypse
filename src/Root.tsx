import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Sequence,
  interpolate,
  registerRoot,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* =====================================================
   CONFIGURATION
===================================================== */

const W = 1080;
const H = 1920;
const FPS = 30;
const DURATION = 1200; // 40 seconds

const COLORS = {
  bg: "#050914",
  bg2: "#0A1425",
  white: "#F5F7FF",
  muted: "#95A7C3",
  cyan: "#6CEBFF",
  blue: "#2685FF",
  gold: "#FFD477",
  gold2: "#D99A34",
  red: "#FF6475",
  green: "#61E6B3",
};

const FONT =
  '"Inter", "Noto Sans Devanagari", "Mangal", sans-serif';

/* =====================================================
   PROCEDURAL SOUND EFFECTS
   No external audio files required.
===================================================== */

type SoundType = "whoosh" | "impact" | "ping" | "pop" | "tick";

function createSfx(
  type: SoundType,
  duration = 0.3,
  frequency = 400
): string {
  const sampleRate = 22050;
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const p = i / samples;

    let wave = 0;
    let envelope = 1;

    if (type === "whoosh") {
      const noise =
        Math.sin(i * 12.9898) * Math.cos(i * 0.127);

      wave =
        noise * 0.45 +
        Math.sin(2 * Math.PI * (120 + p * 280) * t) * 0.3;

      envelope = Math.sin(Math.PI * p) * 0.8;
    }

    if (type === "impact") {
      const f = frequency * (1 - p * 0.72);

      wave =
        Math.sin(2 * Math.PI * f * t) * 0.8 +
        Math.sin(2 * Math.PI * f * 1.5 * t) * 0.2;

      envelope = Math.pow(1 - p, 3);
    }

    if (type === "ping") {
      wave =
        Math.sin(2 * Math.PI * frequency * t) * 0.7 +
        Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;

      envelope = Math.exp(-p * 5);
    }

    if (type === "pop") {
      const f = frequency * (1 - p * 0.55);
      wave = Math.sin(2 * Math.PI * f * t);
      envelope = Math.pow(1 - p, 2.2);
    }

    if (type === "tick") {
      wave = Math.sin(2 * Math.PI * frequency * t);
      envelope = Math.pow(1 - p, 5);
    }

    const value = Math.max(
      -1,
      Math.min(1, wave * envelope * 0.65)
    );

    view.setInt16(
      44 + i * 2,
      value * 32767,
      true
    );
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

const SFX = {
  whoosh: createSfx("whoosh", 0.38),
  impact: createSfx("impact", 0.34, 105),
  ping: createSfx("ping", 0.4, 1100),
  pop: createSfx("pop", 0.19, 520),
  tick: createSfx("tick", 0.09, 1600),
};

function Sound({
  at,
  type,
  volume = 0.5,
}: {
  at: number;
  type: SoundType;
  volume?: number;
}) {
  return (
    <Sequence
      from={at}
      durationInFrames={20}
      layout="none"
    >
      <Audio src={SFX[type]} volume={volume} />
    </Sequence>
  );
}

/* =====================================================
   ANIMATION UTILITIES
===================================================== */

function AnimatedText({
  children,
  start = 0,
  size = 75,
  color = COLORS.white,
  weight = 800,
  align = "center",
}: {
  children: React.ReactNode;
  start?: number;
  size?: number;
  color?: string;
  weight?: number;
  align?: "center" | "left" | "right";
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - start),
    fps,
    config: {
      damping: 16,
      stiffness: 105,
      mass: 0.8,
    },
  });

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        color,
        textAlign: align,
        lineHeight: 1.28,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 65}px) scale(${0.93 + progress * 0.07})`,
        textShadow:
          color === COLORS.gold
            ? "0 0 35px rgba(255,190,75,0.35)"
            : "0 0 25px rgba(70,180,255,0.16)",
      }}
    >
      {children}
    </div>
  );
}

function SceneShell({
  children,
  duration,
}: {
  children: React.ReactNode;
  duration: number;
}) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 10, duration - 10, duration],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        opacity,
        overflow: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function SceneLabel({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 100,
        left: 75,
        display: "flex",
        alignItems: "center",
        gap: 17,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          color: COLORS.gold,
          fontSize: 25,
          fontWeight: 900,
          letterSpacing: 3,
        }}
      >
        {number}
      </div>

      <div
        style={{
          width: 48,
          height: 2,
          background: COLORS.gold,
        }}
      />

      <div
        style={{
          color: COLORS.muted,
          fontSize: 21,
          letterSpacing: 3,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
    </div>
  );
}

/* =====================================================
   BACKGROUND ATMOSPHERE
===================================================== */

function Atmosphere() {
  const frame = useCurrentFrame();

  const dots = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        x: (i * 173 + 31) % 1080,
        y: (i * 293 + 77) % 1920,
        size: 2 + (i % 4),
        speed: 0.2 + (i % 5) * 0.08,
      })),
    []
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Soft central lighting */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, #102640 0%, #081321 40%, #050914 78%)",
        }}
      />

      {/* Subtle grid */}
      <AbsoluteFill
        style={{
          opacity: 0.13,
          backgroundImage:
            "linear-gradient(rgba(120,180,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(120,180,255,0.12) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
          transform: `translateY(${(frame * 0.15) % 90}px)`,
        }}
      />

      {/* Floating particles */}
      {dots.map((dot, i) => {
        const y =
          (dot.y - frame * dot.speed + 1920) % 1920;

        const opacity =
          0.15 +
          (Math.sin(frame * 0.04 + i) + 1) * 0.13;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: dot.x,
              top: y,
              width: dot.size,
              height: dot.size,
              borderRadius: "50%",
              background: i % 4 === 0 ? COLORS.gold : COLORS.cyan,
              opacity,
              boxShadow: "0 0 12px currentColor",
            }}
          />
        );
      })}

      {/* Cinematic edge shade */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse, transparent 45%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}

/* =====================================================
   SCENE 1
   "अगर आप किसी के एक call पर हमेशा available रहोगे"
===================================================== */

function Scene1() {
  const frame = useCurrentFrame();

  const phoneScale = spring({
    frame: Math.max(0, frame - 12),
    fps: 30,
    config: { damping: 12, stiffness: 85 },
  });

  const ring = (frame * 3) % 220;

  return (
    <SceneShell duration={114}>
      <SceneLabel number="01" title="ALWAYS AVAILABLE" />

      <div
        style={{
          position: "absolute",
          top: 320,
          width: "100%",
        }}
      >
        <AnimatedText size={63}>
          अगर आप किसी के
        </AnimatedText>

        <div style={{ height: 18 }} />

        <AnimatedText
          start={12}
          size={110}
          color={COLORS.cyan}
        >
          एक CALL पर
        </AnimatedText>

        <AnimatedText
          start={22}
          size={68}
          color={COLORS.white}
        >
          हमेशा AVAILABLE रहोगे
        </AnimatedText>
      </div>

      {/* Phone visual */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 950,
          width: 290,
          height: 480,
          marginLeft: -145,
          borderRadius: 48,
          background:
            "linear-gradient(145deg,#1B2D44,#08101D)",
          border: "5px solid #56708F",
          boxShadow:
            "0 35px 90px rgba(0,0,0,0.6), 0 0 60px rgba(65,180,255,0.14)",
          transform: `scale(${phoneScale}) rotate(-7deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 19,
            left: "50%",
            width: 75,
            height: 8,
            marginLeft: -37,
            background: "#344963",
            borderRadius: 20,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 90,
            width: "100%",
            textAlign: "center",
            fontSize: 27,
            fontFamily: FONT,
            color: COLORS.white,
          }}
        >
          INCOMING CALL
        </div>

        <div
          style={{
            position: "absolute",
            top: 155,
            left: 85,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg,#214A73,#12243D)",
            border: "3px solid #6CEBFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.cyan,
            fontSize: 60,
          }}
        >
          ✦
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 65,
            left: 62,
            width: 65,
            height: 65,
            borderRadius: "50%",
            background: COLORS.red,
            boxShadow: "0 0 35px rgba(255,90,100,0.4)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 65,
            right: 62,
            width: 65,
            height: 65,
            borderRadius: "50%",
            background: COLORS.green,
            boxShadow: "0 0 35px rgba(80,230,170,0.5)",
          }}
        >
          <div
            style={{
              color: "#061910",
              fontSize: 32,
              textAlign: "center",
              marginTop: 13,
              fontWeight: 900,
            }}
          >
            ↗
          </div>
        </div>
      </div>

      {/* Expanding signal rings */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1150,
          width: 450 + ring,
          height: 450 + ring,
          marginLeft: -(450 + ring) / 2,
          borderRadius: "50%",
          border: "2px solid rgba(108,235,255,0.25)",
          opacity: interpolate(ring, [0, 220], [0.8, 0]),
        }}
      />
    </SceneShell>
  );
}

/* =====================================================
   SCENE 2
   "तो सामने वाला आपकी value करना बंद कर देगा"
===================================================== */

function Scene2() {
  const frame = useCurrentFrame();

  const value = interpolate(
    frame,
    [5, 75],
    [100, 12],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );

  return (
    <SceneShell duration={108}>
      <SceneLabel number="02" title="VALUE DROPS" />

      <div
        style={{
          position: "absolute",
          top: 340,
          width: "100%",
        }}
      >
        <AnimatedText size={65}>
          तो सामने वाला
        </AnimatedText>

        <AnimatedText
          start={8}
          size={105}
          color={COLORS.gold}
        >
          आपकी VALUE
        </AnimatedText>

        <AnimatedText
          start={18}
          size={63}
          color={COLORS.red}
        >
          करना बंद कर देगा!
        </AnimatedText>
      </div>

      {/* Value meter */}
      <div
        style={{
          position: "absolute",
          top: 1060,
          left: 120,
          width: 840,
          height: 35,
          borderRadius: 30,
          background: "#18263A",
          border: "1px solid #40536D",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            borderRadius: 30,
            background:
              "linear-gradient(90deg,#FFCB70,#FF667A)",
            boxShadow: "0 0 35px rgba(255,100,120,0.5)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1150,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 115,
          fontWeight: 900,
          color: COLORS.red,
        }}
      >
        {Math.round(value)}%
      </div>

      {/* Falling coins */}
      {Array.from({ length: 7 }, (_, i) => {
        const y = interpolate(
          frame,
          [0, 95],
          [-150 - i * 100, 1550 + i * 80]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 95 + i * 145,
              top: y,
              width: 65,
              height: 65,
              borderRadius: "50%",
              border: `3px solid ${COLORS.gold}`,
              background:
                "radial-gradient(circle at 35% 30%,#FFF1B3,#C68B2B)",
              boxShadow: "0 0 25px rgba(255,198,90,0.25)",
              opacity: 0.65,
            }}
          />
        );
      })}
    </SceneShell>
  );
}

/* =====================================================
   SCENE 3
   "जो चीज़ हर जगह free में मिले..."
===================================================== */

function Scene3() {
  const frame = useCurrentFrame();

  const cards = Array.from({ length: 9 }, (_, i) => {
    const x = 75 + (i % 3) * 315;
    const y = 720 + Math.floor(i / 3) * 185;
    const delay = i * 4;

    const p = spring({
      frame: Math.max(0, frame - delay),
      fps: 30,
      config: { damping: 13, stiffness: 90 },
    });

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 250,
          height: 130,
          borderRadius: 22,
          background:
            "linear-gradient(145deg,#1D3954,#0C1B30)",
          border: "1px solid rgba(108,235,255,0.35)",
          boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.cyan,
          fontFamily: FONT,
          fontSize: 40,
          fontWeight: 900,
          opacity: p,
          transform: `scale(${p}) rotate(${(i % 2 ? 1 : -1) * 4}deg)`,
        }}
      >
        FREE
      </div>
    );
  });

  return (
    <SceneShell duration={147}>
      <SceneLabel number="03" title="TOO COMMON" />

      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
        }}
      >
        <AnimatedText size={66}>
          क्योंकि जो चीज़
        </AnimatedText>

        <AnimatedText
          start={8}
          size={100}
          color={COLORS.cyan}
        >
          FREE में मिले
        </AnimatedText>

        <AnimatedText
          start={20}
          size={65}
        >
          लोग उसकी कद्र नहीं करते।
        </AnimatedText>
      </div>

      {cards}

      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 35,
          letterSpacing: 8,
          color: COLORS.muted,
          opacity: 0.8,
        }}
      >
        UNLIMITED ACCESS
      </div>
    </SceneShell>
  );
}

/* =====================================================
   SCENE 4
   "Gold इसलिए महंगा है क्योंकि वह rare है"
===================================================== */

function Scene4() {
  const frame = useCurrentFrame();

  const rotation = interpolate(
    frame,
    [0, 135],
    [-12, 12]
  );

  const scale = spring({
    frame: Math.max(0, frame - 8),
    fps: 30,
    config: { damping: 12, stiffness: 75 },
  });

  return (
    <SceneShell duration={135}>
      <SceneLabel number="04" title="SCARCITY EFFECT" />

      {/* Light rays */}
      <div
        style={{
          position: "absolute",
          top: 520,
          left: "50%",
          width: 700,
          height: 700,
          marginLeft: -350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(255,193,80,0.23),transparent 68%)",
          transform: `scale(${1 + Math.sin(frame * 0.06) * 0.08})`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
        }}
      >
        <AnimatedText size={70}>
          GOLD इसलिए
        </AnimatedText>

        <AnimatedText
          start={7}
          size={105}
          color={COLORS.gold}
        >
          महंगा है...
        </AnimatedText>
      </div>

      {/* 3D-style gold bar */}
      <div
        style={{
          position: "absolute",
          top: 820,
          left: "50%",
          width: 510,
          height: 240,
          marginLeft: -255,
          borderRadius: 35,
          background:
            "linear-gradient(135deg,#FFF2B3 0%,#E7B84E 24%,#A76B17 55%,#FFE19A 78%,#C98F2C 100%)",
          transform: `perspective(900px) rotateX(15deg) rotateY(${rotation}deg) scale(${scale})`,
          boxShadow:
            "0 50px 100px rgba(255,180,55,0.18), inset 0 4px 15px rgba(255,255,255,0.6)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 18,
            border: "2px solid rgba(103,62,7,0.4)",
            borderRadius: 25,
          }}
        />

        <div
          style={{
            color: "#67430B",
            fontFamily: FONT,
            fontWeight: 1000,
            fontSize: 65,
            textAlign: "center",
            marginTop: 75,
            letterSpacing: 8,
          }}
        >
          PURE GOLD
        </div>
      </div>

      {/* Rare reveal */}
      <div
        style={{
          position: "absolute",
          top: 1230,
          width: "100%",
          textAlign: "center",
        }}
      >
        <AnimatedText
          start={24}
          size={130}
          color={COLORS.gold}
        >
          RARE.
        </AnimatedText>

        <AnimatedText
          start={37}
          size={48}
          color={COLORS.white}
        >
          यही उसे valuable बनाता है।
        </AnimatedText>
      </div>
    </SceneShell>
  );
}

/* =====================================================
   SCENE 5
   "Robert Greene के 48 Laws of Power..."
===================================================== */

function Scene5() {
  const frame = useCurrentFrame();

  const open = interpolate(
    frame,
    [15, 100],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <SceneShell duration={171}>
      <SceneLabel number="05" title="THE POWER PRINCIPLE" />

      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
        }}
      >
        <AnimatedText size={60}>
          Robert Greene की
        </AnimatedText>

        <AnimatedText
          start={8}
          size={110}
          color={COLORS.gold}
        >
          48 LAWS
        </AnimatedText>

        <AnimatedText
          start={16}
          size={70}
        >
          OF POWER
        </AnimatedText>
      </div>

      {/* Book */}
      <div
        style={{
          position: "absolute",
          top: 900,
          left: "50%",
          width: 520,
          height: 490,
          marginLeft: -260,
          transform: `perspective(1000px) rotateY(${
            -15 + open * 25
          }deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Back cover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "12px 28px 28px 12px",
            background:
              "linear-gradient(145deg,#8D6425,#271A0C 70%)",
            boxShadow: "20px 30px 70px rgba(0,0,0,0.6)",
            border: "3px solid #C69A4D",
          }}
        />

        {/* Pages */}
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 14,
            right: 12,
            bottom: 14,
            background:
              "linear-gradient(90deg,#D7C5A0,#F5E5C7,#CBB78E)",
            transform: `rotateY(${open * -7}deg)`,
            transformOrigin: "left",
          }}
        />

        {/* Front title */}
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "2px solid rgba(255,211,120,0.65)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background:
              "linear-gradient(145deg,#302015,#100D0B)",
            color: COLORS.gold,
            fontFamily: FONT,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 34,
              letterSpacing: 7,
              marginBottom: 40,
            }}
          >
            ROBERT GREENE
          </div>

          <div
            style={{
              fontSize: 73,
              fontWeight: 900,
              lineHeight: 1.15,
            }}
          >
            48
            <br />
            LAWS
            <br />
            OF POWER
          </div>
        </div>
      </div>

      {/* Law number badge */}
      <div
        style={{
          position: "absolute",
          top: 1480,
          left: "50%",
          width: 255,
          height: 110,
          marginLeft: -127,
          borderRadius: 20,
          background:
            "linear-gradient(120deg,#FBD98B,#B87B24)",
          boxShadow: "0 0 65px rgba(255,191,79,0.25)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 15,
          fontFamily: FONT,
          color: "#261608",
        }}
      >
        <span style={{ fontSize: 29, fontWeight: 800 }}>
          LAW
        </span>

        <span style={{ fontSize: 65, fontWeight: 1000 }}>
          16
        </span>
      </div>
    </SceneShell>
  );
}

/* =====================================================
   SCENE 6
   "Use Absence to Increase Respect and Honor"
===================================================== */

function Scene6() {
  const frame = useCurrentFrame();

  const personOpacity = interpolate(
    frame,
    [15, 55, 85, 115],
    [1, 1, 0.15, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const spotlight = interpolate(
    frame,
    [0, 80, 150],
    [0.15, 0.8, 0.45],
    {
      extrapolateRight: "clamp",
    }
  );

  return (
    <SceneShell duration={150}>
      <SceneLabel number="06" title="LAW NUMBER 16" />

      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          textAlign: "center",
        }}
      >
        <AnimatedText size={65}>
          Use Absence
        </AnimatedText>

        <AnimatedText
          start={8}
          size={60}
          color={COLORS.gold}
        >
          to Increase
        </AnimatedText>

        <AnimatedText
          start={17}
          size={60}
        >
          Respect and Honor
        </AnimatedText>
      </div>

      {/* Spotlight */}
      <div
        style={{
          position: "absolute",
          top: 770,
          left: "50%",
          width: 750,
          height: 850,
          marginLeft: -375,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse,rgba(255,198,91,0.22),transparent 70%)",
          opacity: spotlight,
        }}
      />

      {/* Human silhouette */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1050,
          width: 190,
          height: 450,
          marginLeft: -95,
          opacity: personOpacity,
          transform: `translateY(${frame * 1.7}px) scale(${
            1 - frame * 0.002
          })`,
        }}
      >
        <div
          style={{
            width: 125,
            height: 125,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg,#E8C58A,#5D4426)",
            margin: "0 auto",
            boxShadow: "0 0 35px rgba(255,202,110,0.25)",
          }}
        />

        <div
          style={{
            width: 190,
            height: 280,
            marginTop: 15,
            borderRadius: "85px 85px 20px 20px",
            background:
              "linear-gradient(90deg,#253A50,#0C1726,#253A50)",
          }}
        />
      </div>

      {/* Expanding empty-space rings */}
      {Array.from({ length: 4 }, (_, i) => {
        const size = 300 + i * 180 + frame * 2.2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 1160,
              left: "50%",
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: "50%",
              border: "1px solid rgba(255,204,119,0.22)",
              opacity: interpolate(
                frame,
                [i * 7, 100 + i * 5],
                [0.7, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }
              ),
            }}
          />
        );
      })}
    </SceneShell>
  );
}

/* =====================================================
   SCENE 7
   "अगर respect चाहिए तो थोड़ा गायब रहना सीखो"
===================================================== */

function Scene7() {
  const frame = useCurrentFrame();

  const phoneX = interpolate(
    frame,
    [0, 55, 125],
    [0, 120, 230],
    {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <SceneShell duration={150}>
      <SceneLabel number="07" title="APPLY THE PRINCIPLE" />

      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
        }}
      >
        <AnimatedText size={60}>
          यानी अगर
        </AnimatedText>

        <AnimatedText
          start={7}
          size={105}
          color={COLORS.gold}
        >
          RESPECT चाहिए
        </AnimatedText>

        <AnimatedText
          start={18}
          size={62}
        >
          तो थोड़ा गायब रहना सीखो!
        </AnimatedText>
      </div>

      {/* Phone moves away */}
      <div
        style={{
          position: "absolute",
          top: 880,
          left: 155 + phoneX,
          width: 260,
          height: 430,
          borderRadius: 35,
          background:
            "linear-gradient(145deg,#263B53,#08121F)",
          border: "4px solid #617D9E",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
          transform: `rotate(${frame * 0.08 - 5}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT,
            color: COLORS.white,
            fontSize: 29,
          }}
        >
          NOTIFICATIONS
        </div>

        {["New Message", "Missed Call", "New Message"].map(
          (text, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 15,
                right: 15,
                top: 125 + i * 80,
                height: 60,
                borderRadius: 13,
                background: "#1C324C",
                color: COLORS.muted,
                fontFamily: FONT,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {text}
            </div>
          )
        )}
      </div>

      {/* Do not disturb badge */}
      <div
        style={{
          position: "absolute",
          top: 1390,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "25px 55px",
          borderRadius: 100,
          background:
            "linear-gradient(120deg,#1A3947,#10232F)",
          border: "2px solid rgba(108,235,255,0.55)",
          boxShadow: "0 0 45px rgba(108,235,255,0.2)",
          fontFamily: FONT,
          fontSize: 34,
          fontWeight: 800,
          color: COLORS.cyan,
          whiteSpace: "nowrap",
        }}
      >
        ◉  FOCUS MODE
      </div>
    </SceneShell>
  );
}

/* =====================================================
   SCENE 8
   "बताएंगे Part 2 में"
===================================================== */

function Scene8() {
  const frame = useCurrentFrame();

  const glow = 0.5 + Math.sin(frame * 0.1) * 0.15;

  const reveal = spring({
    frame: Math.max(0, frame - 12),
    fps: 30,
    config: { damping: 10, stiffness: 75 },
  });

  return (
    <SceneShell duration={90}>
      <SceneLabel number="08" title="COMING NEXT" />

      <div
        style={{
          position: "absolute",
          top: 440,
          width: "100%",
          textAlign: "center",
        }}
      >
        <AnimatedText size={60}>
          इस law को practically
        </AnimatedText>

        <AnimatedText
          start={8}
          size={73}
          color={COLORS.white}
        >
          कैसे use करें?
        </AnimatedText>
      </div>

      {/* Part 2 title */}
      <div
        style={{
          position: "absolute",
          top: 900,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: reveal,
          transform: `scale(${0.7 + reveal * 0.3})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 150,
            fontWeight: 1000,
            letterSpacing: -5,
            color: COLORS.gold,
            textShadow: `0 0 70px rgba(255,198,100,${glow})`,
          }}
        >
          PART 02
        </div>

        <div
          style={{
            width: 500,
            height: 5,
            margin: "25px auto",
            background:
              "linear-gradient(90deg,transparent,#FFD477,transparent)",
          }}
        />

        <div
          style={{
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 8,
            color: COLORS.cyan,
          }}
        >
          PRACTICAL APPLICATION
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 220,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 39,
          color: COLORS.white,
        }}
      >
        बताएंगे PART 2 में!
      </div>
    </SceneShell>
  );
}

/* =====================================================
   SCENE 9
   "आपका कौन सा दोस्त 24 घंटे online..."
===================================================== */

function Scene9() {
  const frame = useCurrentFrame();

  const comments = [
    "Online 24/7",
    "Typing...",
    "Last seen just now",
  ];

  return (
    <SceneShell duration={135}>
      <SceneLabel number="09" title="YOUR TURN" />

      <div
        style={{
          position: "absolute",
          top: 290,
          width: "100%",
        }}
      >
        <AnimatedText size={62}>
          वैसे आपका कौन सा
        </AnimatedText>

        <AnimatedText
          start={8}
          size={100}
          color={COLORS.gold}
        >
          DOST
        </AnimatedText>

        <AnimatedText
          start={15}
          size={58}
        >
          24 घंटे ONLINE रहता है?
        </AnimatedText>
      </div>

      {/* Chat bubbles */}
      {comments.map((comment, i) => {
        const p = spring({
          frame: Math.max(0, frame - (i * 13 + 10)),
          fps: 30,
          config: { damping: 13, stiffness: 100 },
        });

        return (
          <div
            key={comment}
            style={{
              position: "absolute",
              top: 830 + i * 160,
              left: i % 2 === 0 ? 110 : 350,
              width: 620,
              height: 105,
              borderRadius:
                i % 2 === 0
                  ? "30px 30px 30px 5px"
                  : "30px 30px 5px 30px",
              background:
                i % 2 === 0
                  ? "linear-gradient(120deg,#163B54,#10243A)"
                  : "linear-gradient(120deg,#3A2C19,#201A14)",
              border: `1px solid ${
                i % 2 === 0 ? "#398DA8" : "#9D7436"
              }`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: FONT,
              fontSize: 37,
              fontWeight: 750,
              color:
                i % 2 === 0
                  ? COLORS.cyan
                  : COLORS.gold,
              opacity: p,
              transform: `translateX(${
                (1 - p) * (i % 2 === 0 ? -100 : 100)
              }px)`,
              boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
            }}
          >
            {comment}
          </div>
        );
      })}

      {/* Comment CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 155,
          left: "50%",
          transform: `translateX(-50%) scale(${
            1 + Math.sin(frame * 0.09) * 0.035
          })`,
          padding: "28px 85px",
          borderRadius: 100,
          background:
            "linear-gradient(110deg,#FFD477,#E5A53E)",
          boxShadow: "0 0 65px rgba(255,195,89,0.35)",
          fontFamily: FONT,
          color: "#211406",
          fontSize: 43,
          fontWeight: 1000,
          whiteSpace: "nowrap",
        }}
      >
        COMMENT BELOW ↓
      </div>
    </SceneShell>
  );
}

/* =====================================================
   MAIN COMPOSITION
===================================================== */

const Reel: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: FONT,
      }}
    >
      <Atmosphere />

      {/* Scene 1: 0s - 3.8s */}
      <Sequence from={0} durationInFrames={114} layout="none">
        <Scene1 />
      </Sequence>

      {/* Scene 2: 3.8s - 7.4s */}
      <Sequence from={114} durationInFrames={108} layout="none">
        <Scene2 />
      </Sequence>

      {/* Scene 3: 7.4s - 12.3s */}
      <Sequence from={222} durationInFrames={147} layout="none">
        <Scene3 />
      </Sequence>

      {/* Scene 4: 12.3s - 16.8s */}
      <Sequence from={369} durationInFrames={135} layout="none">
        <Scene4 />
      </Sequence>

      {/* Scene 5: 16.8s - 22.5s */}
      <Sequence from={504} durationInFrames={171} layout="none">
        <Scene5 />
      </Sequence>

      {/* Scene 6: 22.5s - 27.5s */}
      <Sequence from={675} durationInFrames={150} layout="none">
        <Scene6 />
      </Sequence>

      {/* Scene 7: 27.5s - 32.5s */}
      <Sequence from={825} durationInFrames={150} layout="none">
        <Scene7 />
      </Sequence>

      {/* Scene 8: 32.5s - 35.5s */}
      <Sequence from={975} durationInFrames={90} layout="none">
        <Scene8 />
      </Sequence>

      {/* Scene 9: 35.5s - 40s */}
      <Sequence from={1065} durationInFrames={135} layout="none">
        <Scene9 />
      </Sequence>

      {/* Sound effect timeline */}
      <Sound at={2} type="whoosh" volume={0.35} />
      <Sound at={108} type="impact" volume={0.35} />

      <Sound at={225} type="pop" volume={0.3} />
      <Sound at={260} type="pop" volume={0.25} />
      <Sound at={300} type="pop" volume={0.25} />

      <Sound at={370} type="whoosh" volume={0.4} />
      <Sound at={400} type="impact" volume={0.45} />

      <Sound at={510} type="whoosh" volume={0.35} />
      <Sound at={560} type="impact" volume={0.4} />

      <Sound at={680} type="ping" volume={0.25} />
      <Sound at={725} type="whoosh" volume={0.35} />

      <Sound at={830} type="whoosh" volume={0.35} />
      <Sound at={875} type="tick" volume={0.25} />

      <Sound at={980} type="impact" volume={0.35} />
      <Sound at={990} type="whoosh" volume={0.3} />

      <Sound at={1070} type="pop" volume={0.35} />
      <Sound at={1115} type="ping" volume={0.3} />
    </AbsoluteFill>
  );
};

/* =====================================================
   REMOTION ROOT
===================================================== */

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={DURATION}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};

registerRoot(RemotionRoot);
