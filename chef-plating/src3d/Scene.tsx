import React, { Suspense } from 'react';
import { DepthOfField, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Backdrop, Dish, Env, Glass, Setting, Table } from './Set';
import { Bottle, Hand, POSES, PipingBag, Pose, Spoon, Tweezers } from './Hands';
import { bottleTip, camera, pipingTip, plateY, plateVisible, spoonTip, tweezerCarry, tweezerGrip, tweezerTip, warmth } from './timeline';
import { lerp, prog } from './util';

// Orient a hand from two directions in the tool's frame: where the fingers point, and where the palm faces.
function basis(fingers: THREE.Vector3, palmFaces: THREE.Vector3) {
  const z = fingers.clone().normalize();
  const y = palmFaces.clone().negate();
  y.sub(z.clone().multiplyScalar(y.dot(z))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

type Grip = { q: THREE.Quaternion; pos: THREE.Vector3; pose: Pose; left?: boolean };
// a fist around a vertical body (piping bag / bottle) of radius r at height h; arm comes from behind and above
function fistGrip(h: number, r: number): Grip {
  const q = basis(new THREE.Vector3(0.25, -0.55, 1), new THREE.Vector3(1, 0, 0.15));
  const palmCenterLocal = new THREE.Vector3(0, -1.6, 4.4).applyQuaternion(q);
  const pole = new THREE.Vector3(0, h, 0);
  const palmFaces = new THREE.Vector3(1, 0, 0.15).normalize();
  const pos = pole.clone().sub(palmFaces.multiplyScalar(r + 0.4)).sub(palmCenterLocal);
  return { q, pos, pose: POSES.grip };
}
// pen grip on a thin tool: contact point between thumb and index tips
function penGrip(h: number): Grip {
  const q = basis(new THREE.Vector3(0.15, -0.75, 0.65), new THREE.Vector3(0.9, -0.2, -0.35));
  const pinchLocal = new THREE.Vector3(-1.9, -1.9, 10.4).applyQuaternion(q);
  const pos = new THREE.Vector3(0, h, 0).sub(pinchLocal);
  return { q, pos, pose: POSES.pinch };
}

const Held: React.FC<{ tip: THREE.Vector3; yaw: number; lean: number; grip: Grip; children: React.ReactNode }> = ({ tip, yaw, lean, grip, children }) => (
  <group position={tip} rotation={[lean, yaw, 0, 'YXZ']}>
    {children}
    <group position={grip.pos} quaternion={grip.q}>
      <Hand pose={grip.pose} left={grip.left} />
    </group>
  </group>
);

const CameraRig: React.FC<{ t: number }> = ({ t }) => {
  const { camera: cam, size } = useThree();
  const c = camera(t);
  const pc = cam as THREE.PerspectiveCamera;
  pc.fov = c.fov;
  pc.aspect = size.width / size.height;
  pc.near = 1;
  pc.far = 1500;
  pc.position.copy(c.pos);
  pc.up.copy(c.up ?? new THREE.Vector3(0, 1, 0));
  pc.lookAt(c.look);
  pc.updateProjectionMatrix();
  return null;
};

// plate carried in with both hands (shot 2): hands at the rim, then let go and leave
const PlateHands: React.FC<{ t: number }> = ({ t }) => {
  if (t < 3 || t > 6.2) return null;
  const y = plateY(t);
  const away = prog(t, 4.9, 6.0);
  return (
    <group position={[0, y, 0]}>
      {[1, -1].map((s) => {
        const q = basis(new THREE.Vector3(-s, -0.15, 0.15), new THREE.Vector3(0, 1, 0));
        const pos = new THREE.Vector3(s * 21.5 + s * away * 12, -0.6 + away * 8, -1 - away * 4);
        return (
          <group key={s} position={pos} quaternion={q}>
            <Hand pose={POSES.hold} left={s < 0} />
          </group>
        );
      })}
    </group>
  );
};

export const Scene: React.FC<{ t: number }> = ({ t }) => {
  const w = warmth(t);
  const cam = camera(t);
  const key = new THREE.Color().setHSL(0.09, 0.55, lerp(0.82, 0.74, w));
  return (
    <>
      <CameraRig t={t} />
      <Env intensity={0.32} />
      <color attach="background" args={['#d8d0c4']} />
      <ambientLight intensity={0.06} color="#fff1df" />
      {/* window light from back-left, warm, soft shadows */}
      <directionalLight
        position={[-60, 85, -45]}
        intensity={2.3}
        color={key}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={10}
        shadow-camera-far={260}
        shadow-radius={9}
        shadow-blurSamples={20}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[50, 30, 70]} intensity={0.35} color="#dfe6ff" />
      <Backdrop />
      <Table />
      <Glass t={t} />
      <Setting />
      {plateVisible(t) && <Dish t={t} />}
      {t > 6 && t < 10.1 && (
        <Held tip={pipingTip(t)} yaw={-0.35} lean={-0.12} grip={fistGrip(9.0, 2.0)}>
          <PipingBag />
        </Held>
      )}
      {t > 10 && t < 14.1 && (
        <Held tip={spoonTip(t)} yaw={0.5} lean={-0.5} grip={penGrip(6.0)}>
          <Spoon />
        </Held>
      )}
      {t > 14 && t < 19.1 && (
        <Held tip={tweezerTip(t)} yaw={-0.6} lean={-0.35} grip={penGrip(5.2)}>
          <Tweezers grip={tweezerGrip(t)} carry={tweezerCarry(t)} />
        </Held>
      )}
      {t > 18.9 && t < 22.3 && (
        <Held tip={bottleTip(t)} yaw={0.4} lean={-0.35} grip={fistGrip(7.0, 2.0)}>
          <Bottle />
        </Held>
      )}
      <EffectComposer multisampling={0}>
        <DepthOfField target={cam.look} worldFocusRange={cam.focusRange} bokehScale={cam.bokeh} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
};
