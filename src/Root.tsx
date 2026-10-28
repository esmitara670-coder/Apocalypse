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

const VOICE = "hi-IN-SwaraNeural";

const SCENES = [
  { start: 0, duration: 3.5, speechDur: 3.1, caption: "Agar duniya se oxygen sirf 5 second ke liye gayab ho jaye,", tts: "अगर दुनिया से ऑक्सीजन सिर्फ पांच सेकंड के लिए गायब हो जाए," },
  { start: 3.5, duration: 3.5, speechDur: 3.0, caption: "Toh saans rok kar bhi aap bilkul nahi bach paoge!", tts: "तो सांस रोक कर भी आप बिलकुल नहीं बच पाओगे!" },
  { start: 7.0, duration: 3.5, speechDur: 3.2, caption: "Kyunki oxygen hi har concrete building ko jod kar rakhta hai.", tts: "क्योंकि ऑक्सीजन ही हर कंक्रीट बिल्डिंग को जोड़ कर रखता है।" },
  { start: 10.5, duration: 3.5, speechDur: 3.2, caption: "Hawa ka pressure girte hi sabke kaan ke parde turant phat jayenge.", tts: "हवा का प्रेशर गिरते ही सबके कान के पर्दे तुरंत फट जाएंगे।" },
  { start: 14.0, duration: 3.5, speechDur: 3.2, caption: "Din mein aasman poora kaala hoga aur saare engine band ho jayenge.", tts: "दिन में आसमान पूरा काला होगा और सारे इंजन बंद हो जाएंगे।" },
  { start: 17.5, duration: 3.5, speechDur: 3.2, caption: "Kyunki zameen ki parat bhi 45 percent oxygen se hi bani hai!", tts: "क्योंकि जमीन की परत भी पैंतालीस परसेंट ऑक्सीजन से ही बनी है!" }
];

type Scene = (typeof SCENES)[number];
type ArtProps = { frame: number; fps: number };
type Meta = { section: string; title: [string, string]; plate: string; note: string };

