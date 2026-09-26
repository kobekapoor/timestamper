/**
 * Timestamp markers are written as Obsidian comments so they never leak into
 * exports or other Markdown tools: `%%@1:30%%` or `%%@1:02:15%%`.
 */
export const MARKER_REGEX = /%%@\s*(\d{1,2}(?::\d{1,2}){1,2})\s*%%/g;

export interface MarkerMatch {
	/** Offset of the marker within the searched text. */
	from: number;
	to: number;
	/** Normalized display label, e.g. `1:30` or `1:02:15`. */
	label: string;
}

export function findMarkers(text: string): MarkerMatch[] {
	const matches: MarkerMatch[] = [];
	for (const m of text.matchAll(MARKER_REGEX)) {
		const raw = m[1];
		if (raw === undefined || m.index === undefined) continue;
		const label = normalizeTime(raw);
		if (label === null) continue;
		matches.push({ from: m.index, to: m.index + m[0].length, label });
	}
	return matches;
}

/**
 * Parses `m:ss` or `h:mm:ss` and returns a normalized label, or null when the
 * input isn't a valid time.
 */
export function normalizeTime(input: string): string | null {
	const parts = input.trim().split(':');
	if (parts.length < 2 || parts.length > 3) return null;
	if (!parts.every((p) => /^\d{1,2}$/.test(p))) return null;

	const nums = parts.map(Number);
	// Every part after the first is a sexagesimal field.
	if (nums.slice(1).some((n) => n > 59)) return null;

	const pad = (n: number) => n.toString().padStart(2, '0');
	if (nums.length === 3) {
		const [h, m, s] = nums as [number, number, number];
		return `${h}:${pad(m)}:${pad(s)}`;
	}
	const [m, s] = nums as [number, number];
	return `${m}:${pad(s)}`;
}

export function formatMarker(label: string): string {
	return `%%@${label}%%`;
}
