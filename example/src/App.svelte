<script>
  import {
    Control,
    ControlGroup,
    ControlArray,
    controlClasses,
    email,
    integer,
    required,
    minLength,
    maxLength,
    min,
    max,
  } from '@leanpilar/svelte-form-control';

  import { ControlError, CustomControl } from '@leanpilar/svelte-form-control/components';

  const labelControl = () => new ControlGroup({
    label_name: new Control('', [
      required,
    ], {name: 'Label Name'}),
    label_type: new Control('default', [
      required,
    ], {name: 'Label Type'}),
  })

  const ageControl = new Control(12, [
    required,
    integer,
    min(3),
    max(20),
  ]);

  const form = new ControlGroup({
    name: new Control('', [
      required,
      minLength(4),
      maxLength(10),
      name => name === 'test' ? null : { expected: 'test' },
    ], {
      placeholder: 'custom placeholder',
      errorMessages: {
        required: 'Name is required'
      }
    }),
    email: new Control('test@inbox.com', [
      required,
      email
    ]),
    address: new ControlGroup({
      line: new Control('line', [
        required,
      ]),
      city: new Control('city', [
        required,
      ]),
      zip: new Control('1111e', [
        required,
        integer,
        minLength(5),
        maxLength(5),

      ],{
        errorMessages: {
          required: 'Zip is required',
          integer: 'Zip must be a number',
        }
      }),
    }, [], {placeholder: 'address'}),
    labels: new ControlArray([
      labelControl(),
      labelControl(),
    ], [], {
      placeholder: 'labels',
      emptyControl: labelControl
    }),
  },
    [
      (value) => {
        const valid =
          value.name && value.email && value.email.substr(0, value.email.indexOf('@')) === value.name;
        return valid ? null : { custom: `email username part should be the same as name` };
      }
    ],{
      placeholder: 'form group'
    });

  const value = form.value;
  const state = form.state;

  const labelsControl = form.child('labels');
  const labels = labelsControl.controls;

  const addLabel = () => labelsControl.pushControl(labelControl('new'));
  const removeLabel = label => () => labelsControl.removeControl(label);

  let ageAvailable = false;
  const toggleAge = () => {
    ageAvailable = !form.child('age');
    if (ageAvailable) {
      form.addControl('age', ageControl);
      } else {
      form.removeControl('age');
    }
  };

  $: json = JSON.stringify($value, undefined, 2);
  $: stateJson = JSON.stringify($state, undefined, 2);
  //let maneMeta = form.child('name').meta
</script>

<style>
label .label {
  display: block;
}

fieldset {
  border: none;
  margin-top: 1em;
}
</style>

<h1>Svelte form control example</h1>


<div>
  Form is {$state.$valid ? 'valid' : 'invalid'}
  <ControlError control={form}/>
</div>
<div>Values are {$state.$dirty ? 'dirty' : 'pristine'}</div>
<div>Fields are {$state.$touched ? 'touched' : 'untouched'}</div>

<CustomControl control="{form}" />
<button on:click="{() => form.setTouched(true)}"> touch</button>
<hr>
<label>
  <span class="label">name:</span>
  <input placeholder="{$state?.name?.$meta?.placeholder}" bind:value={$value.name} use:controlClasses={form.child('name')} />
  <ControlError control={form.child('name')}/>
</label>

<!--<CustomControl control="{form.child('email')}" />-->
<label>
  <span class="label">email:</span>
  <input bind:value={$value.email} use:controlClasses={form.child('email')} />
  <ControlError control={form.child('email')}/>
</label>

{#if ageAvailable}
<label>
  <span class="label">age:</span>
  <input type="number" bind:value={$value.age} use:controlClasses={form.child('age')} />
  <ControlError control={form.child('age')}/>
</label>
{/if}

<fieldset>
  <legend>address:</legend>
  <label>
    <input bind:value={$value.address.line} use:controlClasses={form.child('address.line')} />
    <ControlError control={form.child('address.line')}/>
  </label>

  <label>
    <span class="label">city:</span>
    <input bind:value={$value.address.city} use:controlClasses={form.child('address.city')} />
    <ControlError control={form.child('address.city')}/>
  </label>

  <label>
    <span class="label">zip:</span>
    <input  bind:value={$value.address.zip} use:controlClasses={form.child('address.zip')} />
    <ControlError messages="{{integer: 'custom invalid integer message'}}" control={form.child('address.zip')}/>
  </label>
</fieldset>

<fieldset>
  <legend>labels</legend>
<!--  {#each $labels as label, index (label)}
    <div class="">
      <input bind:value={$value.labels[index]} use:controlClasses={label} />
      <button on:click={removeLabel(label)}>- remove</button>
      <ControlError control={label}/>
    </div>
  {/each}-->
  <div>
    <button on:click={addLabel}>+ add</button>
  </div>
  {#if !$state.labels.$valid}
  <div class='error'>Some label invalid</div>
  {/if}
</fieldset>

<div>
  <button on:click={() => form.reset($value)} disabled={!$state.$valid || !$state.$dirty}>submit</button>
  <button on:click={() => form.reset({ labels: ['reset1'] })} disabled={!$state.$dirty}>
    reset
  </button>
  <button on:click={() => form.reset({ address: { zip: 11111 } })} disabled={!$state.$dirty}>
    reset2
  </button>
  <button on:click={toggleAge}>
    toggle age
  </button>
</div>

<pre>{json}</pre>
<pre>{stateJson}</pre>
