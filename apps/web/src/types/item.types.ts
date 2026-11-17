export type SourceType = "note" | "url" | "file";

export type ItemStatus = "pending" | "ready" | "failed";

export type Item = {
	id: string;
	knowledge_base_id: string;
	source_type: SourceType;
	status: ItemStatus;
	title: string | null;
	url: string | null;
	error: string | null;
	content_preview: string;
	created_at: string;
	updated_at: string;
};

export type ItemChunk = {
	id: string;
	position: number;
	context: string;
	content: string;
};

export type ItemSection = {
	id: string;
	position: number;
	content: string;
	chunks: ItemChunk[];
};

export type NoteIngestBody = {
	source_type: "note";
	knowledge_base_id: string;
	title?: string;
	content: string;
};

export type UrlIngestBody = {
	source_type: "url";
	knowledge_base_id: string;
	url: string;
};

export type IngestBody = NoteIngestBody | UrlIngestBody;

export type FileIngestBody = {
	knowledge_base_id: string;
	file: File;
};
