/* eslint-disable no-bitwise */
/* eslint-disable no-extra-parens */
export default function random(initial) {
	let seed = (initial | 0) + 0x2F6E2B1;
	seed = (seed + 0x7ED55D16 + seed << 12) & 0xFFFFFFFF;
	seed = (seed ^ 0xC761C23C ^ seed >>> 19) & 0xFFFFFFFF;
	seed = (seed + 0x165667B1 + seed << 5) & 0xFFFFFFFF;
	seed = (seed + 0xD3A2646C ^ seed << 9) & 0xFFFFFFFF;
	seed = (seed + 0xFD7046C5 + seed << 3) & 0xFFFFFFFF;
	seed = (seed ^ 0xB55A4F09 ^ seed >>> 16) & 0xFFFFFFFF;

	const rand = (seed & 0xFFFFFFF) / 0x10000000;
	return rand * 2 - 1;
}
/* eslint-enable no-extra-parens */
/* eslint-enable no-bitwise */
