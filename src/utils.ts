import { ValidatorFn } from "./validators";
import {ControlValidators} from "./interfaces";


export const chainValidators: <T>(validators: ControlValidators<T>) => ValidatorFn = (
	validators
) => {
	if (!Array.isArray(validators.validators)) return (value: any) => null;
	return (fieldValue) => {
		for (const validator of validators.validators) {
			const result = validator(fieldValue, validators.control);
			if (result) return result;
		}
		return null;
	};
};

export const validateIterated = <T>(
	validators: ControlValidators<T>,
	fieldValue: T
) => {
	if (!Array.isArray(validators.validators)) return null;
	for (const validator of validators.validators) {
		if (typeof validator === "function") {
			try {
				const result = validator(fieldValue, validators.control);
				if (result != null) return result;
			} catch (e) {
				console.error(`validator error`, validator, e);
			}
		}
	}
	return null;
};
