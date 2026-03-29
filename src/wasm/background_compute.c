#include <math.h>
#include <float.h>
#include <stdint.h>
#include <stdlib.h>
#include <emscripten/emscripten.h>

#include "kvec.h"


#ifndef max
	#define max(a, b) (((a) > (b)) ? (a) : (b))
#endif

#define FORCE_FUNCTION force_fn_normal
#define SENTINEL_VALUE (size_t)-1
#define BINARY_WRAP(x, y, world_size_x, world_size_y)     \
	(x) = ((x) < -(world_size_x)) ? (world_size_x) : (x); \
	(y) = ((y) < -(world_size_y)) ? (world_size_y) : (y); \
	(x) = ((x) > (world_size_x)) ? -(world_size_x) : (x); \
	(y) = ((y) > (world_size_y)) ? -(world_size_y) : (y);


static inline float force_fn_normal(float magnitude, float attraction, float beta) {
	if (magnitude < beta)
		return magnitude / beta - 1.f;
	else
		return attraction * (1.f - fabs(2.f * magnitude - 1.f - beta) / (1.f - beta));
}


static inline int cell_index(float position, float size, float cell_inverse, size_t cell_last) {
	if (position >= size)
		position -= size;
	else if (position < 0.f)
		position *= -1.f;

	int index = (int)floorf(position * cell_inverse);

	if (index > (int)cell_last)
		return (int)cell_last;
	else
		return index;
}

static inline int wrap_integer(int value, int last) {
	if (value < 0)
		return last;

	if (value > last)
		return 0;

	return value;
}


EMSCRIPTEN_KEEPALIVE void compute_kernel_fast(
	const float* __restrict matrix_values,
	size_t matrix_size,
	const uint8_t* __restrict particle_types,
	float* __restrict particle_pos_x,
	float* __restrict particle_pos_y,
	float* __restrict particle_vel_x,
	float* __restrict particle_vel_y,
	size_t particle_count,
	float force_beta,
	float force_range,
	float force_dampening,
	float force_multiplier,
	float time_delta,
	float world_size_x,
	float world_size_y
) {
	float cell_size = force_range;
	float cell_inverse = 1.f / cell_size;

	uint32_t cell_length_x = max(1, (uint32_t)ceilf(world_size_x / cell_size));
	uint32_t cell_length_y = max(1, (uint32_t)ceilf(world_size_y / cell_size));

	float cell_count = cell_length_x * cell_length_y;

	float cell_last_x = cell_length_x - 1.f;
	float cell_last_y = cell_length_y - 1.f;


	// First pass, count how many particles per cell
	size_t* cell_occupancy = calloc(cell_count, sizeof(size_t));

#pragma clang loop unroll_count(16)
	for (size_t i = 0; i < particle_count; i++) {
		int cx = cell_index(particle_pos_x[i], world_size_x, cell_inverse, cell_last_x);
		int cy = cell_index(particle_pos_y[i], world_size_y, cell_inverse, cell_last_y);

		cell_occupancy[cy * cell_length_x + cx]++;
	}


	// Second pass, get the largest cell
	kvec_t(size_t) used_cells;
	kv_init(used_cells);

	size_t maximum_occupancy = 0;

#pragma clang loop unroll_count(16)
	for (size_t i = 0; i < cell_count; i++) {
		size_t cell_particles = cell_occupancy[i];

		if (cell_particles)
			kv_push(size_t, used_cells, i);

		if (cell_particles > maximum_occupancy)
			maximum_occupancy = cell_particles;
	}

	if (maximum_occupancy == 0)
		maximum_occupancy++;

	size_t pitch_extra = maximum_occupancy + 1;


	// Third pass, write cell indexes
	size_t* flat_array = malloc(cell_count * pitch_extra * sizeof(size_t));
	size_t* write_position = calloc(cell_count, sizeof(size_t));

#pragma clang loop unroll_count(16)
	for (size_t i = 0; i < particle_count; i++) {
		int cx = cell_index(particle_pos_x[i], world_size_x, cell_inverse, cell_last_x);
		int cy = cell_index(particle_pos_y[i], world_size_y, cell_inverse, cell_last_y);

		int ci = cy * cell_length_x + cx;
		size_t value = write_position[ci];

		flat_array[(size_t)ci * pitch_extra + value] = i;
		write_position[ci]++;
	}


	// Fourth pass, write sentinels
	for (size_t i = 0; i < cell_count; i++) {
		size_t value = write_position[i];
		flat_array[i * pitch_extra + value] = SENTINEL_VALUE;
	}


	// Fifth pass, compute physical interactions between particles
	const float force_range_sqr = force_range * force_range;

	for (size_t i = 0; i < kv_size(used_cells); i++) {
		size_t ci = kv_A(used_cells, i);

		int cx = (int)(ci % cell_length_x);
		int cy = (int)(ci / cell_length_x);

		size_t neighbor_indexes[9];
		size_t neighbor_count = 0;

		// Search surrounding neighbors
#pragma clang loop unroll_count(3)
		for (int oy = -1; oy <= 1; oy++) {
#pragma clang loop unroll_count(3)
			for (int ox = -1; ox <= 1; ox++) {
				int nx = wrap_integer(cx + ox, cell_last_x);
				int ny = wrap_integer(cy + oy, cell_last_y);
				int nid = ny * cell_length_x + nx;

				if (flat_array[(size_t)nid * pitch_extra] != SENTINEL_VALUE)
					neighbor_indexes[neighbor_count++] = nid;
			}
		}

		// Iterate array data (A)
		for (size_t* pointer_a = &flat_array[ci * pitch_extra]; *pointer_a != SENTINEL_VALUE; pointer_a++) {
			size_t index_a = *pointer_a;
			uint8_t type_a = particle_types[index_a] * matrix_size;

			float tx = 0.f;
			float ty = 0.f;

			float ax = particle_pos_x[index_a];
			float ay = particle_pos_y[index_a];

			for (size_t n = 0; n < neighbor_count; n++) {
#pragma clang loop vectorize(enable) interleave(enable)
#pragma clang loop unroll_count(16)
				// Iterate array data (B)
				for (size_t* pointer_b = &flat_array[neighbor_indexes[n] * pitch_extra]; *pointer_b != SENTINEL_VALUE; pointer_b++) {
					size_t index_b = *pointer_b;

					if (index_a == index_b)
						continue;

					const float bx = particle_pos_x[index_b];
					const float by = particle_pos_y[index_b];

					float dx = bx - ax;
					float dy = by - ay;

					// Wrap logic
					if (dx > world_size_x) dx -= 2.f * world_size_x;
					if (dx < -world_size_x) dx += 2.f * world_size_x;
					if (dy > world_size_y) dy -= 2.f * world_size_y;
					if (dy < -world_size_y) dy += 2.f * world_size_y;


					const float range_sqr = dx * dx + dy * dy;

					if (range_sqr > force_range_sqr)
						continue;

					const float magnitude = sqrtf(range_sqr) + FLT_EPSILON;
					const float attraction = matrix_values[type_a + particle_types[index_b]];

					const float multiplier = FORCE_FUNCTION(magnitude / force_range, attraction, force_beta) * force_multiplier;

					tx += (dx / magnitude) * multiplier;
					ty += (dy / magnitude) * multiplier;
				}
			}

			particle_vel_x[index_a] = (particle_vel_x[index_a] + tx * time_delta) * force_dampening;
			particle_vel_y[index_a] = (particle_vel_y[index_a] + ty * time_delta) * force_dampening;
		}
	}


	// Sixth pass, write back
#pragma clang loop vectorize(enable) interleave(enable)
#pragma clang loop unroll_count(24)
	for (size_t i = 0; i < particle_count; i++) {
		float x = particle_pos_x[i] + particle_vel_x[i] * time_delta;
		float y = particle_pos_y[i] + particle_vel_y[i] * time_delta;

		BINARY_WRAP(x, y, world_size_x, world_size_y)

		particle_pos_x[i] = x;
		particle_pos_y[i] = y;
	}

	free(write_position);
	free(flat_array);
	free(cell_occupancy);
	kv_destroy(used_cells);
}


