import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "Gallery",
	alternates: { canonical: "/gallery" },
}

import GalleryContent from "./_content"

export default function Gallery() {
	return <GalleryContent />
}
