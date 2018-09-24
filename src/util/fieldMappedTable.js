import { Map } from 'immutable';

export default function fieldMappedTable(data) {
	const rows = data.get('rows');
	const normalized = data.get('normalized');
	const chartType = data.get('chartType');
	const fieldMap = data.getIn(['fieldMap', chartType]) || new Map();
	return {
		data,
		fieldMap,
		tree: data.getIn(['tree', chartType]),
		count: rows && rows.length || 0,
		normalized,
		rows,
		field: name => fieldMap.get(name),
		has: name => fieldMap.get(name) >= 0 && fieldMap.get(name) < data.get('fields').size,
		value: (name, rowIndex) => normalized[rowIndex][fieldMap.get(name)],
		original: (name, rowIndex) => rows[rowIndex][fieldMap.get(name)]
	};
}