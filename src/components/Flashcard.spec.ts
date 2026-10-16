import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Flashcard from './Flashcard.vue'

// Mocking icons
vi.mock('vue-material-design-icons/CheckboxMarkedCircle.vue', () => ({ default: { render: () => null } }))
vi.mock('vue-material-design-icons/AlphaXCircle.vue', () => ({ default: { render: () => null } }))
vi.mock('vue-material-design-icons/Microphone.vue', () => ({ default: { render: () => null } }))
vi.mock('vue-material-design-icons/ChevronLeft.vue', () => ({ default: { render: () => null } }))
vi.mock('vue-material-design-icons/Shuffle.vue', () => ({ default: { render: () => null } }))
vi.mock('vue-material-design-icons/ChevronRight.vue', () => ({ default: { render: () => null } }))
vi.mock('vue-material-design-icons/EarHearing.vue', () => ({ default: { render: () => null } }))

// Fix track mocking
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  configurable: true,
})

// Mute console.error for clean test output
console.error = vi.fn()
console.log = vi.fn()

describe('Flashcard.vue', () => {
  let mockSpeak: any
  let mockGetVoices: any
  let mockCancel: any

  beforeEach(() => {
    vi.resetAllMocks()

    mockSpeak = vi.fn()
    mockGetVoices = vi.fn(() => [])
    mockCancel = vi.fn()

    global.window.speechSynthesis = {
      speak: mockSpeak,
      getVoices: mockGetVoices,
      cancel: mockCancel,
      onvoiceschanged: null,
      pending: false,
      speaking: false,
      paused: false,
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as SpeechSynthesis

    class MockSpeechSynthesisUtterance {
      text: string;
      voice: any;
      volume: number;
      rate: number;
      pitch: number;
      lang: string;
      onend: null;
      onerror: any;
      onstart: null;
      onpause: null;
      onresume: null;
      onmark: null;
      onboundary: null;

      constructor(text: string) {
        this.text = text;
        this.voice = null;
        this.volume = 1;
        this.rate = 1;
        this.pitch = 1;
        this.lang = 'en-US';
        this.onend = null;
        this.onerror = null;
        this.onstart = null;
        this.onpause = null;
        this.onresume = null;
        this.onmark = null;
        this.onboundary = null;
      }
    }

    global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;
  })

  it('handles speech synthesis error correctly', async () => {
    const wrapper = mount(Flashcard, {
      props: {
        words: ['apple', 'banana'],
        set: '1'
      },
      global: {
        stubs: {
          'checkbox-marked-circle-icon': true,
          'alpha-x-circle-icon': true,
          'microphone-icon': true,
          'chevron-left-icon': true,
          'shuffle-icon': true,
          'chevron-right-icon': true,
          'ear-hearing-icon': true
        }
      }
    })

    // wait for onMounted
    await flushPromises()

    // Clear the error message that comes from getUserMedia mock failing if we didn't mock it perfectly,
    // we want to test speak error not mic error. We can just set feedback to empty string first manually.
    ;(wrapper.vm as any).feedback = ''
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    const speakButton = wrapper.findAll('button').find(b => b.attributes('aria-label') === 'Speak word')

    mockSpeak.mockImplementation((utterance: SpeechSynthesisUtterance) => {
      if (utterance.onerror) {
        utterance.onerror(new Event('error') as any)
      }
    })

    await speakButton?.trigger('click')

    await wrapper.vm.$nextTick()

    const feedbackElement = wrapper.find('[role="status"]')
    expect(feedbackElement.exists()).toBe(true)
    expect(feedbackElement.text()).toContain('An error occurred while trying to speak the word.')
    expect(console.error).toHaveBeenCalledWith('SpeechSynthesis error:', expect.any(Event))
  })
})
