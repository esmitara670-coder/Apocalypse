import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const FPS = 60;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 2064;

const SCENES = [
  {
    id: 1,
    theme: 'dark',
    start: 0.0,
    end: 4.2,
    speechStart: 0.1,
    speechEnd: 4.1,
    tag: 'SPACE TIME PARADOX',
    titleWhite: 'EARTH TO',
    titleAccent: 'DEEP SPACE',
    caption: 'Kya aapko pata hai ki agar aap space mein lambe samay tak rehkar',
  },
  {
    id: 2,
    theme: 'paper',
    start: 4.2,
    end: 7.9,
    speechStart: 4.2,
    speechEnd: 7.65,
    tag: 'THE TWIN PARADOX',
    titleWhite: 'TWIN BROTHER SE',
    titleAccent: 'YOUNGER!',
    caption: 'wapas zameen par aayenge, toh aap apne twin brother se thode chhote, yaani younger lagenge?',
  },
  {
    id: 3,
    theme: 'dark',
    start: 7.9,
    end: 14.7,
    speechStart: 8.1,
    speechEnd: 14.45,
    tag: 'EINSTEIN RELATIVITY',
    titleWhite: 'GRAVITY & SPEED',
    titleAccent: 'SLOWS TIME',
    caption: 'Darasal, Einstein ke theory ke mutabik, jahan gravity ya speed bahut zyada hoti hai, wahan time slow ho jata hai.',
  },
  {
    id: 4,
    theme: 'paper',
    start: 14.7,
    end: 23.8,
    speechStart: 14.85,
    speechEnd: 23.55,
    tag: 'ISS ORBITAL VELOCITY',
    titleWhite: 'JUMP INTO THE',
    titleAccent: 'FUTURE!',
    caption: 'Space station mein high speed par travel karne ki wajah se astronaut ka time zameen ke muqable thoda slow chalta hai, jisse woh literally future mein thoda aage chale jaate hain.',
  },
  {
    id: 5,
    theme: 'dark',
    start: 23.8,
    end: 27.2,
    speechStart: 23.95,
    speechEnd: 27.0,
    tag: 'REAL LIFE SCI-FI',
    titleWhite: 'REAL TIME',
    titleAccent: 'MACHINE',
    caption: 'Matlab, space travel ek tarah ki time machine hi hai!',
  },
  {
    id: 6,
    theme: 'paper',
    start: 27.2,
    end: 34.4,
    speechStart: 27.35,
    speechEnd: 34.3,
    tag: 'YOUR FUTURE JOURNEY',
    titleWhite: 'KISKE PAAS',
    titleAccent: 'JAANA CHAHOGE?',
    caption: 'Waise, agar aapko kabhi time travel karke future mein jaane ka mauka mile, toh aap sabse pehle kiske paas jaana chahoge? Comment mein uska naam zaroor',
  },
] as const;

type Scene = (typeof SCENES)[number];

