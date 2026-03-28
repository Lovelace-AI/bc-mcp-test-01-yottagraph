<template>
    <v-chip :color="sentimentColor" size="x-small" variant="flat" class="sentiment-indicator">
        <v-icon :icon="sentimentIcon" size="x-small" />
    </v-chip>
</template>

<script setup lang="ts">
    const props = defineProps<{
        sentiment: number;
    }>();

    const sentimentColor = computed(() => {
        if (props.sentiment > 0.1) return '#1DA1F2';
        if (props.sentiment < -0.1) return '#E0245E';
        return '#8899A6';
    });

    const sentimentIcon = computed(() => {
        if (props.sentiment > 0.1) return 'mdi-arrow-up';
        if (props.sentiment < -0.1) return 'mdi-arrow-down';
        return 'mdi-minus';
    });
</script>

<style scoped>
    .sentiment-indicator {
        min-width: 24px;
        height: 24px;
    }
</style>