const META: Meta[] = [
  { section: 'ATMOSPHERE', title: ['WHAT IF OXYGEN', 'VANISHED FOR 5 SECONDS?'], plate: 'ATMOSPHERIC SPECIMEN', note: 'COVALENT OXYGEN / MOLECULAR VIEW' },
  { section: 'SURVIVAL', title: ['HOLD YOUR BREATH', 'THE WORLD STILL FAILS'], plate: 'BODY VS. BUILT WORLD', note: 'RESPIRATORY / STRUCTURAL COMPARISON' },
  { section: 'STRUCTURES', title: ['CONCRETE DEPENDS', 'ON INVISIBLE BONDS'], plate: 'CONCRETE UNDER STRESS', note: 'MACROSTRUCTURE / MOLECULAR LATTICE' },
  { section: 'PRESSURE', title: ['PRESSURE PLUMMETS', 'THE EARDRUM RUPTURES'], plate: 'THE HUMAN EAR', note: 'TYMPANIC MEMBRANE / PRESSURE DROP' },
  { section: 'PHYSICS', title: ['DAYLIGHT GOES DARK', 'ENGINES LOSE POWER'], plate: 'SKY & COMBUSTION', note: 'LIGHT SCATTERING / ENGINE CYCLE' },
  { section: 'GEOLOGY', title: ['BENEATH OUR FEET', 'THE CRUST COMES APART'], plate: 'LITHOSPHERE SECTION', note: 'STRATIGRAPHY / SILICATE CRUST' },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (frame: number, fps: number, start: number, end: number) =>
  interpolate(frame / fps, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
const rand = (seed: string, n: number) => random(`${seed}-${n}`);
const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const sans = 'Arial, Helvetica, sans-serif';

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="platePaper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f8f1e3" />
      <stop offset="55%" stopColor="#e9dcc4" />
      <stop offset="100%" stopColor="#d5c19f" />
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fffdf5" stopOpacity="0.75" />
      <stop offset="40%" stopColor="#b9d8d9" stopOpacity="0.25" />
      <stop offset="75%" stopColor="#f9ffff" stopOpacity="0.48" />
      <stop offset="100%" stopColor="#789a99" stopOpacity="0.3" />
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f6e8ca" />
      <stop offset="25%" stopColor="#9d8b70" />
      <stop offset="55%" stopColor="#d2c1a2" />
      <stop offset="100%" stopColor="#62574b" />
    </linearGradient>
    <linearGradient id="concrete" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#e8d8ba" />
      <stop offset="50%" stopColor="#b1a088" />
      <stop offset="100%" stopColor="#756a5e" />
    </linearGradient>
    <linearGradient id="bone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fff7dd" />
      <stop offset="55%" stopColor="#d8c5a3" />
      <stop offset="100%" stopColor="#a9906c" />
    </linearGradient>
    <linearGradient id="lung" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f3b39b" />
      <stop offset="55%" stopColor="#c97061" />
      <stop offset="100%" stopColor="#813f3b" />
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#438db6" />
      <stop offset="60%" stopColor="#92c9d6" />
      <stop offset="100%" stopColor="#f4dfba" />
    </linearGradient>
    <linearGradient id="crust" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stopColor="#d6b77f" />
      <stop offset="55%" stopColor="#a87c4e" />
      <stop offset="100%" stopColor="#765438" />
    </linearGradient>
    <linearGradient id="mantle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#a7432e" />
      <stop offset="50%" stopColor="#d75b31" />
      <stop offset="100%" stopColor="#6d281f" />
    </linearGradient>
    <radialGradient id="oxygen" cx="30%" cy="25%" r="75%">
      <stop offset="0%" stopColor="#fff5d4" />
      <stop offset="20%" stopColor="#ff9977" />
      <stop offset="58%" stopColor="#db4032" />
      <stop offset="100%" stopColor="#701d20" />
    </radialGradient>
    <radialGradient id="blueAtom" cx="30%" cy="25%" r="75%">
      <stop offset="0%" stopColor="#f6ffff" />
      <stop offset="30%" stopColor="#a9cacc" />
      <stop offset="100%" stopColor="#40656c" />
    </radialGradient>
    <radialGradient id="sandAtom" cx="30%" cy="25%" r="75%">
      <stop offset="0%" stopColor="#fff8df" />
      <stop offset="40%" stopColor="#d2b37f" />
      <stop offset="100%" stopColor="#795a38" />
    </radialGradient>
    <radialGradient id="dust" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#c6b59d" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#b6a28a" stopOpacity="0" />
    </radialGradient>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="9" stroke="#554334" strokeWidth="1.2" opacity="0.23" />
    </pattern>
    <filter id="softShadow" x="-35%" y="-35%" width="170%" height="180%">
      <feDropShadow dx="4" dy="8" stdDeviation="8" floodColor="#46362a" floodOpacity="0.27" />
    </filter>
    <filter id="redGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0 0 L8 4 L0 8 Z" fill="#c83d2c" />
    </marker>
    <clipPath id="latticeClip"><circle cx="704" cy="370" r="203" /></clipPath>
    <clipPath id="skyClip"><rect x="37" y="145" width="405" height="480" rx="13" /></clipPath>
  </defs>
);

const SceneOne: React.FC<ArtProps> = ({ frame, fps }) => {
  const split = clamp01(spring({ frame: Math.max(0, frame - Math.round(1.05 * fps)), fps, config: { damping: 18, stiffness: 65, mass: 0.9 } }));
  const vanish = ramp(frame, fps, 1.9, 2.8);
  const orbit = frame / fps;
  const lensX = 650 + 78 * Math.sin(orbit * 1.05);
  const lensY = 300 + 22 * Math.sin(orbit * 1.4);
  const ax1 = 388 - split * 60;
  const ax2 = 552 + split * 60;
  return (
    <g>
      <rect x="131" y="126" width="690" height="498" rx="58" fill="url(#glass)" stroke="#7d8980" strokeWidth="5" filter="url(#softShadow)" />
      <ellipse cx="476" cy="142" rx="329" ry="30" fill="#f9f9ec" fillOpacity="0.42" stroke="#8b9a90" strokeWidth="4" />
      <ellipse cx="476" cy="607" rx="328" ry="31" fill="#76908d" fillOpacity="0.18" stroke="#82938b" strokeWidth="4" />
      <path d="M164 177 Q155 370 166 570 M795 177 Q805 370 793 570" fill="none" stroke="#fffdf2" strokeWidth="9" opacity="0.55" />
      <rect x="199" y="612" width="557" height="29" rx="7" fill="url(#metal)" stroke="#6b5b4b" strokeWidth="2" />
      <path d="M228 644 H725 L754 671 H197 Z" fill="#716251" opacity="0.85" />
      <path d="M190 210 V541 M185 210 H195 M185 265 H195 M185 320 H195 M185 375 H195 M185 430 H195 M185 485 H195 M185 541 H195" stroke="#7d7162" strokeWidth="2" opacity="0.6" />
      <text x="199" y="216" fontSize="12" fill="#786b5e">100</text>
      <text x="199" y="544" fontSize="12" fill="#786b5e">000</text>

      <g opacity={1 - vanish * 0.7}>
        <ellipse cx="470" cy="370" rx="257" ry="104" fill="none" stroke="#7b9693" strokeWidth="2" strokeDasharray="8 8" transform={`rotate(${orbit * 18} 470 370)`} />
        <ellipse cx="470" cy="370" rx="230" ry="130" fill="none" stroke="#b87a55" strokeWidth="2" strokeDasharray="3 8" transform={`rotate(${-28 - orbit * 12} 470 370)`} />
        <ellipse cx="470" cy="370" rx="205" ry="145" fill="none" stroke="#91a7a0" strokeWidth="1.5" transform={`rotate(${45 + orbit * 10} 470 370)`} />
        {[0, 1, 2, 3].map((i) => {
          const a = orbit * (i % 2 ? -1.4 : 1.2) + i * Math.PI / 2;
          return <circle key={i} cx={470 + Math.cos(a) * 230} cy={370 + Math.sin(a) * 105} r="6" fill="#dd6a3b" filter="url(#redGlow)" />;
        })}
      </g>
      <g opacity={1 - split} stroke="#6a382c" strokeWidth="12" strokeLinecap="round">
        <line x1="438" y1="358" x2="502" y2="358" />
        <line x1="438" y1="383" x2="502" y2="383" />
      </g>
      <g opacity={1 - vanish} filter="url(#softShadow)">
        <circle cx={ax1} cy="370" r="72" fill="url(#oxygen)" stroke="#8e3226" strokeWidth="3" />
        <circle cx={ax2} cy="370" r="72" fill="url(#oxygen)" stroke="#8e3226" strokeWidth="3" />
        <ellipse cx={ax1 - 23} cy="345" rx="20" ry="10" fill="#fff8e6" opacity="0.55" transform={`rotate(-35 ${ax1 - 23} 345)`} />
        <ellipse cx={ax2 - 23} cy="345" rx="20" ry="10" fill="#fff8e6" opacity="0.55" transform={`rotate(-35 ${ax2 - 23} 345)`} />
        <text x={ax1} y="387" textAnchor="middle" fontFamily={sans} fontWeight="900" fontSize="54" fill="#fff6e7">O</text>
        <text x={ax2} y="387" textAnchor="middle" fontFamily={sans} fontWeight="900" fontSize="54" fill="#fff6e7">O</text>
      </g>
      {Array.from({ length: 36 }, (_, i) => {
        const a = rand('o-angle', i) * Math.PI * 2;
        const distance = (45 + rand('o-distance', i) * 155) * vanish;
        const side = i % 2 === 0 ? -1 : 1;
        const x = 470 + side * (95 + split * 55) + Math.cos(a) * distance;
        const y = 370 + Math.sin(a) * distance;
        return <circle key={i} cx={x} cy={y} r={2.5 + rand('o-size', i) * 6} fill={i % 3 === 0 ? '#e9915d' : '#bd3e31'} opacity={Math.sin(vanish * Math.PI) * 0.9} />;
      })}
      <g transform={`translate(${lensX} ${lensY}) rotate(-22)`}>
        <line x1="54" y1="70" x2="145" y2="190" stroke="#544537" strokeWidth="36" strokeLinecap="round" />
        <line x1="54" y1="70" x2="140" y2="185" stroke="url(#metal)" strokeWidth="24" strokeLinecap="round" />
        <circle r="92" fill="url(#glass)" stroke="#655846" strokeWidth="14" />
        <circle r="78" fill="#d2efec" fillOpacity="0.12" stroke="#f7f6df" strokeWidth="3" />
        <path d="M-57 -42 Q-30 -74 12 -72 M-65 -24 Q-71 -10 -70 5" fill="none" stroke="#fffef5" strokeWidth="8" strokeLinecap="round" opacity="0.72" />
        <path d="M34 57 Q56 43 65 24" fill="none" stroke="#fffef5" strokeWidth="4" opacity="0.55" />
      </g>
      <rect x="340" y="671" width="273" height="36" rx="18" fill="#3c3025" />
      <text x="476" y="695" textAnchor="middle" fontFamily={mono} fontSize="15" fontWeight="700" letterSpacing="1" fill="#f9e9ce">O=O  /  BOND {split > 0.72 ? 'BROKEN' : 'INTACT'}</text>
    </g>
  );
};

const SceneTwo: React.FC<ArtProps> = ({ frame, fps }) => {
  const breathTime = Math.min(frame / fps, 1.25);
  const expand = 1 + 0.055 * Math.sin(breathTime * 1.2);
  const stress = ramp(frame, fps, 0.9, 1.8);
  const dust = ramp(frame, fps, 1.7, 2.8);
  const shake = stress * (Math.sin(frame * 1.7) * 3.3 + Math.sin(frame * 0.43) * 2);
  const buildings = [
    { x: 520, y: 315, w: 64, h: 245 },
    { x: 592, y: 238, w: 84, h: 322 },
    { x: 685, y: 288, w: 64, h: 272 },
    { x: 755, y: 203, w: 75, h: 357 },
    { x: 840, y: 297, w: 61, h: 263 },
  ];
  return (
    <g>
      <rect x="37" y="121" width="407" height="556" rx="16" fill="#f4e8d4" stroke="#c7b49a" strokeWidth="2" />
      <rect x="516" y="121" width="407" height="556" rx="16" fill="#e5d7bf" stroke="#c2ae92" strokeWidth="2" />
      <line x1="480" y1="127" x2="480" y2="686" stroke="#aa977d" strokeDasharray="7 9" strokeWidth="2" />
      <text x="57" y="153" fontFamily={mono} fontSize="15" fontWeight="700" fill="#8e4b38">01 / AIR HELD</text>
      <text x="536" y="153" fontFamily={mono} fontSize="15" fontWeight="700" fill="#8e4b38">02 / STRUCTURAL STRESS</text>
      <path d="M196 185 Q215 166 240 166 Q265 166 284 185 L299 211 Q337 218 364 244 Q381 270 382 338 L371 556 Q326 613 240 620 Q154 613 109 556 L98 338 Q99 270 116 244 Q143 218 181 211 Z" fill="url(#bone)" stroke="#907c66" strokeWidth="4" filter="url(#softShadow)" />
      <path d="M191 190 Q240 215 289 190 L288 221 Q240 241 192 221 Z" fill="#bf9e84" opacity="0.8" />
      <g transform={`translate(240 413) scale(${expand} 1) translate(-240 -413)`}>
        <path d="M224 273 C190 252 154 269 137 318 C120 368 119 464 134 500 C145 531 178 543 216 523 C231 515 230 481 230 445 L230 310 Z" fill="url(#lung)" stroke="#8e5147" strokeWidth="3" />
        <path d="M256 273 C290 252 326 269 343 318 C360 368 361 464 346 500 C335 531 302 543 264 523 C249 515 250 481 250 445 L250 310 Z" fill="url(#lung)" stroke="#8e5147" strokeWidth="3" />
        <path d="M145 394 Q181 408 221 390 M259 389 Q301 411 337 392 M151 456 Q180 462 216 451 M264 451 Q299 465 330 455" fill="none" stroke="#f0b3a0" strokeWidth="3" opacity="0.55" />
        <path d="M240 225 V316 M240 305 L208 339 L182 365 M240 305 L272 339 L298 365 M208 338 L194 395 M272 338 L286 395 M182 365 L159 388 M298 365 L321 389" fill="none" stroke="#f6d6ba" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M240 225 V316 M240 305 L208 339 L182 365 M240 305 L272 339 L298 365" fill="none" stroke="#a66d5e" strokeWidth="3" strokeLinecap="round" />
      </g>
      {Array.from({ length: 7 }, (_, i) => {
        const y = 281 + i * 38;
        return (
          <g key={i} fill="none" stroke="#f1e2ca" strokeWidth="11" strokeLinecap="round" opacity="0.87">
            <path d={`M231 ${y} Q184 ${y - 29} 137 ${y + 12}`} />
            <path d={`M249 ${y} Q296 ${y - 29} 343 ${y + 12}`} />
          </g>
        );
      })}
      <path d="M240 280 V494" stroke="#e8d6bc" strokeWidth="15" strokeLinecap="round" />
      <path d="M132 522 Q240 583 348 522" fill="none" stroke="#9e6f5e" strokeWidth="5" opacity="0.6" />
      <text x="240" y="654" textAnchor="middle" fontFamily={mono} fontSize="15" fontWeight="700" fill="#745c4d">{frame / fps > 1.25 ? 'BREATH HELD' : 'INHALING'} / LUNGS</text>

      <g transform={`translate(${shake} ${shake * 0.45})`}>
        <path d="M520 572 H914 V604 H520 Z" fill="#8d8f7d" opacity="0.5" />
        {buildings.map((b, i) => (
          <g key={i}>
            <path d={`M${b.x} ${b.y} l13 -12 h${b.w} l-13 12 Z`} fill="#e8dbc4" stroke="#776b5c" strokeWidth="2" />
            <path d={`M${b.x + b.w} ${b.y} l13 -12 v${b.h} l-13 12 Z`} fill="#777668" stroke="#695f51" strokeWidth="2" />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#concrete)" stroke="#6e6457" strokeWidth="2" />
            {Array.from({ length: Math.floor(b.h / 31) }, (_, row) =>
              Array.from({ length: Math.max(2, Math.floor(b.w / 20)) }, (_, col) => (
                <rect key={`${row}-${col}`} x={b.x + 10 + col * 19} y={b.y + 15 + row * 30} width="8" height="12" fill="#625f56" opacity="0.65" />
              )),
            )}
          </g>
        ))}
        <path d="M529 545 H913 L902 564 H538 Z" fill="#544e48" stroke="#3e3a35" strokeWidth="3" />
        <path d="M580 543 V405 M830 543 V405" stroke="#6b6358" strokeWidth="14" />
        <path d="M552 423 Q580 527 705 531 Q830 527 858 423" fill="none" stroke="#62594e" strokeWidth="5" />
        {[606, 640, 674, 706, 738, 770, 804].map((x, i) => (
          <line key={x} x1={x} y1={505 + 22 * (1 - Math.abs(i - 3) / 4)} x2={x} y2="546" stroke="#6c6255" strokeWidth="2" />
        ))}
        <g opacity={stress} fill="none" stroke="#bc352b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M638 281 l-12 39 18 10 -21 44 13 13 -20 46" />
          <path d="M788 248 l-10 37 14 16 -15 37 16 11 -14 44" />
          <path d="M700 538 l-10 12 18 9 -11 13" />
        </g>
        <g opacity={stress} stroke="#c83d2c" strokeWidth="4" markerEnd="url(#arrowRed)">
          <line x1="565" y1="210" x2="610" y2="260" />
          <line x1="881" y1="203" x2="833" y2="259" />
          <line x1="713" y1="470" x2="713" y2="523" />
        </g>
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={530 + rand('city-dust-x', i) * 365} cy={590 - rand('city-dust-y', i) * 48 - dust * rand('city-dust-dy', i) * 38} r={8 + rand('city-dust-r', i) * 29} fill="url(#dust)" opacity={dust * 0.85} />
        ))}
      </g>
      <text x="720" y="654" textAnchor="middle" fontFamily={mono} fontSize="15" fontWeight="700" fill="#745c4d">BUILDINGS + BRIDGE / STRESS</text>
    </g>
  );
};

