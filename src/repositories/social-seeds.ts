import {
  BrandProfileRecord,
  SocialChannelId,
  SocialPostRecord,
  StoredChannelCredential,
} from "../domain/social-types";

function makeDefaultChannels(prefix: string): Record<SocialChannelId, StoredChannelCredential> {
  const now = new Date().toISOString();
  return {
    x: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}_x`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    facebook: { connected: true, authMode: "dry_run", accountHandle: `${prefix} Official Page`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    instagram: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}.ig`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    youtube: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}Shorts`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
    tiktok: { connected: true, authMode: "dry_run", accountHandle: `@${prefix}.tiktok`, encryptedAccessToken: "", dryRun: true, updatedAt: now },
  };
}

export const INITIAL_BRAND_PROFILES: BrandProfileRecord[] = [
  {
    id: "brand-neramit",
    name: "Neramit Official",
    voiceTone: "Modern Luxury, Inspiring, Creative Tech",
    defaultHashtags: ["#NeramitAI", "#AICreative", "#DigitalMarketing"],
    channels: makeDefaultChannels("neramit"),
  },
  {
    id: "brand-sparkpop",
    name: "SparkPop Soda",
    voiceTone: "Playful Korean Pop, Energetic, Youthful",
    defaultHashtags: ["#SparkPop", "#7DayOOTD", "#สดชื่นทุกสไตล์"],
    channels: makeDefaultChannels("sparkpop"),
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
    channels: ["x", "facebook", "instagram", "youtube", "tiktok"],
    variants: {
      x: { caption: "หมุนตัวเดียว เปลี่ยนครบ 4 เฉดสี! ✨ เบื้องหลังงานแฟชั่นช็อตเดียวจบด้วย Neramit AI", hashtags: ["#NeramitAI", "#SwatchSnap"] },
      facebook: { caption: "ยกระดับภาพลักษณ์แบรนด์แฟชั่นของคุณด้วยวิดีโอโฆษณา Swatch Snap ช็อตเดียวเปลี่ยนสีสินค้าครบทุกคอลเลกชัน ทดลองสร้างแคมเปญของคุณได้แล้ววันนี้!", hashtags: ["#NeramitAI", "#FashionTech"], callToAction: "คลิกลิงก์เพื่อทดลองสตูดิโอ" },
      instagram: { caption: "4 shades in 1 seamless spin ✨ Which color matches your vibe today?", hashtags: ["#NeramitAI", "#ReelsFashion", "#OOTD"] },
      youtube: { title: "Swatch Snap 4-Color Fashion Reveal | Neramit AI Shorts", caption: "Seamless one-take commercial video rendered in 1080p.", hashtags: ["NeramitAI", "Shorts", "FashionAd"] },
      tiktok: { caption: "ช็อตเดียวเปลี่ยน 4 สี ทำยังไงไปดู! 🔥✨", hashtags: ["#fyp", "#NeramitAI", "#สายแฟชั่น"] },
    },
    results: [
      { channel: "x", status: "published", externalPostUrl: "https://x.com/neramit_x/status/1900101", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), retryCount: 0 },
      { channel: "facebook", status: "published", externalPostUrl: "https://facebook.com/neramit/posts/99102", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), retryCount: 0 },
      { channel: "instagram", status: "published", externalPostUrl: "https://instagram.com/p/DNeramit01", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), retryCount: 0 },
      { channel: "youtube", status: "published", externalPostUrl: "https://youtube.com/shorts/NeramitYT01", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), retryCount: 0 },
      { channel: "tiktok", status: "published", externalPostUrl: "https://tiktok.com/@neramit.tiktok/video/7401992", modeUsed: "dry_run", publishedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(), retryCount: 0 },
    ],
  },
];
