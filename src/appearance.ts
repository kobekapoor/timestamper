import { debounce, MarkdownView, Plugin } from 'obsidian';
import { MarginRoom } from './margin-room';
import { findMarkers } from './markers';
import type { MarkerFont, TimestamperSettings } from './settings';

const BODY_CLASSES = [
	'timestamper-inline',
	'timestamper-style-badge',
	'timestamper-style-ribbon',
	'timestamper-hidden',
];
const HAS_MARKERS_CLASS = 'timestamper-has-markers';
const CSS_VARS = ['--timestamper-bg', '--timestamper-text', '--timestamper-font'];

const PRESET_FONTS: Record<Exclude<MarkerFont, 'custom'>, string> = {
	monospace: 'var(--font-monospace)',
	interface: 'var(--font-interface)',
	text: 'var(--font-text)',
};

/**
 * Applies style settings as body classes and CSS variables, and flags each
 * Markdown view that contains markers so the ribbon only appears on those notes.
 */
export class Appearance {
	private readonly refreshViewsDebounced = debounce(() => this.refreshViews(), 300, true);
	private readonly marginRoom = new MarginRoom(() => this.markdownViews());

	constructor(
		private plugin: Plugin,
		private getSettings: () => TimestamperSettings,
	) {}

	load() {
		const { workspace } = this.plugin.app;
		this.plugin.registerEvent(workspace.on('layout-change', () => this.refreshViews()));
		this.plugin.registerEvent(workspace.on('file-open', () => this.refreshViews()));
		this.plugin.registerEvent(workspace.on('editor-change', this.refreshViewsDebounced));
		this.plugin.registerEvent(
			this.plugin.app.vault.on('modify', this.refreshViewsDebounced),
		);
		this.marginRoom.load();
		workspace.onLayoutReady(() => this.refreshViews());
		this.apply();
	}

	unload() {
		this.marginRoom.unload();
		document.body.removeClasses(BODY_CLASSES);
		for (const name of CSS_VARS) document.body.style.removeProperty(name);
		for (const view of this.markdownViews()) view.containerEl.removeClass(HAS_MARKERS_CLASS);
	}

	/** Call whenever settings change. */
	apply() {
		const s = this.getSettings();
		const body = document.body;
		body.toggleClass('timestamper-hidden', !s.showMarkers);
		body.toggleClass('timestamper-style-badge', s.style === 'badge');
		body.toggleClass('timestamper-style-ribbon', s.style === 'ribbon');
		// The ribbon always lives in the margin so it never overlaps text.
		body.toggleClass(
			'timestamper-inline',
			s.style === 'badge' && s.placement === 'inline',
		);

		const colors = s.style === 'ribbon' ? s.ribbonColors : s.badgeColors;
		for (const [name, value] of [
			['--timestamper-bg', colors.background],
			['--timestamper-text', colors.text],
			['--timestamper-font', fontFamily(s)],
		] as const) {
			if (value) body.setCssProps({ [name]: value });
			else body.style.removeProperty(name);
		}
	}

	private refreshViews() {
		for (const view of this.markdownViews()) {
			view.containerEl.toggleClass(
				HAS_MARKERS_CLASS,
				findMarkers(view.getViewData()).length > 0,
			);
		}
		this.marginRoom.refresh();
	}

	private markdownViews(): MarkdownView[] {
		return this.plugin.app.workspace
			.getLeavesOfType('markdown')
			.map((leaf) => leaf.view)
			.filter((view): view is MarkdownView => view instanceof MarkdownView);
	}
}

function fontFamily(s: TimestamperSettings): string {
	if (s.font !== 'custom') return PRESET_FONTS[s.font];
	// Empty custom font means "not chosen yet": fall back to the stylesheet default.
	return s.customFont ? `${s.customFont}, var(--font-monospace)` : '';
}
