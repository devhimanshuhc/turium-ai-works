"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { APP_ENTRY_PATH, HERO_COPY } from "@/constants";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";
import { AnswerPreview } from "./AnswerPreview";
import { HeroDotGrid } from "./HeroDotGrid";
import { MagneticButton } from "./MagneticButton";

export function Hero({ isReady }: { isReady: boolean }) {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_OK, () => {
				const split = SplitText.create("[data-hero-title]", {
					type: "lines,words",
					mask: "lines",
				});
				gsap.set(split.words, { yPercent: 115 });
				gsap.set("[data-hero-fade]", { autoAlpha: 0, y: 24 });
				gsap.set("[data-hero-preview]", {
					clipPath: "inset(12% 8% 12% 8% round 24px)",
					autoAlpha: 0,
					scale: 0.94,
				});
				if (!isReady) return () => split.revert();
				gsap
					.timeline({ defaults: { ease: "expo.out" } })
					.to(split.words, { yPercent: 0, duration: 1.3, stagger: 0.06 })
					.to(
						"[data-hero-fade]",
						{ autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 },
						"-=0.9",
					)
					.to(
						"[data-hero-preview]",
						{
							clipPath: "inset(0% 0% 0% 0% round 16px)",
							autoAlpha: 1,
							scale: 1,
							duration: 1.4,
						},
						"-=1.1",
					);
				gsap.to("[data-hero-content]", {
					yPercent: -12,
					autoAlpha: 0.2,
					ease: "none",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top top",
						end: "bottom top",
						scrub: true,
					},
				});
				return () => split.revert();
			});
			return () => mm.revert();
		},
		{ scope: sectionRef, dependencies: [isReady], revertOnUpdate: true },
	);

	return (
		<section
			ref={sectionRef}
			data-cursor="grow"
			className="relative flex min-h-svh items-center overflow-hidden pt-24 pb-12"
		>
			<HeroDotGrid play={isReady} />
			<div
				data-hero-content
				className="relative mx-auto grid w-full max-w-[1440px] items-center gap-12 px-6 md:px-10 lg:grid-cols-[1.15fr_1fr]"
			>
				<div className="flex flex-col gap-7">
					<p data-hero-fade className="text-sm text-(--landing-accent)">
						{HERO_COPY.eyebrow}
					</p>
					<h1
						data-hero-title
						className="text-[clamp(3rem,7.4vw,7.5rem)] leading-[0.92] font-semibold tracking-[-0.045em]"
					>
						{`${HERO_COPY.headlineStart} `}
						<em className="font-(family-name:--font-display-serif) font-normal tracking-[-0.02em] text-(--landing-accent) italic">
							{HERO_COPY.headlineEmphasis}
						</em>
					</h1>
					<p
						data-hero-fade
						className="max-w-xl text-lg leading-relaxed text-(--landing-paper)/80"
					>
						{HERO_COPY.body}
					</p>
					<p data-hero-fade className="text-sm text-(--landing-muted)">
						{HERO_COPY.fact}
					</p>
					<div data-hero-fade className="flex flex-wrap gap-3">
						<MagneticButton href={APP_ENTRY_PATH}>
							Open the inbox <ArrowRight className="size-4" />
						</MagneticButton>
						<MagneticButton href="#how" variant="ghost">
							See how it works <ArrowDown className="size-4" />
						</MagneticButton>
					</div>
				</div>
				<AnswerPreview play={isReady} />
			</div>
		</section>
	);
}
