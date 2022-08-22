/*
代理 obj：
1. 访问属性：obj.foo
2. 判断对象或原型上是否有给定key：key in obj
3. 使用 for...in循环遍历对象：for(const key in obj)
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
    set(target, key, newVal, receiver) {
        console.log('set:', key)

        target[key] = newVal

        const res = Reflect.set(target, key, newVal, receiver)
        trigger(target, key)

        return res
    },
})

effect(() => {
    for (const key in obj) {
        console.log(key)
    }
})

setTimeout(() => {
    console.log('---定时器开始---')
    obj.foo++
}, 1000)
