export default function rectangle(x = 0, y = 0, width = 1, height = 1) {
	return `M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
}