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

function patch(oldVnode, newVnode, container) {
    // 对新树的遍历
    const oldCh = oldVnode.children
    const newCh = newVnode.children
    let lastIndex = 0

    for (let i = 0; i < newCh.length; i++) {
        // 新树中的值在旧树中的索引
        const idxInOld = oldCh.findIndex(vnode => vnode.key === newCh[i].key)
        if (idxInOld < lastIndex) {
            // 找到旧树中的A
            const moveNode = oldCh[idxInOld]
            // oldCh[lastIndex].elm.nextSiblings;
            oldVnode.elm.insertBefore(
                moveNode.elm,
                oldCh[lastIndex].elm.nextSibling
            )
        }
        // lastIndex = idxInOld;
        lastIndex = Math.max(lastIndex, idxInOld)
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

// 编译器compaler编译成上述对象结构
// render () {
//     return <div onClick="handleClick"></div>
// }

render(vnode, document.querySelector('#app'))

setTimeout(() => {
    render(newVnode, document.querySelector('#app'))
}, 2000)
