export default function randomize(fields) {
	if (!fields.length) {
		return {};
	}

	const horizontal = Math.random() > 0.5;
	const dimField = horizontal ? 'y' : 'x';

	const fieldNames = [dimField, 'time'];

	const indices = Object.keys(fields).map(parseFloat);
	let numericFieldIndices = indices.filter(index => {
		const f = fields[index];
		const type = f.type;
		return type === 'int' || type === 'float';
	});

	const fieldMap = {};
	fieldNames.forEach(name => {
		if (!numericFieldIndices.length) {
			numericFieldIndices = indices;
		}
		const count = numericFieldIndices.length;
		const i = Math.floor(Math.random() * count) % count;
		const index = numericFieldIndices[i];
		numericFieldIndices.splice(i, 1);
		fieldMap[name] = index;
	});

	let stringFieldIndices = indices.filter(index => {
		const f = fields[index];
		return f.type === 'string';
	});
	if (!stringFieldIndices.length) {
		stringFieldIndices = indices;
	}
	if (!indices.length) {
		stringFieldIndices = Object.keys(fields).map(parseFloat);
	}
	const count = stringFieldIndices.length;
	const i = Math.floor(Math.random() * count) % count;
	const index = stringFieldIndices[i];
	stringFieldIndices.splice(i, 1);
	fieldMap.group = index;

	return fieldMap;
}