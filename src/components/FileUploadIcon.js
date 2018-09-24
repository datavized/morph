import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

const Def = props =>
	<SvgIcon {...props}>
		<path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
	</SvgIcon>;

const FileUploadIcon = Def;
export default FileUploadIcon;