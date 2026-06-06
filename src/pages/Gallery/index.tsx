import { useState } from "react"

import { SEO } from "../../components/SEO"
import type { Artist, Artwork } from "../../lib/catalog"
import { GalleryGrid } from "./components/GalleryGrid"
import { GalleryLoadingMask } from "./components/GalleryLoadingMask"
import { GalleryOverlay } from "./components/GalleryOverlay"
import { useCatalog } from "./hooks/useCatalog"

export function Gallery() {
	const { catalog, loading, error } = useCatalog()
	const [selected, setSelected] = useState<{ artist: Artist; artwork: Artwork } | null>(null)

	if (error) {
		return (
			<div className="flex justify-center p-8 text-theme-r-1">
				Failed to load gallery: {error.message}
			</div>
		)
	}

	return (
		<>
			<SEO title="Gallery - rafa_br34" canonicalPath="/gallery" />

			{loading && <GalleryLoadingMask />}

			{catalog && (
				<GalleryGrid
					catalog={catalog}
					onArtworkClick={(artist, artwork) => setSelected({ artist, artwork })}
				/>
			)}

			<GalleryOverlay
				artist={selected?.artist ?? null}
				artwork={selected?.artwork ?? null}
				open={!!selected}
				onClose={() => setSelected(null)}
			/>
		</>
	)
}
