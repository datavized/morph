// hard limit on max number of rows allowed in spreadsheet.
export const UPLOAD_ROW_LIMIT = 2000;
export const MAX_DATA_FILE_SIZE = 2000000; // 2MB

// https://color.adobe.com/vaporwave-4-color-theme-10814044/
export const SECTION_COLORS = [
	'#AC66F2',
	'#07F285',
	'#05DBF2',
	'#F7F391',
	'#F76DC8'
];

export const SHARE_HASHTAGS = ['feedmorph'];
export const IMGUR_CLIENT_ID = '866e7b15476035e';
export const IMGUR_UPLOAD_URL = 'https://api.imgur.com/3/image';
export const IMGUR_LINK_PREFIX = 'https://imgur.com/';
export const IMGUR_DESCRIPTION = `Made with Morph ${SHARE_HASHTAGS.map(t => '#' + t).join(' ')}\n` +
	location.origin;
