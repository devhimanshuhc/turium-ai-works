import { FileText, Globe, type LucideIcon, NotebookPen } from "lucide-react";
import type { SourceType } from "@/types";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_FILE_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export const ITEM_POLL_INTERVAL_MS = 2000;

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
	note: "Text",
	url: "Link",
	file: "File",
};

export const SOURCE_TYPE_ICONS: Record<SourceType, LucideIcon> = {
	note: NotebookPen,
	url: Globe,
	file: FileText,
};
