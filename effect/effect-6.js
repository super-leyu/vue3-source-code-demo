/* cleanup 清除额外的副作用函数 */

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
    const effectFn = () => {
        // 解决问题①：每次调用时，清除依赖集合
        cleanup(effectFn)
        // effectFn 执行时，将其设置为 activeEffect
        activeEffect = effectFn
        fn()
    }

    // deps 存储所有与该副作用函数相关联的依赖集合
    effectFn.deps = []
    effectFn()
}

// 断开副作用函数与响应式数据的联系
function cleanup(effectFn) {
    const effects = effectFn.deps
    // 将当前 effectFn 从 dep 数组的每一项依赖集合（Set）里删除
    for (let i = 0; i < effects.length; i++) {
        // 问题②：出现死循环
        effects[i].delete(effectFn)
    }

    // 重置自身的 deps 数组
    // effectFn.deps = []
    effectFn.deps.length = 0
}

/**
 * 存储副作用函数的桶
 * 格式：
 * bucket = { // WeakMap
 *  data: {  // Map - effectsMap
 *      text: effect  // Set - effects
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
    // 当前激活的副作用函数收集到 effects 依赖集合里
    effects.add(activeEffect)
    // 将 effects 依赖集合 收集到 activeEffect.deps 数组中（保证每个 effectFn 执行时，可以根据 effectFn.deps 获取相关）
    activeEffect.deps.push(effects)
}

// set 里触发执行 effect
function trigger(target, key) {
    let effectsMap = bucket.get(target)
    if (!effectsMap) return

    const effects = effectsMap.get(key)
    // 解决问题②：调用 cleanup 方法后会出现死循环，因为在遍历过程中存在增删值。这里构造一个新的 Set 遍历
    const effectsToRun = new Set(effects)
    effectsToRun.forEach(fn => fn())
    // effects && effects.forEach(fn => fn())
}

window.obj = obj

effect(() => {
    // 问题①：ok 置为 false 后，无论如何改变 text 值，都不应该触发此 effect
    console.log('text-effect', obj)
    document.body.innerText = obj.ok ? obj.text : 'not found'
})
effect(() => {
    console.log('color-effect', obj)
    document.body.style.color = obj.color
})

// // effect 嵌套时发现：定时器结束后，color-effect执行了 2 次，text-effect没有执行
// // 分析原因：嵌套时内层 effect 会覆盖掉 activeEffect，且 activeEffect 无法恢复 成外层 effect
// effect(() => {
//     console.log('text-effect', obj)
//     effect(() => {
//         console.log('color-effect', obj)
//         document.body.style.color = obj.color
//     })
//     document.body.innerText = obj.text
// })

setTimeout(() => {
    obj.text = 'leyu'
    obj.color = 'red'
}, 1000)
