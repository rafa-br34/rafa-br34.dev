import createMDX from "@next/mdx"
import type { NextConfig } from "next"

import withToc from "@stefanprobst/rehype-extract-toc"
import withTocExport from "@stefanprobst/rehype-extract-toc/mdx"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import remarkMath from "remark-math"

const withMDX = createMDX({
	options: {
		remarkPlugins: [
			remarkFrontmatter,
			remarkMdxFrontmatter,
			remarkGfm,
			remarkMath,
		],
		rehypePlugins: [
			rehypeSlug,
			rehypeKatex,
			withToc,
			withTocExport,
		],
	},
})

const nextConfig: NextConfig = {
	output: "export",
	distDir: "dist",

	pageExtensions: ["ts", "tsx", "md", "mdx"],

	webpack(config) {
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		}

		return config
	},
}

export default withMDX(nextConfig)
