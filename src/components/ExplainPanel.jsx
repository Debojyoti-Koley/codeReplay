import { useState } from 'react'
import { explainStep } from '../core/explainer'

export default function ExplainPanel({ traces, currentStep, code }) {
    const [explanation, setExplanation] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    async function handleExplain() {
        if (traces.length === 0) return
        setLoading(true)
        setError(null)
        setExplanation('')
        try {
            const text = await explainStep(traces, currentStep, code)
            setExplanation(text)
        } catch (e) {
            setError('Could not connect to Claude. Check your API key.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="explain-panel">
            <button
                className="explain-btn"
                onClick={handleExplain}
                disabled={loading || traces.length === 0}
            >
                {loading ? '⏳ Thinking...' : '✦ Explain this step'}
            </button>
            {error && <div className="explain-error">{error}</div>}
            {explanation && (
                <div className="explain-text">{explanation}</div>
            )}
        </div>
    )
}