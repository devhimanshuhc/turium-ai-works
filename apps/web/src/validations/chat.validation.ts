import { z } from "zod";

export const askQuestionSchema = z.object({
	question: z
		.string()
		.trim()
		.min(1, "Type a question")
		.max(2000, "Questions must be 2,000 characters or fewer"),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
