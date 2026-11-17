import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileIngestForm } from "../FileIngestForm";
import { NoteIngestForm } from "../NoteIngestForm";
import { UrlIngestForm } from "../UrlIngestForm";

const { ingestMutate, ingestFileMutate, toast } = vi.hoisted(() => ({
	ingestMutate: vi.fn(),
	ingestFileMutate: vi.fn(),
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/queries", () => ({
	useIngestItem: () => ({ mutate: ingestMutate, isPending: false }),
	useIngestFile: () => ({ mutate: ingestFileMutate, isPending: false }),
}));
vi.mock("sonner", () => ({ toast }));

const fileOfSize = (name: string, bytes: number) => {
	const file = new File(["x"], name);
	Object.defineProperty(file, "size", { value: bytes });
	return file;
};

beforeEach(() => vi.clearAllMocks());

describe("NoteIngestForm", () => {
	it("requires text", async () => {
		render(<NoteIngestForm knowledgeBaseId="kb-1" />);

		await userEvent.type(screen.getByLabelText("Text *"), "   ");
		await userEvent.click(screen.getByRole("button", { name: "Add text" }));

		expect(await screen.findByText("Text is required")).not.toBeNull();
		expect(ingestMutate).not.toHaveBeenCalled();
	});

	it("submits a note, toasts and resets on success", async () => {
		ingestMutate.mockImplementation((_body, { onSuccess }) => onSuccess());
		render(<NoteIngestForm knowledgeBaseId="kb-1" />);

		await userEvent.type(screen.getByLabelText("Text *"), "Deploys freeze on Fridays");
		await userEvent.click(screen.getByRole("button", { name: "Add text" }));

		await waitFor(() =>
			expect(ingestMutate).toHaveBeenCalledWith(
				{ source_type: "note", knowledge_base_id: "kb-1", title: undefined, content: "Deploys freeze on Fridays" },
				expect.anything(),
			),
		);
		expect(toast.success).toHaveBeenCalled();
		expect((screen.getByLabelText("Text *") as HTMLTextAreaElement).value).toBe("");
	});

	it("shows server errors as a toast", async () => {
		ingestMutate.mockImplementation((_body, { onError }) => onError(new Error("Knowledge base not found")));
		render(<NoteIngestForm knowledgeBaseId="kb-1" />);

		await userEvent.type(screen.getByLabelText("Text *"), "hello");
		await userEvent.click(screen.getByRole("button", { name: "Add text" }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Knowledge base not found"));
	});
});

describe("UrlIngestForm", () => {
	it("rejects invalid and non-http URLs", async () => {
		render(<UrlIngestForm knowledgeBaseId="kb-1" />);
		const input = screen.getByLabelText("URL *");

		await userEvent.type(input, "not a url");
		await userEvent.click(screen.getByRole("button", { name: "Add link" }));
		expect(await screen.findByText(/Enter a valid URL/)).not.toBeNull();

		await userEvent.clear(input);
		await userEvent.type(input, "ftp://example.com/file");
		await userEvent.click(screen.getByRole("button", { name: "Add link" }));
		expect(await screen.findByText(/Enter a valid URL/)).not.toBeNull();
		expect(ingestMutate).not.toHaveBeenCalled();
	});

	it("submits a valid URL", async () => {
		render(<UrlIngestForm knowledgeBaseId="kb-1" />);

		await userEvent.type(screen.getByLabelText("URL *"), "https://example.com/post");
		await userEvent.click(screen.getByRole("button", { name: "Add link" }));

		await waitFor(() =>
			expect(ingestMutate).toHaveBeenCalledWith(
				{ source_type: "url", knowledge_base_id: "kb-1", url: "https://example.com/post" },
				expect.anything(),
			),
		);
	});
});

describe("FileIngestForm", () => {
	const chooseFile = (file: File) => fireEvent.change(screen.getByLabelText("File *"), { target: { files: [file] } });
	const submit = () => userEvent.click(screen.getByRole("button", { name: "Upload file" }));

	it("requires a file", async () => {
		render(<FileIngestForm knowledgeBaseId="kb-1" />);
		await submit();
		expect(await screen.findByText("Choose a file to upload")).not.toBeNull();
	});

	it("rejects unsupported file types", async () => {
		render(<FileIngestForm knowledgeBaseId="kb-1" />);
		chooseFile(fileOfSize("photo.png", 100));
		await submit();
		expect(await screen.findByText("Only PDF, DOCX, TXT or MD files are supported")).not.toBeNull();
	});

	it("rejects files over 10 MB", async () => {
		render(<FileIngestForm knowledgeBaseId="kb-1" />);
		chooseFile(fileOfSize("big.pdf", 10 * 1024 * 1024 + 1));
		await submit();
		expect(await screen.findByText("File must be 10 MB or smaller")).not.toBeNull();
		expect(ingestFileMutate).not.toHaveBeenCalled();
	});

	it("uploads a valid file", async () => {
		ingestFileMutate.mockImplementation((_body, { onSuccess }) => onSuccess());
		render(<FileIngestForm knowledgeBaseId="kb-1" />);
		const file = fileOfSize("notes.md", 2048);
		chooseFile(file);
		await submit();

		await waitFor(() =>
			expect(ingestFileMutate).toHaveBeenCalledWith({ knowledge_base_id: "kb-1", file }, expect.anything()),
		);
		expect(toast.success).toHaveBeenCalledWith("notes.md uploaded. Processing it now.");
	});
});
