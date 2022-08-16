<script>
  import {ControlError} from "./index";
  import {
    controlClasses,
  } from '@leanpilar/svelte-form-control';
  export let control;
  let state = control.state
  let value = control.value
  console.log($value);
</script>

{#if control}
  {#if $state.$type === 'control'}
    <label>
      <span class="label">email:</span>
      <input bind:value={$value.email} use:controlClasses={control} />
      <ControlError control={control}/>
    </label>
  {/if}
{/if}
