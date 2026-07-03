import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPost, POST_ID_LIST } from "@/blog-posts"

import { checkMetadata } from "@/lib/blog-post"
import BlogPostContent from "./_content"

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
		metadata: {
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

	// Check metadata on the server
	checkMetadata(post.metadata)

	if (!post) {
		notFound()
	}

	const { Component, metadata } = post

	return (
		<BlogPostContent metadata={metadata}>
			<Component />
		</BlogPostContent>
	)
}
