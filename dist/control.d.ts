import { Readable, Writable } from "svelte/store";
import { ValidatorFn } from "./validators";
import { $ControlState, ControlBaseInterface, ControlEventOptions, ControlState, ControlTypes, ControlValidators, FormControlMeta } from "./interfaces";
export declare abstract class ControlBase<T = any> implements ControlBaseInterface<T> {
    validators: Writable<ControlValidators<T>>;
    meta: Writable<FormControlMeta>;
    id: string;
    currentState: ControlState<T> | null;
    propagateChanges: boolean;
    label: string;
    constructor(validators: ValidatorFn<T>[], meta?: FormControlMeta);
    abstract value: Writable<T>;
    abstract changedValue: Readable<Partial<T> | undefined>;
    abstract state: Readable<ControlState<T>>;
    abstract child(path: string): ControlBaseInterface<T> | null;
    abstract reset(value?: T): void;
    abstract setTouched(touched: boolean): void;
    setMeta(meta: FormControlMeta): void;
    patchMeta(meta: Partial<FormControlMeta>): void;
    setValidators(validators: ValidatorFn<T>[]): void;
}
export declare class Control<T = ControlTypes> extends ControlBase<T> {
    initial: T;
    value: Writable<T>;
    touched: Writable<boolean>;
    changedValue: Readable<T | undefined>;
    state: Readable<ControlState<T>>;
    constructor(initial: T, validators?: ValidatorFn<T>[], meta?: FormControlMeta);
    setTouched(touched: boolean): void;
    child(): ControlBaseInterface<T> | null;
    reset(value?: T): void;
}
declare type Controls<T> = {
    [K in keyof T]: ControlBaseInterface<T[K]>;
};
export declare class ControlGroup<T> extends ControlBase<T> {
    private controlStore;
    controls: Readable<Controls<T>>;
    private valueDerived;
    private valueChangedDerived;
    private touched;
    private childStateDerived;
    value: Writable<T>;
    changedValue: {
        subscribe: (run: (value: T) => void, invalidate?: ((value?: T | undefined) => void) | undefined) => () => void;
    };
    state: Readable<ControlState<T>>;
    constructor(controls: Controls<T>, validators?: ValidatorFn<T>[], meta?: FormControlMeta);
    private iterateControls;
    setValue(value: T): void;
    patchValue(value: Partial<T>): void;
    setControls(controls: Controls<T>): void;
    patchControls(controls: Partial<Controls<T>>): void;
    addControls(list: {
        key: string;
        control: ControlBase;
    }[], options?: ControlEventOptions): void;
    addControl(key: keyof T, control: ControlBaseInterface<T[keyof T]>, options?: ControlEventOptions): void;
    removeControl(key: keyof T, options?: ControlEventOptions): void;
    setTouched(touched: boolean): void;
    child(path: string): ControlBaseInterface<T> | null;
    reset(value?: Partial<T>): void;
}
export declare class ControlArray<T> extends ControlBase<T[]> {
    private readonly _controls;
    private controlStore;
    private touched;
    private initial;
    controls: Readable<ControlBaseInterface<T>[]>;
    private valueDerived;
    private valueDerivedChanged;
    private childStateDerived;
    value: Writable<T[]>;
    changedValue: Readable<T[]>;
    state: Readable<$ControlState & {
        list: ControlState<T>[];
    }>;
    constructor(_controls: ControlBaseInterface<T>[], validators?: ValidatorFn<T[]>[], meta?: FormControlMeta);
    private iterateControls;
    private sortArray;
    setValue(value: T[]): void;
    setTouched(touched: boolean): void;
    pushControl(control: ControlBaseInterface<T>): void;
    addControlAt(index: number, control: ControlBaseInterface<T>): void;
    removeControlAt(index: number): void;
    removeControl(control: ControlBaseInterface<T>): void;
    slice(start?: number, end?: number): void;
    child(path: string): ControlBaseInterface<T> | null;
    reset(value?: T[]): void;
}
export {};
