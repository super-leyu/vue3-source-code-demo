/*
自动脱 ref
*/

import { effect, reactive } from '../proxy/utils.js'

function ref(val) {
    const wrapper = {
        value: val,
    }

    // 定义不可枚举属性
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true,
    })
    return reactive(wrapper)
}

function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
        },
        set value(val) {
            obj[key] = val
        },
    }

    Object.defineProperty(wrapper, '__v_isRef', {
        value: true,
    })

    return wrapper
}

function toRefs(obj) {
    const ret = {}

    for (const key in obj) {
        ret[key] = toRef(obj, key)
    }

    return ret
}

function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            return value.__v_isRef ? value.value : value
        },
        set(target, key, newValue, receiver) {
            // 通过 target 读取真实值
            const value = target[key]
            if (value.__v_isRef) {
                value.value = newValue
                return true
            }
            return Reflect.set(target, key, newValue, receiver)
        },
    })
}

const obj = reactive({ foo: 1, bar: 2 })
const newObj = proxyRefs({ ...toRefs(obj) })

effect(() => {
    console.log(newObj.foo, 'effect')
})

setTimeout(() => {
    newObj.foo = 2
}, 1000)

console.log({ obj, newObj }, 'sss')
