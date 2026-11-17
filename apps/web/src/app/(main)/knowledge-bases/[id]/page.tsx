"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import AlertMessage from "@repo/ui/general/AlertMessage";
import { PageContainer } from "@repo/ui/general/PageContainer";
import { useParams } from "next/navigation";
import { ItemsList } from "@/components/items/ItemsList";
import { AddContentDialog } from "@/components/knowledge-bases/AddContentDialog";
import { DeleteKnowledgeBaseButton } from "@/components/knowledge-bases/DeleteKnowledgeBaseButton";
import { KnowledgeBaseHeader } from "@/components/knowledge-bases/KnowledgeBaseHeader.view";
import { ProductTour } from "@/components/tour/ProductTour";
import { useBreadcrumbLabel } from "@/hooks";
import { useKnowledgeBase } from "@/queries";

export default function KnowledgeBasePage() {
	const { id } = useParams<{ id: string }>();
	const {
		data: knowledgeBase,
		isLoading,
		isError,
		error,
	} = useKnowledgeBase(id);
	useBreadcrumbLabel(id, knowledgeBase?.name);

	if (isLoading) {
		return (
			<PageContainer className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-64 w-full" />
			</PageContainer>
		);
	}

	if (isError || !knowledgeBase) {
		return (
			<PageContainer>
				<AlertMessage
					variant="destructive"
					message={error?.message ?? "Knowledge base not found"}
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer className="space-y-6">
			<KnowledgeBaseHeader
				knowledgeBase={knowledgeBase}
				actions={
					<>
						<DeleteKnowledgeBaseButton knowledgeBase={knowledgeBase} />
						<AddContentDialog knowledgeBaseId={id} />
					</>
				}
			/>
			<section data-tour="sources" className="space-y-3">
				<h2 className="font-medium text-sm">Sources</h2>
				<ItemsList knowledgeBaseId={id} />
			</section>
			<ProductTour tourId="knowledge-base" />
		</PageContainer>
	);
}
