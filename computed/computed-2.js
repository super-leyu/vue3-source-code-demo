/* 实现 computed (懒计算 + 缓存) */

// 原始对象
const data = {
    foo: 1,
    bar: 2,
}

// 当前被激活的的副作用函数
let activeEffect
let effectStack = []

// 注册副作用函数：fn 是真正的副作用函数，effectFn 是我们自己包装的副作用函数
function effect(fn, options = {}) {
    const effectFn = () => {
        // 解决问题①：每次调用时，清除依赖集合
        cleanup(effectFn)
        // effectFn 执行时，将其设置为 activeEffect
        activeEffect = effectFn
        // 栈底是内层 effect
        effectStack.push(effectFn)

        const res = fn()

        // fn 执行完立即出栈
        effectStack.pop()
        // activeEffect 还原为外层正在执行的 effect
        activeEffect = effectStack[effectStack.length - 1]

        return res
    }

    // deps 存储所有与该副作用函数相关联的依赖集合
    effectFn.deps = []
    effectFn.options = options

    if (!options.lazy) {
        // 立即执行
        effectFn()
    }

    // 将副作用函数返回，延迟执行
    return effectFn
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
    const effectsToRun = new Set()
    effects &&
        effects.forEach(fn => {
            // 解决问题③：如果 trigger 触发的副作用 与 正在执行的 副作用函数相同，则不触发执行
            if (fn !== activeEffect) {
                effectsToRun.add(fn)
            }
        })

    effectsToRun.forEach(fn => {
        // console.log(fn.options, 'fn.options')
        if (fn.options.scheduler) {
            // 交给调度器执行此副作用函数
            fn.options.scheduler(fn)
        } else {
            fn()
        }
    })
}

window.obj = obj

function computed(getter) {
    // 缓存上一次的结果
    let value
    // 标记是否需要重新计算
    let dirty = true

    const effectFn = effect(getter, {
        lazy: true,
        // 解决问题①：因为 scheduler 会在响应式数据变化时执行，故在此使 dirty 为 true
        scheduler() {
            dirty = true
        },
    })

    const obj = {
        get value() {
            if (dirty) {
                value = effectFn()
                dirty = false
            }
            return value
        },
    }

    return obj
}

// 问题①：修改 foo/bar 的值不会触发重新计算
const sumRes = computed(() => {
    console.log('computed')
    return obj.foo + obj.bar
})

console.log(sumRes.value, 'sumRes.value') // 3
console.log(sumRes.value, 'sumRes.value') // 3（来自缓存）

setTimeout(() => {
    obj.foo++
    console.log(sumRes.value, 'sumRes.value') // 4（已重新计算）
}, 1000)

console.log('bucket', bucket)
