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
  { start: 0, duration: 5, speechDur: 3.8, caption: "Agar duniya se oxygen sirf 5 second ke liye gayab ho jaye,", tts: "अगर दुनिया से ऑक्सीजन सिर्फ पांच सेकंड के लिए गायब हो जाए," },
  { start: 5, duration: 5, speechDur: 3.8, caption: "Toh saans rok kar bhi aap bilkul nahi bach paoge!", tts: "तो सांस रोक कर भी आप बिलकुल नहीं बच पाओगे!" },
  { start: 10, duration: 5, speechDur: 4.1, caption: "Kyunki oxygen hi har concrete building ko jod kar rakhta hai.", tts: "क्योंकि ऑक्सीजन ही हर कंक्रीट बिल्डिंग को जोड़ कर रखता है।" },
  { start: 15, duration: 5, speechDur: 4.0, caption: "Hawa ka pressure girte hi sabke kaan ke parde phat jayenge.", tts: "हवा का प्रेशर गिरते ही सबके कान के पर्दे तुरंत फट जाएंगे।" },
  { start: 20, duration: 5, speechDur: 4.1, caption: "Din mein aasman kaala hoga aur saare engine band ho jayenge.", tts: "दिन में आसमान पूरा काला होगा और सारे इंजन बंद हो जाएंगे।" },
  { start: 25, duration: 5, speechDur: 4.1, caption: "Kyunki zameen ki parat bhi 45% oxygen se hi bani hai!", tts: "क्योंकि ज़मीन की परत भी पैंतालीस परसेंट ऑक्सीजन से ही बनी है!" }
];

const W = 1080;
const H = 1920;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const VintagePaperBackground: React.FC<{ figNum: number; sectionTag: string }> = ({ figNum, sectionTag }) => (
  <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 0 }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, #f6efe0 0%, #eadec5 58%, #d5c4a1 100%)' }} />
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ opacity: 0.2 }}>
      {Array.from({ length: 27 }, (_, i) => <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={H} stroke="#8c785c" strokeWidth="1" />)}
      {Array.from({ length: 48 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 40} x2={W} y2={i * 40} stroke="#8c785c" strokeWidth="1" />)}
    </svg>
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 86, width: 2, backgroundColor: 'rgba(204, 58, 43, 0.32)' }} />
    <div style={{ position: 'absolute', top: 68, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '2.5px solid #3b2f25', color: '#3b2f25', fontSize: 24, fontWeight: 800, letterSpacing: 4, fontFamily: 'Courier New, monospace' }}>
      <span>{sectionTag}</span>
      <span>FIG. 0{figNum}</span>
    </div>
  </AbsoluteFill>
);

