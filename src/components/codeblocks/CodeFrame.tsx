import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

export function CodeFrame(
	{
		title,
		actions,
		backgroundColor,
		className,
		children,
	}: {
		readonly title?: ReactNode
		readonly actions?: ReactNode
		readonly backgroundColor?: string
		readonly className?: string
		readonly children: ReactNode
	},
) {
	const headerStyle: CSSProperties | undefined = backgroundColor ? { backgroundColor } : undefined

	return (
		<div
			className={cn("my-2 overflow-hidden rounded-md border border-theme-bg-2 bg-theme-bg-0", className)}
			style={backgroundColor ? { backgroundColor } : undefined}
		>
			<div
				className="flex items-center gap-2 border-b border-theme-bg-2 px-3 py-1"
				style={headerStyle}
			>
				<div className="min-w-0 flex-1">{title}</div>
				{actions != null && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
			</div>
			{children}
		</div>
	)
}
