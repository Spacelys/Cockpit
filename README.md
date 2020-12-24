# Cockpit
Input utility for browsers that interacts with mouse, keyboard, microphone, and gamepads

## Installation and Usage

`npm install @spacelys/cockpit --save`

#### Keyboard Inputs

```typescript
import * as cockpit from '@spacelys/cockpit'

// creates a keyboard listener around the entire html document
// alternatively you could select a specific html element with document.querySelect()
const keyInputs = cockpit.keys(document);

keyInputs.subscribe((input: cockpit.KeyInput) => {
    if (input.key === "a") {
        console.log(`[a] has been held ${input.dt} since last update
                    [a] has been held ${input.keyHeld} total time`);
    }
});
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
