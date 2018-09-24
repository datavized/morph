export default function num(n, alt) {
	return n === undefined || isNaN(n) ? alt : n;
}
