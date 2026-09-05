"use client"

import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export default function CopyButton(
	{
		getText,
		className,
		disabled = false,
		label = "Copy",
	}: {
		readonly getText: () => string
		readonly className?: string
		readonly disabled?: boolean
		readonly label?: string
	},
) {
	const [copied, setCopied] = useState(false)
	const timeoutRef = useRef<number | null>(null)

	useEffect(() => {
		return () => {
			if (timeoutRef.current != null) {
				window.clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	const handleCopy = async () => {
		if (disabled) {
			return
		}
		try {
			await navigator.clipboard.writeText(getText())
			setCopied(true)
			if (timeoutRef.current != null) {
				window.clearTimeout(timeoutRef.current)
			}
			timeoutRef.current = window.setTimeout(() => setCopied(false), 1500)
		}
		catch {
			// Clipboard API unavailable (e.g. insecure context) — ignore.
		}
	}

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={handleCopy}
			aria-label={label}
			title={label}
			className={cn(
				"inline-flex shrink-0 items-center gap-1 rounded-md border border-theme-bg-3 px-1.5 py-0.5 text-[11px] font-medium text-theme-fg-2 transition-colors",
				"hover:text-theme-fg-0 disabled:pointer-events-none disabled:opacity-50",
				copied && "border-theme-g-1 text-theme-g-1",
				className,
			)}
		>
			{copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
			{copied ? "Copied" : label}
		</button>
	)
}