const SceneThree: React.FC<ArtProps> = ({ frame, fps }) => {
  const fracture = clamp01(spring({ frame: Math.max(0, frame - Math.round(0.95 * fps)), fps, config: { damping: 20, stiffness: 60 } }));
  const cloud = ramp(frame, fps, 1.3, 2.75);
  const collapse = ramp(frame, fps, 1.35, 3.1);
  const zoom = 0.8 + 0.2 * ramp(frame, fps, 0, 0.8);
  const shake = fracture * (Math.sin(frame * 1.8) * 2.8 + Math.sin(frame * 0.57) * 1.5);
  const nodes: Array<{ x: number; y: number; label: 'Ca' | 'O' | 'Si' }> = [
    { x: 547, y: 326, label: 'Si' }, { x: 614, y: 253, label: 'O' },
    { x: 705, y: 238, label: 'Si' }, { x: 790, y: 255, label: 'O' },
    { x: 850, y: 335, label: 'Ca' }, { x: 622, y: 356, label: 'O' },
    { x: 705, y: 363, label: 'Si' }, { x: 793, y: 375, label: 'O' },
    { x: 590, y: 453, label: 'Si' }, { x: 690, y: 476, label: 'O' },
    { x: 795, y: 463, label: 'Si' },
  ];
  const links: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 4], [5, 8], [8, 9], [9, 6], [9, 10], [10, 7], [2, 5], [2, 7]];
  return (
    <g>
      <text x="47" y="125" fontFamily={mono} fontSize="14" fontWeight="700" fill="#8e4b38">MACRO / HOOVER DAM + CITY</text>
      <text x="537" y="125" fontFamily={mono} fontSize="14" fontWeight="700" fill="#8e4b38">MICRO / CEMENT LATTICE</text>
      <line x1="478" y1="139" x2="478" y2="676" stroke="#a5947b" strokeDasharray="7 9" strokeWidth="2" />
      <g transform={`translate(${shake} ${shake * 0.5})`}>
        <path d="M40 603 Q145 565 252 599 T461 590 V669 H40 Z" fill="#8fb0a7" opacity="0.55" />
        {[
          { x: 73, y: 242, w: 72, h: 195 }, { x: 154, y: 186, w: 85, h: 260 },
          { x: 248, y: 226, w: 70, h: 220 }, { x: 330, y: 155, w: 67, h: 285 },
        ].map((b, i) => (
          <g key={i} transform={`translate(0 ${collapse * (i % 2 ? 38 : 24)}) rotate(${collapse * (i % 2 ? 5 : -4)} ${b.x + b.w / 2} ${b.y + b.h})`}>
            <path d={`M${b.x} ${b.y} l12 -10 h${b.w} l-12 10 Z`} fill="#e9dcc4" stroke="#796d5d" strokeWidth="2" />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#concrete)" stroke="#756a5b" strokeWidth="2" />
            {Array.from({ length: Math.floor(b.h / 28) }, (_, row) =>
              Array.from({ length: Math.floor(b.w / 18) }, (_, col) => (
                <rect key={`${row}-${col}`} x={b.x + 8 + col * 17} y={b.y + 12 + row * 26} width="7" height="11" fill="#5d625c" opacity="0.7" />
              )),
            )}
          </g>
        ))}
        <path d="M43 414 Q238 337 453 414 L412 586 Q239 666 86 586 Z" fill="url(#concrete)" stroke="#756856" strokeWidth="5" filter="url(#softShadow)" />
        <path d="M43 414 Q238 337 453 414 L449 435 Q240 365 47 436 Z" fill="#eee0c4" stroke="#7c6d59" strokeWidth="3" />
        <path d="M89 468 Q240 419 408 468 M95 500 Q240 454 401 500 M102 539 Q240 495 392 539 M111 577 Q240 540 381 577" fill="none" stroke="#8b7b67" strokeWidth="3" opacity="0.65" />
        <path d="M150 405 L162 575 M236 392 L236 603 M321 397 L310 578" fill="none" stroke="#8a7a66" strokeWidth="3" opacity="0.7" />
        <g opacity={fracture} fill="none" stroke="#bc392b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M200 391 l13 38 -15 20 21 25 -17 30 22 25 -12 29" />
          <path d="M351 410 l-13 36 16 17 -20 29 12 18 -14 33" />
          <path d="M176 208 l16 34 -12 22 15 25" />
          <path d="M360 178 l-10 38 12 20 -11 30" />
        </g>
        {[
          { d: 'M168 416 l39 -9 -8 52 -31 7 Z', x: -18, y: 65, r: -21, cx: 185, cy: 440 },
          { d: 'M220 403 l38 -3 3 54 -32 6 Z', x: 9, y: 76, r: 17, cx: 240, cy: 430 },
          { d: 'M319 413 l31 8 -6 51 -35 -10 Z', x: 22, y: 58, r: 22, cx: 330, cy: 440 },
        ].map((piece, i) => (
          <g key={i} opacity={collapse}>
            <path d={piece.d} fill="#55473b" />
            <path d={piece.d} fill="url(#concrete)" stroke="#766351" strokeWidth="2" transform={`translate(${piece.x * collapse} ${piece.y * collapse}) rotate(${piece.r * collapse} ${piece.cx} ${piece.cy})`} />
          </g>
        ))}
        {Array.from({ length: 22 }, (_, i) => {
          const delay = rand('dam-piece-delay', i) * 0.5;
          const drop = ramp(frame, fps, 1.4 + delay, 2.6 + delay);
          const x = 65 + rand('dam-piece-x', i) * 360;
          const y = 315 + rand('dam-piece-y', i) * 180 + drop * (40 + rand('dam-piece-v', i) * 115);
          const size = 4 + rand('dam-piece-size', i) * 10;
          return <rect key={i} x={x} y={y} width={size} height={size * 0.7} fill={i % 2 ? '#8d7d69' : '#d2c0a4'} opacity={drop > 0 ? 0.85 : 0} transform={`rotate(${drop * 120} ${x} ${y})`} />;
        })}
        {Array.from({ length: 36 }, (_, i) => (
          <circle key={i} cx={45 + rand('dam-dust-x', i) * 415} cy={610 - rand('dam-dust-y', i) * 55 - cloud * rand('dam-dust-v', i) * 125} r={25 + rand('dam-dust-r', i) * 52} fill="url(#dust)" opacity={cloud * 0.9} />
        ))}
      </g>
      <rect x="84" y="636" width="165" height="28" rx="4" fill="#51483e" />
      <text x="166" y="655" textAnchor="middle" fontFamily={mono} fontSize="13" fontWeight="700" fill="#f6e8d2">HOOVER DAM</text>

      <g transform={`translate(704 370) scale(${zoom}) translate(-704 -370)`}>
      <circle cx="704" cy="370" r="213" fill="#5e6f6a" opacity="0.15" filter="url(#softShadow)" />
      <circle cx="704" cy="370" r="203" fill="#efe6d2" stroke="#6e6658" strokeWidth="8" />
      <g clipPath="url(#latticeClip)">
        <rect x="500" y="165" width="410" height="410" fill="url(#glass)" />
        {links.map(([ia, ib], i) => {
          const a = nodes[ia];
          const b = nodes[ib];
          const reach = 0.5 * (1 - fracture * 0.55);
          return (
            <g key={i} stroke="#77766b" strokeWidth="10" strokeLinecap="round" opacity="0.9">
              <line x1={a.x} y1={a.y} x2={lerp(a.x, b.x, reach)} y2={lerp(a.y, b.y, reach)} />
              <line x1={b.x} y1={b.y} x2={lerp(b.x, a.x, reach)} y2={lerp(b.y, a.y, reach)} />
            </g>
          );
        })}
        {nodes.map((node, i) => (
          <g key={i} opacity={node.label === 'O' ? 1 - fracture : 1}>
            <circle cx={node.x} cy={node.y} r={node.label === 'O' ? 25 : 30} fill={node.label === 'O' ? 'url(#oxygen)' : node.label === 'Si' ? 'url(#blueAtom)' : 'url(#sandAtom)'} stroke="#665b50" strokeWidth="2" filter="url(#softShadow)" />
            <text x={node.x} y={node.y + 7} textAnchor="middle" fontFamily={sans} fontSize={node.label === 'O' ? 21 : 19} fontWeight="900" fill="#fff9ed">{node.label}</text>
          </g>
        ))}
        {Array.from({ length: 20 }, (_, i) => {
          const a = rand('lattice-a', i) * Math.PI * 2;
          const radius = fracture * (18 + rand('lattice-v', i) * 57);
          const node = nodes[[1, 3, 5, 7, 9][i % 5]];
          return <circle key={i} cx={node.x + Math.cos(a) * radius} cy={node.y + Math.sin(a) * radius} r={2 + rand('lattice-r', i) * 3} fill="#cb4837" opacity={Math.sin(fracture * Math.PI)} />;
        })}
      </g>
      <circle cx="704" cy="370" r="203" fill="none" stroke="#f7f1e2" strokeWidth="3" opacity="0.7" />
      <path d="M848 514 L909 574" stroke="#5f5143" strokeWidth="25" strokeLinecap="round" />
      <path d="M848 514 L909 574" stroke="url(#metal)" strokeWidth="15" strokeLinecap="round" />
      </g>
      <text x="704" y="645" textAnchor="middle" fontFamily={mono} fontSize="16" fontWeight="700" fill="#745548">Ca — O — Si  /  {fracture > 0.7 ? 'BONDS FAIL' : 'BONDED'}</text>
    </g>
  );
};

