/*
最简单的 watch
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
        // 硬编码，source.foo 触发读取操作，建立副作用函数与响应式数据之间的联系
        () => source.foo,
        {
            scheduler() {
                cb()
            },
        }
    )
}

watch(obj, () => {
    console.log('watch')
})

setTimeout(() => {
    console.log('---定时器开始---')
    obj.foo++
}, 1000)
