import { Readable, Writable } from "svelte/store";
import { ValidationError, ValidatorFn } from "./validators";
declare type GroupValue<T> = {
    [K in keyof T]: T[K];
};
declare type ControlTypes = string | number | boolean;
export interface FormControlMeta {
    name?: string;
    helperText?: any;
    placeholder?: string;
    visible?: boolean;
    translate?: boolean;
    selectValues?: any[];
    language_dependent?: boolean;
    type?: string;
    errorMessages?: {
        [key: string]: string | (() => string);
    };
    emptyControl?: any;
}
export interface $ControlState {
    $error: ValidationError | null;
    $valid: boolean;
    $touched: boolean;
    $dirty: boolean;
    $pending: boolean;
    $meta: FormControlMeta;
    $type: 'control' | 'group' | 'array';
    $label: string;
}
declare type ControlState<T = any> = T extends (infer K)[] ? $ControlState & {
    list: Array<ControlState<K>>;
} : T extends ControlTypes ? $ControlState : T extends GroupValue<T> ? {
    [K in keyof T]: ControlState<T[K]> & $ControlState;
} : $ControlState;
export declare abstract class ControlBase<T = any> {
    validators: Writable<ValidatorFn<T>[]>;
    protected meta: Writable<FormControlMeta>;
    protected label: string;
    constructor(validators: ValidatorFn<T>[], meta?: FormControlMeta);
    abstract value: Writable<T>;
    abstract state: Readable<ControlState<T>>;
    abstract child(path: string): ControlBase;
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
    child(): never;
    reset(value?: T): void;
}
declare type Controls<T> = {
    [K in keyof T]: ControlBase<T[K]>;
};
export declare class ControlGroup<T> extends ControlBase<T> {
    private controlStore;
    controls: Readable<Controls<T>>;
    private valueDerived;
    private childStateDerived;
    value: Writable<T>;
    state: Readable<ControlState<T>>;
    constructor(controls: Controls<T>, validators: ValidatorFn<T, any>[] | undefined, meta: FormControlMeta);
    private iterateControls;
    private setValue;
    private patchValue;
    addControl(key: string, control: ControlBase): void;
    removeControl(key: string): void;
    setTouched(touched: boolean): void;
    child(path: string): ControlBase<any>;
    reset(value?: T): void;
}
export declare class ControlArray<T> extends ControlBase<T[]> {
    private readonly _controls;
    private controlStore;
    controls: Readable<ControlBase<T>[]>;
    private valueDerived;
    private childStateDerived;
    value: Writable<T[]>;
    state: Readable<$ControlState & {
        list: ControlState<T>[];
    }>;
    constructor(_controls: ControlBase<T>[], validators?: ValidatorFn<T[]>[], meta?: FormControlMeta);
    private iterateControls;
    private setValue;
    setTouched(touched: boolean): void;
    pushControl(control: ControlBase<T>): void;
    addControlAt(index: number, control: ControlBase<T>): void;
    removeControlAt(index: number): void;
    removeControl(control: ControlBase<T>): void;
    slice(start?: number, end?: number): void;
    child(path: string): ControlBase<any> | ControlBase<T>;
    reset(value?: T[]): void;
}
export {};
