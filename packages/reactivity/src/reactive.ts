import { activeEffect, ReactiveEffect } from "./effect";

// 使用weakMap做缓存，避免重复proxy同一个对象
const proxyCache = new WeakMap()

// 数据对象->字段名->ReactiveEffect实例
export type EffectSet = Set<ReactiveEffect>
export type KeyToEffects = Map<any, EffectSet>;
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
    console.log('收集到effect：', effect);
    effectSetForKey.add(effect)
    // effect反向记录关联的数据
    effect.deps.push(effectSetForKey)
  }
}

/** 设置数据时，找到对应的effect触发响应 */
const activeForDataSet = (target: object, key: any) => {
  const targetToMap = dataToEffectMap.get(target)
  if(targetToMap) {
    const keyToEffects = targetToMap.get(key)
    // 这样写会死循环
    /* 循环路径：数据的set -> 遍历收集到的effect列表 -> 调用effect的run -> run中调用fn前清空 -> 调用fn触发get收集effect ↓
                                ↑------------------------------添加effect到列表-------------------------------------
    */
    // if(keyToEffects) {
    //   keyToEffects.forEach(item => {
    //     item.run()
    //   })
    // }

    // 拷贝一份调用run进行更新，原来那份会被清空然后重新收集依赖
    const keyToEffectsCopy = new Set(keyToEffects)
    if(keyToEffectsCopy) {
      keyToEffectsCopy.forEach(item => {
        item.run()
      })
    }
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
        console.log('收集了依赖', target, key, activeEffect);
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
        activeForDataSet(target, key)
      }
      return result
    }
  })
  proxyCache.set(target, proxyForTarget)
  return proxyForTarget
}