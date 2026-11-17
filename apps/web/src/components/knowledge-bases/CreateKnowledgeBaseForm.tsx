"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import LoadingButton from "@repo/ui/general/LoadingButton";
import RequiredStar from "@repo/ui/general/RequiredStar";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateKnowledgeBase } from "@/queries";
import {
	type CreateKnowledgeBaseInput,
	createKnowledgeBaseSchema,
} from "@/validations";

export function CreateKnowledgeBaseForm({
	onCreated,
}: {
	onCreated: () => void;
}) {
	const router = useRouter();
	const createKnowledgeBase = useCreateKnowledgeBase();
	const form = useForm<CreateKnowledgeBaseInput>({
		resolver: zodResolver(createKnowledgeBaseSchema),
		defaultValues: { name: "", description: "" },
	});

	const onSubmit = form.handleSubmit(({ name, description }) =>
		createKnowledgeBase.mutate(
			{ name, description: description || undefined },
			{
				onSuccess: (knowledgeBase) => {
					toast.success(`Created "${knowledgeBase.name}"`);
					onCreated();
					router.push(`/knowledge-bases/${knowledgeBase.id}`);
				},
				onError: (error) => toast.error(error.message),
			},
		),
	);

	return (
		<form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
			<Controller
				name="name"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="kb-name">
							Name <RequiredStar />
						</FieldLabel>
						<Input
							{...field}
							id="kb-name"
							placeholder="e.g. Engineering handbook"
							aria-invalid={fieldState.invalid}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Controller
				name="description"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor="kb-description">Description</FieldLabel>
						<Textarea
							{...field}
							id="kb-description"
							rows={3}
							aria-invalid={fieldState.invalid}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<LoadingButton type="submit" isLoading={createKnowledgeBase.isPending}>
				Create
			</LoadingButton>
		</form>
	);
}
