"use client";

import { Asterisk } from "lucide-react";
import { useRef } from "react";
import { MARQUEE_WORDS } from "@/constants";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
	return (
		<div
			data-marquee-row={reverse ? "reverse" : "forward"}
			className="flex w-max"
		>
			{[0, 1].map((copy) => (
				<div
					key={copy}
					aria-hidden={copy === 1}
					className="flex shrink-0 items-center"
				>
					{MARQUEE_WORDS.map((word) => (
						<span
							key={word}
							className="flex items-center gap-8 px-8 text-[clamp(2.5rem,6vw,5.5rem)] leading-none font-semibold tracking-[-0.04em]"
						>
							{word}
							<Asterisk className="size-[0.6em] text-(--landing-accent)" />
						</span>
					))}
				</div>
			))}
		</div>
	);
}

/** Two endless rows that speed up, and flip direction, with the scroll. */
export function Marquee() {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_OK, () => {
				const loops = gsap.utils
					.toArray<HTMLElement>("[data-marquee-row]")
					.map((row) => {
						const reverse = row.dataset.marqueeRow === "reverse";
						return gsap.fromTo(
							row,
							{ xPercent: reverse ? -50 : 0 },
							{
								xPercent: reverse ? 0 : -50,
								duration: 28,
								ease: "none",
								repeat: -1,
							},
						);
					});
				const trigger = ScrollTrigger.create({
					trigger: sectionRef.current,
					onUpdate: (self) => {
						const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 5);
						for (const loop of loops) {
							gsap.to(loop, {
								timeScale: boost * self.direction,
								duration: 0.3,
								overwrite: true,
							});
							gsap.to(loop, {
								timeScale: self.direction,
								duration: 1.2,
								delay: 0.3,
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
			ref={sectionRef}
			aria-label="What Knowledge Inbox reads and does"
			className="flex flex-col gap-6 overflow-hidden border-y border-(--landing-line) py-14"
		>
			<MarqueeRow />
			<div className="text-(--landing-paper)/25">
				<MarqueeRow reverse />
			</div>
		</section>
	);
}
