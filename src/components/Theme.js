import React from 'react';

import PropTypes from 'prop-types';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import yellow from '@material-ui/core/colors/yellow';

const globalTheme = createMuiTheme({
	palette: {
		type: 'dark',
		background: {
			default: '#212121',
			paper: '#323232'
		},
		primary: {
			light: '#6ff9ff',
			main: '#26c6da', // Cyan[400]
			dark: '#0095a8',
			contrastText: '#000'
		},
		secondary: {
			light: '#ffad42',
			main: '#f57c00', // Orange[700]
			dark: '#bb4d00',
			contrastText: '#000'
		},
		divider: '#e0f7fa',
		error: yellow
	}
});

const Def = ({children}) =>
	<MuiThemeProvider theme={globalTheme}>{children}</MuiThemeProvider>;

Def.propTypes = {
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.node),
		PropTypes.node
	])
};
const Theme = Def;
export default Theme;