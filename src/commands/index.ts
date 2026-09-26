import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import type TimestamperPlugin from '../main';
import { findMarkers, formatMarker } from '../markers';
import { InsertMarkerModal } from '../ui/insert-marker-modal';

export function registerCommands(plugin: TimestamperPlugin) {
	plugin.addCommand({
		id: 'insert-timestamp-marker',
		name: 'Insert timestamp marker',
		icon: 'clock',
		editorCallback: (editor) => openInsertModal(plugin, editor),
	});

	plugin.addRibbonIcon('clock', 'Insert timestamp marker', () => {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice('Open a note to insert a timestamp marker.');
			return;
		}
		openInsertModal(plugin, view.editor);
	});

	plugin.addCommand({
		id: 'toggle-timestamp-visibility',
		name: 'Show or hide timestamps',
		icon: 'eye',
		callback: async () => {
			plugin.settings.showMarkers = !plugin.settings.showMarkers;
			await plugin.saveSettings();
		},
	});

	plugin.addCommand({
		id: 'remove-timestamp-markers',
		name: 'Remove all timestamp markers from this note',
		editorCallback: (editor) => {
			const text = editor.getValue();
			const markers = findMarkers(text);
			if (markers.length === 0) return;
			// Remove back to front so earlier offsets stay valid, including one leading space.
			const changes = markers.map((m) => {
				const from = text[m.from - 1] === ' ' ? m.from - 1 : m.from;
				return { from: editor.offsetToPos(from), to: editor.offsetToPos(m.to), text: '' };
			});
			editor.transaction({ changes });
		},
	});
}

function openInsertModal(plugin: Plugin, editor: Editor) {
	new InsertMarkerModal(plugin.app, previousMarker(editor) ?? '', (label) =>
		insertMarker(editor, label),
	).open();
}

/** Appends a marker to the end of the cursor's line, replacing any marker already there. */
function insertMarker(editor: Editor, label: string) {
	const lineNo = editor.getCursor().line;
	const line = editor.getLine(lineNo);
	const withoutMarker = line.replace(/\s*%%@[^%]*%%/g, '').trimEnd();
	const sep = withoutMarker.length > 0 ? ' ' : '';
	editor.setLine(lineNo, `${withoutMarker}${sep}${formatMarker(label)}`);
}

/** The nearest marker at or above the cursor, used to prefill the modal. */
function previousMarker(editor: Editor): string | null {
	for (let i = editor.getCursor().line; i >= 0; i--) {
		const markers = findMarkers(editor.getLine(i));
		const last = markers[markers.length - 1];
		if (last) return last.label;
	}
	return null;
}
