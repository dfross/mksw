import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Flashcard from '../Flashcard.vue'

describe('Flashcard.vue', () => {
  const words = ['apple', 'banana', 'cherry', 'date']
  const set = 'fruits'

  beforeEach(() => {
    vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('selects a random word when the random button is clicked', async () => {
    // Mock for SpeechSynthesis and media devices which are used in onMounted
    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      cancel: vi.fn(),
      speak: vi.fn(),
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('No mock provided')),
      },
      configurable: true,
    })

    const wrapper = mount(Flashcard, {
      props: {
        words,
        set
      }
    })

    // Initial word should be 'apple' (index 0)
    expect(wrapper.find('h2').text()).toBe('apple')

    // Mock Math.random to return 0.5 (which should map to index 2: 'cherry')
    // Math.floor(0.5 * 4) = 2
    Math.random.mockReturnValue(0.5)

    // Find the random button and click it
    const randomButton = wrapper.find('button[aria-label="Random word"]')
    await randomButton.trigger('click')

    // Expect the displayed word to be 'cherry'
    expect(wrapper.find('h2').text()).toBe('cherry')

    // Test with another value to be sure
    // Math.floor(0.75 * 4) = 3 ('date')
    Math.random.mockReturnValue(0.75)
    await randomButton.trigger('click')

    expect(wrapper.find('h2').text()).toBe('date')
  })
})
