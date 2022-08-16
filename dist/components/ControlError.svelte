
<script lang="ts">

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
  export let control;
  let classes = 'control-error';
  export { classes as class };
  export let messages = {};

  const meta = control.meta
  const customErrorMessages = $meta.errorMessages ?? {}
  $: mergedMessages = messages ? {...defaultErrorMessages, ...customErrorMessages, ...messages} : {};


  const state = control.state;


  let error, value;
  let message;
  $: {
    [error, value] = Object.entries($state.$error || {})[0] || [];
    const messageFn = mergedMessages[error];
    message = typeof messageFn === 'function' ? messageFn(value)
      : typeof messageFn === 'string' ? messageFn
      : `${error}${value ? `: ${value}` : ''}`;
  }

</script>

{#if $state.$error}
<span class={classes}>
  {message}
</span>
{/if}
