/*
简单 diff 算法

① 如何寻找需要移动的节点：
从新节点找到在旧节点中的索引，记录为最大索引 lastIndex；
如有节点索引小于 lastIndex，则判定需要移动

② 如何移动节点：
1.先 patch：patch 函数的作用是更新节点的属性，重新设置事件监听器
2.

问题：
只从一端比较
*/

import { mountChildren, insert } from '../utils/diff.js'

/**
 * 渲染（临时只考虑 增/改 两种场景）
 * @param {*} vnode 要渲染的节点
 * @param {*} container 挂载的真实dom节点
 */
function render(vnode, container) {
    const oldVnode = container.vnode
    if (oldVnode) {
        // 如果存在旧节点，对比更新
        patchChildren(oldVnode, vnode, container)
    } else {
        // 不存在就直接挂载
        mountChildren(vnode, container)
        container.vnode = vnode
    }
}

function patchChildren(oldVnode, newVnode, container) {
    // 对新树的遍历
    const oldCh = oldVnode.children
    const newCh = newVnode.children

    // 用来存储寻找过程中遇到的最大索引值
    let lastIndex = 0

    for (let i = 0; i < newCh.length; i++) {
        // 新树中的值在旧树中的索引
        const idxInOld = oldCh.findIndex(vnode => vnode.key === newCh[i].key)

        // ①
        if (idxInOld < lastIndex) {
            // 找到旧树中的要移动节点
            const moveNode = oldCh[idxInOld]
            const anchor = oldCh[lastIndex].elm.nextSibling

            moveNode.elm.style.color = 'red'

            // ② 移动到 lastIndex 对应节点的后面
            insert(moveNode.elm, oldVnode.elm, anchor)
        }
        // 更新最大索引
        lastIndex = Math.max(lastIndex, idxInOld)
    }
}

const vnode = {
    tag: 'ul',
    children: [
        {
            tag: 'li',
            key: 'p-1',
            text: 'p-1',
        },
        {
            tag: 'li',
            key: 'p-2',
            text: 'p-2',
        },
        {
            tag: 'li',
            key: 'p-3',
            text: 'p-3',
        },
    ],
}
const newVnode = {
    tag: 'ul',
    children: [
        {
            tag: 'li',
            key: 'p-3',
            text: 'p-3',
        },
        {
            tag: 'li',
            key: 'p-1',
            text: 'p-1',
        },
        {
            tag: 'li',
            key: 'p-2',
            text: 'p-2',
        },
    ],
}

render(vnode, document.querySelector('#app'))

setTimeout(() => {
    render(newVnode, document.querySelector('#app'))
}, 2000)
