<template>
    <v-card :to="`/story/${article.neid}`" class="news-card" variant="outlined" hover>
        <v-card-text>
            <div class="d-flex align-start gap-2">
                <div class="flex-grow-1">
                    <div class="text-h6 mb-2 news-headline">{{ article.title }}</div>

                    <div class="d-flex align-center gap-2 mb-2 text-caption text-grey">
                        <span>{{ article.source || 'Unknown Source' }}</span>
                        <span>•</span>
                        <span>{{ relativeTime }}</span>
                    </div>

                    <div class="d-flex flex-wrap gap-2">
                        <EntityChip
                            v-for="entity in displayEntities"
                            :key="entity.neid"
                            :neid="entity.neid"
                            :name="entity.name"
                            :sentiment="entity.sentiment"
                        />
                    </div>
                </div>

                <SentimentIndicator :sentiment="article.sentiment" />
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import type { NewsArticle } from '~/composables/useNewsData';

    const props = defineProps<{
        article: NewsArticle;
    }>();

    const displayEntities = computed(() => {
        return props.article.entities.slice(0, 3);
    });

    const relativeTime = computed(() => {
        if (!props.article.publishedAt) return 'Unknown';

        const now = new Date();
        const published = new Date(props.article.publishedAt);
        const diffMs = now.getTime() - published.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    });
</script>

<style scoped>
    .news-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        transition: all 0.2s ease;
        background: rgba(255, 255, 255, 0.02);
    }

    .news-card:hover {
        border-color: rgba(255, 255, 255, 0.16);
        box-shadow: 0 4px 12px rgba(29, 161, 242, 0.1);
    }

    .news-headline {
        line-height: 1.4;
        font-weight: 600;
    }
</style>
