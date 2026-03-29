cmake_minimum_required(VERSION 3.20)
project(background_compute C)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}")

add_executable(background_compute background_compute.c)

target_compile_options(background_compute PRIVATE
	-O3
	-ffast-math
	-fno-math-errno
	-msimd128
	-mllvm -vectorize-loops
	-mllvm -unroll-allow-partial=1
	-mllvm -unroll-threshold=256
)

target_link_options(background_compute PRIVATE
	"-sWASM=1"
	"-sMODULARIZE"
	"-sEXPORT_NAME='background_compute'"
	"-sEXPORTED_FUNCTIONS=['_compute_kernel_fast','_compute_kernel_naive','_malloc','_free']"
	"-sEXPORTED_RUNTIME_METHODS=['HEAPU8','HEAPF32','HEAP32','HEAPU32']"
	"-sALLOW_MEMORY_GROWTH=1"
	"-sENVIRONMENT=web"
	"-gsource-map"
)

