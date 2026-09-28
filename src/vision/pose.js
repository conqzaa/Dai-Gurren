// Модуль распознавания позы: обёртка над MediaPipe Pose (window.Pose из CDN-скрипта).

// Индексы ключевых точек MediaPipe Pose.
export const Landmark = Object.freeze({
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
});

// Точки, которые рисуем крупно, — основное управление руками.
const KEY_POINTS = [
  Landmark.LEFT_SHOULDER, Landmark.RIGHT_SHOULDER,
  Landmark.LEFT_ELBOW, Landmark.RIGHT_ELBOW,
  Landmark.LEFT_WRIST, Landmark.RIGHT_WRIST,
];

const CONNECTIONS = [
  [Landmark.LEFT_SHOULDER, Landmark.RIGHT_SHOULDER],
  [Landmark.LEFT_SHOULDER, Landmark.LEFT_ELBOW],
  [Landmark.LEFT_ELBOW, Landmark.LEFT_WRIST],
  [Landmark.RIGHT_SHOULDER, Landmark.RIGHT_ELBOW],
  [Landmark.RIGHT_ELBOW, Landmark.RIGHT_WRIST],
  [Landmark.LEFT_SHOULDER, Landmark.LEFT_HIP],
  [Landmark.RIGHT_SHOULDER, Landmark.RIGHT_HIP],
  [Landmark.LEFT_HIP, Landmark.RIGHT_HIP],
];

const MIN_VISIBILITY = 0.5;

export class PoseEstimator {
  constructor() {
    this.pose = null;
    this.busy = false; // идёт ли обработка предыдущего кадра
    this.videoWidth = 0;
    this.videoHeight = 0;

    if (typeof window.Pose !== 'function') {
      console.error('[Pose] MediaPipe Pose не загружен: проверьте <script> с @mediapipe/pose в index.html');
      return;
    }

    this.pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  init(onResultsCallback) {
    this.pose?.onResults(onResultsCallback);
  }

  // Отправляет кадр на распознавание. Пока предыдущий кадр обрабатывается, новые пропускаются.
  async detect(videoElement) {
    if (!this.pose || this.busy) return;
    if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    this.busy = true;
    this.videoWidth = videoElement.videoWidth;
    this.videoHeight = videoElement.videoHeight;
    try {
      await this.pose.send({ image: videoElement });
    } catch (error) {
      console.error('[Pose] Ошибка распознавания кадра:', error);
    } finally {
      this.busy = false;
    }
  }

  // Переводит нормализованные координаты точки в экранные — с тем же
  // cover-кадрированием и зеркалированием, что и фон в CameraManager.render().
  toScreen(landmark, width, height) {
    const vw = this.videoWidth || width;
    const vh = this.videoHeight || height;
    const scale = Math.max(width / vw, height / vh);
    const offsetX = (vw * scale - width) / 2;
    const offsetY = (vh * scale - height) / 2;
    return {
      x: width - (landmark.x * vw * scale - offsetX),
      y: landmark.y * vh * scale - offsetY,
      // Глубина в тех же пикселях (MediaPipe масштабирует z как x); меньше — ближе к камере.
      z: (landmark.z ?? 0) * vw * scale,
    };
  }

  drawLandmarks(ctx, landmarks, width, height) {
    if (!landmarks) return;

    const visible = (i) => landmarks[i] && (landmarks[i].visibility ?? 1) >= MIN_VISIBILITY;
    const point = (i) => this.toScreen(landmarks[i], width, height);

    ctx.save();

    ctx.strokeStyle = 'rgba(79, 209, 197, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const [a, b] of CONNECTIONS) {
      if (!visible(a) || !visible(b)) continue;
      const p1 = point(a);
      const p2 = point(b);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (const i of KEY_POINTS) {
      if (!visible(i)) continue;
      const { x, y } = point(i);
      const isWrist = i === Landmark.LEFT_WRIST || i === Landmark.RIGHT_WRIST;
      ctx.beginPath();
      ctx.arc(x, y, isWrist ? 12 : 8, 0, Math.PI * 2);
      ctx.fillStyle = isWrist ? '#f6ad55' : '#4fd1c5';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    ctx.restore();
  }
}
