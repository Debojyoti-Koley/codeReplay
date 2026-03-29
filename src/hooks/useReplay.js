import { useState, useCallback } from "react";
import { instrument } from "../core/instrumentor";
import { run } from "../core/runner";


const DEFAULT_CODE = `function sum(arr) {
  let total = 0
  for (let i = 0; i < arr.length; i++) {
    total += arr[i]
  }
  return total
}

sum([1, 2, 3, 4])`

export function useReplay() {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [traces, setTraces] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [limitWarning, setLimitWarning] = useState(null);


    const runCode = useCallback(() => {
        setError(null);
        setLimitWarning(null);
        setTraces([]);
        setCurrentStep(0);
        setIsPlaying(false);
        setIsRunning(true);

        const { code: instrumented, error: instrError } = instrument(code);

        if (instrError) {
            setError(instrError);
            setIsRunning(false);
            return;
        }

        const collected = [];

        run(
            instrumented,
            (event) => collected.push(event),
            () => {
                setTraces(collected);
                setCurrentStep(0);
                setIsRunning(false);
            },
            (errMsg) => {
                if (errMsg.includes('exceeded')) {
                    setLimitWarning(errMsg);
                    setTraces(collected);
                    setCurrentStep(0);
                } else {
                    setError(errMsg);
                }
                setIsRunning(false);
            }
        )
    }, [code]);

    const scrub = useCallback((step) => {
        setCurrentStep(Number(step));
    }, []);

    const stepForward = useCallback(() => {
        setCurrentStep(s => Math.min(s + 1, traces.length - 1));
    }, [traces.length]);

    const stepBack = useCallback(() => {
        setCurrentStep(s => Math.max(s - 1, 0));
    }, []);

    const reset = useCallback(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, []);

    return {
        code, setCode,
        traces, currentStep,
        isPlaying, setIsPlaying,
        error, limitWarning,
        isRunning,
        run: runCode,
        scrub,
        stepForward,
        stepBack,
        reset,
    }
}