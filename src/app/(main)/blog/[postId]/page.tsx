import dayjs from "dayjs"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getPost, POST_ID_LIST } from "@/blog-posts"

export function generateStaticParams() {
	return POST_ID_LIST.map(postId => ({ postId }))
}

export async function generateMetadata({ params }: { readonly params: Promise<{ postId: string }> }): Promise<Metadata> {
	const { postId } = await params
	const post = getPost(postId)

	if (!post) {
		return {}
	}

	const {
		frontmatter: {
			date: postDate,
			desc: postDesc,
			tags: postTags,
			title: postTitle,
		},
	} = post

	return {
		title: postTitle,
		description: postDesc,
		alternates: { canonical: `/blog/${postId}` },
		openGraph: {
			type: "article",
			publishedTime: postDate,
			tags: postTags,
		},
	}
}

export default async function BlogPost(
	{
		params,
	}: {
		readonly params: Promise<{ postId: string }>
	},
) {
	const { postId } = await params
	const post = getPost(postId)

	if (!post) {
		notFound()
	}

	const {
		Component,
		frontmatter: {
			date: postDate,
			desc: postDesc,
			tags: postTags,
			title: postTitle,
			thumbnail: postThumbnail,
		},
	} = post

	return (
		<article className="container mx-auto px-4 py-8 max-w-3xl">
			<Link
				href="/blog"
				className="inline-block mb-6 text-theme-fg-2 hover:text-theme-fg-0 transition-colors text-sm"
			>
				{"<-"} Back to blog
			</Link>

			<header className="mb-8 border-b pb-4">
				<h1 className="text-3xl font-bold mb-2">{postTitle}</h1>
				<time className="text-sm text-theme-fg-2" dateTime={postDate}>
					{dayjs(postDate).format("YYYY-MM-DD HH:mm:ss")}
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
				<Component />
			</div>
		</article>
	)
}
