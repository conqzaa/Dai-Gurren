// Распознавание жестов по точкам MediaPipe Pose: скорость кистей, углы суставов,
// события PUNCH_LEFT / PUNCH_RIGHT / SWIPE_UP / SWIPE_DOWN.

import { Landmark } from './pose.js';

export const Gesture = Object.freeze({
  PUNCH_LEFT: 'PUNCH_LEFT',
  PUNCH_RIGHT: 'PUNCH_RIGHT',
  SWIPE_UP: 'SWIPE_UP',
  SWIPE_DOWN: 'SWIPE_DOWN',
});

// Точки каждой руки. left/right — руки самого игрока (на зеркальном экране левая рука слева).
const ARMS = {
  left: {
    shoulder: Landmark.LEFT_SHOULDER,
    elbow: Landmark.LEFT_ELBOW,
    wrist: Landmark.LEFT_WRIST,
    hip: Landmark.LEFT_HIP,
    punch: Gesture.PUNCH_LEFT,
  },
  right: {
    shoulder: Landmark.RIGHT_SHOULDER,
    elbow: Landmark.RIGHT_ELBOW,
    wrist: Landmark.RIGHT_WRIST,
    hip: Landmark.RIGHT_HIP,
    punch: Gesture.PUNCH_RIGHT,
  },
};

// Скорости измеряются в ширинах плеч в секунду — так пороги не зависят
// от того, насколько далеко игрок стоит от камеры.
const DEFAULT_OPTIONS = {
  minVisibility: 0.5,
  velocitySmoothing: 0.5,      // EMA: 0 — без сглаживания, ближе к 1 — сильнее
  maxFrameGap: 0.25,           // с; при большем разрыве история сбрасывается
  gestureCooldown: 0.4,        // с; пауза между одинаковыми жестами одной руки
  swipeMinSpeed: 3.5,          // вертикальная скорость кисти для взмаха
  swipeDominance: 2,           // |vy| должна быть во столько раз больше |vx|
  punchMinExtensionSpeed: 400, // °/с — скорость разгибания локтя
  punchMinElbowAngle: 140,     // ° — рука почти выпрямлена в конце удара
  punchMinSpeed: 2,            // 3D-скорость кисти (с учётом глубины)
  raisedMinShoulderAngle: 120, // ° — угол бедро–плечо–локоть для поднятой руки
};

// Угол ABC в градусах (вершина B), в 3D.
function angleDeg(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const len = Math.hypot(v1.x, v1.y, v1.z) * Math.hypot(v2.x, v2.y, v2.z);
  if (len === 0) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / len))) * 180) / Math.PI;
}

// Запасное преобразование, если PoseEstimator не передан: растяжение на весь экран + зеркало.
function defaultToScreen(landmark, width, height) {
  return {
    x: (1 - landmark.x) * width,
    y: landmark.y * height,
    z: (landmark.z ?? 0) * width,
  };
}

function emptyHand() {
  return {
    visible: false,
    x: 0, y: 0,           // экранные координаты кисти, px
    vx: 0, vy: 0, vz: 0,  // скорость кисти, ширин плеч/с (vy > 0 — вниз, vz < 0 — к камере)
    speed: 0,
    elbowAngle: 0,        // ° (180 — рука прямая)
    shoulderAngle: 0,     // ° между туловищем и плечом (0 — рука опущена, 180 — вверх)
    raised: false,
  };
}

export class GestureDetector {
  constructor(poseEstimator = null, options = {}) {
    this.toScreen = poseEstimator
      ? (lm, w, h) => poseEstimator.toScreen(lm, w, h)
      : defaultToScreen;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.reset();
  }

  reset() {
    this.lastTime = null;
    this.history = { left: null, right: null }; // предыдущее состояние каждой руки
    this.lastGestureTime = {}; // `${type}:${hand}` → время последнего срабатывания, с
  }

