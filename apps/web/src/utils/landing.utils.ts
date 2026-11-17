export const formatStat = (value: number, decimals: number) =>
	value.toFixed(decimals);

export const padCounter = (value: number) =>
	String(Math.round(value)).padStart(3, "0");

/** Offset that pulls an element toward the pointer, capped at `strength` px. */
export const magneticOffset = (
	pointer: { x: number; y: number },
	rect: { left: number; top: number; width: number; height: number },
	strength: number,
) => {
	const dx = (pointer.x - (rect.left + rect.width / 2)) / (rect.width / 2);
	const dy = (pointer.y - (rect.top + rect.height / 2)) / (rect.height / 2);
	const clamp = (value: number) => Math.max(-1, Math.min(1, value));
	return { x: clamp(dx) * strength, y: clamp(dy) * strength };
};

/** Index of the grid cell under a point, for rippling a dot grid from it. */
export const gridIndexAt = (
	point: { x: number; y: number },
	size: { width: number; height: number },
	grid: { columns: number; rows: number },
) => {
	const column = Math.min(
		grid.columns - 1,
		Math.max(0, Math.floor((point.x / size.width) * grid.columns)),
	);
	const row = Math.min(
		grid.rows - 1,
		Math.max(0, Math.floor((point.y / size.height) * grid.rows)),
	);
	return row * grid.columns + column;
};

/** Splits "text [1] more [2]" into text parts and citation numbers. */
export const splitCitationMarkers = (text: string) =>
	text
		.split(/(\[\d+\])/)
		.filter(Boolean)
		.map((part) => {
			const match = /^\[(\d+)\]$/.exec(part);
			return match
				? { kind: "citation" as const, number: Number(match[1]) }
				: { kind: "text" as const, text: part };
		});
