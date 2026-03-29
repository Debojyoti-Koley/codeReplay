import { getCallStack } from '../core/timeline'

export default function CallStack({ traces, currentStep }) {
    const stack = getCallStack(traces, currentStep)

    return (
        <div className="panel">
            <div className="panel-header">Call Stack</div>
            {stack.length === 0
                ? <div className="panel-empty">No active calls</div>
                : [...stack].reverse().map((frame, i) => (
                    <div key={i} className={`stack-frame ${i === 0 ? 'stack-top' : ''}`}>
                        <span className="stack-name">{frame.name}()</span>
                        <span className="stack-line">line {frame.line}</span>
                    </div>
                ))
            }
        </div>
    )
}