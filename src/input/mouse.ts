import * as Rx from "rxjs/Rx";

export interface MouseInput {
	type: "press" | "drag" | "release" | "move";
	button: number;
	pos: { x: number, y: number };
}

const supportedButons = [
	1, // main
	2, // secondary
	4, // wheel
	8, // back button
	16 // aux button
];

/* Map the button value found in MouseEvent.button to the supportedButtons values above
 *
 */
const mapButton = (button: number) => {
	switch(button) {
		case 0:
			return 1;
		case 1:
			return 4
		case 2:
			return 2;
		case 3:
			return 8;
		case 4:
			return 16;
		default: 
			return 0;
	}
};


const buttonsPresssed = (buttons: number): Array<number> => {
	const pressed: Array<number> = [];
	supportedButons.forEach(button => {
		if (buttons & button) {
			pressed.push(button)
		}
	});
	return pressed;
};

const buttonsReleased = (buttons: number): Array<number> => {
	const pressed: Array<number> = [];
	supportedButons.forEach(button => {
		if (!(buttons & button)) {
			pressed.push(button)
		}
	});
	return pressed;
};

export const mouse = (selector: string) => {
	const elem = <HTMLElement>document.querySelector(selector);
	const mouseDown = Rx.Observable.fromEvent<MouseEvent>(elem, "mousedown")
		.timeInterval()
		.flatMap(evt => {
			console.log('down', evt.value.button);
			const downEvent = (button: number) => ({
				value: button, interval: evt.interval, type: "down",
				pos: {
					x: evt.value.pageX - elem.offsetLeft,
					y: evt.value.pageY - elem.offsetTop
				}
			});
			return buttonsPresssed(evt.value.buttons).map(button => downEvent(button));
		});

	const mouseMove = Rx.Observable.fromEvent<MouseEvent>(elem, "mousemove")
		.timeInterval()
		.flatMap(evt => {
			const moveEvent = (button: number) => ({
				value: button, interval: evt.interval, type: "move",
				pos: {
					x: evt.value.pageX - elem.offsetLeft,
					y: evt.value.pageY - elem.offsetTop
				}
			});
			const pressedButtons = buttonsPresssed(evt.value.buttons);
			if (pressedButtons.length > 0) {
				return pressedButtons.map(button => moveEvent(button));
			} else {
				// if not buttons were pressed we will treat this as a "move" event without a button
				return [0].map(button => moveEvent(button));
			}
		});

	const mouseUp = Rx.Observable.fromEvent<MouseEvent>(elem, "mouseup")
		.timeInterval()
		.flatMap(evt => {
			const upEvent = (button: number) => ({
				value: button, interval: evt.interval, type: "up",
				pos: {
					x: evt.value.pageX - elem.offsetLeft,
					y: evt.value.pageY - elem.offsetTop
				}
			});

			// return buttonsReleased(evt.value.buttons).map(button => upEvent(button));
			console.log('Button', evt.value.button, '>', mapButton(evt.value.button));
			return [upEvent(mapButton(evt.value.button))];
		});

	const mouseState: {[key in string]: any} = {
		"0": {},
		"1": {},
		"2": {},
		"4": {},
		"8" : {},
		"16": {}
	};

	const mouseExt = Rx.Observable.merge(mouseDown, mouseUp, mouseMove/*, mouseWheel*/)
		.map((evt): MouseInput => {
			if (evt.type === "down") {
				mouseState[evt.value] = {pressed: true};
				return {type: "press", button: evt.value, pos: evt.pos};
			} else if (evt.type === "move") {
				if (evt.value !== 0) {
					// mouseState[evt.value] = {pressed: true};
					return {type: "drag", button: evt.value, pos: evt.pos};
				} else {
					return {type: "move", button: evt.value, pos: evt.pos};
				}
			} else if (evt.type === "up") {
				// we will get an event for ALL potential released buttons
				// to actually find out which one(s) have been released, we have to see which buttons
				// had their previous state as pressed that are also in the array of potentially released buttons
				mouseState[evt.value] = {pressed: false}; // side effects!
				return {type: "release", button: evt.value, pos: evt.pos};
			}
		})
		.filter(evt => !!evt);

	return mouseExt;
};
