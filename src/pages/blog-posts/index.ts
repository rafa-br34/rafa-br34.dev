import type { ComponentType } from "react"

export interface Post {
	Component: ComponentType
	title: string
	desc: string
	date: string
	tags: string[]
	slug: string
}

interface MdxModule {
	default: ComponentType
	frontmatter: {
		title: string
		desc: string
		date: string
		tags: string[]
	}
}

const mdxContext = require.context("./", false, /\.mdx$/)

export const posts: Post[] = mdxContext.keys().map((key: string) => {
	const mod = mdxContext(key) as MdxModule
	const slug = key.replace("./", "").replace(/\.mdx$/, "")
	return {
		Component: mod.default,
		...mod.frontmatter,
		slug,
	}
})
