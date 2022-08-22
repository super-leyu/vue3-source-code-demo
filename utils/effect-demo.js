/**
 * 存储副作用函数的桶
 * 格式：
 * targetMap = { // WeakMap
 *  data: {  // Map - depsMap
 *      text: effect  // Set - deps
 *  }
 * }
 */

// 当前被激活的的副作用函数
let activeEffect
let effectStack = []
// 存储副作用函数的桶
const targetMap = new WeakMap()

// 响应式对象
export function reactive(data) {
    return new Proxy(data, {
        get(target, key) {
            // 将 activeEffect 收集到 targetMap 对应的 key 里
            track(target, key)

            return target[key]
        },
        set(target, key, newVal) {
            target[key] = newVal

            // 从 targetMap 里取出 effect 并执行
            trigger(target, key)

            return true
        },
    })
}

// get 里追踪变化并收集 effect
export function track(target, key) {
    if (!activeEffect) return target[key]

    // 根据target从桶中取出 depsMap; depsMap: 存储 key --> deps 的 Map 集合
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }

    // deps: 存储 effect 的 Set集合
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    // 当前激活的副作用函数收集到 deps 依赖集合里
    deps.add(activeEffect)
    // 将 deps 依赖集合 收集到 activeEffect.deps 数组中
    //（保证每个 effectFn 执行时，可以根据 effectFn.deps 获取相关）
    activeEffect.deps.push(deps)
}

// set 里触发执行 effect
export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    if (!depsMap) return

    const deps = depsMap.get(key)
    const effectsToRun = new Set()
    deps &&
        deps.forEach(fn => {
            if (fn !== activeEffect) {
                effectsToRun.add(fn)
            }
        })

    effectsToRun.forEach(fn => {
        if (fn.options.scheduler) {
            // 交给调度器执行此副作用函数
            fn.options.scheduler(fn)
        } else {
            fn()
        }
    })
}

// 注册副作用函数：fn 是真正的副作用函数，effectFn 是我们自己包装的副作用函数
export function effect(fn, options = {}) {
    const effectFn = () => {
        // 解决问题①：每次调用时，清除依赖集合
        cleanup(effectFn)
        // effectFn 执行时，将其设置为 activeEffect
        activeEffect = effectFn
        // 栈底是内层 effect
        effectStack.push(effectFn)

        // 保存 fn 执行结果
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
    const deps = effectFn.deps
    // 将当前 effectFn 从 dep 数组的每一项依赖集合（Set）里删除
    for (let i = 0; i < deps.length; i++) {
        // 问题②：出现死循环
        deps[i].delete(effectFn)
    }

    // 重置自身的 deps 数组
    // effectFn.deps = []
    effectFn.deps.length = 0
}
