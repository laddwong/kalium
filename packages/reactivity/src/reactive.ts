// 使用weakMap做缓存，避免重复proxy同一个对象
const proxyCache = new WeakMap()

export function reactive(target) {
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
      // 使用Reflect保证取值时的this指向到target的proxy实例，而非target本身
      return Reflect.get(target, key, receive)
    },
    set(target, key, value, receive) {
      return Reflect.set(target, key, value, receive)
    }
  })
  proxyCache.set(target, proxyForTarget)
  return proxyForTarget
}