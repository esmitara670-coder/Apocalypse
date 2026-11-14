import React, { useMemo, useEffect } from "react";
import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  registerRoot,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import gsap from "gsap";

// ============================================================================
// THEME & CONSTANTS (Futuristic Blueprint 9:16)
// ============================================================================
const COLORS = {
  bgDeep: "#040814",
  bgNavy: "#071024",
  cyan: "#00f0ff",
  cyanDim: "#006680",
  emerald: "#00ff88",
  crimson: "#ff3366",
  amber: "#ffb800",
  white: "#f0f7ff",
  slate: "#64748b",
};

const BlueprintScanlineShader = {
  name: "BlueprintScanlineShader",
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.12 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      float scanline = sin(vUv.y * 960.0) * 0.04 * uIntensity;
      vec2 dist = vUv - 0.5;
      float vignette = 1.0 - dot(dist, dist) * 0.55;
      gl_FragColor = vec4((texel.rgb + scanline) * vignette, texel.a);
    }
  `,
};

// ============================================================================
// DETERMINISTIC POST-PROCESSING RIG (EffectComposer + UnrealBloom + ShaderPass)
// ============================================================================
const PostProcessingRig: React.FC<{
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
}> = ({ bloomStrength = 1.15, bloomRadius = 0.45, bloomThreshold = 0.25 }) => {
  const { gl, size } = useThree();
  const { fps } = useVideoConfig();

  const composer = useMemo(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    const comp = new EffectComposer(gl);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    );
    const scanlinePass = new ShaderPass(BlueprintScanlineShader);
    comp.addPass(bloomPass);
    comp.addPass(scanlinePass);
    return { comp, bloomPass, scanlinePass };
  }, [gl, size.width, size.height, bloomStrength, bloomRadius, bloomThreshold]);

  useEffect(() => {
    composer.comp.setSize(size.width, size.height);
    return () => {
      composer.bloomPass.dispose();
      composer.scanlinePass.dispose();
      composer.comp.dispose();
    };
  }, [composer, size.width, size.height]);

  // Keep delta deterministic via Remotion FPS
  const deterministicDelta = 1 / fps;
  void deterministicDelta;

  return null;
};

// ============================================================================
// SHARED UI: BLUEPRINT HUD OVERLAY & KINETIC DIALOGUE SUBTITLES
// ============================================================================
const BlueprintHUD: React.FC<{
  sceneCode: string;
  sceneTitle: string;
  sfxLabel: string;
  telemetry: string;
}> = ({ sceneCode, sceneTitle, sfxLabel, telemetry }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const timeSec = (frame / fps).toFixed(2);
  const progressPct = ((frame / durationInFrames) * 100).toFixed(0);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Blueprint SVG Grid */}
      <svg
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0, opacity: 0.14 }}
      >
        <defs>
          <pattern
            id="blueprint-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke={COLORS.cyan}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#blueprint-grid)" />
      </svg>

      {/* Top Technical Telemetry Header */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 56,
          right: 56,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid rgba(0, 240, 255, 0.3)`,
          paddingBottom: 18,
          fontFamily: "monospace",
          color: COLORS.cyan,
        }}
      >
        <div>
          <div style={{ fontSize: 20, letterSpacing: 4, opacity: 0.8 }}>
            {sceneCode} // {sceneTitle}
          </div>
          <div style={{ fontSize: 16, color: COLORS.white, opacity: 0.65, marginTop: 4 }}>
            {telemetry}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            T+{timeSec}s [{progressPct}%]
          </div>
          <div style={{ fontSize: 15, color: COLORS.emerald, letterSpacing: 2 }}>
            SFX: {sfxLabel}
          </div>
        </div>
      </div>

      {/* Corner Framing Brackets */}
      {[
        { top: 44, left: 36, borderTop: "3px solid #00f0ff", borderLeft: "3px solid #00f0ff" },
        { top: 44, right: 36, borderTop: "3px solid #00f0ff", borderRight: "3px solid #00f0ff" },
        { bottom: 44, left: 36, borderBottom: "3px solid #00f0ff", borderLeft: "3px solid #00f0ff" },
        { bottom: 44, right: 36, borderBottom: "3px solid #00f0ff", borderRight: "3px solid #00f0ff" },
      ].map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            width: 36,
            height: 36,
            ...pos,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const KineticSubtitle: React.FC<{
  text: string;
  localFrame: number;
  duration: number;
}> = ({ text, localFrame, duration }) => {
  const words = useMemo(() => text.split(" "), [text]);
  const activeWordIndex = Math.floor(
    gsap.utils.mapRange(10, duration - 25, 0, words.length, localFrame)
  );
  const containerOpacity = interpolate(
    localFrame,
    [0, 12, duration - 12, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 110,
        left: 64,
        right: 64,
        opacity: containerOpacity,
        background: "linear-gradient(180deg, rgba(4,8,20,0.78) 0%, rgba(7,16,36,0.94) 100%)",
        border: "1px solid rgba(0, 240, 255, 0.45)",
        borderRadius: 20,
        padding: "28px 34px",
        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.75), 0 0 28px rgba(0, 240, 255, 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px 12px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.35,
          textAlign: "center",
        }}
      >
        {words.map((word, idx) => {
          const isCurrent = idx === activeWordIndex;
          const isPast = idx < activeWordIndex;
          return (
            <span
              key={idx}
              style={{
                color: isCurrent
                  ? COLORS.cyan
                  : isPast
                  ? COLORS.white
                  : "rgba(240, 247, 255, 0.42)",
                textShadow: isCurrent ? "0 0 18px rgba(0, 240, 255, 0.9)" : "none",
                transform: isCurrent ? "scale(1.06)" : "scale(1)",
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

// ============================================================================
// SCENE 1 — THE MYSTERY (0–6s | 180 Frames)
// ============================================================================
const Scene1Mystery3D: React.FC<{ localFrame: number; fps: number }> = ({
  localFrame,
  fps,
}) => {
  const { camera } = useThree();

  // Tap occurs at frame 36
  const tapFrame = 36;
  const postTap = Math.max(0, localFrame - tapFrame);

  // Camera rapid zoom-in toward smartphone after PAY tap
  const zoomProgress = spring({
    frame: postTap,
    fps,
    config: { damping: 16, stiffness: 90, mass: 0.9 },
  });

  const camZ = gsap.utils.interpolate(8.2, 3.15, zoomProgress);
  const camY = gsap.utils.interpolate(0.4, 0.1, zoomProgress);
  const phoneRotY = gsap.utils.interpolate(-0.28, 0, zoomProgress);
  const phoneRotX = gsap.utils.interpolate(0.18, 0.02, zoomProgress);

  camera.position.set(0, camY, camZ);
  camera.lookAt(0, 0, 0);

  // 320 Cyan Data Particles exploding radially from phone screen
  const particleSeeds = useMemo(() => {
    const count = 320;
    const dirs: Array<{ vx: number; vy: number; vz: number; speed: number }> = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const speed = 0.045 + ((i * 19) % 100) / 1400;
      dirs.push({
        vx: Math.sin(phi) * Math.cos(theta),
        vy: Math.sin(phi) * Math.sin(theta),
        vz: Math.abs(Math.cos(phi)) * 1.35 + 0.2,
        speed,
      });
    }
    return dirs;
  }, []);

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(particleSeeds.length * 3);
    const burstTime = Math.max(0, localFrame - tapFrame);
    for (let i = 0; i < particleSeeds.length; i++) {
      const s = particleSeeds[i];
      const dist = burstTime * s.speed;
      arr[i * 3] = s.vx * dist;
      arr[i * 3 + 1] = s.vy * dist - 0.15;
      arr[i * 3 + 2] = s.vz * dist + 0.12;
    }
    return arr;
  }, [localFrame, particleSeeds]);

  const shockwaveScale = gsap.utils.mapRange(0, 90, 0.2, 5.5, postTap);
  const shockwaveOpacity = interpolate(postTap, [0, 10, 85], [0, 0.9, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <group>
      <PostProcessingRig bloomStrength={1.25} />
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 6, 5]} intensity={2.8} color={COLORS.cyan} />
      <pointLight position={[-4, -4, 3]} intensity={1.4} color="#3b82f6" />

      {/* 3D Smartphone Assembly */}
      <group rotation={[phoneRotX, phoneRotY, 0]}>
        {/* Phone Body */}
        <mesh>
          <boxGeometry args={[2.2, 4.3, 0.18]} />
          <meshStandardMaterial
            color="#0b1528"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        {/* Glowing Cyan Wireframe Chassis */}
        <mesh>
          <boxGeometry args={[2.24, 4.34, 0.19]} />
          <meshBasicMaterial color={COLORS.cyan} wireframe transparent opacity={0.35} />
        </mesh>

        {/* Illuminated Display Glass */}
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[2.0, 4.0]} />
          <meshBasicMaterial color="#061229" />
        </mesh>

        {/* Interactive PAY Button on Phone Screen */}
        <mesh
          position={[
            0,
            -1.1,
            localFrame >= tapFrame && localFrame <= tapFrame + 8 ? 0.11 : 0.15,
          ]}
        >
          <boxGeometry args={[1.45, 0.48, 0.06]} />
          <meshBasicMaterial
            color={localFrame >= tapFrame ? COLORS.emerald : COLORS.cyan}
          />
        </mesh>

        {/* Payment Processing Rotating Hologram Rings (Post-Tap) */}
        {postTap > 0 && (
          <group position={[0, 0.35, 0.22]}>
            <mesh rotation={[0, 0, postTap * 0.09]}>
              <ringGeometry args={[0.42, 0.5, 6]} />
              <meshBasicMaterial
                color={COLORS.cyan}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh rotation={[0, 0, -postTap * 0.14]}>
              <ringGeometry args={[0.6, 0.65, 32]} />
              <meshBasicMaterial
                color={COLORS.emerald}
                side={THREE.DoubleSide}
                transparent
                opacity={0.8}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* Expanding Cyan Shockwave on Tap */}
      {postTap > 0 && (
        <mesh
          position={[0, -0.5, 0.25]}
          scale={[shockwaveScale, shockwaveScale, 1]}
        >
          <ringGeometry args={[0.45, 0.52, 64]} />
          <meshBasicMaterial
            color={COLORS.cyan}
            transparent
            opacity={shockwaveOpacity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Radial Cyan Data Particles */}
      {postTap > 0 && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color={COLORS.cyan}
            size={0.09}
            transparent
            opacity={interpolate(postTap, [0, 15, 130], [0, 1, 0.25], {
              extrapolateRight: "clamp",
            })}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  );
};

const Scene1Mystery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isTapped = frame >= 36;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <ThreeCanvas width={1080} height={1920}>
        <Sequence from={0} durationInFrames={180} layout="none">
          <Scene1Mystery3D localFrame={frame} fps={fps} />
        </Sequence>
      </ThreeCanvas>

      {/* Holographic Phone Screen Callout HUD */}
      <div
        style={{
          position: "absolute",
          top: 240,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            padding: "14px 32px",
            borderRadius: 999,
            border: `2px solid ${isTapped ? COLORS.emerald : COLORS.cyan}`,
            backgroundColor: "rgba(4, 12, 28, 0.85)",
            color: isTapped ? COLORS.emerald : COLORS.cyan,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 3,
            boxShadow: `0 0 30px ${isTapped ? "rgba(0,255,136,0.4)" : "rgba(0,240,255,0.3)"}`,
          }}
        >
          {isTapped
            ? "● PROCESSING UPI TXN: ₹2,500.00"
            : "TAP [ PAY ₹2,500 ] TO INITIATE"}
        </div>
      </div>

      <BlueprintHUD
        sceneCode="SCN_01"
        sceneTitle="THE MYSTERY"
        sfxLabel="TAP + CINEMATIC WHOOSH"
        telemetry="PARTICLE_EMITTER: ACTIVE // ZOOM_VECTOR: LOCKED"
      />

      <KineticSubtitle
        text="Tumne phone se sirf 2 second mein payment kar di... Lekin tumhare paise actually gaye kahan?"
        localFrame={frame}
        duration={180}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 2 — PAYMENT REQUEST (6–14s | 240 Frames)
// ============================================================================
const Scene2Request3D: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { camera } = useThree();

  // Packet travels from Smartphone (x = -6) to Sender Bank (x = 6)
  const travelProgress = gsap.utils.clamp(0, 1, localFrame / 210);
  const easedProgress = gsap.parseEase("power2.inOut")(travelProgress);
  const packetX = gsap.utils.interpolate(-6.0, 5.4, easedProgress);

  // Camera smoothly follows the glowing data packet
  camera.position.set(packetX - 0.6, 1.45, 5.2);
  camera.lookAt(packetX + 0.8, 0, 0);

  // Verification scanner activates as packet nears Bank (frame 135+)
  const scannerActive = localFrame >= 135;
  const scannerY = Math.sin((localFrame - 135) * 0.18) * 1.4;

  return (
    <group>
      <PostProcessingRig bloomStrength={1.3} />
      <ambientLight intensity={0.5} />
      <pointLight
        position={[packetX, 1.2, 2]}
        intensity={3.5}
        color={COLORS.cyan}
      />

      {/* Origin Smartphone Node (Left) */}
      <group position={[-6.2, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 2.2, 0.15]} />
          <meshBasicMaterial color={COLORS.cyan} wireframe />
        </mesh>
      </group>

      {/* Blueprint Highway Network Lines */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((zOffset, idx) => (
        <mesh
          key={idx}
          position={[0, -0.9, zOffset]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.015, 0.015, 16, 8]} />
          <meshBasicMaterial
            color={idx === 2 ? COLORS.cyan : COLORS.cyanDim}
            transparent
            opacity={idx === 2 ? 0.9 : 0.45}
          />
        </mesh>
      ))}

      {/* Glowing Digital Data Packet */}
      <group
        position={[packetX, Math.sin(localFrame * 0.15) * 0.15, 0]}
        rotation={[localFrame * 0.06, localFrame * 0.08, 0]}
      >
        <mesh>
          <octahedronGeometry args={[0.52, 0]} />
          <meshStandardMaterial
            color={COLORS.white}
            emissive={COLORS.cyan}
            emissiveIntensity={1.6}
          />
        </mesh>
        <mesh scale={[1.35, 1.35, 1.35]}>
          <octahedronGeometry args={[0.52, 1]} />
          <meshBasicMaterial
            color={COLORS.cyan}
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>

      {/* Destination Sender Bank Monolith (Right) */}
      <group position={[6.0, 0.2, 0]}>
        <mesh>
          <boxGeometry args={[2.2, 3.2, 2.2]} />
          <meshStandardMaterial
            color="#09152b"
            emissive={COLORS.cyanDim}
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[2.26, 3.26, 2.26]} />
          <meshBasicMaterial color={COLORS.cyan} wireframe />
        </mesh>

        {/* Active Verification Laser Scanner Plane */}
        {scannerActive && (
          <mesh position={[-1.2, scannerY, 0]}>
            <boxGeometry args={[0.08, 0.12, 2.8]} />
            <meshBasicMaterial
              color={COLORS.emerald}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

const Scene2PaymentRequest: React.FC = () => {
  const frame = useCurrentFrame();
  const isScanning = frame >= 135;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <ThreeCanvas width={1080} height={1920}>
        <Sequence from={0} durationInFrames={240} layout="none">
          <Scene2Request3D localFrame={frame} />
        </Sequence>
      </ThreeCanvas>

      {/* Packet Telemetry Callout */}
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            padding: "16px 26px",
            background: "rgba(7, 16, 36, 0.88)",
            border: `1px solid ${COLORS.cyan}`,
            borderRadius: 12,
            color: COLORS.cyan,
            fontSize: 24,
          }}
        >
          PACKET_PAYLOAD: ENCRYPTED_UPI_REQ
        </div>
        <div
          style={{
            padding: "16px 26px",
            background: "rgba(7, 16, 36, 0.88)",
            border: `1px solid ${isScanning ? COLORS.emerald : COLORS.amber}`,
            borderRadius: 12,
            color: isScanning ? COLORS.emerald : COLORS.amber,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {isScanning ? "SCANNER: BANK VERIFYING..." : "ROUTING TO SENDER BANK"}
        </div>
      </div>

      <BlueprintHUD
        sceneCode="SCN_02"
        sceneTitle="PAYMENT REQUEST"
        sfxLabel="DIGITAL DATA TRANSMISSION"
        telemetry="CAMERA_MODE: PACKET_TRACKING // PROTOCOL: HTTPS_TLS_1.3"
      />

      <KineticSubtitle
        text="Jab tum UPI se Pay karte ho, toh tumhara paisa seedha phone se transfer nahi hota! Sabse pehle, payment request tumhare bank tak pahunchti hai."
        localFrame={frame}
        duration={240}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 3 — UPI NETWORK & NPCI HUB (14–22s | 240 Frames)
// ============================================================================
const BANK_NODES = [
  { name: "SENDER BANK", angle: Math.PI },
  { name: "BANK NODE A", angle: (2 * Math.PI) / 3 },
  { name: "BANK NODE B", angle: Math.PI / 3 },
  { name: "RECEIVER BANK", angle: 0 },
  { name: "BANK NODE C", angle: -Math.PI / 3 },
  { name: "BANK NODE D", angle: (-2 * Math.PI) / 3 },
];

const Scene3Network3D: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { camera } = useThree();
  const radius = 3.3;

  // Orbiting blueprint overview camera
  const camAngle = gsap.utils.interpolate(-0.25, 0.25, localFrame / 240);
  camera.position.set(Math.sin(camAngle) * 2.2, 0.6, 8.8);
  camera.lookAt(0, 0.2, 0);

  // Packet hops: Sender Bank (idx 0) -> Central NPCI Hub -> Sender Bank Balance Check -> Receiver Bank (idx 3)
  const hopProgress = gsap.utils.clamp(0, 1, localFrame / 200);
  let packetPos: [number, number, number] = [0, 0.3, 0];
  if (hopProgress < 0.35) {
    const t = gsap.utils.mapRange(0, 0.35, 0, 1, hopProgress);
    packetPos = [gsap.utils.interpolate(-radius, 0, t), 0.3, 0.3];
  } else if (hopProgress < 0.7) {
    const t = gsap.utils.mapRange(0.35, 0.7, 0, Math.PI * 2, hopProgress);
    packetPos = [Math.cos(t) * 0.9, 0.3 + Math.sin(t) * 0.9, 0.4];
  } else {
    const t = gsap.utils.mapRange(0.7, 1, 0, 1, hopProgress);
    packetPos = [gsap.utils.interpolate(0, radius, t), 0.3, 0.3];
  }

  return (
    <group position={[0, 0.3, 0]}>
      <PostProcessingRig bloomStrength={1.35} />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 3]} intensity={3.5} color={COLORS.cyan} />

      {/* Central Glowing NPCI / UPI Switch Node */}
      <group rotation={[localFrame * 0.015, localFrame * 0.025, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.05, 1]} />
          <meshStandardMaterial
            color="#07223d"
            emissive={COLORS.cyan}
            emissiveIntensity={0.95}
            wireframe
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.68, 24, 24]} />
          <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.35} />
        </mesh>
      </group>

      {/* Central Verification Pulse Rings */}
      <mesh rotation={[0, 0, localFrame * 0.02]}>
        <ringGeometry args={[1.35, 1.44, 64]} />
        <meshBasicMaterial
          color={COLORS.emerald}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Surrounding Bank Nodes & Radial Conduit Spokes */}
      {BANK_NODES.map((node, i) => {
        const nx = Math.cos(node.angle) * radius;
        const ny = Math.sin(node.angle) * radius;
        const isHighlighted = i === 0 || i === 3;
        return (
          <group key={node.name}>
            {/* Spoke Line */}
            <mesh
              position={[nx / 2, ny / 2, -0.1]}
              rotation={[0, 0, node.angle - Math.PI / 2]}
            >
              <cylinderGeometry args={[0.025, 0.025, radius, 8]} />
              <meshBasicMaterial
                color={isHighlighted ? COLORS.cyan : COLORS.cyanDim}
              />
            </mesh>
            {/* Bank Cube Node */}
            <mesh
              position={[nx, ny, 0]}
              rotation={[localFrame * 0.01, localFrame * 0.02, 0]}
            >
              <boxGeometry args={[0.72, 0.72, 0.72]} />
              <meshStandardMaterial
                color="#0c1930"
                emissive={isHighlighted ? COLORS.emerald : COLORS.cyan}
                emissiveIntensity={isHighlighted ? 0.9 : 0.35}
              />
            </mesh>
          </group>
        );
      })}

      {/* Rapidly Traveling Verification Packet */}
      <mesh position={packetPos}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshBasicMaterial color={COLORS.white} />
      </mesh>
    </group>
  );
};

const Scene3UpiNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const balanceChecked = frame >= 110;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <ThreeCanvas width={1080} height={1920}>
        <Sequence from={0} durationInFrames={240} layout="none">
          <Scene3Network3D localFrame={frame} />
        </Sequence>
      </ThreeCanvas>

      {/* Prominent NPCI Highlight Banner */}
      <div
        style={{
          position: "absolute",
          top: 215,
          left: 64,
          right: 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            padding: "18px 42px",
            background: "rgba(0, 240, 255, 0.12)",
            border: `2px solid ${COLORS.cyan}`,
            borderRadius: 16,
            boxShadow: "0 0 40px rgba(0, 240, 255, 0.35)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: COLORS.cyan,
              letterSpacing: 5,
            }}
          >
            NPCI // UPI CENTRAL SWITCH
          </div>
          <div style={{ fontSize: 20, color: COLORS.white, marginTop: 4 }}>
            NATIONAL PAYMENTS CORPORATION OF INDIA
          </div>
        </div>

        <div
          style={{
            padding: "12px 28px",
            borderRadius: 999,
            background: "rgba(4, 12, 26, 0.9)",
            border: `1px solid ${balanceChecked ? COLORS.emerald : COLORS.amber}`,
            color: balanceChecked ? COLORS.emerald : COLORS.amber,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {balanceChecked
            ? "✓ SENDER BANK BALANCE VERIFIED: SUFFICIENT FUNDS"
            : "⟳ CHECKING SENDER ACCOUNT LIQUIDITY..."}
        </div>
      </div>

      <BlueprintHUD
        sceneCode="SCN_03"
        sceneTitle="UPI NETWORK & NPCI"
        sfxLabel="ELECTRONIC PULSES + NETWORK ACTIVATION"
        telemetry="SWITCH_CORE: NPCI_UPI_2.0 // LATENCY: 18ms"
      />

      <KineticSubtitle
        text="Phir UPI system, NPCI ke network ke through transaction ko process karta hai. Tumhara bank check karta hai ki account mein sufficient balance hai ya nahi."
        localFrame={frame}
        duration={240}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 4 — MONEY TRANSFER SPLIT-SCREEN (22–32s | 300 Frames)
// ============================================================================
const Scene4Transfer3D: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { camera } = useThree();
  camera.position.set(0, 0, 7.5);
  camera.lookAt(0, 0, 0);

  // Glowing bridge signal travels from Left (-2.4) to Right (+2.4) between frames 90 and 190
  const beamProgress = gsap.utils.clamp(0, 1, (localFrame - 90) / 95);
  const signalX = gsap.utils.interpolate(-2.4, 2.4, beamProgress);

  return (
    <group>
      <PostProcessingRig bloomStrength={1.2} />
      <ambientLight intensity={0.6} />
      <pointLight position={[signalX, 0.2, 2]} intensity={3} color={COLORS.cyan} />

      {/* Center Conduit Bridge Line */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 5.2, 12]} />
        <meshBasicMaterial color={COLORS.cyanDim} />
      </mesh>

      {/* Traveling Settlement Pulse */}
      {localFrame >= 85 && localFrame <= 205 && (
        <mesh position={[signalX, 0.15, 0.1]}>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshBasicMaterial color={COLORS.cyan} />
        </mesh>
      )}
    </group>
  );
};

const Scene4MoneyTransfer: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase 1 (25–115): Sender Balance drops from ₹12,500 to ₹10,000
  const debitProgress = gsap.utils.clamp(0, 1, (frame - 25) / 85);
  const senderBalance = Math.round(
    gsap.utils.interpolate(12500, 10000, debitProgress)
  );
  const isDebited = frame >= 75;

  // Phase 2 (165–250): Receiver Balance rises from ₹4,200 to ₹6,700
  const creditProgress = gsap.utils.clamp(0, 1, (frame - 165) / 85);
  const receiverBalance = Math.round(
    gsap.utils.interpolate(4200, 6700, creditProgress)
  );
  const isCredited = frame >= 205;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <ThreeCanvas width={1080} height={1920}>
        <Sequence from={0} durationInFrames={300} layout="none">
          <Scene4Transfer3D localFrame={frame} />
        </Sequence>
      </ThreeCanvas>

      {/* Split-Screen Dual Bank Modules */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 44,
          right: 44,
          height: 920,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          fontFamily: "monospace",
        }}
      >
        {/* LEFT PANEL: SENDER BANK */}
        <div
          style={{
            background: "rgba(12, 20, 38, 0.88)",
            border: `2px solid ${isDebited ? COLORS.crimson : COLORS.cyanDim}`,
            borderRadius: 24,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: isDebited ? "0 0 40px rgba(255, 51, 102, 0.25)" : "none",
          }}
        >
          <div>
            <div style={{ fontSize: 20, color: COLORS.slate, letterSpacing: 3 }}>
              NODE_01 // ORIGIN
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: COLORS.white,
                marginTop: 8,
              }}
            >
              SENDER BANK
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "40px 0" }}>
            <div style={{ fontSize: 20, color: COLORS.slate }}>
              AVAILABLE BALANCE
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: isDebited ? COLORS.crimson : COLORS.white,
                marginTop: 12,
              }}
            >
              ₹{senderBalance.toLocaleString("en-IN")}
            </div>
            {isDebited && (
              <div
                style={{
                  fontSize: 28,
                  color: COLORS.crimson,
                  marginTop: 10,
                  fontWeight: 700,
                }}
              >
                - ₹2,500
              </div>
            )}
          </div>

          <div
            style={{
              padding: "16px 0",
              textAlign: "center",
              borderRadius: 12,
              background: isDebited
                ? "rgba(255, 51, 102, 0.18)"
                : "rgba(0, 240, 255, 0.08)",
              border: `2px solid ${isDebited ? COLORS.crimson : COLORS.cyanDim}`,
              color: isDebited ? COLORS.crimson : COLORS.slate,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 4,
            }}
          >
            {isDebited ? "DEBITED" : "STANDBY"}
          </div>
        </div>

        {/* RIGHT PANEL: RECEIVER BANK */}
        <div
          style={{
            background: "rgba(12, 20, 38, 0.88)",
            border: `2px solid ${isCredited ? COLORS.emerald : COLORS.cyanDim}`,
            borderRadius: 24,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: isCredited ? "0 0 40px rgba(0, 255, 136, 0.25)" : "none",
          }}
        >
          <div>
            <div style={{ fontSize: 20, color: COLORS.slate, letterSpacing: 3 }}>
              NODE_02 // DESTINATION
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: COLORS.white,
                marginTop: 8,
              }}
            >
              RECEIVER BANK
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "40px 0" }}>
            <div style={{ fontSize: 20, color: COLORS.slate }}>
              AVAILABLE BALANCE
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: isCredited ? COLORS.emerald : COLORS.white,
                marginTop: 12,
              }}
            >
              ₹{receiverBalance.toLocaleString("en-IN")}
            </div>
            {isCredited && (
              <div
                style={{
                  fontSize: 28,
                  color: COLORS.emerald,
                  marginTop: 10,
                  fontWeight: 700,
                }}
              >
                + ₹2,500
              </div>
            )}
          </div>

          <div
            style={{
              padding: "16px 0",
              textAlign: "center",
              borderRadius: 12,
              background: isCredited
                ? "rgba(0, 255, 136, 0.18)"
                : "rgba(0, 240, 255, 0.08)",
              border: `2px solid ${isCredited ? COLORS.emerald : COLORS.cyanDim}`,
              color: isCredited ? COLORS.emerald : COLORS.slate,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 4,
            }}
          >
            {isCredited ? "CREDITED" : "AWAITING"}
          </div>
        </div>
      </div>

      <BlueprintHUD
        sceneCode="SCN_04"
        sceneTitle="SYNCHRONIZED LEDGER TRANSFER"
        sfxLabel="DEBIT / CREDIT CONFIRMATION BEEPS"
        telemetry="SETTLEMENT: ATOMIC_SWAP // LEDGER_SYNC: VERIFIED"
      />

      <KineticSubtitle
        text="Agar sab kuch sahi hai, toh tumhare bank se paise debit hote hain... aur receiver ke bank mein credit ho jaate hain. Aur ye sab kuch seconds mein ho sakta hai!"
        localFrame={frame}
        duration={300}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 5 — FINAL REVEAL (32–40s | 240 Frames)
