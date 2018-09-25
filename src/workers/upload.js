/* global DEBUG */
import XLSX from 'xlsx';
import { MAX_DATA_FILE_SIZE, UPLOAD_ROW_LIMIT } from '../constants';
import serializeError from 'serialize-error';

const rABS = false; // true: readAsBinaryString ; false: readAsArrayBuffer

const numRegex = /^-?([0-9]+(\.[0-9]*)?(e[-+]?[0-9]+)?$)/;
const booleanRegex = /false|true|yes|no/i;

function formatValue(val) {
	if (numRegex.test(val)) {
		return parseFloat(val);
	}
	return val;
}

const typeTests = {
	boolean: cell => cell.t === 'b' || cell.v === true || cell.v === false || booleanRegex.test(cell.w),

	datetime: cell => cell.t === 'd' ||
		cell.t === 'n' && !numRegex.test(cell.w) && !isNaN(Date.parse(cell.w)),

	int: cell => {
		const n = formatValue(cell.v || cell.w);
		return !isNaN(n) && Math.floor(n) === n && n <= Number.MAX_SAFE_INTEGER && n >= Number.MIN_SAFE_INTEGER;
	},

	float: cell => numRegex.test(cell.v || cell.w)
};

let file = null;
let workbook = null;

function readWorksheet(worksheetName) {
	/*
	To do:
	- consolidate values
	- determine which columns have only one value
	- save a whole bunch of metadata
		https://github.com/SheetJS/js-xlsx#workbook-file-properties
	*/
	const worksheet = workbook.Sheets[worksheetName];

	let minCol = Infinity;
	let minRow = Infinity;
	const rows = [];
	for (const cell in worksheet) {
		if (worksheet.hasOwnProperty(cell) && cell.charAt(0) !== '!') {
			const c = XLSX.utils.decode_cell(cell);
			const row = c.r;
			const col = c.c;

			minCol = Math.min(col, minCol);
			minRow = Math.min(row, minRow);

			if (!rows[row]) {
				rows[row] = [];
			}
			rows[row][col] = worksheet[cell];
		}
	}

	// re-align to zero
	if (minRow > 0) {
		rows.splice(0, minRow);
	}
	if (minCol > 0) {
		rows.forEach(row => row.splice(0, minCol));
	}

	// remove all blank/empty rows
	for (let i = rows.length - 1; i >= 0; i--) {
		if (!rows[i]) {
			rows.splice(i, 1);
		}
	}

	// for now assume there is always a header row
	const fields = rows.shift().map(cell => ({
		name: cell.w || cell.v,
		types: ['float', 'int', 'datetime', 'boolean'],
		type: 'string'
	}));

	// throw out any rows beyond our fixed limit
	if (rows.length > UPLOAD_ROW_LIMIT) {
		rows.length = UPLOAD_ROW_LIMIT;
	} else if (!rows.length || !fields.length) {
		const e = new Error('No data found.');
		e.useMessage = true;
		throw e;
	}

	// Clear out empty columns
	for (let i = fields.length - 1; i >= 0; i--) {
		const field = fields[i];
		let noRowsFound = true;
		if (!field) {
			for (let j = 0; noRowsFound && j < rows.length; j++) {
				const row = rows[j];
				if (row && row[i] !== undefined) {
					noRowsFound = false;
				}
			}

			if (noRowsFound) {
				// completely empty column. skip it
				fields.splice(i, 1);
				rows.forEach(row => {
					row.splice(i, 1);
				});
			} else {
				// just missing a name
				fields[i] = {
					name: 'Column ' + (i + 1),
					types: ['float', 'int', 'datetime', 'boolean'],
					type: 'string'
				};
			}
		}
	}


	fields.forEach((field, i) => {
		let min = Infinity;
		let max = -Infinity;
		for (let r = 0; r < rows.length; r++) {
			const row = rows[r];
			if (row) {
				const cell = row[i];
				if (cell) {
					for (let j = field.types.length - 1; j >= 0; j--) {
						const type = field.types[j];
						if (!typeTests[type](cell)) {
							field.types.splice(j, 1);
						} else if (cell.z && !field.format) {
							field.format = cell.z;
						}
					}

					if (cell.v > max) {
						max = cell.v;
					}
					if (cell.v < min) {
						min = cell.v;
					}

					if (!field.types.length) {
						break;
					}
				}
			}
		}

		if (field.types.length) {
			field.type = field.types.pop();
		}
		if (field.type !== 'string' && field.type !== 'boolean' && min < Infinity && max > -Infinity) {
			field.min = min;
			field.max = max;
			field.scale = 1 / (max - min || 1);
		}
		delete field.types;
	});

	// save just values
	fields.forEach((field, col) => {
		rows.forEach(row => {
			const cell = row[col];
			if (!cell) {
				return;
			}

			if (cell.v instanceof Date) {
				row[col] = cell.v.toGMTString();
			} else if (field.type === 'string') {
				row[col] = cell.w !== undefined ? cell.w : (cell.v || '').toString();
			} else if (!isNaN(cell.v)) {
				// JSON.stringify doesn't like Infinity
				row[col] = Math.min(Math.max(cell.v, -Number.MAX_VALUE), Number.MAX_VALUE);
			} else {
				row[col] = cell.v;
			}
		});
	});

	// normalize
	fields.forEach((field, index) => {
		if (field.type === 'string') {
			const strings = new Set();
			rows.forEach(row => {
				strings.add(row[index]);
			});
			field.values = [...strings].sort();
		}
	});
	const normalized = rows.map(row => row.map((val, col) => {
		const field = fields[col];
		if (field.type === 'string') {
			return field.values.indexOf(val) / (field.values.length - 1);
		}

		if (field.type === 'boolean') {
			return val ? 1 : 0;
		}

		if (field.type === 'datetime') {
			val = new Date(val);
		}

		return (val - field.min) * field.scale;
	}));
	fields.forEach(field => {
		delete field.values;
	});

	if (rows && rows.length && fields.length) {
		postMessage({
			file,
			fields,
			rows,
			normalized
			// todo: file name or whatever. some request id or something?
		});
		return;
	}
}

