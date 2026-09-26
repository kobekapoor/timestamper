import { App, Modal, Notice, Setting } from 'obsidian';
import { normalizeTime } from '../markers';

export class InsertMarkerModal extends Modal {
	private value: string;

	constructor(
		app: App,
		initialValue: string,
		private onSubmit: (label: string) => void,
	) {
		super(app);
		this.value = initialValue;
	}

	onOpen() {
		this.setTitle('Insert timestamp marker');

		const submit = () => {
			const label = normalizeTime(this.value);
			if (!label) {
				new Notice('Enter a time like 1:30 or 1:02:15.');
				return;
			}
			this.close();
			this.onSubmit(label);
		};

		new Setting(this.contentEl)
			.setName('Time')
			.setDesc('Use m:ss or h:mm:ss.')
			.addText((text) => {
				text.setPlaceholder('1:30').setValue(this.value).onChange((v) => {
					this.value = v;
				});
				text.inputEl.addEventListener('keydown', (evt) => {
					if (evt.key === 'Enter') {
						evt.preventDefault();
						submit();
					}
				});
				window.setTimeout(() => text.inputEl.select(), 0);
			});

		new Setting(this.contentEl).addButton((btn) =>
			btn.setButtonText('Insert').setCta().onClick(submit),
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
