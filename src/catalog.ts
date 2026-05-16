interface SocialMedia {
	link: string
	type: string
}

interface Artwork {
	file: string
	type: ["gift", "commission", "request"]
	mirrors: string[]
	shape: {
		x: number
		y: number
	}
	dates: {
		commission?: string
		creation?: string
		request?: string
	}
}

interface Artist {
	name: string
	socials: SocialMedia[]
	artworks: Artwork[]
}

interface Catalog {
	artists: Artist[]
}

function getResource(itemArtwork: Artwork) {
	return `/assets/artwork/${itemArtwork.file}`
}

function getAlternative(itemArtist: Artist, itemArtwork: Artwork) {
	return `${itemArtwork.type} from ${itemArtist.name} titled ${itemArtwork.file}`
}

export { Artist, Artwork, Catalog, getAlternative, getResource, SocialMedia }
