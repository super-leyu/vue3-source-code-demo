/*
toRefs: 解决响应丢失问题
*/

import { effect, reactive } from '../proxy/utils.js'

function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
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

const obj = reactive({ foo: 1, bar: 2 })

// const newObj = {
//     // ...obj,
//     foo: toRef(obj, 'foo'),
//     bar: toRef(obj, 'bar'),
// }
const newObj = {
    ...toRefs(obj),
}

effect(() => {
    console.log(newObj.foo.value)
})

setTimeout(() => {
    obj.foo = 2
}, 1000)
