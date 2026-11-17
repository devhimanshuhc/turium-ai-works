const COS_30 = Math.cos(Math.PI / 6);
const SIN_30 = 0.5;

export type IsoPoint = { x: number; y: number; z: number };
export type IsoBox = IsoPoint & {
	width: number;
	depth: number;
	height: number;
};

/** Standard isometric projection: +x runs down-right, +y down-left, +z up. */
export const projectIso = ({ x, y, z }: IsoPoint) => ({
	x: (x - y) * COS_30,
	y: (x + y) * SIN_30 - z,
});

const toPoints = (corners: IsoPoint[]) =>
	corners
		.map(projectIso)
		.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
		.join(" ");

/** The three faces of a box a viewer sees from the front: top, left (+y) and right (+x). */
export const isoBoxFaces = ({ x, y, z, width, depth, height }: IsoBox) => {
	const top = z + height;
	const front = y + depth;
	const side = x + width;
	return {
		top: toPoints([
			{ x, y, z: top },
			{ x: side, y, z: top },
			{ x: side, y: front, z: top },
			{ x, y: front, z: top },
		]),
		left: toPoints([
			{ x, y: front, z },
			{ x: side, y: front, z },
			{ x: side, y: front, z: top },
			{ x, y: front, z: top },
		]),
		right: toPoints([
			{ x: side, y, z },
			{ x: side, y: front, z },
			{ x: side, y: front, z: top },
			{ x: side, y, z: top },
		]),
	};
};
