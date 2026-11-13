import React from "react";
import {
  AbsoluteFill,
  Composition,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ==========================================
// 1. PERSISTENT BLUEPRINT GRID BACKGROUND
// ==========================================
const BlueprintGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = (frame / 60).toFixed(2);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050A14",
        overflow: "hidden",
        fontFamily: "monospace",
        color: "#22D3EE",
      }}
    >
      {/* Minor & Major SVG Grid */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.25,
        }}
      >
        <defs>
          <pattern
            id="smallGrid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#0EA5E9"
              strokeWidth="0.75"
            />
          </pattern>
          <pattern
            id="grid"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            <rect width="200" height="200" fill="url(#smallGrid)" />
            <path
              d="M 200 0 L 0 0 0 200"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Radial Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 35%, rgba(2, 6, 23, 0.9) 100%)",
        }}
      />

      {/* Technical Safe-Zone Frame */}
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 64,
          bottom: 96,
          border: "1px solid rgba(6, 182, 212, 0.25)",
          pointerEvents: "none",
        }}
      >
        {/* Corner Brackets */}
        <div
          style={{
            position: "absolute",
            top: -2,
            left: -2,
            width: 24,
            height: 24,
            borderTop: "4px solid #22D3EE",
            borderLeft: "4px solid #22D3EE",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 24,
            height: 24,
            borderTop: "4px solid #22D3EE",
            borderRight: "4px solid #22D3EE",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -2,
            left: -2,
            width: 24,
            height: 24,
            borderBottom: "4px solid #22D3EE",
            borderLeft: "4px solid #22D3EE",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 24,
            height: 24,
            borderBottom: "4px solid #22D3EE",
            borderRight: "4px solid #22D3EE",
          }}
        />

        {/* Top HUD Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            fontSize: 20,
            letterSpacing: "0.15em",
            color: "rgba(103, 232, 249, 0.75)",
            borderBottom: "1px solid rgba(6, 182, 212, 0.2)",
          }}
        >
          <span>SYS // NEURAL_OPTICS_04</span>
          <span>T+{seconds}s</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==========================================
// 2. SCENE 1: HOOK (0 - 300 frames | 0:00 - 0:05)
// ==========================================
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleIn = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 130 },
  });

  const minutesCount = Math.round(
    interpolate(frame, [5, 55], [0, 40], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const cycle = frame % 75;
  const shutterClosed = cycle > 45 && cycle < 62;
  const pulseOpacity = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.55, 1]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 64px",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Badge */}
      <div
        style={{
          transform: `scale(${scaleIn})`,
          padding: "10px 28px",
          marginBottom: 40,
          borderRadius: 999,
          border: "2px solid rgba(244, 63, 94, 0.7)",
          backgroundColor: "rgba(76, 5, 25, 0.6)",
          color: "#FB7185",
          fontFamily: "monospace",
          fontSize: 24,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        Daily Vision Blackout
      </div>

      {/* Big Counter */}
      <div
        style={{
          transform: `scale(${scaleIn})`,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        <div
          style={{
            fontSize: 150,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            textShadow: "0 0 30px rgba(34, 211, 238, 0.55)",
          }}
        >
          {minutesCount} MIN
        </div>
        <div
          style={{
            fontSize: 36,
            fontFamily: "monospace",
            letterSpacing: "0.25em",
            color: "#22D3EE",
            marginTop: 14,
          }}
        >
          EVERY SINGLE DAY
        </div>
      </div>

      {/* Wireframe Eye SVG */}
      <div
        style={{
          position: "relative",
          width: 680,
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "24px 0",
        }}
      >
        <svg
          viewBox="0 0 600 300"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <path
            d="M 40 150 Q 300 -30 560 150 Q 300 330 40 150 Z"
            fill="rgba(8, 145, 178, 0.08)"
            stroke="#22D3EE"
            strokeWidth="5"
          />
          <circle
            cx="300"
            cy="150"
            r="78"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="4"
            strokeDasharray="14 8"
          />
          <circle
            cx="300"
            cy="150"
            r="34"
            fill={shutterClosed ? "#F43F5E" : "#22D3EE"}
          />

          {shutterClosed && (
            <g>
              <path
                d="M 40 150 Q 300 -30 560 150 Q 300 330 40 150 Z"
                fill="rgba(244, 63, 94, 0.3)"
              />
              <line
                x1="90"
                y1="230"
                x2="510"
                y2="70"
                stroke="#F43F5E"
                strokeWidth="8"
              />
            </g>
          )}
        </svg>

        {/* BLIND Warning Tag */}
        <div
          style={{
            opacity: shutterClosed ? 1 : pulseOpacity,
            position: "absolute",
            bottom: -24,
            padding: "12px 32px",
            borderRadius: 10,
            fontFamily: "monospace",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.18em",
            border: shutterClosed
              ? "2px solid #FDA4AF"
              : "2px solid rgba(244, 63, 94, 0.6)",
            backgroundColor: shutterClosed
              ? "#E11D48"
              : "rgba(15, 23, 42, 0.92)",
            color: shutterClosed ? "#FFFFFF" : "#FB7185",
            boxShadow: shutterClosed
              ? "0 0 30px rgba(244, 63, 94, 0.8)"
              : "none",
          }}
        >
          {shutterClosed ? "SIGNAL: BLIND" : "STATUS: LEGALLY BLIND"}
        </div>
      </div>

      {/* Bottom Hook Caption */}
      <p
        style={{
          marginTop: 68,
          textAlign: "center",
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 1.35,
          color: "#E2E8F0",
          maxWidth: 820,
        }}
      >
        Par aapka dimaag aapko ye{" "}
        <span style={{ color: "#22D3EE", textDecoration: "underline" }}>
          kabhi pata nahi
        </span>{" "}
        chalne deta.
      </p>
    </div>
  );
};

// ==========================================
// 3. SCENE 2: MOTION BLUR (300 - 660 frames | 0:05 - 0:11)
// ==========================================
const Scene2Blur: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const jump1 = spring({
    frame: frame - 35,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const jump2 = spring({
    frame: frame - 140,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const jump3 = spring({
    frame: frame - 245,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const normalizedPos = jump1 - jump2 + jump3;
  const eyeX = interpolate(normalizedPos, [0, 1], [-230, 230]);

  const isMoving =
    (frame > 35 && frame < 55) ||
    (frame > 140 && frame < 160) ||
    (frame > 245 && frame < 265);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 56px",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontFamily: "monospace",
          letterSpacing: "0.25em",
          color: "#22D3EE",
          marginBottom: 24,
        }}
      >
        EYE MOVEMENT // SACCADE
      </div>

      <h2
        style={{
          fontSize: 64,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.15,
          margin: "0 0 60px 0",
        }}
      >
        SHAKY CAMERA
        <span style={{ color: "#F43F5E", display: "block", marginTop: 8 }}>
          MOTION BLUR
        </span>
      </h2>

      {/* Target A & Target B Box */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 880,
          height: 460,
          borderRadius: 24,
          border: "1px solid rgba(6, 182, 212, 0.35)",
          backgroundColor: "rgba(2, 6, 23, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Target A */}
        <div
          style={{
            position: "absolute",
            left: 48,
            top: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "4px solid #22D3EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <span
            style={{
              marginTop: 8,
              fontFamily: "monospace",
              fontSize: 18,
              color: "#67E8F9",
            }}
          >
            TARGET A
          </span>
        </div>

        {/* Target B */}
        <div
          style={{
            position: "absolute",
            right: 48,
            top: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "4px solid #FBBF24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              fontSize: 26,
              fontWeight: 700,
              color: "#FCD34D",
            }}
          >
            B
          </div>
          <span
            style={{
              marginTop: 8,
              fontFamily: "monospace",
              fontSize: 18,
              color: "#FCD34D",
            }}
          >
            TARGET B
          </span>
        </div>

        {/* Motion Blur Streaks */}
        {isMoving && (
          <div
            style={{
              position: "absolute",
              left: 96,
              right: 96,
              height: 96,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: 0.8,
            }}
          >
            <div
              style={{
                height: 8,
                background:
                  "linear-gradient(90deg, #22D3EE, #F43F5E, #FBBF24)",
                borderRadius: 999,
                filter: "blur(2px)",
              }}
            />
            <div
              style={{
                height: 12,
                background:
                  "linear-gradient(90deg, transparent, #FFFFFF, transparent)",
                borderRadius: 999,
                filter: "blur(3px)",
              }}
            />
            <div
              style={{
                height: 8,
                background:
                  "linear-gradient(90deg, #FBBF24, #F43F5E, #22D3EE)",
                borderRadius: 999,
                filter: "blur(2px)",
              }}
            />
          </div>
        )}

        {/* Moving Eyeball Unit */}
        <div
          style={{
            transform: `translateX(${eyeX}px)`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 176,
              height: 176,
              borderRadius: "50%",
              border: "4px solid #22D3EE",
              backgroundColor: "#0F172A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(34, 211, 238, 0.35)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: "4px solid #7DD3FC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: "#67E8F9",
                }}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "6px 18px",
              borderRadius: 6,
              backgroundColor: "#083344",
              border: "1px solid rgba(6, 182, 212, 0.5)",
              fontFamily: "monospace",
              fontSize: 20,
            }}
          >
            {normalizedPos < 0.5 ? "LOCK: POINT A" : "LOCK: POINT B"}
          </div>
        </div>
      </div>

      {/* Bottom Warning Box */}
      <div
        style={{
          marginTop: 56,
          padding: "20px 36px",
          borderRadius: 14,
          border: "1px solid rgba(244, 63, 94, 0.45)",
          backgroundColor: "rgba(76, 5, 25, 0.35)",
          fontFamily: "monospace",
          fontSize: 24,
          color: "#FDA4AF",
          textAlign: "center",
        }}
      >
        RAW OPTIC INPUT = UNUSABLE BLUR
      </div>
    </div>
  );
};

// ==========================================
// 4. SCENE 3: SACCADIC MASKING (660 - 1080 frames | 0:11 - 0:18)
// ==========================================
const Scene3Masking: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  const cutProgress = spring({
    frame: frame - 95,
    fps,
    config: { damping: 11, stiffness: 160 },
  });

  const isMuted = frame >= 95;
  const switchAngle = interpolate(cutProgress, [0, 1], [0, -38]);
  const dashOffset = -(frame * 4);

  return (
    <div
      style={{
        transform: `scale(${0.92 + zoom * 0.08})`,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 56px",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontFamily: "monospace",
          letterSpacing: "0.25em",
          color: "#22D3EE",
          marginBottom: 16,
        }}
      >
        NEURAL DEFENSE MECHANISM
      </div>

      <h2
        style={{
          fontSize: 64,
          fontWeight: 900,
          textAlign: "center",
          margin: "0 0 48px 0",
        }}
      >
        LIVE FEED <span style={{ color: "#F43F5E" }}>MUTED</span>
      </h2>

      {/* Optic Nerve Schematic SVG */}
      <div
        style={{
          width: "100%",
          maxWidth: 780,
          backgroundColor: "rgba(2, 6, 23, 0.85)",
          border: "1px solid rgba(6, 182, 212, 0.35)",
          borderRadius: 28,
          padding: 40,
        }}
      >
        <svg
          viewBox="0 0 600 620"
          style={{ width: "100%", height: "auto", overflow: "visible" }}
        >
          <rect
            x="150"
            y="20"
            width="300"
            height="90"
            rx="16"
            fill="#0F172A"
            stroke="#22D3EE"
            strokeWidth="4"
          />
          <text
            x="300"
            y="75"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="30"
            fontWeight="bold"
            fontFamily="monospace"
          >
            OPTIC SENSOR
          </text>

          <line
            x1="300"
            y1="110"
            x2="300"
            y2="240"
            stroke="#22D3EE"
            strokeWidth="6"
            strokeDasharray="16 12"
            strokeDashoffset={dashOffset}
          />

          <circle cx="300" cy="240" r="14" fill="#22D3EE" />
          <g transform={`translate(300, 350) rotate(${switchAngle})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-110"
              stroke={isMuted ? "#F43F5E" : "#22D3EE"}
              strokeWidth="10"
              strokeLinecap="round"
            />
          </g>
          <circle
            cx="300"
            cy="350"
            r="14"
            fill={isMuted ? "#F43F5E" : "#22D3EE"}
          />

          <text
            x="345"
            y="305"
            fill={isMuted ? "#FB7185" : "#38BDF8"}
            fontSize="24"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {isMuted ? "GATE: OPEN (MUTED)" : "GATE: CLOSED"}
          </text>

          <line
            x1="300"
            y1="350"
            x2="300"
            y2="490"
            stroke={isMuted ? "#334155" : "#22D3EE"}
            strokeWidth="6"
            strokeDasharray={isMuted ? "10 14" : "16 12"}
            strokeDashoffset={isMuted ? 0 : dashOffset}
          />

          <rect
            x="130"
            y="490"
            width="340"
            height="100"
            rx="16"
            fill={isMuted ? "#1E1B2E" : "#0F172A"}
            stroke={isMuted ? "#F43F5E" : "#22D3EE"}
            strokeWidth="4"
          />
          <text
            x="300"
            y="550"
            textAnchor="middle"
            fill={isMuted ? "#FDA4AF" : "#FFFFFF"}
            fontSize="30"
            fontWeight="bold"
            fontFamily="monospace"
          >
            VISUAL CORTEX
          </text>
        </svg>
      </div>

      {/* Scientific Term Callout Card */}
      <div
        style={{
          opacity: cutProgress,
          transform: `translateY(${interpolate(cutProgress, [0, 1], [30, 0])}px)`,
          marginTop: 48,
          padding: "24px 44px",
          borderRadius: 20,
          backgroundColor: "rgba(8, 51, 68, 0.92)",
          border: "2px solid #22D3EE",
          boxShadow: "0 0 40px rgba(34, 211, 238, 0.35)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontFamily: "monospace",
            color: "#67E8F9",
            letterSpacing: "0.2em",
            marginBottom: 6,
          }}
        >
          PHENOMENON IDENTIFIED
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 900,
            letterSpacing: "0.04em",
            color: "#FFFFFF",
          }}
        >
          SACCADIC MASKING
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. SCENE 4: TIMELINE PATCH (1080 - 1560 frames | 0:18 - 0:26)
// ==========================================
const Scene4Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const copyProgress = spring({
    frame: frame - 110,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const isPatched = copyProgress > 0.85;

  const cloneX = interpolate(copyProgress, [0, 1], [285, 0]);
  const cloneY = interpolate(copyProgress, [0, 0.5, 1], [0, -170, 0]);
  const cloneOpacity = interpolate(frame, [95, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 48px",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontFamily: "monospace",
          letterSpacing: "0.25em",
          color: "#22D3EE",
          marginBottom: 16,
        }}
      >
        MEMORY RECONSTRUCTION
      </div>

      <h2
        style={{
          fontSize: 60,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.15,
          margin: "0 0 24px 0",
        }}
      >
        BRAIN <span style={{ color: "#22D3EE" }}>COPY-PASTES</span>
        <br />
        THE FUTURE FRAME
      </h2>

      <p
        style={{
          fontSize: 32,
          color: "#CBD5E1",
          textAlign: "center",
          maxWidth: 740,
          margin: "0 0 72px 0",
          lineHeight: 1.4,
        }}
      >
        Andhera dikhane ke bajaye, dimaag agle frame ko peeche paste kar deta
        hai.
      </p>

      {/* Blueprint Timeline Track */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 880,
          padding: "88px 28px",
          borderRadius: 28,
          border: "1px solid rgba(6, 182, 212, 0.35)",
          backgroundColor: "rgba(2, 6, 23, 0.85)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            fontFamily: "monospace",
            color: "#94A3B8",
            marginBottom: 24,
            padding: "0 8px",
          }}
        >
          <span>00:00.00</span>
          <span>TIMELINE BUFFER</span>
          <span>00:00.08</span>
        </div>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
            height: 220,
          }}
        >
          {/* Slot 1: Frame A */}
          <div
            style={{
              borderRadius: 18,
              border: "2px solid rgba(6, 182, 212, 0.65)",
              backgroundColor: "rgba(8, 51, 68, 0.45)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 20,
                color: "#67E8F9",
              }}
            >
              T - 1
            </span>
            <span style={{ fontSize: 32, fontWeight: 900, marginTop: 8 }}>
              FRAME A
            </span>
          </div>

          {/* Slot 2: Missing Blind Gap */}
          <div
            style={{
              borderRadius: 18,
              border: isPatched
                ? "2px dashed #34D399"
                : "2px dashed #F43F5E",
              backgroundColor: isPatched
                ? "rgba(6, 78, 59, 0.3)"
                : "rgba(76, 5, 25, 0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 20,
                color: "#FB7185",
              }}
            >
              BLIND GAP
            </span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#FDA4AF",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              40ms MISSING
            </span>
          </div>

          {/* Slot 3: Frame B */}
          <div
            style={{
              borderRadius: 18,
              border: "2px solid #FBBF24",
              backgroundColor: "rgba(69, 26, 3, 0.45)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              boxShadow: "0 0 25px rgba(251, 191, 36, 0.25)",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 20,
                color: "#FCD34D",
              }}
            >
              T + 1
            </span>
            <span
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#FDE68A",
                marginTop: 8,
              }}
            >
              FRAME B
            </span>
          </div>

          {/* Animated Cloned Frame B */}
          <div
            style={{
              opacity: cloneOpacity,
              transform: `translate(${cloneX}px, ${cloneY}px)`,
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "34.1%",
              width: "31.8%",
              borderRadius: 18,
              border: "4px solid #67E8F9",
              backgroundColor: "rgba(6, 182, 212, 0.28)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              boxShadow: "0 0 35px rgba(34, 211, 238, 0.65)",
            }}
          >
            <span
              style={{
                padding: "4px 14px",
                borderRadius: 6,
                backgroundColor: "#22D3EE",
                color: "#020617",
                fontFamily: "monospace",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              PASTED
            </span>
            <span
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#FFFFFF",
                marginTop: 8,
              }}
            >
              FRAME B
            </span>
          </div>
        </div>
      </div>

      {/* Status Confirmation */}
      <div
        style={{
          opacity: copyProgress,
          marginTop: 56,
          padding: "18px 36px",
          borderRadius: 14,
          border: "1px solid rgba(52, 211, 153, 0.5)",
          backgroundColor: "rgba(6, 78, 59, 0.45)",
          fontFamily: "monospace",
          fontSize: 24,
          color: "#6EE7B7",
        }}
      >
        GAP PATCHED // SEAMLESS ILLUSION
      </div>
    </div>
  );
};

// ==========================================
// 6. SCENE 5: PAYOFF (1560 - 2100 frames | 0:26 - 0:35)
// ==========================================
const Scene5Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const strikeWidth = interpolate(frame, [25, 65], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const reveal = spring({
    frame: frame - 75,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const ringScale = 1 + Math.sin(frame * 0.08) * 0.04;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 56px",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Crossed-out "LIVE REALITY" */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          marginBottom: 56,
          padding: "16px 36px",
          borderRadius: 14,
          border: "1px solid #334155",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
        }}
      >
        <span
          style={{
            fontSize: 38,
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#94A3B8",
          }}
        >
          LIVE REALITY
        </span>
        <div
          style={{
            width: `${strikeWidth}%`,
            position: "absolute",
            left: 0,
            top: "50%",
            height: 8,
            backgroundColor: "#F43F5E",
            transform: "translateY(-50%)",
            boxShadow: "0 0 15px #F43F5E",
          }}
        />
      </div>

      {/* Main Payoff Card */}
      <div
        style={{
          opacity: reveal,
          transform: `scale(${0.85 + reveal * 0.15})`,
          width: "100%",
          maxWidth: 780,
          borderRadius: 32,
          border: "2px solid #22D3EE",
          background:
            "linear-gradient(180deg, rgba(8, 51, 68, 0.85) 0%, rgba(2, 6, 23, 0.96) 100%)",
          padding: 56,
          textAlign: "center",
          boxShadow: "0 0 60px rgba(34, 211, 238, 0.32)",
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontFamily: "monospace",
            letterSpacing: "0.28em",
            color: "#67E8F9",
            marginBottom: 24,
          }}
        >
          YOUR PERCEPTION IS AN
        </div>

        <h1
          style={{
            fontSize: 88,
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            margin: 0,
            textShadow: "0 0 25px rgba(255, 255, 255, 0.35)",
          }}
        >
          EDITED
          <span style={{ display: "block", color: "#22D3EE", marginTop: 8 }}>
            FLASHBACK
          </span>
        </h1>

        {/* Pulsing Neural Wave */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <svg
            style={{ transform: `scale(${ringScale})` }}
            width="220"
            height="120"
            viewBox="0 0 220 120"
          >
            <path
              d="M 10 60 Q 45 10, 80 60 T 150 60 T 210 60"
              fill="none"
              stroke="#22D3EE"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 10 60 Q 45 110, 80 60 T 150 60 T 210 60"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3"
              opacity="0.5"
            />
          </svg>
        </div>

        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid rgba(6, 182, 212, 0.3)",
            fontFamily: "monospace",
            fontSize: 24,
            color: "#CBD5E1",
          }}
        >
          40 MIN/DAY • SACCADIC MASKING
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. MAIN COMPOSITION & REMOTION ROOT
// ==========================================
export const SaccadicMaskingVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050A14" }}>
      <BlueprintGrid />

      <Sequence from={0} durationInFrames={300}>
        <Scene1Hook />
      </Sequence>

      <Sequence from={300} durationInFrames={360}>
        <Scene2Blur />
      </Sequence>

      <Sequence from={660} durationInFrames={420}>
        <Scene3Masking />
      </Sequence>

      <Sequence from={1080} durationInFrames={480}>
        <Scene4Timeline />
      </Sequence>

      <Sequence from={1560} durationInFrames={540}>
        <Scene5Payoff />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SaccadicMasking"
        component={SaccadicMaskingVideo}
        durationInFrames={2100}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};

export default RemotionRoot;
