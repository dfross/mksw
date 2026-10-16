// Mock global Web Speech API and MediaDevices for tests
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    getVoices: () => [],
    cancel: () => {},
    speak: () => {},
    onvoiceschanged: null,
  },
  writable: true,
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop: () => {} }] }),
  },
  writable: true,
});
