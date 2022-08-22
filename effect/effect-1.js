/* 最简单的响应式系统 */

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
        console.log({ target, key }, 'get')
        return target[key]
    },
    set(target, key, newVal) {
        console.log({ target, key, newVal }, 'set')
        target[key] = newVal
        effect()
        return true
    },
})

effect()

setTimeout(() => {
    obj.text = 'leyu'
}, 1000)
