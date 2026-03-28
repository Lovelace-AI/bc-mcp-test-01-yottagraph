import { useElementalClient } from '@yottagraph-app/elemental-api/client';

export interface NewsArticle {
    neid: string;
    title: string;
    sentiment: number;
    entities: EntityMention[];
    publishedAt: string;
    source: string;
    sourceUrl: string;
    topics: string[];
}

export interface EntityMention {
    neid: string;
    name: string;
    flavor: string;
    sentiment: number;
}

export function useNewsData() {
    const client = useElementalClient();
    const articles = ref<NewsArticle[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastRefresh = ref<Date | null>(null);

    let articlePid: number | null = null;
    let titlePid: number | null = null;
    let sentimentPid: number | null = null;
    let appearsInPid: number | null = null;
    let entitySentimentPid: number | null = null;
    let topicPid: number | null = null;
    let newsdataIdPid: number | null = null;
    let namePid: number | null = null;

    async function initializeSchema() {
        const schema = await client.getSchema();

        console.log('[useNewsData] Schema response keys:', Object.keys(schema));
        console.log('[useNewsData] Has schema.schema?', !!schema.schema);
        console.log('[useNewsData] Has schema.flavors?', !!(schema as any).flavors);

        const properties = schema.schema?.properties ?? (schema as any).properties ?? [];
        const flavors = schema.schema?.flavors ?? (schema as any).flavors ?? [];

        console.log('[useNewsData] Flavors count:', flavors.length);
        console.log('[useNewsData] Properties count:', properties.length);

        const pidMap = new Map(properties.map((p: any) => [p.name, p.pid]));

        const articleFlavor = flavors.find((f: any) => f.name === 'article');
        console.log('[useNewsData] Article flavor found:', articleFlavor);

        // Use fid (from generated client) or findex (from direct API) - they're the same value
        articlePid = articleFlavor?.fid ?? articleFlavor?.findex ?? null;
        titlePid = pidMap.get('title') ?? null;
        sentimentPid = pidMap.get('sentiment') ?? null;
        appearsInPid = pidMap.get('appears_in') ?? null;
        entitySentimentPid = pidMap.get('entity_sentiment') ?? null;
        topicPid = pidMap.get('has_topic') ?? null;
        newsdataIdPid = pidMap.get('newsdata_id') ?? null;
        namePid = pidMap.get('name') ?? 8;

        console.log('[useNewsData] Initialized - articlePid:', articlePid, 'titlePid:', titlePid);
    }

    async function fetchLatestNews(limit = 50, category?: string) {
        loading.value = true;
        error.value = null;

        try {
            if (!articlePid) {
                await initializeSchema();
            }

            if (!articlePid) {
                throw new Error('Unable to find article entity type in schema');
            }

            // Simple is_type expression to get all articles
            // TODO: Category filtering requires different approach - topics may not be indexed for filtering
            const expression: any = {
                type: 'is_type',
                is_type: {
                    fid: articlePid,
                },
            };

            const result = await client.findEntities({
                expression: JSON.stringify(expression),
                limit,
            });

            const neids = (result as any).eids ?? [];

            if (neids.length === 0) {
                articles.value = [];
                lastRefresh.value = new Date();
                return;
            }

            const propsResult = await client.getPropertyValues({
                eids: JSON.stringify(neids),
                pids: JSON.stringify([
                    titlePid,
                    sentimentPid,
                    appearsInPid,
                    topicPid,
                    newsdataIdPid,
                ]),
                include_attributes: 'true',
            } as any);

            const articleMap = new Map<string, NewsArticle>();

            for (const value of propsResult.values ?? []) {
                const neid = value.eid;
                if (!articleMap.has(neid)) {
                    articleMap.set(neid, {
                        neid,
                        title: '',
                        sentiment: 0,
                        entities: [],
                        publishedAt: value.recorded_at ?? '',
                        source: '',
                        sourceUrl: '',
                        topics: [],
                    });
                }

                const article = articleMap.get(neid)!;

                if (value.pid === titlePid) {
                    article.title = String(value.value);
                } else if (value.pid === sentimentPid) {
                    article.sentiment = Number(value.value);
                } else if (value.pid === topicPid) {
                    if (!article.topics.includes(String(value.value))) {
                        article.topics.push(String(value.value));
                    }
                } else if (value.pid === appearsInPid) {
                    const entityNeid = String(value.value).padStart(20, '0');
                    const attrs = value.attributes ?? {};
                    const sentimentAttr = attrs[entitySentimentPid ?? -1];

                    if (attrs.url) {
                        article.sourceUrl = String(attrs.url);
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

                const entityData = new Map<
                    string,
                    { name?: string; sentiment?: number; flavor?: string }
                >();

                for (const value of entityPropsResult.values ?? []) {
                    const neid = value.eid;
                    if (!entityData.has(neid)) {
                        entityData.set(neid, {});
                    }
                    const data = entityData.get(neid)!;

                    if (value.pid === namePid) {
                        data.name = String(value.value);
                    } else if (value.pid === entitySentimentPid) {
                        data.sentiment = Number(value.value);
                    }
                }

                for (const value of propsResult.values ?? []) {
                    if (value.pid === appearsInPid) {
                        const articleNeid = value.eid;
                        const entityNeid = String(value.value).padStart(20, '0');
                        const article = articleMap.get(articleNeid);
                        const entity = entityData.get(entityNeid);

                        if (article && entity && entity.name) {
                            const attrs = value.attributes ?? {};
                            const sentiment =
                                attrs[entitySentimentPid ?? -1] ?? entity.sentiment ?? 0;

                            article.entities.push({
                                neid: entityNeid,
                                name: entity.name,
                                flavor: 'organization',
                                sentiment: Number(sentiment),
                            });
                        }
                    }
                }
            }

            articles.value = Array.from(articleMap.values()).sort((a, b) => {
                return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            });

            lastRefresh.value = new Date();
        } catch (err) {
            console.error('Error fetching news:', err);
            error.value = err instanceof Error ? err.message : 'Failed to fetch news';
            articles.value = [];
        } finally {
            loading.value = false;
        }
    }

    return {
        articles: readonly(articles),
        loading: readonly(loading),
        error: readonly(error),
        lastRefresh: readonly(lastRefresh),
        fetchLatestNews,
    };
}
