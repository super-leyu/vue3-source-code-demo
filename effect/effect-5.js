/* 拦截函数封装 + 分支切换产生的额外副作用 */

// 原始对象
const data = {
    text: 'lvlei',
    color: 'black',
    ok: true,
}

// 当前被激活的的副作用函数
let activeEffect

// 注册副作用函数
function effect(fn) {
    activeEffect = fn
    fn()
}

/**
 * 存储副作用函数的桶
 * 格式：
 * bucket = { // WeakMap
 *  data: {  // Map
 *      text: effect  // Set
 *  }
 * }
 */
const bucket = new WeakMap()

// 响应式对象
const obj = new Proxy(data, {
    get(target, key) {
        // 将 activeEffect 收集到 bucket 对应的 key 里
        track(target, key)

        return target[key]
    },
    set(target, key, newVal) {
        target[key] = newVal

        // 从 bucket 里取出 effect 并执行
        trigger(target, key, newVal)
    },
})

// get 里追踪变化并收集 effect
function track(target, key) {
    if (!activeEffect) return target[key]

    // 根据target从桶中取出 effectsMap; effectsMap: 存储 key --> effects 的 Map 集合
    let effectsMap = bucket.get(target)
    if (!effectsMap) {
        bucket.set(target, (effectsMap = new Map()))
    }

    // effects: 存储 effect 的 Set集合
    let effects = effectsMap.get(key)
    if (!effects) {
        effectsMap.set(key, (effects = new Set()))
    }
    // 副作用收集到桶里
    effects.add(activeEffect)
}

// set 里触发执行 effect
function trigger(target, key) {
    let effectsMap = bucket.get(target)
    if (!effectsMap) return

    const effects = effectsMap.get(key)
    effects && effects.forEach(fn => fn())
}

window.obj = obj

effect(() => {
    // ok 置为 false 后，无论如何改变 text 值，都不应该触发此 effect
    console.log('text-effect', obj)
    document.body.innerText = obj.ok ? obj.text : 'not found'
})
effect(() => {
    console.log('color-effect', obj)
    document.body.style.color = obj.color
})

setTimeout(() => {
    obj.text = 'leyu'
    obj.color = 'red'
}, 1000)
