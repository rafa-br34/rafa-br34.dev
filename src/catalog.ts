interface SocialMedia {
	link: string,
	type: string
}

interface Artwork {
	file: string,
	type: ["gift", "commission", "request"]
	mirrors: string[],
	shape: {
		x: number,
		y: number
	},
	dates: {
		commission?: string,
		creation?: string,
		request?: string
	}
}

interface Artist {
	name: string,
	socials: SocialMedia[],
	artworks: Artwork[]
}

interface Catalog {
	artists: Artist[]
}

function GetResource(Item_Artwork: Artwork) {
	return `/assets/artwork/${Item_Artwork.file}`
}

function GetAlternative(Item_Artist: Artist, Item_Artwork: Artwork) {
	return `${Item_Artwork.type} from ${Item_Artist.name} titled ${Item_Artwork.file}`
}


export {
	SocialMedia,
	Artwork,
	Artist,
	Catalog,
	GetResource,
	GetAlternative
}