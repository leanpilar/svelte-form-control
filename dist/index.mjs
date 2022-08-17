import { writable, derived, get } from 'svelte/store';

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

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

function v4(options, buf, offset) {
  options = options || {};
  var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return stringify(rnds);
}

class ControlBase {
    constructor(validators, meta) {
        var _a;
        this.id = v4();
        this.validators = writable(validators);
        this.meta = writable(meta !== null && meta !== void 0 ? meta : {});
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
        this.value = writable(this.initial);
        this.touched = writable(false);
        this.state = derived([this.value, this.touched, this.validators, this.meta], ([value, $touched, validators, meta], set) => {
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
        this.controlStore = writable({});
        this.controls = {
            subscribe: this.controlStore.subscribe,
        };
        this.valueDerived = derived(this.controlStore, (controls, set) => {
            const keys = Object.keys(controls);
            const controlValues = keys.map((key) => controls[key].value);
            const derivedValues = derived(controlValues, (values) => values.reduce((acc, value, index) => ((acc[keys[index]] = value), acc), {}));
            return derivedValues.subscribe(set);
        });
        this.touched = writable(false);
        this.childStateDerived = derived(this.controlStore, (controls, set) => {
            const keys = Object.keys(controls);
            const controlStates = keys.map((key) => controls[key].state);
            const derivedStates = derived(controlStates, (states) => states.reduce((acc, state, index) => ((acc[keys[index]] = state), acc), {}));
            return derivedStates.subscribe(set);
        });
        this.value = {
            subscribe: this.valueDerived.subscribe,
            set: (value) => this.setValue(value),
            update: (updater) => this.setValue(updater(get(this.valueDerived))),
        };
        this.state = derived([this.valueDerived, this.childStateDerived, this.validators, this.touched, this.meta], ([value, childState, validators, touched, meta]) => {
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
        const controls = get(this.controlStore);
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
        const currentValue = get(this.valueDerived);
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
        const controls = get(this.controlStore);
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
        this.controlStore = writable(this._controls);
        this.touched = writable(false);
        this.controls = {
            subscribe: this.controlStore.subscribe,
        };
        this.valueDerived = derived(this.controlStore, (controls, set) => {
            const derivedValues = derived(controls.map((control) => control.value), (values) => values);
            return derivedValues.subscribe(set);
        });
        this.childStateDerived = derived(this.controlStore, (controls, set) => {
            const derivedStates = derived(controls.map((control) => control.state), (values) => values);
            return derivedStates.subscribe(set);
        });
        this.value = {
            subscribe: this.valueDerived.subscribe,
            set: (value) => this.setValue(value),
            update: (updater) => this.setValue(updater(get(this.valueDerived))),
        };
        this.state = derived([this.valueDerived, this.childStateDerived, this.validators, this.touched], ([value, childState, validators, touched]) => {
            const arrayState = {};
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
            arrayState.$error = validateIterated(validators, value);
            arrayState.$valid = arrayState.$error == null && childrenValid;
            arrayState.$meta = get(this.meta);
            arrayState.$type = 'array';
            return arrayState;
        });
    }
    iterateControls(callback) {
        const controls = get(this.controlStore);
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
        const controls = get(this.controlStore);
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
        if (get(control.state).$touched)
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

export { Control, ControlArray, ControlBase, ControlGroup, controlClasses, decimal, email, integer, max, maxLength, min, minLength, number, pattern, required };
//# sourceMappingURL=index.mjs.map