const clamp = (v: number, inp: number[], out: number[]) =>
  interpolate(v, inp, out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const ease = (v: number, inp: number[], out: number[]) =>
  interpolate(v, inp, out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const sFrame = (s: Scene) => Math.round(s.start * FPS);
const eFrame = (s: Scene) => Math.round(s.end * FPS);
const lFrame = (f: number, s: Scene) => Math.max(0, f - sFrame(s));

function Background({ theme, frame }: { theme: 'dark' | 'paper'; frame: number }) {
  if (theme === 'paper') {
    return (
      <AbsoluteFill
        style={{
          background: 'linear-gradient(145deg, #f4efe4 0%, #e5dbc6 100%)',
          backgroundImage:
            'linear-gradient(rgba(77,69,55,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(77,69,55,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    );
  }
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, #181d38 0%, #060916 100%)' }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {Array.from({ length: 48 }, (_, i) => {
          const x = (i * 173 + 29) % WIDTH;
          const y = (i * 257 + 41) % HEIGHT;
          const op = 0.25 + ((Math.sin(frame * 0.05 + i) + 1) / 2) * 0.65;
          return <circle key={i} cx={x} cy={y} r={1.2 + (i % 3)} fill="#d9faff" opacity={op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
}

function EditorialHeader({ scene, frame }: { scene: Scene; frame: number }) {
  const local = lFrame(frame, scene);
  const rev = spring({ frame: local, fps: FPS, config: { damping: 18, stiffness: 130 } });
  const isPaper = scene.theme === 'paper';
  const accent = isPaper ? '#d93829' : scene.id === 3 ? '#00e5ff' : scene.id === 5 ? '#ffd166' : '#ff9f43';
  const primary = isPaper ? '#24211d' : '#f8f7f2';

  return (
    <div style={{ position: 'absolute', top: 78, left: 40, right: 40, textAlign: 'center', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: rev }}>
        <div style={{ width: 95, height: 2, background: accent }} />
        <span style={{ color: isPaper ? '#5a5144' : '#d7e7f4', fontWeight: 800, fontSize: 19, letterSpacing: 4 }}>
          {scene.tag}
        </span>
        <div style={{ width: 95, height: 2, background: accent }} />
      </div>
      <div
        style={{
          marginTop: 14,
          transform: `translateY(${interpolate(rev, [0, 1], [28, 0])}px)`,
          opacity: rev,
          fontFamily: 'Arial Black, sans-serif',
          fontSize: 62,
          lineHeight: 1.05,
          fontWeight: 900,
          color: primary,
        }}
      >
        <div>{scene.titleWhite}</div>
        <div style={{ color: accent, marginTop: 4 }}>{scene.titleAccent}</div>
      </div>
    </div>
  );
}

function CaptionPill({ scene, frame }: { scene: Scene; frame: number }) {
  const words = scene.caption.trim().split(/\s+/);
  const start = Math.round(scene.speechStart * FPS);
  const end = Math.round(scene.speechEnd * FPS);
  const weights = words.map((w) => Math.max(2, w.length) + (/[.!?]$/.test(w) ? 2.5 : /[,;:]$/.test(w) ? 1.5 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  const elapsed = Math.max(0, Math.min(end - start, frame - start));
  const prog = (elapsed / Math.max(1, end - start)) * total;

  let cum = 0;
  let activeIdx = 0;
  for (let i = 0; i < weights.length; i++) {
    if (prog >= cum) activeIdx = i;
    cum += weights[i];
    if (prog < cum) break;
  }
  if (frame >= end) activeIdx = words.length - 1;

  const cStart = Math.floor(activeIdx / 4) * 4;
  const chunk = words.slice(cStart, cStart + 4);
  const hl = scene.theme === 'paper' ? '#ff5252' : '#ffb142';

  return (
    <div
      style={{
        position: 'absolute',
        top: 1570,
        left: 55,
        right: 55,
        minHeight: 94,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 28px',
        borderRadius: 20,
        background: scene.theme === 'dark' ? 'rgba(18,22,36,0.92)' : 'rgba(36,33,29,0.94)',
        border: '1.5px solid rgba(255,255,255,0.22)',
        zIndex: 12,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 10px', fontSize: 34, fontWeight: 700 }}>
        {chunk.map((word, idx) => {
          const isAct = cStart + idx === activeIdx;
          return (
            <span key={idx} style={{ color: isAct ? hl : '#f8f5ef', textShadow: isAct ? `0 0 16px ${hl}66` : 'none' }}>
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ISS({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-320" y="-42" width="120" height="84" rx="4" fill="#173a58" stroke="#d6a74e" strokeWidth="3" />
      <rect x="200" y="-42" width="120" height="84" rx="4" fill="#173a58" stroke="#d6a74e" strokeWidth="3" />
      <line x1="-200" y1="0" x2="200" y2="0" stroke="#c2cbd5" strokeWidth="10" />
      <rect x="-55" y="-32" width="110" height="64" rx="14" fill="#f0eee4" stroke="#24211d" strokeWidth="3" />
      <circle cx="0" cy="0" r="8" fill="#00e5ff" />
    </g>
  );
}

function Rocket({ x, y, scale = 1, flame = 1 }: { x: number; y: number; scale?: number; flame?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={`M -14 44 L 0 ${44 + 68 * flame} L 14 44 Z`} fill="#ffb142" opacity={flame} />
      <path d="M -22 24 L -36 46 L -18 42 M 22 24 L 36 46 L 18 42" fill="#e64f35" />
      <path d="M -22 24 Q -24 -26 0 -62 Q 24 -26 22 24 Z" fill="#e4e7ec" stroke="#ffffff" strokeWidth="3" />
      <circle cx="0" cy="-6" r="10" fill="#00e5ff" />
    </g>
  );
}

function SceneStage({ scene, frame }: { scene: Scene; frame: number }) {
  const local = lFrame(frame, scene);
  const sec = scene.start + local / FPS;

  if (scene.id === 1) {
    const camY = ease(local, [0, 250], [-1400, -100]);
    const rY = ease(local, [0, 250], [2100, 480]);
    const alt = Math.round(clamp(local, [0, 250], [0, 408]));
    const markY = clamp(alt, [0, 408], [920, 180]);

    return (
      <svg width={WIDTH} height={1160} viewBox={`0 0 ${WIDTH} 1160`}>
        <g transform={`translate(0 ${camY})`}>
          <circle cx="540" cy="1750" r="1200" fill="#0d2b52" stroke="#00e5ff" strokeWidth="6" opacity="0.6" />
          <ISS x={560} y={340} scale={0.85} />
          <g fill="#d7e7f4" opacity="0.22">
            <ellipse cx="300" cy="1150" rx="240" ry="42" />
            <ellipse cx="760" cy="1020" rx="280" ry="48" />
          </g>
          <g transform="translate(0 1850)">
            <rect x="0" y="340" width={WIDTH} height="400" fill="#070a14" />
            <path d="M 80 340 L 220 210 L 360 340 M 680 340 L 820 210 L 960 340 M 220 210 H 820" fill="none" stroke="#ff9f43" strokeWidth="5" opacity="0.6" />
            {[130, 240, 350, 640, 760, 870].map((bx, i) => (
              <rect key={i} x={bx} y={230 - (i % 3) * 30} width="65" height={110 + (i % 3) * 30} fill="#0c1122" />
            ))}
          </g>
          <Rocket x={540} y={rY} scale={1.15} flame={1} />
        </g>
        <g transform="translate(76 0)">
          <line x1="0" y1="160" x2="0" y2="950" stroke="#00e5ff" strokeWidth="3" strokeOpacity="0.45" />
          <g transform={`translate(0 ${markY})`}>
            <circle r="10" fill="#ff9f43" />
            <rect x="20" y="-22" width="145" height="44" rx="10" fill="#ff9f43" />
            <text x="92" y="8" fill="#060916" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900">
              {alt} KM
            </text>
          </g>
        </g>
      </svg>
    );
  }

  if (scene.id === 2) {
    const enter = spring({ frame: local, fps: FPS, config: { damping: 15, stiffness: 120 } });
    const oldAge = Math.round(clamp(local, [25, 175], [28, 68]));
    const ruleX = ease(local, [25, 175], [260, 820]);

    return (
      <svg width={WIDTH} height={1160} viewBox={`0 0 ${WIDTH} 1160`}>
        <line x1="140" y1="190" x2="940" y2="190" stroke="#24211d" strokeWidth="4" />
        {Array.from({ length: 17 }, (_, i) => (
          <line key={i} x1={140 + i * 50} y1={190 - (i % 4 === 0 ? 26 : 12)} x2={140 + i * 50} y2="190" stroke="#24211d" strokeWidth="3" />
        ))}
        <circle cx={ruleX} cy="190" r="14" fill="#d93829" />

        {[
          { x: 295, title: 'YOU (SPACE TWIN)', age: '28', badge: 'STILL YOUNG ⚡', col: '#24211d', bg: '#e59f24' },
          { x: 785, title: 'EARTH TWIN BROTHER', age: `${oldAge}+`, badge: 'AGED FASTER ⏳', col: '#d93829', bg: '#d93829' },
        ].map((c, i) => (
          <g key={i} transform={`translate(${c.x} 620) scale(${enter})`}>
            <rect x="-185" y="-300" width="370" height="600" rx="24" fill="#fbf8f1" stroke={c.col} strokeWidth="5" />
            <rect x="-140" y="-265" width="280" height="46" rx="12" fill={c.col} />
            <text x="0" y="-235" fill="#ffffff" textAnchor="middle" fontSize="20" fontWeight="800">
              {c.title}
            </text>
            <circle cx="0" cy="-120" r="42" fill={c.col} />
            <path d="M -56 30 C -56 -45 56 -45 56 30 Z" fill={c.col} />
            <text x="0" y="145" fill={c.col} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="90" fontWeight="900">
              {c.age}
            </text>
            <text x="0" y="190" fill="#625745" textAnchor="middle" fontSize="22" fontWeight="800">
              YEARS OLD
            </text>
            <rect x="-115" y="215" width="230" height="48" rx="24" fill={c.bg} />
            <text x="0" y="247" fill={i === 0 ? '#24211d' : '#ffffff'} textAnchor="middle" fontSize="21" fontWeight="900">
              {c.badge}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  if (scene.id === 3) {
    const cards = [
      { title: 'HIGH GRAVITY', sub: 'WARPS SPACE', at: 9.8, col: '#00e5ff', x: 205 },
      { title: 'EXTREME SPEED', sub: '28,000 KM/H', at: 11.0, col: '#ff9f43', x: 540 },
      { title: 'TIME SLOWS', sub: 'EINSTEIN LAW', at: 12.6, col: '#ffd166', x: 875 },
    ];
    return (
      <svg width={WIDTH} height={1160} viewBox={`0 0 ${WIDTH} 1160`}>
        <g transform="translate(540 285)">
          {[-140, -70, 0, 70, 140].map((y, i) => (
            <path key={i} d={`M -420 ${y} Q 0 ${y + 130} 420 ${y}`} fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeOpacity="0.45" />
          ))}
          <circle cx="0" cy="35" r="56" fill="#ff9f43" />
        </g>
        {cards.map((c, i) => {
          const lit = sec >= c.at;
          return (
            <g key={i} transform={`translate(${c.x} 790) scale(${lit ? 1.04 : 0.92})`} opacity={lit ? 1 : 0.35}>
              <rect x="-145" y="-190" width="290" height="380" rx="24" fill="rgba(16,24,48,0.9)" stroke={lit ? c.col : '#33415c'} strokeWidth={lit ? 5 : 2} />
              <circle cx="0" cy="-60" r="46" fill="none" stroke={c.col} strokeWidth="5" />
              <text x="0" y="55" fill="#ffffff" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="25" fontWeight="900">
                {c.title}
              </text>
              <text x="0" y="95" fill={c.col} textAnchor="middle" fontSize="18" fontWeight="800">
                {c.sub}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (scene.id === 4) {
    const ang = local * 0.04;
    const yr = Math.round(clamp(local, [240, 510], [2026, 2075]));
    const dotX = ease(local, [240, 510], [180, 900]);

    return (
      <svg width={WIDTH} height={1160} viewBox={`0 0 ${WIDTH} 1160`}>
        <g transform="translate(540 210)">
          <ellipse rx="380" ry="90" fill="none" stroke="#24211d" strokeWidth="3.5" strokeDasharray="12 10" />
          <circle r="52" fill="#274c6b" stroke="#24211d" strokeWidth="4" />
          <ISS x={Math.cos(ang) * 380} y={Math.sin(ang) * 90} scale={0.32} />
        </g>
        {[
          { x: 300, t: 'ISS ASTRONAUT CLOCK', sub: 'RUNS SLOWER', rot: local * 0.9, col: '#e59f24' },
          { x: 780, t: 'EARTH SURFACE CLOCK', sub: 'RUNS FASTER', rot: local * 9.5, col: '#d93829' },
        ].map((ck, i) => (
          <g key={i} transform={`translate(${ck.x} 580)`}>
            <circle r="140" fill="#fbf8f1" stroke={ck.col} strokeWidth="8" />
            <line
              x1="0"
              y1="0"
              x2={Math.cos(((ck.rot - 90) * Math.PI) / 180) * 95}
              y2={Math.sin(((ck.rot - 90) * Math.PI) / 180) * 95}
              stroke={ck.col}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle r="11" fill="#24211d" />
            <text x="0" y="190" fill="#24211d" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900">
              {ck.t}
            </text>
            <text x="0" y="220" fill={ck.col} textAnchor="middle" fontSize="18" fontWeight="800">
              {ck.sub}
            </text>
          </g>
        ))}
        <g transform="translate(0 950)">
          <rect x="95" y="-60" width="890" height="140" rx="22" fill="#fbf8f1" stroke="#24211d" strokeWidth="4" />
          <line x1="180" y1="15" x2="900" y2="15" stroke="#24211d" strokeWidth="6" />
          <circle cx={dotX} cy="15" r="18" fill="#d93829" />
          <text x={dotX} y="-20" fill="#d93829" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="34" fontWeight="900">
            {yr}
          </text>
        </g>
      </svg>
    );
  }

  if (scene.id === 5) {
    return (
      <svg width={WIDTH} height={1160} viewBox={`0 0 ${WIDTH} 1160`}>
        <g transform="translate(540 520)">
          {[330, 260, 190, 120].map((r, i) => (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={i % 2 === 0 ? '#ffd166' : '#00e5ff'}
              strokeWidth={i === 0 ? 8 : 4}
              strokeDasharray={i % 2 === 0 ? 'none' : '18 14'}
              transform={`rotate(${local * (i % 2 === 0 ? 0.8 : -1.2)})`}
            />
          ))}
          <line x1="0" y1="0" x2={Math.cos(local * 0.08) * 200} y2={Math.sin(local * 0.08) * 200} stroke="#ffd166" strokeWidth="10" strokeLinecap="round" />
          <Rocket x={0} y={0} scale={1.15} flame={1} />
        </g>
        <g transform="translate(540 980)">
          <rect x="-290" y="-38" width="580" height="76" rx="38" fill="rgba(255,209,102,0.15)" stroke="#ffd166" strokeWidth="3" />
          <text x="0" y="10" fill="#ffd166" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="28" fontWeight="900">
            SPACECRAFT = REAL TIME MACHINE
          </text>
        </g>
      </svg>
    );
  }

  const cta = spring({ frame: Math.max(0, local - 180), fps: FPS, config: { damping: 14, stiffness: 150 } });
  return (
    <svg width={WIDTH} height={1160} viewBox={`0 0 ${WIDTH} 1160`}>
      <line x1="80" y1="650" x2="1000" y2="650" stroke="#24211d" strokeWidth="5" />
      {[-320, -160, 0, 160, 320].map((dx, i) => {
        const mid = i === 2;
        const col = mid ? '#d93829' : '#3a342b';
        return (
          <g key={i} transform={`translate(${540 + dx} 650) scale(${mid ? 1.18 : 0.95})`}>
            <circle cx="0" cy="-215" r="34" fill={col} />
            <path d="M -42 -165 H 42 L 54 -45 H 28 L 20 -120 H 14 V 0 H -14 V -95 H -20 V 0 H -28 L -28 -120 H -36 L -54 -45 Z" fill={col} />
            {mid && (
              <g transform="translate(0 -295)">
                <circle r="32" fill="#d93829" />
                <text x="0" y="12" fill="#ffffff" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="36" fontWeight="900">
                  ?
                </text>
              </g>
            )}
          </g>
        );
      })}
      <g transform={`translate(540 905) scale(${cta})`} opacity={cta}>
        <rect x="-390" y="-75" width="780" height="150" rx="28" fill="#24211d" stroke="#d93829" strokeWidth="5" />
        <text x="0" y="-10" fill="#f4efe4" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="30" fontWeight="900">
          COMMENT THEIR NAME BELOW 👇
        </text>
        <text x="0" y="38" fill="#ffb142" textAnchor="middle" fontFamily="monospace" fontSize="26" fontWeight="800">
          @tag_your_time_travel_partner
        </text>
      </g>
    </svg>
  );
}

const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const safe = Math.min(frame, DURATION - 1);
  const active = SCENES.find((s) => safe >= sFrame(s) && safe < eFrame(s)) ?? SCENES[SCENES.length - 1];

  return (
    <AbsoluteFill style={{ width: WIDTH, height: HEIGHT, overflow: 'hidden' }}>
      <Audio src={staticFile('voice.mp3')} />
      <Background theme={active.theme} frame={safe} />
      <EditorialHeader scene={active} frame={safe} />
      <div style={{ position: 'absolute', left: 0, top: 350, width: WIDTH, height: 1160, overflow: 'hidden', zIndex: 3 }}>
        <SceneStage scene={active} frame={safe} />
      </div>
      <CaptionPill scene={active} frame={safe} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);

export default RemotionRoot;

