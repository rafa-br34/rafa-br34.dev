"use client"

import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { WebGLNodesHandler } from "three/examples/jsm/tsl/WebGLNodesHandler.js"
import {
	abs,
	clamp,
	float,
	Fn,
	fract,
	fwidth,
	max,
	min,
	mix,
	normalize,
	positionLocal,
	screenCoordinate,
	smoothstep,
	step,
	texture,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
} from "three/tsl"
import { MeshBasicNodeMaterial, Node } from "three/webgpu"

//
// SDF primitives
//
// The field pass stores *raw signed distances* in a half-float render target.
// The WebGL TSL adapter always applies a tone-map/color-space conversion to
// node material output (even for render targets), which would corrupt signed
// data, so each primitive here contributes a small GLSL body instead. The
// display shaders stay TSL and just sample the finished field texture.
//

type SdfParam = {
	key: string
	label: string
	min: number
	max: number
	step: number
	default: number
}

type SdfPrimitive = {
	readonly id: string
	readonly label: string
	readonly params: readonly SdfParam[]
	/** Body of `float sdfShape(vec2 p)`, reading the `u*` uniforms below. */
	readonly body: string
}

function param(key: string, label: string, min: number, max: number, step: number, defaultValue: number): SdfParam {
	return { key, label, min, max, step, default: defaultValue }
}

const SDF_PRIMITIVES = [
	{
		id: "circle",
		label: "Circle",
		params: [
			param("radius", "Radius", 0.05, 3, 0.05, 1),
		],
		body: "return length(p) - uRadius;",
	},
	{
		id: "roundedBox",
		label: "Rounded box",
		params: [
			param("halfX", "Half width", 0.05, 3, 0.05, 0.9),
			param("halfY", "Half height", 0.05, 3, 0.05, 0.6),
			param("corner", "Corner radius", 0, 1.2, 0.05, 0.32),
		],
		body: `
			vec2 q = abs(p) - vec2(uHalfX, uHalfY) + uCorner;
			return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uCorner;
		`,
	},
	{
		id: "box",
		label: "Box",
		params: [
			param("halfX", "Half width", 0.05, 3, 0.05, 0.75),
			param("halfY", "Half height", 0.05, 3, 0.05, 0.75),
		],
		body: `
			vec2 q = abs(p) - vec2(uHalfX, uHalfY);
			return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
		`,
	},
	{
		id: "segment",
		label: "Segment",
		params: [
			param("ax", "Start x", -3, 3, 0.05, -0.9),
			param("ay", "Start y", -3, 3, 0.05, 0),
			param("bx", "End x", -3, 3, 0.05, 0.9),
			param("by", "End y", -3, 3, 0.05, 0.15),
		],
		body: `
			vec2 a = vec2(uAx, uAy);
			vec2 b = vec2(uBx, uBy);
			vec2 pa = p - a;
			vec2 ba = b - a;
			float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
			return length(pa - ba * h);
		`,
	},
	{
		id: "ring",
		label: "Ring",
		params: [
			param("radius", "Radius", 0.1, 4, 0.05, 1),
			param("thickness", "Thickness", 0.01, 1, 0.01, 0.28),
		],
		body: "return abs(length(p) - uRadius) - uThickness;",
	},
] as const satisfies readonly SdfPrimitive[]

function uniformName(key: string) {
	return "u" + key.charAt(0).toUpperCase() + key.slice(1)
}

const RELIEF_LIMITS = { min: 0.05, max: 1.2, step: 0.01 } as const
const EXTENT_LIMITS = { min: 0.6, max: 30, step: 0.1 } as const

const FIELD_SIZE = 512
const MESH_SEGMENTS = 200
const CAMERA_DISTANCE_FACTOR = 2.8

//
// Interactive settings
//

type SdfSettings = {
	/** index into SDF_PRIMITIVES */
	mode: number
	/** how much field distance displaces the mesh */
	relief: number
	/** half-extent of the visible world window */
	extent: number
	/** per-shape option values, keyed by primitive id then param key */
	params: Record<string, Record<string, number>>
}

