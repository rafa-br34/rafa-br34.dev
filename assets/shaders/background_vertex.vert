#version 300 es

// Uniforms
uniform vec2 u_Scaling;
uniform float u_Size;

// From attribute buffer
in vec2 a_Model;
in uint a_Properties;
in vec4 a_Positional;

// To fragment shader
out vec2 s_Position;
flat out uint s_Properties;

void main() {
	vec2 WorldSpace = a_Model * u_Size + a_Positional.xy;
	vec2 ViewSpace = WorldSpace / u_Scaling;

	gl_Position = vec4(ViewSpace, 0, 1);
	s_Position = a_Model.xy;
	s_Properties = a_Properties;
}