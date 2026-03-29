import compute_kernel_loader from "./wasm/background_compute"

export interface ComputeKernelInterface {
	HEAPU8: Uint8Array
	HEAPF32: Float32Array
	HEAP32: Int32Array
	HEAPU32: Uint32Array
	_malloc(size: number): number
	_free(ptr: number): void
	_compute_kernel_fast(
		matrix_values: number, // float*
		matrix_size: number, // size_t
		particle_types: number, // uint8_t*
		particle_pos_x: number, // float*
		particle_pos_y: number, // float*
		particle_vel_x: number, // float*
		particle_vel_y: number, // float*
		particle_count: number, // size_t
		force_beta: number, // float
		force_range: number, // float
		force_dampening: number, // float
		force_multiplier: number, // float
		time_delta: number, // float
		world_size_x: number, // float
		world_size_y: number, // float
	): void
	_compute_kernel_naive(
		matrix_values: number, // float*
		matrix_size: number, // size_t
		particle_types: number, // uint8_t*
		particle_pos_x: number, // float*
		particle_pos_y: number, // float*
		particle_vel_x: number, // float*
		particle_vel_y: number, // float*
		particle_count: number, // size_t
		force_beta: number, // float
		force_range: number, // float
		force_dampening: number, // float
		force_multiplier: number, // float
		time_delta: number, // float
		world_size_x: number, // float
		world_size_y: number, // float
	): void
}

export const ComputeKernelLoader = compute_kernel_loader as unknown as (moduleArg?: any) => Promise<ComputeKernelInterface>
