/* eslint-disable no-bitwise */
const nextLog2 = Math.clz32 ?
	n => {
		const isNotPOT = !n || n & n - 1;
		return (isNotPOT ? 32 : 31) - Math.clz32(n);
	} :
	n => Math.ceil(Math.log(n) / Math.LN2);

/*
Nearest (larger) power of two
*/
const nextPowerOfTwo = n => 1 << nextLog2(n);
/* eslint-enable no-bitwise */

export default nextPowerOfTwo;
export { nextLog2 };
