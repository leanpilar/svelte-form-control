export const defaultErrorMessages = {
  required: 'required',
  email: 'invalid email',
  minLength: min => `min length ${min}`,
  maxLength: max => `max length ${max}`,
  number: 'invalid number',
  decimal: 'invalid decimal',
  integer: 'invalid integer',
  min: min => `less then ${min}`,
  max: max => `greater then ${max}`,
  pattern: pattern => `pattern ${pattern}`,
};

