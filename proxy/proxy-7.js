/*
只读 readonly 和 浅只读 shallowReadonly
*/

import { effect, readonly, shallowReadonly } from './utils.js'

const data = {
    foo: { bar: 1 },
}

const shallowObj = shallowReadonly(data)
const obj = readonly(data)

effect(() => {
    console.log(obj.foo, 'effect')
})

window.obj = obj
window.shallowObj = shallowObj
