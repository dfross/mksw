<script setup>
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

onMounted(() => {
	window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
	<div class="flex flex-col items-center py-9">
		<div
			class="relative mb-9 flex aspect-video w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-100 to-blue-100 text-blue-900 shadow-2xl"
			role="region"
			aria-label="Flashcard">
			<h2 class="text-7xl font-bold drop-shadow-lg md:text-9xl" aria-live="polite">{{ words[currentIndex] }}</h2>
			<small class="absolute bottom-3 right-3" aria-live="polite">{{ currentIndex + 1 }}/{{ words.length }}</small>
		</div>
		<div class="flex w-full justify-center gap-3">
			<button class="button" @click="previousWord" :disabled="currentIndex === 0" aria-label="Previous word">Previous</button>
			<button class="button" @click="selectRandomWord" aria-label="Random word">Random</button>
			<button class="button" @click="nextWord" :disabled="currentIndex === words.length - 1" aria-label="Next word">Next</button>
		</div>
	</div>
</template>
