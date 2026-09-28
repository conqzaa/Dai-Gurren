// Motion Guardian — точка входа.
// Каркас: canvas, игровой цикл, машина состояний и заглушки для будущих модулей.

import { CameraManager } from './vision/camera.js';
import { PoseEstimator } from './vision/pose.js';
import { GestureDetector } from './vision/gestureDetector.js';
import { MenuUI } from './ui/menu.js';
import { HudUI } from './ui/hud.js';

export const GameState = Object.freeze({
  MENU: 'MENU',
  CALIBRATION: 'CALIBRATION',
  TUTORIAL: 'TUTORIAL',
  GAME: 'GAME',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

// Порядок переключения состояний для отладки (Enter / Space / клик).
const DEBUG_STATE_ORDER = [
  GameState.MENU,
  GameState.CALIBRATION,
  GameState.TUTORIAL,
  GameState.GAME,
  GameState.GAME_OVER,
];

// Ограничение dt, чтобы после сворачивания вкладки не было гигантского скачка.
const MAX_DELTA_TIME = 0.1; // секунды

export class Game {
  constructor(canvasId = 'game-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas с id="${canvasId}" не найден`);
    }
    this.ctx = this.canvas.getContext('2d');

    this.width = 0;
    this.height = 0;

    this.state = GameState.MENU;
    this.stateTime = 0; // сколько секунд прошло в текущем состоянии

    this.camera = new CameraManager();
    this.poseEstimator = new PoseEstimator();
    this.landmarks = null; // последние распознанные точки позы
    this.gestureDetector = new GestureDetector(this.poseEstimator);
    this.gestureState = null; // руки и жесты из последнего результата MediaPipe
    // MediaPipe выдаёт результаты реже, чем идут кадры, поэтому жесты копятся
    // здесь и забираются игровым циклом ровно один раз.
    this.pendingGestures = [];
    this.lastGesture = null; // для отладочного вывода
    this.hud = null;
    this.score = 0;
    this.combo = 0;
    this.hp = 100;
    this.progress = 0;
    this.pausedFrom = null;

    this.lastTime = 0;
    this.rafId = null;
    this.running = false;

    this.fps = 0;
    this.fpsAccumulator = 0;
    this.fpsFrames = 0;

    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.handleDebugInput = this.handleDebugInput.bind(this);
  }

  // ---------- Жизненный цикл ----------

  async init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.handleDebugInput);
    this.canvas.addEventListener('click', this.handleDebugInput);

    const cameraInitialization = this.initCamera();
    this.start();
    await cameraInitialization;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ---------- Canvas ----------

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Физический размер буфера с учётом плотности пикселей — чёткость на Retina.
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Дальше рисуем в CSS-пикселях.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- Игровой цикл ----------

  loop(now) {
    if (!this.running) return;

    const deltaTime = Math.min((now - this.lastTime) / 1000, MAX_DELTA_TIME);
    this.lastTime = now;

    this.updateFps(deltaTime);
    const gestures = this.pendingGestures;
    this.pendingGestures = [];
    this.updateGameLogic(deltaTime, gestures);
    this.render(this.ctx);

    this.rafId = requestAnimationFrame(this.loop);
  }

  updateFps(deltaTime) {
    this.fpsAccumulator += deltaTime;
    this.fpsFrames += 1;
    if (this.fpsAccumulator >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrames = 0;
    }
  }

  // ---------- Машина состояний ----------

  setState(newState) {
    if (!Object.values(GameState).includes(newState)) {
      console.warn(`Неизвестное состояние: ${newState}`);
      return;
    }
    if (newState === this.state) return;

    const prev = this.state;
    this.onExitState(prev);
    this.state = newState;
    this.stateTime = 0;
    this.onEnterState(newState, prev);

    if (this.hud) {
      this.hud.setPaused(newState === GameState.PAUSED);
      if ([GameState.CALIBRATION, GameState.TUTORIAL, GameState.GAME, GameState.PAUSED].includes(newState)) {
        this.hud.show();
      } else {
        this.hud.hide();
      }
    }
  }

  pause() {
    if (this.state === GameState.PAUSED || this.state === GameState.MENU) return;
    this.pausedFrom = this.state;
    this.setState(GameState.PAUSED);
  }

  resume() {
    if (this.state !== GameState.PAUSED) return;
    const state = this.pausedFrom ?? GameState.GAME;
    this.pausedFrom = null;
    this.setState(state);
  }

  resetRun() {
    this.score = 0;
    this.combo = 0;
    this.hp = 100;
    this.progress = 0;
    this.hud?.update({ score: 0, combo: 0, hp: 100, progress: 0 });
  }

  onEnterState(state, prevState) {
    // TODO: подготовка модулей при входе в состояние
    console.log(`[GameState] ${prevState} → ${state}`);
  }

  onExitState(state) {
    // TODO: очистка ресурсов при выходе из состояния
  }

  handleDebugInput(event) {
    if (event.type === 'keydown' && event.code !== 'Enter' && event.code !== 'Space') {
      return;
    }
    const index = DEBUG_STATE_ORDER.indexOf(this.state);
    const next = DEBUG_STATE_ORDER[(index + 1) % DEBUG_STATE_ORDER.length];
    this.setState(next);
  }

  // ---------- Заглушки для модулей ----------

  async initCamera() {
    this.poseEstimator.init((results) => {
      this.landmarks = results.poseLandmarks ?? null;
      this.gestureState = this.gestureDetector.processLandmarks(this.landmarks, this.width, this.height);
      this.pendingGestures.push(...this.gestureState.gestures);
    });
    await this.camera.init();
  }

  // gestures — жесты, распознанные с прошлого кадра: [{ type, hand, x, y, speed }].
  // Текущее положение рук — this.gestureState?.hands.
  updateGameLogic(deltaTime, gestures = []) {
    this.stateTime += deltaTime;

    for (const gesture of gestures) {
      console.log(`[Gesture] ${gesture.type} (${gesture.hand})`);
      this.lastGesture = { ...gesture, time: performance.now() };
      if ([GameState.CALIBRATION, GameState.TUTORIAL, GameState.GAME].includes(this.state)) {
        this.score += 100;
        this.combo += 1;
        this.hud?.update({ score: this.score, combo: this.combo, hp: this.hp, progress: this.progress });
      }
    }

    switch (this.state) {
      case GameState.MENU:
        // TODO: логика меню
        break;
      case GameState.CALIBRATION:
        // TODO: калибровка камеры / позы игрока
        break;
      case GameState.TUTORIAL:
        // TODO: обучение
        break;
      case GameState.GAME:
        // TODO: основной игровой процесс — реакция на gestures (PUNCH_*, SWIPE_*)
        break;
      case GameState.GAME_OVER:
        // TODO: экран результатов
        break;
    }
  }

  render(ctx) {
    // Видео с камеры — фон; пока кадра нет, заливаем тёмным цветом.
    if (!this.camera.render(ctx, this.width, this.height)) {
      ctx.fillStyle = '#0b0f1a';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Распознавание асинхронное: кадр уходит в MediaPipe, результат придёт в колбэк.
    if (this.camera.ready) {
      this.poseEstimator.detect(this.camera.video);
    }
    this.poseEstimator.drawLandmarks(ctx, this.landmarks, this.width, this.height);

    this.renderStateLabel(ctx);
    this.renderDebugInfo(ctx);
  }

  // ---------- Отладочная отрисовка ----------

  renderStateLabel(ctx) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    // Лёгкая пульсация — видно, что цикл работает.
    const pulse = 0.75 + 0.25 * Math.sin(this.stateTime * 4);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#4fd1c5';
    ctx.font = `bold ${Math.max(32, Math.min(this.width, this.height) * 0.08)}px system-ui, sans-serif`;
    ctx.fillText(this.state, cx, cy);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Enter / Space / клик — следующее состояние', cx, cy + 60);
    ctx.restore();
  }

  renderDebugInfo(ctx) {
    ctx.save();
    ctx.fillStyle = '#a0aec0';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${this.fps}`, 12, 12);
    ctx.fillText(`State time: ${this.stateTime.toFixed(1)}s`, 12, 30);

    const hands = this.gestureState?.hands;
    if (hands) {
      const raised = ['left', 'right'].filter((side) => hands[side].raised);
      ctx.fillText(`Raised: ${raised.length ? raised.join(', ') : '—'}`, 12, 48);
    }
    if (this.lastGesture && performance.now() - this.lastGesture.time < 1000) {
      ctx.fillStyle = '#f6ad55';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${this.lastGesture.type} (${this.lastGesture.hand})`, 12, 70);
    }
    ctx.restore();
  }
}

// ---------- Запуск ----------

async function bootstrap() {
  const game = new Game('game-canvas');
  const hud = new HudUI({
    onPause: () => game.pause(),
    onResume: () => game.resume(),
    onExitToMenu: () => {
      game.pausedFrom = null;
      game.setState(GameState.MENU);
      game.resetRun();
      menu.showMenu();
    },
  });
  hud.render(document.body);
  game.hud = hud;
  const menu = new MenuUI({
    onStartGame: () => {
      game.resetRun();
      game.setState(GameState.CALIBRATION);
      hud.setPaused(false);
      hud.show();
      menu.showGameView();
    },
  });
  menu.render(document.body);
  await game.init();
  menu.setCameraReady(game.camera.ready);
  window.game = game; // доступ из консоли для отладки
  window.menu = menu;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
