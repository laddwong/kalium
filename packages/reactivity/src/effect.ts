export class ReactiveEffect<T = any> {
  parentEffect: ReactiveEffect
  constructor(public fn: Function) {
    this.parentEffect = null
  }
  run() {
    if(activeEffect === this) return
    this.parentEffect = activeEffect || null
    activeEffect = this
    this.fn()
    activeEffect = this.parentEffect
  }
}

export let activeEffect = null;

export function effect(fn: Function): void {
  const effect = new ReactiveEffect(fn)
  effect.run()
}