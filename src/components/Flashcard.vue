<script setup>
import MenuIcon from 'vue-material-design-icons/Menu.vue'
import ShuffleIcon from 'vue-material-design-icons/Shuffle.vue'
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import ChevronLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import VolumeHighIcon from 'vue-material-design-icons/VolumeHigh.vue'

components: {
	MenuIcon, ChevronRightIcon, ChevronLeftIcon, ShuffleIcon, VolumeHighIcon
}
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps(['words', 'set'])
const currentIndex = ref(0)

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

const speakWord = () => {
	if ('speechSynthesis' in window) {
		const utterance = new SpeechSynthesisUtterance(props.words[currentIndex.value])
		speechSynthesis.speak(utterance)
	} else {
		console.log('Speech synthesis not supported')
		// You might want to add a visual feedback for users when speech synthesis is not supported
	}
}

onMounted(() => {
	window.addEventListener('keydown', handleKeydown)
	window.addEventListener('setFlashcardWord', (event) => {
		const index = event.detail.index
		if (index >= 0 && index < props.words.length) {
			currentIndex.value = index
		}
	})
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
	window.removeEventListener('setFlashcardWord')
})
</script>

<template>
	<div class="flex flex-col items-center py-9">
		<div
			class="relative mb-9 flex aspect-video w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-100 to-blue-100 text-blue-900 shadow-2xl"
			role="region"
			aria-label="Flashcard">
			<h2 class="text-7xl font-bold drop-shadow-md md:text-9xl" aria-live="polite">{{ words[currentIndex] }}</h2>
			<small class="absolute bottom-3 right-3" aria-live="polite">{{ currentIndex + 1 }}/{{ words.length }}</small>
		</div>
		<div class="flex w-full justify-center gap-3">
			<button class="button button-iconleft" @click="previousWord" :disabled="currentIndex === 0" aria-label="Previous word">
				<chevron-left-icon />
				Prev
			</button>
			<button class="button button-icononly" @click="selectRandomWord" aria-label="Random word"><shuffle-icon /></button>
			<button class="button button-icononly" @click="speakWord" aria-label="Read word aloud"><volume-high-icon /></button>
			<button class="button button-iconright" @click="nextWord" :disabled="currentIndex === words.length - 1" aria-label="Next word">
				Next
				<chevron-right-icon />
			</button>
		</div>
	</div>
</template>
