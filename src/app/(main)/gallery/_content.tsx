"use client"
import { useState } from "react"

import type { Artist, Artwork } from "@/lib/catalog"
import { GalleryGrid } from "./_components/GalleryGrid"
import { GalleryLoadingMask } from "./_components/GalleryLoadingMask"
import { GalleryOverlay } from "./_components/GalleryOverlay"
import { useCatalog } from "./_hooks/useCatalog"

export default function GalleryContent() {
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
