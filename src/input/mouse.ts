import * as Rx from "rxjs/Rx";

export interface MouseInput {
	type: "press" | "drag" | "release";
	button: number;
	pos: { x: number, y: number };
}

export const mouse = (elem: HTMLElement) => {
	const mouseDown = Rx.Observable.fromEvent<MouseEvent>(elem, "mousedown")
		.timeInterval()
		.map(evt => {
			const t = {
				value: evt.value.button, interval: evt.interval, type: "down",
				pos: {
					x: evt.value.pageX - elem.offsetLeft,
					y: evt.value.pageY - elem.offsetTop
				}
			};
			return t;
		});

	const mouseMove = Rx.Observable.fromEvent<MouseEvent>(elem, "mousemove")
		.timeInterval()
		.map(evt => ({
			value: evt.value.button, interval: evt.interval, type: "move",
			pos: {
				x: evt.value.pageX - elem.offsetLeft,
				y: evt.value.pageY - elem.offsetTop
			}
		}));

	const mouseUp = Rx.Observable.fromEvent<MouseEvent>(elem, "mouseup")
		.timeInterval()
		.map(evt => ({
			value: evt.value.button, interval: evt.interval, type: "up",
			pos: {
				x: evt.value.pageX - elem.offsetLeft,
				y: evt.value.pageY - elem.offsetTop
			}
		}));

	const mouseState: {[key in string]: any} = {
		"0": {}
	};

	const mouseExt = Rx.Observable.merge(mouseDown, mouseUp, mouseMove/*, mouseWheel*/)
		.map((evt): MouseInput => {
			if (evt.type === "down") {
				mouseState[evt.value] = {pressed: true};
				return {type: "press", button: evt.value, pos: evt.pos};
			} else if (evt.type === "move") {
				if (mouseState[evt.value].pressed) {
					return {type: "drag", button: evt.value, pos: evt.pos};
				}
			} else if (evt.type === "up") {
				mouseState[evt.value] = {pressed: false}; // side effects!
				return {type: "release", button: evt.value, pos: evt.pos};
			}
		})
		.filter(evt => !!evt);

	return mouseExt;
};
