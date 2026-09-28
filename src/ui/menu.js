const STYLE_ID = 'aero-beat-menu-styles';

const MENU_STYLES = `
	.aero-menu {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: grid;
		place-items: center;
		overflow: auto;
		padding: 32px 20px 76px;
		color: #fff;
		background:
			linear-gradient(135deg, rgba(9, 10, 20, .55), rgba(18, 12, 31, .38) 52%, rgba(8, 12, 20, .55)),
			repeating-linear-gradient(0deg, transparent 0 47px, rgba(255, 255, 255, .025) 48px),
			repeating-linear-gradient(90deg, transparent 0 47px, rgba(255, 255, 255, .025) 48px);
		font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
		text-align: center;
		animation: aero-menu-enter 700ms ease-out both;
	}
	.aero-menu *, .aero-menu *::before, .aero-menu *::after { box-sizing: border-box; }
	.aero-menu__content { width: min(100%, 440px); }
	.aero-menu--playing {
		background: transparent;
		pointer-events: none;
	}
	.aero-menu--playing .aero-menu__content,
	.aero-menu--playing .aero-menu__camera { display: none; }
	.aero-menu__logo {
		margin: 0;
		font-size: clamp(54px, 12vw, 102px);
		font-weight: 900;
		line-height: .86;
		letter-spacing: 0;
		text-shadow: 0 0 36px rgba(171, 100, 255, .22);
	}
	.aero-menu__logo-aero { color: #bc76ff; }
	.aero-menu__logo-beat { color: #f5f4fa; }
	.aero-menu__tagline {
		margin: 19px 0 42px;
		color: #c7c1d3;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 4px;
	}
	.aero-menu__actions { display: grid; gap: 13px; }
	.aero-menu__button {
		position: relative;
		display: flex;
		min-height: 58px;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(255, 255, 255, .19);
		border-radius: 8px;
		background: rgba(255, 255, 255, .075);
		color: #f8f6fc;
		cursor: pointer;
		font: inherit;
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 2px;
		backdrop-filter: blur(14px);
		transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
	}
	.aero-menu__button:hover, .aero-menu__button:focus-visible {
		transform: translateY(-3px);
		border-color: rgba(212, 168, 255, .8);
		background: rgba(255, 255, 255, .13);
		box-shadow: 0 12px 32px rgba(138, 71, 218, .2);
		outline: none;
	}
	.aero-menu__button--primary {
		min-height: 64px;
		border-color: rgba(211, 156, 255, .88);
		background: linear-gradient(105deg, rgba(123, 55, 198, .9), rgba(172, 82, 244, .82));
		box-shadow: 0 0 24px rgba(157, 77, 235, .34), inset 0 1px rgba(255, 255, 255, .24);
		color: #fff;
		font-size: 15px;
	}
	.aero-menu__button--primary:hover, .aero-menu__button--primary:focus-visible {
		border-color: #ead2ff;
		background: linear-gradient(105deg, #8f43d4, #bd65ff);
		box-shadow: 0 0 36px rgba(177, 93, 255, .62), inset 0 1px rgba(255, 255, 255, .35);
	}
	.aero-menu__camera {
		position: fixed;
		bottom: 24px;
		left: 24px;
		display: flex;
		align-items: center;
		gap: 9px;
		color: #e8e5ed;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: .4px;
	}
	.aero-menu__camera-dot {
		width: 9px;
		height: 9px;
		flex: 0 0 9px;
		border-radius: 50%;
		background: #f45b68;
		box-shadow: 0 0 12px rgba(244, 91, 104, .6);
	}
	.aero-menu__camera--ready .aero-menu__camera-dot {
		background: #4de29b;
		box-shadow: 0 0 12px rgba(77, 226, 155, .65);
	}
	@keyframes aero-menu-enter {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@media (max-width: 480px) {
		.aero-menu__tagline { margin-bottom: 32px; letter-spacing: 3px; }
		.aero-menu__camera { bottom: 18px; left: 18px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.aero-menu, .aero-menu__button { animation: none; transition: none; }
	}
`;

export class MenuUI {
	constructor({ onStartGame, cameraReady = false } = {}) {
		this.onStartGame = onStartGame;
		this.cameraReady = cameraReady;
		this.container = null;
		this.root = null;
		this.styleElement = null;
		this.handleClick = this.handleClick.bind(this);
	}

	render(container) {
		if (!container?.appendChild) {
			throw new TypeError('MenuUI.render(container) expects a DOM element');
		}
		if (this.root && this.container === container) return this.root;
		this.destroy();

		const doc = container.ownerDocument ?? document;
		if (!doc.getElementById(STYLE_ID)) {
			this.styleElement = doc.createElement('style');
			this.styleElement.id = STYLE_ID;
			this.styleElement.textContent = MENU_STYLES;
			doc.head.appendChild(this.styleElement);
		}

		this.container = container;
		this.root = doc.createElement('main');
		this.root.className = 'aero-menu';
		this.root.setAttribute('aria-label', 'Aero Beat main menu');
		this.root.innerHTML = `
			<div class="aero-menu__content">
				<h1 class="aero-menu__logo"><span class="aero-menu__logo-aero">AERO</span> <span class="aero-menu__logo-beat">BEAT</span></h1>
				<p class="aero-menu__tagline">MOVE WITH THE MUSIC</p>
				<nav class="aero-menu__actions" aria-label="Main menu">
					<button class="aero-menu__button aero-menu__button--primary" type="button" data-menu-action="start">PLAY</button>
					<button class="aero-menu__button" type="button" data-menu-action="how-to-play">HOW TO PLAY</button>
					<button class="aero-menu__button" type="button" data-menu-action="settings">SETTINGS</button>
				</nav>
			</div>
			<div class="aero-menu__camera" role="status" aria-live="polite">
				<span class="aero-menu__camera-dot" aria-hidden="true"></span>
				<span class="aero-menu__camera-label"></span>
			</div>
		`;
		this.root.addEventListener('click', this.handleClick);
		container.appendChild(this.root);
		this.setCameraReady(this.cameraReady);
		return this.root;
	}

	setCameraReady(ready) {
		this.cameraReady = Boolean(ready);
		if (!this.root) return;
		const status = this.root.querySelector('.aero-menu__camera');
		status.classList.toggle('aero-menu__camera--ready', this.cameraReady);
		status.querySelector('.aero-menu__camera-label').textContent = this.cameraReady ? 'Camera Ready' : 'Camera Off';
	}

	showGameView() {
		this.root?.classList.add('aero-menu--playing');
	}

	showMenu() {
		this.root?.classList.remove('aero-menu--playing');
	}

	handleClick(event) {
		const button = event.target.closest('[data-menu-action]');
		if (!button || !this.root.contains(button)) return;

		const action = button.dataset.menuAction;
		if (action === 'start' && this.onStartGame) {
			this.onStartGame();
			return;
		}

		const eventName = action === 'start' ? 'aerobeat:start' : `aerobeat:${action}`;
		this.container.dispatchEvent(new this.container.ownerDocument.defaultView.CustomEvent(eventName, { bubbles: true }));
	}

	destroy() {
		if (this.root) {
			this.root.removeEventListener('click', this.handleClick);
			this.root.remove();
		}
		this.styleElement?.remove();
		this.styleElement = null;
		this.root = null;
		this.container = null;
	}
}
