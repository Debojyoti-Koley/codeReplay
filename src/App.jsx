import { useState } from 'react'
import Editor from './components/Editor'
import Timeline from './components/Timeline'
import VariablePanel from './components/VariablePanel'
import CallStack from './components/CallStack'
import ErrorPanel from './components/ErrorPanel'
import ExplainPanel from './components/ExplainPanel'
import { useReplay } from './hooks/useReplay'
import { EXAMPLES } from './examples'
import './App.css'

export default function App() {
  const {
    code, setCode,
    traces, currentStep,
    isPlaying, setIsPlaying,
    error, limitWarning,
    isRunning,
    run, scrub,
    stepForward, stepBack, reset,
  } = useReplay()

  const [selectedLang, setSelectedLang] = useState('javascript')

  function loadExample(e) {
    const ex = EXAMPLES.find(ex => ex.label === e.target.value)
    if (ex) setCode(ex.code)
    e.target.value = ''
  }

  return (
    <div className="app">
      <header className="header">
        <span className="logo">CodeReplay</span>
        <span className="tagline">Rewind your JavaScript like a video</span>

        <select className="example-picker" onChange={loadExample} defaultValue="">
          <option value="" disabled>Load example...</option>
          {EXAMPLES.map(ex => (
            <option key={ex.label} value={ex.label}>{ex.label}</option>
          ))}
        </select>

        <select
          className="lang-selector"
          value={selectedLang}
          onChange={e => setSelectedLang(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript" disabled>TypeScript (coming soon)</option>
          <option value="python" disabled>Python (coming soon)</option>
        </select>

        <button
          className="run-btn"
          onClick={run}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : '▶ Run & Record'}
        </button>
      </header>

      <div className="main">
        <div className="editor-pane">
          <Editor
            code={code}
            onChange={setCode}
            currentLine={traces[currentStep]?.line}
          />
          {error && <ErrorPanel error={error} />}
          {limitWarning && <ErrorPanel error={limitWarning} />}
        </div>

        <div className="right-pane">
          <VariablePanel traces={traces} currentStep={currentStep} />
          <CallStack traces={traces} currentStep={currentStep} />
          <ExplainPanel traces={traces} currentStep={currentStep} code={code} />
        </div>
      </div>

      <div className="bottom">
        <div className="keyboard-hint">
          ← → arrow keys to step &nbsp;·&nbsp; space to play/pause
        </div>
        <Timeline
          traces={traces}
          total={traces.length}
          currentStep={currentStep}
          isPlaying={isPlaying}
          onScrub={scrub}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onStepForward={stepForward}
          onStepBack={stepBack}
          onReset={reset}
        />
      </div>
    </div>
  )
}