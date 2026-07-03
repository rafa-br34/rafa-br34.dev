"use client"

const TECH_STACK = [
	{ name: "React", link: "https://react.dev/" },
	{ name: "Tailwind", link: "https://tailwindcss.com/" },
	{ name: "Next.js", link: "https://nextjs.org/" },
	{ name: "TypeScript", link: "https://www.typescriptlang.org/" },
	{ name: "Emscripten", link: "https://emscripten.org/" },
]

export function Footer() {
	return (
		<footer className="backdrop-grayscale backdrop-brightness-75 backdrop-blur-[1px] border-t text-theme-fg-2 text-center text-sm py-8">
			<div className="container mx-auto space-y-4">
				<p>
					Website hosted on <a href="https://github.com/rafa-br34/rafa-br34.dev" className="underline">GitHub</a>
					<br />
					Built with {TECH_STACK.map(({ name, link }, idx, array) => (
						<span key={name}>
							{idx > 0 && (idx === array.length - 1 ? ", and " : ", ") || null}
							<a className="underline" href={link}>{name}</a>
						</span>
					))}
				</p>
				<p>
					&copy;2026 Rafael &quot;rafa_br34&quot; S. T. Third-party content is property of their respective owners.
				</p>
			</div>
		</footer>
	)
}
