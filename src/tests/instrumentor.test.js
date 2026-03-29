import { describe, it, expect } from 'vitest'
import { instrument } from '../core/instrumentor'
import {
  getVariableState,
  getCallStack,
  getActiveLine,
  getStepDescription,
} from '../core/timeline'

describe('instrumentor — parse errors', () => {

  it('returns error for invalid JS, never crashes', () => {
    const { code, error } = instrument(`function( {`)
    expect(code).toBeNull()
    expect(error).toMatch(/syntax error/i)
    expect(error).toMatch(/line/i)
  })

  it('returns error with line number', () => {
    const { code, error } = instrument(`\n\nfunction ({`)
    expect(code).toBeNull()
    expect(error).toContain('line')
  })

  it('handles empty string without error', () => {
    const { code, error } = instrument(``)
    expect(error).toBeNull()
  })

})

describe('instrumentor — variable tracing', () => {

  it('injects __trace for let declaration', () => {
    const { code, error } = instrument(`let x = 5`)
    expect(error).toBeNull()
    expect(code).toContain('__trace')
    expect(code).toContain('"var"')
    expect(code).toContain('"x"')
  })

  it('injects __trace for const declaration', () => {
    const { code, error } = instrument(`const name = "hello"`)
    expect(error).toBeNull()
    expect(code).toContain('"name"')
  })

  it('does not trace internal _ variables', () => {
    const { code } = instrument(`function f() { return 1 }`)
    const traceMatches = (code.match(/"_ret"/g) || [])
    expect(traceMatches.length).toBe(0)
  })

  it('does not crash on for loop', () => {
    const { code, error } = instrument(`
      for (let i = 0; i < 3; i++) {
        let x = i
      }
    `)
    expect(error).toBeNull()
    expect(code).toContain('__trace')
  })

})

describe('instrumentor — function tracing', () => {

  it('injects fn-enter on function entry', () => {
    const { code } = instrument(`function greet(name) { return name }`)
    expect(code).toContain('"fn-enter"')
    expect(code).toContain('"greet"')
  })

  it('injects fn-exit on return', () => {
    const { code } = instrument(`function greet(name) { return name }`)
    expect(code).toContain('"fn-exit"')
  })

  it('handles function with no return value', () => {
    const { code, error } = instrument(`function log(x) { let y = x }`)
    expect(error).toBeNull()
    expect(code).toContain('"fn-enter"')
  })

  it('handles nested functions', () => {
    const { code, error } = instrument(`
      function outer() {
        function inner() { return 1 }
        return inner()
      }
    `)
    expect(error).toBeNull()
    expect(code).toContain('"outer"')
    expect(code).toContain('"inner"')
  })

  it('handles anonymous arrow functions', () => {
    const { code, error } = instrument(`
      const add = (a, b) => a + b
      add(1, 2)
    `)
    expect(error).toBeNull()
  })

})

describe('timeline — getVariableState', () => {

  it('returns empty object when no traces', () => {
    expect(getVariableState([], 0)).toEqual({})
  })

  it('captures variable value at step', () => {
    const traces = [
      { type: 'var', name: 'x', value: '5', line: 1 },
    ]
    const state = getVariableState(traces, 0)
    expect(state.x.value).toBe('5')
  })

  it('reflects latest value when variable changes', () => {
    const traces = [
      { type: 'var',    name: 'total', value: '0',  line: 1 },
      { type: 'assign', name: 'total', value: '10', line: 2 },
    ]
    const state = getVariableState(traces, 1)
    expect(state.total.value).toBe('10')
  })

  it('only shows state up to current step', () => {
    const traces = [
      { type: 'var',    name: 'total', value: '0',  line: 1 },
      { type: 'assign', name: 'total', value: '10', line: 2 },
    ]
    const state = getVariableState(traces, 0)
    expect(state.total.value).toBe('0')
  })

  it('marks changedAtStep correctly', () => {
    const traces = [
      { type: 'var', name: 'x', value: '1', line: 1 },
      { type: 'assign', name: 'x', value: '2', line: 2 },
    ]
    const state = getVariableState(traces, 1)
    expect(state.x.changedAtStep).toBe(1)
  })

})

describe('timeline — getCallStack', () => {

  it('returns empty array when no traces', () => {
    expect(getCallStack([], 0)).toEqual([])
  })

  it('pushes frame on fn-enter', () => {
    const traces = [
      { type: 'fn-enter', name: 'sum', args: {}, line: 1 },
    ]
    const stack = getCallStack(traces, 0)
    expect(stack.length).toBe(1)
    expect(stack[0].name).toBe('sum')
  })

  it('pops frame on fn-exit', () => {
    const traces = [
      { type: 'fn-enter', name: 'sum', args: {}, line: 1 },
      { type: 'fn-exit',  name: 'sum', value: '10', line: 5 },
    ]
    const stack = getCallStack(traces, 1)
    expect(stack.length).toBe(0)
  })

  it('handles nested calls correctly', () => {
    const traces = [
      { type: 'fn-enter', name: 'outer', args: {}, line: 1 },
      { type: 'fn-enter', name: 'inner', args: {}, line: 2 },
    ]
    const stack = getCallStack(traces, 1)
    expect(stack.length).toBe(2)
    expect(stack[1].name).toBe('inner')
  })

})

describe('timeline — getStepDescription', () => {

  it('returns empty string for empty traces', () => {
    expect(getStepDescription([], 0)).toBe('')
  })

  it('describes fn-enter correctly', () => {
    const traces = [{ type: 'fn-enter', name: 'sum', line: 1 }]
    expect(getStepDescription(traces, 0)).toBe('Calling sum()')
  })

  it('describes fn-exit correctly', () => {
    const traces = [{ type: 'fn-exit', name: 'sum', value: '10', line: 5 }]
    expect(getStepDescription(traces, 0)).toBe('sum() returned 10')
  })

  it('describes var declaration correctly', () => {
    const traces = [{ type: 'var', name: 'total', value: '0', line: 2 }]
    expect(getStepDescription(traces, 0)).toBe('let total = 0')
  })

  it('describes assignment correctly', () => {
    const traces = [{ type: 'assign', name: 'total', value: '10', line: 3 }]
    expect(getStepDescription(traces, 0)).toBe('total = 10')
  })

})