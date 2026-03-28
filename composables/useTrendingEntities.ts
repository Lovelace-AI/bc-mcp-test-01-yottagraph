import { useElementalClient } from '@yottagraph-app/elemental-api/client';

export interface TrendingEntity {
    neid: string;
    name: string;
    flavor: string;
    mentionCount: number;
    avgSentiment: number;
    sentimentDirection: 'up' | 'down' | 'neutral';
}

export function useTrendingEntities() {
    const client = useElementalClient();
    const trending = ref<TrendingEntity[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastUpdate = ref<Date | null>(null);

    async function fetchTrending(limit = 10) {
        loading.value = true;
        error.value = null;

        try {
            const schema = await client.getSchema();
            const properties = schema.schema?.properties ?? (schema as any).properties ?? [];
            const flavors = schema.schema?.flavors ?? (schema as any).flavors ?? [];

            const pidMap = new Map(properties.map((p: any) => [p.name, p.pid]));
            const articleFlavor = flavors.find((f: any) => f.name === 'article');
            const articleFid = articleFlavor?.fid ?? articleFlavor?.findex ?? null;
            const appearsInPid = pidMap.get('appears_in') ?? null;
            const namePid = pidMap.get('name') ?? 8;
            const entitySentimentPid = pidMap.get('entity_sentiment') ?? null;

            if (!articleFid || !appearsInPid) {
                throw new Error('Schema not ready for trending calculation');
            }

            const articlesResult = await client.findEntities({
                expression: JSON.stringify({
                    type: 'is_type',
                    is_type: {
                        fid: articleFid,
                    },
                }),
                limit: 200,
            });

            const articleNeids = (articlesResult as any).eids ?? [];

            if (articleNeids.length === 0) {
                trending.value = [];
                lastUpdate.value = new Date();
                return;
            }

            const propsResult = await client.getPropertyValues({
                eids: JSON.stringify(articleNeids),
                pids: JSON.stringify([appearsInPid]),
                include_attributes: 'true',
            } as any);

            const entityMentions = new Map<
                string,
                { count: number; sentiments: number[]; flavor: string }
            >();

            for (const value of propsResult.values ?? []) {
                if (value.pid === appearsInPid) {
                    const entityNeid = String(value.value).padStart(20, '0');
                    const attrs = value.attributes ?? {};
                    const sentiment = attrs[entitySentimentPid ?? -1];

                    if (!entityMentions.has(entityNeid)) {
                        entityMentions.set(entityNeid, {
                            count: 0,
                            sentiments: [],
                            flavor: 'organization',
                        });
                    }

                    const mention = entityMentions.get(entityNeid)!;
                    mention.count += 1;
                    if (typeof sentiment === 'number') {
                        mention.sentiments.push(sentiment);
                    }
                }
            }

            const topEntities = Array.from(entityMentions.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, limit);

            if (topEntities.length === 0) {
                trending.value = [];
                lastUpdate.value = new Date();
                return;
            }

            const entityNeids = topEntities.map(([neid]) => neid);
            const entityPropsResult = await client.getPropertyValues({
                eids: JSON.stringify(entityNeids),
                pids: JSON.stringify([namePid]),
            });

            const entityNames = new Map<string, string>();
            for (const value of entityPropsResult.values ?? []) {
                if (value.pid === namePid && !entityNames.has(value.eid)) {
                    entityNames.set(value.eid, String(value.value));
                }
            }

            trending.value = topEntities
                .map(([neid, data]) => {
                    const avgSentiment =
                        data.sentiments.length > 0
                            ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length
                            : 0;

                    return {
                        neid,
                        name: entityNames.get(neid) ?? 'Unknown',
                        flavor: data.flavor,
                        mentionCount: data.count,
                        avgSentiment,
                        sentimentDirection: (avgSentiment > 0.1
                            ? 'up'
                            : avgSentiment < -0.1
                              ? 'down'
                              : 'neutral') as 'up' | 'down' | 'neutral',
                    };
                })
                .filter((e) => e.name !== 'Unknown');

            lastUpdate.value = new Date();
        } catch (err) {
            console.error('Error fetching trending entities:', err);
            error.value = err instanceof Error ? err.message : 'Failed to fetch trending entities';
            trending.value = [];
        } finally {
            loading.value = false;
        }
    }

    return {
        trending: readonly(trending),
        loading: readonly(loading),
        error: readonly(error),
        lastUpdate: readonly(lastUpdate),
        fetchTrending,
    };
}
