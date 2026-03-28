<template>
    <v-card :to="`/story/${article.neid}`" class="hero-card" variant="outlined" hover>
        <v-card-text class="pa-6">
            <div class="d-flex align-start gap-4">
                <div class="flex-grow-1">
                    <v-chip color="primary" size="small" variant="flat" class="mb-3">
                        TOP STORY
                    </v-chip>

                    <div class="text-h4 mb-3 hero-headline">{{ article.title }}</div>

                    <div class="d-flex align-center gap-3 mb-4 text-body-2 text-grey">
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

                <div class="d-flex flex-column align-center gap-2">
                    <SentimentIndicator :sentiment="article.sentiment" />
                    <div class="text-caption text-grey">
                        {{ sentimentLabel }}
                    </div>
                </div>
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
        return props.article.entities.slice(0, 5);
    });

    const sentimentLabel = computed(() => {
        if (props.article.sentiment > 0.3) return 'Very Positive';
        if (props.article.sentiment > 0.1) return 'Positive';
        if (props.article.sentiment < -0.3) return 'Very Negative';
        if (props.article.sentiment < -0.1) return 'Negative';
        return 'Neutral';
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
    .hero-card {
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        transition: all 0.3s ease;
        background: linear-gradient(
            135deg,
            rgba(29, 161, 242, 0.05) 0%,
            rgba(15, 20, 25, 0.8) 100%
        );
    }

    .hero-card:hover {
        border-color: rgba(29, 161, 242, 0.4);
        box-shadow: 0 8px 24px rgba(29, 161, 242, 0.2);
        transform: translateY(-2px);
    }

    .hero-headline {
        line-height: 1.3;
        font-weight: 700;
    }
</style>
