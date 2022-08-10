class ReactiveEffect {
  parentEffect: ReactiveEffect
  constructor(public fn: Function) {
    this.parentEffect = null
  }
  run() {
    activeEffect = this
    this.fn()
    activeEffect = false
  }
}

let activeEffect = null

export function effect(fn: Function): void {
  const effect = new ReactiveEffect(fn)
  effect.run()
}