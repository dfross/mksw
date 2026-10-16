import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Flashcard from './Flashcard.vue'

describe('Flashcard.vue', () => {
  let originalSpeechRecognition;
  let originalMediaDevices;

  beforeEach(() => {
    // Mock navigator.mediaDevices.getUserMedia
    originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      },
      writable: true
    });

    // Mock window.SpeechRecognition
    originalSpeechRecognition = window.SpeechRecognition;

    window.SpeechRecognition = function() {
      this.start = vi.fn().mockImplementation(() => {
        throw new Error('Microphone access denied');
      });
      this.abort = vi.fn();
      this.stop = vi.fn();
    };

    // Mock window.speechSynthesis
    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      cancel: vi.fn(),
    };
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      writable: true
    });
    window.SpeechRecognition = originalSpeechRecognition;
    vi.clearAllMocks();
  });

  it('handles microphone access failure during listenForWord', async () => {
    const wrapper = mount(Flashcard, {
      props: {
        words: ['apple', 'banana'],
        set: 'fruit'
      }
    });

    // Wait for onMounted to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    // Try listening for word
    await wrapper.vm.listenForWord();

    // Verify feedback is updated correctly
    expect(wrapper.vm.feedback).toBe('Unable to access the microphone. Please check your microphone settings and try again.');
  });
})
