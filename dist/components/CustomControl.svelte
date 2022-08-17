<script>
  import ControlError from "./ControlError.svelte";
  import {
    controlClasses,
  } from '@leanpilar/svelte-form-control';
  export let control;
  export let label = '';
  let state = control.state
  let value = control.value
  let controls = control.controls;
  function addControl() {
    if ($state?.$meta?.emptyControl) {
      control.pushControl($state.$meta.emptyControl())
    }
  }
</script>

{#if control}
  {#if $state.$type === 'control'}
    <label>
      <span class="label">{$state?.$meta?.name || label}</span>
      <input placeholder="{$state?.$meta?.placeholder}" bind:value={$value} use:controlClasses={control} />
      <ControlError control={control}/>
    </label>
  {/if}
  {#if $state.$type === 'group'}
    <fieldset>
      {#each Object.entries($controls) as [label, control]}
        <svelte:self {control} {label}>
        </svelte:self>
      {/each}
    </fieldset>
  {/if}
  {#if $state.$type === 'array'}
    <fieldset>
      {#each $controls as ctrl, i}
        <fieldset>
        <svelte:self control="{ctrl}" >
        </svelte:self>
        <button on:click={control.removeControlAt(i)}>remove me</button>
        </fieldset>
      {/each}
      <button on:click={addControl}>add one</button>
    </fieldset>
  {/if}
{/if}


<style>
  label .label {
    display: block;
  }

  fieldset {
    border: none;
    margin-top: 1em;
  }
</style>
