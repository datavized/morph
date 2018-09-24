import { fromJS, Map, List } from 'immutable';

import {
	NUM_CHILDREN,
	MUTATION_RATE,
	MAX_DRIFT
} from '../charts/constants';

export function defaultTree(chartInfo) {
	const genes = chartInfo.genes;
	return fromJS({
		time: Date.now(),
		genes,
		children: []
	});
}

// centered around [-1 to 1]
export const random = () => Math.random() * 2 - 1;

export const mutate = (val, scale = 1) => {
	const drift = random() * random() * MAX_DRIFT;
	const result = val + drift * scale;

	// bounce back if result is out of [-1,1] range
	if (result < -1) {
		return -2 - result;
	}
	if (result > 1) {
		return 2 - result;
	}
	return result;
};

export function spawnNodes(node, opts, timeOffset = 0, numChildren = NUM_CHILDREN) {
	const genes = node.get('genes');
	let children = node.get('children');

	for (let i = 0; i < numChildren; i++) {
		if (!children.has(i)) {
			let newGenes = genes.map(val => Math.random() < MUTATION_RATE ? mutate(val) : val);

			if (newGenes.equals(genes)) {
				// make sure we have at least one mutation
				const geneIndex = Math.floor(Math.random() * genes.size) % genes.size;
				const geneKey = genes.keySeq().get(geneIndex);
				newGenes = genes.update(geneKey, mutate);
				// newGenes = genes.set(geneKey, mutate(genes.get(geneKey)));
			}

			const child = new Map({
				time: Date.now() + timeOffset,
				genes: newGenes,
				opts: new Map(opts),
				children: new List()
			});
			children = children.set(i, child);
		}
	}

	return node.set('children', children);
}