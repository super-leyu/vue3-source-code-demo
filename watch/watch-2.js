/*
1. 观测响应式数据
2. 封装通用读取操作
*/

import { effect, reactive } from '../utils/effect.js'

// 原始对象
const data = {
    foo: 1,
    bar: 2,
}

const obj = reactive(data)

/**
 * @param {*} source 响应式数据
 * @param {*} cb 回调函数
 */
function watch(source, cb) {
    effect(
        // 递归触发读取操作，建立副作用函数与响应式数据之间的联系
        () => traverse(source),
        {
            scheduler() {
                // 数据变化时触发回调 cb
                cb()
            },
        }
    )
}

// 递归读取 source 对象的每个 key
function traverse(source, seen = new Set()) {
    // 原始值 或 已经被读取过（避免循环引用），则不操作
    if (typeof source !== 'object' || source === null || seen.has(source))
        return

    seen.add(source)

    // 假设 source 是对象（暂不考虑数组的情况）
    for (const k in source) {
        traverse(source[k], seen)
    }

    return source
}

watch(obj, () => {
    console.log('watch')
})

setTimeout(() => {
    console.log('---定时器开始---')
    obj.foo++
}, 1000)

window.obj = obj
