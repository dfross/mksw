<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MenuIcon from 'vue-material-design-icons/Menu.vue'
import ShuffleIcon from 'vue-material-design-icons/Shuffle.vue'
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import ChevronLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import VolumeHighIcon from 'vue-material-design-icons/VolumeHigh.vue'
import MicrophoneIcon from 'vue-material-design-icons/Microphone.vue'

const props = defineProps(['words', 'set'])
const currentIndex = ref(0)
const isSpeaking = ref(false)
const isListening = ref(false)
const speechSupported = ref(false)
const recognitionSupported = ref(false)
const microphoneAvailable = ref(false)
const feedback = ref('')

let recognition

onMounted(async () => {
	speechSupported.value = 'speechSynthesis' in window
	recognitionSupported.value = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

	// Check for microphone availability
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		microphoneAvailable.value = true
		// Don't forget to stop the stream after checking
		stream.getTracks().forEach((track) => track.stop())
	} catch (err) {
		console.error('Microphone not available:', err)
		microphoneAvailable.value = false
	}

	if (recognitionSupported.value && microphoneAvailable.value) {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		recognition = new SpeechRecognition()
		recognition.continuous = false
		recognition.interimResults = false

		recognition.onresult = (event) => {
			const last = event.results.length - 1
			const result = event.results[last][0].transcript.trim().toLowerCase()
			const currentWord = props.words[currentIndex.value].toLowerCase()

			if (result === currentWord) {
				feedback.value = 'Correct! Well done!'
			} else {
				feedback.value = `Not quite. The word is "${currentWord}". You said "${result}".`
			}
			isListening.value = false
		}

		recognition.onerror = (event) => {
			console.error('Speech recognition error:', event.error)
			isListening.value = false
			feedback.value = "Sorry, I couldn't hear you. Please try again."
		}

		recognition.onend = () => {
			isListening.value = false
		}
	}

	window.addEventListener('keydown', handleKeydown)
	window.addEventListener('setFlashcardWord', handleSetFlashcardWord)
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
	window.removeEventListener('setFlashcardWord', handleSetFlashcardWord)
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
		alert('Speech synthesis is not supported in your browser.')
		return
	}

	if (isSpeaking.value) {
		window.speechSynthesis.cancel()
	}

	isSpeaking.value = true
	const utterance = new SpeechSynthesisUtterance(props.words[currentIndex.value])

	utterance.onend = () => {
		isSpeaking.value = false
	}

	utterance.onerror = (event) => {
		console.error('SpeechSynthesis error:', event)
		isSpeaking.value = false
		alert('An error occurred while trying to speak the word.')
	}

	window.speechSynthesis.speak(utterance)
}

const listenForWord = async () => {
	if (!recognitionSupported.value) {
		alert('Speech recognition is not supported in your browser.')
		return
	}

	if (!microphoneAvailable.value) {
		alert('No microphone detected or microphone access is denied.')
		return
	}

	try {
		// Check again in case the user has connected/disconnected a microphone
		await navigator.mediaDevices.getUserMedia({ audio: true })

		feedback.value = ''
		isListening.value = true
		recognition.start()
	} catch (err) {
		console.error('Error accessing microphone:', err)
		alert('Unable to access the microphone. Please check your microphone settings and try again.')
	}
}
</script>

<template>
	<div class="flex flex-col items-center py-9">
		<div
			class="relative mb-9 flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg bg-gradient-to-b from-cyan-100 to-blue-100 text-blue-900 shadow-2xl"
			role="region"
			aria-label="Flashcard"
			@click="listenForWord">
			<h2 class="text-7xl font-bold drop-shadow-md md:text-9xl" aria-live="polite">{{ words[currentIndex] }}</h2>
			<small class="absolute bottom-3 right-3" aria-live="polite">{{ currentIndex + 1 }}/{{ words.length }}</small>
			<div v-if="isListening" class="absolute right-3 top-3">
				<microphone-icon :class="{ 'animate-pulse': isListening }" />
			</div>
		</div>
		<div
			v-if="feedback"
			class="mb-4 text-lg font-semibold"
			:class="{ 'text-green-600': feedback.includes('Correct'), 'text-red-600': feedback.includes('Not quite') }">
			{{ feedback }}
		</div>
		<div class="flex w-full justify-center gap-3">
			<button class="button button-iconleft" @click="previousWord" :disabled="currentIndex === 0" aria-label="Previous word">
				<chevron-left-icon />
				Prev
			</button>
			<button class="button button-icononly" @click="selectRandomWord" aria-label="Random word"><shuffle-icon /></button>
			<button
				class="button button-icononly"
				@click="speakWord"
				:disabled="!speechSupported || isSpeaking"
				:aria-label="isSpeaking ? 'Speaking...' : 'Read word aloud'">
				<volume-high-icon :class="{ 'opacity-50': isSpeaking }" />
			</button>
			<button
				class="button button-icononly"
				@click="listenForWord"
				:disabled="!recognitionSupported || !microphoneAvailable || isListening"
				:aria-label="
					!recognitionSupported
						? 'Speech recognition not supported'
						: !microphoneAvailable
							? 'Microphone not available'
							: isListening
								? 'Listening...'
								: 'Listen for pronunciation'
				">
				<microphone-icon :class="{ 'animate-pulse': isListening, 'opacity-50': !recognitionSupported || !microphoneAvailable }" />
			</button>
			<button class="button button-iconright" @click="nextWord" :disabled="currentIndex === words.length - 1" aria-label="Next word">
				Next
				<chevron-right-icon />
			</button>
		</div>
	</div>
</template>

<style scoped>
@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}
.animate-pulse {
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
