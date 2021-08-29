import * as Rx from "rxjs/Rx";

export interface KeyInput {
	key: string;
	dt: number;
	held: number;
	event: string;
	keysHeld: Array<string>;
}

export const keys = (elem: Document, {updateTime = 30} = {}) => {
	const inputs = Rx.Observable.fromEvent(elem, "keydown")
	// this is to prevent the repeat messages we get from holding the key down
		.filter((evt: KeyboardEvent) => !evt.repeat)

    const stopInputs = (key: string) => Rx.Observable.fromEvent(elem, "keyup")
        .filter((evt: KeyboardEvent) => evt.key.toLowerCase() === key)
        .take(1);

    const keyExt = inputs
        .mergeMap((evt: KeyboardEvent) => {
            const eventKey = evt.key.toLowerCase(); // holding shift will give us unexpect issues (this prevents that)
            return Rx.Observable.of({key: eventKey, dt: 0, held: 0, event: "press"})
                .concat(
                    Rx.Observable.interval(updateTime)
                        .timeInterval()
						.map(t => t.interval/1000.0)
                        .map(dt => ({key: eventKey, dt: dt, held: dt, event: "held"}) )
                        .scan((acc, val) => {
                            return {key: val.key, dt: val.dt, held: acc.held + val.dt, event: "held"};
                        })
                        .takeUntil(stopInputs(eventKey))
                )
                .concat(
                    Rx.Observable.of({
                        key: eventKey, 
                        dt: 0, 
                        held: 0, 
                        event: "release"
                    })
                )
        });

    const keysHeld = new Set<string>();
    return keyExt.map((keyEvent): KeyInput => {
        if (keyEvent.event === "press") {
            keysHeld.add(keyEvent.key);
        } else if (keyEvent.event === "release") {
            keysHeld.delete(keyEvent.key)
        }
        return {...keyEvent, keysHeld: Array.from(keysHeld)};
    });
};
