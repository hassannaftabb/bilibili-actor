// =====================================
// Bilibili Trend Crawler (Apify Actor)
// Purpose: Capture youth/fandom/meme culture trends from Bilibili
// =====================================

import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import pLimit from 'p-limit';

const VIEW_API = 'https://api.bilibili.com/x/web-interface/view';
const ARCHIVE_STAT_API =
  'https://api.bilibili.com/x/web-interface/archive/stat';

// ---- lifecycle ----
await Actor.init();

try {
  const input = (await Actor.getInput()) ?? {};
  console.info('INPUT LOADED', input);

  const {
    keywords = ['原神'], // Default keyword: "Genshin Impact"
    maxResults = 5,
    concurrency = 3,
    requestDelayMs = 400,
    headless = true,
  } = input;

  const dataset = await Actor.openDataset();
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
    maxConcurrency: Math.max(1, concurrency),

    preNavigationHooks: [
      async ({ page }) => {
        try {
          await page.addInitScript({ content: stealthScript });
          await page.context().setExtraHTTPHeaders({
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            Referer: 'https://www.bilibili.com/',
          });
          await page.setViewportSize({ width: 1366, height: 768 });
        } catch (e) {
          console.warn('Stealth setup failed:', e.message);
        }
      },
    ],

    requestHandler: async ({ page, request, log }) => {
      log.info(`Crawling ${request.url}`);

      await page.waitForTimeout(1200); // allow SPA rendering

      // Extract all <a href="/video/BV...">
      const anchors = await page.$$eval('a[href*="/video/"]', (els) =>
        els.map((a) => a.getAttribute('href'))
      );

      const bvids = [];
      for (const href of anchors) {
        if (!href) continue;
        const match = href.match(/BV[0-9A-Za-z]+/);
        if (match) bvids.push(match[0]);
      }

      const unique = Array.from(new Set(bvids)).slice(0, maxResults);
      log.info(`Found ${unique.length} candidate videos on search page.`);

      // Process each video
      await Promise.all(
        unique.map((bvid) =>
          limit(async () => {
            await new Promise((r) =>
              setTimeout(r, requestDelayMs + Math.random() * 200)
            );
            try {
              const [viewResp, statResp] = await Promise.all([
                page.request.get(VIEW_API, { params: { bvid } }),
                page.request.get(ARCHIVE_STAT_API, { params: { bvid } }),
              ]);

              const view = await viewResp.json().catch(() => null);
              const stat = await statResp.json().catch(() => null);

              const viewData = view?.data ?? {};
              const statData = stat?.data ?? {};

              const out = {
                video_id: bvid,
                url: `https://www.bilibili.com/video/${bvid}`,
                title: viewData.title,
                description: viewData.desc,
                thumbnail: viewData.pic,
                tags: viewData.tid ? [viewData.tname] : [],
                author: {
                  user_id: viewData.owner?.mid,
                  username: viewData.owner?.name,
                },
                content: {
                  duration: viewData.duration,
                  publish_time: viewData.pubdate,
                },
                engagement: {
                  views: statData.view || viewData.stat?.view || 0,
                  likes: statData.like || viewData.stat?.like || 0,
                  coins: statData.coin || 0,
                  favorites: statData.favorite || 0,
                  shares: statData.share || 0,
                },
              };

              out.engagement.engagement_rate =
                ((out.engagement.likes || 0) +
                  (out.engagement.coins || 0) +
                  (out.engagement.favorites || 0)) /
                Math.max(1, out.engagement.views || 1);

              await Dataset.pushData(out);
              log.info(`Saved ${bvid}`);
            } catch (err) {
              log.warning(`Failed processing ${bvid}: ${err.message}`);
            }
          })
        )
      );
    },

    failedRequestHandler: async ({ request, log }) => {
      log.warning(`Request ${request.url} failed too many times`);
    },
  });

  const searchUrls = keywords.map(
    (kw) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(kw)}`
  );

  console.info('Enqueuing search pages', { count: searchUrls.length });
  await crawler.run(searchUrls);

  console.info('Crawler run finished.');
} catch (err) {
  console.error('Top-level error', err);
}

await Actor.exit();
