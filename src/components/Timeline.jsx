import { useEffect, useRef } from 'react'
import { getStepDescription } from '../core/timeline'

export default function Timeline({
  traces, total, currentStep,
  isPlaying, onScrub,
  onPlay, onPause,
  onStepForward, onStepBack, onReset,
}) {
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onStepForward()
      }, 350)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, onStepForward])

  useEffect(() => {
    if (currentStep >= total - 1 && isPlaying) {
      onPause()
    }
  }, [currentStep, total, isPlaying, onPause])

  if (total === 0) {
    return (
      <div className="timeline-empty">
        Click "Run & Record" to start
      </div>
    )
  }

  const description = getStepDescription(traces, currentStep)
  const progress = total > 1 ? (currentStep / (total - 1)) * 100 : 0

  return (
    <div className="timeline">
      <div className="timeline-description">{description}</div>

      <div className="timeline-scrubber">
        <span className="timeline-step">step {currentStep + 1} / {total}</span>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={currentStep}
          onChange={e => onScrub(e.target.value)}
          className="scrubber"
        />
        <span className="timeline-progress">{Math.round(progress)}%</span>
      </div>

      <div className="timeline-controls">
        <button className="ctrl-btn" onClick={onReset} title="Go to start">⏮</button>
        <button className="ctrl-btn" onClick={onStepBack} title="Previous step">‹ Prev</button>
        {isPlaying
          ? <button className="ctrl-btn primary" onClick={onPause}>⏸ Pause</button>
          : <button className="ctrl-btn primary" onClick={onPlay}>▶ Play</button>
        }
        <button className="ctrl-btn" onClick={onStepForward} title="Next step">Next ›</button>
      </div>
    </div>
  )
}