function defaultShapeParams(): SdfSettings["params"] {
	const params: SdfSettings["params"] = {}

	for (const shape of SDF_PRIMITIVES) {
		params[shape.id] = {}
		for (const p of shape.params) {
			params[shape.id][p.key] = p.default
		}
	}

	return params
}

const DEFAULT_SETTINGS: SdfSettings = {
	mode: 0,
	relief: 0.5,
	extent: 5,
	params: defaultShapeParams(),
}

//
// Field texture pass
//
// Rasterizes the chosen SDF into a single-channel half-float texture
// (x = signed distance). Switching shape swaps to another pre-built
// ShaderMaterial, i.e. one small shader compile per primitive.
//

const FIELD_VERT = /* glsl */ `
	out vec2 v_uv;
	void main() {
		v_uv = uv;
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`

function buildFieldMaterial(primitive: SdfPrimitive) {
	const uniforms: Record<string, THREE.IUniform> = {
		uCenter: { value: new THREE.Vector2(0, 0) },
		uExtent: { value: DEFAULT_SETTINGS.extent },
	}

	for (const param of primitive.params) {
		uniforms[uniformName(param.key)] = { value: param.default }
	}

	const paramDeclarations = primitive.params
		.map(p => `uniform float ${uniformName(p.key)};`)
		.join("\n")

	const fragmentShader = /* glsl */ `
		in vec2 v_uv;
		uniform vec2 uCenter;
		uniform float uExtent;
		${paramDeclarations}

		float sdfShape(vec2 p) {
			${primitive.body}
		}

		void main() {
			vec2 p = uCenter + vec2(v_uv.x - 0.5, 0.5 - v_uv.y) * (2.0 * uExtent);
			float d = sdfShape(p);
			gl_FragColor = vec4(vec3(d), 1.0);
		}
	`

	return new THREE.ShaderMaterial({
		uniforms,
		fragmentShader,
		vertexShader: FIELD_VERT,
		depthTest: false,
		depthWrite: false,
	})
}

function makeFieldRenderTarget(sizeX: number, sizeY: number) {
	return new THREE.WebGLRenderTarget(sizeX, sizeY, {
		type: THREE.HalfFloatType,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		generateMipmaps: false,
		depthBuffer: false,
		stencilBuffer: false,
	})
}

function initializeCanvas(
	canvas: HTMLCanvasElement,
	params: THREE.WebGLRendererParameters,
	onResize: () => void,
) {
	const renderer = new THREE.WebGLRenderer({ canvas, ...params })
	renderer.setPixelRatio(window.devicePixelRatio || 1)
	renderer.setNodesHandler(new WebGLNodesHandler())

	function resize() {
		if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
			return
		}

		onResize()
		renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
	}

	resize()

	const observer = new ResizeObserver(resize)
	observer.observe(canvas)

	return {
		disposeRenderer: () => {
			observer.disconnect()
			renderer.dispose()
		},
		renderer,
	}
}

function renderView(
	renderer: THREE.WebGLRenderer,
	x: number,
	y: number,
	sx: number,
	sy: number,
	scene: THREE.Scene,
	cam: THREE.Camera,
	color: THREE.Color,
) {
	renderer.setViewport(x, y, sx, sy)
	renderer.setScissor(x, y, sx, sy)
	renderer.setScissorTest(true)
	renderer.setClearColor(color, 1)
	renderer.render(scene, cam)
}

//
// TSL shaders
//

type FieldSampler = (uv: Node<"vec2">) => Node<"float">

function createFieldSampler(fieldTexture: THREE.Texture): FieldSampler {
	const fieldTextureNode = texture(fieldTexture)

	return point => fieldTextureNode.sample(clamp(point, 0.0, 1.0)).x
}

