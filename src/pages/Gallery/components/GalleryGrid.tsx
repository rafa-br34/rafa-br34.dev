import type { Artist, Artwork, Catalog } from "../../../catalog"
import { GalleryCard } from "./GalleryCard"

export function GalleryGrid(
	{
		catalog,
		onArtworkClick,
	}: {
		readonly catalog: Catalog
		readonly onArtworkClick: (artist: Artist, artwork: Artwork) => void
	},
) {
	const items = catalog.artists.flatMap(
		artist =>
			artist.artworks.map(
				artwork => ({ artist, artwork }),
			),
	)

	return (
		<div className="p-4">
			<div className="columns-2 sm:columns-3 lg:columns-6 gap-4">
				{items.map(({ artist, artwork }) => (
					<GalleryCard
						key={`${artist.name}-${artwork.file}`}
						artist={artist}
						artwork={artwork}
						onClick={onArtworkClick}
					/>
				))}
			</div>
		</div>
	)
}
