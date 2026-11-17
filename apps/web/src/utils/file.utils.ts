import { ACCEPTED_FILE_EXTENSIONS } from "@/constants";

export const hasAcceptedExtension = (fileName: string) =>
	ACCEPTED_FILE_EXTENSIONS.some((extension) =>
		fileName.toLowerCase().endsWith(extension),
	);
