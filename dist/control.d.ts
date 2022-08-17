import { Readable, Writable } from "svelte/store";
import { ValidatorFn } from "./validators";
import { $ControlState, ControlBaseInterface, ControlState, ControlTypes, ControlValidators, FormControlMeta } from "./interfaces";
export declare abstract class ControlBase<T = any> implements ControlBaseInterface<T> {
    validators: Writable<ControlValidators<T>>;
    meta: Writable<FormControlMeta>;
    id: string;
    label: string;
    constructor(validators: ValidatorFn<T>[], meta?: FormControlMeta);
    abstract value: Writable<T>;
    abstract state: Readable<ControlState<T>>;
    abstract child(path: string): ControlBaseInterface<T> | null;
    abstract reset(value?: T): void;
    abstract setTouched(touched: boolean): void;
    setValidators(validators: ValidatorFn<T>[]): void;
}
export declare class Control<T = ControlTypes> extends ControlBase<T> {
    private initial;
    value: Writable<T>;
    private touched;
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
    private touched;
    private childStateDerived;
    value: Writable<T>;
    state: Readable<ControlState<T>>;
    constructor(controls: Controls<T>, validators?: ValidatorFn<T>[], meta?: FormControlMeta);
    private iterateControls;
    private setValue;
    private patchValue;
    addControl(key: string, control: ControlBase): void;
    removeControl(key: string): void;
    setTouched(touched: boolean): void;
    child(path: string): ControlBaseInterface<T> | null;
    reset(value?: T): void;
}
export declare class ControlArray<T> extends ControlBase<T[]> {
    private readonly _controls;
    private controlStore;
    private touched;
    controls: Readable<ControlBaseInterface<T>[]>;
    private valueDerived;
    private childStateDerived;
    value: Writable<T[]>;
    state: Readable<$ControlState & {
        list: ControlState<T>[];
    }>;
    constructor(_controls: ControlBaseInterface<T>[], validators?: ValidatorFn<T[]>[], meta?: FormControlMeta);
    private iterateControls;
    private sortArray;
    private setValue;
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
