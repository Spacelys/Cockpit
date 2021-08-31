import * as cockpit from '../../src';

/*
	<div id='buttons'></div>
	<div id='dpad'></div>
	<div id='axes'></div>
*/

const createBaseInputDiv = (id, buttonId, captureClassName) => {
	const buttonDiv = document.createElement('div');
	buttonDiv.setAttribute("id", buttonId);
	buttonDiv.classList.add('button-input');
	buttonDiv.innerHTML = `
		<div class='gamepad-id'>${id}</div>
		<div class='${captureClassName}'></div>
	`;
	return buttonDiv;
};

const buttonInput = (id, status) => {
	const buttonId = "button-" + id;
	const buttonElement = document.querySelector("#" + buttonId);
	if (!buttonElement) {
		const buttonElem = createBaseInputDiv(id, buttonId, `pressed ${status === "pressed" ? "on": "off"}`);
		document.querySelector('#buttons').appendChild(buttonElem);
	} else {
		const pressedSubElement = buttonElement.querySelector(`.pressed`);
		pressedSubElement.classList.remove('off', 'on');
		if (status === "pressed") {
			pressedSubElement.classList.add("on");
		} else {
			pressedSubElement.classList.add("off");
		}
	}
};

const getDirectionDelta = (direction) => {
	let delta = {dx: 0, dy: 0};
	switch(direction) {
		case 'N':
			delta.dy = -18;
			break;
		case 'NW':
			delta.dx = -12;
			delta.dy = -12;
			break;
		case 'NE':
			delta.dx = 12;
			delta.dy = -12;
			break;
		case 'S':
			delta.dy = 18;
			break;
		case 'SW':
			delta.dx = -12;
			delta.dy = 12;
			break;
		case 'SE':
			delta.dx = 12;
			delta.dy = 12;
			break;
		case 'W':
			delta.dx = -18;
			break;
		case 'E':
			delta.dx = 18;
			break;
		default:
			break;
	}
	return delta;
}

const dpadInput = (id, direction) => {
	const dpadId = 'dpad-' + id;
	const buttonElement = document.querySelector("#" + dpadId);
	if (!buttonElement) {
		const buttonElem = createBaseInputDiv(id, dpadId, `direction`);
		document.querySelector('#dpad').appendChild(buttonElem);

		const svgDirection = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgDirection.setAttribute('width', '71');
		svgDirection.setAttribute('height', '40');
		const directionLine = document.createElementNS('http://www.w3.org/2000/svg','line');
		directionLine.setAttribute('class','dpad-line');

		const delta = getDirectionDelta(direction);
		directionLine.setAttribute('x1', '' + 35);
		directionLine.setAttribute('y1', '' + 20);
		directionLine.setAttribute('x2', '' + (35 + delta.dx));
		directionLine.setAttribute('y2', '' + (20 + delta.dy));
		directionLine.setAttribute("stroke", "black")
		svgDirection.appendChild(directionLine);
		buttonElem.querySelector('.direction').appendChild(svgDirection);
	} else {
		const directionLine = buttonElement.querySelector('line');
		const delta = getDirectionDelta(direction);
		directionLine.setAttribute('x2', '' + (35 + delta.dx));
		directionLine.setAttribute('y2', '' + (20 + delta.dy));
	}
}

const joystickInput = (id, dx, dy) => {
	const joystickId = 'joystick-' + id;
	const buttonElement = document.querySelector("#" + joystickId);
	if (!buttonElement) {
		const buttonElem = createBaseInputDiv(id, joystickId, `joypad`);
		document.querySelector('#axes').appendChild(buttonElem);

		const svgJoypad = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgJoypad.setAttribute('width', '71');
		svgJoypad.setAttribute('height', '40');
		const joypadCircle = document.createElementNS('http://www.w3.org/2000/svg','circle');
		const joypadLine = document.createElementNS('http://www.w3.org/2000/svg','line');

		joypadCircle.setAttribute('class','joypad-circle');
		joypadCircle.setAttribute('cx', '' + 35);
		joypadCircle.setAttribute('cy', '' + 20);
		joypadCircle.setAttribute('r', '' + 18);
		joypadCircle.setAttribute('fill', 'none');
		joypadCircle.setAttribute('stroke-width', '2');
		joypadCircle.setAttribute('stroke', 'black');

		joypadLine.setAttribute('x1', '' + 35);
		joypadLine.setAttribute('y1', '' + 20);
		joypadLine.setAttribute('x2', '' + (35 + dx*18));
		joypadLine.setAttribute('y2', '' + (20 - dy*18));

		svgJoypad.appendChild(joypadCircle);
		svgJoypad.appendChild(joypadLine);
		buttonElem.querySelector('.joypad').appendChild(svgJoypad);
	} else {
		const joypadLine = buttonElement.querySelector('line');
		joypadLine.setAttribute('x2', '' + (35 + dx*18));
		joypadLine.setAttribute('y2', '' + (20 - dy*18));

	}
};

const createInputDiv = (type, id, status?, direction?, dx?, dy?) => {
	if (type === 'button') {
		buttonInput(id, status);
	} else if (type === 'dpad') {
		dpadInput(id, direction);
	} else if (type === 'axes') {
		joystickInput(id, dx, dy);
	}
}

const createGamePadButton = (id: number, name: string, onclick: () => void) => {
	const buttonElem = document.createElement('button');
	buttonElem.setAttribute('gamepadId', "" + id);
	buttonElem.innerHTML = "" + name;
	buttonElem.onclick = onclick;
	const buttonHouse = document.querySelector('#available-gamepads');
	buttonHouse.appendChild(buttonElem);
}

const connectToGamePad = (controller: cockpit.GamePadCockpit, id: number, name: string) => {
	document.querySelector("#connected-gamepad").innerHTML = `connected: ${name}`;
	controller.connectToGamePad(id);

	return (buttonMapping) => {
		if (buttonMapping === 0) {
			document.querySelector("#connected-mapping").innerHTML = `mapping: default`;
		} else {
			document.querySelector("#connected-mapping").innerHTML = `mapping: 8bitdo`;
		}
		controller.connectToGamePad(id, buttonMapping);
	};
};

const pollForInputs = async () => {
	try {
		const gamePadController = await cockpit.gamepad(50);
		let useButtonMapping: (n) => void;
		const availableGamepads = gamePadController.getGamePads();
		availableGamepads.forEach((gamepad) => {
			createGamePadButton(gamepad.id, gamepad.name, () => {
				document.querySelector("#connected-gamepad").innerHTML = `connected: ${gamepad.name}`;
				gamePadController.connectToGamePad(gamepad.id);
			});
		});

		useButtonMapping = connectToGamePad(gamePadController, availableGamepads[0].id, availableGamepads[0].name);
		
		const defaultMapping = document.querySelector('#mapping-default') as HTMLButtonElement;
		defaultMapping.onclick = () => useButtonMapping(0);
		const eightbitdoMapping = document.querySelector('#mapping-8bitdo') as HTMLButtonElement;
		eightbitdoMapping.onclick = () => useButtonMapping(1);

		gamePadController.obs.subscribe((input) => {
			createInputDiv(input.type, input.id, input.status, input.direction, input.dx, input.dy);
		});
	} catch (err) {
		document.querySelector("#connected-gamepad").innerHTML = "No gamepads connected!!!";
	}
}

pollForInputs();