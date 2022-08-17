import { get, Readable } from 'svelte/store';
import {Control} from "./control";
import {$ControlState} from "./interfaces";


export const controlClasses = (el: HTMLElement, control: Control) => {
	if (!(control instanceof Control)) throw new Error('must be used with a Control class');

	const classList = el.classList;

	const stateSub = control.state.subscribe((state) => {
		if (state.$error) {
			classList.add('invalid');
			classList.remove('valid');
		} else {
			classList.add('valid');
			classList.remove('invalid');
		}

		if (state.$dirty) {
			classList.add('dirty');
			classList.remove('pristine');
		} else {
			classList.add('pristine');
			classList.remove('dirty');
		}

		if (state.$touched) {
			classList.add('touched');
		} else {
			classList.remove('touched');
		}

	});

	const eventNames = ['blur', 'focusout'];

	const unregister = () => eventNames.forEach(eventName => el.removeEventListener(eventName, touchedFn));

	const touchedFn = () => {
		if ((<$ControlState>get(control.state)).$touched) return;
		control.setTouched(true);
	}

	eventNames.forEach(eventName => el.addEventListener(eventName, touchedFn));

	return {
		destroy() {
			unregister();
			stateSub();
		}
	}
};
