import { RangeSetBuilder } from '@codemirror/state';
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import { findMarkers } from '../markers';
import type { TimestamperSettings } from '../settings';

const hiddenMarker = Decoration.replace({});

/**
 * Adds a right-side timestamp badge (via a line decoration + CSS `::after`)
 * to every editor line containing a marker, and hides the raw marker text in
 * live preview when the cursor isn't on that line.
 */
export function timestampExtension(getSettings: () => TimestamperSettings) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			livePreview: boolean;

			constructor(view: EditorView) {
				this.livePreview = view.state.field(editorLivePreviewField, false) ?? false;
				this.decorations = this.build(view);
			}

			update(update: ViewUpdate) {
				const livePreview =
					update.state.field(editorLivePreviewField, false) ?? false;
				if (
					update.docChanged ||
					update.viewportChanged ||
					update.selectionSet ||
					livePreview !== this.livePreview
				) {
					this.livePreview = livePreview;
					this.decorations = this.build(update.view);
				}
			}

			build(view: EditorView): DecorationSet {
				const builder = new RangeSetBuilder<Decoration>();
				const { doc, selection } = view.state;
				const hideText = this.livePreview && getSettings().hideMarkerText;

				// Visible ranges are split around any hidden text (e.g. link URLs in
				// live preview), so one line can appear in several ranges. Each line
				// must be processed once or RangeSetBuilder throws on unsorted input.
				let lastLine = 0;
				for (const { from, to } of view.visibleRanges) {
					let pos = from;
					while (pos <= to) {
						const line = doc.lineAt(pos);
						pos = line.to + 1;
						if (line.number <= lastLine) continue;
						lastLine = line.number;
						const markers = findMarkers(line.text);
						if (markers.length > 0) {
							builder.add(
								line.from,
								line.from,
								Decoration.line({
									class: 'timestamper-line',
									attributes: {
										'data-timestamper': markers
											.map((m) => m.label)
											.join(' · '),
									},
								}),
							);

							const cursorOnLine = selection.ranges.some(
								(r) => r.from <= line.to && r.to >= line.from,
							);
							if (hideText && !cursorOnLine) {
								for (const m of markers) {
									builder.add(line.from + m.from, line.from + m.to, hiddenMarker);
								}
							}
						}
					}
				}
				return builder.finish();
			}
		},
		{ decorations: (v) => v.decorations },
	);
}
