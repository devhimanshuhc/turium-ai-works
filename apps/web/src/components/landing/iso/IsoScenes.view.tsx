import type { HowItWorksStageId } from "@/constants";
import { IsoBox, IsoCanvas } from "./IsoBox.view";

const GROW_FROM_BASE = {
	transformBox: "fill-box",
	transformOrigin: "50% 100%",
} as const;

function SaveScene() {
	return (
		<IsoCanvas label="Text, a link and a file dropping into a knowledge base">
			<IsoBox
				x={-70}
				y={-70}
				z={-30}
				width={140}
				depth={140}
				height={14}
				tone="ink"
			/>
			<IsoBox
				x={-60}
				y={-60}
				z={-16}
				width={120}
				depth={120}
				height={4}
				tone="slate"
			/>
			{[
				{ x: -50, y: 10, tone: "paper" as const },
				{ x: -20, y: -20, tone: "accent" as const },
				{ x: 10, y: -50, tone: "paper" as const },
			].map((tile, index) => (
				<g key={tile.x} data-iso-drop>
					<IsoBox
						x={tile.x}
						y={tile.y}
						z={-12 + index * 10}
						width={40}
						depth={40}
						height={6}
						tone={tile.tone}
					/>
				</g>
			))}
		</IsoCanvas>
	);
}

function ChunkScene() {
	const parents = [-46, 10];
	return (
		<IsoCanvas label="A document split into sections and small chunks">
			{parents.map((parentY) => (
				<g key={parentY}>
					<IsoBox
						x={-72}
						y={parentY}
						z={-30}
						width={144}
						depth={44}
						height={10}
						tone="slate"
					/>
					{[-62, -14, 34].map((childX) => (
						<g key={childX} data-stage-chunk>
							<IsoBox
								x={childX}
								y={parentY + 8}
								z={-20}
								width={30}
								depth={28}
								height={18}
								tone={childX === -14 && parentY === -46 ? "accent" : "paper"}
							/>
						</g>
					))}
				</g>
			))}
		</IsoCanvas>
	);
}

const MEANING = [70, 52, 34, 20];
const EXACT = [40, 66, 24, 14];

function SearchScene() {
	return (
		<IsoCanvas label="Two rankings, by meaning and by exact words, rising side by side">
			<IsoBox
				x={-80}
				y={-80}
				z={-40}
				width={160}
				depth={160}
				height={8}
				tone="ink"
			/>
			{MEANING.map((height, index) => (
				<g key={`meaning-${height}`} data-stage-bar style={GROW_FROM_BASE}>
					<IsoBox
						x={-64 + index * 34}
						y={-52}
						z={-32}
						width={22}
						depth={22}
						height={height}
						tone="accent"
					/>
				</g>
			))}
			{EXACT.map((height, index) => (
				<g key={`exact-${height}`} data-stage-bar style={GROW_FROM_BASE}>
					<IsoBox
						x={-64 + index * 34}
						y={14}
						z={-32}
						width={22}
						depth={22}
						height={height}
						tone="paper"
					/>
				</g>
			))}
		</IsoCanvas>
	);
}

function AnswerScene() {
	return (
		<IsoCanvas label="An answer card with a citation and a verified badge">
			<IsoBox
				x={-80}
				y={-60}
				z={-34}
				width={160}
				depth={120}
				height={10}
				tone="ink"
			/>
			<g data-iso-drop>
				<IsoBox
					x={-64}
					y={-44}
					z={-24}
					width={128}
					depth={88}
					height={6}
					tone="paper"
				/>
			</g>
			{[-30, -6, 18].map((lineY, index) => (
				<g key={lineY} data-iso-drop>
					<IsoBox
						x={-52}
						y={lineY}
						z={-18}
						width={index === 2 ? 60 : 92}
						depth={8}
						height={2}
						tone="slate"
					/>
				</g>
			))}
			<g data-iso-drop>
				<IsoBox
					x={44}
					y={-30}
					z={-18}
					width={14}
					depth={14}
					height={14}
					tone="accent"
				/>
			</g>
			<g data-iso-drop>
				<IsoBox
					x={30}
					y={22}
					z={-18}
					width={22}
					depth={22}
					height={34}
					tone="accent"
				/>
			</g>
		</IsoCanvas>
	);
}

const SCENES: Record<HowItWorksStageId, () => React.JSX.Element> = {
	save: SaveScene,
	chunk: ChunkScene,
	search: SearchScene,
	answer: AnswerScene,
};

export function IsoScene({ stage }: { stage: HowItWorksStageId }) {
	const Scene = SCENES[stage];
	return <Scene />;
}
