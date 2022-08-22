/*
代理 obj：操作类型
1. 新增属性 - 重新触发 effect
2. 修改属性 - 不重新触发 effect
3. 删除属性 - 重新触发 effect
*/

// 原始对象
const data = {
    foo: 1,
}

// 构造唯一 key，标识 obj 上的某一个键值
const ITERATE_KEY = Symbol()

// 响应式对象
const obj = new Proxy(data, {
    get(target, key, receiver) {
        console.log('get:', key)

        track(target, key)
        return Reflect.get(target, key, receiver)
    },
    has(target, key) {
        console.log('has:', key)

        track(target, key)
        return Reflect.has(target, key)
    },
    ownKeys(target) {
        console.log('ownKeys:', target)

        track(target, ITERATE_KEY)
        return Reflect.ownKeys(target)
    },
    deleteProperty(target, key) {
        console.log('deleteProperty:', key)

        const hasKey = Object.prototype.hasOwnProperty.call(target, key)
        const res = Reflect.deleteProperty(target, key)

        if (res && hasKey) {
            trigger(target, key, 'DELETE')
        }

        return res
    },
    set(target, key, newVal, receiver) {
        const type = Object.prototype.hasOwnProperty.call(receiver, key)
            ? 'CHANGE'
            : 'ADD'

        target[key] = newVal
        const res = Reflect.set(target, key, newVal, receiver)

        trigger(target, key, type)

        return res
    },
})

const bucket = new WeakMap()
let activeEffect
let effectStack = []

function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)

        const res = fn()

        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]

        return res
    }

    effectFn.deps = []
    effectFn.options = options

    if (!options.lazy) {
        effectFn()
    }

    return effectFn
}

function cleanup(effectFn) {
    const effects = effectFn.deps
    for (let i = 0; i < effects.length; i++) {
        effects[i].delete(effectFn)
    }

    effectFn.deps.length = 0
}

function track(target, key) {
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

function trigger(target, key, type) {
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

effect(() => {
    for (const key in obj) {
        console.log('effect:', key)
    }
})

setTimeout(() => {
    console.log('---定时器开始---')
    // 问题①：新增键 bar，不能触发响应
    // 分析问题①：for...in时，副作用函数与 ITERATE_KEY之间建立联系，与 bar 并没关系
    obj.bar = 2
}, 1000)

window.obj = obj
