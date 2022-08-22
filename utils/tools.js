// setTimeout 转成 promise
export function timerPromise(defer, value) {
    return new Promise(resolve => setTimeout(() => resolve(value), defer))
}