  // Обрабатывает один результат MediaPipe. Вызывать на каждый новый набор точек,
  // а не на каждый кадр отрисовки — иначе скорость между одинаковыми точками будет нулевой.
  processLandmarks(landmarks, width, height) {
    const now = performance.now() / 1000;
    const result = {
      timestamp: now,
      hands: { left: emptyHand(), right: emptyHand() },
      gestures: [],
    };

    if (!landmarks) {
      this.reset();
      return result;
    }

    const dt = this.lastTime === null ? 0 : now - this.lastTime;
    this.lastTime = now;
    if (dt > this.options.maxFrameGap) {
      this.history = { left: null, right: null };
    }

    const visible = (i) => landmarks[i] && (landmarks[i].visibility ?? 1) >= this.options.minVisibility;
    const point = (i) => this.toScreen(landmarks[i], width, height);

    // Масштаб тела — ширина плеч в пикселях.
    let bodyScale = 0;
    if (visible(Landmark.LEFT_SHOULDER) && visible(Landmark.RIGHT_SHOULDER)) {
      const l = point(Landmark.LEFT_SHOULDER);
      const r = point(Landmark.RIGHT_SHOULDER);
      bodyScale = Math.hypot(l.x - r.x, l.y - r.y);
    }

    for (const [side, arm] of Object.entries(ARMS)) {
      const hand = result.hands[side];
      if (!bodyScale || !visible(arm.shoulder) || !visible(arm.elbow) || !visible(arm.wrist)) {
        this.history[side] = null;
        continue;
      }

      const shoulder = point(arm.shoulder);
      const elbow = point(arm.elbow);
      const wrist = point(arm.wrist);

      hand.visible = true;
      hand.x = wrist.x;
      hand.y = wrist.y;
      hand.elbowAngle = angleDeg(shoulder, elbow, wrist);
      if (visible(arm.hip)) {
        hand.shoulderAngle = angleDeg(point(arm.hip), shoulder, elbow);
      }
      hand.raised = wrist.y < shoulder.y && hand.shoulderAngle >= this.options.raisedMinShoulderAngle;

      const prev = this.history[side];
      this.history[side] = { wrist, elbowAngle: hand.elbowAngle, vx: 0, vy: 0, vz: 0 };
      if (!prev || dt <= 0) continue;

      // Скорость кисти со сглаживанием.
      const k = this.options.velocitySmoothing;
      const raw = {
        x: (wrist.x - prev.wrist.x) / bodyScale / dt,
        y: (wrist.y - prev.wrist.y) / bodyScale / dt,
        z: (wrist.z - prev.wrist.z) / bodyScale / dt,
      };
      hand.vx = prev.vx * k + raw.x * (1 - k);
      hand.vy = prev.vy * k + raw.y * (1 - k);
      hand.vz = prev.vz * k + raw.z * (1 - k);
      hand.speed = Math.hypot(hand.vx, hand.vy, hand.vz);
      Object.assign(this.history[side], { vx: hand.vx, vy: hand.vy, vz: hand.vz });

      const extensionSpeed = (hand.elbowAngle - prev.elbowAngle) / dt;
      const detected = [];

      // Удар: локоть резко разгибается, рука почти прямая, кисть движется быстро.
      const isPunch =
        extensionSpeed >= this.options.punchMinExtensionSpeed &&
        hand.elbowAngle >= this.options.punchMinElbowAngle &&
        hand.speed >= this.options.punchMinSpeed;
      if (isPunch) {
        detected.push(arm.punch);
      } else if (
        // Взмах: быстрое, преимущественно вертикальное движение кисти. Пока локоть
        // быстро разгибается, это скорее начало удара — взмах не засчитываем.
        extensionSpeed < this.options.punchMinExtensionSpeed / 2 &&
        Math.abs(hand.vy) >= this.options.swipeMinSpeed &&
        Math.abs(hand.vy) >= Math.abs(hand.vx) * this.options.swipeDominance
      ) {
        detected.push(hand.vy < 0 ? Gesture.SWIPE_UP : Gesture.SWIPE_DOWN);
      }

      for (const type of detected) {
        const key = `${type}:${side}`;
        if (now - (this.lastGestureTime[key] ?? -Infinity) < this.options.gestureCooldown) continue;
        this.lastGestureTime[key] = now;
        result.gestures.push({ type, hand: side, x: wrist.x, y: wrist.y, speed: hand.speed });
      }
    }

    return result;
  }
}
