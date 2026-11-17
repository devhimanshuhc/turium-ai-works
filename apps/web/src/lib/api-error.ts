type FastApiValidationIssue = { msg: string };
export type FastApiErrorBody = { detail?: string | FastApiValidationIssue[] };

export const getApiErrorMessage = (body: FastApiErrorBody | undefined) => {
	const detail = body?.detail;
	if (typeof detail === "string") return detail;
	if (Array.isArray(detail) && detail.length) return detail[0].msg;
	return "Something went wrong";
};
