import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EVAL_STATS, HOW_IT_WORKS_STAGES } from "@/constants";
import { LandingPage } from "../LandingPage";

// GSAP reads matchMedia when its plugins register, which is at import time.
vi.hoisted(() => {
	window.matchMedia = ((query: string) => ({
		matches: query.includes("prefers-reduced-motion: reduce"),
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
	})) as never;
	globalThis.ResizeObserver = class {
		observe() {}
		disconnect() {}
	} as never;
});

describe("LandingPage under reduced motion", () => {
	it("shows every section at rest with no preloader", () => {
		const { container } = render(<LandingPage fontClassName="" />);

		expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
			"Ask anything you've ever saved.",
		);
		for (const stage of HOW_IT_WORKS_STAGES) {
			expect(screen.getByRole("heading", { name: stage.title })).not.toBeNull();
		}
		expect(container.querySelector("[data-preloader-text]")).toBeNull();
	});

	it("shows the real eval numbers without counting from zero", () => {
		render(<LandingPage fontClassName="" />);

		const proof = document.getElementById("proof") as HTMLElement;
		for (const stat of EVAL_STATS) {
			expect(within(proof).getByText(stat.label)).not.toBeNull();
		}
		expect(within(proof).getByText("5.2")).not.toBeNull();
	});

	it("points every main call to action at the app", () => {
		render(<LandingPage fontClassName="" />);

		const openLinks = screen.getAllByRole("link", { name: /Open the inbox/ });
		expect(openLinks.length).toBeGreaterThanOrEqual(3);
		for (const link of openLinks) expect(link.getAttribute("href")).toBe("/chats/new");
	});

	it("renders the cited answer in the product preview", () => {
		render(<LandingPage fontClassName="" />);

		expect(screen.getByText("Verified against sources", { selector: "span" })).not.toBeNull();
		expect(screen.getByText("Project Falcon onboarding guide")).not.toBeNull();
	});
});
