<template>
    <div class="home-page">
        <v-container fluid class="pa-0">
            <v-row no-gutters>
                <v-col cols="12" md="9" class="main-content">
                    <div class="px-4 py-6">
                        <div class="d-flex align-center justify-space-between mb-6">
                            <div>
                                <h1 class="text-h3 font-weight-bold mb-2">Live Feed</h1>
                                <p class="text-grey">
                                    Real-time news intelligence across markets and industries
                                </p>
                            </div>

                            <v-btn
                                icon="mdi-refresh"
                                variant="text"
                                :loading="loading"
                                @click="refresh"
                            />
                        </div>

                        <CategoryTabs v-model="selectedCategory" class="mb-6" />

                        <div v-if="loading && articles.length === 0" class="loading-state">
                            <v-skeleton-loader type="card" class="mb-4" />
                            <v-skeleton-loader type="card" class="mb-4" />
                            <v-skeleton-loader type="card" class="mb-4" />
                        </div>

                        <div v-else-if="error" class="error-state">
                            <v-alert type="error" variant="outlined">
                                {{ error }}
                            </v-alert>
                        </div>

                        <div v-else-if="articles.length === 0" class="empty-state">
                            <v-card variant="outlined" class="pa-8 text-center">
                                <v-icon
                                    icon="mdi-newspaper-variant-outline"
                                    size="64"
                                    color="grey"
                                    class="mb-4"
                                />
                                <div class="text-h6 text-grey">No news available</div>
                                <div class="text-caption text-grey">
                                    Check back soon for updates
                                </div>
                            </v-card>
                        </div>

                        <div v-else>
                            <HeroStoryCard v-if="heroStory" :article="heroStory" class="mb-6" />

                            <div class="news-feed">
                                <NewsCard
                                    v-for="article in feedArticles"
                                    :key="article.neid"
                                    :article="article"
                                    class="mb-4"
                                />
                            </div>
                        </div>

                        <div v-if="lastRefresh" class="text-center text-caption text-grey mt-4">
                            Last updated {{ refreshTime }}
                        </div>
                    </div>
                </v-col>

                <v-col cols="12" md="3" class="sidebar-content d-none d-md-block">
                    <div class="pa-4">
                        <TrendingSidebar />
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup lang="ts">
    import { useNewsData } from '~/composables/useNewsData';
    import { Pref } from '~/composables/usePrefsStore';

    const { articles, loading, error, lastRefresh, fetchLatestNews } = useNewsData();
    const { userId } = useUserState();
    const { appId } = useRuntimeConfig().public;

    const categoryPref = new Pref<string>(
        `/users/${userId.value}/apps/${appId}/settings/pulse`,
        'selectedCategory',
        'All'
    );

    const selectedCategory = ref('All');

    watch(selectedCategory, (newCategory) => {
        categoryPref.set(newCategory);
        fetchLatestNews(50, newCategory);
    });

    const heroStory = computed(() => {
        if (articles.value.length === 0) return null;
        return articles.value.reduce((best, current) => {
            const bestScore = Math.abs(best.sentiment) + best.entities.length;
            const currentScore = Math.abs(current.sentiment) + current.entities.length;
            return currentScore > bestScore ? current : best;
        }, articles.value[0]);
    });

    const feedArticles = computed(() => {
        if (!heroStory.value) return articles.value;
        return articles.value.filter((a) => a.neid !== heroStory.value!.neid);
    });

    const refreshTime = computed(() => {
        if (!lastRefresh.value) return '';

        const now = new Date();
        const diff = now.getTime() - lastRefresh.value.getTime();
        const seconds = Math.floor(diff / 1000);

        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    });

    function refresh() {
        fetchLatestNews(50, selectedCategory.value);
    }

    onMounted(async () => {
        await categoryPref.initialize();
        selectedCategory.value = categoryPref.r.value;

        fetchLatestNews(50, selectedCategory.value);

        const intervalId = setInterval(() => {
            fetchLatestNews(50, selectedCategory.value);
        }, 60 * 1000);

        onUnmounted(() => {
            clearInterval(intervalId);
        });
    });
</script>

<style scoped>
    .home-page {
        min-height: 100vh;
        background: #0f1419;
    }

    .main-content {
        border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sidebar-content {
        background: rgba(0, 0, 0, 0.2);
    }

    .news-feed {
        animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
