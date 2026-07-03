import type { ComponentType } from "react"

import { BlogMetadata } from "@/lib/blog-post"
import dayjs from "dayjs"

export interface Post {
	Component: ComponentType
	frontmatter: BlogMetadata
	postId: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdxContext = (require as any).context("./", false, /\.mdx$/)

const postsMap: Record<string, Post> = {}

for (const key of mdxContext.keys()) {
	const val = mdxContext(key)
	const postId = (val.frontmatter as BlogMetadata).id

	postsMap[postId] = {
		Component: val.default as ComponentType,
		frontmatter: val.frontmatter,
		postId,
	}
}

export const POST_LIST: Post[] = Object.values(postsMap).sort(
	(a, b) => dayjs(a.frontmatter.date).isBefore(b.frontmatter.date) ? -1 : 1,
)
export const POST_ID_LIST = Object.keys(postsMap)

export function getPost(postId: string): Post | undefined {
	return postsMap[postId]
}
