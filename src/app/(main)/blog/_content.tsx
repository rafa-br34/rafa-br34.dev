import { POST_LIST } from "@/blog-posts"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
	title: "Blog",
	alternates: { canonical: "/blog" },
}

export default function BlogList() {
	return (
		<div className="container mx-auto px-4 py-8 max-w-3xl">
			<h1 className="text-4xl mb-8">Blog</h1>

			{POST_LIST.length === 0 ? <p className="text-theme-fg-2">No posts yet. Check back soon!</p> : (
				<div className="grid gap-6">
					{POST_LIST.map(post => (
						<Link
							key={post.postId}
							href={`/blog/${post.postId}`}
							className="group block border border-theme-fg-3 rounded-lg p-5 hover:border-theme-fg-1 transition-colors"
						>
							<h2 className="text-xl font-semibold group-hover:text-theme-fg-0 transition-colors">
								{post.frontmatter.title}
							</h2>
							<time
								className="text-sm text-theme-fg-2 mt-1 block"
								dateTime={post.frontmatter.date}
							>
								{new Date(post.frontmatter.date).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</time>
							<p className="mt-2 text-theme-fg-1 text-sm leading-relaxed">
								{post.frontmatter.desc}
							</p>
							{post.frontmatter.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5 mt-3">
									{post.frontmatter.tags.map(tag => (
										<span
											key={tag}
											className="text-xs px-2 py-0.5 rounded bg-theme-bg-2 text-theme-fg-3"
										>
											{tag}
										</span>
									))}
								</div>
							)}
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
