import { Link, useParams } from "react-router-dom"

import { SEO } from "../components/SEO"
import { posts } from "./blog-posts"

export function Blog() {
	const { slug } = useParams()

	if (slug) {
		const post = posts.find(post => post.slug === slug)
		if (!post) {
			return (
				<div className="flex items-center justify-center h-full p-8">
					<div className="text-center">
						<h1 className="text-3xl mb-4">Post not found</h1>
						<Link to="/blog" className="underline text-theme-fg-1 hover:text-theme-fg-0 transition-colors">
							← Back to blog
						</Link>
					</div>
				</div>
			)
		}

		return (
			<>
				<SEO title={`${post.title} - rafa_br34`} canonicalPath={`/blog/${slug}`} />
				<article className="container mx-auto px-4 py-8 max-w-3xl">
					<Link
						to="/blog"
						className="inline-block mb-6 text-theme-fg-2 hover:text-theme-fg-0 transition-colors text-sm"
					>
						← Back to blog
					</Link>

					<header className="mb-8 border-b pb-4">
						<h1 className="text-3xl font-bold mb-2">{post.title}</h1>
						<time className="text-sm text-theme-fg-2" dateTime={post.date}>
							{new Date(post.date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</time>
						{post.tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-3">
								{post.tags.map(tag => (
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
						<post.Component />
					</div>
				</article>
			</>
		)
	}

	// ── Post list ──────────────────────────────────────────────────────
	return (
		<>
			<SEO title="Blog - rafa_br34" canonicalPath="/blog" />
			<div className="container mx-auto px-4 py-8 max-w-3xl">
				<h1 className="text-4xl mb-8">Blog</h1>

				{posts.length === 0 ? <p className="text-theme-fg-2">No posts yet — check back soon!</p> : (
					<div className="grid gap-6">
						{posts.map(post => (
							<Link
								key={post.slug}
								to={`/blog/${post.slug}`}
								className="group block border border-theme-fg-3 rounded-lg p-5 hover:border-theme-fg-1 transition-colors"
							>
								<h2 className="text-xl font-semibold group-hover:text-theme-fg-0 transition-colors">
									{post.title}
								</h2>
								<time className="text-sm text-theme-fg-2 mt-1 block" dateTime={post.date}>
									{new Date(post.date).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</time>
								<p className="mt-2 text-theme-fg-1 text-sm leading-relaxed">
									{post.desc}
								</p>
								{post.tags.length > 0 && (
									<div className="flex flex-wrap gap-1.5 mt-3">
										{post.tags.map(tag => (
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
		</>
	)
}
