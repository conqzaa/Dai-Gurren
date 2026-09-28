const STYLE_ID = 'aero-beat-hud-styles';

const HUD_STYLES = `
	.aero-hud {
		position: fixed;
		inset: 0;
		z-index: 20;
		color: #fff;
		font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
		pointer-events: none;
		--hud-accent: #c475ff;
		--hud-cyan: #66f2df;
	}
	.aero-hud *, .aero-hud *::before, .aero-hud *::after { box-sizing: border-box; }
	.aero-hud[hidden] { display: none; }
	.aero-hud__track {
		position: absolute;
		top: 27px;
		left: 50%;
		width: min(42vw, 520px);
		transform: translateX(-50%);
		text-align: center;
	}
	.aero-hud__song {
		display: block;
		margin-bottom: 10px;
		color: rgba(255, 255, 255, .92);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 2px;
	}
	.aero-hud__progress {
		height: 3px;
		overflow: hidden;
		border-radius: 4px;
		background: rgba(255, 255, 255, .24);
		box-shadow: 0 0 12px rgba(102, 242, 223, .12);
	}
	.aero-hud__progress-fill {
		width: 0%;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--hud-accent), var(--hud-cyan));
		box-shadow: 0 0 12px rgba(102, 242, 223, .8);
		transition: width 450ms linear;
	}
	.aero-hud__score {
		position: absolute;
		bottom: 30px;
		left: 30px;
		text-align: left;
		text-shadow: 0 2px 18px rgba(0, 0, 0, .8);
	}
	.aero-hud__label {
		display: block;
		margin-bottom: 5px;
		color: rgba(255, 255, 255, .72);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 2px;
	}
	.aero-hud__score-value {
		font-size: 34px;
		font-variant-numeric: tabular-nums;
		font-weight: 900;
		line-height: 1;
	}
	.aero-hud__right {
		position: absolute;
		top: 92px;
		right: 30px;
		width: min(210px, 28vw);
		text-align: right;
		text-shadow: 0 2px 18px rgba(0, 0, 0, .8);
	}
	.aero-hud__combo-value {
		display: block;
		color: #fff;
		font-size: 48px;
		font-variant-numeric: tabular-nums;
		font-weight: 900;
		line-height: .95;
	}
	.aero-hud__combo-value.is-increasing { animation: aero-hud-combo 280ms ease-out; }
	.aero-hud__health { margin-top: 18px; }
	.aero-hud__health-track {
		height: 7px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, .24);
		border-radius: 6px;
		background: rgba(7, 9, 16, .45);
	}
	.aero-hud__health-fill {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, #f36f9f, #75f0c7);
		box-shadow: 0 0 12px rgba(117, 240, 199, .65);
		transition: width 300ms ease, filter 300ms ease;
	}
	.aero-hud__health-fill.is-low {
		background: #ff5a68;
		box-shadow: 0 0 12px rgba(255, 90, 104, .65);
	}
	.aero-hud__pause {
		position: absolute;
		top: 20px;
		right: 24px;
		display: grid;
		width: 44px;
		 aspect-ratio: 1;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, .32);
		border-radius: 7px;
		background: rgba(10, 12, 20, .42);
		color: #fff;
		cursor: pointer;
		font: inherit;
		font-size: 18px;
		font-weight: 900;
		backdrop-filter: blur(10px);
		pointer-events: auto;
		transition: background 160ms ease, border-color 160ms ease;
	}
	.aero-hud__pause:hover, .aero-hud__pause:focus-visible {
		border-color: var(--hud-cyan);
		background: rgba(29, 42, 50, .8);
		outline: none;
	}
	.aero-hud__overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: rgba(6, 8, 15, .56);
		backdrop-filter: blur(7px);
		pointer-events: auto;
	}
	.aero-hud__dialog {
		width: min(360px, calc(100vw - 40px));
		padding: 30px;
		border: 1px solid rgba(255, 255, 255, .2);
		border-radius: 8px;
		background: rgba(19, 20, 31, .9);
		box-shadow: 0 20px 70px rgba(0, 0, 0, .4);
		text-align: center;
	}
	.aero-hud__dialog h2 {
		margin: 0 0 24px;
		font-size: 22px;
		font-weight: 900;
		letter-spacing: 2px;
	}
	.aero-hud__actions { display: grid; gap: 10px; }
	.aero-hud__action {
		min-height: 48px;
		border: 1px solid rgba(255, 255, 255, .2);
		border-radius: 6px;
		background: rgba(255, 255, 255, .07);
		color: #fff;
		cursor: pointer;
		font: inherit;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 1px;
		pointer-events: auto;
	}
	.aero-hud__action:hover, .aero-hud__action:focus-visible {
		border-color: var(--hud-accent);
		background: rgba(196, 117, 255, .18);
		outline: none;
	}
	.aero-hud__action--exit { color: #ffb5bf; }
	@keyframes aero-hud-combo {
		0% { transform: scale(1); color: #fff; }
		45% { transform: scale(1.22); color: var(--hud-cyan); }
		100% { transform: scale(1); color: #fff; }
	}
	@media (max-width: 600px) {
		.aero-hud__track { top: 84px; width: 58vw; }
		.aero-hud__right { top: 150px; right: 18px; width: 34vw; }
		.aero-hud__score { bottom: 20px; left: 18px; }
		.aero-hud__score-value { font-size: 28px; }
		.aero-hud__combo-value { font-size: 40px; }
		.aero-hud__pause { top: 18px; right: 18px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.aero-hud__progress-fill, .aero-hud__health-fill { transition: none; }
		.aero-hud__combo-value.is-increasing { animation: none; }
	}
`;

