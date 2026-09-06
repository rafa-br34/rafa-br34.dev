"use client"

import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from "react"
import { useRef } from "react"

import { cn } from "@/lib/utils"

import { CodeFrame } from "../codeblocks/CodeFrame"
import { CodeSource } from "../codeblocks/CodeSource"
import CopyButton from "../codeblocks/CopyButton"
import { extractLanguageClass } from "../codeblocks/codeLanguage"

function findFenceLanguage(children: ReactNode): string | null {
	if (children == null) {
		return null
	}
	const element = children as ReactElement
	if (element.props != null) {
		return extractLanguageClass((element.props as { className?: unknown }).className)
	}
	return null
}

export default function CodeBlock({ children, className, style, ...props }: Readonly<HTMLAttributes<HTMLPreElement>>) {
	const preRef = useRef<HTMLPreElement | null>(null)
	const language = findFenceLanguage(children)

	// Shiki sets the panel background inline on the `<pre>`; mirror it on the
	// chrome so the header blends with the code area. Fences Shiki leaves alone
	// fall back to the theme background.
	const backgroundColor = (style as CSSProperties | undefined)?.backgroundColor

	const copyCode = () => preRef.current?.querySelector("code")?.innerText.trimEnd() ?? ""

	return (
		<CodeFrame
			backgroundColor={backgroundColor}
			title={language != null && (
				<span className="block truncate text-base font-medium text-sm tracking-wider text-theme-fg-3">
					{language}
				</span>
			)}
			actions={<CopyButton getText={copyCode} />}
		>
			<CodeSource reference={preRef} className={className} style={style} {...props}>
				{children}
			</CodeSource>
		</CodeFrame>
	)
}
