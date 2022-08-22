/* 支持注册副作用函数 */

// 用一个全局变量存储被注册的副作用函数
let activeEffect

// 注册副作用函数
function effect(fn) {
    activeEffect = fn
    fn()
}

// 存储副作用函数的桶
const bucket = new Set()

// 原始对象
const data = {
    text: 'lvlei',
    color: 'black',
}

// 响应式对象
const obj = new Proxy(data, {
    get(target, key) {
        if (activeEffect) {
            bucket.add(activeEffect)
        }
        return target[key]
    },
    set(target, key, newVal) {
        target[key] = newVal
        bucket.forEach(fn => fn())
        return true
    },
})

effect(() => {
    document.body.innerText = obj.text
})
effect(() => {
    document.body.style.color = obj.color
})

setTimeout(() => {
    obj.text = 'leyu'
    obj.color = 'red'
}, 1000)

console.log(bucket, 'bucket')
