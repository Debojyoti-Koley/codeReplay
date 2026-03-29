import * as parser from '@babel/parser'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'
import * as t from '@babel/types'

const traverse = _traverse.default ?? _traverse
const generate = _generate.default ?? _generate

export function instrument(sourceCode) {
    let ast
    try {
        ast = parser.parse(sourceCode, {
            sourceType: 'script',
            plugins: ['optionalChaining', 'nullishCoalescingOperator'],
        })
    } catch (err) {
        return { code: null, error: formatParseError(err) }
    }

    try {
        traverse(ast, {
            VariableDeclaration(path) {
                if (path.parent && t.isForStatement(path.parent) && path.parent.init === path.node) return
                if (path.parent && (t.isForOfStatement(path.parent) || t.isForInStatement(path.parent))) return

                const declarations = path.node.declarations
                const line = path.node.loc?.start.line
                const traceCalls = declarations
                    .filter(d => d.id && t.isIdentifier(d.id) && !d.id.name.startsWith('_'))
                    .map(d =>
                        makeTraceCall({
                            type: t.stringLiteral('var'),
                            name: t.stringLiteral(d.id.name),
                            value: t.identifier(d.id.name),
                            line: t.numericLiteral(line || 0),
                        })
                    )
                if (traceCalls.length === 0) return
                traceCalls.forEach(call => path.insertAfter(t.expressionStatement(call)))
            },

            Function(path) {

                if (!t.isBlockStatement(path.node.body)) return

                const line = path.node.loc?.start.line

                // for named functions: function sum() {} → id.name = 'sum'
                // for arrow functions assigned to variable: const add = () => {} 
                // the name lives in the parent VariableDeclarator, not the function node
                let name = '(anonymous)'
                if (path.node.id) {
                    name = path.node.id.name
                } else if (
                    path.parentPath &&
                    t.isVariableDeclarator(path.parent) &&
                    t.isIdentifier(path.parent.id)
                ) {
                    name = path.parent.id.name
                }

                const argsObj = t.objectExpression(
                    path.node.params
                        .filter(p => t.isIdentifier(p))
                        .map(p => t.objectProperty(t.identifier(p.name), t.identifier(p.name), false, true))
                )
                const enterTrace = t.expressionStatement(
                    makeTraceCall({
                        type: t.stringLiteral('fn-enter'),
                        name: t.stringLiteral(name),
                        args: argsObj,
                        line: t.numericLiteral(line || 0),
                    })
                )
                path.get('body').unshiftContainer('body', enterTrace)

            },

            ReturnStatement(path) {
                const line = path.node.loc?.start.line
                const funcPath = path.getFunctionParent()
                let name = '(anonymous)'
                if (funcPath?.node?.id) {
                    name = funcPath.node.id.name
                } else if (
                    funcPath?.parentPath &&
                    t.isVariableDeclarator(funcPath.parent) &&
                    t.isIdentifier(funcPath.parent.id)
                ) {
                    name = funcPath.parent.id.name
                }
                const returnArg = path.node.argument

                if (!returnArg) {
                    path.insertBefore(
                        t.expressionStatement(
                            makeTraceCall({
                                type: t.stringLiteral('fn-exit'),
                                name: t.stringLiteral(name),
                                value: t.identifier('undefined'),
                                line: t.numericLiteral(line || 0),
                            })
                        )
                    )
                    return
                }

                const tempVar = path.scope.generateUidIdentifier('ret')
                path.insertBefore(
                    t.variableDeclaration('const', [t.variableDeclarator(tempVar, returnArg)])
                )
                path.insertBefore(
                    t.expressionStatement(
                        makeTraceCall({
                            type: t.stringLiteral('fn-exit'),
                            name: t.stringLiteral(name),
                            value: t.cloneNode(tempVar),
                            line: t.numericLiteral(line || 0),
                        })
                    )
                )
                path.get('argument').replaceWith(t.cloneNode(tempVar))
                path.skip()
            },
            AssignmentExpression(path) {
                const left = path.node.left
                if (!t.isIdentifier(left)) return
                const parent = path.parent
                const grandParent = path.parentPath?.parent

                if (t.isForStatement(grandParent)) return

                if (!t.isExpressionStatement(parent)) return

                const line = path.node.loc?.start.line
                const parentPath = path.parentPath

                parentPath.insertAfter(
                    t.expressionStatement(
                        makeTraceCall({
                            type: t.stringLiteral('assign'),
                            name: t.stringLiteral(left.name),
                            value: t.identifier(left.name),
                            line: t.numericLiteral(line || 0),
                        })
                    )
                )

                path.skip()
            },
        })
    } catch (e) {
        return { code: null, error: 'Instrumentation failed: ' + e.message }
    }

    const { code } = generate(ast, { retainLines: true })
    return { code, error: null }
}

function makeTraceCall(props) {
    return t.callExpression(
        t.identifier('__trace'),
        [
            t.objectExpression(
                Object.entries(props).map(([key, valueNode]) =>
                    t.objectProperty(t.identifier(key), valueNode)
                )
            ),
        ]
    )
}

function formatParseError(err) {
    const line = err.loc?.line
    const col = err.loc?.column
    const msg = err.message.replace(/\(\d+:\d+\)/, '').trim()
    if (line) return `Syntax error on line ${line}, column ${col}: ${msg}`
    return `Syntax error: ${msg}`
}