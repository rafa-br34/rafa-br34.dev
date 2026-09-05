import random
import subprocess
import sys
import time

import torch
import torchvision.transforms.functional as tv_functional
from PIL import Image, ImageDraw, ImageFont
from torch import nn, optim
from tqdm import tqdm

torch.use_deterministic_algorithms(True)
torch.manual_seed(0)
random.seed(0)

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
dtype = torch.float32

#"""
target_file = "optim_target_gummi_art.png"
target_res = 2

iter_count = 1500
item_count = 5000
snapshot_every = 1
#"""
"""
target_file = "optim_target_o_pastelzera_headshot.png"
target_res = 2.5

iter_count = 1500
item_count = 2000
snapshot_every = 1
#"""

image = Image.open(target_file).convert("RGB")
image = image.resize([int(sz / target_res) for sz in image.size])
image_sx, image_sy = image.size
target = tv_functional.pil_to_tensor(image).to(device, torch.float32) / 255
target_size = target.shape

x_row, y_row = [torch.arange(sz, device = device, dtype = dtype) for sz in target_size[1:]]
grid_x, grid_y = torch.meshgrid(x_row, y_row, indexing = "ij")


@torch.compile
def smoothstep(edge0: torch.Tensor | float, edge1: torch.Tensor | float, x: torch.Tensor) -> torch.Tensor:
	t = torch.clamp((x - edge0) / (edge1 - edge0 + 1e-4), 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)


# yapf: disable
@torch.compile
def norm_atanx4(sdf): return torch.atan(sdf * 4) / torch.pi + 0.5
@torch.compile
def norm_atan(sdf): return torch.atan(sdf) / torch.pi + 0.5
@torch.compile
def norm_tanh(sdf): return torch.tanh(sdf) / 2 + 0.5
@torch.compile
def norm_sigmoid(sdf): return torch.sigmoid(sdf)
@torch.compile
def norm_smoothstep(sdf): return smoothstep(-0.5, 0.5, sdf)
# yapf: enable

norm_funcs = {
	"norm_atanx4": norm_atanx4,
	"norm_atan": norm_atan,
	"norm_tanh": norm_tanh,
	"norm_sigmoid": norm_sigmoid,
	"norm_smoothstep": norm_smoothstep,
}


def init_vec_tensor(init_fn, tensor: torch.Tensor, a_list: list[float], b_list: list[float]):
	for idx, (v_a, v_b) in enumerate(zip(a_list, b_list)):
		init_fn(tensor[:, idx], v_a, v_b)


tensor_dot = torch.linalg.vecdot


@torch.compile
def tensor_length(v):
	return torch.sqrt(torch.sum(v ** 2, dim = -1) + 1e-3)


@torch.compile
def sdf_lines(grid_x: torch.Tensor, grid_y: torch.Tensor, a, b, r):
	grid = torch.cat([grid_x.unsqueeze(-1), grid_y.unsqueeze(-1)], dim = -1).unsqueeze(0)
	a = a[None, None].permute(2, 0, 1, 3)
	b = b[None, None].permute(2, 0, 1, 3)
	pa = (grid - a)
	ba = (b - a)
	h = (tensor_dot(pa, ba) / (tensor_dot(ba, ba) + 1e-3)).clamp(0, 1).unsqueeze(-1)
	return -tensor_length(pa - ba * h).permute(1, 2, 0) + r.view(1, 1, -1)


def sdf_compose(masks, colors, bg_color):
	canvas = bg_color.expand(*masks.shape[:2], 3).clone()
	canvas.to(masks.device, masks.dtype)
	colors = colors.unsqueeze(-1).unsqueeze(-1)
	colors = colors.permute(0, 2, 3, 1)
	masks = masks.permute(2, 0, 1).unsqueeze(-1)

	for mask, color in zip(masks, colors):
		canvas = canvas * (1 - mask) + color * mask

	return canvas


v_line_points_a = torch.empty(item_count, 2, requires_grad = True, dtype = dtype, device = device)
v_line_points_b = torch.empty(item_count, 2, requires_grad = True, dtype = dtype, device = device)
v_line_radius = torch.empty(item_count, requires_grad = True, dtype = dtype, device = device)
v_line_colors = torch.empty(item_count, 3, requires_grad = True, dtype = dtype, device = device)
v_color_bg = torch.empty(3, requires_grad = True, dtype = dtype, device = device)
"""
CUBLAS_WORKSPACE_CONFIG=:4096:8 &&
python optimizer_simple.py norm_atanx4 &&
python optimizer_simple.py norm_atan &&
python optimizer_simple.py norm_tanh &&
python optimizer_simple.py norm_sigmoid &&
python optimizer_simple.py norm_smoothstep
"""

norm_name = len(sys.argv) > 1 and sys.argv[1] or "norm_smoothstep"
norm_func = norm_funcs[norm_name]
output_prefix = f"out-{target_file}-{norm_name}-{int(time.time())}"

anim_info_bar_size = 40
anim_framerate = 30


