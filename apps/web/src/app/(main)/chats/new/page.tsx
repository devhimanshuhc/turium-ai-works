"use client";

import { useEffect } from "react";
import { ChatWorkspace } from "@/components/chats/ChatWorkspace";
import { ProductTour } from "@/components/tour/ProductTour";
import { useNewChatSelection } from "@/contexts";

export default function NewChatPage() {
	const { reset } = useNewChatSelection();

	// biome-ignore lint/correctness/useExhaustiveDependencies: start every new chat with a clean selection, once per visit
	useEffect(() => {
		reset();
	}, []);

	return (
		<>
			<ChatWorkspace chatId={null} />
			<ProductTour tourId="app" />
		</>
	);
}
