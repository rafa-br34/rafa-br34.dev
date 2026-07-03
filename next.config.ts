import createMDX from "@next/mdx"
import type { NextConfig } from "next"
import remarkFrontmatter from "remark-frontmatter"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"

const withMDX = createMDX({
	options: {
		remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
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
