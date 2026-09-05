import { bundledLanguages } from "shiki"

export function extractLanguageClass(className: unknown): string | null {
	if (typeof className !== "string") {
		return null
	}
	const match = /\blanguage-([A-Za-z0-9_+#.-]+)/.exec(className)
	return match?.[1] ?? null
}
