import { Loader2, X } from "lucide-react"
import { useState } from "react"

import type { Artist, Artwork } from "@/lib/catalog"
import { getAlternative, getResource } from "@/lib/catalog"
import Logos from "@/social_media.json"

function trimLink(url: string) {
	return url
		.trim()
		.replace(/^https?:\/\//i, "")
		.replace(/^www\./i, "")
		.replace(/\/+$/, "")
}

export function GalleryOverlay(
	{
		artist,
		artwork,
		open,
		onClose,
	}: {
		readonly artist: Artist | null
		readonly artwork: Artwork | null
		readonly open: boolean
		readonly onClose: () => void
	},
) {
	const [imageLoaded, setImageLoaded] = useState(false)

	if (!artist || !artwork || !open) {
		return null
	}

	return (
		<div
			className="fixed inset-0 z-[1200] bg-black/85 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="bg-theme-bg-1 text-theme-fg-0 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
				onClick={event => event.stopPropagation()}
			>
				<button
					className="absolute top-3 right-3 text-theme-fg-2 hover:text-theme-fg-0"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="h-5 w-5" />
				</button>

				<h3 className="text-lg font-bold mb-4">{artwork.file}</h3>

				<div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
					<div className="relative">
						{!imageLoaded && (
							<div className="absolute inset-0 flex items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-theme-fg-2" />
							</div>
						)}
						<img
							src={getResource(artwork)}
							alt={getAlternative(artist, artwork)}
							className="w-full max-h-[80vh] object-contain"
							onLoad={() => setImageLoaded(true)}
							onError={() => setImageLoaded(true)}
						/>
					</div>

					<div className="space-y-4 min-w-[200px]">
						<ul className="space-y-1 text-sm">
							<li>
								Artist: <span className="text-theme-fg-0 font-medium">{artist.name}</span>
							</li>
							<li>
								Size:{" "}
								<span className="text-theme-fg-0">
									{artwork.shape.x}x{artwork.shape.y}
								</span>
							</li>
							{Object.entries(artwork.dates ?? {}).map(([key, val]) => (
								<li key={key}>
									Date of {key}: <span className="text-theme-fg-0">{val}</span>
								</li>
							))}
						</ul>

						<div>
							<h4 className="text-sm font-medium mb-1">Artist socials</h4>
							<div className="flex flex-wrap gap-2">
								{artist.socials.map(social => (
									<a key={social.type} href={social.link} target="_blank" rel="noopener">
										<img
											src={(Logos as Record<string, string>)[social.type]}
											alt={social.type}
											className="h-8 w-8"
										/>
									</a>
								))}
							</div>
						</div>

						{artwork.mirrors.length > 0 && (
							<div>
								<h4 className="text-sm font-medium mb-1">Image mirrors</h4>
								<div className="space-y-1 text-sm">
									{artwork.mirrors.map(mirror => (
										<a
											key={mirror}
											href={mirror}
											target="_blank"
											rel="noopener"
											className="block text-theme-fg-1 hover:text-theme-fg-0 truncate"
										>
											{trimLink(mirror)}
										</a>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
