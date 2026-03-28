<template>
    <div class="story-page">
        <v-container class="py-8">
            <v-row justify="center">
                <v-col cols="12" md="8">
                    <v-btn to="/" variant="text" prepend-icon="mdi-arrow-left" class="mb-4">
                        Back to Feed
                    </v-btn>

                    <v-card v-if="loading" variant="outlined" class="pa-6">
                        <v-skeleton-loader type="article" />
                    </v-card>

                    <v-card v-else-if="error" variant="outlined" class="pa-6">
                        <v-alert type="error" variant="outlined">
                            {{ error }}
                        </v-alert>
                    </v-card>

                    <v-card v-else-if="story" variant="outlined" class="story-card">
                        <v-card-text class="pa-8">
                            <div class="d-flex align-center gap-2 mb-4">
                                <SentimentIndicator :sentiment="story.sentiment" />
                                <span class="text-caption text-grey">{{ sentimentLabel }}</span>
                            </div>

                            <h1 class="text-h3 font-weight-bold mb-6">{{ story.title }}</h1>

                            <div class="d-flex align-center gap-3 mb-6 text-body-1 text-grey">
                                <span>{{ story.source || 'Unknown Source' }}</span>
                                <span>•</span>
                                <span>{{ formattedDate }}</span>
                            </div>

                            <v-divider class="my-6" />

                            <div v-if="story.sourceUrl" class="mb-6">
                                <v-btn
                                    :href="story.sourceUrl"
                                    target="_blank"
                                    color="primary"
                                    variant="outlined"
                                    prepend-icon="mdi-open-in-new"
                                >
                                    Read Full Article
                                </v-btn>
                            </div>

                            <div class="mb-6">
                                <h2 class="text-h6 mb-3">Tagged Entities</h2>
                                <div class="d-flex flex-wrap gap-2">
                                    <EntityChip
                                        v-for="entity in story.entities"
                                        :key="entity.neid"
                                        :neid="entity.neid"
                                        :name="entity.name"
                                        :sentiment="entity.sentiment"
                                    />
                                </div>
                            </div>

                            <div v-if="story.topics.length > 0" class="mb-6">
                                <h2 class="text-h6 mb-3">Topics</h2>
                                <div class="d-flex flex-wrap gap-2">
                                    <v-chip
                                        v-for="topic in story.topics"
                                        :key="topic"
                                        size="small"
                                        variant="outlined"
                                        color="grey"
                                    >
                                        {{ topic }}
                                    </v-chip>
                                </div>
                            </div>

                            <v-divider class="my-6" />

                            <div>
                                <h2 class="text-h6 mb-3">Sentiment Analysis</h2>
                                <div class="sentiment-breakdown">
                                    <div class="d-flex align-center gap-4">
                                        <div class="sentiment-meter" :style="sentimentMeterStyle" />
                                        <div>
                                            <div class="text-h5 font-weight-bold">
                                                {{ (story.sentiment * 100).toFixed(0) }}%
                                            </div>
                                            <div class="text-caption text-grey">
                                                Overall Sentiment Score
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup lang="ts">
    import { useElementalClient } from '@yottagraph-app/elemental-api/client';
    import type { NewsArticle } from '~/composables/useNewsData';

    const route = useRoute();
    const client = useElementalClient();

    const story = ref<NewsArticle | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const sentimentLabel = computed(() => {
        if (!story.value) return '';
        const s = story.value.sentiment;
        if (s > 0.3) return 'Very Positive';
        if (s > 0.1) return 'Positive';
        if (s < -0.3) return 'Very Negative';
        if (s < -0.1) return 'Negative';
        return 'Neutral';
    });

    const sentimentMeterStyle = computed(() => {
        if (!story.value) return {};
        const s = story.value.sentiment;
        const percentage = ((s + 1) / 2) * 100;

        let color = '#8899A6';
        if (s > 0.1) color = '#1DA1F2';
        else if (s < -0.1) color = '#E0245E';

        return {
            width: `${percentage}%`,
            background: color,
        };
    });

    const formattedDate = computed(() => {
        if (!story.value || !story.value.publishedAt) return '';
        return new Date(story.value.publishedAt).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    });

    async function loadStory() {
        loading.value = true;
        error.value = null;

        try {
            const neid = route.params.id as string;

            const schema = await client.getSchema();
            const properties = schema.schema?.properties ?? (schema as any).properties ?? [];
            const pidMap = new Map(properties.map((p: any) => [p.name, p.pid]));

            const titlePid = pidMap.get('title');
            const sentimentPid = pidMap.get('sentiment');
            const appearsInPid = pidMap.get('appears_in');
            const topicPid = pidMap.get('has_topic');
            const namePid = pidMap.get('name') ?? 8;
            const entitySentimentPid = pidMap.get('entity_sentiment');

            const propsResult = await client.getPropertyValues({
                eids: JSON.stringify([neid]),
                pids: JSON.stringify([titlePid, sentimentPid, appearsInPid, topicPid]),
                include_attributes: 'true',
            } as any);

            const storyData: NewsArticle = {
                neid,
                title: '',
                sentiment: 0,
                entities: [],
                publishedAt: '',
                source: '',
                sourceUrl: '',
                topics: [],
            };

            for (const value of propsResult.values ?? []) {
                if (value.pid === titlePid) {
                    storyData.title = String(value.value);
                    storyData.publishedAt = value.recorded_at ?? '';
                } else if (value.pid === sentimentPid) {
                    storyData.sentiment = Number(value.value);
                } else if (value.pid === topicPid) {
                    if (!storyData.topics.includes(String(value.value))) {
                        storyData.topics.push(String(value.value));
                    }
                } else if (value.pid === appearsInPid) {
                    const attrs = value.attributes ?? {};
                    if (attrs.url) {
                        storyData.sourceUrl = String(attrs.url);
                    }
                }
            }

            const entityNeids = new Set<string>();
            for (const value of propsResult.values ?? []) {
                if (value.pid === appearsInPid) {
                    entityNeids.add(String(value.value).padStart(20, '0'));
                }
            }

            if (entityNeids.size > 0) {
                const entityPropsResult = await client.getPropertyValues({
                    eids: JSON.stringify(Array.from(entityNeids)),
                    pids: JSON.stringify([namePid, entitySentimentPid]),
                });

                const entityData = new Map<string, { name?: string; sentiment?: number }>();
                for (const value of entityPropsResult.values ?? []) {
                    if (!entityData.has(value.eid)) {
                        entityData.set(value.eid, {});
                    }
                    const data = entityData.get(value.eid)!;

                    if (value.pid === namePid) {
                        data.name = String(value.value);
                    } else if (value.pid === entitySentimentPid) {
                        data.sentiment = Number(value.value);
                    }
                }

                for (const value of propsResult.values ?? []) {
                    if (value.pid === appearsInPid) {
                        const entityNeid = String(value.value).padStart(20, '0');
                        const entity = entityData.get(entityNeid);

                        if (entity && entity.name) {
                            const attrs = value.attributes ?? {};
                            const sentiment =
                                attrs[entitySentimentPid ?? -1] ?? entity.sentiment ?? 0;

                            storyData.entities.push({
                                neid: entityNeid,
                                name: entity.name,
                                flavor: 'organization',
                                sentiment: Number(sentiment),
                            });
                        }
                    }
                }
            }

            story.value = storyData;
        } catch (err) {
            console.error('Error loading story:', err);
            error.value = err instanceof Error ? err.message : 'Failed to load story';
        } finally {
            loading.value = false;
        }
    }

    onMounted(() => {
        loadStory();
    });
</script>

<style scoped>
    .story-page {
        min-height: 100vh;
        background: #0f1419;
    }

    .story-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.02);
    }

    .sentiment-breakdown {
        padding: 16px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
    }

    .sentiment-meter {
        height: 8px;
        border-radius: 4px;
        transition: width 0.3s ease;
        max-width: 200px;
    }
</style>
