"use client";

import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { APP_ENTRY_PATH } from "@/constants";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";
import { MagneticButton } from "./MagneticButton";

export function FinalCta() {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_OK, () => {
				const split = SplitText.create("[data-cta-title]", {
					type: "chars,lines",
					mask: "lines",
				});
				gsap.from(split.chars, {
					yPercent: 110,
					stagger: 0.015,
					duration: 1,
					ease: "expo.out",
					scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
				});
				return () => split.revert();
			});
			return () => mm.revert();
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col items-start justify-center gap-10 px-6 py-24 md:px-10"
		>
			<h2
				data-cta-title
				className="text-[clamp(3rem,9vw,9.5rem)] leading-[0.9] font-semibold tracking-[-0.05em]"
			>
				Your notes already know the answer.
			</h2>
			<MagneticButton href={APP_ENTRY_PATH} className="h-16 px-8 text-base">
				Open the inbox <ArrowRight className="size-5" />
			</MagneticButton>
		</section>
	);
}
