import { activeEffect, ReactiveEffect } from "./effect";

// 使用weakMap做缓存，避免重复proxy同一个对象
const proxyCache = new WeakMap()

// 数据对象->字段名->ReactiveEffect实例
type EffectSet = Set<ReactiveEffect>
type KeyToEffects = Map<any, EffectSet>;
const dataToEffectMap = new WeakMap<any, KeyToEffects>()

const linkDataToEffect = (target: object, key: any, effect: ReactiveEffect): void => {
  let keyMapForTarget = dataToEffectMap.get(target)
  if (!keyMapForTarget) { // 是否有某个数据对象
    keyMapForTarget = new Map()
    dataToEffectMap.set(target, keyMapForTarget)
  }
  let effectSetForKey = keyMapForTarget.get(key)
  if(!effectSetForKey) { // 数据对象内是否有某个key
    effectSetForKey = new Set()
    keyMapForTarget.set(key, effectSetForKey)
  }
  if(!effectSetForKey.has(effect)) { // 数据对象的key的effect列表内是否有某个effect
    effectSetForKey.add(effect)
  }
}

export function reactive(target: object) {
  if(proxyCache.get(target)) {
    return proxyCache.get(target)
  }

  // 判断target是不是一个被reactive代理出来的proxy实例，是的话返回自身
  const IS_REACTIVE = '_v_isReactive'
  if(target[IS_REACTIVE]) return target;

  const proxyForTarget =  new Proxy(target, {
    get(target, key, receive) {
      // 增加隐藏的标识，标识这个是reactive代理出来的proxy，防止被代理
      if(key === IS_REACTIVE) return true

      // 将数据对象->key->effect关联起来，如果是非effect内调用的就没有activeEffect，就不用关联
      if(activeEffect) {
        linkDataToEffect(target, key, activeEffect)
      }

      // 使用Reflect保证取值时的this指向到target的proxy实例，而非target本身
      return Reflect.get(target, key, receive)
    },
    set(target, key, value, receive) {
      const oldVal = target[key]
      const newVal = value
      let result = Reflect.set(target, key, value, receive)
      if(oldVal !== newVal) {
        const targetToMap = dataToEffectMap.get(target)
        if(targetToMap) {
          const KeyToEffects = targetToMap.get(key)
          if(KeyToEffects) {
            KeyToEffects.forEach(item => {
              item.run()
            })
          }
        }
      }
      return result
    }
  })
  proxyCache.set(target, proxyForTarget)
  return proxyForTarget
}