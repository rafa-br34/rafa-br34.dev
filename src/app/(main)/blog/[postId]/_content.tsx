"use client"

import clsx from "clsx"
import dayjs from "dayjs"
import Link from "next/link"

import type { BlogMetadata } from "@/lib/blog-post"
import { GRAYSCALE_BACKDROP } from "@/lib/styles"

export default function BlogPostContent(
	{ children, metadata }: { readonly children: React.ReactNode; readonly metadata: BlogMetadata },
) {
	const {
		date: postDate,
		tags: postTags,
		title: postTitle,
	} = metadata

	return (
		<article className={clsx(GRAYSCALE_BACKDROP, "container mx-auto h-full px-4 py-8 max-w-6xl")}>
			<Link
				href="/blog"
				className="inline-block mb-6 text-theme-fg-2 hover:text-theme-fg-0 transition-colors text-sm"
			>
				Back to blog
			</Link>

			<header className="mb-8 border-b pb-4">
				<h1 className="text-3xl font-bold mb-2">{postTitle}</h1>
				<time className="text-sm text-theme-fg-2" dateTime={postDate}>
					{dayjs(postDate).format("YYYY-MM-DD HH:mm")}
				</time>
				{postTags.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-3">
						{postTags.map(tag => (
							<span
								key={tag}
								className="text-xs px-2 py-0.5 rounded bg-theme-bg-2 text-theme-fg-2"
							>
								{tag}
							</span>
						))}
					</div>
				)}
			</header>

			<div className="prose prose-invert max-w-none">
				{children}
			</div>
		</article>
	)
}
