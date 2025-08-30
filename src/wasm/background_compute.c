#include <math.h>
#include <float.h>
#include <stdint.h>
#include <emscripten/emscripten.h>

// emcc background_compute.c -mllvm -vectorize-loops -mllvm -unroll-allow-partial=1 -mllvm -unroll-threshold=256 -O3 -ffast-math -fno-math-errno -msimd128 -s WASM=1 -s MODULARIZE -s 'EXPORT_NAME="background_compute"' -s EXPORTED_FUNCTIONS='["_compute_kernel","_malloc","_free"]' -s EXPORTED_RUNTIME_METHODS='["HEAPU8","HEAPF32","HEAP32","HEAPU32"]' -s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web -o background_compute.js

static inline float custom_abs(float value) {
	return value > 0.f ? value : -value;
}

static inline float compute_force(float magnitude, float attraction, float beta) {
	if (magnitude < beta)
		return magnitude / beta - 1.f;
	else
		return attraction * (1.f - fabsf(2.f * magnitude - 1.f - beta) / (1.f - beta));
}

// @todo Maybe use quad-trees akin to Barnes-Hut
EMSCRIPTEN_KEEPALIVE void compute_kernel(
	const float* __restrict   matrix_values,
	int                       matrix_size,
	const uint8_t* __restrict particle_types,
	float* __restrict         particle_entries,
	int                       particle_count,
	float                     force_range,
	float                     force_multiplier,
	float                     force_dampening,
	float                     force_beta,
	float                     time_delta,
	float                     canvas_scaling_x,
	float                     canvas_scaling_y
) {
	const float force_range_sqr = force_range * force_range;
	float* __restrict aligned_entries = (float*)__builtin_assume_aligned(particle_entries, 16);

	#pragma clang loop unroll_count(8)
	for (int a = 0; a < particle_count; a++) {
		const int a_idx = a * 4;

		float
			tx = 0.f,
			ty = 0.f;

		const float
			ax = aligned_entries[a_idx + 0],
			ay = aligned_entries[a_idx + 1];

		const int type_a = particle_types[a] * matrix_size;

		#pragma clang loop unroll_count(16)
		for (int b = 0; b < particle_count; b++) {
			if (a == b)
				continue;

			const int b_idx = b * 4;

			const float
				dx = aligned_entries[b_idx + 0] - ax,
				dy = aligned_entries[b_idx + 1] - ay;
			
			const float range_sqr = dx * dx + dy * dy;

			if (range_sqr > force_range_sqr)
				continue;

			const float magnitude = sqrt(range_sqr) + FLT_EPSILON;
			const float attraction = matrix_values[type_a + particle_types[b]];
			const float multiplier = compute_force(magnitude / force_range, attraction, force_beta) * force_multiplier;

			tx += (dx / magnitude) * multiplier;
			ty += (dy / magnitude) * multiplier;
		}

		aligned_entries[a_idx + 2] += tx * time_delta;
		aligned_entries[a_idx + 3] += ty * time_delta;
		aligned_entries[a_idx + 2] *= force_dampening;
		aligned_entries[a_idx + 3] *= force_dampening;
	}

	#pragma clang loop vectorize(enable) interleave(enable)
	#pragma clang loop unroll_count(24)
	for (int i = 0; i < particle_count; i++) {
		const int idx = i * 4;

		float x = aligned_entries[idx + 0] + aligned_entries[idx + 2] * time_delta;
		float y = aligned_entries[idx + 1] + aligned_entries[idx + 3] * time_delta;

		x = (x < -canvas_scaling_x) ?  canvas_scaling_x : x;
		y = (y < -canvas_scaling_y) ?  canvas_scaling_y : y;
		x = (x >  canvas_scaling_x) ? -canvas_scaling_x : x;
		y = (y >  canvas_scaling_y) ? -canvas_scaling_y : y;

		aligned_entries[idx + 0] = x;
		aligned_entries[idx + 1] = y;
	}
}
