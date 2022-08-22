/*
合理触发响应
3. 原型继承属性（接上章）  ？？实测没通？？
*/

import { effect, reactive } from './utils.js'

const c = {}
const child = reactive(c)

const p = { foo: 1 }
const parent = reactive(p)

// parent 作为 child 原型
Object.setPrototypeOf(child, parent)

effect(() => {
    console.log(child.foo) // 1
})

setTimeout(() => {
    console.log('---定时器开始---')
    // 问题①：触发了 2 次 effect
    // 分析问题①：
    // child自身没有 foo 时，会默认触发 parent.foo，也会触发 parent 的 set
    // 需要屏蔽原型上的触发，通过
    // 解决问题①：在 get 和 set 里判断 receiver 是否是 target 的代理对象
    // receiver 不变指向的都是 child；而 target 会变化
    child.foo = 2
}, 1000)

// console.log(child.raw === c, 'child.raw === c')
// console.log(parent.raw === p, 'parent.raw === p')
