import { useElementalClient } from '@yottagraph-app/elemental-api/client';

export interface SearchResult {
    neid: string;
    name: string;
    flavor: string;
    score: number;
}

export interface SearchResults {
    entities: SearchResult[];
    stories: {
        neid: string;
        title: string;
        publishedAt: string;
    }[];
}

export function useEntitySearch() {
    const client = useElementalClient();
    const results = ref<SearchResults>({ entities: [], stories: [] });
    const loading = ref(false);
    const error = ref<string | null>(null);
    const searchQuery = ref('');

    const debouncedQuery = refDebounced(searchQuery, 300);

    async function search(query: string) {
        if (!query || query.trim().length < 2) {
            results.value = { entities: [], stories: [] };
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const schema = await client.getSchema();
            const properties = schema.schema?.properties ?? (schema as any).properties ?? [];
            const flavors = schema.schema?.flavors ?? (schema as any).flavors ?? [];

            const pidMap = new Map(properties.map((p: any) => [p.name, p.pid]));
            const namePid = pidMap.get('name') ?? 8;
            const titlePid = pidMap.get('title') ?? null;
            const articleFid = flavors.find((f: any) => f.name === 'article')?.fid ?? null;

            const entityResults = await client.findEntities({
                expression: JSON.stringify({
                    type: 'comparison',
                    comparison: {
                        operator: 'string_like',
                        pid: namePid,
                        value: query,
                    },
                }),
                limit: 20,
            });

            const entityNeids = (entityResults as any).eids ?? [];

            let entities: SearchResult[] = [];
            if (entityNeids.length > 0) {
                const propsResult = await client.getPropertyValues({
                    eids: JSON.stringify(entityNeids),
                    pids: JSON.stringify([namePid]),
                });

                const entityMap = new Map<string, { name?: string }>();
                for (const value of propsResult.values ?? []) {
                    if (!entityMap.has(value.eid)) {
                        entityMap.set(value.eid, {});
                    }
                    const data = entityMap.get(value.eid)!;

                    if (value.pid === namePid) {
                        data.name = String(value.value);
                    }
                }

                const flavorPid = pidMap.get('flavor') ?? null;
                if (flavorPid) {
                    const flavorResult = await client.getPropertyValues({
                        eids: JSON.stringify(entityNeids),
                        pids: JSON.stringify([flavorPid]),
                    });

                    for (const value of flavorResult.values ?? []) {
                        const data = entityMap.get(value.eid);
                        if (data) {
                            const fid = Number(value.value);
                            (data as any).fid = fid;
                        }
                    }
                }

                const fidToFlavor = new Map(flavors.map((f: any) => [f.fid, f.name]));

                entities = Array.from(entityMap.entries())
                    .map(([neid, data]) => ({
                        neid,
                        name: data.name ?? 'Unknown',
                        flavor: fidToFlavor.get((data as any).fid ?? 0) ?? 'unknown',
                        score: 1.0,
                    }))
                    .filter((e) => e.name !== 'Unknown' && e.flavor !== 'article');
            }

            let stories: { neid: string; title: string; publishedAt: string }[] = [];
            if (articleFid && titlePid) {
                const storyResults = await client.findEntities({
                    expression: JSON.stringify({
                        type: 'and',
                        and: [
                            {
                                type: 'is_type',
                                is_type: {
                                    fid: articleFid,
                                },
                            },
                            {
                                type: 'comparison',
                                comparison: {
                                    operator: 'string_like',
                                    pid: titlePid,
                                    value: query,
                                },
                            },
                        ],
                    }),
                    limit: 10,
                });

                const storyNeids = (storyResults as any).eids ?? [];

                if (storyNeids.length > 0) {
                    const storyPropsResult = await client.getPropertyValues({
                        eids: JSON.stringify(storyNeids),
                        pids: JSON.stringify([titlePid]),
                    });

                    const storyMap = new Map<string, { title?: string; publishedAt?: string }>();
                    for (const value of storyPropsResult.values ?? []) {
                        if (!storyMap.has(value.eid)) {
                            storyMap.set(value.eid, { publishedAt: value.recorded_at });
                        }
                        const data = storyMap.get(value.eid)!;

                        if (value.pid === titlePid) {
                            data.title = String(value.value);
                        }
                    }

                    stories = Array.from(storyMap.entries())
                        .map(([neid, data]) => ({
                            neid,
                            title: data.title ?? 'Untitled',
                            publishedAt: data.publishedAt ?? '',
                        }))
                        .filter((s) => s.title !== 'Untitled');
                }
            }

            results.value = { entities, stories };
        } catch (err) {
            console.error('Error searching:', err);
            error.value = err instanceof Error ? err.message : 'Search failed';
            results.value = { entities: [], stories: [] };
        } finally {
            loading.value = false;
        }
    }

    watch(debouncedQuery, (newQuery) => {
        search(newQuery);
    });

    function setQuery(query: string) {
        searchQuery.value = query;
    }

    return {
        results: readonly(results),
        loading: readonly(loading),
        error: readonly(error),
        searchQuery: readonly(searchQuery),
        setQuery,
        search,
    };
}
