/*
使用 Reflect 正确代理对象
*/

import { effect, track, trigger } from '../utils/effect.js'

// 原始对象
const data = {
    foo: 1,
    get bar() {
        // 分析问题①：this 指向的是原始对象 data
        return this.foo
    },
}

// 响应式对象
const obj = new Proxy(data, {
    get(target, key, receiver) {
        track(target, key)

        // 解决问题①：receiver 即代表代理对象 obj，故正确返回属性值
        return Reflect.get(target, key, receiver)
    },
    set(target, key, newVal) {
        target[key] = newVal

        trigger(target, key, newVal)

        return true
    },
})

effect(() => {
    // 问题①：读取访问器属性 bar ，没有触发副作用函数执行
    console.log(obj.bar)
})

setTimeout(() => {
    obj.foo++
}, 1000)
