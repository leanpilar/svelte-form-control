"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var t=require("svelte/store");const e=(t,e)=>{if(!Array.isArray(t.validators))return null;for(const r of t.validators)if("function"==typeof r)try{const s=r(e,t.control);if(null!=s)return s}catch(t){console.error("validator error",r,t)}return null};var r,s=new Uint8Array(16);function o(){if(!r&&!(r="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto)))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return r(s)}var i=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;function n(t){return"string"==typeof t&&i.test(t)}for(var l=[],a=0;a<256;++a)l.push((a+256).toString(16).substr(1));function d(t,e,r){var s=(t=t||{}).random||(t.rng||o)();if(s[6]=15&s[6]|64,s[8]=63&s[8]|128,e){r=r||0;for(var i=0;i<16;++i)e[r+i]=s[i];return e}return function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,r=(l[t[e+0]]+l[t[e+1]]+l[t[e+2]]+l[t[e+3]]+"-"+l[t[e+4]]+l[t[e+5]]+"-"+l[t[e+6]]+l[t[e+7]]+"-"+l[t[e+8]]+l[t[e+9]]+"-"+l[t[e+10]]+l[t[e+11]]+l[t[e+12]]+l[t[e+13]]+l[t[e+14]]+l[t[e+15]]).toLowerCase();if(!n(r))throw TypeError("Stringified UUID is invalid");return r}(s)}const u={type:"string"};class c{constructor(e,r){var s,o;this.id=d(),this.currentState=null,this.propagateChanges=!0,this.validators=t.writable({validators:e,control:this}),this.meta=t.writable(null!==(s=Object.assign(Object.assign({},u),r))&&void 0!==s?s:{}),this.label=null!==(o=null==r?void 0:r.name)&&void 0!==o?o:""}setMeta(t){this.meta.set(t)}patchMeta(e){const r=t.get(this.meta);this.meta.set(Object.assign(Object.assign({},r),e))}setValidators(t){Array.isArray(t)&&t.length&&this.validators.set({validators:t,control:this})}}class h extends c{constructor(r,s=[],o){super(s,o),this.initial=r,this.value=t.writable(this.initial),this.touched=t.writable(!1),this.state=t.derived([this.value,this.touched,this.validators,this.meta],(([t,r,s,o],i)=>{const n=this.initial!==t,l=e(s,t);let a=!0,d=!1,u=o,c="control";null!=l&&l instanceof Promise?(d=!0,i({$error:null,$valid:a,$touched:r,$dirty:n,$pending:d,$meta:u,$type:c}),l.then((t=>{a=null==t,d=!1,i({$error:t,$valid:a,$touched:r,$dirty:n,$pending:d,$meta:u,$type:c})})).catch((t=>{a=!1,i({$error:{serverError:!0},$valid:a,$touched:r,$dirty:n,$pending:d,$meta:u,$type:c})}))):(a=null==l,i({$error:l,$valid:a,$touched:r,$dirty:n,$pending:d,$meta:u,$type:c}))}))}setTouched(t){this.touched.set(t)}child(){return null}reset(t){void 0!==t&&(this.initial=t),this.value.set(this.initial),this.touched.set(!1)}}const p=/^([^.[]+)\.?(.*)$/;const v=/^\[(\d+)\]\.?(.*)$/;const $=t=>null==t||""==`${t}`,g=/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/,m=/^\d*\.?\d+$/,b=/^\d+$/;exports.Control=h,exports.ControlArray=class extends c{constructor(r,s=[],o){super(s,o),this._controls=r,this.controlStore=t.writable(this._controls),this.touched=t.writable(!1),this.controls={subscribe:this.controlStore.subscribe},this.valueDerived=t.derived(this.controlStore,((e,r)=>t.derived(e.map((t=>t.value)),(t=>t)).subscribe(r))),this.childStateDerived=t.derived(this.controlStore,((e,r)=>t.derived(e.map((t=>t.state)),(t=>t)).subscribe(r))),this.value={subscribe:this.valueDerived.subscribe,set:t=>this.setValue(t),update:e=>this.setValue(e(t.get(this.valueDerived)))},this.state=t.derived([this.valueDerived,this.childStateDerived,this.validators,this.touched],(([r,s,o,i])=>{const n={list:[]};let l=!0;n.$touched=i;for(let t=0,e=s.length;t<e;t++){const e=s[t];n.list[t]=e,l=l&&e.$valid,n.$touched=n.$touched||e.$touched||!1,n.$dirty=n.$dirty||e.$dirty}return n.$error=e(o,r),n.$valid=null==n.$error&&l,n.$meta=t.get(this.meta),n.$type="array",n}))}iterateControls(e){t.get(this.controlStore).forEach(e)}sortArray(e){const r=t.get(this.controlStore);let s=e.map((t=>t.id)).map((t=>r.find((e=>e.id===t))));s=s.filter((t=>void 0!==t)),this.controlStore.set(s)}setValue(t){this.iterateControls(((e,r)=>{const s=t&&t[r]||null;e.value.set(s)}))}setTouched(t){this.touched.set(t),this.iterateControls((e=>e.setTouched(t)))}pushControl(t){this.controlStore.update((e=>(e.push(t),e)))}addControlAt(t,e){this.controlStore.update((r=>(r.splice(t,0,e),r)))}removeControlAt(t){this.controlStore.update((e=>(e.splice(t,1),e)))}removeControl(t){this.controlStore.update((e=>e.filter((e=>e!==t))))}slice(t,e){this.controlStore.update((r=>r.slice(t,e)))}child(e){const[r,s,o]=e.match(v)||[],i=t.get(this.controlStore),n=null!=s&&i[+s]||null;return n?o?n.child(o):n:null}reset(t){this.iterateControls(((e,r)=>{const s=t&&t[r]||null;e.reset(s)}))}},exports.ControlBase=c,exports.ControlGroup=class extends c{constructor(r,s=[],o){super(s,o),this.controlStore=t.writable({}),this.controls={subscribe:this.controlStore.subscribe},this.valueDerived=t.derived(this.controlStore,((e,r)=>{const s=Object.keys(e),o=s.map((t=>e[t].value));return t.derived(o,(t=>t.reduce(((t,e,r)=>(t[s[r]]=e,t)),{}))).subscribe(r)})),this.touched=t.writable(!1),this.childStateDerived=t.derived(this.controlStore,((e,r)=>{const s=Object.keys(e),o=s.map((t=>e[t].state));return t.derived(o,(t=>t.reduce(((t,e,r)=>(t[s[r]]=e,t)),{}))).subscribe(r)})),this.value={subscribe:this.valueDerived.subscribe,set:t=>this.setValue(t),update:e=>this.setValue(e(t.get(this.valueDerived)))},this.state=t.derived([this.valueDerived,this.childStateDerived,this.validators,this.touched,this.meta],(([t,r,s,o,i])=>{if(this.propagateChanges&&null!==this.currentState)return this.currentState;console.log("propagateState");const n={};let l=!0,a=o,d=!1,u=!1,c=i;for(const t of Object.keys(r)){const e=n[t]=r[t];l=l&&e.$valid,a=a||e.$touched,d=d||e.$dirty,u=u||e.$pending}const h=e(s,t),p=null==h&&l;let v=Object.assign({$error:h,$valid:p,$touched:a,$dirty:d,$pending:u,$meta:c,$type:"group"},n);return this.currentState=v,v})),this.controlStore.set(r)}iterateControls(e){const r=t.get(this.controlStore);Object.entries(r).forEach(e)}setValue(t){this.iterateControls((([e,r])=>{var s;const o=null!==(s=t&&t[e])&&void 0!==s?s:null;r.value.set(o)}))}patchValue(e){const r=t.get(this.valueDerived);this.setValue(Object.assign(Object.assign({},r),e))}addControl(t,e,r){r&&!1===r.propagateChanges&&(this.propagateChanges=!1),this.controlStore.update((r=>(r[t]=e,r))),this.propagateChanges=!0}removeControl(t,e){e&&!1===e.propagateChanges&&(this.propagateChanges=!1),this.controlStore.update((e=>(delete e[t],e))),this.propagateChanges=!0}setTouched(t){this.iterateControls((([e,r])=>{r.setTouched(t)})),this.touched.set(t)}child(e){const[r,s,o]=e.match(p)||[],i=t.get(this.controlStore),n=s&&i[s]||null;return n?o?n.child(o):n:null}reset(t){this.iterateControls((([e,r])=>{const s=t&&t[e]||void 0;r.reset(s)}))}},exports.controlClasses=(e,r)=>{if(!(r instanceof h))throw new Error("must be used with a Control class");const s=e.classList,o=r.state.subscribe((t=>{t.$error?(s.add("invalid"),s.remove("valid")):(s.add("valid"),s.remove("invalid")),t.$dirty?(s.add("dirty"),s.remove("pristine")):(s.add("pristine"),s.remove("dirty")),t.$touched?s.add("touched"):s.remove("touched")})),i=["blur","focusout"],n=()=>{t.get(r.state).$touched||r.setTouched(!0)};return i.forEach((t=>e.addEventListener(t,n))),{destroy(){i.forEach((t=>e.removeEventListener(t,n))),o()}}},exports.decimal=t=>$(t)||!isNaN(+t)&&m.test(`${t}`)?null:{decimal:!0},exports.email=t=>$(t)||g.test(t)?null:{email:!0},exports.integer=t=>$(t)||!isNaN(+t)&&b.test(`${t}`)?null:{integer:!0},exports.max=t=>e=>$(e)||!isNaN(+e)&&(null==t||e<=t)?null:{max:t},exports.maxLength=t=>e=>$(e)||null==t||`${e}`.trim().length<=t?null:{maxLength:t},exports.min=t=>e=>$(e)||!isNaN(+e)&&(null==t||e>=t)?null:{min:t},exports.minLength=t=>e=>$(e)||null==t||`${e}`.trim().length>=t?null:{minLength:t},exports.number=t=>$(t)||!isNaN(+t)?null:{number:!0},exports.pattern=t=>e=>$(e)||null==t||t.test(e)?null:{pattern:`${t}`},exports.required=t=>""!==(null!=t&&!1!==t?`${t}`.trim():"")?null:{required:!0};
//# sourceMappingURL=index.js.map
