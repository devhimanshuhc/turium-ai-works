"use client";

import Link from "next/link";
import { type ReactNode, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { magneticOffset } from "@/utils";

type MagneticButtonProps = {
	href: string;
	children: ReactNode;
	variant?: "accent" | "ghost";
	className?: string;
};

const VARIANTS = {
	accent:
		"bg-(--landing-accent) text-(--landing-accent-ink) hover:bg-(--landing-paper)",
	ghost:
		"border border-(--landing-line) text-(--landing-paper) hover:border-(--landing-paper)",
};

/** A link that leans toward the pointer and springs back when it leaves. */
export function MagneticButton({
	href,
	children,
	variant = "accent",
	className = "",
}: MagneticButtonProps) {
	const linkRef = useRef<HTMLAnchorElement>(null);

	useGSAP(() => {
		const link = linkRef.current;
		if (!link) return;
		const mm = gsap.matchMedia();
		mm.add(
			"(pointer: fine) and (prefers-reduced-motion: no-preference)",
			() => {
				const moveX = gsap.quickTo(link, "x", {
					duration: 0.5,
					ease: "power3",
				});
				const moveY = gsap.quickTo(link, "y", {
					duration: 0.5,
					ease: "power3",
				});
				const onMove = (event: PointerEvent) => {
					const offset = magneticOffset(
						{ x: event.clientX, y: event.clientY },
						link.getBoundingClientRect(),
						14,
					);
					moveX(offset.x);
					moveY(offset.y);
				};
				const onLeave = () =>
					gsap.to(link, {
						x: 0,
						y: 0,
						duration: 0.8,
						ease: "elastic.out(1, 0.4)",
					});
				link.addEventListener("pointermove", onMove);
				link.addEventListener("pointerleave", onLeave);
				return () => {
					link.removeEventListener("pointermove", onMove);
					link.removeEventListener("pointerleave", onLeave);
				};
			},
		);
		return () => mm.revert();
	});

	return (
		<Link
			ref={linkRef}
			href={href}
			className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-[background-color,border-color,scale] duration-200 active:scale-95 ${VARIANTS[variant]} ${className}`}
		>
			{children}
		</Link>
	);
}
