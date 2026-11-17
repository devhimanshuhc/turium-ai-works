import { SidebarProvider } from "@repo/ui/components/sidebar";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KnowledgeBaseNavItem } from "../KnowledgeBaseNavItem";

window.matchMedia = vi.fn().mockImplementation(() => ({
	matches: false,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
}));

const KNOWLEDGE_BASE = {
	id: "kb-1",
	name: "Handbook",
	description: null,
	item_count: 4,
	created_at: "",
};

const renderItem = (props: Partial<Parameters<typeof KnowledgeBaseNavItem>[0]>) =>
	render(
		<SidebarProvider>
			<ul>
				<KnowledgeBaseNavItem
					knowledgeBase={KNOWLEDGE_BASE}
					mode="view"
					isAttached={false}
					isActive={false}
					onToggle={vi.fn()}
					{...props}
				/>
			</ul>
		</SidebarProvider>,
	);

describe("KnowledgeBaseNavItem", () => {
	it("toggles selection instead of navigating while picking for a new chat", async () => {
		const onToggle = vi.fn();
		renderItem({ mode: "select", isAttached: true, onToggle });

		const row = screen.getByRole("button", { name: /Handbook/ });
		await userEvent.click(row);

		expect(row.getAttribute("aria-pressed")).toBe("true");
		expect(onToggle).toHaveBeenCalled();
		expect(screen.getByRole("link", { name: "Open Handbook" }).getAttribute("href")).toBe(
			"/knowledge-bases/kb-1",
		);
	});

	it("links to the knowledge base and shows its item count", () => {
		renderItem({});

		expect(screen.getByRole("link", { name: /Handbook/ }).getAttribute("href")).toBe(
			"/knowledge-bases/kb-1",
		);
		expect(screen.getByText("4")).not.toBeNull();
	});

	it("shows a lock instead of the count when the chat uses it", () => {
		renderItem({ isAttached: true });

		expect(screen.queryByText("4")).toBeNull();
		expect(screen.getByTitle("Used by this chat (locked)")).not.toBeNull();
	});
});