const SceneFour: React.FC<ArtProps> = ({ frame, fps }) => {
  const pressure = ramp(frame, fps, 0.25, 2.05);
  const bulge = clamp01(spring({ frame: Math.max(0, frame - Math.round(0.6 * fps)), fps, config: { damping: 17, stiffness: 50 } }));
  const rupture = ramp(frame, fps, 1.8, 2.1);
  const membraneX = 501 - bulge * 35;
  const top = 281 + pressure * 121;
  const reading = lerp(101.3, 79.8, pressure);
  return (
    <g>
      <text x="48" y="125" fontFamily={mono} fontSize="14" fontWeight="700" fill="#8e4b38">ANATOMICAL SECTION / EAR</text>
      <text x="746" y="125" fontFamily={mono} fontSize="14" fontWeight="700" fill="#8e4b38">BAROMETER</text>
      <path d="M215 165 C285 160 384 185 472 200 C556 215 641 222 694 274 L703 503 C642 551 555 568 478 574 C376 583 281 560 209 542 C158 529 137 496 140 454 L141 264 C147 215 173 179 215 165 Z" fill="url(#bone)" stroke="#9d8970" strokeWidth="4" filter="url(#softShadow)" />
      <path d="M236 183 C334 180 416 210 493 226 M216 556 C335 568 443 586 557 559 M562 237 Q662 253 689 293 M562 532 Q658 520 691 486" fill="none" stroke="#f6e9d2" strokeWidth="14" opacity="0.5" />
      <path d="M181 297 C232 295 285 318 338 322 C405 327 454 313 508 302 L508 462 C454 451 399 438 339 443 C283 448 226 475 180 461 C158 447 150 414 150 379 C150 343 160 312 181 297 Z" fill="#694e44" stroke="#9b715f" strokeWidth="6" />
      <path d="M190 318 C278 317 316 347 400 340 L491 325 M190 443 C282 445 323 418 401 425 L490 446" fill="none" stroke="#d7a48c" strokeWidth="8" opacity="0.55" />
      <path d="M202 334 C259 337 306 355 351 354 M200 429 C266 426 302 407 347 409" fill="none" stroke="#edc1a4" strokeWidth="3" opacity="0.48" />
      <path d="M172 166 C103 168 64 222 63 295 C62 354 73 419 106 472 C127 507 151 532 180 536 C211 540 226 521 228 498 C231 475 213 464 199 452 C184 439 184 421 191 408 C203 386 205 367 191 346 C181 330 168 321 172 305 C177 287 201 285 205 268 C209 250 189 242 174 244 C160 246 150 259 142 275 C132 293 116 286 119 266 C124 228 151 205 182 209 C208 212 221 231 226 250 L246 236 C239 194 211 165 172 166 Z" fill="url(#bone)" stroke="#9b7965" strokeWidth="5" />
      <path d="M159 200 C105 207 91 261 95 310 C99 349 110 376 129 395 M126 425 Q140 471 178 490 M167 226 C135 230 126 257 131 282 M148 313 C123 334 129 372 151 389" fill="none" stroke="#b27e69" strokeWidth="7" strokeLinecap="round" opacity="0.75" />
      <path d="M163 203 C117 220 109 258 110 292" fill="none" stroke="#fff1d5" strokeWidth="5" strokeLinecap="round" opacity="0.8" />

      {Array.from({ length: 4 }, (_, i) => {
        const x = 195 + ((frame * 2.1 + i * 70) % 280);
        return <path key={i} d={`M${x} 345 Q${x + 26} 380 ${x} 415`} fill="none" stroke="#f4a057" strokeWidth="5" opacity={(0.25 + pressure * 0.6) * (1 - rupture * 0.3)} />;
      })}
      <path d="M512 297 Q522 379 512 465" fill="none" stroke="#796452" strokeWidth="5" strokeDasharray="7 7" opacity="0.55" />
      <g fill="none" stroke="#c96048" strokeWidth="14" strokeLinecap="round">
        <path d={`M505 300 Q${membraneX - 15} 335 ${membraneX} ${380 - rupture * 13}`} />
        <path d={`M${membraneX} ${380 + rupture * 13} Q${membraneX - 15} 425 505 463`} />
      </g>
      <g fill="none" stroke="#ffe2c9" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        <path d={`M503 302 Q${membraneX - 16} 335 ${membraneX - 2} ${380 - rupture * 15}`} />
        <path d={`M${membraneX - 2} ${380 + rupture * 15} Q${membraneX - 16} 425 503 461`} />
      </g>
      <g stroke="#fff0d4" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M517 357 l28 -27 24 17 -4 37 -25 23" />
        <path d="M567 347 l24 -13 17 13 -17 15 -23 9" />
        <path d="M591 362 l19 12 -3 19 -17 5 -11 -10" />
      </g>
      <g stroke="#a5866a" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M517 357 l28 -27 24 17 -4 37 -25 23 M567 347 l24 -13 17 13 -17 15 -23 9 M591 362 l19 12 -3 19 -17 5 -11 -10" />
      </g>
      <path d="M605 328 C616 299 653 299 670 321 C686 341 678 366 663 375 C678 393 670 422 648 434 C628 445 601 433 596 415 C589 391 606 377 625 377 C645 377 651 398 640 407 C630 414 620 408 622 398" fill="#d8a07d" stroke="#936951" strokeWidth="5" />
      <path d="M618 338 C638 320 659 335 655 352 C652 366 635 372 625 362 C617 354 621 345 632 345" fill="none" stroke="#f9ddbd" strokeWidth="6" />
      <path d="M634 310 C633 269 614 256 606 276 C599 294 626 303 634 310 M650 310 C662 275 681 273 682 292 C683 307 663 313 650 310" fill="none" stroke="#a87860" strokeWidth="7" />
      <path d="M669 397 L700 379 M672 408 L705 399 M670 418 L701 422" stroke="#e6cf9a" strokeWidth="6" strokeLinecap="round" />
      <g opacity={rupture} stroke="#cb3d2f" strokeWidth="5" strokeLinecap="round">
        <line x1={membraneX - 7} y1="352" x2={membraneX - 26} y2="330" />
        <line x1={membraneX - 20} y1="367" x2={membraneX - 48} y2="356" />
        <line x1={membraneX - 23} y1="389" x2={membraneX - 53} y2="394" />
        <line x1={membraneX - 8} y1="407" x2={membraneX - 29} y2="432" />
      </g>
      <text x="170" y="597" fontFamily={mono} fontSize="14" fontWeight="700" fill="#715848">EAR CANAL</text>
      <line x1="255" y1="582" x2="298" y2="459" stroke="#8f7763" strokeWidth="2" />
      <text x="405" y="628" fontFamily={mono} fontSize="14" fontWeight="700" fill="#a13e30">EARDRUM</text>
      <line x1="471" y1="610" x2={membraneX} y2="468" stroke="#a13e30" strokeWidth="2" />
      <text x="586" y="591" fontFamily={mono} fontSize="14" fontWeight="700" fill="#715848">OSSICLES</text>
      <line x1="607" y1="578" x2="570" y2="409" stroke="#8f7763" strokeWidth="2" />

      <rect x="734" y="153" width="183" height="501" rx="17" fill="#e8ddc9" stroke="#a18d73" strokeWidth="3" />
      <rect x="753" y="176" width="145" height="67" rx="8" fill="#352d26" />
      <text x="825" y="202" textAnchor="middle" fontFamily={mono} fontSize="13" letterSpacing="1" fill="#ccbfa8">PRESSURE</text>
      <text x="825" y="229" textAnchor="middle" fontFamily={mono} fontSize="23" fontWeight="700" fill="#f9e9d0">{reading.toFixed(1)} kPa</text>
      <rect x="785" y="271" width="55" height="300" rx="27" fill="#c4b59f" stroke="#7d7062" strokeWidth="4" />
      <rect x="793" y={top} width="39" height={562 - top} rx="19" fill="#c45036" />
      <path d={`M800 ${top + 12} V548`} stroke="#f9c2a0" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} stroke="#7f7060" strokeWidth="2"><line x1="847" y1={285 + i * 48} x2={i % 2 ? '860' : '869'} y2={285 + i * 48} /></g>
      ))}
      <path d="M878 295 V415" stroke="#be3c2c" strokeWidth="6" markerEnd="url(#arrowRed)" opacity={pressure} />
      <text x="825" y="620" textAnchor="middle" fontFamily={sans} fontSize="34" fontWeight="900" fill="#bd3e2c">−21%</text>
    </g>
  );
};

