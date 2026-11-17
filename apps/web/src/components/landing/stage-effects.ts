import { animate, stagger } from "animejs";

/** anime.js details that play once a How-it-works stage slides into view. */
export const playStageEffects = (panel: Element) => {
	const drops = panel.querySelectorAll("[data-iso-drop]");
	if (drops.length) {
		animate(drops, {
			translateY: [-60, 0],
			opacity: [0, 1],
			delay: stagger(110),
			duration: 900,
			ease: "outBounce",
		});
	}
	const chunks = panel.querySelectorAll("[data-stage-chunk]");
	if (chunks.length) {
		animate(chunks, {
			translateY: [24, 0],
			opacity: [0, 1],
			delay: stagger(80, { grid: [3, 2], from: "first" }),
			duration: 800,
			ease: "outElastic(1, .6)",
		});
	}
	const bars = panel.querySelectorAll("[data-stage-bar]");
	if (bars.length) {
		animate(bars, {
			scaleY: [0, 1],
			delay: stagger(90),
			duration: 1200,
			ease: "outExpo",
		});
	}
};
