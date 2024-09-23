<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import ShuffleIcon from 'vue-material-design-icons/Shuffle.vue'
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import ChevronLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import EarHearingIcon from 'vue-material-design-icons/EarHearing.vue'
import MicrophoneIcon from 'vue-material-design-icons/Microphone.vue'
import CheckboxMarkedCircleIcon from 'vue-material-design-icons/CheckboxMarkedCircle.vue'
import AlphaXCircleIcon from 'vue-material-design-icons/AlphaXCircle.vue'
import EasySpeech from 'easy-speech'

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
const feedback = ref('')

let recognition
let cleanupInterval

const initSpeech = async () => {
	try {
		await EasySpeech.init({ maxTimeout: 5000, interval: 250 })
		speechSupported.value = true
	} catch (e) {
		console.error('Speech synthesis initialization failed:', e)
		speechSupported.value = false
	}
}

const speakWord = async () => {
	if (!speechSupported.value) {
		showError('Speech synthesis is not supported in your browser.')
		return
	}

	const wordToSpeak = props.words[currentIndex.value].trim()

	if (isSpeaking.value) {
		await EasySpeech.cancel()
	}

	isSpeaking.value = true

	try {
		const voices = EasySpeech.voices()
		let selectedVoice = voices.find((voice) => voice.name.toLowerCase().includes('cathrine'))

		if (!selectedVoice) {
			selectedVoice = voices.find((voice) => voice.lang === 'en-US')
		}

		if (!selectedVoice && voices.length > 0) {
			selectedVoice = voices[0]
		}

		if (!selectedVoice) {
			throw new Error('No voices available')
		}

		let textToSpeak = wordToSpeak

		// Handle single letter 'I'
		if (wordToSpeak.length === 1 && wordToSpeak.toLowerCase() === 'i') {
			// For the letter 'I', we'll add a hyphen before and after
			// This trick helps most TTS engines to pronounce it correctly
			textToSpeak = `- ${wordToSpeak} -`
		}

		await EasySpeech.speak({
			text: textToSpeak,
			voice: selectedVoice,
			pitch: 1,
			rate: 0.8,
			volume: 1,
		})
	} catch (e) {
		console.error('Speech synthesis error:', e)
		showError('An error occurred while trying to speak the word.')
	} finally {
		isSpeaking.value = false
	}
}

const initializeSpeechRecognition = () => {
	if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		recognition = new SpeechRecognition()
		recognition.continuous = false
		recognition.interimResults = false

		recognition.onresult = (event) => {
			const last = event.results.length - 1
			const result = event.results[last][0].transcript.trim().toLowerCase()
			const currentWord = props.words[currentIndex.value].toLowerCase()

			if (result === currentWord) {
				showFeedback('Correct! Well done!')
			} else {
				showFeedback(`Not quite. Try again.`)
			}
			isListening.value = false
		}

		recognition.onerror = (event) => {
			console.error('Speech recognition error:', event.error)
			isListening.value = false
			showError("Sorry, I couldn't hear you. Please try again.")
		}

		recognition.onend = () => {
			isListening.value = false
		}

		recognitionSupported.value = true
	} else {
		recognitionSupported.value = false
	}
}

const listenForWord = () => {
	if (!recognitionSupported.value) {
		showError('Speech recognition is not supported in your browser.')
		return
	}

	if (isListening.value) {
		recognition.stop()
	} else {
		feedback.value = ''
		isListening.value = true
		recognition.start()
	}
}

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

const showFeedback = (message) => {
	feedback.value = message
}

const showError = (message) => {
	feedback.value = message
}

const handleKeydown = (event) => {
	if (event.key === 'ArrowRight' || event.code === 'Space') {
		nextWord()
	} else if (event.key === 'ArrowLeft') {
		previousWord()
	} else if (event.key === 'r' || event.key === 'R') {
		selectRandomWord()
	} else if (event.key === 's' || event.key === 'S') {
		speakWord()
	} else if (event.key === 'l' || event.key === 'L') {
		listenForWord()
	}
}

onMounted(async () => {
	await initSpeech()
	initializeSpeechRecognition()

	window.addEventListener('keydown', handleKeydown)

	cleanupInterval = requestAnimationFrame(function check() {
		if (!document.hasFocus()) {
			if (recognition && isListening.value) {
				recognition.stop()
			}
		}
		cleanupInterval = requestAnimationFrame(check)
	})
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
	cancelAnimationFrame(cleanupInterval)
	if (recognition) {
		recognition.stop()
	}
})

watch(currentIndex, (newIndex) => {
	feedback.value = ''
	emit('wordChanged', newIndex)
})
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
				<button class="button button-icon" @click="listenForWord" :disabled="!recognitionSupported" aria-label="Listen for word">
					<microphone-icon />
				</button>
			</div>
		</div>
	</div>
</template>