export class HudUI {
	constructor({ onPause, onResume, onExitToMenu } = {}) {
		this.callbacks = { onPause, onResume, onExitToMenu };
		this.container = null;
		this.root = null;
		this.styleElement = null;
		this.scoreFrame = null;
		this.displayedScore = 0;
		this.handleClick = this.handleClick.bind(this);
	}

	render(container) {
		if (!container?.appendChild) {
			throw new TypeError('HudUI.render(container) expects a DOM element');
		}
		if (this.root && this.container === container) return this.root;
		this.destroy();

		const doc = container.ownerDocument ?? document;
		if (!doc.getElementById(STYLE_ID)) {
			this.styleElement = doc.createElement('style');
			this.styleElement.id = STYLE_ID;
			this.styleElement.textContent = HUD_STYLES;
			doc.head.appendChild(this.styleElement);
		}

		this.container = container;
		this.root = doc.createElement('section');
		this.root.className = 'aero-hud';
		this.root.setAttribute('aria-label', 'Game HUD');
		this.root.innerHTML = `
			<div class="aero-hud__track">
				<span class="aero-hud__song">AERO BEAT ORIGINAL MIX</span>
				<div class="aero-hud__progress" role="progressbar" aria-label="Track progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
					<div class="aero-hud__progress-fill"></div>
				</div>
			</div>
			<div class="aero-hud__score">
				<span class="aero-hud__label">SCORE</span>
				<span class="aero-hud__score-value">0</span>
			</div>
			<div class="aero-hud__right">
				<span class="aero-hud__label">COMBO</span>
				<span class="aero-hud__combo-value">0</span>
				<div class="aero-hud__health">
					<span class="aero-hud__label">HEALTH</span>
					<div class="aero-hud__health-track" role="meter" aria-label="Health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
						<div class="aero-hud__health-fill"></div>
					</div>
				</div>
			</div>
			<button class="aero-hud__pause" type="button" data-hud-action="pause" aria-label="Pause" title="Pause">Ⅱ</button>
			<div class="aero-hud__overlay" hidden>
				<div class="aero-hud__dialog" role="dialog" aria-modal="true" aria-labelledby="aero-hud-pause-title">
					<h2 id="aero-hud-pause-title">PAUSED</h2>
					<div class="aero-hud__actions">
						<button class="aero-hud__action" type="button" data-hud-action="resume">RESUME</button>
						<button class="aero-hud__action aero-hud__action--exit" type="button" data-hud-action="exit">EXIT TO MENU</button>
					</div>
				</div>
			</div>
		`;
		this.root.addEventListener('click', this.handleClick);
		container.appendChild(this.root);
		this.hide();
		return this.root;
	}

