import { derived, get, Readable, writable, Writable } from "svelte/store";
import { validateIterated } from "./utils";
import { ValidationError, ValidatorFn } from "./validators";
import { v4 as uuidv4 } from 'uuid';
import {
	$ControlState,
	ControlBaseInterface, ControlEventOptions,
	ControlState,
	ControlTypes,
	ControlValidators,
	FormControlMeta
} from "./interfaces";

const defaultMeta:FormControlMeta = {
	type: 'string'
}

export abstract class ControlBase<T = any> implements ControlBaseInterface<T> {
	public validators: Writable<ControlValidators<T>>;

	public meta: Writable<FormControlMeta>;

	public id: string = uuidv4()

	public currentState: ControlState<T> | null = null

	public propagateChanges: boolean = true

	public label: string

	constructor(
		validators: ValidatorFn<T>[],
		meta?: FormControlMeta
) {
		this.validators = writable({validators, control: this});
		this.meta = writable({...defaultMeta,...meta} ?? {});
		this.label = meta?.name ?? '';
	}
	
	abstract value: Writable<T>;

	abstract state: Readable<ControlState<T>>;

	abstract child(path: string): ControlBaseInterface<T> | null;

	abstract reset(value?: T): void;

	abstract setTouched(touched: boolean): void;

	setMeta(meta: FormControlMeta) {
		this.meta.set(meta);
	}
	patchMeta(meta: Partial<FormControlMeta>) {
		const currentMeta = get(this.meta);
		this.meta.set({...currentMeta,...meta});
	}

	setValidators(validators: ValidatorFn<T>[]) {
		if (!(Array.isArray(validators) && validators.length)) return;
		this.validators.set({validators, control: this});
	}
}

export class Control<T = ControlTypes> extends ControlBase<T> {
	value = writable<T>(this.initial);
	touched = writable(false);
	state = derived<
		[Writable<T>, Writable<boolean>, Writable<ControlValidators<T>>, Writable<FormControlMeta>],
		ControlState<T>
	>(
		[this.value, this.touched, this.validators,this.meta],
		([value, $touched, validators, meta], set) => {
			const $dirty = this.initial !== value;

			const $error = validateIterated(validators, value);

			let $valid = true;
			let $pending = false;
			let $meta = meta;
			let $type = 'control';
			if ($error != null && $error instanceof Promise) {
				$pending = true;

				set({
					$error: null,
					$valid,
					$touched,
					$dirty,
					$pending,
					$meta,
					$type
				} as ControlState<T>);

				$error
					.then((ret) => {
						$valid = ret == null;
						$pending = false;
						set({
							$error: ret,
							$valid,
							$touched,
							$dirty,
							$pending,
							$meta,
							$type
						} as ControlState<T>);
					})
					.catch((err) => {
						$valid = false;
						set({
							$error: {
								serverError: true,
							} as ValidationError<boolean>,
							$valid,
							$touched,
							$dirty,
							$pending,
							$meta,
							$type
						} as ControlState<T>);
					});
			} else {
				$valid = $error == null;

				set({
					$error,
					$valid,
					$touched,
					$dirty,
					$pending,
					$meta,
					$type
				} as ControlState<T>);
			}
		}
	);

	constructor(
		public initial: T,
		validators: ValidatorFn<T>[] = [],
		meta?: FormControlMeta
	) {
		super(validators, meta);
	}

	setTouched(touched: boolean) {
		this.touched.set(touched);
	}

	child(): ControlBaseInterface<T> | null {
		return null!;
	}


	reset(value?: T) {
		if (value !== undefined) this.initial = value;
		this.value.set(this.initial);
		this.touched.set(false);
	}
}

