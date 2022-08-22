/*
代理数组：
1. 修改索引
2. 修改length
3.
*/

import { effect, reactive } from './utils.js'

const data = ['foo']
const arr = reactive(data)

effect(() => {
    console.log(arr[0], 'effect')
})

setTimeout(() => {
    console.log('---定时器开始---')
    // arr[1] = 'bar'
    arr.length = 0
}, 1000)
