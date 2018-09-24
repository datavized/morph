import { saveAs } from 'file-saver';

export default function downloadFile(fileName, blob) {
	saveAs(blob, fileName);
}