function readFile(message) {
	file = message.data.file;

	if (file.size > MAX_DATA_FILE_SIZE) {
		postMessage({
			error: 'File is too big.'
		});
		return;
	}

	const reader = new FileReader();
	reader.onload = e => {
		let data = e.target.result;
		if (!rABS) {
			data = new Uint8Array(data);
		}

		// let rows = null;
		// let fields = null;
		let errorMessage = '';
		let error = null;
		try {
			workbook = XLSX.read(data, {
				cellDates: true,
				cellNF: true,
				// cellFormula: false,
				cellHTML: false,
				type: rABS ? 'binary' : 'array',
				sheetRows: UPLOAD_ROW_LIMIT + 100 // allow for some padding at the top
			});

			/*
			todo: Filter more properly to make sure there's at least a single header
			and a single row after it
			*/
			const sheetNames = workbook.SheetNames
				.filter(name => Object.keys(workbook.Sheets[name]).length > 2 && workbook.Sheets[name]['!ref']);

			if (sheetNames.length) {
				if (sheetNames.length === 1) {
					readWorksheet(workbook.SheetNames[0]);
				} else {
					postMessage({
						file,
						title: workbook.Props && workbook.Props.Title || '',
						sheets: sheetNames
					});
				}
				return;
			}
		} catch (e) {
			error = e;
			errorMessage = e.useMessage && e.message || 'Error reading spreadsheet file.';
			console.warn('Error reading spreadsheet.', e);
		}

		postMessage({
			errorMessage: errorMessage || 'No data found in spreadsheet.',
			error: serializeError(error)
		});
	};
	if (rABS) {
		reader.readAsBinaryString(file);
	} else {
		reader.readAsArrayBuffer(file);
	}
}

onmessage = function (message) { // eslint-disable-line no-undef
	if (workbook && message.data.worksheet && workbook.Sheets[message.data.worksheet]) {
		readWorksheet(message.data.worksheet);
	} else if (message.data.file) {
		// uploaded new file
		readFile(message);
	} else if (DEBUG) {
		console.warn('UploadWorker: Message received from main script', message.data);
	}
};
