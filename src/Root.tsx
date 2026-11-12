import React from 'react';
import {
  AbsoluteFill,
  // Audio, staticFile, // Uncomment when you add audio files to public/
  Composition,
  Sequence,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';

/**
 * THE KING'S JUDGEMENT
 * Lemo Opuscar inspired visual direction
 *
 * 1080 x 1920 | 60 FPS | 46 seconds
 * Original SVG artwork, no stock images.
 */

const W = 1080;
const H = 1920;
const FPS = 60;
const DURATION = 46 * FPS;

const C = {
  paper: '#eadcbd',
  paper2: '#dfcda9',
  ink: '#201d1a',
  indigo: '#294d63',
  blue: '#6c9297',
  paleBlue: '#a9c0b7',
  red: '#b64a37',
  ochre: '#c09352',
  gold: '#d5aa61',
  green: '#60765d',
  pale: '#f3e9d2',
  grey: '#81786a',
};

const clamp = (v: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, v));

const ease = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

const drift = (
  f: number,
  distance: number,
  start = 0,
  end = 2760
) =>
  interpolate(f, [start, end], [0, distance], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

// -----------------------------------------------------
// PAPER / PRINT TEXTURES
// -----------------------------------------------------

const PAPER_TEXTURE = (id: string) => (
  <defs>
    <pattern
      id={`${id}-fiber`}
      width="87"
      height="91"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M4 13l18-2M37 29l27-1M12 62l31-2M56 80l24-1M70 8l9 1M2 87l10-1"
        stroke="#7f7059"
        strokeWidth="1.2"
        opacity=".19"
      />
      <path
        d="M18 4l1 9M48 44l2 11M79 54l-1 8M31 74l-2 6"
        stroke="#fff5dc"
        strokeWidth="1.5"
        opacity=".42"
      />
      <circle cx="23" cy="42" r="1.2" fill="#71634e" opacity=".22" />
      <circle cx="66" cy="19" r=".9" fill="#71634e" opacity=".22" />
      <circle cx="74" cy="72" r="1" fill="#71634e" opacity=".2" />
    </pattern>

    <pattern
      id={`${id}-wood`}
      width="160"
      height="74"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M-10 18C28 2 57 34 92 16s56 4 84-9M-8 43c35-15 56 14 95-2s52-2 82-11M-8 65c30-7 54 8 84-3s54-4 91-10"
        fill="none"
        stroke="#172e35"
        strokeWidth="1.25"
        opacity=".14"
      />
      <path
        d="M14 8c17 8 26 8 41 2M106 53c14 4 23 2 36-4"
        fill="none"
        stroke="#f7e8c9"
        strokeWidth="2"
        opacity=".25"
      />
    </pattern>

    <filter
      id={`${id}-rough`}
      x="-5%"
      y="-5%"
      width="110%"
      height="110%"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency=".7"
        numOctaves="2"
        seed="17"
        result="n"
      />
      <feColorMatrix in="n" type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 .13" />
      </feComponentTransfer>
    </filter>
  </defs>
);

// -----------------------------------------------------
// PRINT FRAME AND CARTOUCHE
// -----------------------------------------------------

function PrintFrame({
  children,
  subtitle,
  cartouche = 'राजदरबार की कथा',
  seal = '印',
  paperId,
}: {
  children: React.ReactNode;
  subtitle: string;
  cartouche?: string;
  seal?: string;
  paperId: string;
}) {
  const f = useCurrentFrame();
  const reveal = ease(f, 4, 18);
  const words = cartouche.split(' ');

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {PAPER_TEXTURE(paperId)}

        <rect width={W} height={H} fill={C.paper} />

        <rect
          width={W}
          height={H}
          fill={`url(#${paperId}-fiber)`}
          opacity=".72"
        />

        <rect
          width={W}
          height={H}
          fill={`url(#${paperId}-wood)`}
          opacity=".20"
        />

        {children}

        {/* Physical print border */}
        <rect
          x="29"
          y="31"
          width="1022"
          height="1858"
          fill="none"
          stroke={C.ink}
          strokeWidth="5"
        />

        <rect
          x="43"
          y="45"
          width="994"
          height="1830"
          fill="none"
          stroke={C.ink}
          strokeWidth="1.8"
        />

        <path
          d="M29 110l10-24 14 8M1051 110l-10-24-14 8M29 1810l10 24 14-8M1051 1810l-10 24-14-8"
          fill="none"
          stroke={C.ink}
          strokeWidth="2"
        />

        {/* Top-right title cartouche (widened & stacked so Hindi text fits cleanly) */}
        <g transform="translate(860 90)" opacity={reveal}>
          <rect
            x="-7"
            y="-7"
            width="172"
            height="438"
            fill={C.red}
            opacity=".17"
            transform="translate(3 2)"
          />

          <rect
            width="158"
            height="430"
            fill={C.pale}
            stroke={C.ink}
            strokeWidth="3"
          />

          <rect
            x="7"
            y="7"
            width="144"
            height="416"
            fill="none"
            stroke={C.ink}
            strokeWidth="1"
          />

          <text
            x="79"
            y="50"
            textAnchor="middle"
            fontSize="24"
            fill={C.red}
            fontFamily="serif"
          >
            अध्याय
          </text>

          {words.map((w, idx) => (
            <text
              key={idx}
              x="79"
              y={98 + idx * 36}
              textAnchor="middle"
              fontSize="26"
              fill={C.ink}
              fontWeight="700"
              fontFamily="'Noto Serif Devanagari','Mangal',sans-serif"
            >
              {w}
            </text>
          ))}

          <path d="M24 210H134" stroke={C.ink} strokeWidth="1.5" />

          <text
            x="79"
            y="248"
            textAnchor="middle"
            fontSize="19"
            fill={C.grey}
            fontFamily="'Noto Serif Devanagari','Mangal',sans-serif"
          >
            एक दृष्टांत
          </text>

          <rect x="44" y="340" width="70" height="62" fill={C.red} />

          <text
            x="79"
            y="380"
            textAnchor="middle"
            fontSize="24"
            fill={C.pale}
            fontWeight="700"
            fontFamily="'Noto Serif Devanagari','Mangal',sans-serif"
          >
            {seal}
          </text>
        </g>

        {/* Subtitle cartouche */}
        <g opacity={reveal}>
          <rect
            x="94"
            y="1600"
            width="892"
            height="174"
            rx="3"
            fill="#9c7c50"
            opacity=".22"
            transform="translate(5 7)"
          />

          <rect
            x="94"
            y="1592"
            width="892"
            height="174"
            rx="2"
            fill={C.pale}
            stroke={C.ink}
            strokeWidth="4"
          />

          <rect
            x="105"
            y="1603"
            width="870"
            height="152"
            fill="none"
            stroke={C.ink}
            strokeWidth="1.4"
          />

          <rect
            x="122"
            y="1636"
            width="78"
            height="78"
            fill={C.red}
          />

          <text
            x="161"
            y="1685"
            textAnchor="middle"
            fontSize="26"
            fill={C.pale}
            fontWeight="700"
            fontFamily="'Noto Serif Devanagari','Mangal',sans-serif"
          >
            {seal}
          </text>

          <text
            x="580"
            y="1695"
            textAnchor="middle"
            fontSize="40"
            fill={C.ink}
            fontWeight="700"
            fontFamily="'Noto Serif Devanagari','Mangal',sans-serif"
          >
            {subtitle}
          </text>
        </g>

        {/* Paper print imperfections */}
        <rect
          width={W}
          height={H}
          filter={`url(#${paperId}-rough)`}
          opacity=".24"
        />
      </svg>
    </AbsoluteFill>
  );
}

