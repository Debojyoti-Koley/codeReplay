import Editor from './components/Editor';
import Timeline from './components/Timeline';
import VariablePanel from './components/VariablePanel';
import CallStack from './components/CallStack';
import ErrorPanel from './components/ErrorPanel';
import { useReplay } from './hooks/useReplay';
import './App.css';

export default function App() {
  const {
    code, setCode,
    traces, currentStep, isRunning,
    isPlaying, error,
    run, step, play, pause, scrub, reset, limitWarning,
    setIsPlaying, stepForward, stepBack,
  } = useReplay();
  console.log('TRACES:', traces);
  return (
    <div className='app'>
      <header className='header'>
        <span className='logo'>CodeReplay</span>
        <span className="tagline">Rewind your JavaScript like a video</span>
        <button className="run-btn" onClick={run}>{isRunning ? '⏳ Running...' : '▶ Run & Record'}</button>
      </header>

      <div className='main'>
        <div className='editor-pane'>
          <Editor code={code} onChange={setCode} currentLine={traces[currentStep]?.line} />
          {error && <ErrorPanel error={error} />}
          {limitWarning && <ErrorPanel error={limitWarning} />}
        </div>

        <div className='right-pane'>
          <VariablePanel traces={traces} currentStep={currentStep} />
          <CallStack traces={traces} currentStep={currentStep} />
        </div>

        <div className='bottom'>
          <Timeline
            total={traces.length}
            currentStep={currentStep}
            isPlaying={isPlaying}
            onScrub={scrub}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onStepForward={stepForward}
            onStepBack={stepBack}
            onStep={step}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}