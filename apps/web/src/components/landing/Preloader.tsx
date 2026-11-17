"use client";

import { animate } from "animejs";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { padCounter } from "@/utils";

const COUNT_DURATION_MS = 1400;

/** A 000→100 counter (anime.js) followed by a curtain lifting off the page (GSAP). */
export function Preloader({ onDone }: { onDone: () => void }) {
	const rootRef = useRef<HTMLDivElement>(null);
	const counterRef = useRef<HTMLSpanElement>(null);
	const barRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const progress = { value: 0 };
			const counting = animate(progress, {
				value: 100,
				duration: COUNT_DURATION_MS,
				ease: "inOutExpo",
				onUpdate: () => {
					if (counterRef.current)
						counterRef.current.textContent = padCounter(progress.value);
					if (barRef.current)
						barRef.current.style.transform = `scaleX(${progress.value / 100})`;
				},
				onComplete: () => {
					gsap
						.timeline({ onComplete: onDone })
						.to("[data-preloader-text]", {
							yPercent: -120,
							duration: 0.5,
							ease: "power3.in",
						})
						.to(
							rootRef.current,
							{
								clipPath: "inset(0 0 100% 0)",
								duration: 0.9,
								ease: "expo.inOut",
							},
							"-=0.1",
						);
				},
			});
			return () => counting.revert();
		},
		{ scope: rootRef },
	);

	return (
		<div
			ref={rootRef}
			aria-hidden="true"
			className="fixed inset-0 z-[70] flex flex-col justify-between bg-(--landing-paper) p-6 text-(--landing-ink) [clip-path:inset(0_0_0_0)] md:p-10"
		>
			<p data-preloader-text className="text-sm font-medium tracking-tight">
				Knowledge Inbox
			</p>
			<div className="overflow-hidden">
				<span
					ref={counterRef}
					data-preloader-text
					className="block text-[22vw] leading-none font-semibold tracking-tighter tabular-nums md:text-[16vw]"
				>
					000
				</span>
			</div>
			<div className="h-px w-full bg-(--landing-ink)/15">
				<div
					ref={barRef}
					className="h-full origin-left scale-x-0 bg-(--landing-ink)"
				/>
			</div>
		</div>
	);
}