// -----------------------------------------------------
// ENVIRONMENT
// -----------------------------------------------------

function CloudBand({
  y,
  color = C.paleBlue,
  opacity = 0.55,
}: {
  y: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity} fill={color}>
      <path
        d={`M-40 ${y}c110-30 160 22 265-5s179-25 270 1 174 15 278-6 170-9 347 3v40H-40Z`}
      />
      <path
        d={`M-20 ${y + 37}c116-15 157 13 250-4s159-5 242 6 174 5 270-7 182-3 380 3v26H-20Z`}
        opacity=".48"
      />
    </g>
  );
}

function PineTree({
  x,
  y,
  scale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke={C.ink}
      strokeWidth="4"
      strokeLinejoin="round"
    >
      <path
        d="M0 0v-240"
        stroke="#514233"
        strokeWidth="13"
        fill="none"
      />

      {[0, 1, 2, 3, 4].map((n) => (
        <path
          key={n}
          d={`M0 ${-35 - n * 42}l-104 36 104-7 95 7Z`}
          fill={n % 2 ? C.green : C.indigo}
        />
      ))}
    </g>
  );
}

// -----------------------------------------------------
// STATUE
// -----------------------------------------------------

function Statue({
  x = 560,
  y = 1050,
  scale = 1,
  profile = true,
  nose = 1,
}: {
  x?: number;
  y?: number;
  scale?: number;
  profile?: boolean;
  nose?: number;
}) {
  const transform = `translate(${x} ${y}) scale(${scale})`;

  if (profile) {
    return (
      <g
        transform={transform}
        stroke={C.ink}
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* Misregistered red colour plate */}
        <g transform="translate(3 2)" fill={C.red} opacity=".55">
          <path d="M-5-355c-12-96 61-173 151-159 81 13 107 73 94 142l-12 43 58 49-49 22-4 69c-9 73-64 115-137 111-68-4-103-52-101-120Z" />
        </g>

        <path
          d="M-12-358c-8-93 63-167 151-153 76 12 103 70 89 139l-12 43 51 47-46 23-3 68c-7 75-64 116-137 111-69-4-104-54-101-122Z"
          fill="#d5c6a5"
        />

        <path
          d="M-6-348c-7-87 61-155 139-142 68 11 90 64 78 127l-11 43 45 48-41 18"
          fill="none"
          stroke="#f7ecd4"
          strokeWidth="9"
          opacity=".75"
        />

        {/* Oversized nose */}
        <path
          d={`M218-289l${nose * 74} 101-43 13-50-31`}
          fill={C.ochre}
        />

        <path
          d="M184-221q24 13 46 0"
          fill="none"
          stroke={C.ink}
          strokeWidth="6"
        />

        <path
          d="M194-183q-15 10-32 3"
          fill="none"
          stroke={C.ink}
          strokeWidth="5"
        />

        <path
          d="M103-258q35-22 64-2"
          fill="none"
          stroke={C.ink}
          strokeWidth="10"
        />

        <circle cx="147" cy="-259" r="7" fill={C.ink} stroke="none" />

        <path
          d="M73-122q69 20 125-8"
          fill="none"
          stroke="#8c7250"
          strokeWidth="7"
        />

        <path
          d="M19-45q85 42 197-6l80 105-18 170h-322l-16-166Z"
          fill={C.paleBlue}
        />

        <path
          d="M-52 110q110 32 300 1l44 124h-390Z"
          fill={C.indigo}
        />

        <path d="M-88 234h460v70H-88Z" fill={C.ochre} />

        <path d="M-115 304h510v44h-510Z" fill="#a47b48" />

        <path
          d="M-110 348h510v18h-510Z"
          fill={C.ink}
          stroke="none"
        />

        <path
          d="M-26-57q96 26 188-4"
          fill="none"
          stroke={C.ink}
          strokeWidth="4"
        />
      </g>
    );
  }

  return (
    <g
      transform={transform}
      stroke={C.ink}
      strokeWidth="7"
      strokeLinejoin="round"
    >
      <g transform="translate(3 2)" fill={C.red} opacity=".45">
        <path d="M-135-365q-10-175 135-180t135 180v120q-3 110-135 110t-135-110Z" />
      </g>

      <path
        d="M-138-366q-8-173 138-178t138 178v120q-3 110-138 110t-138-110Z"
        fill="#d5c6a5"
      />

      <path
        d="M-68-292q31-20 62 0M7-292q31-20 62 0"
        fill="none"
        strokeWidth="9"
      />

      <circle cx="-39" cy="-283" r="7" fill={C.ink} stroke="none" />
      <circle cx="39" cy="-283" r="7" fill={C.ink} stroke="none" />

      <path d="M0-273l-4 72 24 8" fill="none" />

      <path d="M-33-171q35 19 70 0" fill="none" strokeWidth="5" />

      <path
        d="M-194 20q195-70 388 0l50 264h-488Z"
        fill={C.blue}
      />

      <path
        d="M-130 42l130 128 130-128"
        fill="none"
        stroke={C.ink}
        strokeWidth="8"
      />

      <path d="M-206 270h412v62h-412Z" fill={C.ochre} />
    </g>
  );
}

