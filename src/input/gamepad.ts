import * as Rx from 'rxjs';
import { Observable } from 'rxjs';

export interface GamePadInput {
	type: "button" | "axes" | "dpad";
	id: number;
	dt: number;
	held: number;
	status?: string;
	direction?: GamepadInputDirection,
	dx?: number,
	dy?: number
}

export enum GamepadInputDirection {
	X = "X", // this is used as a "NO direction"
	N = "N",
	NE = "NE",
	E = "E",
	SE = "SE",
	S = "S",
	SW = "SW", 
	W = "W",
	NW = "NW"
}

class InternalGamePadTracking {
	buttons: Array<{
		id: number,
		dt: number,
		held: number,
		status: "pressed" | "released" | "dead"
	}>;
	axes: Array<{
		id: number,
		dt: number,
		held: number,
		dx: number,
		dy: number
	}>;
	dpad: Array<{
		id: number,
		dt: number,
		held: number,
		direction: GamepadInputDirection,
		dx: number,
		dy: number
	}>
	version: number;
	dpadLookup: Array<{dir: GamepadInputDirection, dx: number, dy: number}>;

	constructor(version: number = 0) {
		this.version = version; // default
		this.buttons = [];
		this.axes = [];
		this.dpad = [];

		this.dpadLookup = [
			{dir: GamepadInputDirection.N, dx: 0, dy: 1}, // 0
			{dir: GamepadInputDirection.NE, dx: .7071, dy: .7071}, // 1
			{dir: GamepadInputDirection.E, dx: 1, dy: 0}, // 2
			{dir: GamepadInputDirection.SE, dx: .7071, dy: -.7071}, // 3
			{dir: GamepadInputDirection.S, dx: 0, dy: -1}, // 4
			{dir: GamepadInputDirection.SW, dx: -.7071, dy: .7071}, // 5
			{dir: GamepadInputDirection.W, dx: -1, dy: 0}, // 6
			{dir: GamepadInputDirection.NW, dx: -.7071, dy: .7071}, // 7
			{dir: GamepadInputDirection.X, dx: 0, dy: 0} // 8
		];
	}

	pressedButton(id: number, dt: number, pressed: boolean) {
		const {buttons} = this;
		// "press" | "held" | "release"
		if(buttons[id]) {
			if(buttons[id].status === "pressed") {
				buttons[id].dt = dt;
				buttons[id].held += dt;
				buttons[id].status = pressed ? "pressed" : "released";
			} else {
				// going from a pressed / released state to the initial press state
				if (pressed) {
					buttons[id].dt = 0;
					buttons[id].held = 0;
					buttons[id].status = "pressed";
				} else {
					buttons[id].dt = 0;
					buttons[id].held = 0;
					buttons[id].status = "dead";	// this dead is to serve as an indicator that
													// no events should be dispatched
				}
			}
		} else {
			buttons[id] = {
				id,
				dt: 0,
				held: 0,
				status: pressed ? "pressed" : "dead"
			};
		}
	}

	public pressedDPad(id: number, dt: number, up: boolean, down: boolean, left: boolean, right: boolean) {
		const {dpadLookup} = this;
		if (!this.dpad[id]) {
			this.dpad[id] = {id, dt: 0, held: 0, direction: GamepadInputDirection.X, dx: 0, dy: 0};
		}

		let dpadLookupId = 8; // defaults to nothing pressed
		if (up) {
			if (left) {
				dpadLookupId = 7; // up + left => NW
			} else if (right) {
				dpadLookupId = 1; // up + right => NE
			} else {
				dpadLookupId = 0; // just up pressed => N
			}
		} else if (down) {
			if (left) {
				dpadLookupId = 5; // down + left => SW
			} else if (right) {
				dpadLookupId = 3; // down + right => SE
			} else {
				dpadLookupId = 4; // just down pressed => S
			}
		} else if (left) {
			dpadLookupId = 6;
		} else if (right) {
			dpadLookupId = 2;
		}
		const currDirection = dpadLookupId < 8 ? dpadLookup[dpadLookupId] : dpadLookup[8];
		this.dpad[id].dt = dt;
		if ( this.dpad[id].direction === currDirection.dir ) {
			this.dpad[id].held += dt;
		} else {
			this.dpad[id].held = 0;
		}

		this.dpad[id].direction = currDirection.dir;
		this.dpad[id].dx = currDirection.dx;
		this.dpad[id].dy = currDirection.dy;
	}