def draw_items():
	masks = norm_func(sdf_lines(grid_x, grid_y, v_line_points_a, v_line_points_b, v_line_radius))
	result = sdf_compose(masks, v_line_colors, v_color_bg).permute(2, 0, 1)

	return result, masks


def pil_add_legend(
	original_image: Image.Image,
	text: str,
	bar_size: int = 40,
	bg_color = (30, 30, 30),
	fg_color = (255, 255, 255),
	font_path = None,
	font_size = 40,
):
	orig_sx, orig_sy = original_image.size

	new_sy = orig_sy + bar_size
	new_image = Image.new("RGB", (orig_sx, new_sy), color = bg_color)
	new_image.paste(original_image, (0, bar_size))

	draw = ImageDraw.Draw(new_image)

	if font_path:
		font = ImageFont.truetype(font_path, font_size)
	else:
		font = ImageFont.load_default()

	bbox = draw.textbbox((0, 0), text, font = font)
	text_sx = bbox[2] - bbox[0]

	x = (orig_sx - text_sx) // 2
	y = (bar_size - (bbox[1] + bbox[3])) // 2

	draw.text((x, y), text, fill = fg_color, font = font)

	return new_image


def clamp_params():
	with torch.no_grad():
		max_x, max_y = list(target_size[1:])
		v_line_points_a[:, 0].clamp_(0, max_x)
		v_line_points_a[:, 1].clamp_(0, max_y)
		v_line_points_b[:, 0].clamp_(0, max_x)
		v_line_points_b[:, 1].clamp_(0, max_y)
		v_line_colors.clamp_(0, 1)
		v_line_radius.clamp_(0, 16)
		v_color_bg.clamp_(0, 1)


with torch.no_grad():
	init_vec_tensor(nn.init.uniform_, v_line_points_a, [0, 0], list(target_size[1:]))
	v_line_points_b.copy_(v_line_points_a)
	v_line_points_b += torch.randn_like(v_line_points_a) * 4.0

	nn.init.uniform_(v_line_radius, 0.1, 0.2)
	init_vec_tensor(nn.init.uniform_, v_line_colors, [0, 0, 0], [1, 1, 1])
	nn.init.constant_(v_color_bg, 0.5)

clamp_params()

with torch.no_grad():
	result, masks = draw_items()
	sample = tv_functional.to_pil_image(result.detach())
	sample.save(f"{output_prefix}-init.png")

parameters = [v_line_points_a, v_line_points_b, v_line_radius, v_line_colors, v_color_bg]
optimizer = optim.Adam(parameters, lr = 0.1, betas = (0.99, 0.999), weight_decay = 0.00)

bar = tqdm(total = iter_count)

for idx in range(iter_count):
	optimizer.zero_grad()

	result, masks = draw_items()

	loss_l1 = nn.functional.l1_loss(result, target)
	loss = loss_l1
	loss.backward()

	optimizer.step()
	clamp_params()

	zero_radius = (v_line_radius <= 0).sum().item()

	if idx % snapshot_every == 0:
		with torch.no_grad():
			sample = tv_functional.to_pil_image(result.detach())
			sample = pil_add_legend(
				sample,
				f"[{idx}] {norm_name}\n"
				f"l1_loss: {loss.item():.6f}\n"
				f"v_line_radius: (zero_cnt: {zero_radius}), (mean: {v_line_radius.mean():.3f}, std: {v_line_radius.std().item():.3f})",
				bar_size = anim_info_bar_size,
			)
			sample.save(f"{output_prefix}-{idx // snapshot_every}.png")

	bar.n = idx + 1
	bar.set_postfix({
		"l": loss.item(),
		"l_l1": loss_l1.item(),
		"zero_cnt": zero_radius,
	})

with torch.no_grad():
	result, masks = draw_items()
	sample = tv_functional.to_pil_image(result.detach())
	sample.save(f"{output_prefix}-final.png")

bar.close()

with open(f"{output_prefix}-ffmpeg.txt", "w") as ffmpeg_log:
	ffmpeg_cmd = f"ffmpeg -framerate {anim_framerate} -i '{output_prefix}-%d.png' -c:v libwebp -loop 0 {output_prefix}-animated.webp -y"
	ffmpeg_out = subprocess.getoutput(ffmpeg_cmd)
	ffmpeg_log.write(ffmpeg_out)

	ffmpeg_cmd = f"ffmpeg -framerate {anim_framerate} -i '{output_prefix}-%d.png' -c:v libwebp -loop 0  -vf 'crop={image_sx}:{image_sy}:0:{anim_info_bar_size}' {output_prefix}-animated-no-bar.webp -y"
	ffmpeg_out = subprocess.getoutput(ffmpeg_cmd)
	ffmpeg_log.write(ffmpeg_out)

torch.save(
	{
		"v_line_points_a": v_line_points_a,
		"v_line_points_b": v_line_points_b,
		"v_line_radius": v_line_radius,
		"v_line_colors": v_line_colors,
		"v_color_bg": v_color_bg,
	},
	f"{output_prefix}-data.pickle",
)
