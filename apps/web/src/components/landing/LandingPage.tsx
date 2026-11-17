"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion, useSmoothScroll } from "@/hooks";
import { ScrollTrigger } from "@/lib/gsap";
import { Cursor } from "./Cursor";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { LandingFooter } from "./LandingFooter.view";
import { LandingNav } from "./LandingNav.view";
import { Marquee } from "./Marquee";
import { Preloader } from "./Preloader";
import { Statement } from "./Statement";
import { Stats } from "./Stats";

const PRELOADER_SEEN_KEY = "landing-preloader-seen";

const hasSeenPreloader = () => {
	try {
		return sessionStorage.getItem(PRELOADER_SEEN_KEY) === "1";
	} catch {
		return true;
	}
};

export function LandingPage({ fontClassName }: { fontClassName: string }) {
	const reduceMotion = usePrefersReducedMotion();
	const [showPreloader, setShowPreloader] = useState(false);
	const [isReady, setIsReady] = useState(false);
	useSmoothScroll(!reduceMotion);

	useEffect(() => {
		if (reduceMotion || hasSeenPreloader()) return setIsReady(true);
		setShowPreloader(true);
	}, [reduceMotion]);

	useEffect(() => {
		document.fonts?.ready.then(() => ScrollTrigger.refresh());
	}, []);

	const finishPreloader = () => {
		try {
			sessionStorage.setItem(PRELOADER_SEEN_KEY, "1");
		} catch {}
		setShowPreloader(false);
		setIsReady(true);
	};

	return (
		<div className={`landing ${fontClassName} min-h-svh`}>
			{showPreloader && <Preloader onDone={finishPreloader} />}
			<Cursor />
			<div aria-hidden="true" className="landing-grain" />
			<LandingNav />
			<main>
				<Hero isReady={isReady} />
				<Marquee />
				<HowItWorks />
				<Statement />
				<Stats />
				<FinalCta />
			</main>
			<LandingFooter />
		</div>
	);
}
