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
			feedback.value = "Sorry, I couldn't hear you. Please try again."
			stopMicrophone()
		}

		recognition.onend = () => {
			console.log('Speech recognition ended')
			isListening.value = false
			stopMicrophone()
		}
	}
}

const checkMicrophonePermission = async () => {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		stream.getTracks().forEach((track) => track.stop())
		microphoneAvailable.value = true
	} catch (err) {
		console.error('Microphone permission denied:', err)
		microphoneAvailable.value = false
		alert('Please grant microphone permission to use this feature.')
	}
}

const cleanup = () => {
	stopMicrophone()
	if (recognition) {
		recognition.abort()
	}
	if (listenTimeout) {
		clearTimeout(listenTimeout)
	}
}

const handleVisibilityChange = () => {
	if (document.hidden || document.visibilityState === 'hidden') {
		// Check if the browser is running on iOS
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

		if (isIOS && document.visibilityState === 'hidden') {
			// The browser is running as a background task on iOS
			cleanup()
		} else {
			// Handle other visibility change scenarios
			cleanup()
		}
	}
}

const handleWindowBlur = () => {
	cleanup()
}

const handlePageHide = () => {
	cleanup()
}

onMounted(() => {
	speechSupported.value = 'speechSynthesis' in window
	recognitionSupported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

	initializeSpeechRecognition()
	checkMicrophonePermission()

	window.addEventListener('keydown', handleKeydown)
	window.addEventListener('setFlashcardWord', handleSetFlashcardWord)
	document.addEventListener('visibilitychange', handleVisibilityChange)
	window.addEventListener('blur', handleWindowBlur)
	window.addEventListener('pagehide', handlePageHide)

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

const xorshift = (() => {
	let x = 123456789,
		y = 362436069,
		z = 521288629,
		w = 88675123
	return () => {
		const t = x ^ (x << 11)
		x = y
		y = z
		z = w
		w = w ^ (w >> 19) ^ (t ^ (t >> 8))
		return w / 0x100000000 + 0.5
	}
})()

const selectRandomWord = () => {
	const randomIndex = Math.floor(xorshift() * props.words.length)
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

	utterance.text = wordToSpeak
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
		await checkMicrophonePermission()
		if (!microphoneAvailable.value) {
			feedback.value = 'Unable to access the microphone. Please check your microphone settings and try again.'
			return
		}

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
				class="absolute bottom-3 rounded-full border px-4 py-2 text-lg font-medium"
				:class="{
					'border-green-300 bg-green-100 text-green-700': feedback.includes('Correct'),
					'border-red-300 bg-red-100 text-red-700': feedback.includes('Not quite'),
				}">
				<checkbox-marked-circle-icon v-if="feedback.includes('Correct')" :size="20" class="mr-2 text-green-700" />
				<alpha-x-circle-icon v-if="feedback.includes('Not quite')" :size="20" class="mr-2 text-red-700" />
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
				<button class="button button-icon" @click="listenForWord" :disabled="!recognitionSupported" aria-label="Listen for word">
					<microphone-icon />
				</button>
			</div>
		</div>
	</div>
</template>
