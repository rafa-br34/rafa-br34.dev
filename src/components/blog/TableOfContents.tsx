"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { Toc, TocEntry } from "@stefanprobst/rehype-extract-toc"

function TocItem({ entry, activeId, depth = 0 }: { readonly entry: TocEntry; readonly activeId: string | null; readonly depth?: number }) {
	const hasChildren = entry.children && entry.children.length > 0
	const isActive = entry.id != null && entry.id === activeId

	return (
		<li>
			<a
				href={entry.id ? `#${entry.id}` : undefined}
				className={cn(
					"block py-0.5 text-sm transition-colors hover:text-theme-fg-0",
					"border-l-2 border-transparent pl-2",
					isActive && "border-theme-fg-1 text-theme-fg-0 font-medium",
					!isActive && "text-theme-fg-2",
				)}
				style={{ paddingLeft: `${(depth + 1) * 0.5 + 0.25}rem` }}
			>
				{entry.value}
			</a>
			{hasChildren && (
				<ul className="space-y-0">
					{entry.children.map(child => <TocItem key={child.value + (child.id ?? "")} entry={child} activeId={activeId} depth={depth + 1} />)}
				</ul>
			)}
		</li>
	)
}

export default function TableOfContents({ className, toc }: { readonly className: string; readonly toc: Toc }) {
	const [activeId, setActiveId] = useState<string | null>(null)
	const observerRef = useRef<IntersectionObserver | null>(null)

	const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
		const visible = entries
			.filter(entry => entry.isIntersecting)
			.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

		if (visible.length > 0) {
			setActiveId(visible[0].target.id)
		}
	}, [])

	useEffect(() => {
		observerRef.current = new IntersectionObserver(handleIntersection, {
			rootMargin: "-80px 0px -80% 0px",
			threshold: 0,
		})

		const headingElements = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")

		for (const element of Array.from(headingElements)) {
			observerRef.current.observe(element)
		}

		return () => {
			observerRef.current?.disconnect()
		}
	}, [handleIntersection])

	if (toc.length === 0) {
		return null
	}

	return (
		<aside className={cn("sticky top-24 max-h-screen overflow-y-auto overflow-x-clip", className)}>
			<h2 className="text-xs font-semibold uppercase tracking-wider text-theme-fg-3 mb-3">
				On this page
			</h2>
			<nav>
				<ul className="space-y-0">
					{toc.map(entry => <TocItem key={entry.value + (entry.id ?? "")} entry={entry} activeId={activeId} />)}
				</ul>
			</nav>
		</aside>
	)
}
