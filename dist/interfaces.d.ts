import { ValidationError, ValidatorFn } from "./validators";
import { Readable, Writable } from "svelte/store";
export declare type GroupValue<T> = {
    [K in keyof T]: T[K];
};
export declare type ControlTypes = string | number | boolean;
export declare type ControlState<T = any> = T extends (infer K)[] ? $ControlState & {
    list: Array<ControlState<K>>;
} : T extends ControlTypes ? $ControlState : T extends GroupValue<T> ? {
    [K in keyof T]: ControlState<T[K]> & $ControlState;
} : $ControlState;
export interface FormControlMeta {
    name?: string;
    helperText?: any;
    placeholder?: string;
    visible?: boolean;
    translate?: boolean;
    selectValues?: any[];
    language_dependent?: boolean;
    type: string;
    errorMessages?: {
        [key: string]: string | (() => string);
    };
    emptyControl?: any;
    [key: string]: any;
}
export interface ControlEventOptions {
    propagateChanges?: boolean;
}
export interface ControlBaseInterface<T> {
    initial?: T;
    validators: Writable<ControlValidators<T>>;
    meta: Writable<FormControlMeta>;
    id: string;
    currentState: ControlState<T> | null;
    propagateChanges: boolean;
    label: string;
    value: Writable<T>;
    changedValue: Readable<Partial<T> | undefined>;
    state: Readable<ControlState<T>>;
    child(path: string): ControlBaseInterface<T> | null;
    reset(value?: Partial<T>, options?: ControlEventOptions): void;
    setMeta(value?: FormControlMeta, options?: ControlEventOptions): void;
    patchMeta(value?: Partial<FormControlMeta>, options?: ControlEventOptions): void;
    setValue?(value: T, options?: ControlEventOptions): void;
    patchValue?(value: Partial<T>, options?: ControlEventOptions): void;
    setTouched(touched: boolean, options?: ControlEventOptions): void;
    setValidators: any;
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
export interface ControlValidators<T> {
    validators: ValidatorFn<T>[];
    control: ControlBaseInterface<T>;
}
