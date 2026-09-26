import { App, PluginSettingTab, Setting } from 'obsidian';
import type TimestamperPlugin from './main';

export type MarkerStyle = 'badge' | 'ribbon';
export type MarkerPlacement = 'margin' | 'inline';
export type MarkerFont = 'monospace' | 'interface' | 'text' | 'custom';

export interface MarkerColors {
	/** Hex colour, or empty to follow the theme. */
	background: string;
	text: string;
}

export interface TimestamperSettings {
	/** Show the times at all. Markers stay in the note either way. */
	showMarkers: boolean;
	/** `badge` shows a pill per marker; `ribbon` shows a strip down the whole note. */
	style: MarkerStyle;
	/** Badge only. `margin` sits outside the text column; `inline` at the right edge of the text. */
	placement: MarkerPlacement;
	badgeColors: MarkerColors;
	ribbonColors: MarkerColors;
	/** Font for the times, shared by both styles. */
	font: MarkerFont;
	/** CSS font-family used when `font` is `custom`, e.g. `Georgia` or `"Fira Code"`. */
	customFont: string;
	/** Hide the raw `%%@1:30%%` text in live preview unless the cursor is on that line. */
	hideMarkerText: boolean;
}

export const DEFAULT_SETTINGS: TimestamperSettings = {
	showMarkers: true,
	style: 'badge',
	placement: 'margin',
	badgeColors: { background: '', text: '' },
	ribbonColors: { background: '', text: '' },
	font: 'monospace',
	customFont: '',
	hideMarkerText: true,
};

export class TimestamperSettingTab extends PluginSettingTab {
	plugin: TimestamperPlugin;

	constructor(app: App, plugin: TimestamperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.settings;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Show timestamps')
			.setDesc('Turn off to hide all times without removing the markers. Also available as a command.')
			.addToggle((toggle) =>
				toggle.setValue(settings.showMarkers).onChange(async (value) => {
					settings.showMarkers = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Marker style')
			.setDesc('Badges show a small label next to each marker. A ribbon runs down the whole note.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('badge', 'Badge')
					.addOption('ribbon', 'Ribbon')
					.setValue(settings.style)
					.onChange(async (value) => {
						settings.style = value as MarkerStyle;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (settings.style === 'badge') {
			new Setting(containerEl)
				.setName('Badge placement')
				.setDesc(
					'Right margin works best with readable line length turned on. Use right edge of text if badges get cut off. Phones and tablets always use right edge of text.',
				)
				.addDropdown((dropdown) =>
					dropdown
						.addOption('margin', 'Right margin')
						.addOption('inline', 'Right edge of text')
						.setValue(settings.placement)
						.onChange(async (value) => {
							settings.placement = value as MarkerPlacement;
							await this.plugin.saveSettings();
						}),
				);
		}

		const colors = settings.style === 'ribbon' ? settings.ribbonColors : settings.badgeColors;
		const label = settings.style === 'ribbon' ? 'Ribbon' : 'Badge';
		this.addColorSetting(`${label} background colour`, colors, 'background');
		this.addColorSetting(`${label} text colour`, colors, 'text');

		new Setting(containerEl)
			.setName('Font')
			.setDesc('Font used for the times.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('monospace', 'Monospace')
					.addOption('interface', 'Interface font')
					.addOption('text', 'Text font')
					.addOption('custom', 'Custom')
					.setValue(settings.font)
					.onChange(async (value) => {
						settings.font = value as MarkerFont;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (settings.font === 'custom') {
			new Setting(containerEl)
				.setName('Custom font')
				.setDesc(
					'Name of a font installed on this device. Falls back to monospace if it isn\'t available.',
				)
				.addText((text) =>
					text
						.setPlaceholder('Georgia')
						.setValue(settings.customFont)
						.onChange(async (value) => {
							settings.customFont = value.trim();
							await this.plugin.saveSettings();
						}),
				);
		}

		new Setting(containerEl)
			.setName('Hide marker text while editing')
			.setDesc('In live preview, hide the raw marker text unless the cursor is on that line.')
			.addToggle((toggle) =>
				toggle.setValue(settings.hideMarkerText).onChange(async (value) => {
					settings.hideMarkerText = value;
					await this.plugin.saveSettings();
				}),
			);
	}

	private addColorSetting(name: string, colors: MarkerColors, key: keyof MarkerColors) {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(colors[key] ? `Custom: ${colors[key]}` : 'Following your theme.')
			.addColorPicker((picker) => {
				if (colors[key]) picker.setValue(colors[key]);
				picker.onChange(async (value) => {
					colors[key] = value;
					await this.plugin.saveSettings();
					this.display();
				});
			})
			.addExtraButton((button) =>
				button
					.setIcon('rotate-ccw')
					.setTooltip('Reset to theme default')
					.setDisabled(!colors[key])
					.onClick(async () => {
						colors[key] = '';
						await this.plugin.saveSettings();
						this.display();
					}),
			);
	}
}
