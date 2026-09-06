import clsx from "clsx"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import Link from "next/link"

import { POST_LIST } from "@/blog-posts"
import { BlogPost } from "@/lib/blog-post"

import { Badge } from "@/components/ui/badge"
import { GRAYSCALE_BACKDROP } from "@/lib/styles"

dayjs.extend(relativeTime)

function getPostDate(post: BlogPost) {
	return dayjs(post.metadata.date)
}

function BlogListEntry({ post }: { readonly post: BlogPost }) {
	const postDate = getPostDate(post)

	return (
		<Link
			key={post.id}
			href={`/blog/${post.id}`}
			className={clsx(GRAYSCALE_BACKDROP, "group block border border-theme-fg-3 rounded-lg p-5 hover:border-theme-fg-1 transition-colors")}
		>
			<h2 className="text-xl font-semibold group-hover:text-theme-fg-0 transition-colors">
				{post.metadata.title}
			</h2>

			<time
				className="text-sm text-theme-fg-2 mt-1 block"
				dateTime={postDate.toISOString()}
			>
				{postDate.format("YYYY-MM-DD HH:mm")} ({postDate.fromNow()})
			</time>
			<p className="mt-2 text-theme-fg-1 text-sm leading-relaxed">
				{post.metadata.desc}
			</p>

			{post.metadata.tags.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mt-3">
					{post.metadata.tags.toSorted((a, b) => a.localeCompare(b)).map(tag => <Badge variant="secondary" key={tag}>{tag}</Badge>)}
				</div>
			)}
		</Link>
	)
}

export default function BlogListContent() {
	return (
		<div className="container mx-auto px-4 py-8 max-w-3xl">
			<h1 className="text-4xl mb-8">Blog</h1>

			{POST_LIST.length === 0
				? <p className="text-theme-fg-2">No posts yet. Check back soon!</p>
				: (
					<div className="grid gap-6">
						{POST_LIST.toSorted((a, b) => getPostDate(b).diff(getPostDate(a))).map(post => <BlogListEntry post={post} key={post.id} />)}
					</div>
				)}
		</div>
	)
}
