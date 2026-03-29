export async function explainStep(traces, currentStep, code) {
    const event = traces[currentStep]
    if (!event) return 'No step selected.'

    const context = traces
        .slice(0, currentStep + 1)
        .map((e, i) => {
            if (e.type === 'fn-enter') return `Step ${i + 1}: Called ${e.name}() at line ${e.line}`
            if (e.type === 'fn-exit') return `Step ${i + 1}: ${e.name}() returned ${e.value}`
            if (e.type === 'var') return `Step ${i + 1}: Variable '${e.name}' was set to ${e.value} at line ${e.line}`
            if (e.type === 'assign') return `Step ${i + 1}: Variable '${e.name}' was updated to ${e.value} at line ${e.line}`
            return ''
        })
        .filter(Boolean)
        .join('\n')

    const prompt = `You are explaining JavaScript code execution to a developer learning how code runs step by step.

Here is the original code:
\`\`\`js
${code}
\`\`\`

Here is the execution trace so far:
${context}

The current step (step ${currentStep + 1}) is:
- Type: ${event.type}
- ${event.name ? `Name: ${event.name}` : ''}
- ${event.value !== undefined ? `Value: ${event.value}` : ''}
- Line: ${event.line}

In 2-3 sentences, explain in plain English what is happening at this exact step and why. Be specific about the values. Do not repeat the trace — explain the meaning.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }],
        }),
    })

    const data = await response.json()
    return data.content?.[0]?.text || 'Could not generate explanation.'
}