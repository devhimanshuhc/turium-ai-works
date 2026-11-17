"use client";

import { animate, stagger } from "animejs";
import { useEffect, useRef, useState } from "react";
import { gridIndexAt } from "@/utils";

const SPACING_PX = 34;

type Grid = { columns: number; rows: number };

/** anime.js grid stagger: a ripple runs through the dots on load and from every click. */
export function HeroDotGrid({ play }: { play: boolean }) {
	const gridRef = useRef<HTMLDivElement>(null);
	const [grid, setGrid] = useState<Grid>({ columns: 0, rows: 0 });

	useEffect(() => {
		const element = gridRef.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => {
			setGrid({
				columns: Math.ceil(entry.contentRect.width / SPACING_PX),
				rows: Math.ceil(entry.contentRect.height / SPACING_PX),
			});
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const element = gridRef.current;
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (!element || !play || !grid.columns || reduceMotion) return;

		const ripple = (from: number | "center") =>
			animate(element.children, {
				scale: [
					{ to: 2.4, duration: 260 },
					{ to: 1, duration: 700 },
				],
				opacity: [
					{ to: 1, duration: 260 },
					{ to: 0.22, duration: 900 },
				],
				backgroundColor: [
					{ to: "#d6f25c", duration: 260 },
					{ to: "#f3f0e8", duration: 900 },
				],
				delay: stagger(26, { grid: [grid.columns, grid.rows], from }),
				ease: "outQuad",
			});

		const intro = ripple("center");
		const section = element.closest("section");
		const onClick = (event: MouseEvent) => {
			const rect = element.getBoundingClientRect();
			ripple(
				gridIndexAt(
					{ x: event.clientX - rect.left, y: event.clientY - rect.top },
					rect,
					grid,
				),
			);
		};
		section?.addEventListener("click", onClick);
		return () => {
			intro.revert();
			section?.removeEventListener("click", onClick);
		};
	}, [play, grid]);

	return (
		<div
			ref={gridRef}
			aria-hidden="true"
			className="absolute inset-0 grid place-items-center [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_75%)]"
			style={{
				gridTemplateColumns: `repeat(${grid.columns || 1}, minmax(0, 1fr))`,
			}}
		>
			{Array.from({ length: grid.columns * grid.rows }, (_, index) => (
				<span
					key={index}
					className="size-[3px] rounded-full bg-(--landing-paper) opacity-[0.22]"
				/>
			))}
		</div>
	);
}
