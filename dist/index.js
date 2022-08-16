'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var store = require('svelte/store');

const validateIterated = (validators, fieldValue) => {
    if (!Array.isArray(validators))
        return null;
    for (const validator of validators) {
        if (typeof validator === "function") {
            try {
                const result = validator(fieldValue);
                if (result != null)
                    return result;
            }
            catch (e) {
                console.error(`validator error`, validator, e);
            }
        }
    }
    return null;
};

class ControlBase {
    constructor(validators, meta) {
        var _a;
        this.validators = store.writable(validators);
        this.meta = store.writable(meta !== null && meta !== void 0 ? meta : {});
        this.label = (_a = meta === null || meta === void 0 ? void 0 : meta.name) !== null && _a !== void 0 ? _a : '';
    }
    setValidators(validators) {
        if (!(Array.isArray(validators) && validators.length))
            return;
        this.validators.set(validators);
    }
}
class Control extends ControlBase {
    constructor(initial, validators = [], meta) {
        super(validators, meta);
        this.initial = initial;
        this.value = store.writable(this.initial);
        this.touched = store.writable(false);
        this.state = store.derived([this.value, this.touched, this.validators, this.meta], ([value, $touched, validators, meta], set) => {
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
                });
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
                    });
                })
                    .catch((err) => {
                    $valid = false;
                    set({
                        $error: {
                            serverError: true,
                        },
                        $valid,
                        $touched,
                        $dirty,
                        $pending,
                        $meta,
                        $type
                    });
                });
            }
            else {
                $valid = $error == null;
                set({
                    $error,
                    $valid,
                    $touched,
                    $dirty,
                    $pending,
                    $meta,
                    $type
                });
            }
        });
    }
    setTouched(touched) {
        this.touched.set(touched);
    }
    child() {
        return null;
    }
    reset(value) {
        if (value !== undefined)
            this.initial = value;
        this.value.set(this.initial);
        this.touched.set(false);
    }
}
const objectPath = /^([^.[]+)\.?(.*)$/;
class ControlGroup extends ControlBase {
    constructor(controls, validators = [], meta) {
        super(validators, meta);
        this.controlStore = store.writable({});
        this.controls = {
            subscribe: this.controlStore.subscribe,
        };
        this.valueDerived = store.derived(this.controlStore, (controls, set) => {
            const keys = Object.keys(controls);
            const controlValues = keys.map((key) => controls[key].value);
            const derivedValues = store.derived(controlValues, (values) => values.reduce((acc, value, index) => ((acc[keys[index]] = value), acc), {}));
            return derivedValues.subscribe(set);
        });
        this.touched = store.writable(false);
        this.childStateDerived = store.derived(this.controlStore, (controls, set) => {
            const keys = Object.keys(controls);
            const controlStates = keys.map((key) => controls[key].state);
            const derivedStates = store.derived(controlStates, (states) => states.reduce((acc, state, index) => ((acc[keys[index]] = state), acc), {}));
            return derivedStates.subscribe(set);
        });
        this.value = {
            subscribe: this.valueDerived.subscribe,
            set: (value) => this.setValue(value),
            update: (updater) => this.setValue(updater(store.get(this.valueDerived))),
        };
        this.state = store.derived([this.valueDerived, this.childStateDerived, this.validators, this.touched, this.meta], ([value, childState, validators, touched, meta]) => {
            const children = {};
            let childrenValid = true;
            let $touched = touched;
            let $dirty = false;
            let $pending = false;
            let $meta = meta;
            let $type = 'group';
            for (const key of Object.keys(childState)) {
                const state = (children[key] = childState[key]);
                childrenValid = childrenValid && state.$valid;
                $touched = $touched || state.$touched;
                $dirty = $dirty || state.$dirty;
                $pending = $pending || state.$pending;
            }
            const $error = validateIterated(validators, value);
            const $valid = $error == null && childrenValid;
            return Object.assign({ $error,
                $valid,
                $touched,
                $dirty,
                $pending,
                $meta,
                $type }, children);
        });
        this.controlStore.set(controls);
    }
    iterateControls(callback) {
        const controls = store.get(this.controlStore);
        Object.entries(controls).forEach(callback);
    }
    setValue(value) {
        this.iterateControls(([key, control]) => {
            var _a;
            const controlValue = (_a = (value && value[key])) !== null && _a !== void 0 ? _a : null;
            control.value.set(controlValue);
        });
    }
    patchValue(value) {
        const currentValue = store.get(this.valueDerived);
        this.setValue(Object.assign(Object.assign({}, currentValue), value));
    }
    addControl(key, control) {
        this.controlStore.update((controls) => ((controls[key] = control), controls));
    }
    removeControl(key) {
        this.controlStore.update((controls) => (delete controls[key], controls));
    }
    setTouched(touched) {
        this.iterateControls(([_, control]) => {
            control.setTouched(touched);
        });
        this.touched.set(touched);
    }
    child(path) {
        const [_, name, rest] = path.match(objectPath) || [];
        const controls = store.get(this.controlStore);
        const control = (name && controls[name]) || null;
        if (!control)
            return null;
        return rest ? control.child(rest) : control;
    }
    reset(value) {
        this.iterateControls(([key, control]) => {
            const controlValue = (value && value[key]) || null;
            control.reset(controlValue);
        });
    }
}
const arrayPath = /^\[(\d+)\]\.?(.*)$/;
class ControlArray extends ControlBase {
    constructor(_controls, validators = [], meta) {
        super(validators, meta);
        this._controls = _controls;
        this.controlStore = store.writable(this._controls);
        this.touched = store.writable(false);
        this.controls = {
            subscribe: this.controlStore.subscribe,
        };
        this.valueDerived = store.derived(this.controlStore, (controls, set) => {
            const derivedValues = store.derived(controls.map((control) => control.value), (values) => values);
            return derivedValues.subscribe(set);
        });
        this.childStateDerived = store.derived(this.controlStore, (controls, set) => {
            const derivedStates = store.derived(controls.map((control) => control.state), (values) => values);
            return derivedStates.subscribe(set);
        });
        this.value = {
            subscribe: this.valueDerived.subscribe,
            set: (value) => this.setValue(value),
            update: (updater) => this.setValue(updater(store.get(this.valueDerived))),
        };
        this.state = store.derived([this.valueDerived, this.childStateDerived, this.validators, this.touched], ([value, childState, validators, touched]) => {
            console.log('setup state');
            const arrayState = {};
            arrayState.list = [];
            let childrenValid = true;
            arrayState.$touched = touched;
            for (let i = 0, len = childState.length; i < len; i++) {
                console.log({ i });
                const state = childState[i];
                arrayState.list[i] = state;
                childrenValid = childrenValid && state.$valid;
                arrayState.$touched = arrayState.$touched || state.$touched;
                arrayState.$dirty = arrayState.$dirty || state.$dirty;
            }
            arrayState.$error = validateIterated(validators, value);
            arrayState.$valid = arrayState.$error == null && childrenValid;
            arrayState.$meta = store.get(this.meta);
            arrayState.$type = 'array';
            return arrayState;
        });
    }
    iterateControls(callback) {
        const controls = store.get(this.controlStore);
        controls.forEach(callback);
    }
    setValue(value) {
        this.iterateControls((control, index) => {
            const controlValue = (value && value[index]) || null;
            control.value.set(controlValue);
        });
    }
    setTouched(touched) {
        this.touched.set(touched);
        this.iterateControls((control) => control.setTouched(touched));
    }
    pushControl(control) {
        this.controlStore.update((controls) => (controls.push(control), controls));
    }
    addControlAt(index, control) {
        this.controlStore.update((controls) => (controls.splice(index, 0, control), controls));
    }
    removeControlAt(index) {
        this.controlStore.update((controls) => (controls.splice(index, 1), controls));
    }
    removeControl(control) {
        this.controlStore.update((controls) => controls.filter((c) => c !== control));
    }
    slice(start, end) {
        this.controlStore.update((controls) => controls.slice(start, end));
    }
    child(path) {
        const [_, index, rest] = path.match(arrayPath) || [];
        const controls = store.get(this.controlStore);
        const control = (index != null && controls[+index]) || null;
        if (!control)
            return null;
        return rest ? control.child(rest) : control;
    }
    reset(value) {
        this.iterateControls((control, index) => {
            const controlValue = (value && value[index]) || null;
            control.reset(controlValue);
        });
    }
}

const controlClasses = (el, control) => {
    if (!(control instanceof Control))
        throw new Error('must be used with a Control class');
    const classList = el.classList;
    const stateSub = control.state.subscribe((state) => {
        if (state.$error) {
            classList.add('invalid');
            classList.remove('valid');
        }
        else {
            classList.add('valid');
            classList.remove('invalid');
        }
        if (state.$dirty) {
            classList.add('dirty');
            classList.remove('pristine');
        }
        else {
            classList.add('pristine');
            classList.remove('dirty');
        }
        if (state.$touched) {
            classList.add('touched');
        }
        else {
            classList.remove('touched');
        }
    });
    const eventNames = ['blur', 'focusout'];
    const unregister = () => eventNames.forEach(eventName => el.removeEventListener(eventName, touchedFn));
    const touchedFn = () => {
        if (store.get(control.state).$touched)
            return;
        control.setTouched(true);
    };
    eventNames.forEach(eventName => el.addEventListener(eventName, touchedFn));
    return {
        destroy() {
            unregister();
            stateSub();
        }
    };
};

const empty = (value) => value == null || `${value}` === '';
const required = value => {
    let stringValue = value != null && value !== false ? `${value}`.trim() : '';
    return stringValue !== '' ? null : { required: true };
};
const emailFormat = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
const email = email => {
    const valid = empty(email) || emailFormat.test(email);
    return valid ? null : { email: true };
};
const minLength = min => value => {
    const valid = empty(value) || min == null || `${value}`.trim().length >= min;
    return valid ? null : { minLength: min };
};
const maxLength = max => value => {
    const valid = empty(value) || max == null || `${value}`.trim().length <= max;
    return valid ? null : { maxLength: max };
};
const number = number => {
    const valid = empty(number) || !isNaN(+number);
    return valid ? null : { number: true };
};
const decimalFormat = /^\d*\.?\d+$/;
const decimal = number => {
    const valid = empty(number) || !isNaN(+number) && decimalFormat.test(`${number}`);
    return valid ? null : { decimal: true };
};
const intFormat = /^\d+$/;
const integer = number => {
    const valid = empty(number) || !isNaN(+number) && intFormat.test(`${number}`);
    return valid ? null : { integer: true };
};
const min = min => number => {
    const valid = empty(number) || !isNaN(+number) && (min == null || number >= min);
    return valid ? null : { min };
};
const max = max => number => {
    const valid = empty(number) || !isNaN(+number) && (max == null || number <= max);
    return valid ? null : { max };
};
const pattern = re => text => {
    const valid = empty(text) || (re == null || re.test(text));
    return valid ? null : { pattern: `${re}` };
};

exports.Control = Control;
exports.ControlArray = ControlArray;
exports.ControlBase = ControlBase;
exports.ControlGroup = ControlGroup;
exports.controlClasses = controlClasses;
exports.decimal = decimal;
exports.email = email;
exports.integer = integer;
exports.max = max;
exports.maxLength = maxLength;
exports.min = min;
exports.minLength = minLength;
exports.number = number;
exports.pattern = pattern;
exports.required = required;
//# sourceMappingURL=index.js.map
