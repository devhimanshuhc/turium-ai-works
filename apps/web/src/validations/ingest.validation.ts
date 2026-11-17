import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "@/constants";
import { hasAcceptedExtension } from "@/utils";

export const noteIngestSchema = z.object({
	title: z.string().trim().max(300, "Title must be 300 characters or fewer"),
	content: z
		.string()
		.trim()
		.min(1, "Text is required")
		.max(100_000, "Text must be 100,000 characters or fewer"),
});

export const urlIngestSchema = z.object({
	url: z
		.string()
		.trim()
		.min(1, "URL is required")
		.pipe(
			z.url({
				protocol: /^https?$/,
				error: "Enter a valid URL starting with http:// or https://",
			}),
		),
});

export const fileIngestSchema = z.object({
	file: z
		.instanceof(File, { error: "Choose a file to upload" })
		.refine((file) => hasAcceptedExtension(file.name), {
			error: "Only PDF, DOCX, TXT or MD files are supported",
		})
		.refine((file) => file.size > 0, { error: "The file is empty" })
		.refine((file) => file.size <= MAX_UPLOAD_BYTES, {
			error: "File must be 10 MB or smaller",
		}),
});

export type NoteIngestInput = z.infer<typeof noteIngestSchema>;
export type UrlIngestInput = z.infer<typeof urlIngestSchema>;
export type FileIngestInput = z.infer<typeof fileIngestSchema>;
