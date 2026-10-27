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

/* COMPACT TOP MEASUREMENT BAR (Takes only top 11% of screen so full cartoon scene is clear) */
const CompactTelemetryBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const o2 = interpolate(frame, [0, 80, 130], [20.9, 20.9, 0.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pressure = interpolate(frame, [0, 720, 800], [101.3, 101.3, 79.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const concrete = interpolate(frame, [0, 480, 620], [100, 100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const timer = interpolate(frame, [100, durationInFrames], [5.0, 0.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const metrics = [
    { label: 'O₂ LEVEL', val: `${o2.toFixed(1)}%`, col: o2 < 5 ? '#ff3b4e' : '#2ecc71' },
    { label: 'PRESSURE', val: `${pressure.toFixed(0)} kPa`, col: pressure < 90 ? '#ff9f43' : '#38e8ff' },
    { label: 'CONCRETE', val: `${Math.round(concrete)}%`, col: concrete < 50 ? '#ff3b4e' : '#38e8ff' },
    { label: 'TIMER', val: `0${timer.toFixed(2)}s`, col: '#ff4757' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 42,
        left: 36,
        right: 36,
        zIndex: 40,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        padding: '14px 18px',
        background: 'rgba(10, 16, 30, 0.9)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      {metrics.map((m, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.15)' : 'none',
          }}
        >
          <span style={{ color: '#a4b0be', fontSize: 16, fontWeight: 800, letterSpacing: 1.5 }}>
            {m.label}
          </span>
          <span
            style={{
              color: m.col,
              fontSize: 30,
              fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              marginTop: 4,
            }}
          >
            {m.val}
          </span>
        </div>
      ))}
    </div>
  );
};

/* SCENE 1: Person Holding Breath in Park while O2 Bubbles Pop */
const Scene1HoldBreath: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const noO2 = interpolate(frame, [90, 140], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cheekPuff = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 10, stiffness: 120 } });
  const faceColor = noO2 > 0.5 ? '#8c7ae6' : '#ffbe76';

  const bubbles = [
    { x: 220, y: 520 },
    { x: 850, y: 540 },
    { x: 190, y: 880 },
    { x: 880, y: 860 },
    { x: 320, y: 380 },
    { x: 760, y: 390 },
  ];

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #48dbfb 0%, #c7ecee 65%, #7bed9f 65%, #2ed573 100%)' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* Clouds */}
        <g fill="#ffffff" opacity="0.85">
          <circle cx={240 + frame * 0.4} cy="340" r="55" />
          <circle cx={295 + frame * 0.4} cy="330" r="70" />
          <circle cx={355 + frame * 0.4} cy="345" r="50" />
        </g>

        {/* Floating O2 Bubbles that Pop & Vanish */}
        {bubbles.map((b, i) => {
          const popFrame = 70 + i * 12;
          const alive = frame < popFrame;
          const floatY = b.y + Math.sin(frame * 0.08 + i) * 20;
          return alive ? (
            <g key={i} transform={`translate(${b.x}, ${floatY})`}>
              <circle cx="0" cy="0" r="58" fill="#0abde3" stroke="#ffffff" strokeWidth="6" />
              <text x="0" y="16" textAnchor="middle" fill="#ffffff" fontSize="42" fontWeight="900">
                O₂
              </text>
            </g>
          ) : (
            <g key={i} transform={`translate(${b.x}, ${floatY})`} opacity={clamp01(1 - (frame - popFrame) / 20)}>
              <circle cx="0" cy="0" r={60 + (frame - popFrame) * 3} fill="none" stroke="#ff4757" strokeWidth="6" strokeDasharray="12 12" />
              <text x="0" y="15" textAnchor="middle" fill="#ff4757" fontSize="36" fontWeight="900">
                POP!
              </text>
            </g>
          );
        })}

        {/* Cartoon Character Holding Breath */}
        <g transform="translate(540, 1080)">
          {/* Torso / T-Shirt */}
          <path d="M-210 180 C-210 20, 210 20, 210 180 L250 450 L-250 450 Z" fill="#ff5252" stroke="#2f3542" strokeWidth="10" />

          {/* X-Ray Lungs Inside Chest */}
          <path
            d="M-30 120 C-120 110, -150 220, -120 310 C-95 360, -25 340, -15 270 Z"
            fill={noO2 > 0.5 ? '#57606f' : '#ff7f50'}
            stroke="#ffffff"
            strokeWidth="6"
            transform={`scale(${1 + cheekPuff * 0.15 - noO2 * 0.25})`}
          />
          <path
            d="M30 120 C120 110, 150 220, 120 310 C95 360, 25 340, 15 270 Z"
            fill={noO2 > 0.5 ? '#57606f' : '#ff7f50'}
            stroke="#ffffff"
            strokeWidth="6"
            transform={`scale(${1 + cheekPuff * 0.15 - noO2 * 0.25})`}
          />

          {/* Neck */}
          <rect x="-45" y="-40" width="90" height="90" rx="20" fill={faceColor} stroke="#2f3542" strokeWidth="10" />

          {/* Head */}
          <circle cx="0" cy="-190" r="165" fill={faceColor} stroke="#2f3542" strokeWidth="10" />

          {/* Hair */}
          <path d="M-165 -210 C-170 -380, 170 -380, 165 -210 C120 -290, -120 -290, -165 -210 Z" fill="#2f3542" />

          {/* Puffed Cheeks (Holding Breath!) */}
          <circle cx="-115" cy="-145" r={35 + cheekPuff * 28} fill={noO2 > 0.5 ? '#7158e2' : '#ff7979'} stroke="#2f3542" strokeWidth="8" />
          <circle cx="115" cy="-145" r={35 + cheekPuff * 28} fill={noO2 > 0.5 ? '#7158e2' : '#ff7979'} stroke="#2f3542" strokeWidth="8" />

          {/* Big Wide Cartoon Eyes */}
          <circle cx="-60" cy="-225" r="34" fill="#ffffff" stroke="#2f3542" strokeWidth="8" />
          <circle cx="60" cy="-225" r="34" fill="#ffffff" stroke="#2f3542" strokeWidth="8" />
          <circle cx="-60" cy="-225" r="14" fill="#2f3542" />
          <circle cx="60" cy="-225" r="14" fill="#2f3542" />

          {/* Tightly Closed Mouth Holding Air */}
          <path d="M-45 -135 Q0 -115 45 -135" stroke="#2f3542" strokeWidth="10" fill="none" strokeLinecap="round" />
        </g>

        {/* Question Badge */}
        <rect x="190" y="230" width="700" height="85" rx="42" fill="#2f3542" stroke="#ffffff" strokeWidth="5" />
        <text x="540" y="286" textAnchor="middle" fill="#ffda79" fontSize="38" fontWeight="900">
          SAANS ROK KAR BACH JAOGE? 🫁
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 2: Zoom Out to City Street in Danger Around Character */
const Scene2OutsideDanger: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = Math.sin(frame * 1.4) * 10;
  const flash = Math.sin(frame * 0.35) > 0;

  return (
    <AbsoluteFill
      style={{
        background: flash
          ? 'linear-gradient(180deg, #eb3b5a 0%, #fa8231 65%, #2f3542 65%)'
          : 'linear-gradient(180deg, #3867d6 0%, #4b7bec 65%, #2f3542 65%)',
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} transform={`translate(${shake}, 0)`}>
        {/* City Skyline Buildings on Left and Right */}
        <rect x="60" y="480" width="220" height="770" fill="#4b6584" stroke="#1e272e" strokeWidth="8" />
        <rect x="300" y="620" width="160" height="630" fill="#778ca3" stroke="#1e272e" strokeWidth="8" />
        <rect x="640" y="580" width="170" height="670" fill="#778ca3" stroke="#1e272e" strokeWidth="8" />
        <rect x="830" y="440" width="200" height="810" fill="#4b6584" stroke="#1e272e" strokeWidth="8" />

        {/* Glowing Windows on Buildings */}
        {[540, 640, 740, 840, 940, 1040].map((wy, idx) => (
          <g key={idx} fill="#fed330">
            <rect x="100" y={wy} width="45" height="50" rx="6" />
            <rect x="190" y={wy} width="45" height="50" rx="6" />
            <rect x="870" y={wy} width="45" height="50" rx="6" />
            <rect x="950" y={wy} width="45" height="50" rx="6" />
          </g>
        ))}

        {/* Street & Sidewalk */}
        <rect x="0" y="1250" width="1080" height="670" fill="#2f3542" />
        <line x1="0" y1="1250" x2="1080" y2="1250" stroke="#dfe4ea" strokeWidth="12" />

        {/* Giant Cracks Opening on the Street Around Character */}
        <path
          d="M540 1320 L320 1430 L180 1390 L90 1520 M540 1320 L770 1440 L920 1390"
          stroke="#ff3838"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />

        {/* Character Standing in Center Looking Shocked Around Him */}
        <g transform="translate(540, 1150) scale(0.65)">
          <path d="M-150 150 L150 150 L180 420 L-180 420 Z" fill="#ff5252" stroke="#1e272e" strokeWidth="10" />
          <circle cx="0" cy="-40" r="120" fill="#ffbe76" stroke="#1e272e" strokeWidth="10" />
          <circle cx="-45" cy="-60" r="24" fill="#ffffff" stroke="#1e272e" strokeWidth="6" />
          <circle cx="45" cy="-60" r="24" fill="#ffffff" stroke="#1e272e" strokeWidth="6" />
          <ellipse cx="0" cy="10" rx="35" ry="45" fill="#1e272e" />
        </g>

        {/* Danger Siren Waves Around City */}
        <circle cx="540" cy="1050" r={120 + (frame % 40) * 16} fill="none" stroke="#ff3838" strokeWidth="10" opacity={1 - (frame % 40) / 40} />

        {/* Big Cartoon Stamp */}
        <rect x="130" y="240" width="820" height="110" rx="22" fill="#ff3838" stroke="#ffffff" strokeWidth="6" />
        <text x="540" y="310" textAnchor="middle" fill="#ffffff" fontSize="44" fontWeight="900">
          ⚠️ TABAHI CHAARON TARAF HOGI!
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 3: Hoover Dam Bursting & Concrete Buildings Crumbling Into Dust */
const Scene3BuildingsCollapse: React.FC = () => {
  const frame = useCurrentFrame();
  const collapse = interpolate(frame, [35, 195], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shakeX = Math.sin(frame * 2.1) * (collapse * 18);
  const shakeY = Math.cos(frame * 1.8) * (collapse * 14);

  const buildings = [
    { x: 460, w: 180, h: 720, col: '#ced6e0', tilt: -22 },
    { x: 660, w: 200, h: 840, col: '#a4b0be', tilt: 18 },
    { x: 880, w: 160, h: 650, col: '#dfe4ea', tilt: 28 },
  ];

  // Billowing Dust Clouds as Buildings Turn to Dust
  const dustClouds = Array.from({ length: 45 }, (_, i) => {
    const cx = 120 + random(`dc-x-${i}`) * 880;
    const baseY = 1320 - random(`dc-y-${i}`) * 420 * collapse;
    const r = (35 + random(`dc-r-${i}`) * 75) * collapse;
    return (
      <circle
        key={i}
        cx={cx + (random(`dc-dx-${i}`) - 0.5) * 180 * collapse}
        cy={baseY}
        r={r}
        fill={i % 2 === 0 ? '#dcdde1' : '#b2bec3'}
        opacity={collapse * 0.9}
      />
    );
  });

  // Falling Concrete Chunks
  const debris = Array.from({ length: 35 }, (_, i) => {
    const sx = 100 + random(`deb-x-${i}`) * 880;
    const sy = 500 + random(`deb-y-${i}`) * 350 + collapse * 650;
    const sz = 18 + random(`deb-s-${i}`) * 28;
    return (
      <rect
        key={i}
        x={sx}
        y={Math.min(1320, sy)}
        width={sz}
        height={sz}
        fill="#747d8c"
        stroke="#2f3542"
        strokeWidth="3"
        opacity={collapse}
        transform={`rotate(${frame * 6 + i * 25} ${sx} ${Math.min(1320, sy)})`}
      />
    );
  });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #ff9f43 0%, #ee5253 68%, #2f3542 68%)' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        transform={`translate(${shakeX}, ${shakeY})`}
      >
        {/* LEFT SIDE: HOOVER DAM COLLAPSING & WATER BURSTING OUT */}
        <g transform={`translate(0, ${collapse * 220})`}>
          {/* Blue Reservoir Water Behind Dam */}
          <rect x="30" y="650" width="380" height="670" fill="#0abde3" />
          {/* Dam Concrete Wall */}
          <polygon
            points="60,620 390,620 430,1320 20,1320"
            fill="#d2dae2"
            stroke="#2f3542"
            strokeWidth="8"
          />
          <text x="225" y="700" textAnchor="middle" fill="#2f3542" fontSize="34" fontWeight="900">
            HOOVER DAM
          </text>
          {/* Giant Cracks on Dam */}
          {frame > 25 && (
            <path
              d="M220 620 L180 790 L260 940 L160 1150 L240 1320 M120 750 L260 940 L350 860"
              stroke="#ff3838"
              strokeWidth={6 + collapse * 16}
              fill="none"
            />
          )}
        </g>

        {/* Water Gushing Out as Dam Crumbles */}
        {collapse > 0.2 && (
          <path
            d={`M120 820 Q260 ${950 + collapse * 200} 440 1340 L40 1340 Z`}
            fill="#48dbfb"
            stroke="#ffffff"
            strokeWidth="6"
          />
        )}

        {/* RIGHT SIDE: CONCRETE SKYSCRAPERS CRUMBLING & FALLING */}
        {buildings.map((b, i) => {
          const dropY = collapse * (420 + i * 90);
          const rot = collapse * b.tilt;
          const topY = 1320 - b.h + dropY;
          return (
            <g
              key={i}
              transform={`rotate(${rot} ${b.x + b.w / 2} 1320)`}
              opacity={1 - collapse * 0.45}
            >
              <rect
                x={b.x}
                y={topY}
                width={b.w}
                height={b.h}
                fill={b.col}
                stroke="#2f3542"
                strokeWidth="8"
              />
              {/* Windows */}
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <g key={row} fill="#feca57" stroke="#2f3542" strokeWidth="3">
                  <rect x={b.x + 25} y={topY + 45 + row * 95} width="45" height="55" />
                  <rect x={b.x + b.w - 70} y={topY + 45 + row * 95} width="45" height="55" />
                </g>
              ))}
              {/* Red Fracture Lines */}
              {frame > 25 && (
                <path
                  d={`M${b.x} ${topY + 220} L${b.x + b.w / 2} ${topY + 290} L${b.x + b.w} ${topY + 240}`}
                  stroke="#ff3838"
                  strokeWidth="12"
                  fill="none"
                />
              )}
            </g>
          );
        })}

        {/* Falling Concrete Debris & Giant Dust Cloud */}
        {debris}
        {dustClouds}

        {/* Ground Line */}
        <rect x="0" y="1320" width="1080" height="600" fill="#1e272e" />
        <line x1="0" y1="1320" x2="1080" y2="1320" stroke="#feca57" strokeWidth="10" />

        {/* Top Scene Explanation Banner */}
        <rect x="110" y="230" width="860" height="95" rx="20" fill="#1e272e" stroke="#feca57" strokeWidth="5" />
        <text x="540" y="292" textAnchor="middle" fill="#feca57" fontSize="38" fontWeight="900">
          🏢 CONCRETE BUILDINGS = INSTANT DUST!
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 4: Air Pressure Drops 21% & Eardrums Burst */
const Scene4EardrumPop: React.FC = () => {
  const frame = useCurrentFrame();
  const burst = frame > 95;
  const shake = Math.sin(frame * 2.4) * (burst ? 14 : 5);

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #5f27cd 0%, #341f97 100%)' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} transform={`translate(${shake}, 0)`}>
        {/* Sonic Pressure Waves Slamming Inward */}
        {[1, 2, 3].map((ring) => {
          const r = 480 - ((frame * 6 + ring * 140) % 420);
          return (
            <circle
              key={ring}
              cx="340"
              cy="960"
              r={r}
              fill="none"
              stroke="#ff4757"
              strokeWidth="10"
              opacity={0.75}
            />
          );
        })}

        {/* Cartoon Character Screaming & Grabbing Both Ears */}
        <g transform="translate(340, 1020)">
          <path d="M-170 170 L170 170 L210 460 L-210 460 Z" fill="#ff6b6b" stroke="#1e272e" strokeWidth="10" />
          <circle cx="0" cy="-30" r="145" fill="#ffbe76" stroke="#1e272e" strokeWidth="10" />
          {/* Hands Grabbing Left & Right Ears */}
          <circle cx="-160" cy="-30" r="48" fill="#ffbe76" stroke="#1e272e" strokeWidth="10" />
          <circle cx="160" cy="-30" r="48" fill="#ffbe76" stroke="#1e272e" strokeWidth="10" />
          {/* Pain Eyes (> <) */}
          <path d="M-75 -65 L-35 -45 L-75 -25" stroke="#1e272e" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M75 -65 L35 -45 L75 -25" stroke="#1e272e" strokeWidth="12" fill="none" strokeLinecap="round" />
          {/* Screaming Mouth */}
          <ellipse cx="0" cy="40" rx="45" ry="60" fill="#1e272e" />
          <ellipse cx="0" cy="65" rx="28" ry="22" fill="#ff4757" />
        </g>

        {/* Right Side: Giant Zoom-In Cutaway of Eardrum Bursting */}
        <g transform="translate(770, 740)">
          <circle cx="0" cy="0" r="230" fill="#fff200" stroke="#1e272e" strokeWidth="12" />
          <circle cx="0" cy="0" r="205" fill="#2f3542" />
          {/* Ear Canal */}
          <path d="M-200 -55 L-20 -35 L-20 55 L-200 55 Z" fill="#ffcccc" stroke="#ff6b81" strokeWidth="6" />
          {/* Tympanic Membrane (Eardrum) */}
          <ellipse
            cx="0"
            cy="10"
            rx="32"
            ry="95"
            fill={burst ? '#ff3838' : '#70a1ff'}
            stroke="#ffffff"
            strokeWidth="8"
          />
          {/* Rupture Tear & Lightning Flash */}
          {burst && (
            <g>
              <path d="M-15 -55 L20 -10 L-18 25 L22 75" stroke="#fff200" strokeWidth="12" fill="none" />
              <text x="0" y="-125" textAnchor="middle" fill="#ff3838" fontSize="42" fontWeight="900">
                💥 SNAP!
              </text>
            </g>
          )}
          <text x="0" y="165" textAnchor="middle" fill="#ffffff" fontSize="30" fontWeight="900">
            KAAN KA PARDA
          </text>
        </g>

        <rect x="110" y="230" width="860" height="95" rx="20" fill="#ff4757" stroke="#ffffff" strokeWidth="5" />
        <text x="540" y="292" textAnchor="middle" fill="#ffffff" fontSize="38" fontWeight="900">
          📉 AIR PRESSURE -21% = EARDRUMS BURST!
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 5: Daytime Sky Turns Pitch Black, Planes Fall & Cars Stop */
const Scene5BlackSkyPlanesCars: React.FC = () => {
  const frame = useCurrentFrame();
  const darkProgress = interpolate(frame, [15, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Falling Passenger Airplane
  const planeX = interpolate(frame, [0, 240], [140, 820]);
  const planeY = interpolate(frame, [0, 60, 240], [520, 540, 1080]);
  const planeAngle = interpolate(frame, [0, 60, 240], [-4, 15, 38]);

  // Stopping Cars on Highway
  const car1X = interpolate(frame, [0, 90, 240], [80, 320, 320]);
  const car2X = interpolate(frame, [0, 100, 240], [450, 680, 680]);

  return (
    <AbsoluteFill>
      {/* Daytime Blue Sky transitioning to Pitch Black Starry Sky */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            darkProgress < 0.5
              ? 'linear-gradient(180deg, #00a8ff 0%, #9c88ff 100%)'
              : 'linear-gradient(180deg, #05070d 0%, #192a56 100%)',
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* Stars Appearing in Daytime Black Sky */}
        {Array.from({ length: 40 }, (_, i) => (
          <circle
            key={i}
            cx={random(`st-x-${i}`) * W}
            cy={200 + random(`st-y-${i}`) * 800}
            r={3 + random(`st-r-${i}`) * 4}
            fill="#ffffff"
            opacity={darkProgress}
          />
        ))}

        {/* Sun Shining in Pitch Black Sky */}
        <circle cx="860" cy="420" r="80" fill="#fbc531" stroke="#e1b12c" strokeWidth="10" />

        {/* Falling Commercial Airplane with Dead Smoking Engine */}
        <g transform={`translate(${planeX}, ${planeY}) rotate(${planeAngle})`}>
          {/* Smoke Trail Behind Dead Engine */}
          {frame > 45 && (
            <g>
              <circle cx="-140" cy="20" r="28" fill="#7f8fa6" opacity="0.85" />
              <circle cx="-195" cy="5" r="42" fill="#718093" opacity="0.7" />
              <circle cx="-260" cy="-15" r="55" fill="#2f3640" opacity="0.55" />
            </g>
          )}
          {/* Fuselage */}
          <path
            d="M-140 -20 L110 -20 C155 -20, 175 25, 110 35 L-130 35 L-175 -65 L-130 -65 Z"
            fill="#f5f6fa"
            stroke="#2f3640"
            strokeWidth="7"
          />
          {/* Windows */}
          {[-80, -40, 0, 40, 80].map((wx, i) => (
            <rect key={i} x={wx} y="-5" width="18" height="20" rx="5" fill="#00a8ff" />
          ))}
          {/* Wing & Engine with Red X */}
          <polygon points="-30,15 -90,90 -30,90 40,20" fill="#dcdde1" stroke="#2f3640" strokeWidth="6" />
          <rect x="-45" y="65" width="55" height="32" rx="10" fill="#eb2f06" stroke="#2f3640" strokeWidth="5" />
        </g>

        {/* Highway Road & Stalled Cars */}
        <rect x="0" y="1240" width="1080" height="680" fill="#2f3640" />
        <line x1="0" y1="1360" x2="1080" y2="1360" stroke="#fbc531" strokeWidth="10" strokeDasharray="45 35" />

        {/* Car 1 (Red Sports Car Stalled) */}
        <g transform={`translate(${car1X}, 1170)`}>
          <rect x="0" y="35" width="220" height="65" rx="18" fill="#eb2f06" stroke="#1e272e" strokeWidth="6" />
          <path d="M35 35 L70 -10 L155 -10 L185 35 Z" fill="#ff6b6b" stroke="#1e272e" strokeWidth="6" />
          <circle cx="50" cy="100" r="28" fill="#1e272e" stroke="#dcdde1" strokeWidth="6" />
          <circle cx="170" cy="100" r="28" fill="#1e272e" stroke="#dcdde1" strokeWidth="6" />
          {frame > 90 && (
            <text x="110" y="-28" textAnchor="middle" fill="#fbc531" fontSize="30" fontWeight="900">
              NO FIRE ❌
            </text>
          )}
        </g>

        {/* Car 2 (Yellow Taxi Stalled) */}
        <g transform={`translate(${car2X}, 1260)`}>
          <rect x="0" y="35" width="220" height="65" rx="18" fill="#fbc531" stroke="#1e272e" strokeWidth="6" />
          <path d="M35 35 L70 -10 L155 -10 L185 35 Z" fill="#ffeaa7" stroke="#1e272e" strokeWidth="6" />
          <circle cx="50" cy="100" r="28" fill="#1e272e" stroke="#dcdde1" strokeWidth="6" />
          <circle cx="170" cy="100" r="28" fill="#1e272e" stroke="#dcdde1" strokeWidth="6" />
          {frame > 100 && (
            <text x="110" y="-28" textAnchor="middle" fill="#ff3838" fontSize="30" fontWeight="900">
              ENGINE DEAD!
            </text>
          )}
        </g>

        <rect x="90" y="230" width="900" height="95" rx="20" fill="#1e272e" stroke="#fbc531" strokeWidth="5" />
        <text x="540" y="292" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="900">
          ✈️ DIN MEIN KAALA AASMAN & PLANES FAIL!
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 6: Earth Crust Cracks Open Into Lava (5 Seconds = Total Reset) */
const Scene6EarthShatters: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const crack = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const shake = Math.sin(frame * 2.2) * 12;

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 55%, #4a0e17 0%, #080912 80%)' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} transform={`translate(${shake}, 0)`}>
        {/* Lava Glow Behind Earth */}
        <circle cx="540" cy="920" r={360 + crack * 35} fill="#ff3838" opacity="0.35" />

        {/* Planet Earth */}
        <circle cx="540" cy="920" r="340" fill="#0984e3" stroke="#1e272e" strokeWidth="12" />
        {/* Green Continents */}
        <path
          d="M340 740 C420 710, 490 780, 460 880 C430 960, 330 940, 310 840 Z"
          fill="#00b894"
        />
        <path
          d="M590 780 C690 750, 770 860, 720 990 C670 1080, 560 1030, 580 910 Z"
          fill="#00b894"
        />

        {/* Giant Glowing Magma Cracks Shattering Earth's Crust */}
        <path
          d="M540 580 L490 770 L610 910 L470 1070 L540 1260 M310 830 L490 770 L740 840 M350 1050 L610 910 L760 1040"
          stroke="#ffdd59"
          strokeWidth={18 * crack}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M540 580 L490 770 L610 910 L470 1070 L540 1260"
          stroke="#ff3838"
          strokeWidth={8 * crack}
          fill="none"
        />

        {/* Flying Crust Rocks */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * Math.PI) / 3;
          const dist = 360 + frame * 1.4;
          const rx = 540 + Math.cos(angle) * dist;
          const ry = 920 + Math.sin(angle) * dist;
          return (
            <circle key={i} cx={rx} cy={ry} r="28" fill="#ff5252" stroke="#ffdd59" strokeWidth="5" />
          );
        })}

        <rect x="120" y="230" width="840" height="100" rx="22" fill="#ff3838" stroke="#ffffff" strokeWidth="6" />
        <text x="540" y="295" textAnchor="middle" fill="#ffffff" fontSize="42" fontWeight="900">
          🌍 5 SECONDS = DUNIYA KHATAM!
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/* SMOOTH FIXED-LAYOUT KINETIC CAPTIONS */
const SmoothKineticCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneIndex = Math.min(SCENES.length - 1, Math.floor(frame / (4 * fps)));
  const scene = SCENES[sceneIndex];
  const localFrame = frame - scene.start * fps;
  const sceneFrames = scene.duration * fps;

  const words = scene.text.split(' ');
  const progress = clamp01(localFrame / (sceneFrames * 0.9));
  const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

  const chunkSize = 4;
  const activeChunkIndex = Math.floor(activeWordIndex / chunkSize);
  const chunkStart = activeChunkIndex * chunkSize;
  const visibleWords = words.slice(chunkStart, chunkStart + chunkSize);

  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        right: 48,
        bottom: 140,
        zIndex: 45,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          padding: '22px 28px',
          borderRadius: 24,
          background: 'rgba(10, 14, 26, 0.92)',
          border: '3px solid #ffffff',
          boxShadow: '0 14px 35px rgba(0,0,0,0.75)',
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
            minHeight: 68,
          }}
        >
          {visibleWords.map((word, idx) => {
            const globalIdx = chunkStart + idx;
            const isActive = globalIdx === activeWordIndex;
            const isPassed = globalIdx < activeWordIndex;

            return (
              <span
                key={`${sceneIndex}-${globalIdx}`}
                style={{
                  padding: '8px 18px',
                  borderRadius: 14,
                  fontSize: 42,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  backgroundColor: isActive ? '#ff5252' : 'transparent',
                  color: isActive ? '#ffffff' : isPassed ? '#f1f2f6' : '#a4b0be',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isActive ? '0 6px 20px rgba(255, 82, 82, 0.6)' : 'none',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const OxygenStoryReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <CompactTelemetryBar />

      {SCENES.map((scene, index) => (
        <Sequence key={index} from={scene.start * 60} durationInFrames={scene.duration * 60}>
          {index === 0 ? (
            <Scene1HoldBreath />
          ) : index === 1 ? (
            <Scene2OutsideDanger />
          ) : index === 2 ? (
            <Scene3BuildingsCollapse />
          ) : index === 3 ? (
            <Scene4EardrumPop />
          ) : index === 4 ? (
            <Scene5BlackSkyPlanesCars />
          ) : (
            <Scene6EarthShatters />
          )}
        </Sequence>
      ))}

      <Audio src={staticFile('voice.mp3')} />
      <SmoothKineticCaptions />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={OxygenStoryReel}
      durationInFrames={1440}
      fps={60}
      width={1080}
      height={1920}
    />
  );
};
