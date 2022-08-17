import { ValidatorFn } from "./validators";
import { ControlValidators } from "./interfaces";
export declare const chainValidators: <T>(validators: ControlValidators<T>) => ValidatorFn;
export declare const validateIterated: <T>(validators: ControlValidators<T>, fieldValue: T) => import("./validators").ValidationError<any> | null;
