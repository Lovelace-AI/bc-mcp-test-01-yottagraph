<template>
    <div class="entity-page">
        <v-container class="py-8">
            <v-row justify="center">
                <v-col cols="12" md="10">
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

                    <div v-else-if="entity">
                        <v-card variant="outlined" class="entity-header-card mb-6">
                            <v-card-text class="pa-8">
                                <div class="d-flex align-center justify-space-between mb-4">
                                    <div>
                                        <v-chip
                                            size="small"
                                            color="grey"
                                            variant="outlined"
                                            class="mb-2"
                                        >
                                            {{ entity.flavor }}
                                        </v-chip>
                                        <h1 class="text-h3 font-weight-bold">{{ entity.name }}</h1>
                                    </div>
                                </div>

                                <v-row class="mt-6">
                                    <v-col cols="12" md="4">
                                        <div class="stat-card">
                                            <div
                                                class="text-h4 font-weight-bold"
                                                :style="{ color: avgSentimentColor }"
                                            >
                                                {{ avgSentiment > 0 ? '+' : ''
                                                }}{{ (avgSentiment * 100).toFixed(0) }}%
                                            </div>
                                            <div class="text-caption text-grey">
                                                Average Sentiment
                                            </div>
                                        </div>
                                    </v-col>
                                    <v-col cols="12" md="4">
                                        <div class="stat-card">
                                            <div class="text-h4 font-weight-bold">
                                                {{ mentionCount }}
                                            </div>
                                            <div class="text-caption text-grey">News Mentions</div>
                                        </div>
                                    </v-col>
                                    <v-col cols="12" md="4">
                                        <div class="stat-card">
                                            <div class="text-h4 font-weight-bold">
                                                {{ relatedCount }}
                                            </div>
                                            <div class="text-caption text-grey">
                                                Related Entities
                                            </div>
                                        </div>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>

                        <v-row>
                            <v-col cols="12" md="8">
                                <v-card variant="outlined" class="news-timeline-card">
                                    <v-card-title>Recent News</v-card-title>
                                    <v-divider />

                                    <v-card-text v-if="loadingNews" class="pa-4">
                                        <v-skeleton-loader
                                            v-for="i in 3"
                                            :key="i"
                                            type="list-item-three-line"
                                            class="mb-2"
                                        />
                                    </v-card-text>

                                    <v-card-text
                                        v-else-if="news.length === 0"
                                        class="pa-6 text-center text-grey"
                                    >
                                        No recent news found
                                    </v-card-text>

                                    <v-list v-else density="compact" class="pa-0">
                                        <v-list-item
                                            v-for="article in news"
                                            :key="article.neid"
                                            :to="`/story/${article.neid}`"
                                            class="news-timeline-item"
                                        >
                                            <template #prepend>
                                                <SentimentIndicator
                                                    :sentiment="article.sentiment"
                                                />
                                            </template>

                                            <v-list-item-title class="font-weight-medium">
                                                {{ article.title }}
                                            </v-list-item-title>
                                            <v-list-item-subtitle class="mt-1">
                                                {{ formatDate(article.publishedAt) }}
                                            </v-list-item-subtitle>
                                        </v-list-item>
                                    </v-list>
                                </v-card>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-card variant="outlined" class="sentiment-trend-card mb-4">
                                    <v-card-title>Sentiment Trend</v-card-title>
                                    <v-divider />
                                    <v-card-text>
                                        <SentimentSparkline :sentiment-data="sentimentTrendData" />
                                    </v-card-text>
                                </v-card>

                                <v-card variant="outlined" class="related-entities-card">
                                    <v-card-title>Related Entities</v-card-title>
                                    <v-divider />

                                    <v-card-text v-if="loadingRelated" class="pa-4">
                                        <v-skeleton-loader
                                            v-for="i in 3"
                                            :key="i"
                                            type="list-item"
                                            class="mb-2"
                                        />
                                    </v-card-text>

                                    <v-card-text
                                        v-else-if="relatedEntities.length === 0"
                                        class="pa-6 text-center text-grey"
                                    >
                                        No related entities found
                                    </v-card-text>

                                    <v-list v-else density="compact" class="pa-0">
                                        <v-list-item
                                            v-for="related in relatedEntities"
                                            :key="related.neid"
                                            :to="`/entity/${related.neid}`"
                                        >
                                            <v-list-item-title>{{
                                                related.name
                                            }}</v-list-item-title>
                                            <v-list-item-subtitle>{{
                                                related.flavor
                                            }}</v-list-item-subtitle>
                                        </v-list-item>
                                    </v-list>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>
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

    const entity = ref<{ neid: string; name: string; flavor: string } | null>(null);
    const news = ref<NewsArticle[]>([]);
    const relatedEntities = ref<{ neid: string; name: string; flavor: string }[]>([]);
    const loading = ref(true);
    const loadingNews = ref(true);
    const loadingRelated = ref(true);
    const error = ref<string | null>(null);

    const avgSentiment = computed(() => {
        if (news.value.length === 0) return 0;
        const sum = news.value.reduce((acc, article) => acc + article.sentiment, 0);
        return sum / news.value.length;
    });

    const avgSentimentColor = computed(() => {
        if (avgSentiment.value > 0.1) return '#1DA1F2';
        if (avgSentiment.value < -0.1) return '#E0245E';
        return '#8899A6';
    });

    const mentionCount = computed(() => news.value.length);
    const relatedCount = computed(() => relatedEntities.value.length);

    const sentimentTrendData = computed(() => {
        if (news.value.length === 0) return [0, 0, 0, 0, 0, 0, 0];

        const sortedNews = [...news.value].sort(
            (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        );

        const dailyBuckets: number[][] = Array(7)
            .fill(null)
            .map(() => []);
        const now = new Date();

        for (const article of sortedNews) {
            const articleDate = new Date(article.publishedAt);
            const daysAgo = Math.floor(
                (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const bucketIndex = Math.min(6, Math.max(0, 6 - daysAgo));
            dailyBuckets[bucketIndex].push(article.sentiment);
        }

        return dailyBuckets.map((bucket) => {
            if (bucket.length === 0) return 0;
            return bucket.reduce((a, b) => a + b, 0) / bucket.length;
        });
    });

    function formatDate(dateString: string) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    async function loadEntity() {
        loading.value = true;
        error.value = null;

        try {
            const neid = route.params.id as string;

            const schema = await client.getSchema();
            const properties = schema.schema?.properties ?? (schema as any).properties ?? [];
            const flavors = schema.schema?.flavors ?? (schema as any).flavors ?? [];

            const pidMap = new Map(properties.map((p: any) => [p.name, p.pid]));
            const fidMap = new Map(flavors.map((f: any) => [f.fid ?? f.findex, f.name]));
            const namePid = pidMap.get('name') ?? 8;

            const propsResult = await client.getPropertyValues({
                eids: JSON.stringify([neid]),
                pids: JSON.stringify([namePid, 0]),
            });

            let entityName = '';
            let entityFlavor = 'unknown';

            for (const value of propsResult.values ?? []) {
                if (value.pid === namePid) {
                    entityName = String(value.value);
                } else if (value.pid === 0) {
                    entityFlavor = fidMap.get(Number(value.value)) ?? 'unknown';
                }
            }

            entity.value = {
                neid,
                name: entityName || 'Unknown',
                flavor: entityFlavor,
            };

            await Promise.all([
                loadEntityNews(neid, pidMap),
                loadRelatedEntities(neid, pidMap, namePid),
            ]);
        } catch (err) {
            console.error('Error loading entity:', err);
            error.value = err instanceof Error ? err.message : 'Failed to load entity';
        } finally {
            loading.value = false;
        }
    }

    async function loadEntityNews(neid: string, pidMap: Map<string, number>) {
        loadingNews.value = true;

        try {
            const appearsInPid = pidMap.get('appears_in');
            const titlePid = pidMap.get('title');
            const sentimentPid = pidMap.get('sentiment');
            const entitySentimentPid = pidMap.get('entity_sentiment');

            if (!appearsInPid) return;

            const propsResult = await client.getPropertyValues({
                eids: JSON.stringify([neid]),
                pids: JSON.stringify([appearsInPid]),
                include_attributes: 'true',
            } as any);

            const articleNeids = new Set<string>();
            for (const value of propsResult.values ?? []) {
                if (value.pid === appearsInPid) {
                    articleNeids.add(String(value.value).padStart(20, '0'));
                }
            }

            if (articleNeids.size === 0) {
                news.value = [];
                return;
            }

            const articlePropsResult = await client.getPropertyValues({
                eids: JSON.stringify(Array.from(articleNeids)),
                pids: JSON.stringify([titlePid, sentimentPid]),
            });

            const articleMap = new Map<string, NewsArticle>();

            for (const value of articlePropsResult.values ?? []) {
                const articleNeid = value.eid;
                if (!articleMap.has(articleNeid)) {
                    articleMap.set(articleNeid, {
                        neid: articleNeid,
                        title: '',
                        sentiment: 0,
                        entities: [],
                        publishedAt: value.recorded_at ?? '',
                        source: '',
                        sourceUrl: '',
                        topics: [],
                    });
                }

                const article = articleMap.get(articleNeid)!;

                if (value.pid === titlePid) {
                    article.title = String(value.value);
                } else if (value.pid === sentimentPid) {
                    article.sentiment = Number(value.value);
                }
            }

            for (const value of propsResult.values ?? []) {
                if (value.pid === appearsInPid) {
                    const articleNeid = String(value.value).padStart(20, '0');
                    const attrs = value.attributes ?? {};
                    const sentiment = attrs[entitySentimentPid ?? -1];

                    const article = articleMap.get(articleNeid);
                    if (article && typeof sentiment === 'number') {
                        article.sentiment = sentiment;
                    }
                }
            }

            news.value = Array.from(articleMap.values())
                .sort(
                    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                )
                .slice(0, 20);
        } catch (err) {
            console.error('Error loading entity news:', err);
            news.value = [];
        } finally {
            loadingNews.value = false;
        }
    }

    async function loadRelatedEntities(neid: string, pidMap: Map<string, number>, namePid: number) {
        loadingRelated.value = true;

        try {
            const appearsInPid = pidMap.get('appears_in');
            if (!appearsInPid) return;

            const propsResult = await client.getPropertyValues({
                eids: JSON.stringify([neid]),
                pids: JSON.stringify([appearsInPid]),
            });

            const articleNeids = new Set<string>();
            for (const value of propsResult.values ?? []) {
                if (value.pid === appearsInPid) {
                    articleNeids.add(String(value.value).padStart(20, '0'));
                }
            }

            if (articleNeids.size === 0) {
                relatedEntities.value = [];
                return;
            }

            const coAppearanceResult = await client.getPropertyValues({
                eids: JSON.stringify(Array.from(articleNeids).slice(0, 50)),
                pids: JSON.stringify([appearsInPid]),
            });

            const entityCounts = new Map<string, number>();
            for (const value of coAppearanceResult.values ?? []) {
                if (value.pid === appearsInPid) {
                    const entityNeid = String(value.value).padStart(20, '0');
                    if (entityNeid !== neid) {
                        entityCounts.set(entityNeid, (entityCounts.get(entityNeid) ?? 0) + 1);
                    }
                }
            }

            const topRelated = Array.from(entityCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([entityNeid]) => entityNeid);

            if (topRelated.length === 0) {
                relatedEntities.value = [];
                return;
            }

            const schema = await client.getSchema();
            const flavors = schema.schema?.flavors ?? (schema as any).flavors ?? [];
            const fidMap = new Map(flavors.map((f: any) => [f.fid ?? f.findex, f.name]));

            const entityPropsResult = await client.getPropertyValues({
                eids: JSON.stringify(topRelated),
                pids: JSON.stringify([namePid, 0]),
            });

            const entityMap = new Map<string, { name?: string; flavor?: string }>();
            for (const value of entityPropsResult.values ?? []) {
                if (!entityMap.has(value.eid)) {
                    entityMap.set(value.eid, {});
                }
                const data = entityMap.get(value.eid)!;

                if (value.pid === namePid) {
                    data.name = String(value.value);
                } else if (value.pid === 0) {
                    data.flavor = fidMap.get(Number(value.value)) ?? 'unknown';
                }
            }

            relatedEntities.value = topRelated
                .map((entityNeid) => {
                    const data = entityMap.get(entityNeid);
                    return {
                        neid: entityNeid,
                        name: data?.name ?? 'Unknown',
                        flavor: data?.flavor ?? 'unknown',
                    };
                })
                .filter((e) => e.name !== 'Unknown' && e.flavor !== 'article');
        } catch (err) {
            console.error('Error loading related entities:', err);
            relatedEntities.value = [];
        } finally {
            loadingRelated.value = false;
        }
    }

    onMounted(() => {
        loadEntity();
    });
</script>

<style scoped>
    .entity-page {
        min-height: 100vh;
        background: #0f1419;
    }

    .entity-header-card,
    .news-timeline-card,
    .sentiment-trend-card,
    .related-entities-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.02);
    }

    .stat-card {
        padding: 16px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        text-align: center;
    }

    .news-timeline-item {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.2s ease;
    }

    .news-timeline-item:hover {
        background: rgba(29, 161, 242, 0.1);
    }

    .news-timeline-item:last-child {
        border-bottom: none;
    }
</style>
