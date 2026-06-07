cmake_minimum_required(VERSION 3.20)
project(compute-kernels C)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}")

add_executable(particle_life_compute particle_life_compute.c)

target_compile_options(particle_life_compute PRIVATE
	-O3
	-ffast-math
	-fno-math-errno
	-msimd128
	-mllvm -vectorize-loops
	-fvectorize
	-fslp-vectorize
	-Rpass=loop-vectorize
	-Rpass-missed=loop-vectorize
	-Rpass-analysis=loop-vectorize
)

target_link_options(particle_life_compute PRIVATE
	"-sWASM=1"
	"-sMODULARIZE"
	"-sEXPORT_NAME='particle_life_compute'"
	"-sEXPORTED_FUNCTIONS=['_compute_kernel_fast','_compute_kernel_naive','_compute_kernel_fast_free','_aligned_alloc','_malloc','_free']"
	"-sEXPORTED_RUNTIME_METHODS=['HEAPU8','HEAPF32','HEAP32','HEAPU32']"
	"-sALLOW_MEMORY_GROWTH=1"
	"-sENVIRONMENT=web"
)

