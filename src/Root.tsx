import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  random,
} from 'remotion';

const VOICE = "hi-IN-MadhurNeural";

const SCENES = [
  { start: 0, duration: 4, text: "Agar duniya se oxygen sirf paanch second ke liye gayab ho jaye, toh kya aap saans rok kar bach jaoge?", tts: "अगर दुनिया से ऑक्सीजन सिर्फ पांच सेकंड के लिए गायब हो जाए, तो क्या आप सांस रोक कर बच जाओगे?" },
  { start: 4, duration: 4, text: "Bilkul nahi! Asli tabahi aapke fefdon mein nahi, balki aapke chaaron taraf hogi.", tts: "बिलकुल नहीं! असली तबाही आपके फेफड़ों में नहीं, बल्कि आपके चारों तरफ होगी।" },
  { start: 8, duration: 4, text: "Hoover Dam aur har concrete building ek pal mein dhool ban kar gir jayegi, kyunki oxygen hi concrete ko jod kar rakhta hai.", tts: "हूवर डैम और हर कंक्रीट बिल्डिंग एक पल में धूल बन कर गिर जाएगी, क्योंकि ऑक्सीजन ही कंक्रीट को जोड़ कर रखता है।" },
  { start: 12, duration: 4, text: "Hawa ka pressure achanak ikkis percent gir jayega, jisse har insaan ke kaan ke parde turant phat jayenge.", tts: "हवा का प्रेशर अचानक इक्कीस परसेंट गिर जाएगा, जिससे हर इंसान के कान के पर्दे तुरंत फट जाएंगे।" },
  { start: 16, duration: 4, text: "Din mein hi aasman poora kaala ho jayega, aur bina aag ke saari gaadiyan aur udte huye planes band ho jayenge.", tts: "दिन में ही आसमान पूरा काला हो जाएगा, और बिना आग के सारी गाड़ियां और उड़ते हुए प्लेन्स बंद हो जाएंगे।" },
  { start: 20, duration: 4, text: "Yani paanch second baad jab oxygen wapas aayegi, tab tak poori duniya khatam ho chuki hogi.", tts: "यानी पांच सेकंड बाद जब ऑक्सीजन वापस आएगी, तब तक पूरी दुनिया खत्म हो चुकी होगी।" }
];

const W = 1080;
const H = 1920;

const clamp01 = (val: number) => Math.max(0, Math.min(1, val));

const BackgroundParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 75 }, (_, i) => {
    const x = random(`bg-x-${i}`) * W;
    const y = random(`bg-y-${i}`) * H;
    const speed = 0.5 + random(`bg-s-${i}`) * 1.8;
    const size = 1.5 + random(`bg-r-${i}`) * 3.5;
    const alpha = 0.15 + random(`bg-a-${i}`) * 0.45;
    return (
      <circle
        key={i}
        cx={(x + Math.sin(frame * 0.02 + i) * 20 + W) % W}
        cy={(y - frame * speed + H * 10) % H}
        r={size}
        fill={i % 4 === 0 ? '#ff6b4a' : '#64e1ff'}
        opacity={alpha}
      />
    );
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 1 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {dots}
      </svg>
    </AbsoluteFill>
  );
};

const TopTelemetryDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const o2Level = interpolate(frame, [0, 90, 140, 1440], [20.9, 20.9, 0.0, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pressureKpa = interpolate(frame, [0, 720, 820, 1440], [101.3, 101.3, 79.8, 79.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pressureDropPct = interpolate(frame, [0, 720, 820, 1440], [0, 0, -21, -21], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const concreteIntegrity = interpolate(frame, [0, 480, 650, 1440], [100, 100, 0, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const uvIndex = interpolate(frame, [0, 960, 1100, 1440], [3, 18, 450, 500], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const timerSec = interpolate(frame, [120, durationInFrames], [5.0, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isCritical = frame > 125;
  const pulse = 0.65 + Math.sin(frame * 0.25) * 0.35;

  const cards = [
    {
      label: 'OXYGEN (O₂)',
      value: `${o2Level.toFixed(1)}%`,
      sub: o2Level < 1 ? 'DEPLETED // ZERO' : 'NORMAL AIR',
      pct: o2Level / 20.9,
      color: o2Level < 5 ? '#ff3b4e' : '#38e8ff',
    },
    {
      label: 'AIR PRESSURE',
      value: `${pressureKpa.toFixed(1)} kPa`,
      sub: `${Math.round(pressureDropPct)}% DROP`,
      pct: pressureKpa / 101.3,
      color: pressureDropPct < -5 ? '#ff9f43' : '#38e8ff',
    },
    {
      label: 'CONCRETE BONDS',
      value: `${Math.round(concreteIntegrity)}%`,
      sub: concreteIntegrity < 20 ? 'CRUMBLING TO DUST' : 'Si-O-Ca STABLE',
      pct: concreteIntegrity / 100,
      color: concreteIntegrity < 50 ? '#ff5252' : '#4cd137',
    },
    {
      label: 'SOLAR UV / SKY',
      value: `${Math.round(uvIndex)} W/m²`,
      sub: frame > 960 ? 'BLACK SKY // NO O₃' : 'OZONE ACTIVE',
      pct: Math.min(1, uvIndex / 500),
      color: uvIndex > 50 ? '#ff3b4e' : '#a55eea',
    },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 64,
        left: 48,
        right: 48,
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          background: 'rgba(6, 12, 26, 0.88)',
          border: `2px solid ${isCritical ? 'rgba(255, 62, 85, 0.85)' : 'rgba(66, 224, 255, 0.65)'}`,
          borderRadius: 14,
          boxShadow: isCritical
            ? '0 0 28px rgba(255, 45, 75, 0.35)'
            : '0 0 22px rgba(56, 232, 255, 0.2)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: isCritical ? '#ff334b' : '#26de81',
              opacity: isCritical ? pulse : 1,
              boxShadow: `0 0 14px ${isCritical ? '#ff334b' : '#26de81'}`,
            }}
          />
          <span
            style={{
              color: '#d8f3ff',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 3.5,
            }}
          >
            PLANETARY TELEMETRY // LIVE
          </span>
        </div>
        <div
          style={{
            padding: '6px 18px',
            borderRadius: 8,
            background: isCritical ? 'rgba(255, 42, 70, 0.25)' : 'rgba(56, 232, 255, 0.15)',
            border: `1.5px solid ${isCritical ? '#ff4757' : '#38e8ff'}`,
            color: isCritical ? '#ff6b81' : '#70f3ff',
            fontSize: 25,
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 2,
          }}
        >
          T-MINUS: 0{timerSec.toFixed(2)}s
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              padding: '16px 20px',
              background: 'rgba(8, 15, 30, 0.84)',
              border: `1.5px solid ${c.color}88`,
              borderRadius: 12,
              boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ color: '#9ab8d4', fontSize: 17, fontWeight: 800, letterSpacing: 2 }}>
                {c.label}
              </span>
              <span style={{ color: c.color, fontSize: 15, fontWeight: 800, letterSpacing: 1 }}>
                {c.sub}
              </span>
            </div>
            <div
              style={{
                color: '#ffffff',
                fontSize: 34,
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 0 14px ${c.color}77`,
                marginBottom: 10,
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${clamp01(c.pct) * 100}%`,
                  height: '100%',
                  background: c.color,
                  boxShadow: `0 0 10px ${c.color}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CameraRig: React.FC<{ children: React.ReactNode; sceneIndex: number }> = ({
  children,
  sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 85, mass: 0.85 },
  });

  const scale = interpolate(enter, [0, 1], [1.1, 1.0]);
  const shakeAmp =
    sceneIndex === 0
      ? interpolate(frame, [110, 145, 220], [0, 14, 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : sceneIndex === 2
        ? interpolate(frame, [30, 95, 230], [2, 18, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        : sceneIndex === 3
          ? interpolate(frame, [50, 110, 220], [0, 15, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          : sceneIndex === 5
            ? interpolate(frame, [10, 100, 240], [6, 22, 10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : 3;

  const dx = Math.sin(frame * 1.6) * shakeAmp;
  const dy = Math.cos(frame * 1.25) * shakeAmp * 0.7;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          transformOrigin: '50% 54%',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* SCENE 1: O2 Molecule Vanishing */
const Scene1OxygenHook: React.FC = () => {
  const frame = useCurrentFrame();
  const vanish = interpolate(frame, [115, 155], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shockR = interpolate(frame, [120, 200], [40, 520], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shockAlpha = interpolate(frame, [120, 145, 205], [0, 0.95, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const orbitDeg = frame * 3.2;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 55%, #0d2b45 0%, #050a14 70%)',
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <circle
          cx="540"
          cy="1020"
          r="330"
          fill="none"
          stroke={frame > 120 ? '#ff3b4e' : '#38e8ff'}
          strokeWidth="3"
          strokeDasharray="16 14"
          opacity="0.45"
          transform={`rotate(${frame * 0.5} 540 1020)`}
        />
        <circle
          cx="540"
          cy="1020"
          r="250"
          fill="none"
          stroke="#54a0ff"
          strokeWidth="2"
          opacity="0.3"
          transform={`rotate(${-frame * 0.8} 540 1020)`}
        />

        <g
          opacity={vanish}
          transform={`translate(540 1020) scale(${0.6 + vanish * 0.4}) translate(-540 -1020)`}
        >
          <line x1="390" y1="1000" x2="690" y2="1000" stroke="#70f3ff" strokeWidth="14" />
          <line x1="390" y1="1040" x2="690" y2="1040" stroke="#70f3ff" strokeWidth="14" />

          <circle
            cx="380"
            cy="1020"
            r="105"
            fill="#1289a7"
            stroke="#70f3ff"
            strokeWidth="8"
            style={{ filter: 'drop-shadow(0 0 30px #38e8ff)' }}
          />
          <text x="380" y="1045" textAnchor="middle" fill="#fff" fontSize="74" fontWeight="900">
            O
          </text>

          <circle
            cx="700"
            cy="1020"
            r="105"
            fill="#1289a7"
            stroke="#70f3ff"
            strokeWidth="8"
            style={{ filter: 'drop-shadow(0 0 30px #38e8ff)' }}
          />
          <text x="700" y="1045" textAnchor="middle" fill="#fff" fontSize="74" fontWeight="900">
            O
          </text>

          <g transform={`rotate(${orbitDeg} 540 1020)`}>
            <circle cx="540" cy="740" r="16" fill="#fff" style={{ filter: 'drop-shadow(0 0 12px #38e8ff)' }} />
            <circle cx="540" cy="1300" r="16" fill="#fff" style={{ filter: 'drop-shadow(0 0 12px #38e8ff)' }} />
          </g>
        </g>

        <circle
          cx="540"
          cy="1020"
          r={shockR}
          fill="none"
          stroke="#ff3b4e"
          strokeWidth="14"
          opacity={shockAlpha}
          style={{ filter: 'drop-shadow(0 0 25px #ff3b4e)' }}
        />

        {frame > 130 && (
          <g>
            <rect
              x="220"
              y="945"
              width="640"
              height="150"
              rx="18"
              fill="rgba(35, 6, 14, 0.92)"
              stroke="#ff3b4e"
              strokeWidth="5"
            />
            <text x="540" y="1015" textAnchor="middle" fill="#ff4d63" fontSize="42" fontWeight="900" letterSpacing="4">
              OXYGEN = 0.00%
            </text>
            <text x="540" y="1065" textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="800" letterSpacing="3">
              HOLDING BREATH WONT SAVE YOU
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 2: Lungs vs Surroundings */
const Scene2LungsTwist: React.FC = () => {
  const frame = useCurrentFrame();
  const zoomOut = interpolate(frame, [30, 120], [1.35, 0.82], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dangerOpacity = interpolate(frame, [60, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #091326 0%, #1c0b19 65%, #070a12 100%)',
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <g opacity={dangerOpacity}>
          <path d="M80 1320h920" stroke="#ff4757" strokeWidth="5" />
          {[130, 260, 410, 700, 840].map((bx, i) => (
            <rect
              key={i}
              x={bx}
              y={1020 - (i % 2) * 110}
              width="95"
              height={300 + (i % 2) * 110}
              fill="#182238"
              stroke="#ff4757"
              strokeWidth="3"
              opacity="0.75"
            />
          ))}
          <circle
            cx="540"
            cy="1020"
            r={300 + (frame % 45) * 4}
            fill="none"
            stroke="#ff4757"
            strokeWidth="4"
            opacity="0.5"
          />
        </g>

        <g transform={`translate(540 1020) scale(${zoomOut}) translate(-540 -1020)`}>
          <path
            d="M540 720v160M540 880l-95 75M540 880l95 75"
            stroke="#70f3ff"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M495 820 C350 810, 280 960, 300 1140 C315 1230, 460 1210, 495 1120 Z"
            fill="rgba(56, 232, 255, 0.25)"
            stroke="#38e8ff"
            strokeWidth="7"
          />
          <path
            d="M585 820 C730 810, 800 960, 780 1140 C765 1230, 620 1210, 585 1120 Z"
            fill="rgba(56, 232, 255, 0.25)"
            stroke="#38e8ff"
            strokeWidth="7"
          />
          {frame > 45 && (
            <g>
              <line x1="330" y1="840" x2="750" y2="1190" stroke="#ff3b4e" strokeWidth="16" />
              <line x1="750" y1="840" x2="330" y2="1190" stroke="#ff3b4e" strokeWidth="16" />
            </g>
          )}
        </g>

        <rect
          x="160"
          y="560"
          width="760"
          height="90"
          rx="12"
          fill="rgba(255, 59, 78, 0.18)"
          stroke="#ff3b4e"
          strokeWidth="3"
        />
        <text x="540" y="618" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="900" letterSpacing="3">
          REAL DANGER: OUTSIDE WORLD COLLAPSE
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 3: Hoover Dam & Concrete Buildings Crumbling to Dust */
const Scene3ConcreteCollapse: React.FC = () => {
  const frame = useCurrentFrame();
  const crumble = interpolate(frame, [45, 190], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const dustParticles = Array.from({ length: 65 }, (_, i) => {
    const startX = 180 + random(`dx-${i}`) * 720;
    const startY = 820 + random(`dy-${i}`) * 460;
    const driftX = (random(`dvx-${i}`) - 0.3) * 260 * crumble;
    const driftY = random(`dvy-${i}`) * 320 * crumble;
    const r = 4 + random(`dr-${i}`) * 12;
    return (
      <circle
        key={i}
        cx={startX + driftX}
        cy={startY + driftY}
        r={r}
        fill={i % 3 === 0 ? '#d2dae2' : '#808e9b'}
        opacity={crumble * 0.85}
      />
    );
  });

  const buildings = [
    { x: 140, w: 150, h: 480 },
    { x: 330, w: 190, h: 560 },
    { x: 560, w: 170, h: 510 },
    { x: 770, w: 160, h: 440 },
  ];

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 55%, #0a0f18 100%)',
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="0" y="1320" width="1080" height="600" fill="#070b12" />
        <line x1="0" y1="1320" x2="1080" y2="1320" stroke="#ff9f43" strokeWidth="4" />

        {buildings.map((b, idx) => {
          const drop = crumble * (160 + idx * 45);
          const tilt = crumble * (idx % 2 === 0 ? -12 : 14);
          const topY = 1320 - b.h + drop;
          return (
            <g
              key={idx}
              opacity={1 - crumble * 0.55}
              transform={`rotate(${tilt} ${b.x + b.w / 2} 1320)`}
            >
              <rect
                x={b.x}
                y={topY}
                width={b.w}
                height={b.h - drop * 0.4}
                fill="#2f3640"
                stroke="#718093"
                strokeWidth="4"
              />
              <path
                d={`M${b.x} ${topY + 120} L${b.x + b.w * 0.5} ${topY + 165} L${b.x + b.w} ${topY + 130}`}
                stroke="#ff5252"
                strokeWidth={6 * crumble}
                fill="none"
              />
            </g>
          );
        })}

        {dustParticles}

        <g transform="translate(540, 660)">
          <circle
            cx="0"
            cy="0"
            r="125"
            fill="rgba(10, 18, 34, 0.94)"
            stroke="#ff9f43"
            strokeWidth="5"
          />
          <text x="0" y="-45" textAnchor="middle" fill="#ff9f43" fontSize="22" fontWeight="900">
            CONCRETE BOND
          </text>
          <text x="0" y="12" textAnchor="middle" fill="#ffffff" fontSize="34" fontWeight="900">
            Ca — O — Si
          </text>
          {frame > 40 && (
            <line x1="-85" y1="-20" x2="85" y2="40" stroke="#ff3b4e" strokeWidth="10" />
          )}
          <text x="0" y="65" textAnchor="middle" fill="#ff5252" fontSize="22" fontWeight="900">
            NO O₂ = INSTANT DUST
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 4: 21% Pressure Drop & Eardrum Rupture */
const Scene4PressureDrop: React.FC = () => {
  const frame = useCurrentFrame();
  const dropProgress = interpolate(frame, [20, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const waveRadius = (frame * 5) % 220;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 58%, #2b0f1c 0%, #070b14 75%)',
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* Left Side: Barometer */}
        <rect
          x="90"
          y="630"
          width="360"
          height="620"
          rx="20"
          fill="rgba(10, 18, 32, 0.9)"
          stroke="#ff6b6b"
          strokeWidth="4"
        />
        <text x="270" y="700" textAnchor="middle" fill="#ff9f43" fontSize="26" fontWeight="900" letterSpacing="2">
          AIR PRESSURE
        </text>
        <rect x="235" y="740" width="70" height="360" rx="35" fill="#1e272e" stroke="#576574" strokeWidth="4" />
        <rect
          x="245"
          y={750 + dropProgress * 180}
          width="50"
          height={340 - dropProgress * 180}
          rx="25"
          fill="#ff3b4e"
        />
        <text x="270" y="1185" textAnchor="middle" fill="#ffffff" fontSize="54" fontWeight="900">
          -{Math.round(dropProgress * 21)}%
        </text>

        {/* Right Side: Human Ear & Tympanic Membrane Diagram */}
        <rect
          x="490"
          y="630"
          width="500"
          height="620"
          rx="20"
          fill="rgba(10, 18, 32, 0.9)"
          stroke="#38e8ff"
          strokeWidth="4"
        />
        <text x="740" y="700" textAnchor="middle" fill="#70f3ff" fontSize="26" fontWeight="900" letterSpacing="2">
          INNER EAR DRUMSHOCK
        </text>

        {/* Ear Canal & Drum */}
        <path
          d="M540 890 Q660 890 730 920 L730 1000 Q660 1030 540 1030"
          fill="rgba(255, 184, 184, 0.2)"
          stroke="#ffcccc"
          strokeWidth="6"
        />
        {/* Eardrum Membrane */}
        <ellipse
          cx="745"
          cy="960"
          rx="24"
          ry="72"
          fill={dropProgress > 0.6 ? 'rgba(255, 59, 78, 0.45)' : 'rgba(112, 243, 255, 0.4)'}
          stroke={dropProgress > 0.6 ? '#ff3b4e' : '#70f3ff'}
          strokeWidth="7"
        />
        {dropProgress > 0.6 && (
          <path
            d="M735 915 L755 950 L732 975 L758 1005"
            stroke="#ffeb3b"
            strokeWidth="6"
            fill="none"
          />
        )}
        <circle
          cx="745"
          cy="960"
          r={waveRadius}
          fill="none"
          stroke="#ff3b4e"
          strokeWidth="6"
          opacity={1 - waveRadius / 220}
        />
        <text x="740" y="1185" textAnchor="middle" fill="#ff5252" fontSize="34" fontWeight="900">
          EARDRUMS RUPTURE
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 5: Pitch Black Daytime Sky & Engines Failing */
const Scene5BlackSkyPlanes: React.FC = () => {
  const frame = useCurrentFrame();
  const blackout = interpolate(frame, [10, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const planeX = interpolate(frame, [0, 240], [180, 780]);
  const planeY = interpolate(frame, [0, 70, 240], [720, 740, 1180]);
  const planeRot = interpolate(frame, [0, 70, 240], [-5, 18, 42]);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, rgba(25, 130, 215, ${1 - blackout}) 0%, #020409 85%)`,
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* Unfiltered Sun in Black Sky */}
        <circle
          cx="820"
          cy="660"
          r="75"
          fill="#fff6d6"
          stroke="#ff9f43"
          strokeWidth="8"
          style={{ filter: 'drop-shadow(0 0 40px #ff9f43)' }}
        />

        {/* Falling Airplane */}
        <g transform={`translate(${planeX} ${planeY}) rotate(${planeRot})`}>
          <path
            d="M-90 0 L60 0 L95 18 L60 28 L-80 28 L-110 -25 L-85 -25 Z"
            fill="#dfe6e9"
            stroke="#38e8ff"
            strokeWidth="3"
          />
          <path d="M-20 10 L-55 65 L-25 65 L20 15 Z" fill="#b2bec3" />
          {/* Flameout Smoke */}
          {frame > 50 && (
            <g>
              <circle cx="-115" cy="10" r="18" fill="#636e72" opacity="0.8" />
              <circle cx="-145" cy="-5" r="26" fill="#2d3436" opacity="0.7" />
              <circle cx="-185" cy="-20" r="34" fill="#1e272e" opacity="0.5" />
            </g>
          )}
        </g>

        {/* Ground Highway & Stopped Cars */}
        <rect x="0" y="1280" width="1080" height="500" fill="#070a10" />
        <line x1="0" y1="1280" x2="1080" y2="1280" stroke="#ff3b4e" strokeWidth="4" />

        <rect
          x="140"
          y="560"
          width="800"
          height="85"
          rx="14"
          fill="rgba(10, 14, 26, 0.9)"
          stroke="#ff9f43"
          strokeWidth="3"
        />
        <text x="540" y="614" textAnchor="middle" fill="#ffbe76" fontSize="32" fontWeight="900" letterSpacing="3">
          NO SCATTERING = PITCH BLACK SKY // ENGINES DEAD
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 6: Earth Crust Shatters (45% Oxygen) & Total Reset */
const Scene6CrustClimax: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const crack = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 16, stiffness: 80 } });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 65%, #3d0e14 0%, #05070e 75%)',
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <circle
          cx="540"
          cy="980"
          r="330"
          fill="#1b222c"
          stroke="#ff4757"
          strokeWidth="6"
          style={{ filter: 'drop-shadow(0 0 45px rgba(255, 59, 78, 0.6))' }}
        />
        {/* Glowing Magma Cracks Across Earth */}
        <path
          d="M340 820 L480 910 L430 1020 L580 1080 L540 1240"
          stroke="#ff3b4e"
          strokeWidth={14 * crack}
          fill="none"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 18px #ff3b4e)' }}
        />
        <path
          d="M720 790 L610 920 L690 1030 L580 1080"
          stroke="#ff9f43"
          strokeWidth={10 * crack}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M260 1010 L430 1020 L380 1170"
          stroke="#ffbe76"
          strokeWidth={8 * crack}
          fill="none"
          strokeLinecap="round"
        />

        <rect
          x="130"
          y="555"
          width="820"
          height="95"
          rx="14"
          fill="rgba(38, 6, 12, 0.92)"
          stroke="#ff3b4e"
          strokeWidth="4"
        />
        <text x="540" y="615" textAnchor="middle" fill="#ffffff" fontSize="35" fontWeight="900" letterSpacing="4">
          EARTH CRUST IS 45% OXYGEN = TOTAL COLLAPSE
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* ULTRA-SMOOTH FIXED-LAYOUT KINETIC CAPTIONS */
const SmoothKineticCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneIndex = Math.min(SCENES.length - 1, Math.floor(frame / (4 * fps)));
  const scene = SCENES[sceneIndex];
  const localFrame = frame - scene.start * fps;
  const sceneFrames = scene.duration * fps;

  const words = scene.text.split(' ');
  const progress = clamp01(localFrame / (sceneFrames * 0.92));
  const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

  // Group into stable chunks of 4 words so lines never jump or reflow
  const chunkSize = 4;
  const activeChunkIndex = Math.floor(activeWordIndex / chunkSize);
  const chunkStart = activeChunkIndex * chunkSize;
  const visibleWords = words.slice(chunkStart, chunkStart + chunkSize);

  const chunkEnter = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 140 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 55,
        right: 55,
        bottom: 185,
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          padding: '24px 32px',
          borderRadius: 22,
          background: 'rgba(6, 10, 22, 0.88)',
          border: '2px solid rgba(112, 243, 255, 0.35)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
          transform: `translateY(${(1 - chunkEnter) * 18}px)`,
          maxWidth: 960,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            minHeight: 72,
          }}
        >
          {visibleWords.map((word, idx) => {
            const globalWordIdx = chunkStart + idx;
            const isActive = globalWordIdx === activeWordIndex;
            const isPassed = globalWordIdx < activeWordIndex;

            const wordStartFrame = (globalWordIdx / words.length) * (sceneFrames * 0.92);
            const wordPop = spring({
              frame: Math.max(0, localFrame - wordStartFrame),
              fps,
              config: { damping: 14, stiffness: 220, mass: 0.5 },
            });

            const scale = isActive ? 0.94 + wordPop * 0.12 : 1;

            return (
              <span
                key={`${sceneIndex}-${globalWordIdx}`}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  padding: '8px 18px',
                  borderRadius: 12,
                  fontSize: 42,
                  fontWeight: 900,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  backgroundColor: isActive ? '#ff6b2b' : 'transparent',
                  color: isActive ? '#ffffff' : isPassed ? '#d2e8ff' : '#7a8fa6',
                  transform: `scale(${scale})`,
                  boxShadow: isActive ? '0 0 24px rgba(255, 107, 43, 0.65)' : 'none',
                  textShadow: isActive
                    ? '0 2px 4px rgba(0,0,0,0.6)'
                    : '0 3px 6px rgba(0,0,0,0.9)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Smooth Voice Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 6,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 3,
            marginTop: 18,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${clamp01(localFrame / sceneFrames) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38e8ff, #ff6b2b)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

const PostProcessingVignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 20 }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.35) 76%, rgba(0,0,0,0.85) 100%)',
      }}
    />
  </AbsoluteFill>
);

const OxygenApocalypseReel: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#05070f',
        overflow: 'hidden',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <BackgroundParticles />
      <TopTelemetryDashboard />

      {SCENES.map((scene, index) => (
        <Sequence key={index} from={scene.start * 60} durationInFrames={scene.duration * 60}>
          <CameraRig sceneIndex={index}>
            {index === 0 ? (
              <Scene1OxygenHook />
            ) : index === 1 ? (
              <Scene2LungsTwist />
            ) : index === 2 ? (
              <Scene3ConcreteCollapse />
            ) : index === 3 ? (
              <Scene4PressureDrop />
            ) : index === 4 ? (
              <Scene5BlackSkyPlanes />
            ) : (
              <Scene6CrustClimax />
            )}
          </CameraRig>
        </Sequence>
      ))}

      <Audio src={staticFile('voice.mp3')} />
      <PostProcessingVignette />
      <SmoothKineticCaptions />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={OxygenApocalypseReel}
      durationInFrames={1440}
      fps={60}
      width={1080}
      height={1920}
    />
  );
};