EMSCRIPTEN_KEEPALIVE void compute_kernel_naive(
	const float* __restrict matrix_values,
	size_t matrix_size,
	const uint8_t* __restrict particle_types,
	float* __restrict particle_pos_x,
	float* __restrict particle_pos_y,
	float* __restrict particle_vel_x,
	float* __restrict particle_vel_y,
	size_t particle_count,
	float force_beta,
	float force_range,
	float force_dampening,
	float force_multiplier,
	float time_delta,
	float world_size_x,
	float world_size_y
) {
	const float force_range_sqr = force_range * force_range;

#pragma clang loop unroll_count(8)
	for (int a = 0; a < particle_count; a++) {
		float
			tx = 0.f,
			ty = 0.f;

		const float
			ax = particle_pos_x[a],
			ay = particle_pos_y[a];

		const int type_a = particle_types[a] * matrix_size;

#pragma clang loop unroll_count(16)
		for (int b = 0; b < particle_count; b++) {
			if (a == b)
				continue;

			const float
				dx = particle_pos_x[b] - ax,
				dy = particle_pos_y[b] - ay;

			const float range_sqr = dx * dx + dy * dy;

			if (range_sqr > force_range_sqr)
				continue;

			const float magnitude = sqrt(range_sqr) + FLT_EPSILON;
			const float attraction = matrix_values[type_a + particle_types[b]];
			const float multiplier = FORCE_FUNCTION(magnitude / force_range, attraction, force_beta) * force_multiplier;

			tx += (dx / magnitude) * multiplier;
			ty += (dy / magnitude) * multiplier;
		}

		particle_vel_x[a] += tx * time_delta;
		particle_vel_y[a] += ty * time_delta;
		particle_vel_x[a] *= force_dampening;
		particle_vel_y[a] *= force_dampening;
	}

#pragma clang loop vectorize(enable) interleave(enable)
#pragma clang loop unroll_count(24)
	for (int i = 0; i < particle_count; i++) {

		float x = particle_pos_x[i] + particle_vel_x[i] * time_delta;
		float y = particle_pos_y[i] + particle_vel_y[i] * time_delta;

		BINARY_WRAP(x, y, world_size_x, world_size_y)

		particle_pos_x[i] = x;
		particle_pos_y[i] = y;
	}
}