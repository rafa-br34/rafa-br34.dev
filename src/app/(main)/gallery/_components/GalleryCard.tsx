import type { Artist, Artwork } from "@/lib/catalog"
import { getAlternative, getResource } from "@/lib/catalog"

export function GalleryCard(
	{
		artist,
		artwork,
		onClick,
	}: {
		readonly artist: Artist
		readonly artwork: Artwork
		readonly onClick: (artist: Artist, artwork: Artwork) => void
	},
) {
	return (
		<div
			className="overflow-hidden rounded-md cursor-pointer transition-transform hover:scale-105 break-inside-avoid mb-4"
			onClick={() => onClick(artist, artwork)}
		>
			<img
				src={getResource(artwork)}
				alt={getAlternative(artist, artwork)}
				width={artwork.shape.x}
				height={artwork.shape.y}
				decoding="async"
				className="w-full h-full object-cover"
			/>
		</div>
	)
}
