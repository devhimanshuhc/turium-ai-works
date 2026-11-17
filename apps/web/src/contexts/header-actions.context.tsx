"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { createPortal } from "react-dom";

type HeaderActionsSlot = {
	container: HTMLElement | null;
	setContainer: (element: HTMLElement | null) => void;
};

const HeaderActionsContext = createContext<HeaderActionsSlot | null>(null);

/** Lets a page put controls into the app's single top bar instead of adding a second header. */
export function HeaderActionsProvider({ children }: { children: ReactNode }) {
	const [container, setContainer] = useState<HTMLElement | null>(null);
	return (
		<HeaderActionsContext.Provider value={{ container, setContainer }}>
			{children}
		</HeaderActionsContext.Provider>
	);
}

export function useHeaderActionsSlot() {
	const context = useContext(HeaderActionsContext);
	if (!context) {
		throw new Error(
			"useHeaderActionsSlot must be used inside HeaderActionsProvider",
		);
	}
	return context.setContainer;
}

export function HeaderActions({ children }: { children: ReactNode }) {
	const container = useContext(HeaderActionsContext)?.container;
	return container ? createPortal(children, container) : null;
}
