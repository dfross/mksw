import { mount } from '@vue/test-utils'
import Flashcard from './Flashcard.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Flashcard', () => {
  beforeEach(() => {
    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        }),
      },
      writable: true,
    })

    // Mock window.speechSynthesis
    Object.defineProperty(global.window, 'speechSynthesis', {
      value: {
        getVoices: vi.fn().mockReturnValue([]),
        cancel: vi.fn(),
        speak: vi.fn(),
      },
      writable: true,
    })
  })

  it('decreases currentIndex when previousWord is called and index > 0', async () => {
    const words = ['apple', 'banana', 'cherry']
    const wrapper = mount(Flashcard, {
      props: {
        words,
        set: 'fruits',
      },
    })

    // Advance to next word first
    await wrapper.vm.nextWord()
    expect(wrapper.vm.currentIndex).toBe(1)

    // Then call previousWord
    await wrapper.vm.previousWord()
    expect(wrapper.vm.currentIndex).toBe(0)
  })

  it('does not decrease currentIndex when previousWord is called and index is 0', async () => {
    const words = ['apple', 'banana', 'cherry']
    const wrapper = mount(Flashcard, {
      props: {
        words,
        set: 'fruits',
      },
    })

    // Ensure initial index is 0
    expect(wrapper.vm.currentIndex).toBe(0)

    // Call previousWord
    await wrapper.vm.previousWord()
    expect(wrapper.vm.currentIndex).toBe(0)
  })
})
