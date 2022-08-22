/*
ref: 区分 原始值包裹对象/非原始值响应数据
*/

import { effect, reactive } from '../proxy/utils.js'

function ref(val) {
    const wrapper = {
        value: val,
    }

    // 定义不可枚举属性
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true,
    })
    return reactive(wrapper)
}

const refVal = ref(1)

effect(() => {
    console.log(refVal.value)
})

setTimeout(() => {
    refVal.value = 2
}, 1000)
