/*
对于文本的 diff，类似 Leetcode 72 编辑距离问题

给你两个单词 word1 和 word2， 请返回将 word1 转换成 word2 所使用的最少操作数。

你可以对一个单词进行如下三种操作：
插入一个字符
删除一个字符
替换一个字符

eg.
输入：word1 = "horse", word2 = "ros"
输出：3
解释：
horse -> rorse (将 'h' 替换为 'r')
rorse -> rose (删除 'r')
rose -> ros (删除 'e')

*/

/*
思路分析：
if s1[i] == s2[j]:
    啥都别做（skip）
    i, j 同时向前移动
else:
    三选一：
        插入（insert）
        删除（delete）
        替换（replace）
*/

/*
     替    删    删
s1:  h  o  r  s  e
s2:  r  o  s
*/

// 自顶向下的递归 + 备忘录
/**
 * @param {string} s1 原始字符串
 * @param {string} s2 目标字符串
 * @return {number}
 */
var minDistance = function (s1, s2) {
    // 初始索引从后向前
    const m = s1.length - 1
    const n = s2.length - 1
    const memo = new Map()

    res = dp(m, n)
    console.log(memo)

    return res

    // 定义：dp(i, j) 表示返回 s1[0..i] 和 s2[0..j] 的最小编辑距离
    function dp(i, j) {
        // base case: 当一方走完后，另一方需要将前面的字符串删除/插入，故返回的是另一方删除/插入的次数
        if (i < 0) return j + 1
        if (j < 0) return i + 1

        if (memo.get(`${i}${j}`)) {
            return memo.get(`${i}${j}`)
        }

        // 状态转移：dp(i, j) = dp(i - 1, j - 1)
        if (s1[i] === s2[j]) {
            memo.set(`${i}${j}`, dp(i - 1, j - 1))
        } else {
            memo.set(
                `${i}${j}`,
                Math.min(
                    dp(i, j - 1) + 1, // 插入：插入后原始字符串索引不变，目标字符串索引前移1，操作次数+1
                    dp(i - 1, j) + 1, // 删除：删除后目标字符串索引不变，原始字符串索引前移1，操作次数+1
                    dp(i - 1, j - 1) + 1 // 替换：替换后索引都前移1，操作数+1
                )
            )
        }

        return memo.get(`${i}${j}`)
    }
}