const SceneFive: React.FC<ArtProps> = ({ frame, fps }) => {
  const dark = ramp(frame, fps, 0.3, 2.0);
  const glide = ramp(frame, fps, 1.0, 3.1);
  const stopping = ramp(frame, fps, 0.55, 2.45);
  const stopFrame = 2.4 * fps;
  const elapsed = Math.min(frame, stopFrame);
  const angle = 0.14 * (elapsed - elapsed * elapsed / (2 * stopFrame));
  const pistonY = 365 + 45 * Math.cos(angle);
  const crankX = 717 + 46 * Math.sin(angle);
  const crankY = 574 - 46 * Math.cos(angle);
  const smoke = ramp(frame, fps, 0.9, 2.1);
  return (
    <g>
      <text x="48" y="125" fontFamily={mono} fontSize="14" fontWeight="700" fill="#8e4b38">01 / RAYLEIGH SCATTERING</text>
      <text x="525" y="125" fontFamily={mono} fontSize="14" fontWeight="700" fill="#8e4b38">02 / COMBUSTION CYCLE</text>
      <line x1="480" y1="140" x2="480" y2="682" stroke="#a5947b" strokeDasharray="7 9" strokeWidth="2" />
      <g clipPath="url(#skyClip)">
        <rect x="37" y="145" width="405" height="480" fill="url(#sky)" />
        <rect x="37" y="145" width="405" height="480" fill="#111b26" opacity={dark} />
        {Array.from({ length: 35 }, (_, i) => (
          <circle key={i} cx={50 + rand('sky-star-x', i) * 380} cy={157 + rand('sky-star-y', i) * 365} r={0.8 + rand('sky-star-r', i) * 1.5} fill="#fff3d9" opacity={dark * (0.45 + rand('sky-star-o', i) * 0.55)} />
        ))}
        <circle cx="113" cy="217" r="32" fill="#ffe7a1" filter="url(#redGlow)" />
        <circle cx="113" cy="217" r="23" fill="#fff6d2" />
        <g stroke="#f8e7b7" strokeWidth="3" opacity="0.75">
          {Array.from({ length: 8 }, (_, i) => {
            const a = i * Math.PI / 4;
            return <line key={i} x1={113 + 39 * Math.cos(a)} y1={217 + 39 * Math.sin(a)} x2={113 + 52 * Math.cos(a)} y2={217 + 52 * Math.sin(a)} />;
          })}
        </g>
        <g opacity={1 - dark} stroke="#d8f3ef" strokeWidth="3" strokeDasharray="4 8">
          <path d="M145 240 Q220 260 277 231 T403 247" fill="none" />
          <path d="M147 251 Q211 297 274 282 T405 293" fill="none" />
          <path d="M145 259 Q196 331 262 341 T408 363" fill="none" />
        </g>
        <path d="M37 571 Q131 547 237 565 T442 560 V625 H37 Z" fill="#b9bca8" opacity="0.8" />
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={97 + rand('smoke-x', i) * 95 - glide * 28} cy={390 + rand('smoke-y', i) * 34 + glide * 91} r={8 + rand('smoke-r', i) * 20} fill="#4f4e4a" opacity={smoke * (0.22 + rand('smoke-o', i) * 0.2)} />
        ))}
        <g transform={`translate(${233 + glide * 35} ${357 + glide * 110}) rotate(${glide * 12})`} filter="url(#softShadow)">
          <path d="M-110 -7 L-143 -59 L-122 -60 L-78 -16 Z" fill="#e9e1d2" stroke="#6e7372" strokeWidth="3" />
          <path d="M-130 -5 C-70 -19 50 -18 105 -9 Q137 -4 145 8 Q131 18 105 19 L-100 20 Q-122 17 -130 7 Z" fill="url(#metal)" stroke="#687170" strokeWidth="3" />
          <path d="M-18 2 L-59 -55 L-34 -57 L39 2 Z" fill="#eee9db" stroke="#737a77" strokeWidth="3" />
          <path d="M4 12 L-40 54 L-14 56 L60 15 Z" fill="#ddd6c8" stroke="#737a77" strokeWidth="3" />
          <ellipse cx="-5" cy="24" rx="23" ry="12" fill="#625f58" stroke="#d2c4ae" strokeWidth="4" />
          <ellipse cx="-7" cy="24" rx="10" ry="6" fill="#292b29" />
          {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={-74 + i * 18} cy="0" r="3.5" fill="#526d71" />)}
          <path d="M94 -8 Q116 -5 125 1 L101 0 Z" fill="#526d71" />
        </g>
      </g>
      <rect x="37" y="145" width="405" height="480" rx="13" fill="none" stroke="#8b9d94" strokeWidth="3" />
      <text x="57" y="600" fontFamily={mono} fontSize="14" fontWeight="700" fill={dark > 0.6 ? '#f6e9d1' : '#344d4b'}>DAYLIGHT / {dark > 0.75 ? 'DARK SKY' : 'SCATTERED LIGHT'}</text>
      <text x="240" y="665" textAnchor="middle" fontFamily={mono} fontSize="14" fontWeight="700" fill="#745c4d">AIRLINER / THRUST LOST</text>

      <path d="M545 191 H888 L900 231 V592 Q900 623 871 635 H562 Q532 623 532 592 V231 Z" fill="url(#concrete)" stroke="#746959" strokeWidth="5" filter="url(#softShadow)" />
      <path d="M560 237 H873 V561 Q873 616 836 616 H598 Q560 616 560 561 Z" fill="#504941" stroke="#9b8b76" strokeWidth="5" />
      <rect x="591" y="260" width="252" height="246" rx="8" fill="#d2bda1" stroke="#706658" strokeWidth="5" />
      <rect x="605" y="270" width="224" height="222" fill="#8b8d80" />
      <path d="M554 253 H582 M554 279 H582 M554 305 H582 M554 331 H582 M852 253 H880 M852 279 H880 M852 305 H880 M852 331 H880" stroke="#60574b" strokeWidth="8" />
      <g transform={`translate(717 574) rotate(${angle * 180 / Math.PI})`}>
        {Array.from({ length: 16 }, (_, i) => <rect key={i} x="-7" y="-66" width="14" height="20" rx="2" fill="#827666" transform={`rotate(${i * 22.5})`} />)}
        <circle r="53" fill="url(#metal)" stroke="#4e4941" strokeWidth="5" />
        <circle r="31" fill="#57534b" stroke="#c5b59a" strokeWidth="4" />
        <circle r="10" fill="#d7c7aa" />
      </g>
      <line x1="717" y1={pistonY + 57} x2={crankX} y2={crankY} stroke="#4e4943" strokeWidth="25" strokeLinecap="round" />
      <line x1="717" y1={pistonY + 57} x2={crankX} y2={crankY} stroke="url(#metal)" strokeWidth="16" strokeLinecap="round" />
      <circle cx={crankX} cy={crankY} r="13" fill="#d8c6a9" stroke="#5f574d" strokeWidth="4" />
      <g>
        <rect x="610" y={pistonY} width="214" height="76" rx="8" fill="url(#metal)" stroke="#62584d" strokeWidth="4" />
        <path d={`M610 ${pistonY + 14} H824 M610 ${pistonY + 25} H824 M610 ${pistonY + 36} H824`} stroke="#70685d" strokeWidth="4" />
        <circle cx="717" cy={pistonY + 56} r="10" fill="#5e574d" stroke="#d7c8ae" strokeWidth="3" />
      </g>
      <path d="M693 190 H741 V224 L729 241 H705 L693 224 Z" fill="url(#metal)" stroke="#62584d" strokeWidth="4" />
      <path d="M717 236 V276" stroke="#d8c5a8" strokeWidth="8" />
      <path d="M716 270 L702 291 L714 291 L704 312 L730 284 L718 284 L729 270 Z" fill="#ffbd53" stroke="#c66b30" strokeWidth="2" opacity={(1 - stopping) * (0.75 + 0.25 * Math.sin(frame * 0.7))} filter="url(#redGlow)" />
      <path d="M651 306 Q675 269 699 310 Q718 274 738 309 Q765 274 785 306" fill="none" stroke="#f1934b" strokeWidth="10" strokeLinecap="round" opacity={(1 - stopping) * 0.75} />
      <text x="717" y="665" textAnchor="middle" fontFamily={mono} fontSize="14" fontWeight="700" fill="#745c4d">PISTON / {stopping > 0.9 ? 'ENGINE STOPPED' : 'COMBUSTION'}</text>
    </g>
  );
};

