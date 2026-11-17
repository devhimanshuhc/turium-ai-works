"use client";

import { useRef } from "react";
import { HOW_IT_WORKS_STAGES } from "@/constants";
import { gsap, MOTION_OK_DESKTOP, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { IsoScene } from "./iso/IsoScenes.view";
import { playStageEffects } from "./stage-effects";

/** Pinned on desktop: vertical scroll drives a horizontal track of four stages. */
export function HowItWorks() {
	const sectionRef = useRef<HTMLElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const section = sectionRef.current;
			const track = trackRef.current;
			if (!section || !track) return;
			const mm = gsap.matchMedia();
			mm.add(MOTION_OK_DESKTOP, () => {
				// Horizontal layout exists only while this media query matches; GSAP
				// reverts these sets, so reduced motion and phones get a vertical stack.
				gsap.set(section, { height: "100svh", paddingBlock: "3.5rem" });
				gsap.set("[data-how-progress-track]", { display: "block" });
				gsap.set(track, { flexDirection: "row", width: "max-content" });
				gsap.set("[data-stage]", { width: "min(78vw, 1100px)" });
				const distance = () =>
					track.scrollWidth - (track.parentElement?.clientWidth ?? 0);
				const pinRange = {
					trigger: section,
					start: "top top",
					end: () => `+=${distance()}`,
				};
				const scroll = gsap.to(track, {
					x: () => -distance(),
					ease: "none",
					scrollTrigger: {
						...pinRange,
						pin: true,
						scrub: 1,
						invalidateOnRefresh: true,
					},
				});
				gsap.to("[data-how-progress]", {
					scaleX: 1,
					ease: "none",
					scrollTrigger: { ...pinRange, scrub: true },
				});
				gsap.utils
					.toArray<HTMLElement>("[data-stage]")
					.forEach((panel, index) => {
						// The first panel is already on screen when the pin starts, so it
						// keys off the section entering; the rest off the horizontal track.
						const enterAt = (horizontalStart: string) =>
							index === 0
								? { trigger: section, start: "top 55%" }
								: {
										trigger: panel,
										containerAnimation: scroll,
										start: horizontalStart,
									};
						gsap.from(panel.querySelectorAll("[data-stage-part]"), {
							y: 48,
							autoAlpha: 0,
							stagger: 0.12,
							duration: 0.9,
							ease: "expo.out",
							scrollTrigger: enterAt("left 70%"),
						});
						ScrollTrigger.create({
							...enterAt("left 60%"),
							once: true,
							onEnter: () => playStageEffects(panel),
						});
					});
			});
			return () => mm.revert();
		},
		{ scope: sectionRef },
	);

	return (
		<section
			id="how"
			ref={sectionRef}
			className="flex flex-col gap-10 overflow-hidden py-24"
		>
			<div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-6 md:px-10">
				<h2 className="max-w-3xl text-[clamp(2.25rem,4.6vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
					From a pile of files to an answer{" "}
					<em className="font-(family-name:--font-display-serif) font-normal text-(--landing-accent) italic">
						you can check.
					</em>
				</h2>
				<div
					data-how-progress-track
					className="hidden h-px w-full bg-(--landing-line)"
				>
					<div
						data-how-progress
						className="h-full origin-left scale-x-0 bg-(--landing-accent)"
					/>
				</div>
			</div>
			<div className="mx-auto w-full max-w-[1440px] flex-1 px-6 md:px-10">
				<div ref={trackRef} className="flex h-full flex-col gap-6">
					{HOW_IT_WORKS_STAGES.map((stage, index) => (
						<article
							key={stage.id}
							data-stage
							className="grid gap-8 rounded-3xl border border-(--landing-line) bg-(--landing-panel) p-8 md:grid-cols-2 md:p-12"
						>
							<div className="flex flex-col justify-between gap-6">
								<span className="text-[clamp(4rem,9vw,9rem)] leading-none font-semibold tracking-tighter text-transparent [-webkit-text-stroke:1px_var(--landing-muted)]">
									{String(index + 1).padStart(2, "0")}
								</span>
								<div className="flex flex-col gap-3">
									<h3 className="text-3xl font-semibold tracking-tight">
										{stage.title}
									</h3>
									<p className="max-w-sm leading-relaxed text-(--landing-paper)/75">
										{stage.body}
									</p>
								</div>
							</div>
							<div
								data-stage-part
								className="flex items-center justify-center rounded-2xl bg-(--landing-ink)/60 p-6"
							>
								<IsoScene stage={stage.id} />
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
