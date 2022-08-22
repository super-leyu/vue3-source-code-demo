/* 收集effect */

// 存储副作用函数的桶
const bucket = new Set()

// 副作用函数
function effect() {
    document.body.innerText = obj.text
}

// 原始对象
const data = {
    text: 'lvlei',
}

// 响应式对象
const obj = new Proxy(data, {
    get(target, key) {
        bucket.add(effect)
        return target[key]
    },
    set(target, key, newVal) {
        target[key] = newVal
        bucket.forEach(fn => fn())
        return true
    },
})

effect()

setTimeout(() => {
    obj.text = 'leyu'
}, 1000)

console.log(bucket, 'bucket')
