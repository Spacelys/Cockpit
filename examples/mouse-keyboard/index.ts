import * as cockpit from '../../src';

const ms = cockpit.mouse('#app');
const ky = cockpit.keys(document);

const mouseLog = document.querySelector('#mouse-log');
const keyboardLog = document.querySelector('#keyboard-log');

const LOG_SIZE = 20; // 20 log events tracked at a time

const mouseEventLog = [];
const keyboardEventLog = [];
ms.subscribe((mouse) => {
	const text = JSON.stringify(mouse);
	mouseEventLog.splice(0, 0, text);
	if (mouseEventLog.length > 20) {
		mouseEventLog.splice(20, mouseEventLog.length - 20); // ensures 20 elements
	}

	mouseLog.innerHTML = "";
	mouseEventLog.forEach(eventLog => {
		mouseLog.innerHTML += eventLog + "\n";
	});
});

ky.subscribe((key) => {
	const text = JSON.stringify(key);
	keyboardEventLog.splice(0, 0, text);
	if (keyboardEventLog.length > 20) {
		keyboardEventLog.splice(20, keyboardEventLog.length - 20); // ensures 20 elements
	}

	keyboardLog.innerHTML = "";
	keyboardEventLog.forEach(eventLog => {
		keyboardLog.innerHTML += eventLog + "\n";
	});
});