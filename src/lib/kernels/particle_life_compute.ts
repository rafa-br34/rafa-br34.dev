// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Factory = (moduleArg?: any) => Promise<ParticleLifeInterface>

declare global {
	// Set by the Emscripten UMD loader when loaded via <script>
	var particle_life_compute: Factory | undefined
}

let _factory: Factory | null = null
let _loading: Promise<Factory> | null = null

function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const script = document.createElement("script")
		script.src = src
		script.onload = () => resolve()
		script.onerror = () => reject(new Error(`Failed to load ${src}`))
		document.head.appendChild(script)
	})
}

async function getFactory(): Promise<Factory> {
	if (_factory) {
		return _factory
	}

	if (_loading !== null) {
		return _loading
	}

	_loading = (async () => {
		await loadScript("/wasm/particle_life_compute.js")

		if (!globalThis.particle_life_compute) {
			throw new Error("Emscripten loader did not set globalThis.particle_life_compute")
		}

		_factory = globalThis.particle_life_compute
		return _factory
	})()

	return _loading
}

export interface ParticleLifeInterface {
	HEAPU8: Uint8Array
	HEAPF32: Float32Array
	HEAP32: Int32Array
	HEAPU32: Uint32Array
	_aligned_alloc(alignment: number, size: number): number
	_malloc(size: number): number
	_free(ptr: number): void
	_compute_kernel_fast(
		matrixValues: number, // float*
		matrixSize: number, // size_t
		particleTypes: number, // uint8_t*
		particlePosX: number, // float*
		particlePosY: number, // float*
		particleVelX: number, // float*
		particleVelY: number, // float*
		particleCount: number, // size_t
		forceBeta: number, // float
		forceRange: number, // float
		forceDampening: number, // float
		forceMultiplier: number, // float
		timeDelta: number, // float
		worldSizeX: number, // float
		worldSizeY: number, // float
	): void
	_compute_kernel_fast_free(): void
	_compute_kernel_naive(
		matrixValues: number, // float*
		matrixSize: number, // size_t
		particleTypes: number, // uint8_t*
		particlePosX: number, // float*
		particlePosY: number, // float*
		particleVelX: number, // float*
		particleVelY: number, // float*
		particleCount: number, // size_t
		forceBeta: number, // float
		forceRange: number, // float
		forceDampening: number, // float
		forceMultiplier: number, // float
		timeDelta: number, // float
		worldSizeX: number, // float
		worldSizeY: number, // float
	): void
}

export async function ParticleLifeLoader(moduleArg?: Record<string, unknown>): Promise<ParticleLifeInterface> {
	const factory = await getFactory()

	return factory({
		...moduleArg,
		locateFile: (path: string) => {
			if (path.endsWith(".wasm")) {
				return "/wasm/particle_life_compute.wasm"
			}

			return path
		},
	})
}