const sdfPalette = Fn(([v]: [Node<"float">]) => {
	const cold = mix(vec3(0.08, 0.18, 0.75), vec3(0.94, 0.97, 1.00), smoothstep(-1.5, 0.0, v))
	const warm = mix(vec3(0.98, 0.95, 0.88), vec3(0.80, 0.14, 0.05), smoothstep(0.0, 1.5, v))
	return mix(cold, warm, step(0.0, v))
})

interface GraphShaderOptions {
	readonly fieldTexture: THREE.Texture
	readonly fieldSizeX: number
	readonly fieldSizeY: number
	readonly initialRelief: number
	readonly initialWindowExtent: number
}

interface GraphShader {
	readonly material: MeshBasicNodeMaterial
	setRelief(relief: number): void
	setWindowExtent(windowExtent: number): void
}

// Displaces a flat grid by the sampled field and shades it by SDF value + slope.
function createGraphShader(options: GraphShaderOptions): GraphShader {
	const sample = createFieldSampler(options.fieldTexture)
	const texelX = 1 / options.fieldSizeX
	const texelY = 1 / options.fieldSizeY

	const reliefNode = uniform(options.initialRelief)
	const slopeScaleNode = uniform(4 * options.initialWindowExtent)
	const sunDirection = vec3(0.45, 0.85, 0.30)

	const material = new MeshBasicNodeMaterial({ side: THREE.DoubleSide })

	// displace each vertex along +Y by the sampled field value
	material.positionNode = positionLocal.add(vec3(0.0, sample(uv()).mul(reliefNode), 0.0))

	{
		const u = uv()
		const d0 = sample(u)
		const dL = sample(vec2(u.x.sub(texelX), u.y))
		const dR = sample(vec2(u.x.add(texelX), u.y))
		const dD = sample(vec2(u.x, u.y.sub(texelY)))
		const dU = sample(vec2(u.x, u.y.add(texelY)))

		// analytic normal from buffer neighbours
		const nrm = normalize(vec3(
			reliefNode.mul(dL.sub(dR)).mul(options.fieldSizeX),
			slopeScaleNode,
			reliefNode.mul(dU.sub(dD)).mul(options.fieldSizeY),
		))
		const lam = max(nrm.dot(sunDirection), 0.0)

		let col = sdfPalette(d0)
		col = col.mul(lam.mul(0.55).add(0.45))

		// crisp white band at the zero iso-line
		const zeroBand = float(1.0).sub(smoothstep(0.0, 0.04, abs(d0)))
		col = mix(col, vec3(1.0), zeroBand.mul(0.85))

		material.outputNode = vec4(col, 1.0)
	}

	return {
		material,
		setRelief: relief => {
			reliefNode.value = relief
		},
		setWindowExtent: windowExtent => {
			slopeScaleNode.value = 4 * windowExtent
		},
	}
}

interface ImageShaderOptions {
	readonly fieldTexture: THREE.Texture
}

interface ImageShader {
	readonly material: MeshBasicNodeMaterial
	setViewport(x: number, y: number, sx: number, sy: number): void
}

// Flat 2D preview of the same field, rendered into the right half of the canvas.
function createFieldImageShader(options: ImageShaderOptions): ImageShader {
	const sample = createFieldSampler(options.fieldTexture)

	const uViewPos = uniform(new THREE.Vector2(0, 0)) // right viewport origin (device px)
	const uViewSize = uniform(new THREE.Vector2(1, 1)) // right viewport size (device px)

	const material = new MeshBasicNodeMaterial({ depthTest: false, depthWrite: false })

	{
		const px = screenCoordinate

		// letterbox the square field inside the right viewport region
		const side = min(uViewSize.x, uViewSize.y)
		const off = uViewPos.add(uViewSize.sub(vec2(side, side)).mul(0.5))
		const m = px.sub(off)

		const inside = step(0.0, m.x).mul(step(0.0, m.y)).mul(step(m.x, side)).mul(step(m.y, side))

		const mapUv = m.div(side)
		const d = sample(mapUv)

		// SDF palette + iso contours (every 0.5 world units)
		let col = sdfPalette(d)
		const distanceBand = d.abs()
		const bandInner = min(fract(distanceBand.mul(2.0)), float(1.0).sub(fract(distanceBand.mul(2.0))))
		const bandWidth = max(fwidth(distanceBand).mul(2.0), 0.002)
		const bandLine = float(1.0).sub(smoothstep(0.0, bandWidth, bandInner))
		col = mix(col, col.mul(0.6), bandLine.mul(0.5))

		// crisp white band at the zero iso-line
		const zeroBand = float(1.0).sub(smoothstep(0.0, 0.05, abs(d)))
		col = mix(col, vec3(1.0), zeroBand.mul(0.9))

		// dark backdrop outside the field square
		col = mix(vec3(0.03, 0.035, 0.05), col, inside)

		material.outputNode = vec4(col, 1.0)
	}

	return {
		material,
		setViewport: (x, y, sx, sy) => {
			uViewPos.value.set(x, y)
			uViewSize.value.set(sx, sy)
		},
	}
}

