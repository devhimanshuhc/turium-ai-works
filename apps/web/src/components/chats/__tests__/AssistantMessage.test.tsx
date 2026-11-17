import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Citation, Message } from "@/types";
import { AssistantMessage } from "../AssistantMessage";

const citation = (number: number, cited: boolean): Citation => ({
	number,
	item_id: `item-${number}`,
	parent_chunk_id: `chunk-${number}`,
	title: `Source ${number}`,
	url: number === 1 ? "https://example.com/doc" : null,
	source_type: number === 1 ? "url" : "note",
	snippet: `Snippet ${number}`,
	content: `Before. Snippet ${number} After.`,
	score: 0.1,
	cited,
});

const message = (overrides: Partial<Message> = {}): Message => ({
	id: "m1",
	role: "assistant",
	content: "Deploys freeze on Fridays [1].",
	citations: [citation(1, true), citation(2, false)],
	grounding: { verdict: "grounded", unsupported_claims: [], explanation: "", invalid_citations: [] },
	created_at: "2026-01-01T00:00:00Z",
	...overrides,
});

const scrollIntoView = vi.fn();

beforeEach(() => {
	scrollIntoView.mockClear();
	Element.prototype.scrollIntoView = scrollIntoView;
});

describe("AssistantMessage", () => {
	it("keeps sources out of the answer until the sheet is opened", () => {
		render(<AssistantMessage message={message()} />);

		expect(screen.getByRole("button", { name: /2 sources/ })).not.toBeNull();
		expect(screen.queryByText("Source 1")).toBeNull();
	});

	it("opens the sheet with cited sources first and the full section that was read", async () => {
		render(<AssistantMessage message={message()} />);

		await userEvent.click(screen.getByRole("button", { name: /2 sources/ }));

		const sheet = screen.getByRole("dialog");
		expect(within(sheet).getByText("Cited in the answer (1)")).not.toBeNull();
		expect(within(sheet).getByText("Also retrieved (1)")).not.toBeNull();
		expect(within(sheet).queryByText("Before.")).toBeNull();
		expect(within(sheet).getByRole("link", { name: /Source 1/ }).getAttribute("href")).toBe(
			"https://example.com/doc",
		);

		await userEvent.click(within(sheet).getByRole("button", { name: /Source 1/ }));

		expect(within(sheet).getByText("Before.")).not.toBeNull();
		const highlighted = within(sheet)
			.getAllByText("Snippet 1")
			.find((element) => element.className.includes("border-l-2"));
		expect(highlighted).toBeDefined();
	});

	it("opens the sheet focused on a source when its citation marker is clicked", async () => {
		const { container } = render(<AssistantMessage message={message()} />);

		const marker = container.querySelector("a[href='#source-m1-1']") as HTMLElement;
		await userEvent.click(marker);

		const sheet = screen.getByRole("dialog");
		expect(within(sheet).getByRole("button", { name: /Source 1/ }).getAttribute("aria-expanded")).toBe("true");
		expect(within(sheet).getByRole("button", { name: /Source 2/ }).getAttribute("aria-expanded")).toBe("false");
		await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
	});

	it("shows the grounding badge, and no sources button without citations", () => {
		render(
			<AssistantMessage
				message={message({
					content: "I couldn't find that in the selected knowledge bases.",
					citations: [],
					grounding: { verdict: "no_answer", unsupported_claims: [], explanation: "", invalid_citations: [] },
				})}
			/>,
		);

		expect(screen.queryByText("Verified against sources")).toBeNull();
		expect(screen.queryByRole("button", { name: /sources/ })).toBeNull();
	});
});
