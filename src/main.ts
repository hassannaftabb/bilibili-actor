/**
 * Bilibili Trend Crawler (Apify Actor)
 * Purpose: Capture trends from Bilibili
 */

import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';
import pLimit from 'p-limit';
import type {
    BilibiliInput,
    BilibiliVideoData,
    BilibiliViewResponse,
    BilibiliStatResponse,
    BilibiliStats,
} from './types.js';

const VIEW_API = 'https://api.bilibili.com/x/web-interface/view';
const ARCHIVE_STAT_API = 'https://api.bilibili.com/x/web-interface/archive/stat';

await Actor.init();

try {
    const input = (await Actor.getInput<BilibiliInput>()) ?? ({} as BilibiliInput);
    console.info('🎬 INPUT LOADED:', input);

    let {
        keywords = ['原神'], // default keyword: "Genshin Impact"
        maxResults = 5,
        concurrency = 3,
        requestDelayMs = 400,
        headless = true,
    } = input;

    if (!Array.isArray(keywords)) {
        keywords = [String(keywords)].filter(Boolean);
    }

    maxResults = Math.max(1, Math.min(maxResults, 50));
    concurrency = Math.max(1, Math.min(concurrency, 10));
    requestDelayMs = Math.max(100, Math.min(requestDelayMs, 3000));

    if (!keywords.length) throw new Error('At least one keyword must be provided.');

    const limit = pLimit(concurrency);

    const stealthScript = `
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
    `;

    const crawler = new PlaywrightCrawler({
        launchContext: {
            launchOptions: {
                headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                ],
            },
        },
        maxConcurrency: concurrency,

        preNavigationHooks: [
            async ({ page }) => {
                try {
                    await page.addInitScript({ content: stealthScript });
                    await page.context().setExtraHTTPHeaders({
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                        Referer: 'https://www.bilibili.com/',
                    });
                    await page.setViewportSize({ width: 1366, height: 768 });
                } catch (err) {
                    console.warn('⚠️ Stealth setup failed:', (err as Error).message);
                }
            },
        ],

        requestHandler: async ({ page, request, log }) => {
            log.info(`🔍 Crawling: ${request.url}`);

            await page.waitForTimeout(1200);

            const anchors = await page.$$eval('a[href*="/video/"]', (els) =>
                els.map((a) => a.getAttribute('href'))
            );

            const bvids: string[] = [];
            for (const href of anchors) {
                if (!href) continue;
                const match = href.match(/BV[0-9A-Za-z]+/);
                if (match) bvids.push(match[0]);
            }

            const unique = Array.from(new Set(bvids)).slice(0, maxResults);
            log.info(`🎯 Found ${unique.length} candidate videos.`);

            await Promise.all(
                unique.map((bvid) =>
                    limit(async () => {
                        await new Promise((r) =>
                            setTimeout(r, requestDelayMs + Math.random() * 200)
                        );

                        try {
                            const headers = {
                                'User-Agent':
                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                                Referer: `https://www.bilibili.com/video/${bvid}`,
                                Origin: 'https://www.bilibili.com',
                                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                            };

                            const [viewResp, statResp] = await Promise.all([
                                page.request.get(VIEW_API, { params: { bvid }, headers }),
                                page.request.get(ARCHIVE_STAT_API, { params: { bvid }, headers }),
                            ]);

                            const viewJson = await viewResp.json().catch(() => null);
                            const statJson = await statResp.json().catch(() => null);

                            const view = viewJson as BilibiliViewResponse | null;
                            const stat = statJson as BilibiliStatResponse | null;

                            if (!view?.data && !stat?.data) {
                                log.warning(`⚠️ Skipping ${bvid}: invalid API response`);
                                return;
                            }
                            const vData: BilibiliViewResponse['data'] = view?.data ?? {
                                bvid: '',
                                title: '',
                                desc: '',
                                pic: '',
                                tid: 0,
                                tname: '',
                                duration: 0,
                                pubdate: 0,
                                owner: { mid: 0, name: '' },
                                stat: { view: 0, like: 0, coin: 0, favorite: 0, share: 0 },
                            };

                            const sData: BilibiliStatResponse['data'] = stat?.data ?? {
                                stat: { view: 0, like: 0, coin: 0, favorite: 0, share: 0 },
                            };

                            const mergedStat: BilibiliStats = {
                                ...(sData.stat ?? {}),
                                ...(vData.stat ?? {}),
                            };
                            const out: BilibiliVideoData = {
                                video_id: bvid,
                                url: `https://www.bilibili.com/video/${bvid}`,
                                title: vData.title || 'Untitled',
                                description: vData.desc || '',
                                thumbnail: vData.pic || '',
                                tags: vData.tname ? [vData.tname] : [],
                                author: {
                                    user_id: vData.owner?.mid ?? 0,
                                    username: vData.owner?.name ?? 'Unknown',
                                },
                                content: {
                                    duration: vData.duration ?? 0,
                                    publish_time: vData.pubdate ?? 0,
                                },
                                engagement: {
                                    views: mergedStat.view ?? 0,
                                    likes: mergedStat.like ?? 0,
                                    coins: mergedStat.coin ?? 0,
                                    favorites: mergedStat.favorite ?? 0,
                                    shares: mergedStat.share ?? 0,
                                    engagement_rate: 0,
                                },
                            };

                            const { likes, coins, favorites, views } = out.engagement;
                            out.engagement.engagement_rate =
                                (likes + coins + favorites) / Math.max(1, views);

                            await Actor.pushData(out);
                            log.info(`✅ Saved ${bvid}`);
                        } catch (err) {
                            log.warning(`❌ Failed processing ${bvid}: ${(err as Error).message}`);
                        }
                    })
                )
            );
        },

        failedRequestHandler: async ({ request, log }) => {
            log.warning(`🚫 Request failed after retries: ${request.url}`);
        },
    });

    const searchUrls = keywords.map(
        (kw) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(kw)}`
    );

    console.info('📦 Enqueuing search pages:', searchUrls);
    await crawler.run(searchUrls);

    console.info('🏁 Crawl completed successfully.');
} catch (err) {
    console.error('💥 Top-level error:', (err as Error).message);
}

await Actor.exit();
