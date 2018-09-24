const NS = 'http://www.w3.org/2000/svg';
export default function createSVGElement(tag, doc) {
	return (doc || document).createElementNS(NS, tag);
}
