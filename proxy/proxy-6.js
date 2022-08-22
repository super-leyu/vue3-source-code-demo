/*
深响应 reactive 和 浅响应 shallowReactive
*/

import { effect, reactive, shallowReactive } from './utils.js'

const data = {
    foo: { bar: 1 },
}

const shallowObj = shallowReactive(data)
const obj = reactive(data)

effect(() => {
    console.log(obj.foo.bar, 'effect')
})

window.obj = obj
window.shallowObj = shallowObj
