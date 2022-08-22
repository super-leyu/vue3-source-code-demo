export function mountChildren(vnode, container) {
    const elm = document.createElement(vnode.tag)
    // 添加真实dom的引用
    vnode.elm = elm
    container.appendChild(elm)
    if (vnode.children) {
        for (let i = 0; i < vnode.children.length; i++) {
            mountChildren(vnode.children[i], elm)
        }
    }
    if (vnode.text) {
        elm.textContent = vnode.text
    }
}

/**
 *
 * @param {*} el  要插入元素
 * @param {*} parent  父元素
 * @param {*} [anchor=null]  插入位置
 */
export function insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
}
