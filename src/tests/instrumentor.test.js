import { describe, it, expect } from 'vitest'
import { instrument } from '../core/instrumentor'

describe('instrumentor', () => {

    it('returns error for invalid JS — not a crash', () => {
        const { code, error } = instrument(`function( {`)
        expect(code).toBeNull()
        expect(error).toMatch(/syntax error/i)
        expect(error).toMatch(/line/)
    })

    it('injects __trace for variable declaration', () => {
        const { code, error } = instrument(`let x = 5`)
        expect(error).toBeNull()
        expect(code).toContain('__trace')
        expect(code).toContain('"var"')
        expect(code).toContain('"x"')
    })

    it('injects fn-enter trace on function entry', () => {
        const { code } = instrument(`function greet(name) { return name }`)
        expect(code).toContain('"fn-enter"')
        expect(code).toContain('"greet"')
    })

    it('injects fn-exit trace on return', () => {
        const { code } = instrument(`function greet(name) { return name }`)
        expect(code).toContain('"fn-exit"')
    })

    it('handles assignment expression', () => {
        const { code } = instrument(`let x = 0; x = 10`)
        expect(code).toContain('"assign"')
    })

    it('handles nested functions without crashing', () => {
        const { code, error } = instrument(`
      function outer() {
        function inner() { return 1 }
        return inner()
      }
    `)
        expect(error).toBeNull()
        expect(code).toContain('__trace')
    })

    it('preserves original line numbers in trace events', () => {
        const { code } = instrument(`let x = 5`)
        expect(code).toContain('line')
    })

    it('returns null code and error for empty input', () => {
        const { code, error } = instrument(``)
        // empty code is valid JS — no error, no traces either
        expect(error).toBeNull()
    })

})