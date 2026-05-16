import { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Footer } from "../components/Footer"
import { Navbar } from "../components/Navbar"
import { ParticleBackground } from "../components/ParticleBackground"

export function RootLayout(
	{
		includeNavbar = true,
		includeFooter = true,
	}: {
		readonly includeNavbar?: boolean
		readonly includeFooter?: boolean
	},
) {
	const { pathname } = useLocation()
	const scrollRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		window.history.scrollRestoration = "manual"
	}, [])

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
	}, [pathname])

	return (
		<div className="h-screen w-full">
			<div
				ref={scrollRef}
				className="relative w-full h-screen text-theme-fg-0 overflow-y-auto overflow-x-clip flex flex-col"
			>
				{includeNavbar ? <Navbar /> : null}
				<ParticleBackground className="fixed inset-0 -z-10" />

				<main className="flex-1">
					<Outlet />
				</main>
				{includeFooter ? <Footer /> : null}
			</div>
		</div>
	)
}
