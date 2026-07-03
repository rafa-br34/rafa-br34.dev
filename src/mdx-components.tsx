import type { MDXComponents } from "mdx/types"
import type { HTMLAttributes, ImgHTMLAttributes } from "react"

import { DemoGraph } from "@/components/blog/posts/DemoGraph"
import { cn } from "./lib/utils"

const HEADER_STYLING = "scroll-m-20 mt-6 first:mt-0 mb-2 font-semibold tracking-tight"
const BLOCKQUOTE_STYLING = "border-l-2 mt-2 border-fg-3 pl-6 italic text-fg-2 [&>*]:text-fg-3"

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		h1: ({ className, children, ...props }) => <h1 className={cn(HEADER_STYLING, "text-4xl", className)} {...props}>{children}</h1>,
		h2: ({ className, children, ...props }) => <h2 className={cn(HEADER_STYLING, "text-3xl", className)} {...props}>{children}</h2>,
		h3: ({ className, children, ...props }) => <h3 className={cn(HEADER_STYLING, "text-2xl", className)} {...props}>{children}</h3>,
		h4: ({ className, children, ...props }) => <h4 className={cn(HEADER_STYLING, "text-xl", className)} {...props}>{children}</h4>,
		h5: ({ className, children, ...props }) => <h5 className={cn(HEADER_STYLING, "text-lg", className)} {...props}>{children}</h5>,
		h6: ({ className, children, ...props }) => <h6 className={cn(HEADER_STYLING, "text-base", className)} {...props}>{children}</h6>,

		a: ({ className, ...props }) => <a className={cn("font-medium text-theme-fg-1 underline", className)} {...props} />,
		p: ({ className, ...props }) => <p className={cn("leading-6 [&:not(:first-child)]:mt-2", className)} {...props} />,

		ul: ({ className, ...props }) => <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />,
		ol: ({ className, ...props }) => <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />,
		li: ({ className, ...props }) => <li className={cn("mt-2", className)} {...props} />,

		blockquote: ({ className, ...props }) => <blockquote className={cn(BLOCKQUOTE_STYLING, className)} {...props} />,

		img: ({ className, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => <img className={cn("rounded-md border", className)} alt={alt} {...props} />,

		hr: ({ className, ...props }) => <hr className={cn("my-4 border md:my-8", className)} {...props} />,

		table: ({ className, ...props }: HTMLAttributes<HTMLTableElement>) => (
			<div className="my-6 w-full overflow-y-auto">
				<table className={cn("w-full", className)} {...props} />
			</div>
		),
		tr: ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
			<tr
				className={cn("m-0 border-t p-0 even:bg-theme-bg-0 odd:bg-theme-bg-1", className)}
				{...props}
			/>
		),
		th: ({ className, ...props }) => (
			<th
				className={cn(
					"border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
					className,
				)}
				{...props}
			/>
		),
		td: ({ className, ...props }) => (
			<td
				className={cn(
					"border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
					className,
				)}
				{...props}
			/>
		),

		pre: ({ className, ...props }) => (
			<pre
				className={cn(
					"my-2 overflow-x-auto bg-theme-bg-0 rounded-md py-1 [&>code]:border-none [&>code]:p-auto",
					className,
				)}
				{...props}
			/>
		),
		code: ({ className, ...props }) => (
			<code
				className={cn(
					"relative rounded-md border px-1 py-auto font-mono text-sm text-center",
					className,
				)}
				{...props}
			/>
		),

		...components,

		// 2026-07-02-first-blog-post
		DemoGraph,
	}
}
