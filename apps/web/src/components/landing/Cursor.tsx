"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const INTERACTIVE = "a, button, [data-cursor='grow']";

/** A dot that tracks the pointer and swells over anything clickable (fine pointers only). */
export function Cursor() {
	const dotRef = useRef<HTMLDivElement>(null);

	useGSAP(() => {
		const dot = dotRef.current;
		const landing = dot?.closest(".landing");
		if (!dot || !landing) return;
		const mm = gsap.matchMedia();
		mm.add(
			"(pointer: fine) and (prefers-reduced-motion: no-preference)",
			() => {
				landing.classList.add("has-cursor");
				gsap.set(dot, { autoAlpha: 1 });
				const moveX = gsap.quickTo(dot, "x", {
					duration: 0.35,
					ease: "power3",
				});
				const moveY = gsap.quickTo(dot, "y", {
					duration: 0.35,
					ease: "power3",
				});
				const onMove = (event: PointerEvent) => {
					moveX(event.clientX);
					moveY(event.clientY);
					const overInteractive = (event.target as Element | null)?.closest(
						INTERACTIVE,
					);
					gsap.to(dot, {
						scale: overInteractive ? 3.2 : 1,
						duration: 0.3,
						overwrite: "auto",
					});
				};
				window.addEventListener("pointermove", onMove);
				return () => {
					window.removeEventListener("pointermove", onMove);
					landing.classList.remove("has-cursor");
				};
			},
		);
		return () => mm.revert();
	});

	return (
		<div
			ref={dotRef}
			aria-hidden="true"
			className="pointer-events-none invisible fixed top-0 left-0 z-[65] -mt-1.5 -ml-1.5 size-3 rounded-full bg-(--landing-accent) opacity-0 mix-blend-difference"
		/>
	);
}
