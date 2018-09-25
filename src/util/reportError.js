import ErrorStackParser from 'error-stack-parser';

export default function reportError(event) {
	const error = event.error || event;
	console.error(error);

	let details = '';

	const errorDetails = ErrorStackParser.parse(error);
	if (errorDetails && errorDetails.length) {
		const stackTop = errorDetails[0];
		details = [
			stackTop.fileName,
			stackTop.lineNumber,
			stackTop.columnNumber,
			stackTop.functionName
		].filter(val => val !== undefined).join(':');
	} else {
		details = event instanceof window.ErrorEvent ?
			[
				(event.filename || '').replace(window.location.origin, ''),
				event.lineno,
				event.colno
			].join(':') :
			event.toString();
	}

	if (window.ga && details) {
		window.ga('send', 'exception', {
			exDescription: `${error.message} [${details}]`
		});
	}
}
