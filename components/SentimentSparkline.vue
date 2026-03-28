<template>
    <div class="sentiment-sparkline">
        <div class="sparkline-header mb-2">
            <span class="text-caption text-grey">7-Day Sentiment Trend</span>
            <span class="text-caption" :style="{ color: trendColor }">
                {{ trendLabel }}
            </span>
        </div>

        <v-sparkline
            :model-value="sentimentData"
            :gradient="gradient"
            :smooth="10"
            :line-width="2"
            :padding="8"
            height="80"
            auto-draw
            fill
        />
    </div>
</template>

<script setup lang="ts">
    const props = defineProps<{
        sentimentData: number[];
    }>();

    const trendColor = computed(() => {
        if (props.sentimentData.length < 2) return '#8899A6';

        const first = props.sentimentData[0];
        const last = props.sentimentData[props.sentimentData.length - 1];
        const diff = last - first;

        if (diff > 0.1) return '#1DA1F2';
        if (diff < -0.1) return '#E0245E';
        return '#8899A6';
    });

    const trendLabel = computed(() => {
        if (props.sentimentData.length < 2) return 'No data';

        const first = props.sentimentData[0];
        const last = props.sentimentData[props.sentimentData.length - 1];
        const diff = last - first;

        if (diff > 0.1) return '↑ Improving';
        if (diff < -0.1) return '↓ Declining';
        return '→ Stable';
    });

    const gradient = computed(() => {
        const avg = props.sentimentData.reduce((a, b) => a + b, 0) / props.sentimentData.length;

        if (avg > 0.1) {
            return ['#1DA1F2', '#1DA1F2'];
        } else if (avg < -0.1) {
            return ['#E0245E', '#E0245E'];
        }
        return ['#8899A6', '#8899A6'];
    });
</script>

<style scoped>
    .sentiment-sparkline {
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
    }

    .sparkline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
