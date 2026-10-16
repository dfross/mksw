import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Flashcard from '../Flashcard.vue'

// Mock icons
vi.mock('vue-material-design-icons/Shuffle.vue', () => ({ default: { template: '<span>Icon</span>' } }))
vi.mock('vue-material-design-icons/ChevronRight.vue', () => ({ default: { template: '<span>Icon</span>' } }))
vi.mock('vue-material-design-icons/ChevronLeft.vue', () => ({ default: { template: '<span>Icon</span>' } }))
vi.mock('vue-material-design-icons/EarHearing.vue', () => ({ default: { template: '<span>Icon</span>' } }))
vi.mock('vue-material-design-icons/Microphone.vue', () => ({ default: { template: '<span>Icon</span>' } }))
vi.mock('vue-material-design-icons/CheckboxMarkedCircle.vue', () => ({ default: { template: '<span>Icon</span>' } }))
vi.mock('vue-material-design-icons/AlphaXCircle.vue', () => ({ default: { template: '<span>Icon</span>' } }))

describe('Flashcard', () => {
  it('nextWord function increments currentIndex when not at the end', async () => {
    const wrapper = mount(Flashcard, {
      props: {
        words: ['apple', 'banana', 'cherry'],
        set: 'fruits'
      }
    })

    // Initially at index 0 (apple)
    expect(wrapper.text()).toContain('apple')

    // Find Next button and click it
    const nextButton = wrapper.findAll('button').find(b => b.text().includes('Next'))
    await nextButton.trigger('click')

    // Should now be at index 1 (banana)
    expect(wrapper.text()).toContain('banana')
  })

  it('nextWord function does not increment currentIndex when at the end', async () => {
    const wrapper = mount(Flashcard, {
      props: {
        words: ['apple', 'banana'],
        set: 'fruits'
      }
    })

    const nextButton = wrapper.findAll('button').find(b => b.text().includes('Next'))

    // Move to banana
    await nextButton.trigger('click')
    expect(wrapper.text()).toContain('banana')

    // Try to move past end
    await nextButton.trigger('click')

    // Should still be banana
    expect(wrapper.text()).toContain('banana')
  })
})
