import type { CSSProperties, ReactNode, Ref } from "react"

import { cn } from "@/lib/utils"

export function CodeSource(
	{
		reference,
		className,
		style,
		children,
		...props
	}: {
		readonly reference?: Ref<HTMLPreElement>
		readonly className?: string
		readonly children?: ReactNode
		readonly style?: CSSProperties
	},
) {
	return (
		<pre
			ref={reference}
			className={cn(
				"m-0 overflow-x-auto bg-transparent px-2 py-1 font-mono text-sm leading-6 text-theme-fg-1",
				"[&>code]:rounded-none [&>code]:border-none [&>code]:bg-transparent [&>code]:px-0 [&>code]:py-0 [&>code]:text-left",
				className,
			)}
			style={style}
			{...props}
		>
				{children}
		</pre>
	)
}
