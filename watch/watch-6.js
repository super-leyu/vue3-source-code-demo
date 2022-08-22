/*
竞态问题：过期的副作用 onInvalidate
*/

import { effect, reactive } from '../utils/effect.js'
import { timerPromise } from '../utils/tools.js'

// 原始对象
const data = {
    foo: 1,
    bar: 2,
}

const obj = reactive(data)

/**
 * @param {*} source 响应式数据 / getter 函数
 * @param {*} cb 回调函数
 */
function watch(source, cb, options = {}) {
    let getter

    if (typeof source === 'function') {
        // 直接赋值
        getter = source
    } else {
        // 递归触发读取操作，建立副作用函数与响应式数据之间的联系
        getter = () => traverse(source)
    }

    let oldVal
    let newVal
    // 存储用户注册的过期回调
    let cleanup
    // 定义 onInvalidate 函数
    function onInvalidate(fn) {
        cleanup = fn
    }

    // 提取出来，方便在 初始化 和 变更时 执行
    const job = () => {
        // 在 scheduler 中重新执行副作用函数，拿到新值
        newVal = effectFn()

        // 先调用过期回调 → 再调用cb
        if (cleanup) {
            cleanup()
        }
        // 数据变化时触发回调 cb
        cb(newVal, oldVal, onInvalidate)

        oldVal = newVal
    }

    const effectFn = effect(
        // 执行 getter
        () => getter(),
        {
            lazy: true,
            // 使用 job 作为调度器函数
            scheduler: () => {
                // 放入微任务队列
                if (options.flush === 'post') {
                    const p = Promise.resolve()
                    p.then(job)
                } else {
                    job()
                }
            },
        }
    )

    if (options.immediate) {
        // 立即执行
        job()
    } else {
        // 手动调用副作用函数，拿到旧值
        oldVal = effectFn()
    }
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

let finalData

let flag = true

watch(obj, async (newVal, oldVal, onInvalidate) => {
    console.log('watch', newVal, oldVal) // ???

    // 标识副作用函数是否过期
    let expired = false

    // 注册过期回调
    onInvalidate(() => {
        // 解决问题①：设置过期标识。每次副作用重新执行之前，调用此过期回调
        expired = true
    })

    let res

    // 用定时器模拟请求
    // 问题①：第一次foo变化，触发A请求，耗时2000ms返回；第二次 foo 变化，触发B请求，耗时1000ms返回；A晚于B返回，结果过期应当舍弃
    if (flag) {
        flag = false
        console.time(`A请求`)
        res = await timerPromise(2000, `A数据-${obj.foo}`)
        console.timeEnd(`A请求`)
    } else {
        flag = true
        console.time(`B请求`)
        res = await timerPromise(1000, `B数据-${obj.foo}`)
        console.timeEnd(`B请求`)
    }
    // const res = await fetch(
    //     'https://qmap-pre.map.woa.com/DAL/com/getstableversion'
    // ).then(() => `新数据-${obj.foo}`)

    if (!expired) {
        finalData = res
    }

    console.log({ res, finalData }, 'finalData') // B数据-3（未设置过期前是A数据-2）
})

// 第一次修改（抛弃）
obj.foo++

setTimeout(() => {
    // 第二次修改（保留）
    obj.foo++
}, 200)

window.obj = obj
