"use client"

import clsx from "clsx"
import dayjs from "dayjs"
import Link from "next/link"

import type { BlogMetadata } from "@/lib/blog-post"
import { GRAYSCALE_BACKDROP } from "@/lib/styles"

import { Badge } from "@/components/ui/badge"

export default function BlogPostContent(
	{ children, metadata }: { readonly children: React.ReactNode; readonly metadata: BlogMetadata },
) {
	const {
		date: postDate,
		tags: postTags,
		title: postTitle,
		desc: postDesc,
	} = metadata

	return (
		<article className={clsx(GRAYSCALE_BACKDROP, "container mx-auto h-full px-4 py-8 max-w-6xl")}>
			<Link
				href="/blog"
				className="inline-block mb-6 px-3 py-2 bg-theme-bg-0 rounded-md text-theme-fg-2 hover:text-theme-fg-0 transition-colors text-sm"
			>
				⇚ Back to blog
			</Link>

			<header className="mb-4 border-b pb-4">
				<h1 className="text-3xl font-bold mb-2">{postTitle}</h1>
				<p className="text-sm text-theme-fg-1 mb-2">{postDesc}</p>
				<time className="text-sm text-theme-fg-2" dateTime={postDate}>
					{dayjs(postDate).format("YYYY-MM-DD HH:mm")}
				</time>
				{postTags.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-3">
						{postTags.map(tag => <Badge variant="secondary" key={tag}>{tag}</Badge>)}
					</div>
				)}
			</header>

			<div className="prose prose-invert max-w-none">
				{children}
			</div>
		</article>
	)
}
