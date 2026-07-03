import createMDX from "@next/mdx"
import type { NextConfig } from "next"

import remarkExtractToc from "@stefanprobst/rehype-extract-toc"
import remarkExtractTocExport from "@stefanprobst/rehype-extract-toc/mdx"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"

const withMDX = createMDX({
	options: {
		remarkPlugins: [
			remarkFrontmatter,
			remarkMdxFrontmatter,
			remarkGfm,
			remarkExtractToc,
			remarkExtractTocExport,
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
