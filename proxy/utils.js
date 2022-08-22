// 当前被激活的的副作用函数
let activeEffect
let effectStack = []

// 构造唯一 key，标识 obj 上的某一个键值
const ITERATE_KEY = Symbol()

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

function cleanup(effectFn) {
    const effects = effectFn.deps
    for (let i = 0; i < effects.length; i++) {
        effects[i].delete(effectFn)
    }

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

// 深响应
export function reactive(data) {
    return createReactive(data)
}

// 浅响应
export function shallowReactive(data) {
    return createReactive(data, true)
}

// 深只读
export function readonly(data) {
    return createReactive(data, false, true)
}

// 浅只读
export function shallowReadonly(data) {
    return createReactive(data, true, true)
}

function createReactive(data, isShallow = false, isReadonly = false) {
    return new Proxy(data, {
        get(target, key, receiver) {
            // 代理对象可以通过 raw 属性访问原始数据
            if (key === 'raw') {
                // console.log(target, receiver, 'xxx')

                return target
            }

            track(target, key)

            const res = Reflect.get(target, key, receiver)

            if (isShallow) {
                return res
            }

            // 得到原始值结果
            if (typeof res === 'object' && res !== null) {
                return isReadonly ? readonly(res) : reactive(res)
            }

            return res
        },
        has(target, key) {
            track(target, key)
            return Reflect.has(target, key)
        },
        ownKeys(target) {
            track(target, ITERATE_KEY)
            return Reflect.ownKeys(target)
        },
        deleteProperty(target, key) {
            if (isReadonly) {
                console.warn(`属性 ${key} 是只读的`)
                return true
            }

            const hasKey = Object.prototype.hasOwnProperty.call(target, key)
            const res = Reflect.deleteProperty(target, key)

            if (res && hasKey) {
                trigger(target, key, 'DELETE')
            }

            return res
        },
        set(target, key, newVal, receiver) {
            if (isReadonly) {
                console.warn(`属性 ${key} 是只读的`)
                return true
            }
            // 旧值
            const oldVal = target[key]

            const type = Array.isArray(target)
                ? Number(key) < target.length
                    ? 'CHANGE'
                    : 'ADD'
                : Object.prototype.hasOwnProperty.call(receiver, key)
                ? 'CHANGE'
                : 'ADD'

            // debugger

            // target[key] = newVal
            const res = Reflect.set(target, key, newVal, receiver)

            // console.log(target === receiver.raw, 'mmm')

            // 当存在原型继承时，屏蔽原型上的重复触发：当 receiver 就是 target 的代理对象时
            if (target === receiver.raw) {
                // 不全等 且 都不是 NaN 时，触发
                const isNotNaN = oldVal === oldVal || newVal === newVal
                if (newVal !== oldVal && isNotNaN) {
                    trigger(target, key, type, newVal)
                }
            }

            return res
        },
    })
}

export function track(target, key) {
    if (!activeEffect) return target[key]

    let effectsMap = bucket.get(target)
    if (!effectsMap) {
        bucket.set(target, (effectsMap = new Map()))
    }

    let effects = effectsMap.get(key)
    if (!effects) {
        effectsMap.set(key, (effects = new Set()))
    }
    effects.add(activeEffect)
    activeEffect.deps.push(effects)
}

export function trigger(target, key, type) {
    let effectsMap = bucket.get(target)
    if (!effectsMap) return

    const effects = effectsMap.get(key)
    // 取得与 ITERATE_KEY 相关联的副作用函数
    const iterateEffects = effectsMap.get(ITERATE_KEY)

    const effectsToRun = new Set()

    effects &&
        effects.forEach(fn => {
            if (fn !== activeEffect) {
                effectsToRun.add(fn)
            }
        })

    if (Array.isArray(target) && key === 'length') {
        // debugger
        // 取出与 length 相关联的副作用函数
        // const lengthEffects = effectsMap.get('length')
        // lengthEffects &&
        //     lengthEffects.forEach(fn => {
        //         if (fn !== activeEffect) {
        //             effectsToRun.add(fn)
        //         }
        //     })
        effectsMap.forEach(effects, key => {
            if (key >= newVal) {
                effects.forEach(fn => {
                    if (fn !== activeEffect) {
                        effectsToRun.add(fn)
                    }
                })
            }
        })
    }

    // 只有 ADD / DELETE 时，才触发 iterateEffects 重新执行
    if (['ADD', 'DELETE'].includes(type)) {
        // 解决问题①：与 ITERATE_KEY 相关联的副作用函数也添加到 effectsToRun
        iterateEffects &&
            iterateEffects.forEach(fn => {
                if (fn !== activeEffect) {
                    effectsToRun.add(fn)
                }
            })
    }

    effectsToRun.forEach(fn => {
        if (fn.options.scheduler) {
            // 交给调度器执行此副作用函数
            fn.options.scheduler(fn)
        } else {
            fn()
        }
    })
}
