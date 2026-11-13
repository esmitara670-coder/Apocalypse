import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

// ============================================================
// BRAIN PREDICTION — BLUEPRINT SCIENCE SHORT
// 1080 x 1920 | 60 FPS | 30.83 seconds
// ============================================================

const W = 1080;
const H = 1920;
const FPS = 60;
const DURATION = 1850;

// Put this audio in your public folder.
const AUDIO_FILE = "studio_voice (4).wav";

const C = {
  blue: "#17366D",
  blueLight: "#244A85",
  blueDark: "#102750",
  white: "#F3F7FF",
  whiteSoft: "rgba(243,247,255,0.70)",
  faint: "rgba(243,247,255,0.20)",
  faint2: "rgba(243,247,255,0.09)",
  red: "#E34B4B", // Reserved for the final verdict stamp only.
};

const EASE = Easing.bezier(0.7, 0, 0.2, 1);

const clamp = (v: number) => Math.max(0, Math.min(1, v));

const progress = (
  frame: number,
  start: number,
  end: number,
) =>
  interpolate(
    frame,
    [start, end],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    },
  );

const linearProgress = (
  frame: number,
  start: number,
  end: number,
) =>
  interpolate(
    frame,
    [start, end],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

const move = (
  frame: number,
  input: number[],
  output: number[],
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

// ============================================================
// REUSABLE TECHNICAL DRAWING COMPONENTS
// ============================================================

const Line: React.FC<{
  d: string;
  frame: number;
  duration?: number;
  width?: number;
  opacity?: number;
  dashed?: boolean;
}> = ({
  d,
  frame,
  duration = 40,
  width = 3,
  opacity = 1,
  dashed = false,
}) => {
  const offset = 100 * (1 - progress(frame, 0, duration));

  return (
    <path
      d={d}
      fill="none"
      stroke={C.white}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? "6 12" : "100"}
      strokeDashoffset={dashed ? 0 : offset}
      pathLength={dashed ? undefined : 100}
      opacity={opacity}
    />
  );
};

const Circle: React.FC<{
  x: number;
  y: number;
  r: number;
  frame: number;
  duration?: number;
  width?: number;
  fill?: string;
}> = ({
  x,
  y,
  r,
  frame,
  duration = 35,
  width = 3,
  fill = "none",
}) => {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={fill}
      stroke={C.white}
      strokeWidth={width}
      pathLength={100}
      strokeDasharray={100}
      strokeDashoffset={100 * (1 - progress(frame, 0, duration))}
    />
  );
};

const Crosshair: React.FC<{
  x: number;
  y: number;
  size: number;
  frame: number;
}> = ({ x, y, size, frame }) => {
  const scale = progress(frame, 0, 25);

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke={C.white}
      strokeWidth={2}
      fill="none"
    >
      <circle r={size * 0.65} />
      <circle r={size * 0.18} />
      <path
        d={`M-${size} 0 H-${size * 0.3}
            M${size * 0.3} 0 H${size}
            M0 -${size} V-${size * 0.3}
            M0 ${size * 0.3} V${size}`}
      />
    </g>
  );
};

const TechText: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
}> = ({
  x,
  y,
  children,
  size = 22,
  anchor = "start",
  opacity = 0.9,
}) => (
  <text
    x={x}
    y={y}
    fill={C.white}
    fontFamily="Arial, Helvetica, sans-serif"
    fontSize={size}
    fontWeight={500}
    letterSpacing="2px"
    textAnchor={anchor}
    opacity={opacity}
  >
    {children}
  </text>
);

// ============================================================
// BLUEPRINT PAPER
// ============================================================