const SceneSix: React.FC<ArtProps> = ({ frame, fps }) => {
  const fracture = clamp01(spring({ frame: Math.max(0, frame - Math.round(1.05 * fps)), fps, config: { damping: 22, stiffness: 45, mass: 1 } }));
  const fall = ramp(frame, fps, 1.2, 3.0);
  const boundaries = [
    [80, 80, 80, 80, 80],
    [264, 252, 272, 251, 264],
    [442, 456, 433, 452, 442],
    [622, 609, 633, 610, 622],
    [840, 840, 840, 840, 840],
  ];
  const ys = [250, 291, 334, 382, 435];
  return (
    <g>
      <text x="47" y="128" fontFamily={mono} fontSize="14" fontWeight="700" fill="#8e4b38">EARTH'S LITHOSPHERE / CUTAWAY</text>
      <path d="M80 220 L145 178 H905 L840 220 Z" fill="#9a7953" stroke="#735b42" strokeWidth="4" />
      <path d="M105 211 l62 -23 h700 l-43 23 Z" fill="#b69a6e" opacity="0.8" />
      <path d="M121 207 q15 -12 29 0 M200 197 q17 -12 31 0 M346 203 q17 -15 35 0 M665 201 q18 -16 38 0 M772 198 q16 -13 29 0" fill="none" stroke="#647451" strokeWidth="5" strokeLinecap="round" />
      <path d="M840 220 L905 178 V610 L840 655 Z" fill="#6b4a33" stroke="#5c4737" strokeWidth="4" />
      <path d="M840 250 L905 210 V391 L840 435 Z" fill="#8b6845" />
      <path d="M840 435 L905 391 V496 L840 540 Z" fill="#554a3e" />
      <path d="M840 540 L905 496 V610 L840 655 Z" fill="#9e3c2a" />
      <path d="M850 270 l43 -26 M850 314 l43 -26 M850 364 l43 -26 M850 466 l43 -26 M850 570 l43 -26" stroke="#dbc29a" strokeWidth="2" opacity="0.35" />
      <rect x="80" y="220" width="760" height="435" fill="#372c27" stroke="#705a46" strokeWidth="4" filter="url(#softShadow)" />
      <rect x="80" y="435" width="760" height="105" fill="#756858" />
      <path d="M80 458 Q180 438 270 460 T462 458 T650 456 T840 452 M80 504 Q160 483 240 502 T424 503 T619 495 T840 501" fill="none" stroke="#afa08a" strokeWidth="5" opacity="0.45" />
      <rect x="80" y="540" width="760" height="115" fill="url(#mantle)" />
      <path d="M80 581 Q160 555 244 581 T410 582 T575 576 T741 581 T840 575 M80 625 Q176 604 269 627 T461 625 T650 623 T840 623" fill="none" stroke="#ffad61" strokeWidth="7" opacity="0.4" />
      {[0, 1, 2, 3].map((i) => {
        const left = boundaries[i];
        const right = boundaries[i + 1];
        const path = `M${left[0]} ${ys[0]} ${right.map((x, k) => `L${x} ${ys[k]}`).join(' ')} ${left.slice().reverse().map((x, k) => `L${x} ${ys[ys.length - 1 - k]}`).join(' ')} Z`;
        const dx = fracture * (i - 1.5) * 9;
        const dy = fall * [18, 55, 82, 28][i];
        const rot = fall * [-1.7, 1.2, -1.5, 1.1][i];
        const mid = (left[0] + right[0]) / 2;
        return (
          <g key={i} transform={`translate(${dx} ${dy}) rotate(${rot} ${mid} 250)`}>
            <path d={path} fill="url(#crust)" stroke="#71523c" strokeWidth="3" />
            <path d={path} fill="url(#hatch)" opacity="0.35" />
            <path d={`M${left[0]} 220 Q${mid} 208 ${right[0]} 220 L${right[0]} 250 H${left[0]} Z`} fill="#644735" stroke="#4f3a2d" strokeWidth="3" />
            <path d={`M${left[0] + 6} 223 Q${mid} 213 ${right[0] - 5} 223`} fill="none" stroke="#b39068" strokeWidth="4" opacity="0.8" />
            <path d={`M${left[0] + 18} 300 l30 -12 23 9 M${left[0] + 47} 360 l26 -9 23 11 M${left[0] + 22} 405 l31 -13`} fill="none" stroke="#e2c697" strokeWidth="3" opacity="0.45" />
          </g>
        );
      })}
      <g opacity={fracture} fill="none" stroke="#e1784b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M264 223 L252 291 L272 334 L251 382" />
        <path d="M442 221 L456 291 L433 334 L452 382" />
        <path d="M622 221 L609 291 L633 334 L610 382" />
      </g>
      {Array.from({ length: 58 }, (_, i) => {
        const delay = rand('earth-delay', i) * 0.8;
        const drop = ramp(frame, fps, 1.15 + delay, 2.6 + delay);
        const x = 95 + rand('earth-x', i) * 728 + (rand('earth-dx', i) - 0.5) * 30 * drop;
        const y = 258 + rand('earth-y', i) * 150 + drop * (90 + rand('earth-v', i) * 150);
        return <circle key={i} cx={x} cy={y} r={2 + rand('earth-r', i) * 5} fill={i % 3 === 0 ? '#e4bd7e' : '#6c4934'} opacity={drop > 0 ? 0.85 - drop * 0.25 : 0} />;
      })}
      <g fontFamily={mono} fontWeight="700" letterSpacing="0.8">
        <text x="101" y="242" fontSize="14" fill="#fff0d6">TOPSOIL</text>
        <rect x="99" y="301" width="260" height="66" rx="5" fill="#4a3326" opacity="0.7" />
        <text x="115" y="326" fontSize="17" fill="#fff4e0">SILICATE CRUST</text>
        <text x="115" y="350" fontSize="15" fill="#f2ce9e">SiO₂ - 45% O₂</text>
        <text x="103" y="483" fontSize="16" fill="#f9ecd8">BEDROCK</text>
        <text x="103" y="593" fontSize="16" fill="#fff1dc">RED MANTLE</text>
      </g>
      <text x="831" y="692" textAnchor="end" fontFamily={mono} fontSize="14" fontWeight="700" fill="#745c4d">CRUST / STRUCTURAL FAILURE</text>
    </g>
  );
};

