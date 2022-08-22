/*
ref: setter 可写
*/

import { effect, reactive } from '../proxy/utils.js'

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

const obj = reactive({ foo: 1, bar: 2 })
const retFoo = toRef(obj, 'foo')

effect(() => {
    console.log(retFoo.value)
})

setTimeout(() => {
    retFoo.value = 2
}, 1000)
