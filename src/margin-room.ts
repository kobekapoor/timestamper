import type { MarkdownView } from 'obsidian';

export const NO_ROOM_CLASS = 'timestamper-no-room';

/** Space the margin needs for a badge or the ribbon, in multiples of the note's font size. */
const NEEDED_EM = 6;

/** Scrolling area and centred text column for each view mode. */
const MODE_ELEMENTS = {
	source: { scroller: '.cm-scroller', column: '.cm-contentContainer' },
	preview: { scroller: '.markdown-preview-view', column: '.markdown-preview-sizer' },
} as const;

/**
 * Flags each Markdown view whose right margin is too narrow for the times, so
 * the stylesheet can move them inside the text column instead of off-screen.
 */
export class MarginRoom {
	private observer: ResizeObserver | null = null;

	constructor(private markdownViews: () => MarkdownView[]) {}

	load() {
		this.observer = new ResizeObserver(() => this.refresh());
	}

	unload() {
		this.observer?.disconnect();
		this.observer = null;
		for (const view of this.markdownViews()) view.containerEl.removeClass(NO_ROOM_CLASS);
	}

	/** Measures every open view and watches it for future size changes. */
	refresh() {
		for (const view of this.markdownViews()) {
			const els = MODE_ELEMENTS[view.getMode()];
			const scroller = view.containerEl.querySelector<HTMLElement>(els.scroller);
			const column = view.containerEl.querySelector<HTMLElement>(els.column);
			if (!scroller || !column) continue;
			// Re-observing an element is a no-op, so this also picks up new views.
			this.observer?.observe(scroller);
			// Hidden views (e.g. the inactive mode) measure as zero; leave them as they are.
			if (scroller.clientWidth === 0) continue;

			const room =
				scroller.getBoundingClientRect().left +
				scroller.clientWidth -
				column.getBoundingClientRect().right;
			const needed = NEEDED_EM * parseFloat(getComputedStyle(column).fontSize);
			view.containerEl.toggleClass(NO_ROOM_CLASS, room < needed);
		}
	}
}
