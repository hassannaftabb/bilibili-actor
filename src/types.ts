export interface BilibiliAuthor {
    user_id: number;
    username: string;
}

export interface BilibiliContent {
    duration: number;
    publish_time: number;
}

export interface BilibiliEngagement {
    views: number;
    likes: number;
    coins: number;
    favorites: number;
    shares: number;
    engagement_rate: number;
}
export interface BilibiliInput {
    keywords: string[] | string;
    maxResults?: number;
    concurrency?: number;
    requestDelayMs?: number;
    headless?: boolean;
    includeComments?: boolean;
    mode?: 'videos' | 'creators' | 'both';
}

export interface BilibiliVideoData {
    video_id: string;
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    tags?: string[];
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

export interface BilibiliViewResponse {
    code: number;
    data?: {
        bvid: string;
        title: string;
        desc: string;
        pic: string;
        tid: number;
        tname: string;
        duration: number;
        pubdate: number;
        owner?: { mid: number; name: string };
        stat?: { view: number; like: number };
    };
}

export interface BilibiliStatResponse {
    code: number;
    data?: {
        view: number;
        like: number;
        coin: number;
        favorite: number;
        share: number;
    };
}
