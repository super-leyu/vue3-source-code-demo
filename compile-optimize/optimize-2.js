/*
编译优化：Block与PatchFlag
*/

/*
<div>
    <div>foo</div>
    <p>{{ bar }}</p>
</div>
*/

const vnode = {
    tag: 'div',
    children: [
        { tag: 'div', children: 'foo' }, // 静态节点
        { type: 'p', children: ctx.bar, patchFlag: 1 }, // 动态节点（1表示动态文本节点）
    ],
    // 将 children 中 的动态节点提取到 dynamicChildren 数组中
    dynamicChildren: [
        { type: 'p', children: ctx.bar, patchFlag: PatchFlag.Text },
    ],
}
