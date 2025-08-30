import compute_kernel_loader from "./wasm/background_compute"


export interface ComputeKernelInterface {
	HEAPU8: Uint8Array,
	HEAPF32: Float32Array,
	HEAP32: Int32Array,
	HEAPU32: Uint32Array,
	_malloc(size: number): number,
	_free(ptr: number): void,
	_compute_kernel(
		matrix_values: number,    // FP32*
		matrix_size: number,      // INT
		particle_types: number,   // UI8*
		particle_entries: number, // FP32*
		particle_count: number,   // INT
		force_range: number,      // FP32
		force_multiplier: number, // FP32
		force_dampening: number,  // FP32
		force_beta: number,       // FP32
		time_delta: number,       // FP32
		canvas_scaling_x: number, // FP32
		canvas_scaling_y: number, // FP32
	): void
}

export const ComputeKernelLoader = compute_kernel_loader as unknown as (moduleArg?: any) => Promise<ComputeKernelInterface>