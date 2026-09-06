"use client"

import { Download, FileCode } from "lucide-react"
import type { ReactNode } from "react"
import { useRef } from "react"

import { CodeFrame } from "../codeblocks/CodeFrame"
import CopyButton from "../codeblocks/CopyButton"

function sourceFileName(source: string): string {
	const lastSlash = source.lastIndexOf("/")
	const name = lastSlash >= 0 ? source.slice(lastSlash + 1) : source
	return name ? decodeURIComponent(name) : ""
}

/**
 * Embeds a full source file from a blog post's assets folder
 * (`/assets/blogs/<postId>/…`). `source` is rewritten to that URL at build time
 * by `rehypeBlogAssets` in next.config.ts, so the download link already points
 * at the published asset.
 *
 * The code contents aren't loaded yet: this renders the chrome (file name,
 * language, copy, download) around a placeholder body. When the file embedding
 * is wired up, pass the highlighted `<pre>`/`<code>` content as `children` and
 * copy will pick it up from there.
 */
export default function CodeEmbed(
	{
		source,
		language,
		className,
		children,
	}: {
		readonly source?: string
		readonly language?: string
		readonly className?: string
		readonly children?: ReactNode
	},
) {
	const codeAreaRef = useRef<HTMLPreElement | null>(null)
	const fileName = sourceFileName(source ?? "")

	const copyCode = () => codeAreaRef.current?.innerText.trimEnd() ?? ""

	return (
		<CodeFrame
			className={className}
			title={(fileName !== "" || language != null) && (
				<div className="flex min-w-0 items-center gap-2">
					{fileName !== "" && (
						<span className="flex min-w-0 items-center gap-1.5 text-xs text-theme-fg-1">
							<FileCode size={13} className="shrink-0" aria-hidden="true" />
							<span className="truncate font-mono">{fileName}</span>
						</span>
					)}
					{language != null && (
						<span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-theme-fg-3">
							{language}
						</span>
					)}
				</div>
			)}
			actions={
				<>
					{source && (
						<a
							href={source}
							download={fileName || undefined}
							title={`Download ${fileName}`}
							aria-label={`Download ${fileName}`}
							className="inline-flex shrink-0 items-center gap-1 rounded-md border border-theme-bg-3 px-1.5 py-0.5 text-theme-fg-2 transition-colors hover:text-theme-fg-0"
						>
							<Download size={16} aria-hidden="true" />
						</a>
					)}
					<CopyButton getText={copyCode} />
				</>
			}
		>
			<pre
				ref={codeAreaRef}
				className="m-0 overflow-x-auto bg-transparent px-4 py-3 font-mono text-sm leading-6 text-theme-fg-1"
			>
						{children}
			</pre>
		</CodeFrame>
	)
}
