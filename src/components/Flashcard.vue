<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import ShuffleIcon from 'vue-material-design-icons/Shuffle.vue'
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import ChevronLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import EarHearingIcon from 'vue-material-design-icons/EarHearing.vue'
import MicrophoneIcon from 'vue-material-design-icons/Microphone.vue'
import CheckboxMarkedCircleIcon from 'vue-material-design-icons/CheckboxMarkedCircle.vue'
import AlphaXCircleIcon from 'vue-material-design-icons/AlphaXCircle.vue'

const props = defineProps({
	words: {
		type: Array,
		required: true,
	},
	set: {
		type: String,
		required: true,
	},
})

const emit = defineEmits(['wordChanged'])
const currentIndex = ref(0)
const isSpeaking = ref(false)
const isListening = ref(false)
const speechSupported = ref(false)
const recognitionSupported = ref(false)
const microphoneAvailable = ref(false)
const feedback = ref('')

let recognition
let microphoneStream = null
let cleanupInterval
let listenTimeout

const checkMicrophonePermissions = async () => {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		microphoneAvailable.value = true
		stream.getTracks().forEach((track) => track.stop()) // Stop tracks immediately after checking.
	} catch (err) {
		console.error('Microphone permissions not granted:', err)
		microphoneAvailable.value = false
		feedback.value = 'Microphone access is required for voice recognition.'
	}
}

const initializeSpeechRecognition = () => {
	if (recognitionSupported.value) {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		recognition = new SpeechRecognition()
		recognition.continuous = false
		recognition.interimResults = false

		recognition.onresult = (event) => {
			console.log('Speech recognition result received')
			const last = event.results.length - 1
			const result = event.results[last][0].transcript.trim().toLowerCase()
			const currentWord = props.words[currentIndex.value].toLowerCase()

			if (result === currentWord) {
				feedback.value = 'Correct! Well done!'
			} else {
				feedback.value = `Not quite. The word is "${currentWord}". You said "${result}".`
			}
			isListening.value = false
			stopMicrophone()
		}

		recognition.onerror = (event) => {
			console.error('Speech recognition error:', event.error)
			isListening.value = false

			switch (event.error) {
				case 'no-speech':
					feedback.value = 'No speech detected. Please try again.'
					break
				case 'audio-capture':
					feedback.value = 'Please ensure your microphone is not blocked and try again.'
					break
				case 'not-allowed':
					feedback.value = 'Microphone access has been denied. Check your browser settings.'
					break
				case 'service-not-allowed':
					feedback.value = 'The microphone service is not allowed. Check your permissions.'
					break
				default:
					feedback.value = "Sorry, I couldn't hear you. Please try again."
			}
			stopMicrophone()
		}

		recognition.onend = () => {
			console.log('Speech recognition ended')
			isListening.value = false
			stopMicrophone()
		}
	} else {
		feedback.value = 'Speech recognition is not supported in your browser.'
	}
}

const forceStopAudio = () => {
	console.log('Force stopping all audio')

	// Stop all audio contexts
	if (window.AudioContext || window.webkitAudioContext) {
		const AudioContext = window.AudioContext || window.webkitAudioContext
		const audioContexts = []
		while (AudioContext.getContexts && AudioContext.getContexts().length) {
			audioContexts.push(AudioContext.getContexts()[0])
		}
		audioContexts.forEach((ctx) => {
			if (ctx.state !== 'closed') {
				ctx.close()
			}
		})
	}

	// Stop all audio tracks
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				stream.getTracks().forEach((track) => track.stop())
			})
			.catch((err) => console.error('Error accessing media devices.', err))
	}

	// Stop speech recognition if it's running
	if (recognition) {
		recognition.abort()
	}

	// Reset state
	isListening.value = false
	microphoneStream = null
}

const cleanup = () => {
	console.log('Cleanup function called')
	forceStopAudio()
	if (listenTimeout) {
		clearTimeout(listenTimeout)
	}
}

const handleVisibilityChange = () => {
	if (document.hidden || document.visibilityState === 'hidden') {
		console.log('Page visibility changed to hidden')
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
		if (isIOS) {
			// iOS-specific cleanup
			forceStopAudio()
		} else {
			// General cleanup for other platforms
			cleanup()
		}
	}
}

const handleWindowBlur = () => {
	console.log('Window blur event triggered')
	cleanup()
}

const handlePageHide = () => {
	console.log('Page hide event triggered')
	cleanup()
	if (recognition) {
		recognition.stop()
	}
}

const handleBeforeUnload = () => {
	console.log('Before unload event triggered')
	forceStopAudio()
}

onMounted(async () => {
	speechSupported.value = 'speechSynthesis' in window
	recognitionSupported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

	checkMicrophonePermissions() // Check permissions

	initializeSpeechRecognition()

	window.addEventListener('keydown', handleKeydown)
	window.addEventListener('setFlashcardWord', handleSetFlashcardWord)
	document.addEventListener('visibilitychange', handleVisibilityChange)
	window.addEventListener('blur', handleWindowBlur)
	window.addEventListener('pagehide', handlePageHide)
	window.addEventListener('beforeunload', handleBeforeUnload)

	cleanupInterval = setInterval(() => {
		if (!document.hasFocus()) {
			cleanup()
		}
	}, 1000) // Check every second
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
	window.removeEventListener('setFlashcardWord', handleSetFlashcardWord)
	document.removeEventListener('visibilitychange', handleVisibilityChange)
	window.removeEventListener('blur', handleWindowBlur)
	window.removeEventListener('pagehide', handlePageHide)
	window.removeEventListener('beforeunload', handleBeforeUnload)
	clearInterval(cleanupInterval)
	cleanup()
})

