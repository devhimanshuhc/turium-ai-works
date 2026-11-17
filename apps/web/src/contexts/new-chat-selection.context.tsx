"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

type NewChatSelection = {
	selectedKnowledgeBaseIds: string[];
	/** True once the new chat exists: its knowledge bases can no longer change. */
	isLocked: boolean;
	toggle: (knowledgeBaseId: string) => void;
	lock: () => void;
	reset: () => void;
};

const NewChatSelectionContext = createContext<NewChatSelection | null>(null);

export function NewChatSelectionProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [selectedKnowledgeBaseIds, setSelected] = useState<string[]>([]);
	const [isLocked, setIsLocked] = useState(false);

	const toggle = (knowledgeBaseId: string) => {
		if (isLocked) return;
		setSelected((current) =>
			current.includes(knowledgeBaseId)
				? current.filter((id) => id !== knowledgeBaseId)
				: [...current, knowledgeBaseId],
		);
	};

	const reset = () => {
		setSelected([]);
		setIsLocked(false);
	};

	return (
		<NewChatSelectionContext.Provider
			value={{
				selectedKnowledgeBaseIds,
				isLocked,
				toggle,
				lock: () => setIsLocked(true),
				reset,
			}}
		>
			{children}
		</NewChatSelectionContext.Provider>
	);
}

export function useNewChatSelection() {
	const context = useContext(NewChatSelectionContext);
	if (!context) {
		throw new Error(
			"useNewChatSelection must be used inside NewChatSelectionProvider",
		);
	}
	return context;
}
