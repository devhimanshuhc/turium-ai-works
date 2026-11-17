import type { SVGProps } from "react";
import { type IsoBox as IsoBoxShape, isoBoxFaces } from "@/utils";

export const ISO_TONES = {
	paper: { top: "#f3f0e8", left: "#d6d2c7", right: "#b8b4a9" },
	accent: { top: "#d6f25c", left: "#b4cf43", right: "#8fa832" },
	ink: { top: "#2c2d29", left: "#222320", right: "#1a1b18" },
	slate: { top: "#3d3f39", left: "#30322d", right: "#262823" },
} as const;

export type IsoTone = keyof typeof ISO_TONES;

type IsoBoxProps = IsoBoxShape & { tone: IsoTone } & SVGProps<SVGGElement>;

export function IsoBox({
	x,
	y,
	z,
	width,
	depth,
	height,
	tone,
	...groupProps
}: IsoBoxProps) {
	const faces = isoBoxFaces({ x, y, z, width, depth, height });
	const colours = ISO_TONES[tone];
	return (
		<g {...groupProps}>
			<polygon points={faces.left} fill={colours.left} />
			<polygon points={faces.right} fill={colours.right} />
			<polygon points={faces.top} fill={colours.top} />
		</g>
	);
}

export function IsoCanvas({
	children,
	label,
}: {
	children: React.ReactNode;
	label: string;
}) {
	return (
		<svg
			viewBox="-170 -130 340 260"
			role="img"
			aria-label={label}
			className="h-auto w-full max-w-[420px] overflow-visible"
		>
			{children}
		</svg>
	);
}