const ART = [SceneOne, SceneTwo, SceneThree, SceneFour, SceneFive, SceneSix];

const Stage: React.FC<{ index: number; frame: number; fps: number }> = ({ index, frame, fps }) => {
  const Art = ART[index];
  const enter = clamp01(spring({ frame, fps, config: { damping: 19, stiffness: 95, mass: 0.9 } }));
  const exit = 1 - 0.2 * ramp(frame, fps, 3.32, 3.5);
  return (
    <div style={{ position: 'absolute', top: 560, left: 60, width: 960, height: 800, overflow: 'hidden', borderRadius: 8, boxShadow: '0 14px 32px rgba(73, 52, 31, 0.16), 0 1px 4px rgba(73, 52, 31, 0.14)', background: '#e9dcc4' }}>
      <svg viewBox="0 0 960 800" width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <Defs />
        <rect width="960" height="800" fill="url(#platePaper)" />
        {Array.from({ length: 65 }, (_, i) => (
          <circle key={i} cx={rand('paper-x', i) * 960} cy={rand('paper-y', i) * 800} r={0.5 + rand('paper-r', i) * 1.6} fill="#8b7458" opacity="0.18" />
        ))}
        <rect x="17" y="17" width="926" height="766" rx="5" fill="none" stroke="#9d8a70" strokeWidth="1.5" opacity="0.7" />
        <line x1="38" y1="78" x2="922" y2="78" stroke="#a69277" strokeWidth="1.5" />
        <text x="41" y="53" fontFamily={mono} fontSize="16" fontWeight="700" letterSpacing="1" fill="#4f4033">PLATE {String(index + 1).padStart(2, '0')} / {META[index].plate}</text>
        <text x="919" y="53" textAnchor="end" fontFamily={mono} fontSize="14" letterSpacing="1" fill="#a04432">5s EVENT</text>
        <g opacity={(0.35 + 0.65 * enter) * exit} transform={`translate(0 ${14 * (1 - enter)})`}>
          <Art frame={frame} fps={fps} />
        </g>
        <line x1="38" y1="728" x2="922" y2="728" stroke="#a69277" strokeWidth="1.5" />
        <text x="41" y="756" fontFamily={mono} fontSize="13" letterSpacing="0.8" fill="#756554">{META[index].note}</text>
        <text x="919" y="756" textAnchor="end" fontFamily={mono} fontSize="13" letterSpacing="0.8" fill="#756554">NOT TO SCALE</text>
      </svg>
    </div>
  );
};

