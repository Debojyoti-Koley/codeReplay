export function getVariableState(traces, upToStep) {
    const state = {}

    for (let i = 0; i <= upToStep; i++) {
        const event = traces[i]
        if (!event) continue

        if (event.type === 'var' || event.type === 'assign') {
            state[event.name] = {
                value: event.value,
                changedAtStep: i,
            }
        }
    }

    return state
}

export function getCallStack(traces, upToStep) {
    const stack = []

    for (let i = 0; i <= upToStep; i++) {
        const event = traces[i]
        if (!event) continue

        if (event.type === 'fn-enter') {
            stack.push({
                name: event.name,
                args: event.args || {},
                line: event.line,
                enteredAtStep: i,
            })
        }

        if (event.type === 'fn-exit') {
            stack.pop()
        }
    }

    return stack
}

export function getActiveLine(traces, step) {
    const event = traces[step]
    return event?.line || null
}

export function getStepDescription(traces, step) {
    if (!traces || traces.length === 0) return ''
    const event = traces[step]
    if (!event) return ''

    switch (event.type) {
        case 'fn-enter':
            return `Calling ${event.name}()`
        case 'fn-exit':
            return `${event.name}() returned ${event.value}`
        case 'var':
            return `let ${event.name} = ${event.value}`
        case 'assign':
            return `${event.name} = ${event.value}`
        default:
            return ''
    }
}