//
// Config UI
//

function SettingSlider({
	label,
	value,
	min,
	max,
	step,
	onChange,
}: {
	readonly label: string
	readonly value: number
	readonly min: number
	readonly max: number
	readonly step: number
	readonly onChange: (value: number) => void
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-baseline justify-between gap-2 text-xs">
				<span className="font-semibold text-foreground">{label}</span>
				<span className="tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
			</div>
			<Slider
				aria-label={label}
				value={value}
				min={min}
				max={max}
				step={step}
				onValueChange={next => onChange(Array.isArray(next) ? (next[0] ?? min) : next)}
			/>
		</div>
	)
}

//
// Component
//

export function SDFInteractiveGraph() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const overlayRef = useRef<HTMLDivElement>(null)

	const overlaySizeRef = useRef({ w: 1, h: 1 })
	const viewCenterRef = useRef({ x: 0, z: 0 })
	const lastPointerRef = useRef({ x: 0, y: 0 })
	const mountedRef = useRef(true)

	// `settings` drives the config panel; `settingsRef` mirrors the latest
	// committed value for the mount-once render loop (which can never see
	// fresh closure state), so the effect doesn't have to re-run on change.
	const [settings, setSettings] = useState<SdfSettings>(DEFAULT_SETTINGS)
	const settingsRef = useRef(settings)

	useEffect(() => {
		settingsRef.current = settings
	}, [settings])

	const [center, setCenter] = useState({ x: 0, z: 0 })

	function updateSettings(patch: Partial<Pick<SdfSettings, "mode" | "relief" | "extent">>) {
		setSettings(prev => ({ ...prev, ...patch }))
	}

	function updateParam(shapeId: string, key: string, value: number) {
		setSettings(prev => ({
			...prev,
			params: {
				...prev.params,
				[shapeId]: {
					...prev.params[shapeId],
					[key]: value,
				},
			},
		}))
	}

	function syncCenterLabel() {
		if (mountedRef.current) {
			setCenter({ x: viewCenterRef.current.x, z: viewCenterRef.current.z })
		}
	}

	function hookMeshCamera(meshCanvas: HTMLCanvasElement) {
		const meshCamera = new THREE.PerspectiveCamera(50, 1, 0.01, 500)
		meshCamera.position.set(9, 7, 9)

		const meshControls = new OrbitControls(meshCamera, meshCanvas)
		meshControls.target.set(0, 0, 0)
		meshControls.enableDamping = true
		meshControls.dampingFactor = 0.08
		meshControls.enableZoom = false
		meshControls.enablePan = true
		meshControls.rotateSpeed = 0.7
		meshControls.maxPolarAngle = Math.PI * 0.49
		meshControls.addEventListener("change", () => {
			viewCenterRef.current.x = meshControls.target.x
			viewCenterRef.current.z = meshControls.target.z
		})
		meshControls.addEventListener("end", syncCenterLabel)

		return {
			meshCamera,
			meshControls,
			disposeMeshCamera: () => {
				meshControls.dispose()
			},
		}
	}

	useEffect(() => {
		const canvas = canvasRef.current
		const overlay = overlayRef.current

		if (!canvas || !overlay) {
			return
		}

		mountedRef.current = true

		const { meshCamera, meshControls, disposeMeshCamera } = hookMeshCamera(canvas)

		const { disposeRenderer, renderer } = initializeCanvas(
			canvas,
			{ alpha: true, antialias: true },
			() => {
				const rect = overlay.getBoundingClientRect()
				overlaySizeRef.current = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) }
			},
		)

		const imageCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2)
		imageCamera.position.set(0, 0, 1)

		//
		// Field texture pass: one material per primitive, so switching a
		// shape only swaps the shader on this small quad.
		//
		const fieldMaterials = SDF_PRIMITIVES.map(primitive => buildFieldMaterial(primitive))
		const fieldScene = new THREE.Scene()
		const fieldQuad = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			fieldMaterials[settingsRef.current.mode],
		)
		fieldQuad.frustumCulled = false
		fieldScene.add(fieldQuad)

		//
		// TSL shaders sampling the field texture
		//
		const fieldTarget = makeFieldRenderTarget(FIELD_SIZE, FIELD_SIZE)
		const graphShader = createGraphShader({
			fieldTexture: fieldTarget.texture,
			fieldSizeX: FIELD_SIZE,
			fieldSizeY: FIELD_SIZE,
			initialRelief: settingsRef.current.relief,
			initialWindowExtent: settingsRef.current.extent,
		})
		const imageShader = createFieldImageShader({
			fieldTexture: fieldTarget.texture,
		})

		//
		// Left viewport: displaced 3D surface over a subtle ground plane
		//
		const unitGeo = new THREE.PlaneGeometry(1, 1, MESH_SEGMENTS, MESH_SEGMENTS)
		unitGeo.rotateX(-Math.PI / 2)

		const planeMat = new THREE.MeshBasicMaterial({
			color: 0x333333,
			transparent: true,
			opacity: 0.15,
			side: THREE.DoubleSide,
			depthWrite: false,
		})

		const graphScene = new THREE.Scene()
		const graphPlane = new THREE.Mesh(unitGeo, planeMat)
		const graphMesh = new THREE.Mesh(unitGeo, graphShader.material)
		graphPlane.renderOrder = 1
		graphScene.add(graphMesh)
		graphScene.add(graphPlane)

		//
		// Right viewport: flat 2D field preview
		//
		const imageScene = new THREE.Scene()
		const imageQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), imageShader.material)
		imageQuad.frustumCulled = false
		imageScene.add(imageQuad)

		//
		// Gestures on the right (2D) viewport: drag pans, wheel zooms
		//
		function screenToView(deltaCss: number) {
			const { w, h } = overlaySizeRef.current
			const overlaySide = Math.min(w, h)
			return (deltaCss / overlaySide) * (2 * settingsRef.current.extent)
		}

		const onWheel = (event: WheelEvent) => {
			event.preventDefault()
			const zoomFactor = Math.exp(-event.deltaY * 0.0015)
			const nextExtent = Math.min(
				EXTENT_LIMITS.max,
				Math.max(EXTENT_LIMITS.min, settingsRef.current.extent * zoomFactor),
			)
			updateSettings({ extent: nextExtent })
		}

		const onPointerDown = (event: PointerEvent) => {
			overlay.setPointerCapture(event.pointerId)
			lastPointerRef.current = { x: event.clientX, y: event.clientY }
			overlay.style.cursor = "grabbing"
		}

		const onPointerMove = (event: PointerEvent) => {
			if (!overlay.hasPointerCapture(event.pointerId)) {
				return
			}

			const deltaX = event.clientX - lastPointerRef.current.x
			const deltaY = event.clientY - lastPointerRef.current.y
			lastPointerRef.current = { x: event.clientX, y: event.clientY }

			// grab-the-map: the world point under the cursor stays fixed
			viewCenterRef.current.x -= screenToView(deltaX)
			viewCenterRef.current.z -= screenToView(deltaY)
			meshControls.target.set(viewCenterRef.current.x, 0, viewCenterRef.current.z)
		}

		const onPointerUp = (event: PointerEvent) => {
			if (overlay.hasPointerCapture(event.pointerId)) {
				overlay.releasePointerCapture(event.pointerId)
			}
			overlay.style.cursor = "grab"
			syncCenterLabel()
		}

		overlay.style.cursor = "grab"
		overlay.addEventListener("wheel", onWheel, { passive: false })
		overlay.addEventListener("pointerdown", onPointerDown)
		overlay.addEventListener("pointermove", onPointerMove)
		overlay.addEventListener("pointerup", onPointerUp)
		overlay.addEventListener("pointercancel", onPointerUp)

		//
		// Render loop
		//
		const skyColor = new THREE.Color(0.30, 0.30, 0.30)
		const darkColor = new THREE.Color(0.03, 0.035, 0.05)
		const tmpDirection = new THREE.Vector3()

		let animationFrame = 0
		let lastAspectWidth = 0
		let lastAspectHeight = 0

		function updateMeshPlacement() {
			const { x, z } = viewCenterRef.current
			const meshScale = 2 * settingsRef.current.extent

			graphMesh.position.set(x, 0, z)
			graphMesh.scale.set(meshScale, 1, meshScale)
			graphPlane.position.set(x, 0, z)
			graphPlane.scale.set(meshScale, 1, meshScale)
		}

		function updateFieldUniforms() {
			const { x, z } = viewCenterRef.current
			const { mode, relief, extent, params } = settingsRef.current
			const primitive = SDF_PRIMITIVES[mode]
			const material = fieldMaterials[mode]

			if (fieldQuad.material !== material) {
				fieldQuad.material = material
			}

			const shapeParams = params[primitive.id]
			material.uniforms.uCenter.value.set(x, z)
			material.uniforms.uExtent.value = extent

			for (const param of primitive.params) {
				material.uniforms[uniformName(param.key)].value = shapeParams[param.key]
			}

			graphShader.setRelief(relief)
			graphShader.setWindowExtent(extent)
		}

		function updateCamera() {
			const { x, z } = viewCenterRef.current

			// camera distance is derived from zoom; direction is the user's orbit
			meshControls.target.set(x, 0, z)
			tmpDirection.copy(meshCamera.position).sub(meshControls.target)

			if (tmpDirection.lengthSq() < 1e-8) {
				tmpDirection.set(1, 0.5, 1)
			}

			meshCamera.position
				.copy(meshControls.target)
				.addScaledVector(tmpDirection.normalize(), settingsRef.current.extent * CAMERA_DISTANCE_FACTOR)

			meshControls.update()
		}

		function frame() {
			animationFrame = requestAnimationFrame(frame)

			const deviceWidth = renderer.domElement.width
			const deviceHeight = renderer.domElement.height
			const leftWidth = Math.floor(deviceWidth / 2)
			const rightWidth = deviceWidth - leftWidth

			// viewports changed size -> refresh the left camera aspect ratio
			if (leftWidth !== lastAspectWidth || deviceHeight !== lastAspectHeight) {
				meshCamera.aspect = leftWidth / deviceHeight
				meshCamera.updateProjectionMatrix()
				lastAspectWidth = leftWidth
				lastAspectHeight = deviceHeight
			}

			updateMeshPlacement()
			updateFieldUniforms()
			updateCamera()

			// the ONE SDF sampling pass -> shared field target
			renderer.setRenderTarget(fieldTarget)
			renderer.render(fieldScene, imageCamera)
			renderer.setRenderTarget(null)

			// left viewport: 3D graph
			renderView(renderer, 0, 0, leftWidth, deviceHeight, graphScene, meshCamera, skyColor)

			// right viewport: 2D field image
			imageShader.setViewport(leftWidth, 0, rightWidth, deviceHeight)
			renderView(renderer, leftWidth, 0, rightWidth, deviceHeight, imageScene, imageCamera, darkColor)

			renderer.setScissorTest(false)
			renderer.setViewport(0, 0, deviceWidth, deviceHeight)
		}

		updateMeshPlacement()
		updateFieldUniforms()
		frame()

		return () => {
			cancelAnimationFrame(animationFrame)
			disposeRenderer()
			disposeMeshCamera()

			overlay.removeEventListener("wheel", onWheel)
			overlay.removeEventListener("pointerdown", onPointerDown)
			overlay.removeEventListener("pointermove", onPointerMove)
			overlay.removeEventListener("pointerup", onPointerUp)
			overlay.removeEventListener("pointercancel", onPointerUp)

			for (const material of fieldMaterials) {
				material.dispose()
			}

			graphShader.material.dispose()
			planeMat.dispose()
			imageShader.material.dispose()
			unitGeo.dispose()
			fieldTarget.dispose()

			mountedRef.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const activePrimitive = SDF_PRIMITIVES[settings.mode]
	const activeParams = settings.params[activePrimitive.id]

	return (
		<div className="grid grid-cols-1 gap-2 bg-clip-content rounded-md border border-theme-bg-2">
			<div className="relative h-120 min-h-0 min-w-0 w-full border-b border-theme-bg-2 overflow-hidden">
				<canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-md" />
				<div
					ref={overlayRef}
					className="absolute inset-y-0 right-0 w-1/2 cursor-grab touch-none"
				/>
				<div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-theme-bg-2" />
			</div>

			<div className="flex flex-col gap-3 p-3">
				<div className="flex flex-col gap-1.5">
					<span className="text-xs font-semibold text-foreground">SDF shape</span>
					<ToggleGroup
						aria-label="SDF shape"
						variant="outline"
						size="sm"
						value={[String(settings.mode)]}
						onValueChange={values => {
							const nextMode = Number(values[0])

							if (!Number.isNaN(nextMode)) {
								updateSettings({ mode: nextMode })
							}
						}}
						className="w-fit flex-wrap"
					>
						{SDF_PRIMITIVES.map((primitive, index) => (
							<ToggleGroupItem key={primitive.id} value={String(index)} className="px-2 text-xs">
								{primitive.label}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				</div>

				<div className="flex flex-col gap-1.5">
					<span className="text-xs font-semibold text-foreground">{activePrimitive.label} options</span>
					<div className="flex flex-wrap gap-x-8 gap-y-4">
						{activePrimitive.params.map(p => (
							<div key={p.key} className="min-w-40 flex-1">
								<SettingSlider
									label={p.label}
									value={activeParams[p.key]}
									min={p.min}
									max={p.max}
									step={p.step}
									onChange={value => updateParam(activePrimitive.id, p.key, value)}
								/>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-1.5 border-t border-theme-bg-2 pt-3">
					<span className="text-xs font-semibold text-foreground">View</span>
					<div className="flex flex-wrap gap-x-8 gap-y-4">
						<div className="min-w-40 flex-1">
							<SettingSlider
								label="Relief"
								value={settings.relief}
								{...RELIEF_LIMITS}
								onChange={value => updateSettings({ relief: value })}
							/>
						</div>
						<div className="min-w-40 flex-1">
							<SettingSlider
								label="Zoom (half extent)"
								value={settings.extent}
								{...EXTENT_LIMITS}
								onChange={value => updateSettings({ extent: value })}
							/>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-t border-theme-bg-2 pt-3">
					<div className="rounded border border-theme-bg-2 p-2 text-[11px] leading-4">
						<div className="font-semibold">Center</div>
						<div>x: {center.x.toFixed(2)}</div>
						<div>z: {center.z.toFixed(2)}</div>
					</div>
					<div className="text-[11px] leading-4 text-theme-fg-3">
						Left: drag = orbit, right-drag = pan
						<br />
						Right: drag = pan, wheel = zoom
					</div>
				</div>
			</div>
		</div>
	)
}
