import "../style/style.sass"
import Logos from "./social_media.json"

import $ from "jquery"
import yaml from "yaml"

import { Catalog, Artist, Artwork, GetResource, GetAlternative } from "./catalog"


function TrimLink(URL: string) {
	return URL
		.trim()
		.replace(/^https?:\/\//i, "")
		.replace(/^www\./i, "")
		.replace(/\/+$/, "")
}

function CreateOverlayField(Title: string, Content: string) {
	return $("<li>")
		.addClass("uk-margin-remove")
		.append(
			$("<span>")
			.text(Title)
		)
		.append(
			$("<span>")
			.addClass("uk-text-emphasis")
			.text(Content)
		)
}

function CreateOverlayMedia(Link: string, Type: string) {
	let Source = (Logos as any)[Type]

	console.assert(Source, "Failed to find logo for \"%s\"", Type)

	return $("<a>")
		.attr("href", Link)
		.attr("rel", "noopener")
		.attr("target", "_blank")
		.addClass("uk-margin-xsmall-top")
		.append(
			$("<img>")
				.attr("src", Source)
				.attr("alt", Type)
				.addClass("cs-logo-big")
		)
}

function CreateOverlayMirror(Link: string) {
	return $("<a>")
		.attr("href", Link)
		.attr("rel", "noopener")
		.attr("target", "_blank")
		.attr("uk-icon", "link-external")
		.text(TrimLink(Link))
		.add($("<br>"))
		
}

function CloseOverlay() {
	$("#Overlay").removeClass("visible")
	$(document).off(".overlay")
}

function OpenOverlay(Item_Artist: Artist, Item_Artwork: Artwork) {
	$("#OverlayTitle").text(Item_Artwork.file)
	
	// Setup details
	let DetailsFrag = $(document.createDocumentFragment())

	DetailsFrag.append(CreateOverlayField("Artist: ", Item_Artist.name))
	DetailsFrag.append(CreateOverlayField("Size: ", `${Item_Artwork.shape.x}x${Item_Artwork.shape.y}`))

	for (let [Key, Val] of Object.entries((Item_Artwork.dates as Record<string, string>)))
		DetailsFrag.append(CreateOverlayField(`Date of ${Key}: `, Val))

	$("#OverlayDetails")
		.empty()
		.append(DetailsFrag)

	// Setup socials
	let SocialsFrag = $(document.createDocumentFragment())

	for (let Social of Item_Artist.socials)
		SocialsFrag.append(CreateOverlayMedia(Social.link, Social.type))

	$("#OverlaySocials")
		.empty()
		.append(SocialsFrag)

	// Setup mirrors
	let MirrorsFrag = $(document.createDocumentFragment())

	for (let Mirror of Item_Artwork.mirrors)
		MirrorsFrag.append(CreateOverlayMirror(Mirror))

	$("#OverlayMirrors")
		.empty()
		.append(MirrorsFrag)

	// Setup close button
	$("#OverlayClose")
		.off("click.overlay")
		.on("click.overlay", CloseOverlay)

	$("#Overlay").addClass("visible")

	let Spinner = $("#OverlaySpinner")

	Spinner.removeAttr("hidden")

	$("#OverlayImage")
		.one("load", function() {
			Spinner.attr("hidden", "")
		})
		.each(function() {
			if((this as HTMLImageElement).complete)
				$(this).trigger("load")
		})
		.attr("src", GetResource(Item_Artwork))
		.attr("alt", GetAlternative(Item_Artist, Item_Artwork))
}

function CreateEntry(Item_Artist: Artist, Item_Artwork: Artwork) {
	let ImageElement =
		$(
			"<img>",
			{
				src: GetResource(Item_Artwork),
				alt: GetAlternative(Item_Artist, Item_Artwork),
				loading: "lazy"
			}
		)
		.addClass("uk-border-rounded uk-transition-scale-up uk-transition-opaque uk-width-1-1 cs-gallery-image")
		.data({ Item_Artist, Item_Artwork })

	return $("<div>").append(
		$("<div>")
		.addClass("uk-border-rounded uk-inline-clip uk-transition-toggle")
		.append(ImageElement)
	)
}

function ProcessCatalog(Response: string) {
	let Fragment = $(document.createDocumentFragment())

	let Entries: Catalog = yaml.parse(Response)

	for (let Item_Artist of Entries.artists)
		for (let Item_Artwork of Item_Artist.artworks)
			Fragment.append(CreateEntry(Item_Artist, Item_Artwork))

	$("#GalleryGrid").append(Fragment)
	$("#GalleryMask").addClass("hidden")
}

function Main() {
	$.get("/assets/artwork/_catalog.yml", ProcessCatalog)

	$("#GalleryGrid").on("click", ".cs-gallery-image", function () {
		const { Item_Artist, Item_Artwork } = $(this).data()
		OpenOverlay(Item_Artist, Item_Artwork)
	})
}

Main()