const Telemetry: React.FC<{ frame: number; totalFrames: number }> = ({ frame, totalFrames }) => {
  const value = (from: number, to: number) => interpolate(frame, [0, totalFrames - 1], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const remaining = value(1, 0);
  const metrics = [
    { label: 'O2 LEVEL', value: `${value(20.9, 0).toFixed(1)}%`, fill: remaining },
    { label: 'PRESSURE', value: `${value(101.3, 79.8).toFixed(1)} kPa`, fill: value(1, 79.8 / 101.3) },
    { label: 'Si-O BOND', value: `${value(100, 0).toFixed(0)}%`, fill: remaining },
    { label: 'SKY LIGHT', value: `${value(100, 0).toFixed(0)}%`, fill: remaining },
    { label: 'TIMER', value: `${value(5, 0).toFixed(2).padStart(5, '0')}s`, fill: remaining },
  ];
  return (
    <div style={{ position: 'absolute', top: 126, left: 60, width: 960, height: 120, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', background: '#2b2119', borderRadius: 12, boxShadow: '0 8px 20px rgba(48, 33, 23, 0.22)', overflow: 'hidden' }}>
      {metrics.map((metric, i) => (
        <div key={metric.label} style={{ minWidth: 0, padding: '21px 13px 16px 18px', borderLeft: i ? '1px solid rgba(240, 224, 196, 0.15)' : undefined }}>
          <div style={{ color: '#cdbca3', fontFamily: mono, fontSize: 14, fontWeight: 700, letterSpacing: 0.7, whiteSpace: 'nowrap' }}>{metric.label}</div>
          <div style={{ color: i === 4 ? '#ff9871' : '#f8eddd', fontFamily: mono, fontSize: i === 1 ? 23 : 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 8, whiteSpace: 'nowrap' }}>{metric.value}</div>
          <div style={{ height: 3, marginTop: 12, background: 'rgba(243, 222, 191, 0.15)', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${clamp01(metric.fill) * 100}%`, background: i === 4 ? '#f08359' : '#d96343', borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const Headlines: React.FC<{ index: number; frame: number; fps: number }> = ({ index, frame, fps }) => {
  const [first, second] = META[index].title;
  const count1 = Math.floor(interpolate(frame, [0, 0.58 * fps], [0, first.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const count2 = Math.floor(interpolate(frame, [0.42 * fps, 1.14 * fps], [0, second.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const caret = Math.floor(frame / 8) % 2 === 0;
  const caretStyle: React.CSSProperties = { display: 'inline-block', width: 4, height: 54, background: 'currentColor', marginLeft: 5, verticalAlign: '-4px' };
  return (
    <div style={{ position: 'absolute', top: 286, left: 80, right: 52 }}>
      <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, letterSpacing: 2.1, color: '#8b7058', marginBottom: 14 }}>THE FIVE-SECOND EXPERIMENT / {String(index + 1).padStart(2, '0')}</div>
      <div style={{ fontFamily: 'Arial Black, Arial, Helvetica, sans-serif', fontWeight: 900, fontSize: index === 0 ? 62 : index === 5 ? 66 : 69, letterSpacing: -2.3, lineHeight: 1.06, whiteSpace: 'nowrap' }}>
        <div style={{ color: '#362a20', height: 76 }}>{first.slice(0, count1)}{count1 < first.length && caret ? <span style={caretStyle} /> : null}</div>
        <div style={{ color: '#d43527', height: 76 }}>{second.slice(0, count2)}{count1 >= first.length && count2 < second.length && caret ? <span style={caretStyle} /> : null}</div>
      </div>
    </div>
  );
};

const Caption: React.FC<{ scene: Scene; frame: number; fps: number }> = ({ scene, frame, fps }) => {
  const words = scene.caption.trim().split(/\s+/);
  const weights = words.map((word) => Math.max(1, word.replace(/[.,!?;:]/g, '').length));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const speechFrames = Math.max(1, scene.speechDur * fps);
  const cursor = clamp01(frame / speechFrames) * total;
  let sum = 0;
  let current = words.length - 1;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (cursor < sum) {
      current = i;
      break;
    }
  }
  const chunkStart = Math.floor(current / 4) * 4;
  const chunk = words.slice(chunkStart, chunkStart + 4);
  return (
    <div style={{ position: 'absolute', bottom: 155, left: 60, right: 60, height: 150 }}>
      <div style={{ height: 1, background: 'rgba(85, 66, 47, 0.3)', marginBottom: 17 }} />
      <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#8b7058', textAlign: 'center' }}>NARRATION / LIVE CAPTIONS</div>
      <div style={{ height: 93, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', fontFamily: sans, fontSize: 57, fontWeight: 900, letterSpacing: -1.2 }}>
        {chunk.map((word, i) => {
          const active = chunkStart + i === current && frame < speechFrames;
          return (
            <span key={chunkStart + i} style={{ flexShrink: 0, display: 'inline-block', padding: '5px 9px', lineHeight: 1.12, borderRadius: 14, color: active ? '#fff' : '#362a20', background: active ? '#e06324' : 'transparent', boxShadow: active ? '0 0 22px rgba(224, 99, 36, 0.38)' : 'none' }}>{word}</span>
          );
        })}
      </div>
    </div>
  );
};

const SceneContents: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ position: 'absolute', top: 49, left: 80, right: 60, height: 51, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#5b4939', fontFamily: mono, fontWeight: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 37, height: 37, background: '#d43527', color: '#fff7eb', fontSize: 19, borderRadius: 4 }}>S</span>
          <span style={{ fontSize: 17, letterSpacing: 1.2 }}>THE OXYGEN FILES</span>
        </div>
        <span style={{ fontSize: 15, letterSpacing: 1.1 }}>{META[index].section} // FIG. {String(index + 1).padStart(2, '0')}</span>
      </div>
      <Headlines index={index} frame={frame} fps={fps} />
      <Stage index={index} frame={frame} fps={fps} />
      <Caption scene={scene} frame={frame} fps={fps} />
      <div style={{ position: 'absolute', bottom: 55, left: 80, right: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: 1, color: '#806b55' }}>
        <span>HYPOTHETICAL SCENARIO / NOT TO SCALE</span>
        <span style={{ color: '#b94a35' }}>FILE {String(index + 1).padStart(2, '0')} / 06</span>
      </div>
    </>
  );
};

const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = clamp01(frame / (durationInFrames - 1));
  return (
    <AbsoluteFill data-voice={VOICE} style={{ overflow: 'hidden', color: '#362a20', fontFamily: sans, background: 'radial-gradient(ellipse at 48% 30%, #f6efe0 0%, #e9dec9 55%, #d5c4a1 100%)' }}>
      <AbsoluteFill style={{ pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(108, 86, 60, 0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(108, 86, 60, 0.13) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.47 }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 47, width: 2, background: 'rgba(185, 54, 42, 0.44)' }} />
      <Telemetry frame={frame} totalFrames={durationInFrames} />
      {SCENES.map((scene, index) => (
        <Sequence key={scene.start} from={Math.round(scene.start * fps)} durationInFrames={Math.round(scene.duration * fps)} name={`Scene ${index + 1}`} layout="none">
          <SceneContents scene={scene} index={index} />
        </Sequence>
      ))}
      <div style={{ position: 'absolute', top: 1397, left: 80, right: 60, display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 14, fontWeight: 700, letterSpacing: 1.1, color: '#7c6753' }}>
        <span>SIMULATION PLAYHEAD</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(frame / fps).toFixed(2).padStart(5, '0')}s / 21.00s</span>
      </div>
      <div style={{ position: 'absolute', top: 1434, left: 80, right: 60, height: 4, background: 'rgba(90, 68, 47, 0.2)', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: '#ce4b32', borderRadius: 4 }} />
        {Array.from({ length: 7 }, (_, i) => <div key={i} style={{ position: 'absolute', left: `${(i / 6) * 100}%`, top: -4, width: 2, height: 12, background: '#a78e73' }} />)}
      </div>
      <div style={{ position: 'absolute', top: 1457, left: 80, right: 60, display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#9a8168' }}>
        <span>00.0</span><span>03.5</span><span>07.0</span><span>10.5</span><span>14.0</span><span>17.5</span><span>21.0</span>
      </div>
      <Audio src={staticFile('voice.mp3')} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={1260} fps={60} width={1080} height={1920} />
);

export default RemotionRoot;