	update({ score, combo, hp, progress } = {}) {
		if (!this.root) return;
		if (Number.isFinite(score)) this.animateScore(Math.max(0, score));

		if (Number.isFinite(combo)) {
			const comboValue = this.root.querySelector('.aero-hud__combo-value');
			const nextCombo = Math.max(0, Math.floor(combo));
			if (Number(comboValue.textContent) !== nextCombo && nextCombo > Number(comboValue.textContent)) {
				comboValue.classList.remove('is-increasing');
				requestAnimationFrame(() => comboValue.classList.add('is-increasing'));
			}
			comboValue.textContent = String(nextCombo);
		}

		if (Number.isFinite(hp)) {
			const health = Math.min(100, Math.max(0, hp));
			const healthFill = this.root.querySelector('.aero-hud__health-fill');
			const meter = this.root.querySelector('.aero-hud__health-track');
			healthFill.style.width = `${health}%`;
			healthFill.classList.toggle('is-low', health <= 25);
			meter.setAttribute('aria-valuenow', String(Math.round(health)));
		}

		if (Number.isFinite(progress)) {
			const trackProgress = Math.min(100, Math.max(0, progress));
			this.root.querySelector('.aero-hud__progress-fill').style.width = `${trackProgress}%`;
			this.root.querySelector('.aero-hud__progress').setAttribute('aria-valuenow', String(Math.round(trackProgress)));
		}
	}

	animateScore(target) {
		if (this.scoreFrame !== null) cancelAnimationFrame(this.scoreFrame);
		const start = this.displayedScore;
		const change = target - start;
		const startTime = performance.now();
		const duration = 420;
		const scoreElement = this.root.querySelector('.aero-hud__score-value');
		const step = (now) => {
			const amount = Math.min(1, (now - startTime) / duration);
			const eased = 1 - ((1 - amount) ** 3);
			this.displayedScore = Math.round(start + change * eased);
			scoreElement.textContent = this.displayedScore.toLocaleString();
			if (amount < 1) this.scoreFrame = requestAnimationFrame(step);
			else this.scoreFrame = null;
		};
		this.scoreFrame = requestAnimationFrame(step);
	}

	show() {
		if (this.root) this.root.hidden = false;
	}

	hide() {
		if (this.root) this.root.hidden = true;
	}

	setPaused(paused) {
		if (!this.root) return;
		this.root.querySelector('.aero-hud__overlay').hidden = !paused;
		this.root.querySelector('.aero-hud__pause').hidden = paused;
	}

	handleClick(event) {
		const button = event.target.closest('[data-hud-action]');
		if (!button || !this.root.contains(button)) return;
		switch (button.dataset.hudAction) {
			case 'pause':
				this.setPaused(true);
				this.callbacks.onPause?.();
				break;
			case 'resume':
				this.setPaused(false);
				this.callbacks.onResume?.();
				break;
			case 'exit':
				this.setPaused(false);
				this.callbacks.onExitToMenu?.();
				break;
		}
	}

	destroy() {
		if (this.scoreFrame !== null) cancelAnimationFrame(this.scoreFrame);
		this.scoreFrame = null;
		this.root?.removeEventListener('click', this.handleClick);
		this.root?.remove();
		this.styleElement?.remove();
		this.styleElement = null;
		this.root = null;
		this.container = null;
	}
}
