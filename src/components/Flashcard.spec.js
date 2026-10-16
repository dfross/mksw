import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Flashcard from './Flashcard.vue'

// Mocking dependencies to avoid warnings in test output
vi.mock('vue-material-design-icons/Shuffle.vue', () => ({ default: { template: '<span>Shuffle</span>' } }))
vi.mock('vue-material-design-icons/ChevronRight.vue', () => ({ default: { template: '<span>ChevronRight</span>' } }))
vi.mock('vue-material-design-icons/ChevronLeft.vue', () => ({ default: { template: '<span>ChevronLeft</span>' } }))
vi.mock('vue-material-design-icons/EarHearing.vue', () => ({ default: { template: '<span class="ear-hearing-icon">EarHearing</span>' } }))
vi.mock('vue-material-design-icons/Microphone.vue', () => ({ default: { template: '<span>Microphone</span>' } }))
vi.mock('vue-material-design-icons/CheckboxMarkedCircle.vue', () => ({ default: { template: '<span>CheckboxMarkedCircle</span>' } }))
vi.mock('vue-material-design-icons/AlphaXCircle.vue', () => ({ default: { template: '<span>AlphaXCircle</span>' } }))

describe('Flashcard.vue', () => {
  let originalSpeechSynthesis;
  let originalMediaDevices;

  beforeEach(() => {
    originalSpeechSynthesis = window.speechSynthesis;
    originalMediaDevices = navigator.mediaDevices;

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Mocked error')),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: originalSpeechSynthesis,
      configurable: true,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('displays correct feedback when speech synthesis is not supported', async () => {
    // We want speech synthesis to be unsupported for testing.
    // However, onMounted hook accesses window.speechSynthesis.getVoices() without checking if it exists.
    // Let's stub window.speechSynthesis with mock functions just so onMounted doesn't throw.
    // But since the actual condition we want to hit is `!speechSupported.value`, which is evaluated as `'speechSynthesis' in window`, we have to be careful.
    // Wait, the component code is:
    // speechSupported.value = 'speechSynthesis' in window
    // We can define window.speechSynthesis, but make speechSupported false by removing it later, but that's evaluated in onMounted.
    // Actually, to make 'speechSynthesis' in window evaluate to false, we have to delete it.
    // If it's deleted, then loadVoices() will crash because it does `voices = window.speechSynthesis.getVoices()`.
    // So we need to mock window.speechSynthesis so it has getVoices but make 'speechSynthesis' in window false? Impossible.
    // Let's mock window.speechSynthesis.getVoices instead so it doesn't crash if we provide it. Wait, if we provide it, speechSupported will be true!
    // The issue says: "Missing edge case for unsupported speech synthesis ... Can easily be tested by mocking window.speechSynthesis to be undefined and asserting the feedback message."
    // Let's look at Flashcard.vue again. If we can't change Flashcard.vue, we must provide a mock that returns undefined or we can fix Flashcard.vue.
    // We *can* fix Flashcard.vue to be more robust, or we can just mock it as undefined.
    // Let's modify the test to mock window.speechSynthesis as undefined, but we'll also mock console.error if needed. Actually it's throwing an error which causes Vitest to complain about Unhandled Rejection.
    // Let's fix Flashcard.vue's unhandled exception when window.speechSynthesis is undefined.

    // Force speech synthesis to be undefined (jsdom might not have it, but just to be sure)
    delete window.speechSynthesis;

    const wrapper = mount(Flashcard, {
      props: {
        words: ['apple', 'banana', 'cherry'],
        set: 'fruits'
      }
    });

    // The component sets speechSupported to true/false in onMounted based on 'speechSynthesis' in window.
    // Ensure speechSupported evaluates to false. It will since window.speechSynthesis is undefined.
    // We should wait for next tick for onMounted to finish.
    await wrapper.vm.$nextTick();

    // Trigger speakWord
    // The button might be disabled, so we can just call the method or try to trigger click.
    // If it's disabled, trigger('click') won't work standardly, so we'll call the method on vm directly,
    // which simulates what happens if someone somehow triggers it or if we test the function directly.
    // The issue describes: "Missing edge case for unsupported speech synthesis. Can easily be tested by mocking window.speechSynthesis to be undefined and asserting the feedback message."

    wrapper.vm.speakWord();

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.feedback).toBe('Speech synthesis is not supported in your browser.');
  });
});