// -----------------------------------------------------
// CHARACTERS
// -----------------------------------------------------

function King({
  x,
  y,
  scale = 1,
  pointing = false,
  surprised = false,
}: {
  x: number;
  y: number;
  scale?: number;
  pointing?: boolean;
  surprised?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke={C.ink}
      strokeWidth="7"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M-105-6q-22-62 8-122 35-45 104-41 78 3 100 51l30 210h-278Z"
        fill={C.red}
      />

      <path
        d="M-74 19q66 37 126 0l45 72h-217Z"
        fill={C.gold}
      />

      <path
        d="M-85 77l-28 89h223l-30-89"
        fill={C.indigo}
      />

      {/* Head */}
      <path
        d="M-58-147q-7-75 59-78 72 4 71 82-1 67-63 86-65-17-67-90Z"
        fill="#bb865f"
      />

      {/* Crown */}
      <path
        d="M-69-204l8-88 28 38 31-67 35 68 32-39 4 88Z"
        fill={C.gold}
      />

      <path d="M-69-204h137" stroke={C.ink} strokeWidth="8" />

      <path d="M-26-167q20-12 37 0" fill="none" strokeWidth="7" />

      <path
        d={
          surprised
            ? 'M-5-128q10 22 22 0'
            : 'M-8-130q21 12 34-2'
        }
        fill="none"
        strokeWidth="5"
      />

      <path d="M-20-89q24 22 47 0" fill="none" strokeWidth="9" />

      <path
        d="M-90-27q-44 15-90 64"
        fill="none"
        stroke={C.red}
        strokeWidth="28"
      />

      {pointing ? (
        <path
          d="M-165 42q-15-55-31-94l-20-8 18-16 27 13 45 82"
          fill="#bb865f"
        />
      ) : (
        <path
          d="M-163 46q-16-5-20-33l-6-37 36-13 28 79"
          fill="#bb865f"
        />
      )}

      <path
        d="M-120 165q-19 22-42 23M120 165q21 22 44 23"
        fill="none"
        stroke={C.ink}
        strokeWidth="8"
      />
    </g>
  );
}