type Controls<T> = { [K in keyof T]: ControlBaseInterface<T[K]> };
type ControlsState<T> = { [K in keyof T]: ControlState };
const objectPath = /^([^.[]+)\.?(.*)$/;

export class ControlGroup<T> extends ControlBase<T> {
	private controlStore = writable<Controls<T>>({} as any);

	controls: Readable<Controls<T>> = {
		subscribe: this.controlStore.subscribe,
	};

	private valueDerived = derived(
		this.controlStore,
		(controls: Controls<T>, set: (value: T) => void) => {
			const keys = Object.keys(controls) as Array<keyof T>;
			const controlValues = keys.map((key) => controls[key].value);
			const derivedValues = derived(
				controlValues as any,
				(values) =>
					(<any[]>values).reduce(
						(acc, value, index) => (
							(acc[keys[index]] = value), acc
						),
						{}
					) as T
			);
			return derivedValues.subscribe(set);
		}
	);

	private touched = writable(false);

	private childStateDerived = derived(
		this.controlStore,
		(controls: Controls<T>, set: (value: ControlsState<T>) => void) => {
			const keys = Object.keys(controls) as Array<keyof T>;
			const controlStates = keys.map((key) => controls[key].state);
			const derivedStates = derived(
				controlStates as any,
				(states) =>
					(<any[]>states).reduce(
						(acc, state, index) => (
							(acc[keys[index]] = state), acc
						),
						{}
					) as ControlsState<T>
			);
			return derivedStates.subscribe(set);
		}
	);

	value: Writable<T> = {
		subscribe: this.valueDerived.subscribe,
		set: (value) => this.setValue(value),
		update: (updater) => this.setValue(updater(get(this.valueDerived))),
	};

	state = derived(
		[this.valueDerived, this.childStateDerived, this.validators, this.touched, this.meta],
		([value, childState, validators, touched, meta]) => {

			if (!this.propagateChanges && this.currentState !== null) {
				return this.currentState
			}
			const children: Record<string, $ControlState> = {};
			let childrenValid = true;
			let $touched = touched;
			let $dirty = false;
			let $pending = false;
			let $meta = meta;
			let $type = 'group';
			for (const key of Object.keys(childState)) {
				const state = (children[key] = (childState as any)[
					key
				] as $ControlState);
				childrenValid = childrenValid && state.$valid;
				$touched = $touched || state.$touched;
				$dirty = $dirty || state.$dirty;
				$pending = $pending || state.$pending;
			}
			const $error = validateIterated(validators, value);

			const $valid = $error == null && childrenValid;
			let temp =  {
				$error,
				$valid,
				$touched,
				$dirty,
				$pending,
				$meta,
				$type,
				...children,
			} as ControlState<T>;
			this.currentState = temp
			return temp
		}
	);

	constructor(
		controls: Controls<T>, 
		validators: ValidatorFn<T>[] = [],
		meta?: FormControlMeta
	) {
		super(validators, meta);
		this.controlStore.set(controls);
	}

	private iterateControls<K extends keyof T>(
		callback: (args: [K, ControlBaseInterface<T[K]>]) => void
	) {
		const controls = get(this.controlStore);
		(<[K, ControlBaseInterface<T[K]>][]>Object.entries(controls)).forEach(callback);
	}

	public setValue(value: T) {
		this.iterateControls(([key, control]) => {
			const controlValue = (value && value[key]) ?? null;
			control.value.set(controlValue!);
		});
	}
	public patchValue(value: Partial<T>) {
		const currentValue = get(this.valueDerived);
		this.setValue({...currentValue, ...value});
	}

	setControls(controls: Controls<T>) {
		this.controlStore.set(controls);
	}
	patchControls(controls: Partial<Controls<T>>) {
		const currentControls = get(this.controlStore);
		this.setControls({...currentControls, ...controls});
	}
	addControls(list: {key: string, control: ControlBase}[],options?:ControlEventOptions ) {
		if (options && options.propagateChanges === false) {
			this.propagateChanges = false;
		}

		this.controlStore.update(
			(controls) => {
					list.forEach(({key, control}) => {
						(<any>controls)[key] = control;
					})
					return controls
				}
		);

		this.propagateChanges = true;
	}
	addControl(key: keyof T, control: ControlBaseInterface<T[keyof T]>,options?:ControlEventOptions) {
		if (options && options.propagateChanges === false) {
			this.propagateChanges = false;
		}
		this.controlStore.update(
			(controls) => (((controls)[key] = control), controls)
		);
		this.propagateChanges = true;
	}

	removeControl(key: keyof T,options?:ControlEventOptions) {
		if (options && options.propagateChanges === false) {
			this.propagateChanges = false;
		}
		this.controlStore.update(
			(controls) => {
				if (controls[key]) {
					delete controls[key];
				}
				return controls;
			}
		);
		this.propagateChanges = true;
	}

	setTouched(touched: boolean) {
		this.iterateControls(([_, control]) => {
			control.setTouched(touched);
		});
		this.touched.set(touched);
	}

	child(path: string): ControlBaseInterface<T> | null {
		const [_, name, rest] = path.match(objectPath) || [];
		const controls = get(this.controlStore);
		const control =
			(name && ((controls as any)[name] as ControlBaseInterface<T>)) || null;
		if (!control) return null!;
		return rest ? control.child(rest) : control;
	}

	reset(value?: Partial<T>) {
		this.iterateControls(([key, control]) => {
			const controlValue = (value && value[key]) || undefined;
			control.reset(controlValue!);
		});
	}
}

const arrayPath = /^\[(\d+)\]\.?(.*)$/;

export class ControlArray<T> extends ControlBase<T[]> {
	private controlStore = writable(this._controls);

	private touched = writable(false);

	controls: Readable<ControlBaseInterface<T>[]> = {
		subscribe: this.controlStore.subscribe,
	};

	private valueDerived = derived(
		this.controlStore,
		(controls: ControlBaseInterface<T>[], set: (value: T[]) => void) => {
			const derivedValues = derived(
				controls.map((control) => control.value) as any,
				(values) => values as T[]
			);
			return derivedValues.subscribe(set);
		}
	);

	private childStateDerived = derived(
		this.controlStore,
		(controls: ControlBaseInterface<T>[], set: (value: $ControlState[]) => void) => {
			const derivedStates = derived(
				controls.map((control) => control.state) as any,
				(values) => values as $ControlState[]
			);
			return derivedStates.subscribe(set);
		}
	);

	value: Writable<T[]> = {
		subscribe: this.valueDerived.subscribe,
		set: (value) => this.setValue(value),
		update: (updater) => this.setValue(updater(get(this.valueDerived))),
	};

	state = derived(
		[this.valueDerived, this.childStateDerived, this.validators, this.touched],
		([value, childState, validators, touched]) => {
			const arrayState = {} as $ControlState & { list: $ControlState[] };
			arrayState.list = [];
			let childrenValid = true;
			arrayState.$touched = touched;
			for (let i = 0, len = childState.length; i < len; i++) {
				const state = childState[i];
				arrayState.list[i] = state;
				childrenValid = childrenValid && state.$valid;
				arrayState.$touched = arrayState.$touched || state.$touched || false;
				arrayState.$dirty = arrayState.$dirty || state.$dirty;
			}
			arrayState.$error = validateIterated(validators, value, );
			arrayState.$valid = arrayState.$error == null && childrenValid;
			arrayState.$meta = get(this.meta);
			arrayState.$type = 'array';

			return arrayState as ControlState<T[]>;
		}
	);

	constructor(
		private readonly _controls: ControlBaseInterface<T>[],
		validators: ValidatorFn<T[]>[] = [],
		meta?: FormControlMeta
	) {
		super(validators, meta);
	}

	private iterateControls(
		callback: (control: ControlBaseInterface<T>, index: number) => void
	) {
		const controls: ControlBaseInterface<T>[] = get(this.controlStore);
		controls.forEach(callback);
	}

	private sortArray(val: ControlBaseInterface<T>[]) {
		const currentControls = get(this.controlStore);
		let newOrderIds = val.map((control) => control.id);
		let newOrder = newOrderIds.map((id) => currentControls.find((control) => control.id === id));
		newOrder = newOrder.filter((control) => control !== undefined) ;
		this.controlStore.set(newOrder as ControlBaseInterface<T>[]);

	}
	setValue(value: T[]) {
		this.controlStore.set([])
		const currentMeta = get(this.meta);
		if (!currentMeta.emptyControl) {
			console.error('FormControlMeta.emptyControl is required for ControlArray');
		} else {
			const newState = value.map(v => {
				const control = currentMeta.emptyControl();
				control.setValue(v);
				return control;
			})
			this.controlStore.set(newState);
		}

		/*		this.iterateControls((control, index) => {
          const controlValue = (value && value[index]) || null;
          control.value.set(controlValue!);
        });*/
	}

	setTouched(touched: boolean) {
		this.touched.set(touched);
		this.iterateControls((control) => control.setTouched(touched));
	}

	pushControl(control: ControlBaseInterface<T>) {
		this.controlStore.update(
			(controls) => (controls.push(control), controls)
		);
	}

	addControlAt(index: number, control: ControlBaseInterface<T>) {
		this.controlStore.update(
			(controls) => (controls.splice(index, 0, control), controls)
		);
	}

	removeControlAt(index: number) {
		this.controlStore.update(
			(controls) => (controls.splice(index, 1), controls)
		);
	}

	removeControl(control: ControlBaseInterface<T>) {
		this.controlStore.update((controls) =>
			controls.filter((c) => c !== control)
		);
	}

	slice(start?: number, end?: number) {
		this.controlStore.update((controls) => controls.slice(start, end));
	}

	//@ts-ignore
	child(path: string): ControlBaseInterface<T> | null {
		const [_, index, rest] = path.match(arrayPath) || [];
		const controls: ControlBaseInterface<T>[] = get(this.controlStore);
		const control = (index != null && controls[+index]) || null;
		if (!control) return null!;
		return rest ? control.child(rest) : control;
	}

	reset(value?: T[]) {
		this.iterateControls((control, index) => {
			const controlValue = (value && value[index]) || null;
			control.reset(controlValue!);
		});
	}
}
