<script setup lang="ts">
import { useVideoModal } from '../composables/useVideoModal';

const { open, url, original } = useVideoModal();
</script>

<template>
	<n-modal v-model:show="open" preset="card" class="video-modal">
		<iframe v-if="url" :src="url" class="frame" allow="autoplay" />
		<n-text depth="3" class="fallback">
			Відео не відкривається?
			<n-button text tag="a" :href="original" target="_blank" type="primary">
				Відкрити в Google Drive
			</n-button>
		</n-text>
	</n-modal>
</template>

<style scoped>
.video-modal {
	width: 60vw;
	max-width: 900px;
}
.frame {
	width: 80%;
	height: 60vh;
	border: 0;
}
.fallback {
	display: block;
	margin-top: 12px;
	text-align: center;
}
</style>
