
<script lang="ts">


  import {defaultErrorMessages} from "./defaultErrorMessages";

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
