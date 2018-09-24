// precision mediump float;

uniform vec4 uColor;

void main() {

	vec3 rgb = uColor.rgb;
	float alpha = uColor.a;
	gl_FragColor = vec4(rgb * alpha, alpha);
}