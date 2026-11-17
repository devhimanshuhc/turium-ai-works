"use client";

import { useParams } from "next/navigation";
import { ChatWorkspace } from "@/components/chats/ChatWorkspace";

export default function ChatPage() {
	const { id } = useParams<{ id: string }>();
	return <ChatWorkspace key={id} chatId={id} />;
}
