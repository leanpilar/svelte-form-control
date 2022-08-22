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
    name: new Control('initial', [
      required,
      minLength(3),
      maxLength(10),
    ], {name: 'Name'}),
    labels: new ControlArray([
   /*   labelControl(),
      labelControl(),*/
    ], [], {
      placeholder: 'labels',
      emptyControl: labelControl
    }),
  },
    [
      (value, control) => {
        const valid =
          value.name && value.email && value.email.substr(0, value.email.indexOf('@')) === value.name;
        return valid ? null : { custom: `email username part should be the same as name` };
      }
    ],{
      placeholder: 'form group'
    });

  const value = form.value;
  const state = form.state;
  const changedValue = form.changedValue;

  const labelsControl = form.child('labels');
  const labels = labelsControl.controls;

  const addLabel = () => labelsControl.pushControl(labelControl('new'));
  const removeLabel = label => () => labelsControl.removeControl(label);

  let ageAvailable = false;
  const toggleAge = () => {
    ageAvailable = !form.child('age');
    if (ageAvailable) {
      form.addControl('age', ageControl, {propagateChanges: false});
      } else {
      form.removeControl('age',{propagateChanges: false});
    }
  };

  $: json = JSON.stringify($value, undefined, 2);
  $: changedValueJson = JSON.stringify($changedValue, undefined, 2);
  $: stateJson = JSON.stringify($state, undefined, 2);
  //let maneMeta = form.child('name').meta
</script>



<h1>Svelte form control example</h1>


<div>
  Form is {$state.$valid ? 'valid' : 'invalid'}
  <ControlError control={form}/>
</div>
<div>Values are {$state.$dirty ? 'dirty' : 'pristine'}</div>
<div>Fields are {$state.$touched ? 'touched' : 'untouched'}</div>

<CustomControl control="{form}" />
<button on:click="{() => form.setTouched(true)}"> touch</button>
<button on:click="{() => form.child('name').patchMeta({visible: false})}"> patchMeta</button>
<hr>


<div>
  <button on:click={() => form.reset($value)} disabled={!$state.$valid || !$state.$dirty}>submit</button>
  <button on:click={() => form.setValue({ labels: [
    {label_name: 'new', label_type: 'default'},
    {label_name: 'new', label_type: 'default'},
  ]})}>
    reset
  </button>
  <button on:click={() => form.reset({ address: { zip: 11111 } })} disabled={!$state.$dirty}>
    reset2
  </button>
  <button on:click={toggleAge}>
    toggle age
  </button>
</div>
changedValue <hr>
<pre>{changedValueJson}</pre>
value <hr>
<pre>{json}</pre>
state <hr>
<pre>{stateJson}</pre>
