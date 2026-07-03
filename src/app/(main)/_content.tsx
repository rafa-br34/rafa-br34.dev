"use client"

import Decimal from "decimal.js"
import { useEffect, useLayoutEffect, useState } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const socialsList = [
	{
		name: "Discord",
		link: "https://discord.com/users/642064514476408832",
		logo: "discord.png",
	},
	{
		name: "GitHub",
		link: "https://github.com/rafa-br34",
		logo: "github.png",
	},
	{
		name: "Youtube",
		link: "https://www.youtube.com/@rafa_br34",
		logo: "youtube.png",
	},
	{
		name: "Steam",
		link: "https://steamcommunity.com/id/rafa_br34/",
		logo: "steam.svg",
	},
	{
		name: "Bluesky",
		link: "https://bsky.app/profile/r34.bsky.social",
		logo: "bluesky.svg",
	},
	{
		name: "FurAffinity",
		link: "https://www.furaffinity.net/user/rafa-br34",
		logo: "furaffinity.png",
	},
]

export default function HomeContent() {
	const MS_PER_GREGORIAN_YEAR = Decimal(365.2425).mul(24 * 60 * 60 * 1000)
	const MS_PER_HOUR = new Decimal(60 * 60 * 1000)

	// 2008-03-13 11:06 UTC-03
	const birthday = new Decimal(Date.UTC(2008, 2, 13, 11, 6)).plus(MS_PER_HOUR.mul(3))

	function calculateAge() {
		const currentTime = new Decimal(Date.now())
		const timeSinceBirthday = currentTime.sub(birthday)
		return timeSinceBirthday.div(MS_PER_GREGORIAN_YEAR)
	}

	const [yearsSinceBirth, setYearsSinceBirth] = useState<Decimal | null>()

	useLayoutEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setYearsSinceBirth(calculateAge())
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		let running = true
		function tick() {
			if (!running) {
				return
			}

			setYearsSinceBirth(calculateAge())
			requestAnimationFrame(tick)
		}

		requestAnimationFrame(tick)
		return () => {
			running = false
		}
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="min-h-screen">
			<div className="relative overflow-hidden">
				<img
					src="/assets/artwork/gummi_arts_banner.png"
					className="block w-full h-[400px] object-cover object-top"
					style={{ imageRendering: "pixelated" }}
					alt="Banner"
				/>
				<div className="absolute bottom-0 left-0 right-0 border-b" />
			</div>

			<div className="container mx-auto m-4 px-4 text-shadow-lg/30">
				<h1 className="text-left text-4xl mb-4">Hello stranger!</h1>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="sm:col-span-2 space-y-4">
						<p>
							It seems you have found my personal web page! Here you can find some of my projects and perhaps learn a bit about me.
						</p>
						<p>Online, I'm known as rafa_br34, rafa-br34, or rarely rafabr34.</p>
						<p>
							<Tooltip>
								I am an <TooltipTrigger render={<u className="decoration-solid decoration-theme-fg-2">{yearsSinceBirth?.toFixed(7) ?? "..."}</u>} />{" "}
								<TooltipContent>
									<p>This is a feature not a bug</p>
								</TooltipContent>
							</Tooltip>
							year-old Brazilian programmer who loves mythological/fictional beasts and likes anything even remotely related to computers.
							<br />
							I code C/C++, Python, TypeScript, and a bit of Verilog/SystemVerilog. I also have an interest in cybersecurity, computer science, and physics.
						</p>
						<p>My sona is a black feral furred dragon with very specific markings on their snout</p>
						<p>
							Feel free to reach out through Discord (rafa_br34) (nearly instant response if I'm available). Alternatively email{" "}
							<a href="mailto:rafa_br34@exulan.com" className="underline">rafa_br34@exulan.com</a> (will likely take much longer to answer).
						</p>

						<h2 className="text-left text-xl">Socials</h2>
						<div className="flex flex-wrap items-center gap-2">
							{socialsList.map(({ name, link, logo }) => (
								<a key={link} href={link} target="_blank" rel="noopener">
									<img src={`/assets/logos/${logo}`} alt={name} className="h-8 w-8" />
								</a>
							))}
						</div>
					</div>

					<div className="sm:col-span-1 flex items-center justify-center aspect-square">
						<div className="text-center">
							<img
								src="/assets/artwork/gummi_arts_stare.png"
								className="rounded-lg mx-auto w-96"
								alt="My character drawn by Gummi_art"
							/>
							<p className="text-xs text-theme-fg-2 mt-2">
								My character drawn by{" "}
								<a
									href="https://www.furaffinity.net/user/gummiart"
									className="underline"
									target="_blank"
									rel="noopener"
								>
									Gummi_art
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