// ============================================================================
const Scene5Reveal3D: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { camera } = useThree();

  // Smooth zoom-out from Smartphone to full Digital Payment Network
  const zoomOutProgress = gsap.utils.clamp(0, 1, (localFrame - 20) / 130);
  const easedZoom = gsap.parseEase("power2.inOut")(zoomOutProgress);
  const camZ = gsap.utils.interpolate(3.4, 10.5, easedZoom);
  const camY = gsap.utils.interpolate(0, 0.6, easedZoom);

  camera.position.set(0, camY, camZ);
  camera.lookAt(0, 0.2, 0);

  return (
    <group>
      <PostProcessingRig bloomStrength={1.35} />
      <ambientLight intensity={0.65} />
      <pointLight position={[0, 2, 4]} intensity={3.2} color={COLORS.emerald} />

      {/* Bottom Node: Smartphone */}
      <group position={[0, -2.2, 0]}>
        <mesh>
          <boxGeometry args={[1.4, 2.5, 0.15]} />
          <meshStandardMaterial
            color="#071a2e"
            emissive={COLORS.emerald}
            emissiveIntensity={0.7}
          />
        </mesh>
      </group>

      {/* Center Node: UPI / NPCI Hub */}
      <group
        position={[0, 0.6, 0]}
        rotation={[localFrame * 0.015, localFrame * 0.02, 0]}
      >
        <mesh>
          <icosahedronGeometry args={[0.85, 1]} />
          <meshBasicMaterial color={COLORS.cyan} wireframe />
        </mesh>
      </group>

      {/* Left & Right Nodes: Sender & Receiver Banks */}
      <mesh position={[-3.0, 2.2, 0]}>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshBasicMaterial color={COLORS.cyan} wireframe />
      </mesh>
      <mesh position={[3.0, 2.2, 0]}>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshBasicMaterial color={COLORS.emerald} wireframe />
      </mesh>

      {/* Glowing Network Connections */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.8, 8]} />
        <meshBasicMaterial color={COLORS.emerald} />
      </mesh>
      <mesh position={[-1.5, 1.4, 0]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.03, 0.03, 3.4, 8]} />
        <meshBasicMaterial color={COLORS.cyan} />
      </mesh>
      <mesh position={[1.5, 1.4, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.03, 0.03, 3.4, 8]} />
        <meshBasicMaterial color={COLORS.emerald} />
      </mesh>
    </group>
  );
};

