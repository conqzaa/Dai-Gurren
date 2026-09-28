// Модуль веб-камеры: получение видеопотока и отрисовка кадра на Canvas.

export class CameraManager {
  constructor() {
    // Скрытый <video>, в DOM не добавляется — используется только как источник кадров.
    this.video = document.createElement('video');
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.autoplay = true;

    this.stream = null;
    this.ready = false;
  }

  async init() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia не поддерживается (нужен HTTPS или localhost)');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.ready = true;
      console.log(`[Camera] Поток запущен: ${this.video.videoWidth}×${this.video.videoHeight}`);
    } catch (error) {
      this.ready = false;
      const reasons = {
        NotAllowedError: 'доступ к камере запрещён пользователем или браузером',
        NotFoundError: 'камера не найдена',
        NotReadableError: 'камера занята другим приложением',
        OverconstrainedError: 'камера не поддерживает запрошенные параметры',
      };
      const reason = reasons[error.name] ?? error.message;
      console.error(`[Camera] Не удалось подключить веб-камеру: ${reason}`, error);
    }
    return this.ready;
  }

  // Рисует кадр во весь экран с зеркалированием. Возвращает false, если кадра ещё нет.
  render(ctx, width, height) {
    const video = this.video;
    if (!this.ready || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return false;
    }

    // Масштабирование по типу object-fit: cover — без искажения пропорций.
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const scale = Math.max(width / vw, height / vh);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
    ctx.restore();
    return true;
  }
}
