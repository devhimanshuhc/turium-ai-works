"use client";

import { animate } from "animejs";
import { useRef } from "react";
import { EVAL_NOTE, EVAL_STATS } from "@/constants";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { formatStat } from "@/utils";

/** Real numbers from the eval run, counted up (anime.js) when they scroll into view. */
export function Stats() {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_OK, () => {
				const counters = gsap.utils.toArray<HTMLElement>("[data-stat-value]");
				for (const counter of counters)
					counter.textContent = formatStat(0, Number(counter.dataset.decimals));
				const trigger = ScrollTrigger.create({
					trigger: sectionRef.current,
					start: "top 65%",
					once: true,
					onEnter: () => {
						for (const counter of counters) {
							const decimals = Number(counter.dataset.decimals);
							const progress = { value: 0 };
							animate(progress, {
								value: Number(counter.dataset.statValue),
								duration: 1800,
								ease: "outExpo",
								onUpdate: () => {
									counter.textContent = formatStat(progress.value, decimals);
								},
							});
						}
					},
				});
				return () => trigger.kill();
			});
			return () => mm.revert();
		},
		{ scope: sectionRef },
	);

	return (
		<section
			id="proof"
			ref={sectionRef}
			className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col justify-center gap-14 px-6 py-24 md:px-10"
		>
			<h2 className="text-[clamp(2.25rem,4.6vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
				Measured,{" "}
				<em className="font-(family-name:--font-display-serif) font-normal text-(--landing-accent) italic">
					not promised.
				</em>
			</h2>
			<dl className="grid gap-px overflow-hidden rounded-3xl border border-(--landing-line) bg-(--landing-line) sm:grid-cols-2 lg:grid-cols-4">
				{EVAL_STATS.map((stat) => (
					<div
						key={stat.label}
						className="flex flex-col gap-4 bg-(--landing-ink) p-8"
					>
						<dd className="order-1 text-[clamp(3rem,5vw,4.5rem)] leading-none font-semibold tracking-tighter tabular-nums">
							<span data-stat-value={stat.value} data-decimals={stat.decimals}>
								{formatStat(stat.value, stat.decimals)}
							</span>
							<span className="text-(--landing-accent)">{stat.suffix}</span>
						</dd>
						<dt className="order-2 text-sm text-(--landing-muted)">
							{stat.label}
						</dt>
					</div>
				))}
			</dl>
			<p className="max-w-2xl text-sm text-(--landing-muted)">{EVAL_NOTE}</p>
		</section>
	);
}