function Artist({
  x,
  y,
  scale = 1,
  sprinkle = false,
  openPalm = false,
}: {
  x: number;
  y: number;
  scale?: number;
  sprinkle?: boolean;
  openPalm?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke={C.ink}
      strokeWidth="6"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path
        d="M-85-2q-20-62 10-118 34-42 88-37 62 8 70 58l22 204h-214Z"
        fill={C.indigo}
      />

      <path
        d="M-76 34q63 35 124 0l22 66h-173Z"
        fill={C.paleBlue}
      />

      <path
        d="M-55-143q-12-79 53-84 63 2 70 80-6 53-59 70-56-14-64-66Z"
        fill="#bd8a65"
      />

      <path
        d="M-72-206q12-62 74-68 60 2 77 56-44-17-75-5-40-10-76 17Z"
        fill={C.ochre}
      />

      <path d="M-26-164q23-12 42 2" fill="none" strokeWidth="5" />

      <path d="M-7-117q25 17 43-2" fill="none" strokeWidth="5" />

      {sprinkle ? (
        <path
          d="M-2-21q28-54 61-102l24 11-40 120"
          fill="none"
          stroke="#bd8a65"
          strokeWidth="25"
        />
      ) : openPalm ? (
        <path
          d="M-5-18q38-36 70-34l30 14-5 20-41-7-30 50"
          fill="none"
          stroke="#bd8a65"
          strokeWidth="24"
        />
      ) : (
        <path
          d="M-8-12q27 38 52 65"
          fill="none"
          stroke="#bd8a65"
          strokeWidth="24"
        />
      )}

      <path
        d="M-96 162l-21 35M75 162l22 35"
        fill="none"
        stroke={C.ink}
        strokeWidth="8"
      />
    </g>
  );
}

