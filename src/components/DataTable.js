import React from 'react';

/*
Material UI components
*/
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';

const styles = () => ({
	// todo: figure out scrolling, make rows thinner
	tableBody: {
		maxHeight: 200,
		overflow: 'auto'
	},
	tableCell: {
		whiteSpace: 'nowrap'
	}

});

const valueFormats = {
	int: v => v,
	float: f => f,

	datetime: v => {
		const d = new Date(v);
		return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
	},
	boolean: v => v ? 'true' : 'false',
	string: v => v
};

class DataTable extends React.Component {
	state = {
		page: 0,
		rowsPerPage: 10
	}

	static propTypes = {
		classes: PropTypes.object.isRequired,
		data: PropTypes.object
	}

	handleChangePage = (event, page) => {
		this.setState({ page });
	}

	handleChangeRowsPerPage = event => {
		this.setState({ rowsPerPage: event.target.value });
	}

	render() {
		const { classes, data } = this.props;

		const dataFields = data && data.get && data.get('fields');
		if (dataFields && dataFields.forEach) {
			/*
			Checking for Alberto's bug
			*/
			dataFields.forEach(field => {
				if (!field || !field.get) {
					console.warn('Missing data field', field, data);
				}
			});
		}


		const rows = data && data.get && data.get('rows');
		const fields = data && data.get && data.get('fields')
			.filter(field => field && field.get);
		const { page, rowsPerPage } = this.state;
		const rowCount = rows && rows.length;
		const pageRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
		const emptyRows = rowsPerPage - Math.min(rowsPerPage, rowCount - page * rowsPerPage);

		return <Table className={classes.table}>
			<TableHead className={classes.tableHead}>
				<TableRow>
					{/*numeric={numFieldTypes.indexOf(fields[j].type) >= 0}*/}
					{fields.map((field, j) => <TableCell
						key={'field-' + j}
						className={classes.tableCell}
						padding="dense"
					>{field.get('name')}</TableCell>)}
				</TableRow>
			</TableHead>
			<TableBody className={classes.tableBody}>
				{Object.keys(pageRows).map(i => {
					const row = pageRows[i];
					return (
						<TableRow key={i}>
							{/*numeric={numFieldTypes.indexOf(fields[j].type) >= 0}*/}
							{fields.map((field, j) => <TableCell
								key={i + '-' + j}
								className={classes.tableCell}
								padding="dense"
							>{valueFormats[field.get('type') || 'string'](row[j])}</TableCell>)}
						</TableRow>
					);
				})}
				{emptyRows > 0 &&
					<TableRow style={{ height: 49 * emptyRows }}>
						<TableCell colSpan={fields.length} />
					</TableRow>
				}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TablePagination
						count={rowCount}
						rowsPerPage={rowsPerPage}
						page={page}
						onChangePage={this.handleChangePage}
						onChangeRowsPerPage={this.handleChangeRowsPerPage}
					/>
				</TableRow>
			</TableFooter>
		</Table>;
	}
}

const StyleDataTable = withStyles(styles)(DataTable);
export default StyleDataTable;