"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
	const media = window.matchMedia(QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
};

/** Server render assumes reduced motion, so nothing animates before hydration. */
export const usePrefersReducedMotion = () =>
	useSyncExternalStore(
		subscribe,
		() => window.matchMedia(QUERY).matches,
		() => true,
	);
