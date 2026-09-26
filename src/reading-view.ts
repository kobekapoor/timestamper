import type { MarkdownPostProcessor } from 'obsidian';
import { findMarkers } from './markers';

/**
 * Obsidian strips `%%comments%%` from reading view, so we look the markers up
 * in the section's source text and attach a badge to the rendered block.
 */
export const readingViewProcessor: MarkdownPostProcessor = (el, ctx) => {
	const info = ctx.getSectionInfo(el);
	if (!info) return;

	const lines = info.text.split('\n').slice(info.lineStart, info.lineEnd + 1);
	const labels = lines.flatMap((line) => findMarkers(line).map((m) => m.label));
	if (labels.length === 0) return;

	el.addClass('timestamper-block');
	el.createSpan({ cls: 'timestamper-badge', text: labels.join(' · ') });
};
