import {
  AutoPostBridgeConfig,
  BrandProfileRecord,
  estimateProgressiveMetrics,
  SocialChannelId,
  SocialPostRecord,
  StoredChannelCredential,
} from "../domain/social-types";

export function makeDefaultChannels(prefix: string): Record<SocialChannelId, StoredChannelCredential> {
  const now = new Date().toISOString();
  return {
    x: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}_x`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    facebook: { connected: true, authMode: "dry_run", accountHandle: `${prefix} Official Page`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    instagram: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}.ig`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    youtube: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}Shorts`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    tiktok: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}.tiktok`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    line: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}_oa`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    linkedin: { connected: true, authMode: "dry_run", accountHandle: `${prefix}-company`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    threads: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}.threads`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    telegram: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}_channel`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
  };
}

export function makeDefaultBridgeConfig(): AutoPostBridgeConfig {
  return {
    enabled: false,
    provider: "vibepost",
    endpointUrl: "https://vibepost.online/api/autopost",
    encryptedBridgeKey: "",
    encryptedWebhookSecret: "",
    routingMode: "bridge_fallback",
  };
}

export const INITIAL_BRAND_PROFILES: BrandProfileRecord[] = [
  {
    id: "brand-neramit",
    name: "Neramit Official",
    voiceTone: "Modern Luxury, Inspiring, Creative Tech",
    defaultHashtags: ["#NeramitAI", "#AICreative", "#DigitalMarketing"],
    channels: makeDefaultChannels("neramit"),
    bridge: makeDefaultBridgeConfig(),
  },
  {
    id: "brand-sparkpop",
    name: "SparkPop Soda",
    voiceTone: "Playful Korean Pop, Energetic, Youthful",
    defaultHashtags: ["#SparkPop", "#7DayOOTD", "#สดชื่นทุกสไตล์"],
    channels: makeDefaultChannels("sparkpop"),
    bridge: makeDefaultBridgeConfig(),
  },
];

export const INITIAL_SOCIAL_POSTS: SocialPostRecord[] = [
  {
    id: "spost-seed-1",
    brandId: "brand-neramit",
    brandName: "Neramit Official",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "published",
    topicIntro: "เปิดตัวคอลเลกชันแฟชั่น Swatch Snap เปลี่ยนลุค 4 สไตล์ในช็อตเดียวด้วย AI",
    mediaKind: "video",
    mediaUrl: "/media/templates/swatch-snap-video.mp4",
    channels: ["x", "facebook", "instagram", "youtube", "tiktok", "line", "threads"],
    variants: {
      x: { caption: "หมุนตัวเดียว เปลี่ยนครบ 4 เฉดสี! ✨ เบื้องหลังงานแฟชั่นช็อตเดียวจบด้วย Neramit AI", hashtags: ["#NeramitAI", "#SwatchSnap"] },
      facebook: { caption: "ยกระดับภาพลักษณ์แบรนด์แฟชั่นของคุณด้วยวิดีโอโฆษณา Swatch Snap ช็อตเดียวเปลี่ยนสีสินค้าครบทุกคอลเลกชัน ทดลองสร้างแคมเปญของคุณได้แล้ววันนี้!", hashtags: ["#NeramitAI", "#FashionTech"], callToAction: "คลิกลิงก์เพื่อทดลองสตูดิโอ" },
      instagram: { caption: "4 shades in 1 seamless spin ✨ Which color matches your vibe today?", hashtags: ["#NeramitAI", "#ReelsFashion", "#OOTD"] },
      youtube: { title: "Swatch Snap 4-Color Fashion Reveal | Neramit AI Shorts", caption: "Seamless one-take commercial video rendered in 1080p.", hashtags: ["NeramitAI", "Shorts", "FashionAd"] },
      tiktok: { caption: "ช็อตเดียวเปลี่ยน 4 สี ทำยังไงไปดู! 🔥✨", hashtags: ["#fyp", "#NeramitAI", "#สายแฟชั่น"] },
      line: { caption: "✨ คอลเลกชันใหม่ Swatch Snap มาแล้ว! ชมวิดีโอเปิดตัว 4 เฉดสีพิเศษพร้อมโปรโมชั่นเฉพาะเพื่อนใน LINE OA", hashtags: ["#NeramitAI"], callToAction: "กดสั่งซื้อผ่านแชตนี้รับส่วนลดทันที" },
      linkedin: { caption: "Transforming fashion e-commerce production with AI-driven Swatch Snap one-take video synthesis.", hashtags: ["#NeramitAI", "#RetailTech", "#GenerativeAI"] },
      threads: { caption: "หมุนตัวเดียวได้ครบ 4 สีเลย ชอบสีไหนสุดในเซ็ตนี้บอกหน่อย 👇✨", hashtags: ["#NeramitAI", "#ThreadsFashion"] },
      telegram: { caption: "🚀 อัปเดตแคมเปญ Swatch Snap วิดีโอ 4 เฉดสีพร้อมดาวน์โหลดไปใช้งานต่อในคอมมูนิตี้", hashtags: ["#NeramitAI"] },
    },
    results: [
      { channel: "x", status: "published", remoteState: "live_verified", externalPostUrl: "https://x.com/neramit_x/status/1900101", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), metrics: estimateProgressiveMetrics("x", "video", new Date(Date.now() - 1000 * 60 * 44).toISOString(), "seed-x"), retryCount: 0 },
      { channel: "facebook", status: "published", remoteState: "live_verified", externalPostUrl: "https://facebook.com/neramit/posts/99102", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), metrics: estimateProgressiveMetrics("facebook", "video", new Date(Date.now() - 1000 * 60 * 44).toISOString(), "seed-fb"), retryCount: 0 },
      { channel: "instagram", status: "published", remoteState: "live_verified", externalPostUrl: "https://instagram.com/p/DNeramit01", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), metrics: estimateProgressiveMetrics("instagram", "video", new Date(Date.now() - 1000 * 60 * 44).toISOString(), "seed-ig"), retryCount: 0 },
      { channel: "youtube", status: "published", remoteState: "live_verified", externalPostUrl: "https://youtube.com/shorts/NeramitYT01", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), metrics: estimateProgressiveMetrics("youtube", "video", new Date(Date.now() - 1000 * 60 * 44).toISOString(), "seed-yt"), retryCount: 0 },
      { channel: "tiktok", status: "published", remoteState: "live_verified", externalPostUrl: "https://tiktok.com/@neramit.tiktok/video/7401992", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), metrics: estimateProgressiveMetrics("tiktok", "video", new Date(Date.now() - 1000 * 60 * 44).toISOString(), "seed-tt"), retryCount: 0 },
      { channel: "line", status: "published", remoteState: "live_verified", externalPostUrl: "https://line.me/R/ti/p/@neramit_oa", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), metrics: estimateProgressiveMetrics("line", "video", new Date(Date.now() - 1000 * 60 * 44).toISOString(), "seed-ln"), retryCount: 0 },
      { channel: "threads", status: "published", remoteState: "live_verified", externalPostUrl: "https://www.threads.net/@neramit.threads", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), metrics: estimateProgressiveMetrics("threads", "video", new Date(Date.now() - 1000 * 60 * 44).toISOString(), "seed-th"), retryCount: 0 },
    ],
  },
];
