export interface BilibiliInput {
    keywords?: string[] | string;
    maxResults?: number;
    concurrency?: number;
    requestDelayMs?: number;
    headless?: boolean;
}

export interface BilibiliOwner {
    mid?: number;
    name?: string;
}

export interface BilibiliStats {
    view?: number;
    like?: number;
    coin?: number;
    favorite?: number;
    share?: number;
}

export interface BilibiliViewResponse {
    code: number;
    message: string;
    ttl: number;
    data?: {
        bvid: string;
        title: string;
        desc: string;
        pic: string;
        tid: number;
        tname: string;
        duration: number;
        pubdate: number;
        owner?: BilibiliOwner;
        stat?: BilibiliStats;
    };
}

export interface BilibiliStatResponse {
    code: number;
    message: string;
    ttl: number;
    data?: {
        stat?: BilibiliStats;
    };
}

export interface BilibiliVideoData {
    video_id: string;
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    tags: string[];
    author: {
        user_id: number;
        username: string;
    };
    content: {
        duration: number;
        publish_time: number;
    };
    engagement: {
        views: number;
        likes: number;
        coins: number;
        favorites: number;
        shares: number;
        engagement_rate: number;
    };
}