	// Some dpads give us a "unique" way of representing the direction pressed
	private processDPadSpecialInput(id: number, dt: number, value: number) {
		const {dpadLookup} = this;
		const delta = 2 / 7;
		const dpadLookupId = parseFloat(((value + 1) / delta).toFixed(0));
		const currDirection = dpadLookupId < 8 ? dpadLookup[dpadLookupId] : dpadLookup[8];
		if (!this.dpad[id]) {
			this.dpad[id] = {id, dt: 0, held: 0, direction: GamepadInputDirection.X, dx: 0, dy: 0};
		}

		this.dpad[id].dt = dt;
		if ( this.dpad[id].direction === currDirection.dir ) {
			this.dpad[id].held += dt;
		} else {
			this.dpad[id].held = 0;
		}

		this.dpad[id].direction = currDirection.dir;
		this.dpad[id].dx = currDirection.dx;
		this.dpad[id].dy = currDirection.dy;
	}

	private processJoyStickInput(id: number, dt: number, value: {x?: number, y?: number}) {
		if (!this.axes[id]) {
			this.axes[id] = {id, dt: 0, held: 0, dx: 0, dy: 0};
		}

		this.axes[id].dt = dt;
		const newDx = Math.abs(value.x) < .05 ? 0 : Math.round(value.x * 1000) / 1000;
		const newDy = Math.abs(value.y) < .05 ? 0 : Math.round(value.y * 1000) / 1000;
		let newDelta = true;
		// since there are alot of possible values for joystick, calculating "Held" gets trickier
		if (value.x) {
			if (this.axes[id].dx === newDx) {
				newDelta = false;
			}
			this.axes[id].dx = newDx;
		}
		if (value.y) {
			if (this.axes[id].dy === newDy) {
				newDelta = false;
			}
			this.axes[id].dy = newDy;
		}

		if (!newDelta) {
			this.axes[id].held += dt;
		} else {
			this.axes[id].held = 0;
		}
	}

	pressedAxes(id: number, dt: number, value: number) {
		if (id === 9) {// D-Pad
			if (this.version === 1) {
				this.processDPadSpecialInput(0, dt, value);
			}
		} else if (id === 0 || id === 1) { // joystick 1
			const joystickValue: {x?: number, y?: number} = {};
			if (id === 0) {
				joystickValue.x = value;
			} else {
				joystickValue.y = -value;
			}
			this.processJoyStickInput(0, dt, joystickValue);
		} else if (id === 2 || id === (this.version === 0 ? 3 : 5)) { // joystick 2
			const joystickValue: {x?: number, y?: number} = {};
			if (id === 2) {
				joystickValue.x = value;
			} else {
				joystickValue.y = -value;
			}
			this.processJoyStickInput(1, dt, joystickValue);
		}
	}
}

export const enum GamePadErrors {
	NO_GAMEPAD_CONNECT = "No gamepad connected",
	NOT_VALID_GAMEPAD_ID = "Not a valid gamepad id"
};

export interface GamePadCockpit {
	getGamePads: () => Array<{id: number, name: string}>;
	connectToGamePad: (id: number, _buttonMapping?: number) => void;
	obs: Observable<GamePadInput>;
};

