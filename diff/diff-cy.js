function mount(vnode, container) {
    const elm = document.createElement(vnode.tag)
    // 添加真实dom的引用
    vnode.elm = elm
    container.appendChild(elm)
    if (vnode.children) {
        for (let i = 0; i < vnode.children.length; i++) {
            mount(vnode.children[i], elm)
        }
    }
    if (vnode.text) {
        elm.textContent = vnode.text
    }
}

// 核心diff
function patch(oldVnode, newVnode, container) {
    // 对新树的遍历
    const oldCh = oldVnode.children
    const newCh = newVnode.children
    let lastIndex = 0

    for (let i = 0; i < newCh.length; i++) {
        // 找到新树中的值在旧树中的索引
        const idxInOld = oldCh.findIndex(vnode => vnode.key === newCh[i].key)
        if (idxInOld < lastIndex) {
            // 在旧树中找到a节点
            const moveNode = oldCh[idxInOld]
            // 将a移动到lastIndex对应节点的后面
            oldVnode.elm.insertBefore(
                moveNode.elm,
                oldCh[lastIndex].elm.nextSibling
            )
        }
        lastIndex = idxInOld
    }
}

function render(vnode, container) {
    const oldVnode = container.vnode
    if (oldVnode) {
        // patch
        patch(oldVnode, vnode, container)
    } else {
        // mount
        mount(vnode, container)
        container.vnode = vnode
    }
}

const vnode = {
    tag: 'ul',
    children: [
        {
            tag: 'li',
            key: 'a',
            text: 'a',
        },
        {
            tag: 'li',
            key: 'b',
            text: 'b',
        },
        {
            tag: 'li',
            key: 'c',
            text: 'c',
        },
        {
            tag: 'li',
            key: 'd',
            text: 'd',
        },
    ],
}
const newVnode = {
    tag: 'ul',
    children: [
        {
            tag: 'li',
            key: 'b',
            text: 'b',
        },
        {
            tag: 'li',
            key: 'a',
            text: 'a',
        },
        {
            tag: 'li',
            key: 'd',
            text: 'd',
        },
        {
            tag: 'li',
            key: 'c',
            text: 'c',
        },
    ],
}

render(vnode, document.querySelector('#app'))

setTimeout(() => {
    render(newVnode, document.querySelector('#app'))
}, 2000)
