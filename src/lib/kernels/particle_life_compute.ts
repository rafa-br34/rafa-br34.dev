import compute_kernel_loader from "@/wasm/particle_life_compute"

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

export const ParticleLifeLoader = compute_kernel_loader as unknown as (moduleArg?: any) => Promise<ParticleLifeInterface>
