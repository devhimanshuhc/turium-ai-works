"use client";

import { useRef } from "react";
import { STATEMENT } from "@/constants";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

/** Words brighten one by one as the statement scrolls through the screen. */
export function Statement() {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_OK, () => {
				const split = SplitText.create("[data-statement]", { type: "words" });
				gsap.fromTo(
					split.words,
					{ opacity: 0.12 },
					{
						opacity: 1,
						stagger: 0.1,
						ease: "none",
						scrollTrigger: {
							trigger: sectionRef.current,
							start: "top 70%",
							end: "bottom 65%",
							scrub: true,
						},
					},
				);
				return () => split.revert();
			});
			return () => mm.revert();
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			aria-labelledby="statement-heading"
			className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col justify-center gap-8 px-6 py-24 md:px-10"
		>
			<h2 id="statement-heading" className="text-sm text-(--landing-accent)">
				Guardrails
			</h2>
			<p
				data-statement
				className="max-w-6xl text-[clamp(2rem,5vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.035em]"
			>
				{STATEMENT}
			</p>
		</section>
	);
}
