import { ITEM_POLL_INTERVAL_MS } from "@/constants";
import type { Item } from "@/types";

export const hasPendingItems = (items: Item[] | undefined) =>
	Boolean(items?.some((item) => item.status === "pending"));

export const getItemsPollInterval = (items: Item[] | undefined) =>
	hasPendingItems(items) ? ITEM_POLL_INTERVAL_MS : false;

export const getUrlHost = (url: string) => {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
};

export const getItemDisplayTitle = (item: Item) =>
	item.title || item.url || "Untitled";
