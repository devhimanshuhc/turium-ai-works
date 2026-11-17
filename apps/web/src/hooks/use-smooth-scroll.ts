"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function useSmoothScroll(enabled: boolean) {
	useEffect(() => {
		if (!enabled) return;
		const lenis = new Lenis({ lerp: 0.1, anchors: true });
		const onTick = (time: number) => lenis.raf(time * 1000);
		lenis.on("scroll", ScrollTrigger.update);
		gsap.ticker.add(onTick);
		gsap.ticker.lagSmoothing(0);
		return () => {
			gsap.ticker.remove(onTick);
			lenis.destroy();
		};
	}, [enabled]);
}