const TopScientificTelemetry: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o2 = interpolate(frame, [0, 110, 200], [20.9, 20.9, 0.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pressure = interpolate(frame, [0, 900, 1020], [101.3, 101.3, 79.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bonds = interpolate(frame, [0, 600, 760], [100, 100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sky = interpolate(frame, [0, 1200, 1340], [100, 100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const timer = interpolate(frame, [100, durationInFrames], [5.0, 0.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const items = [
    { label: 'O2 LEVEL', val: `${o2.toFixed(1)}%`, bad: o2 < 5 },
    { label: 'PRESSURE', val: `${pressure.toFixed(1)}kPa`, bad: pressure < 90 },
    { label: 'Si-O BOND', val: `${Math.round(bonds)}%`, bad: bonds < 50 },
    { label: 'SKY LIGHT', val: `${Math.round(sky)}%`, bad: sky < 40 },
    { label: 'TIMER', val: `0${timer.toFixed(2)}s`, bad: true },
  ];

  return (
    <div style={{ position: 'absolute', top: 126, left: 64, right: 64, zIndex: 25, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#2b2119', borderRadius: 12, padding: '12px 10px', border: '2px solid #574435', boxShadow: '0 8px 20px rgba(43,33,25,0.2)' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: i < 4 ? '1px solid rgba(246,239,224,0.18)' : 'none' }}>
          <span style={{ color: '#bfa88f', fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>{it.label}</span>
          <span style={{ color: it.bad ? '#ff5e4d' : '#f6efe0', fontSize: 22, fontWeight: 900, marginTop: 3 }}>{it.val}</span>
        </div>
      ))}
    </div>
  );
};

const EditorialHeadline: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const frame = useCurrentFrame();
  const full = `${line1}\n${line2}`;
  const sub = full.slice(0, Math.min(full.length, Math.floor(frame * 0.9)));
  const [p1 = '', p2 = ''] = sub.split('\n');
  return (
    <div style={{ position: 'absolute', top: 232, left: 64, right: 64, zIndex: 20, fontFamily: 'Impact, Arial Black, sans-serif', textTransform: 'uppercase', lineHeight: 1.05 }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: '#362a20', letterSpacing: 1.5 }}>{p1}</div>
      <div style={{ fontSize: 80, fontWeight: 900, color: '#d43527', letterSpacing: 1.5, marginTop: 6 }}>{p2}</div>
    </div>
  );
};

const DiagramBadge: React.FC<{ x: number; y: number; text: string; variant?: 'dark' | 'red'; delay?: number }> = ({ x, y, text, variant = 'dark', delay = 15 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 150 } });
  const w = Math.max(210, text.length * 15 + 44);
  return (
    <g transform={`translate(${x}, ${y}) scale(${pop})`}>
      <rect x={-w / 2} y={-28} width={w} height={56} rx={12} fill={variant === 'red' ? '#d43527' : '#2b2119'} stroke="#f6efe0" strokeWidth="3" />
      <text x="0" y="9" textAnchor="middle" fill="#f6efe0" fontSize="23" fontWeight="900" letterSpacing="1.5">{text}</text>
    </g>
  );
};

/* SCENE 1: O2 Molecule Dissolving & Magnifying Glass */
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scaleIn = spring({ frame, fps, config: { damping: 16 } });
  const dissolve = interpolate(frame, [110, 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const magX = interpolate(frame, [0, 140, 300], [400, 545, 580]);
  const magY = interpolate(frame, [0, 140, 300], [1070, 975, 955]);

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={1} sectionTag="THE BASICS" />
      <EditorialHeadline line1="OXYGEN GAYAB" line2="FOR 5 SECONDS?" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(540, 980) scale(${scaleIn}) translate(-540, -980)`}>
          <rect x="140" y="590" width="800" height="730" rx="28" fill="#d8e6e7" stroke="#362a20" strokeWidth="6" />
          <rect x="143" y="593" width="794" height="110" rx="24" fill="#82aeb8" />
          <line x1="140" y1="705" x2="940" y2="705" stroke="#362a20" strokeWidth="5" />
          <text x="540" y="662" textAnchor="middle" fill="#2b2119" fontSize="28" fontWeight="900" letterSpacing="3">EARTH ATMOSPHERE // 20.9% O2</text>

          <circle cx="540" cy="980" r="215" fill="none" stroke="#d43527" strokeWidth="5" strokeDasharray="14 10" transform={`rotate(${frame * 0.8} 540 980)`} />

          <g opacity={1 - dissolve * 0.9} transform={`translate(540, 980) scale(${1 - dissolve * 0.3}) translate(-540, -980)`}>
            <rect x="400" y="960" width="280" height="14" rx="7" fill="#362a20" />
            <rect x="400" y="990" width="280" height="14" rx="7" fill="#362a20" />
            <circle cx="395" cy="980" r="90" fill="#227093" stroke="#362a20" strokeWidth="6" />
            <text x="395" y="1004" textAnchor="middle" fill="#f6efe0" fontSize="64" fontWeight="900">O</text>
            <circle cx="685" cy="980" r="90" fill="#227093" stroke="#362a20" strokeWidth="6" />
            <text x="685" y="1004" textAnchor="middle" fill="#f6efe0" fontSize="64" fontWeight="900">O</text>
          </g>

          {dissolve > 0.05 && Array.from({ length: 24 }, (_, i) => {
            const ang = (i / 24) * Math.PI * 2;
            const dist = dissolve * (65 + (i % 4) * 48);
            return <circle key={i} cx={540 + Math.cos(ang) * dist} cy={980 + Math.sin(ang) * dist} r={9 * (1 - dissolve * 0.4)} fill={i % 2 === 0 ? '#d43527' : '#227093'} />;
          })}

          <g transform={`translate(${magX}, ${magY}) rotate(-26)`}>
            <rect x="-16" y="130" width="32" height="180" rx="14" fill="#6e472b" stroke="#2b2119" strokeWidth="6" />
            <circle cx="0" cy="0" r="135" fill="rgba(255,255,255,0.25)" stroke="#2b2119" strokeWidth="14" />
          </g>

          <DiagramBadge x={310} y={1240} text="COVALENT O2" delay={10} />
          <DiagramBadge x={755} y={800} text={dissolve > 0.3 ? 'O2 VANISHED!' : 'TIMER: 5.0 SEC'} variant="red" delay={35} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 2: Lungs Breathing vs City Buildings Cracking */
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const breath = 1 + Math.sin(frame * 0.12) * 0.06;
  const shake = frame > 70 ? Math.sin(frame * 1.8) * 8 : 0;
  const crack = interpolate(frame, [60, 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={2} sectionTag="THE MECHANISM" />
      <EditorialHeadline line1="SAANS ROKNA" line2="BEKAAR KYUN HAI?" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <g>
          <rect x="70" y="610" width="445" height="690" rx="24" fill="#e8d8c8" stroke="#362a20" strokeWidth="5" />
          <g transform={`translate(292, 955) scale(${breath}) translate(-292, -955)`}>
            <path d="M292 710 v125 M292 835 l-65 55 M292 835 l65 55" stroke="#8c584c" strokeWidth="16" strokeLinecap="round" fill="none" />
            <path d="M268 785 C160 780, 120 910, 140 1065 C155 1140, 255 1110, 272 1020 Z" fill="#d98a7c" stroke="#362a20" strokeWidth="5" />
            <path d="M316 785 C424 780, 464 910, 444 1065 C429 1140, 329 1110, 312 1020 Z" fill="#d98a7c" stroke="#362a20" strokeWidth="5" />
          </g>
          <DiagramBadge x={292} y={675} text="HOLD BREATH: OK" delay={10} />
          <DiagramBadge x={292} y={1225} text="FEFDON (LUNGS)" delay={25} />
        </g>

        <g transform={`translate(${shake}, 0)`}>
          <rect x="565" y="610" width="445" height="690" rx="24" fill="#dfd3c3" stroke="#362a20" strokeWidth="5" />
          <rect x="625" y={770 + crack * 35} width="135" height="330" fill="#95a5a6" stroke="#362a20" strokeWidth="5" transform={`rotate(${-crack * 6} 690 1100)`} />
          <rect x="785" y={720 + crack * 50} width="155" height="380" fill="#7f8c8d" stroke="#362a20" strokeWidth="5" transform={`rotate(${crack * 8} 860 1100)`} />
          <path d="M625 850 L700 910 L650 990 M785 810 L875 885 L815 975" stroke="#d43527" strokeWidth={8 * crack} fill="none" />
          <rect x="595" y="1095" width="385" height="55" rx="8" fill="#8c6239" stroke="#362a20" strokeWidth="5" />
          <circle cx="787" cy="925" r="175" fill="none" stroke="#d43527" strokeWidth="5" strokeDasharray="12 8" transform={`rotate(${-frame * 0.9} 787 925)`} />
          <DiagramBadge x={787} y={675} text="OUTSIDE COLLAPSE" variant="red" delay={35} />
          <DiagramBadge x={787} y={1225} text="CHAARON TARAF" delay={45} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 3: Concrete Ca-O-Si Molecular Matrix & Dam Crumbling Into Dust */
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const crumble = interpolate(frame, [75, 220], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const nodes = [
    { x: 360, y: 820, t: 'Ca' }, { x: 540, y: 820, t: 'O' }, { x: 720, y: 820, t: 'Si' },
    { x: 360, y: 960, t: 'O' },  { x: 540, y: 960, t: 'Ca' }, { x: 720, y: 960, t: 'O' },
    { x: 360, y: 1100, t: 'Si' }, { x: 540, y: 1100, t: 'O' }, { x: 720, y: 1100, t: 'Ca' },
  ];

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={3} sectionTag="MATERIAL SCIENCE" />
      <EditorialHeadline line1="CONCRETE BUILDINGS" line2="TURN TO DUST!" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="140" y="590" width="800" height="730" rx="28" fill="#d9d4cc" stroke="#362a20" strokeWidth="6" />
        <rect x="143" y="593" width="794" height="105" rx="24" fill="#a59f95" />
        <line x1="140" y1="698" x2="940" y2="698" stroke="#362a20" strokeWidth="5" />
        <text x="540" y="658" textAnchor="middle" fill="#2b2119" fontSize="27" fontWeight="900" letterSpacing="2">HOOVER DAM & CONCRETE // Ca-O-Si MATRIX</text>

        <g opacity={1 - crumble}>
          <line x1="360" y1="820" x2="720" y2="820" stroke="#362a20" strokeWidth="8" />
          <line x1="360" y1="960" x2="720" y2="960" stroke="#362a20" strokeWidth="8" />
          <line x1="360" y1="1100" x2="720" y2="1100" stroke="#362a20" strokeWidth="8" />
          <line x1="360" y1="820" x2="360" y2="1100" stroke="#362a20" strokeWidth="8" />
          <line x1="540" y1="820" x2="540" y2="1100" stroke="#362a20" strokeWidth="8" />
          <line x1="720" y1="820" x2="720" y2="1100" stroke="#362a20" strokeWidth="8" />
        </g>

        {nodes.map((n, i) => {
          const isO = n.t === 'O';
          const dy = isO ? 0 : crumble * (140 + (i % 3) * 40);
          const dx = isO ? 0 : crumble * ((i % 2 === 0 ? -1 : 1) * 55);
          return (
            <g key={i} transform={`translate(${n.x + dx}, ${n.y + dy})`} opacity={isO ? 1 - crumble : 1}>
              <circle cx="0" cy="0" r={isO ? 44 : 48} fill={isO ? '#d43527' : '#576574'} stroke="#2b2119" strokeWidth="5" />
              <text x="0" y="12" textAnchor="middle" fill="#f6efe0" fontSize="32" fontWeight="900">{n.t}</text>
            </g>
          );
        })}

        {crumble > 0.1 && Array.from({ length: 45 }, (_, i) => (
          <circle key={i} cx={220 + random(`dx${i}`) * 640} cy={1265 - random(`dy${i}`) * 95 * crumble} r={5 + random(`dr${i}`) * 8} fill="#7f786d" opacity={crumble} />
        ))}

        <DiagramBadge x={310} y={1245} text="OXYGEN = CEMENT GLUE" delay={10} />
        <DiagramBadge x={765} y={765} text={crumble > 0.3 ? 'CRUMBLED TO DUST' : 'BONDS SNAPPING'} variant="red" delay={40} />
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 4: Air Pressure -21% & Eardrum Rupture Cross-Section */
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const flex = interpolate(frame, [55, 165], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={4} sectionTag="HUMAN ANATOMY" />
      <EditorialHeadline line1="PRESSURE -21%" line2="KAAN KE PARDE!" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="140" y="590" width="800" height="730" rx="28" fill="#f3d6c1" stroke="#362a20" strokeWidth="6" />
        <rect x="143" y="593" width="794" height="95" rx="24" fill="#c98a6b" />
        <line x1="140" y1="688" x2="940" y2="688" stroke="#362a20" strokeWidth="5" />
        <text x="540" y="652" textAnchor="middle" fill="#2b2119" fontSize="27" fontWeight="900" letterSpacing="2">TYMPANIC MEMBRANE // -21% VACUUM SHOCK</text>

        <path d="M140 865 L560 885 L560 1065 L140 1085 Z" fill="#4a2c24" stroke="#362a20" strokeWidth="5" />
        <path d="M565 850 C735 830, 810 920, 795 1035 C785 1125, 650 1140, 565 1075 Z" fill="#6e3b30" stroke="#362a20" strokeWidth="5" />

        <path d={`M565 875 Q${565 - flex * 105} 975 565 1075`} fill="none" stroke={flex > 0.6 ? '#d43527' : '#f6efe0'} strokeWidth="15" strokeLinecap="round" />

        {flex > 0.62 && (
          <g>
            <circle cx={565 - flex * 52} cy="975" r="26" fill="#d43527" />
            <path d="M475 930 L530 975 L470 1020" stroke="#ffdd59" strokeWidth="8" fill="none" />
          </g>
        )}

        <g transform={`translate(${365 - flex * 60}, 975)`}>
          <line x1="110" y1="0" x2="-40" y2="0" stroke="#f6efe0" strokeWidth="8" />
          <polygon points="-40,-18 -80,0 -40,18" fill="#f6efe0" />
          <text x="20" y="-24" textAnchor="middle" fill="#f6efe0" fontSize="24" fontWeight="900">-21% DROP</text>
        </g>

        <circle cx="565" cy="975" r="160" fill="none" stroke="#d43527" strokeWidth="5" strokeDasharray="12 9" transform={`rotate(${frame * 0.8} 565 975)`} />
        <DiagramBadge x={315} y={1235} text="OUTER EAR CANAL" delay={10} />
        <DiagramBadge x={745} y={775} text={flex > 0.6 ? 'EARDRUM RUPTURED!' : 'KAAN KA PARDA'} variant="red" delay={35} />
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 5: Daytime Black Sky, Falling Plane & Dead Combustion Engine */
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const black = interpolate(frame, [45, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const planeY = interpolate(frame, [0, 240], [780, 1090]);
  const pistonY = frame < 95 ? Math.sin(frame * 0.3) * 45 : 35;
  const gearRot = frame < 95 ? frame * 3 : 95 * 3;

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={5} sectionTag="APPLIED PHYSICS" />
      <EditorialHeadline line1="KAALA AASMAN" line2="& ENGINE DEAD!" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="70" y="610" width="445" height="690" rx="24" fill={black > 0.45 ? '#14171f' : '#70a1be'} stroke="#362a20" strokeWidth="5" />
        <circle cx="175" cy="745" r="50" fill="#f5cd79" stroke="#362a20" strokeWidth="5" />
        {black > 0.35 && (
          <g fill="#f6efe0" opacity={black}>
            <circle cx="380" cy="720" r="5" /><circle cx="430" cy="820" r="4" /><circle cx="150" cy="960" r="5" /><circle cx="350" cy="1060" r="4" />
          </g>
        )}
        <g transform={`translate(290, ${planeY}) rotate(28)`}>
          <path d="M-75 0 L55 0 L80 18 L-70 18 L-90 -22 L-65 -22 Z" fill="#f6efe0" stroke="#362a20" strokeWidth="4" />
          {frame > 60 && <circle cx="-95" cy="5" r="22" fill="#d43527" opacity="0.8" />}
        </g>
        <DiagramBadge x={292} y={670} text="DAYTIME = BLACK" variant="red" delay={15} />
        <DiagramBadge x={292} y={1225} text="NO SCATTERING" delay={30} />

        <rect x="565" y="610" width="445" height="690" rx="24" fill="#dfd6c7" stroke="#362a20" strokeWidth="5" />
        <rect x="675" y="750" width="225" height="330" rx="16" fill="#95a5a6" stroke="#362a20" strokeWidth="5" />
        <rect x="690" y={885 + pistonY} width="195" height="90" rx="10" fill="#576574" stroke="#362a20" strokeWidth="5" />
        <g transform={`translate(787, 815) rotate(${gearRot})`}>
          <circle cx="0" cy="0" r="44" fill="#d48c46" stroke="#362a20" strokeWidth="5" />
          <circle cx="0" cy="0" r="16" fill="#dfd6c7" stroke="#362a20" strokeWidth="4" />
        </g>
        <DiagramBadge x={787} y={670} text="ENGINES STALLED" variant="red" delay={25} />
        <DiagramBadge x={787} y={1225} text="NO COMBUSTION" delay={45} />
      </svg>
    </AbsoluteFill>
  );
};

/* SCENE 6: Earth Crust Strata (45% Oxygen) Cracking & Collapsing */
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const sep = interpolate(frame, [65, 220], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <VintagePaperBackground figNum={6} sectionTag="GEOLOGY // SUMMARY" />
      <EditorialHeadline line1="ZAMEEN KA 45%" line2="HISSA OXYGEN HAI!" />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="140" y="590" width="800" height="730" rx="28" fill="#e5dac7" stroke="#362a20" strokeWidth="6" />

        <g transform={`translate(0, ${-sep * 30})`} opacity={1 - sep * 0.45}>
          <rect x="200" y="700" width="680" height="140" rx="14" fill="#6ab04c" stroke="#362a20" strokeWidth="5" />
          <text x="540" y="780" textAnchor="middle" fill="#2b2119" fontSize="30" fontWeight="900">SURFACE CRUST (SiO2 // 45% OXYGEN)</text>
          <path d="M380 700 L430 770 L395 840 M660 700 L620 775 L670 840" stroke="#d43527" strokeWidth={10 * sep} fill="none" />
        </g>

        <g transform={`translate(0, ${sep * 18})`}>
          <rect x="200" y="860" width="680" height="150" rx="14" fill="#b88b64" stroke="#362a20" strokeWidth="5" />
          <text x="540" y="945" textAnchor="middle" fill="#f6efe0" fontSize="30" fontWeight="900">SILICATE BEDROCK (Al2O3 + MgO)</text>
        </g>

        <rect x="200" y="1030" width="680" height="145" rx="14" fill="#c44536" stroke="#362a20" strokeWidth="5" />
        <text x="540" y="1115" textAnchor="middle" fill="#f6efe0" fontSize="30" fontWeight="900">DEEP MANTLE // LITHOSPHERE</text>

        <circle cx="540" cy="875" r="215" fill="none" stroke="#d43527" strokeWidth="6" strokeDasharray="14 10" transform={`rotate(${frame * 0.7} 540 875)`} />
        <DiagramBadge x={320} y={1245} text="CRUST = 45% O2" delay={10} />
        <DiagramBadge x={755} y={1245} text="GROUND COLLAPSES" variant="red" delay={35} />
      </svg>
    </AbsoluteFill>
  );
};

/* AUTO-SYNCED HINGLISH CAPTIONS (4 Words Per Chunk, Synced to Exact Voice Duration) */
const EditorialPaperCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneIndex = Math.min(SCENES.length - 1, Math.floor(frame / (5 * fps)));
  const scene = SCENES[sceneIndex];
  const localFrame = frame - scene.start * fps;

  const speechFrames = scene.speechDur * fps;
  const words = scene.caption.split(' ');
  const progress = clamp01(localFrame / speechFrames);
  const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

  const chunkSize = 4;
  const activeChunkIndex = Math.floor(activeWordIndex / chunkSize);
  const chunkStart = activeChunkIndex * chunkSize;
  const visibleWords = words.slice(chunkStart, chunkStart + chunkSize);

  return (
    <div style={{ position: 'absolute', left: 55, right: 55, bottom: 155, zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 14, padding: '14px 24px' }}>
        {visibleWords.map((word, idx) => {
          const globalIdx = chunkStart + idx;
          const isActive = globalIdx === activeWordIndex && localFrame <= speechFrames + 15;
          return (
            <span
              key={`${sceneIndex}-${globalIdx}`}
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                fontSize: 44,
                fontWeight: 900,
                fontFamily: 'Arial, Helvetica, sans-serif',
                backgroundColor: isActive ? '#e06324' : 'transparent',
                color: isActive ? '#ffffff' : '#2b2119',
                boxShadow: isActive ? '0 6px 16px rgba(224, 99, 36, 0.35)' : 'none',
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

const ScienceReel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#eadec5' }}>
    <TopScientificTelemetry />
    {SCENES.map((scene, index) => (
      <Sequence key={index} from={scene.start * 60} durationInFrames={scene.duration * 60}>
        {index === 0 && <Scene1 />}
        {index === 1 && <Scene2 />}
        {index === 2 && <Scene3 />}
        {index === 3 && <Scene4 />}
        {index === 4 && <Scene5 />}
        {index === 5 && <Scene6 />}
      </Sequence>
    ))}
    <Audio src={staticFile('voice.mp3')} />
    <EditorialPaperCaptions />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="Reel" component={ScienceReel} durationInFrames={1800} fps={60} width={1080} height={1920} />
);