watch(currentIndex, (newIndex) => {
	feedback.value = ''
	emit('wordChanged', newIndex)
	stopMicrophone()
})

const nextWord = () => {
	if (currentIndex.value < props.words.length - 1) {
		currentIndex.value++
	}
}

const previousWord = () => {
	if (currentIndex.value > 0) {
		currentIndex.value--
	}
}

const selectRandomWord = () => {
	const randomIndex = Math.floor(Math.random() * props.words.length)
	currentIndex.value = randomIndex
}

const handleKeydown = (event) => {
	if (event.key === 'ArrowRight' || event.code === 'Space') {
		nextWord()
	} else if (event.key === 'ArrowLeft') {
		previousWord()
	} else if (event.key === 'r' || event.key === 'R') {
		selectRandomWord()
	}
}

const handleSetFlashcardWord = (event) => {
	const index = event.detail.index
	if (index >= 0 && index < props.words.length) {
		currentIndex.value = index
	}
}

const speakWord = () => {
	if (!speechSupported.value) {
		feedback.value = 'Speech synthesis is not supported in your browser.'
		return
	}

	const wordToSpeak = props.words[currentIndex.value].trim()

	if (isSpeaking.value) {
		window.speechSynthesis.cancel()
	}

	isSpeaking.value = true
	const utterance = new SpeechSynthesisUtterance(wordToSpeak)

	utterance.rate = 0.8 // Slightly slower rate for clearer pronunciation
	utterance.pitch = 1 // Normal pitch

	if (wordToSpeak.length === 1 && wordToSpeak.toLowerCase() === 'i') {
		utterance.text = `- ${wordToSpeak}`
	} else {
		utterance.text = wordToSpeak
	}

	utterance.onend = () => {
		isSpeaking.value = false
	}

	utterance.onerror = (event) => {
		console.error('SpeechSynthesis error:', event)
		isSpeaking.value = false
		feedback.value = 'An error occurred while trying to speak the word.'
	}

	window.speechSynthesis.speak(utterance)
}

const stopMicrophone = () => {
	console.log('Stopping microphone')
	if (microphoneStream) {
		microphoneStream.getTracks().forEach((track) => {
			track.stop()
		})
		microphoneStream = null
	}
	isListening.value = false
}

const listenForWord = async () => {
	console.log('Attempting to listen for word...')
	if (!recognitionSupported.value) {
		feedback.value = 'Speech recognition is not supported in your browser.'
		return
	}

	try {
		// Force stop any existing audio before starting new
		forceStopAudio()

		// Create a new audio context
		const AudioContext = window.AudioContext || window.webkitAudioContext
		const audioContext = new AudioContext()

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		microphoneStream = stream

		feedback.value = ''
		isListening.value = true
		recognition.start()

		listenTimeout = setTimeout(() => {
			if (isListening.value) {
				cleanup()
				feedback.value = 'Listening timed out. Please try again.'
			}
		}, 10000)
	} catch (err) {
		console.error('Error accessing microphone:', err)
		feedback.value = 'Unable to access the microphone. Please check your microphone settings and try again.'
	}
}
</script>

<template>
	<div class="flex flex-col items-center pt-9">
		<div
			class="relative mb-9 flex h-[30vh] w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-100 to-blue-100 text-blue-900 shadow-2xl sm:h-[50vh] sm:max-h-[500px]"
			role="region"
			aria-label="Flashcard">
			<h2 class="text-7xl font-medium drop-shadow-md md:text-9xl" aria-live="polite">{{ words[currentIndex] }}</h2>
			<div
				v-if="feedback"
				class="absolute bottom-3 flex items-center gap-1 rounded-full border px-4 py-2 text-lg font-semibold"
				:class="{
					'border-green-300 bg-green-100 text-green-700': feedback.includes('Correct'),
					'border-red-300 bg-red-200 text-red-800': feedback.includes('Not quite'),
				}">
				<checkbox-marked-circle-icon v-if="feedback.includes('Correct')" :size="24" class="mr-2 text-green-700" />
				<alpha-x-circle-icon v-if="feedback.includes('Not quite')" :size="24" class="mr-2 text-red-700" />
				{{ feedback }}
			</div>
			<small class="absolute bottom-3 right-3" aria-live="polite">{{ currentIndex + 1 }}/{{ words.length }}</small>
			<div v-if="isListening" class="absolute right-3 top-3">
				<microphone-icon :class="{ 'animate-pulse': isListening }" />
			</div>
		</div>

		<div class="flex w-full flex-col items-center justify-between gap-2 sm:flex-row">
			<div class="flex gap-2">
				<button class="button button-iconleft" @click="previousWord" :disabled="currentIndex === 0" aria-label="Previous word">
					<chevron-left-icon />
					Prev
				</button>
				<button class="button button-icon" @click="selectRandomWord" aria-label="Random word">
					<shuffle-icon />
				</button>
				<button class="button button-iconright" @click="nextWord" :disabled="currentIndex === words.length - 1" aria-label="Next word">
					Next
					<chevron-right-icon />
				</button>
			</div>
			<div class="flex gap-2">
				<button class="button button-icon" @click="speakWord" :disabled="!speechSupported" aria-label="Speak word">
					<ear-hearing-icon />
				</button>
				<button class="button button-icon" @click="listenForWord" :disabled="!microphoneAvailable" aria-label="Listen for word">
					<microphone-icon />
				</button>
			</div>
		</div>
	</div>
</template>