// -----------------------------------------------------
// ARCHITECTURE
// -----------------------------------------------------

function Arch({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${height}V${width / 2}a${width / 2} ${width / 2} 0 0 1 ${width} 0v${height - width / 2}Z`}
        fill={C.ochre}
        opacity=".32"
        stroke={C.ink}
        strokeWidth="8"
      />

      <path
        d={`M22 ${height}V${width / 2}a${width / 2 - 22} ${width / 2 - 22} 0 0 1 ${width - 44} 0v${height - width / 2}Z`}
        fill={C.paleBlue}
        opacity=".38"
        stroke={C.ink}
        strokeWidth="3"
      />
    </g>
  );
}

function HallBackdrop() {
  return (
    <g>
      <rect x="55" y="320" width="970" height="1120" fill="#ddc79e" />

      <path d="M55 320h970v74H55Z" fill={C.indigo} />

      <Arch x={95} y={420} width={300} height={880} />
      <Arch x={405} y={420} width={300} height={880} />
      <Arch x={715} y={420} width={270} height={880} />

      <CloudBand y={580} color={C.paper} opacity={0.45} />

      <path
        d="M55 1330q280-70 485 0t485 0v110H55Z"
        fill={C.green}
        opacity=".62"
      />

      <path d="M55 1437h970" stroke={C.ink} strokeWidth="8" />

      <path
        d="M80 1485h920"
        stroke={C.ink}
        strokeWidth="2"
        opacity=".4"
      />
    </g>
  );
}

// -----------------------------------------------------
// DUST / FOLEY VISUAL
// -----------------------------------------------------

function Dust({
  frame,
  x,
  y,
}: {
  frame: number;
  x: number;
  y: number;
}) {
  const dots = Array.from({ length: 22 }, (_, i) => {
    const delay = i * 1.7;
    const t = clamp((frame - delay) / 70);
    const dx = ((i * 37) % 121) - 60;
    const dy = t * (55 + (i % 6) * 15);

    return (
      <circle
        key={i}
        cx={x + dx + Math.sin(frame * 0.05 + i) * 8}
        cy={y + dy}
        r={2 + (i % 3)}
        fill={i % 4 === 0 ? C.red : C.ochre}
        opacity={1 - t * 0.78}
      />
    );
  });

  return <g>{dots}</g>;
}

// -----------------------------------------------------
// SCENE 01 — THE HOOK
// -----------------------------------------------------

function HookScene() {
  const f = useCurrentFrame();

  const zoom = interpolate(f, [0, 65, 240], [1.18, 1.32, 1.12], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const shake =
    f < 90 ? Math.sin(f * 0.31) * (1 - f / 90) * 5 : 0;

  return (
    <PrintFrame
      paperId="hook"
      subtitle="नाक काट दो!"
      cartouche="राजा का आदेश"
      seal="आज्ञा"
    >
      <g
        transform={`translate(${shake} 0) translate(540 970) scale(${zoom}) translate(-540 -970)`}
      >
        <rect
          x="55"
          y="300"
          width="970"
          height="1140"
          fill={C.indigo}
          opacity=".13"
        />

        <CloudBand y={470} color={C.blue} opacity={0.65} />

        <PineTree x={115} y={1360} scale={1.0} />
        <PineTree x={965} y={1340} scale={0.9} />

        <path
          d="M120 1390q280-120 500-20t340-7"
          fill="none"
          stroke={C.ink}
          strokeWidth="9"
        />

        <Statue x={490} y={1200} scale={1.55} profile nose={1.55} />

        <path
          d="M140 540q-40 110-15 245"
          fill="none"
          stroke={C.red}
          strokeWidth="13"
          strokeDasharray="13 17"
        />

        <path
          d="M180 470l48 44-51 15"
          fill="none"
          stroke={C.red}
          strokeWidth="9"
        />
      </g>

      <g transform="translate(140 1360)">
        <path d="M0 0h180" stroke={C.ink} strokeWidth="4" />

        <text
          x="90"
          y="-22"
          textAnchor="middle"
          fontSize="24"
          fill={C.grey}
          fontFamily="'Noto Serif Devanagari','Mangal',sans-serif"
        >
          पहला सवाल
        </text>
      </g>
    </PrintFrame>
  );
}

// -----------------------------------------------------
// SCENE 02 — COURT
// -----------------------------------------------------

function CourtScene() {
  const f = useCurrentFrame();
  const move = drift(f, -24, 0, 420);
  const kingPoint = ease(f, 10, 42);

  return (
    <PrintFrame
      paperId="court"
      subtitle="यह नाक बहुत बड़ी है!"
      cartouche="दरबार का फैसला"
      seal="राजा"
    >
      <g transform={`translate(${move} 0)`}>
        <HallBackdrop />

        <Statue x={580} y={1180} scale={1.05} profile nose={1.0} />

        <King x={270} y={1170} scale={1.1} pointing={kingPoint > 0.15} />

        <Artist x={840} y={1190} scale={0.92} />

        <path
          d="M345 800q90-60 175-6"
          fill="none"
          stroke={C.red}
          strokeWidth="8"
          strokeDasharray="12 10"
          opacity={kingPoint}
        />

        <path
          d="M355 760l-22 35 45-5"
          fill="none"
          stroke={C.red}
          strokeWidth="8"
          opacity={kingPoint}
        />
      </g>
    </PrintFrame>
  );
}

// -----------------------------------------------------
// SCENE 03 — THE ARTIST'S MOVE
// -----------------------------------------------------

function DustScene() {
  const f = useCurrentFrame();
  const sprinkle = ease(f, 18, 48);

  return (
    <PrintFrame
      paperId="dust"
      subtitle="मूर्तिकार ने बहस नहीं की…"
      cartouche="शांत उत्तर"
      seal="धैर्य"
    >
      <HallBackdrop />

      <Statue x={535} y={1200} scale={0.95} profile nose={1.0} />

      <King x={230} y={1190} scale={0.9} surprised />

      <Artist x={800} y={1180} scale={1.05} sprinkle />

      <g opacity={sprinkle}>
        <path
          d="M804 1090q-20 90-80 151"
          fill="none"
          stroke={C.ochre}
          strokeWidth="6"
          strokeDasharray="8 13"
        />

        <Dust frame={f} x={730} y={1290} />
      </g>

      <path
        d="M220 1444q300-26 600 0"
        stroke={C.red}
        strokeWidth="9"
        fill="none"
        strokeDasharray="5 19"
        opacity={sprinkle}
      />

      <path
        d="M230 1400h610"
        stroke={C.ink}
        strokeWidth="6"
        opacity=".55"
      />
    </PrintFrame>
  );
}

// -----------------------------------------------------
// SCENE 04 — WRONG VIEWPOINT
// -----------------------------------------------------

function CloseViewScene() {
  const f = useCurrentFrame();

  const zoom = interpolate(f, [0, 210, 480], [1.03, 1.28, 1.18], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const tilt = interpolate(f, [0, 180, 480], [0, -13, -13], {
    extrapolateRight: 'clamp',
  });

  return (
    <PrintFrame
      paperId="close"
      subtitle="पास से नाक ही नाक दिखी!"
      cartouche="राजा की नज़र"
      seal="दृष्टि"
    >
      <g
        transform={`translate(540 990) rotate(${tilt}) scale(${zoom}) translate(-540 -990)`}
      >
        <rect
          x="55"
          y="330"
          width="970"
          height="1110"
          fill={C.blue}
          opacity=".27"
        />

        <CloudBand y={470} color={C.paleBlue} opacity={0.62} />

        <path
          d="M100 1330q270-70 520-6t350-10"
          fill="none"
          stroke={C.ink}
          strokeWidth="8"
        />

        <Statue x={240} y={1215} scale={1.45} profile nose={1.8} />

        <g transform="translate(815 880) scale(.62)">
          <King x={0} y={0} scale={1.0} pointing />
        </g>

        <path
          d="M160 680q100-70 215-20"
          stroke={C.red}
          strokeWidth="11"
          fill="none"
          strokeDasharray="18 12"
        />

        <path
          d="M180 650l-4 55 48-30"
          stroke={C.red}
          strokeWidth="9"
          fill="none"
        />
      </g>
    </PrintFrame>
  );
}

// -----------------------------------------------------
// SCENE 05 — PULL BACK
// -----------------------------------------------------

function StepBackScene() {
  const f = useCurrentFrame();

  const back = ease(f, 30, 130);

  const cam = interpolate(f, [0, 130, 480], [1.2, 0.86, 0.82], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const kingX = interpolate(f, [0, 130, 480], [350, 205, 205], {
    extrapolateRight: 'clamp',
  });

  return (
    <PrintFrame
      paperId="stepback"
      subtitle="फिर उसने राजा को पीछे बुलाया…"
      cartouche="दूरी का रहस्य"
      seal="बोध"
    >
      <g
        transform={`translate(540 1020) scale(${cam}) translate(-540 -1020)`}
      >
        <HallBackdrop />

        <path
          d="M100 1430h850"
          stroke={C.red}
          strokeWidth="8"
          strokeDasharray="10 15"
          opacity=".78"
        />

        <path
          d="M210 1385v70M790 1385v70"
          stroke={C.ink}
          strokeWidth="6"
        />

        <Statue x={570} y={1200} scale={0.95} profile nose={1.0} />

        <King
          x={kingX}
          y={1188}
          scale={0.8}
          pointing={false}
          surprised={back > 0.4}
        />

        <Artist x={850} y={1195} scale={0.75} openPalm />

        <path
          d="M340 1060q125-75 240-16"
          fill="none"
          stroke={C.red}
          strokeWidth="7"
          strokeDasharray="10 12"
          opacity={back}
        />
      </g>
    </PrintFrame>
  );
}

// -----------------------------------------------------
// SCENE 06 — REVEAL
// -----------------------------------------------------

function RevealScene() {
  const f = useCurrentFrame();

  const reveal = ease(f, 8, 70);

  const sealScale = interpolate(f, [70, 82, 102], [1.35, 1, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <PrintFrame
      paperId="reveal"
      subtitle="नाक नहीं बदली… नज़रिया बदला।"
      cartouche="सच्चाई सामने"
      seal="सत्य"
    >
      <HallBackdrop />

      <g transform={`translate(0 ${drift(f, -12, 0, 360)})`}>
        <Statue x={590} y={1210} scale={0.9} profile nose={1.0} />

        <King x={260} y={1190} scale={0.88} surprised />

        <Artist x={850} y={1200} scale={0.82} openPalm />
      </g>

      <g transform={`translate(820 560) scale(${sealScale})`}>
        <rect
          width="115"
          height="115"
          fill={C.red}
          stroke={C.ink}
          strokeWidth="5"
        />

        <text
          x="57"
          y="77"
          textAnchor="middle"
          fontSize="56"
          fill={C.pale}
          fontWeight="700"
          fontFamily="serif"
        >
          ✓
        </text>
      </g>

      <path
        d="M165 1430q220-95 425-10t340-12"
        fill="none"
        stroke={C.ochre}
        strokeWidth="8"
        opacity={reveal}
      />
    </PrintFrame>
  );
}

// -----------------------------------------------------
// SCENE 07 — MORAL / ECHO
// -----------------------------------------------------

function MoralScene() {
  const f = useCurrentFrame();

  const zoom = interpolate(f, [0, 160, 420], [1.05, 0.92, 0.78], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const glow = ease(f, 70, 160);

  return (
    <PrintFrame
      paperId="moral"
      subtitle="दूरी नहीं… नज़रिया बदलो।"
      cartouche="कहानी का सार"
      seal="सीख"
    >
      <g
        transform={`translate(540 1020) scale(${zoom}) translate(-540 -1020)`}
      >
        <rect
          x="55"
          y="330"
          width="970"
          height="1110"
          fill={C.paleBlue}
          opacity=".25"
        />

        <CloudBand y={490} color={C.paper} opacity={0.8} />

        <PineTree x={130} y={1385} scale={0.85} />
        <PineTree x={940} y={1380} scale={0.82} />

        <Statue x={530} y={1210} scale={0.88} profile nose={1.0} />

        <King x={225} y={1200} scale={0.72} surprised />

        <Artist x={820} y={1210} scale={0.72} openPalm />

        <path
          d="M240 1440q280-100 540 0"
          fill="none"
          stroke={C.red}
          strokeWidth="7"
          opacity={glow}
        />
      </g>

      <g opacity={glow}>
        <path
          d="M245 650q295-150 590 0"
          fill="none"
          stroke={C.ochre}
          strokeWidth="5"
          strokeDasharray="8 18"
        />

        <circle cx="540" cy="580" r="6" fill={C.red} />
      </g>
    </PrintFrame>
  );
}

// -----------------------------------------------------
// SCENE ROUTER
// -----------------------------------------------------

function Scene({
  kind,
}: {
  kind:
    | 'hook'
    | 'court'
    | 'dust'
    | 'close'
    | 'stepback'
    | 'reveal'
    | 'moral';
}) {
  switch (kind) {
    case 'hook':
      return <HookScene />;

    case 'court':
      return <CourtScene />;

    case 'dust':
      return <DustScene />;

    case 'close':
      return <CloseViewScene />;

    case 'stepback':
      return <StepBackScene />;

    case 'reveal':
      return <RevealScene />;

    case 'moral':
      return <MoralScene />;
  }
}

// -----------------------------------------------------
// TIMELINE
// -----------------------------------------------------

const SCENES: {
  kind:
    | 'hook'
    | 'court'
    | 'dust'
    | 'close'
    | 'stepback'
    | 'reveal'
    | 'moral';
  from: number;
  duration: number;
}[] = [
  { kind: 'hook', from: 0, duration: 240 },
  { kind: 'court', from: 240, duration: 420 },
  { kind: 'dust', from: 660, duration: 360 },
  { kind: 'close', from: 1020, duration: 480 },
  { kind: 'stepback', from: 1500, duration: 480 },
  { kind: 'reveal', from: 1980, duration: 360 },
  { kind: 'moral', from: 2340, duration: 420 },
];

// -----------------------------------------------------
// MAIN COMPOSITION
// -----------------------------------------------------

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeOut = interpolate(
    frame,
    [DURATION - 24, DURATION],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.paper,
      }}
    >
      {SCENES.map((scene) => (
        <Sequence
          key={scene.kind}
          from={scene.from}
          durationInFrames={scene.duration}
        >
          <Scene kind={scene.kind} />
        </Sequence>
      ))}

      {/*
        UNCOMMENT ONLY IF public/music-bed.wav EXISTS IN YOUR REPO:
        <Audio src={staticFile('music-bed.wav')} volume={0.82} />
      */}

      <AbsoluteFill
        style={{
          backgroundColor: '#181613',
          opacity: 1 - fadeOut,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// -----------------------------------------------------
// ROOT
// -----------------------------------------------------

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={DURATION}
      fps={FPS}
      width={W}
      height={H}
    />
  </>
);

export default RemotionRoot;
