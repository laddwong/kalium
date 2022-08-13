import { EffectSet } from "./reactive";

function cleanupEffect(effect:ReactiveEffect): void {
  console.log('effect清空依赖', effect);
  const dpes = effect.deps
  dpes.forEach(item => {
    item.delete(effect)
  })
  dpes.length = 0
}
export class ReactiveEffect<T = any> {
  public parentEffect: ReactiveEffect = null;
  public deps: Array<EffectSet> = [];
  constructor(public fn: Function) {}
  run() {
    if(activeEffect === this) return
    console.log('触发更新');
    this.parentEffect = activeEffect || null
    activeEffect = this
    // 执行之前清空所有依赖
    cleanupEffect(this)
    this.fn()
    activeEffect = this.parentEffect
  }
}

export let activeEffect = null;

export function effect(fn: Function): void {
  const effect = new ReactiveEffect(fn)
  effect.run()
}