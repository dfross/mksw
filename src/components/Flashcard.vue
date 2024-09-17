<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps(['words'])
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

const handleKeydown = (event) => {
	if (event.key === 'ArrowRight') {
		nextWord()
	} else if (event.key === 'ArrowLeft') {
		previousWord()
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
	<div class="flex flex-col items-center">
		<div class="mb-9 flex aspect-video w-2/3 items-center justify-center rounded-lg bg-white text-purple-800 shadow-lg">
			<h2 class="text-8xl font-bold">{{ words[currentIndex] }}</h2>
		</div>
		<div class="flex space-x-6">
			<button
				@click="previousWord"
				class="min-w-36 rounded-lg bg-blue-500 px-4 py-2 text-xl text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
				:disabled="currentIndex === 0">
				Previous
			</button>
			<button
				@click="nextWord"
				class="min-w-36 rounded-lg bg-green-700 px-4 py-2 text-xl text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600"
				:disabled="currentIndex === words.length - 1">
				Next
			</button>
		</div>
	</div>
</template>
