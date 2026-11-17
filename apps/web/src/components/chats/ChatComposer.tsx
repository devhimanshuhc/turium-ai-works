"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError } from "@repo/ui/components/field";
import { Textarea } from "@repo/ui/components/textarea";
import LoadingButton from "@repo/ui/general/LoadingButton";
import { ArrowUp } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { type AskQuestionInput, askQuestionSchema } from "@/validations";

type ChatComposerProps = {
	onAsk: (question: string) => void;
	isStreaming: boolean;
};

export function ChatComposer({ onAsk, isStreaming }: ChatComposerProps) {
	const form = useForm<AskQuestionInput>({
		resolver: zodResolver(askQuestionSchema),
		defaultValues: { question: "" },
	});

	const onSubmit = form.handleSubmit(({ question }) => {
		if (isStreaming) return;
		onAsk(question);
		form.reset();
	});

	const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (
			event.key !== "Enter" ||
			event.shiftKey ||
			event.nativeEvent.isComposing
		)
			return;
		event.preventDefault();
		onSubmit();
	};

	return (
		<form
			onSubmit={onSubmit}
			noValidate
			className="mx-auto w-full max-w-3xl px-4 pb-4"
		>
			<Controller
				name="question"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<div
							data-tour="composer"
							className="focus-within:ring-ring/50 relative rounded-xl border focus-within:ring-3"
						>
							<Textarea
								{...field}
								aria-label="Ask a question"
								aria-invalid={fieldState.invalid}
								placeholder="Ask a question…"
								rows={2}
								onKeyDown={submitOnEnter}
								className="max-h-48 resize-none border-0 pr-12 shadow-none focus-visible:ring-0"
							/>
							<LoadingButton
								type="submit"
								size="icon"
								aria-label="Send"
								isLoading={isStreaming}
								showChildren={false}
								className="absolute right-2 bottom-2"
							>
								<ArrowUp />
							</LoadingButton>
						</div>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
		</form>
	);
}
