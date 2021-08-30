# Cockpit
Input utility for browsers that interacts with mouse, keyboard, microphone, and gamepads

## Installation and Usage

`npm install @spacelys/cockpit --save`

### Keyboard Inputs

```typescript
import * as cockpit from '@spacelys/cockpit'

// creates a keyboard listener around the entire html document
// alternatively you could select a specific html element with document.querySelect()
const keyInputs = cockpit.keys(document);

keyInputs.subscribe((input: cockpit.KeyInput) => {
    if (input.key === "a") {
        console.log(`[a] has been held ${input.dt} since last update
                    [a] has been held ${input.held} total time`);
    }
});
```

### Mouse Inputs

```typescript
import * as cockpit from '@spacelys/cockpit'

// creates a mouse listener around a specific html element
const mouseInput = cockpit.mouse("#elementToCaptureInputsAt");

mouseInput.subscribe((input: cockpit.KeyInput) => {
  switch (input.type) {
    case "press":
      console.log(`pressed button ${input.button} @ (${input.pos.x}, ${input.pos.y})`);
      break;
    case "drag":
      console.log(`dragging with button ${input.button} @ (${input.pos.x}, ${input.pos.y})`);
      break;
    case "release":
      ...
  }
});
```

### Gamepad Inputs (Experimental)

Gamepad inputs are a little bit more interesting.  Unlike the keyboard or mouse input, we have to wait for a gamepad to connect, thus the async await call.  This call will time out after 2 seconds if no gamepads are connected (feel free to call again as many times to keep checking for a gamepad connection)

#### Connecting + Button Mapping

While by default we always connect you to the 0th gamepad, with a default buttonMapping setting.  You might run into a scenario where you have multiple gamepads where one doesnt use the w3 standard for gamepad inputs.

`gamepad.connectToGamePad(3, 1)`

The line above connects the user to the third gamepad.  With the mapping settings of 1 (0 is the default value for the default w3 mapping).

To get the list of potential gamepad connections call `gamepad.getGamePads()` which returns an array of connected gamepads with id and name.

```typescript
import * as cockpit from '@spacelys/cockpit'

// creates a gamepad listener that polls for inputs ever 50ms if a gamepad eventually connects
const gamepad = await cockpit.gamepad(50);

// if multiple gamepads are connected, use this to connect to the ith gamepad (0, 1, ..ith)
gamepad.connectToGamePad(1); // (optional)
gamepad.obs.subscribe((input: cockpit.GamePadInput) => {
    // listen in for gamepad events and react accordingly
});

```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