const BlueprintBackground: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.blue }}>
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ position: "absolute" }}
    >
      <defs>
        <linearGradient id="paperTone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.blueDark} />
          <stop offset="52%" stopColor={C.blue} />
          <stop offset="100%" stopColor={C.blueLight} />
        </linearGradient>

        <pattern
          id="smallGrid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M40 0H0V40"
            fill="none"
            stroke="#E8F0FF"
            strokeWidth="0.8"
            opacity="0.12"
          />
        </pattern>

        <pattern
          id="largeGrid"
          width="200"
          height="200"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M200 0H0V200"
            fill="none"
            stroke="#E8F0FF"
            strokeWidth="1.2"
            opacity="0.15"
          />
          <circle cx="0" cy="0" r="3" fill="#FFFFFF" opacity="0.25" />
        </pattern>
      </defs>

      <rect width={W} height={H} fill="url(#paperTone)" />
      <rect width={W} height={H} fill="url(#smallGrid)" />
      <rect width={W} height={H} fill="url(#largeGrid)" />

      {/* Subtle sheet imperfections */}
      <path
        d="M0 620 Q450 605 1080 630
           M0 1480 Q540 1465 1080 1490"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.035"
      />
    </svg>
  </AbsoluteFill>
);

// ============================================================
// PAGE HEADER AND TITLE BLOCK
// ============================================================

const PageFrame: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <g
        stroke={C.white}
        fill="none"
        opacity="0.48"
        strokeWidth="1.5"
      >
        <rect x="42" y="42" width="996" height="1836" />
        <path d="M42 202H1038" />
        <path d="M42 1710H1038" />
        <path d="M42 1830H1038" />
        <path d="M42 1766H1038" />
        <path d="M720 1710V1880" />
        <path d="M865 1710V1880" />
      </g>

      <g
        fill={C.white}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="2px"
      >
        <text x="68" y="91" fontSize="20" opacity="0.75">
          NEUROSCIENCE / FIELD STUDY
        </text>
        <text x="68" y="158" fontSize="36" fontWeight="700">
          PREDICTIVE PROCESSING
        </text>

        <text x="1010" y="91" fontSize="17" textAnchor="end" opacity="0.75">
          FIG. 01
        </text>
        <text x="1010" y="158" fontSize="17" textAnchor="end" opacity="0.75">
          HUMAN BRAIN
        </text>

        <text x="68" y="1755" fontSize="17" opacity="0.75">
          SUBJECT
        </text>
        <text x="68" y="1790" fontSize="23" fontWeight="600">
          THE NEXT MOMENT
        </text>

        <text x="745" y="1755" fontSize="15" opacity="0.75">
          SHEET
        </text>
        <text x="745" y="1790" fontSize="23">
          01 / 01
        </text>

        <text x="888" y="1755" fontSize="15" opacity="0.75">
          REVISION
        </text>
        <text x="888" y="1790" fontSize="23">
          FINAL
        </text>

        <text x="68" y="1859" fontSize="14" opacity="0.65">
          VISUAL EXPLANATION / PREDICTIVE BRAIN MODEL
        </text>
      </g>
    </svg>
  </AbsoluteFill>
);

// ============================================================
// DIAGRAM 1 — BRAIN + INCOMING BALL
// ============================================================

