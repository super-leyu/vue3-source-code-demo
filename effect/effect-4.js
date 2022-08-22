/* 完整的响应式系统 */

// 原始对象
const data = {
    text: 'lvlei',
    color: 'black',
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

        return target[key]
    },
    set(target, key, newVal) {
        target[key] = newVal

        let effectsMap = bucket.get(target)
        if (!effectsMap) return

        const effects = effectsMap.get(key)
        effects && effects.forEach(fn => fn())
    },
})

effect(() => {
    document.body.innerText = obj.text
})
effect(() => {
    document.body.style.color = obj.color
})

setTimeout(() => {
    obj.text = 'leyu'
    obj.color = 'red'
}, 1000)

console.log(bucket, 'bucket')
