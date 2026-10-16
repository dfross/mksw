import { mount } from '@vue/test-utils'
import Flashcard from './Flashcard.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Flashcard.vue', () => {
  beforeEach(() => {
    // Mock navigator and window properties safely for JSDOM
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      },
      configurable: true
    })

    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'test-agent',
      configurable: true
    })

    global.window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      cancel: vi.fn(),
      speak: vi.fn(),
    }

    class MockSpeechRecognition {
      start = vi.fn()
      stop = vi.fn()
      abort = vi.fn()
    }
    global.window.SpeechRecognition = MockSpeechRecognition
  })

  describe('handleKeydown', () => {
    it('handles various key combinations correctly', async () => {
      const wrapper = mount(Flashcard, {
        props: {
          words: ['apple', 'banana', 'cherry', 'date'],
          set: 'test-set'
        }
      })

      // Wait for component to mount and event listeners to attach
      await wrapper.vm.$nextTick()

      // Initial state
      expect(wrapper.vm.currentIndex).toBe(0)

      // Test 1: ArrowRight goes to next word
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(1)

      // Test 2: Space code goes to next word
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(2)

      // Test 3: ArrowLeft goes to previous word
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(1)

      // Test 4: 'r' goes to random word
      // Mock Math.random to return a specific index
      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // Will select index 3 (last word)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(3)
      mathRandomSpy.mockRestore()

      // Test 5: 'R' goes to random word
      const mathRandomSpy2 = vi.spyOn(Math, 'random').mockReturnValue(0) // Will select index 0
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'R' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(0)
      mathRandomSpy2.mockRestore()

      // Test 6: Unhandled key does nothing
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(0)

      // Test 7: Space KEY instead of CODE (edge case testing what's not implemented but could be tricky)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Unidentified' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(0) // Should not change as code isn't 'Space'
    })

    it('does not advance past the end with ArrowRight or Space', async () => {
      const wrapper = mount(Flashcard, {
        props: {
          words: ['apple', 'banana'],
          set: 'test-set'
        }
      })
      await wrapper.vm.$nextTick()

      // Move to end
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(1)

      // Try to move past end
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(1)

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(1)
    })

    it('does not advance past the beginning with ArrowLeft', async () => {
      const wrapper = mount(Flashcard, {
        props: {
          words: ['apple', 'banana'],
          set: 'test-set'
        }
      })
      await wrapper.vm.$nextTick()

      // Current index is 0
      expect(wrapper.vm.currentIndex).toBe(0)

      // Try to move past beginning
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentIndex).toBe(0)
    })
  })
})
