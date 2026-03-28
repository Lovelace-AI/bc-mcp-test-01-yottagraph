<template>
    <div class="search-page">
        <v-container class="py-8">
            <v-row justify="center">
                <v-col cols="12" md="10">
                    <v-btn to="/" variant="text" prepend-icon="mdi-arrow-left" class="mb-4">
                        Back to Feed
                    </v-btn>

                    <v-card variant="outlined" class="search-card">
                        <v-card-text class="pa-6">
                            <v-text-field
                                :model-value="searchQuery"
                                placeholder="Search for entities or stories..."
                                prepend-inner-icon="mdi-magnify"
                                variant="outlined"
                                hide-details
                                autofocus
                                @update:model-value="setQuery"
                            />
                        </v-card-text>
                    </v-card>

                    <div v-if="loading" class="mt-6">
                        <v-skeleton-loader type="list-item-three-line" class="mb-4" />
                        <v-skeleton-loader type="list-item-three-line" class="mb-4" />
                    </div>

                    <div v-else-if="searchQuery && searchQuery.length >= 2">
                        <v-card
                            v-if="results.entities.length > 0"
                            variant="outlined"
                            class="results-card mt-6"
                        >
                            <v-card-title>Entities</v-card-title>
                            <v-divider />
                            <v-list density="compact" class="pa-0">
                                <v-list-item
                                    v-for="entity in results.entities"
                                    :key="entity.neid"
                                    :to="`/entity/${entity.neid}`"
                                    class="result-item"
                                >
                                    <template #prepend>
                                        <v-avatar color="primary" size="40">
                                            <v-icon icon="mdi-account-box-outline" />
                                        </v-avatar>
                                    </template>

                                    <v-list-item-title class="font-weight-medium">
                                        {{ entity.name }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ entity.flavor }}
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card>

                        <v-card
                            v-if="results.stories.length > 0"
                            variant="outlined"
                            class="results-card mt-6"
                        >
                            <v-card-title>Stories</v-card-title>
                            <v-divider />
                            <v-list density="compact" class="pa-0">
                                <v-list-item
                                    v-for="story in results.stories"
                                    :key="story.neid"
                                    :to="`/story/${story.neid}`"
                                    class="result-item"
                                >
                                    <template #prepend>
                                        <v-avatar color="primary" size="40">
                                            <v-icon icon="mdi-newspaper-variant-outline" />
                                        </v-avatar>
                                    </template>

                                    <v-list-item-title class="font-weight-medium">
                                        {{ story.title }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ formatDate(story.publishedAt) }}
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card>

                        <v-card
                            v-if="results.entities.length === 0 && results.stories.length === 0"
                            variant="outlined"
                            class="results-card mt-6 pa-8 text-center"
                        >
                            <v-icon icon="mdi-magnify-close" size="64" color="grey" class="mb-4" />
                            <div class="text-h6 text-grey">No results found</div>
                            <div class="text-caption text-grey">Try different search terms</div>
                        </v-card>
                    </div>

                    <v-card v-else variant="outlined" class="results-card mt-6 pa-8 text-center">
                        <v-icon icon="mdi-magnify" size="64" color="grey" class="mb-4" />
                        <div class="text-h6 text-grey">Start searching</div>
                        <div class="text-caption text-grey">
                            Enter at least 2 characters to search
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup lang="ts">
    import { useEntitySearch } from '~/composables/useEntitySearch';

    const { results, loading, searchQuery, setQuery } = useEntitySearch();

    function formatDate(dateString: string) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }
</script>

<style scoped>
    .search-page {
        min-height: 100vh;
        background: #0f1419;
    }

    .search-card,
    .results-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.02);
    }

    .result-item {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.2s ease;
    }

    .result-item:hover {
        background: rgba(29, 161, 242, 0.1);
    }

    .result-item:last-child {
        border-bottom: none;
    }
</style>