const Scene5FinalReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineScale = spring({
    frame: Math.max(0, frame - 95),
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <ThreeCanvas width={1080} height={1920}>
        <Sequence from={0} durationInFrames={240} layout="none">
          <Scene5Reveal3D localFrame={frame} />
        </Sequence>
      </ThreeCanvas>

      {/* Smartphone Payment Successful Badge */}
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 64,
          right: 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 40px",
            borderRadius: 999,
            background: "rgba(0, 255, 136, 0.14)",
            border: `2px solid ${COLORS.emerald}`,
            boxShadow: "0 0 40px rgba(0, 255, 136, 0.45)",
          }}
        >
          <span style={{ fontSize: 42, color: COLORS.emerald }}>✓</span>
          <span
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: COLORS.emerald,
              letterSpacing: 3,
            }}
          >
            PAYMENT SUCCESSFUL
          </span>
        </div>
      </div>

      {/* Final Kinetic Blueprint Headline */}
      {frame >= 95 && (
        <div
          style={{
            position: "absolute",
            top: "44%",
            left: 56,
            right: 56,
            transform: `scale(${headlineScale})`,
            background: "rgba(4, 10, 24, 0.92)",
            border: `3px solid ${COLORS.cyan}`,
            borderRadius: 24,
            padding: "40px 36px",
            textAlign: "center",
            boxShadow: "0 0 65px rgba(0, 240, 255, 0.45)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: COLORS.white,
              letterSpacing: 2,
              lineHeight: 1.18,
              textShadow: "0 0 24px rgba(0, 240, 255, 0.8)",
            }}
          >
            YOUR PHONE DOESN&apos;T SEND MONEY!
          </div>
          <div
            style={{
              fontSize: 24,
              fontFamily: "monospace",
              color: COLORS.cyan,
              marginTop: 16,
              letterSpacing: 4,
            }}
          >
            IT INITIATES AN INSTANT DIGITAL LEDGER INSTRUCTION
          </div>
        </div>
      )}

      <BlueprintHUD
        sceneCode="SCN_05"
        sceneTitle="FULL ARCHITECTURE REVEAL"
        sfxLabel="DEEP CINEMATIC IMPACT + SUCCESS CHIME"
        telemetry="NETWORK_TOPOLOGY: COMPLETE // TXN_STATUS: SETTLED"
      />

      <KineticSubtitle
        text="Matlab, tumhara phone paisa nahi bhejta... woh sirf ek digital transaction ki shuruaat karta hai!"
        localFrame={frame}
        duration={240}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// MASTER TIMELINE COMPOSITION (40s = 1200 Frames @ 30fps, 1080x1920)
// ============================================================================
export const OnlinePaymentDocumentary: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      {/* Scene 1: 0–6s (0–180 frames) */}
      <Sequence from={0} durationInFrames={180}>
        <Scene1Mystery />
      </Sequence>

      {/* Scene 2: 6–14s (180–420 frames) */}
      <Sequence from={180} durationInFrames={240}>
        <Scene2PaymentRequest />
      </Sequence>

      {/* Scene 3: 14–22s (420–660 frames) */}
      <Sequence from={420} durationInFrames={240}>
        <Scene3UpiNetwork />
      </Sequence>

      {/* Scene 4: 22–32s (660–960 frames) */}
      <Sequence from={660} durationInFrames={300}>
        <Scene4MoneyTransfer />
      </Sequence>

      {/* Scene 5: 32–40s (960–1200 frames) */}
      <Sequence from={960} durationInFrames={240}>
        <Scene5FinalReveal />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WhereDoesYourMoneyGo"
      component={OnlinePaymentDocumentary}
      durationInFrames={1200}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

registerRoot(RemotionRoot);