// export const gamepad = async (updateIntervalms: number, version: number = 0): Promise<Observable<GamePadInput>> => {
export const gamepad = async (updateIntervalms: number): Promise<GamePadCockpit> => {
	let internalGamePadTracking = new InternalGamePadTracking(0);
	return new Promise((resolve, reject) => {
		const noGamePadDetectedTimeout = setTimeout(() => {
			reject(GamePadErrors.NO_GAMEPAD_CONNECT);
		}, 2000);

		let allGamePads: Array<Gamepad> = [];
		let connectedGamePadIndex = -1;
		let buttonMapping = 0;
		let listenerFunction: (input: GamePadInput) => void;
		const getGamePads = () => {
			const list = [];
			for(const gamepad of allGamePads) {
				if (gamepad) {
					list.push({id: gamepad.index, name: gamepad.id});
				}
			}
			return list;
		};
		const connectToGamePad = (id: number, _buttonMapping: number = 0) => {
			if (id < 0 && id >= allGamePads.length) {
				throw GamePadErrors.NOT_VALID_GAMEPAD_ID;
			}
			connectedGamePadIndex = id;
			buttonMapping = _buttonMapping;
			internalGamePadTracking = new InternalGamePadTracking(_buttonMapping)
		};

		window.addEventListener('gamepadconnected', (event) => {
			allGamePads = navigator.getGamepads();
			if (allGamePads.length) {
				connectedGamePadIndex = 0;
			}

			const pollForInputs = (dt: number) => {
				let selectedGamePad: Gamepad;
				allGamePads = navigator.getGamepads();
				selectedGamePad = allGamePads[connectedGamePadIndex];

				const buttons = selectedGamePad.buttons;
				for(let buttonId = 0; buttonId < buttons.length; buttonId++) {
					if (buttonMapping === 0) {
						if (buttonId === 12 || buttonId === 13 || buttonId === 14 || buttonId === 15) {
							continue;
						}
					}
					internalGamePadTracking.pressedButton(
						buttonId,
						dt,
						buttons[buttonId].pressed
					);
				}

				if (buttonMapping === 0) {
					const up = !!buttons[12].pressed;
					const down = !!buttons[13]?.pressed;
					const left = !!buttons[14]?.pressed;
					const right = !!buttons[15]?.pressed;
					internalGamePadTracking.pressedDPad(0, dt, up, down, left, right);
				}

				const axes = selectedGamePad.axes;
				for(let axesId = 0; axesId < axes.length; axesId++) {
					internalGamePadTracking.pressedAxes(axesId, dt, axes[axesId]);
				}
			};

			const gamePadObserver = Rx.Observable.interval(updateIntervalms).pipe((obs) => {
				const newObs = new Rx.Observable<GamePadInput>((observer) => {
					obs.timeInterval()
					.map(t => t.interval/1000.0)
					.map(dt => pollForInputs(dt))
					.map(() => {
						const nonDeadButtons = internalGamePadTracking.buttons.filter((button) => {
							return button.status !== "dead";
						});
						const nonDeadDPads = internalGamePadTracking.dpad.filter((dpad) => {
							return dpad.direction !== GamepadInputDirection.X;
						})
						const nonDeadJoySticks = internalGamePadTracking.axes.filter((joystick) => {
							return joystick.dx !== 0 || joystick.dy !== 0;
						});
						return {
							buttons: nonDeadButtons.map(button => ({...button})),
							dpads: nonDeadDPads,
							axes: nonDeadJoySticks
						};
					}).subscribe(data => {
						const {buttons, dpads, axes} = data;
						buttons.forEach(activeButton => {
							observer.next({type: 'button', ...activeButton});
						});
						dpads.forEach(activeDPad => {
							observer.next({type: 'dpad', ...activeDPad});
						});
						axes.forEach(joystick => {
							observer.next({type: 'axes', ...joystick});
						});
						// observer.next(data);
					});;
				});
				return newObs;
			});

			clearTimeout(noGamePadDetectedTimeout);
			resolve({
				getGamePads,
				connectToGamePad,
				obs: gamePadObserver
			});
		});
	});
};
