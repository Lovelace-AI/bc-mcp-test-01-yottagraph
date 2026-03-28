<template>
    <v-card class="trending-sidebar" variant="outlined">
        <v-card-title class="d-flex align-center justify-space-between">
            <span>Trending Entities</span>
            <v-btn
                icon="mdi-refresh"
                size="small"
                variant="text"
                :loading="loading"
                @click="refresh"
            />
        </v-card-title>

        <v-divider />

        <v-card-text v-if="loading && trending.length === 0" class="pa-4">
            <v-skeleton-loader v-for="i in 5" :key="i" type="list-item-two-line" class="mb-2" />
        </v-card-text>

        <v-card-text v-else-if="trending.length === 0" class="pa-4 text-center text-grey">
            No trending data available
        </v-card-text>

        <v-list v-else density="compact" class="pa-0">
            <v-list-item
                v-for="(entity, index) in trending"
                :key="entity.neid"
                :to="`/entity/${entity.neid}`"
                class="trending-item"
            >
                <template #prepend>
                    <div class="rank-badge">{{ index + 1 }}</div>
                </template>

                <v-list-item-title>{{ entity.name }}</v-list-item-title>
                <v-list-item-subtitle class="d-flex align-center gap-2 mt-1">
                    <span>{{ entity.mentionCount }} mentions</span>
                    <v-icon
                        :icon="sentimentIcon(entity.sentimentDirection)"
                        :color="sentimentColor(entity.sentimentDirection)"
                        size="small"
                    />
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <v-divider />

        <v-card-text v-if="lastUpdate" class="text-caption text-grey text-center pa-2">
            Updated {{ updateTime }}
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useTrendingEntities } from '~/composables/useTrendingEntities';

    const { trending, loading, lastUpdate, fetchTrending } = useTrendingEntities();

    const updateTime = computed(() => {
        if (!lastUpdate.value) return '';

        const now = new Date();
        const diff = now.getTime() - lastUpdate.value.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'just now';
        if (minutes === 1) return '1 min ago';
        return `${minutes} min ago`;
    });

    function sentimentIcon(direction: 'up' | 'down' | 'neutral') {
        if (direction === 'up') return 'mdi-arrow-up';
        if (direction === 'down') return 'mdi-arrow-down';
        return 'mdi-minus';
    }

    function sentimentColor(direction: 'up' | 'down' | 'neutral') {
        if (direction === 'up') return '#1DA1F2';
        if (direction === 'down') return '#E0245E';
        return '#8899A6';
    }

    function refresh() {
        fetchTrending(10);
    }

    onMounted(() => {
        fetchTrending(10);

        const intervalId = setInterval(
            () => {
                fetchTrending(10);
            },
            5 * 60 * 1000
        );

        onUnmounted(() => {
            clearInterval(intervalId);
        });
    });
</script>

<style scoped>
    .trending-sidebar {
        position: sticky;
        top: 80px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.02);
    }

    .trending-item {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.2s ease;
    }

    .trending-item:hover {
        background: rgba(29, 161, 242, 0.1);
    }

    .trending-item:last-child {
        border-bottom: none;
    }

    .rank-badge {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(29, 161, 242, 0.2);
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.75rem;
        color: #1da1f2;
    }
</style>
