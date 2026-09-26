import { Plugin } from 'obsidian';
import { Appearance } from './appearance';
import { registerCommands } from './commands';
import { timestampExtension } from './editor/timestamp-extension';
import { readingViewProcessor } from './reading-view';
import {
	DEFAULT_SETTINGS,
	TimestamperSettings,
	TimestamperSettingTab,
} from './settings';

export default class TimestamperPlugin extends Plugin {
	settings!: TimestamperSettings;
	private appearance!: Appearance;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(timestampExtension(() => this.settings));
		this.registerMarkdownPostProcessor(readingViewProcessor);
		registerCommands(this);
		this.addSettingTab(new TimestamperSettingTab(this.app, this));

		this.appearance = new Appearance(this, () => this.settings);
		this.appearance.load();
	}

	onunload() {
		this.appearance.unload();
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<TimestamperSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...data,
			// Copy nested objects so edits never mutate DEFAULT_SETTINGS.
			badgeColors: { ...DEFAULT_SETTINGS.badgeColors, ...data?.badgeColors },
			ribbonColors: { ...DEFAULT_SETTINGS.ribbonColors, ...data?.ribbonColors },
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.appearance.apply();
		// Re-render open editors so the hide-text setting takes effect immediately.
		this.app.workspace.updateOptions();
	}
}