const SceneOne: React.FC = () => {
  const f = useCurrentFrame();

  const zoom = move(f, [0, 360], [0.9, 1.08]);
  const ballX = move(f, [0, 360], [1010, 810]);
  const ballY = move(f, [0, 360], [650, 675]);

  return (
    <AbsoluteFill style={{ top: 220, bottom: 380 }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1350">
        <g transform={`translate(-20 -10) scale(${zoom})`}>
          {/* Head profile */}
          <Line
            frame={f}
            duration={70}
            width={4}
            d="
              M 345 250
              C 485 145 665 190 735 320
              C 773 391 760 443 820 487
              L 850 521
              L 792 553
              L 833 587
              L 790 618
              C 792 711 743 784 665 826
              C 645 909 608 974 551 1022
              L 332 1022
              C 343 918 310 852 258 784
              C 205 715 198 601 233 470
              C 254 367 283 294 345 250 Z
            "
          />

          {/* Neck and shoulder */}
          <Line
            frame={f}
            duration={45}
            width={2}
            opacity={0.7}
            d="M 370 1020 L 365 1125 M 570 1020 L 625 1125"
          />

          {/* Brain outer */}
          <Line
            frame={f}
            duration={65}
            width={3}
            d="
              M 330 445
              C 315 395 365 353 414 371
              C 437 314 517 304 557 354
              C 615 320 674 364 666 424
              C 720 455 714 514 676 543
              C 705 594 664 650 607 640
              C 581 695 513 694 481 656
              C 422 687 361 645 377 590
              C 322 562 299 497 330 445 Z
            "
          />

          {/* Brain folds */}
          <Line
            frame={f}
            duration={30}
            width={2}
            d="M 382 418 Q 421 389 443 423 Q 466 454 433 479"
          />
          <Line
            frame={f}
            duration={30}
            width={2}
            d="M 470 370 Q 497 408 473 445 Q 454 474 480 499"
          />
          <Line
            frame={f}
            duration={30}
            width={2}
            d="M 548 378 Q 577 401 556 433 Q 530 470 570 494"
          />
          <Line
            frame={f}
            duration={30}
            width={2}
            d="M 625 426 Q 587 437 606 478 Q 628 520 665 506"
          />
          <Line
            frame={f}
            duration={30}
            width={2}
            d="M 380 528 Q 424 506 454 541 Q 477 571 438 598"
          />
          <Line
            frame={f}
            duration={30}
            width={2}
            d="M 515 524 Q 547 490 572 527 Q 592 557 568 592"
          />

          {/* Neural connections */}
          {[
            [402, 445, 486, 404],
            [486, 404, 580, 455],
            [580, 455, 620, 555],
            [402, 445, 434, 564],
            [434, 564, 535, 620],
            [535, 620, 620, 555],
          ].map(([x1, y1, x2, y2], i) => (
            <Line
              key={i}
              frame={f}
              duration={70 + i * 4}
              width={1.6}
              opacity={0.65}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
            />
          ))}

          {/* Incoming object path */}
          <Line
            frame={f}
            duration={70}
            width={2}
            opacity={0.7}
            dashed
            d="M 1020 665 Q 915 610 810 675"
          />

          {/* Moving ball */}
          <g transform={`translate(${ballX} ${ballY})`}>
            <circle
              r="65"
              fill={C.blue}
              stroke={C.white}
              strokeWidth="4"
            />
            <path
              d="M-45 -30 Q0 -75 43 -30 Q65 12 20 48"
              fill="none"
              stroke={C.white}
              strokeWidth="2"
            />
            <path
              d="M-45 30 Q0 75 43 30"
              fill="none"
              stroke={C.white}
              strokeWidth="2"
            />
            <circle r="9" fill={C.white} />
          </g>

          <Crosshair x={ballX} y={ballY} size={102} frame={f} />
          <Crosshair x={580} y={490} size={80} frame={f} />

          <TechText x={80} y={280} size={20}>
            FIG. 01 / INPUT
          </TechText>

          <TechText x={80} y={316} size={17} opacity={0.65}>
            VISUAL INFORMATION
          </TechText>

          <TechText x={780} y={920} size={18}>
            MOVING OBJECT
          </TechText>

          <Line
            frame={f}
            duration={30}
            width={1.5}
            opacity={0.7}
            d="M 850 890 L 840 790 L 808 730"
          />

          <TechText x={80} y={1165} size={18}>
            OBSERVE THE TRAJECTORY
          </TechText>
          <Line
            frame={f}
            duration={30}
            width={1.5}
            opacity={0.6}
            d="M 80 1190 H 570"
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================
// DIAGRAM 2 — EYE TRACKING
// ============================================================

const SceneTwo: React.FC = () => {
  const f = useCurrentFrame();

  const pan = move(f, [0, 360], [50, -60]);
  const ball = move(f, [0, 360], [265, 790]);

  return (
    <AbsoluteFill style={{ top: 220, bottom: 380 }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1350">
        <g transform={`translate(${pan} 0)`}>
          {/* Large eye */}
          <Line
            frame={f}
            duration={65}
            width={4}
            d="
              M 90 575
              Q 330 320 570 575
              Q 330 825 90 575 Z
            "
          />

          <Circle
            x={330}
            y={575}
            r={115}
            frame={f}
            duration={45}
            width={3}
          />

          <Circle
            x={330}
            y={575}
            r={58}
            frame={f}
            duration={45}
            width={3}
          />

          <Circle
            x={330}
            y={575}
            r={14}
            frame={f}
            duration={35}
            fill={C.white}
          />

          {/* Tracking trajectory */}
          <Line
            frame={f}
            duration={75}
            width={2}
            opacity={0.75}
            dashed
            d="M 265 250 Q 495 355 790 680"
          />

          {/* Prediction point */}
          <Circle
            x={790}
            y={680}
            r={55}
            frame={f}
            duration={30}
            width={3}
          />
          <Crosshair x={790} y={680} size={80} frame={f} />

          {/* Past positions */}
          {[265, 435, 600].map((x, i) => (
            <g key={i} opacity={0.45 + i * 0.12}>
              <circle
                cx={x}
                cy={250 + i * 92}
                r={24}
                fill="none"
                stroke={C.white}
                strokeWidth="2"
              />
              <path
                d={`M ${x - 8} ${250 + i * 92}
                    L ${x + 8} ${250 + i * 92}`}
                stroke={C.white}
                strokeWidth="1.5"
              />
            </g>
          ))}

          {/* Live moving ball */}
          <circle
            cx={ball}
            cy={680}
            r={38}
            fill={C.blue}
            stroke={C.white}
            strokeWidth={3}
          />

          <TechText x={100} y={940} size={20}>
            CURRENT INPUT
          </TechText>

          <Line
            frame={f}
            duration={40}
            d="M 100 960 H 380"
            width={1.5}
          />

          <TechText x={635} y={835} size={20}>
            ESTIMATED PATH
          </TechText>

          <Line
            frame={f}
            duration={35}
            width={1.5}
            d="M 800 850 L 800 735"
          />

          <TechText x={90} y={1130} size={24}>
            THE BRAIN TRACKS CHANGE
          </TechText>

          <TechText x={90} y={1170} size={17} opacity={0.65}>
            POSITION / DIRECTION / SPEED
          </TechText>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================
// DIAGRAM 3 — THE PREDICTION MODEL
// ============================================================

const SceneThree: React.FC = () => {
  const f = useCurrentFrame();

  const zoom = move(f, [0, 420], [0.92, 1.12]);
  const pulse = 1 + Math.sin(f * 0.16) * 0.035;

  const nodes = [
    [280, 450],
    [420, 360],
    [555, 450],
    [690, 360],
    [790, 500],
    [650, 600],
    [480, 640],
    [330, 590],
  ];

  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 0],
    [1, 7],
    [2, 6],
    [0, 5],
    [3, 5],
  ];

  return (
    <AbsoluteFill style={{ top: 220, bottom: 380 }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1350">
        <g transform={`translate(0 0) scale(${zoom})`}>
          {/* Brain outline */}
          <Line
            frame={f}
            duration={70}
            width={4}
            d="
              M 270 490
              C 225 410 285 335 375 350
              C 425 270 535 290 565 345
              C 640 290 735 355 712 430
              C 815 445 840 530 775 590
              C 793 680 715 733 650 700
              C 570 785 470 750 430 708
              C 345 740 263 668 295 595
              C 237 565 230 520 270 490 Z
            "
          />

          {/* Network edges */}
          {edges.map(([a, b], i) => {
            const start = nodes[a];
            const end = nodes[b];

            return (
              <Line
                key={i}
                frame={f}
                duration={65 + i * 3}
                width={2}
                opacity={0.6}
                d={`M ${start[0]} ${start[1]}
                    L ${end[0]} ${end[1]}`}
              />
            );
          })}

          {/* Animated neural nodes */}
          {nodes.map(([x, y], i) => {
            const r = 13 + Math.sin(f * 0.15 + i) * 4;

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={C.blue}
                  stroke={C.white}
                  strokeWidth="3"
                  opacity={progress(f, 30 + i * 3, 60 + i * 3)}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={r * 2.1}
                  fill="none"
                  stroke={C.white}
                  strokeWidth="1"
                  opacity={0.17}
                />
              </g>
            );
          })}

          {/* Incoming data */}
          <Line
            frame={f}
            duration={45}
            width={2}
            d="M 80 520 H 245"
          />

          <TechText x={80} y={475} size={19}>
            PAST
          </TechText>
          <TechText x={80} y={555} size={17} opacity={0.7}>
            EXPERIENCE
          </TechText>

          {/* Output */}
          <Line
            frame={f}
            duration={45}
            width={2}
            d="M 810 520 H 1000"
          />

          <TechText x={995} y={470} size={19} anchor="end">
            NEXT
          </TechText>
          <TechText x={995} y={555} size={17} anchor="end" opacity={0.7}>
            POSITION
          </TechText>

          {/* Prediction waveform */}
          <g transform={`translate(0 ${Math.sin(f * 0.10) * 8})`}>
            <Line
              frame={f}
              duration={70}
              width={3}
              d="
                M 120 920
                L 190 920
                L 230 870
                L 270 970
                L 310 900
                L 365 920
                L 440 920
                L 490 855
                L 535 985
                L 585 900
                L 640 920
                L 730 920
                L 785 865
                L 830 960
                L 880 920
                L 960 920
              "
            />
          </g>

          <TechText x={100} y={1085} size={22}>
            PREDICTIVE MODEL
          </TechText>

          <TechText x={100} y={1125} size={17} opacity={0.65}>
            INPUT + MEMORY + MOTION
          </TechText>

          <Line
            frame={f}
            duration={35}
            d="M 100 1150 H 850"
            width={1.5}
            opacity={0.65}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================
// DIAGRAM 4 — ANTICIPATION AND MOTOR RESPONSE
// ============================================================

const SceneFour: React.FC = () => {
  const f = useCurrentFrame();

  const ballX = move(f, [0, 360], [850, 575]);
  const handX = move(f, [0, 360], [180, 310]);
  const zoom = move(f, [0, 360], [0.95, 1.08]);

  return (
    <AbsoluteFill style={{ top: 220, bottom: 380 }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1350">
        <g transform={`scale(${zoom})`}>
          {/* Wrist */}
          <Line
            frame={f}
            duration={65}
            width={4}
            d={`
              M ${handX - 40} 1030
              L ${handX + 100} 1030
              L ${handX + 120} 820
              L ${handX + 70} 710
            `}
          />

          {/* Palm and fingers */}
          <Line
            frame={f}
            duration={65}
            width={4}
            d={`
              M ${handX + 70} 710
              C ${handX + 15} 675 ${handX + 5} 610 ${handX + 45} 570
              C ${handX + 80} 535 ${handX + 130} 575 ${handX + 140} 640
              L ${handX + 175} 480
              C ${handX + 190} 425 ${handX + 240} 430 ${handX + 245} 492
              L ${handX + 240} 650
              L ${handX + 275} 465
              C ${handX + 286} 410 ${handX + 335} 425 ${handX + 335} 480
              L ${handX + 320} 660
              L ${handX + 355} 520
              C ${handX + 375} 465 ${handX + 420} 492 ${handX + 400} 550
              L ${handX + 350} 750
              C ${handX + 325} 825 ${handX + 260} 875 ${handX + 175} 870
              C ${handX + 95} 865 ${handX + 65} 805 ${handX + 70} 710
            `}
          />

          {/* Hand internal structure */}
          <Line
            frame={f}
            duration={45}
            width={1.8}
            opacity={0.65}
            d={`
              M ${handX + 145} 720 L ${handX + 240} 730
              M ${handX + 185} 495 L ${handX + 193} 650
              M ${handX + 280} 490 L ${handX + 275} 665
              M ${handX + 365} 550 L ${handX + 315} 715
            `}
          />

          {/* Ball trajectory */}
          <Line
            frame={f}
            duration={65}
            width={2}
            opacity={0.75}
            dashed
            d="M 990 500 Q 820 560 680 625"
          />

          {/* Ball */}
          <circle
            cx={ballX}
            cy={600}
            r={52}
            fill={C.blue}
            stroke={C.white}
            strokeWidth="4"
          />

          <path
            d={`M ${ballX - 35} 575 Q ${ballX + 5} 545 ${ballX + 35} 575
                M ${ballX - 35} 625 Q ${ballX + 5} 655 ${ballX + 35} 625`}
            fill="none"
            stroke={C.white}
            strokeWidth="2"
          />

          <Crosshair x={ballX} y={600} size={85} frame={f} />

          {/* Interception marker */}
          <Circle
            x={handX + 290}
            y={620}
            r={88}
            frame={f}
            duration={45}
            width={2}
          />

          <TechText x={90} y={300} size={20}>
            MOTOR RESPONSE
          </TechText>

          <Line
            frame={f}
            duration={35}
            width={1.5}
            d="M 90 330 H 440"
          />

          <TechText x={90} y={1150} size={22}>
            ACTION BEFORE CONTACT
          </TechText>
          <TechText x={90} y={1190} size={17} opacity={0.7}>
            AN ANTICIPATORY RESPONSE
          </TechText>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================
// SCENE 5 — THE VERDICT
// ============================================================

const SceneFive: React.FC = () => {
  const f = useCurrentFrame();

  const titleProgress = progress(f, 70, 145);
  const stampProgress = progress(f, 190, 220);
  const zoom = move(f, [0, 350], [0.95, 1.04]);

  return (
    <AbsoluteFill style={{ top: 220, bottom: 380 }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1350">
        <g transform={`scale(${zoom})`}>
          {/* Echo of the opening */}
          <g opacity={0.45}>
            <path
              d="
                M 240 410
                C 280 270 440 230 570 285
                C 700 345 740 500 670 615
                C 620 700 510 725 420 670
                C 315 710 220 590 240 410 Z
              "
              fill="none"
              stroke={C.white}
              strokeWidth="3"
            />
            <path
              d="M 360 440 Q 440 380 480 460
                 M 490 360 Q 560 420 530 480
                 M 580 450 Q 635 520 580 575"
              fill="none"
              stroke={C.white}
              strokeWidth="2"
            />
            <circle
              cx="820"
              cy="520"
              r="52"
              fill="none"
              stroke={C.white}
              strokeWidth="3"
            />
            <path
              d="M 875 520 H 970"
              stroke={C.white}
              strokeWidth="2"
              strokeDasharray="7 9"
            />
          </g>

          {/* Main conclusion */}
          <g opacity={titleProgress}>
            <TechText x={90} y={820} size={23}>
              CONCLUSION / 01
            </TechText>

            <text
              x="90"
              y="910"
              fill={C.white}
              fontSize="61"
              fontWeight="700"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="-2px"
            >
              NOT FUTURE
            </text>

            <text
              x="90"
              y="985"
              fill={C.white}
              fontSize="61"
              fontWeight="700"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="-2px"
            >
              VISION.
            </text>

            <path
              d="M 90 1020 H 820"
              stroke={C.white}
              strokeWidth="2"
              fill="none"
            />

            <text
              x="90"
              y="1090"
              fill={C.white}
              fontSize="38"
              fontWeight="500"
              fontFamily="Arial, Helvetica, sans-serif"
            >
              FAST PREDICTION.
            </text>
          </g>

          {/* Single red verdict stamp — the only red element */}
          <g
            transform={`
              translate(540 1200)
              rotate(-7)
              scale(${stampProgress})
              translate(-540 -1200)
            `}
          >
            <rect
              x="190"
              y="1135"
              width="700"
              height="112"
              fill="none"
              stroke={C.red}
              strokeWidth="6"
            />
            <text
              x="540"
              y="1207"
              textAnchor="middle"
              fill={C.red}
              fontFamily="Arial, Helvetica, sans-serif"
              fontWeight="800"
              fontSize="43"
              letterSpacing="5px"
            >
              YOUR BRAIN PREDICTS
            </text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================
// CAPTION TIMELINE
// Times are approximate; verify against the selected voice.
// ============================================================

const CAPTIONS = [
  {
    start: 0,
    end: 180,
    note: "01",
    text: "Tumhara dimaag... future dekh sakta hai!",
  },
  {
    start: 180,
    end: 360,
    note: "02",
    text: "Lekin sirf kuch seconds pehle!",
  },
  {
    start: 360,
    end: 620,
    note: "03",
    text: "Jab koi ball achanak tumhari taraf aati hai,",
  },
  {
    start: 620,
    end: 820,
    note: "04",
    text: "toh tumhara dimaag sirf use dekhta nahi hai...",
  },
  {
    start: 820,
    end: 1050,
    note: "05",
    text: "Woh pehle hi andaaza lagane lagta hai",
  },
  {
    start: 1050,
    end: 1200,
    note: "06",
    text: "ki agle pal kya hone wala hai!",
  },
  {
    start: 1200,
    end: 1440,
    note: "07",
    text: "Tumhara Brain prediction karta rehta hai.",
  },
  {
    start: 1440,
    end: 1630,
    note: "08",
    text: "Lekin woh sach mein future nahi dekh sakta...",
  },
  {
    start: 1630,
    end: 1850,
    note: "09",
    text: "Tumhe lagta hai... tumne future dekh liya!",
  },
];

const CaptionTrack: React.FC = () => {
  const frame = useCurrentFrame();

  const cue = CAPTIONS.find(
    (item) => frame >= item.start && frame < item.end,
  );

  if (!cue) return null;

  const entrance = progress(frame, cue.start, cue.start + 16);
  const exit = 1 - progress(frame, cue.end - 9, cue.end);

  const opacity = Math.min(entrance, exit);
  const reveal = progress(frame, cue.start + 3, cue.start + 23);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 1390,
          width: 944,
          minHeight: 192,
          padding: "24px 26px 25px 34px",
          boxSizing: "border-box",
          border: "2px solid rgba(243,247,255,0.82)",
          backgroundColor: "rgba(16,39,80,0.90)",
          opacity,
          transform: `translateY(${(1 - entrance) * 18}px)`,
          clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 7,
            backgroundColor: C.white,
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 18,
            letterSpacing: 3,
            color: C.whiteSoft,
            marginBottom: 18,
          }}
        >
          <span>NOTE / {cue.note}</span>
          <span>FIELD OBSERVATION</span>
        </div>

        <div
          style={{
            color: C.white,
            fontSize: 36,
            lineHeight: 1.32,
            fontWeight: 600,
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: -0.6,
          }}
        >
          {cue.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// SMALL TECHNICAL MARKERS
// ============================================================

const LiveMarkers: React.FC = () => {
  const frame = useCurrentFrame();

  const beats = [0, 180, 360, 720, 1140, 1500];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {beats.map((beat, i) => {
          const p = progress(frame, beat, beat + 12);
          if (p === 0) return null;

          return (
            <g key={i} opacity={1 - p}>
              <circle
                cx="540"
                cy="1050"
                r={40 + p * 130}
                stroke={C.white}
                strokeWidth="2"
                fill="none"
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================
// MAIN FILM
// ============================================================

const BrainPredictionFilm: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.blue }}>
      <BlueprintBackground />

      {/* Main blueprint drawing area */}
      <Sequence from={0} durationInFrames={360}>
        <SceneOne />
      </Sequence>

      <Sequence from={360} durationInFrames={360}>
        <SceneTwo />
      </Sequence>

      <Sequence from={720} durationInFrames={420}>
        <SceneThree />
      </Sequence>

      <Sequence from={1140} durationInFrames={360}>
        <SceneFour />
      </Sequence>

      <Sequence from={1500} durationInFrames={350}>
        <SceneFive />
      </Sequence>

      <PageFrame />
      <CaptionTrack />
      <LiveMarkers />

      {/* Original narration */}
      <Audio
        src={staticFile(AUDIO_FILE)}
        volume={1}
      />
    </AbsoluteFill>
  );
};

// ============================================================
// REMOTION ROOT
// ============================================================

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={BrainPredictionFilm}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};

export default RemotionRoot;
