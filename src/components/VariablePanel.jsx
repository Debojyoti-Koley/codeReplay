import { getVariableState } from '../core/timeline'

export default function VariablePanel({ traces, currentStep }) {
    const state = getVariableState(traces, currentStep)
    const entries = Object.entries(state)

    return (
        <div className="panel">
            <div className="panel-header">Variables</div>
            {entries.length === 0
                ? <div className="panel-empty">No variables yet</div>
                : entries.map(([name, { value, changedAtStep }]) => (
                    <div
                        key={name}
                        className={`var-row ${changedAtStep === currentStep ? 'var-changed' : ''}`}
                    >
                        <span className="var-name">{name}</span>
                        <span className="var-value">{value}</span>
                        {changedAtStep === currentStep && <span className="var-badge">changed</span>}
                    </div>
                ))
            }
        </div>
    )
}