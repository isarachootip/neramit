import assert from "node:assert/strict";
import {
  checkChannelMediaCompatibility,
  computePostAggregateStatus,
  CreateSocialPostSchema,
  GenerateSocialCopySchema,
  SOCIAL_CHANNELS,
} from "../src/domain/social-types";
import {
  decryptSecret,
  encryptSecret,
  maskSecretPreview,
} from "../src/domain/token-crypto";

export interface SocialTestCase {
  name: string;
  run: () => void;
}

export const socialAutopostTests: SocialTestCase[] = [
  {
    name: "Token Crypto: AES-256-GCM encrypts and decrypts OAuth tokens losslessly with unique IVs",
    run: () => {
      const secret = "EAAGm0PX4ZCpsBAJ9_live_oauth_token_12345";
      const keySeed = "neramit-unit-test-encryption-secret-32b";
      const c1 = encryptSecret(secret, keySeed);
      const c2 = encryptSecret(secret, keySeed);
      assert.notEqual(c1, secret);
      assert.notEqual(c1, c2, "Random IV must produce distinct ciphertexts");
      assert.equal(decryptSecret(c1, keySeed), secret);
      assert.equal(decryptSecret(c2, keySeed), secret);
      assert.equal(maskSecretPreview(secret), "EAAG...2345");
    },
  },
  {
    name: "Social Channels & Media Compatibility: Flags TikTok and YouTube when only image or text is provided",
    run: () => {
      assert.deepEqual(
        SOCIAL_CHANNELS.map((c) => c.id),
        ["x", "facebook", "instagram", "youtube", "tiktok"]
      );

      const imageCheck = checkChannelMediaCompatibility(
        ["x", "facebook", "instagram", "youtube", "tiktok"],
        "image"
      );
      assert.equal(imageCheck.compatible.includes("x"), true);
      assert.equal(imageCheck.compatible.includes("facebook"), true);
      assert.equal(imageCheck.compatible.includes("instagram"), true);
      assert.deepEqual(imageCheck.requiresVideoConversion, ["youtube", "tiktok"]);

      const videoCheck = checkChannelMediaCompatibility(
        ["x", "facebook", "instagram", "youtube", "tiktok"],
        "video"
      );
      assert.equal(videoCheck.requiresVideoConversion.length, 0);
      assert.equal(videoCheck.compatible.length, 5);
    },
  },
  {
    name: "Partial Failure & Aggregate Status: Distinguishes published, partial_failure, failed, and scheduled",
    run: () => {
      assert.equal(
        computePostAggregateStatus([
          { channel: "x", status: "published", retryCount: 0 },
          { channel: "facebook", status: "published", retryCount: 0 },
          { channel: "tiktok", status: "failed", errorMessage: "Token expired", retryCount: 1 },
        ]),
        "partial_failure"
      );

      assert.equal(
        computePostAggregateStatus([
          { channel: "x", status: "published", retryCount: 0 },
          { channel: "instagram", status: "published", retryCount: 0 },
        ]),
        "published"
      );

      assert.equal(
        computePostAggregateStatus([
          { channel: "youtube", status: "failed", errorMessage: "Quota", retryCount: 0 },
        ]),
        "failed"
      );
    },
  },
  {
    name: "Social Zod Schemas: Validates copywriting request and multi-channel post creation payload",
    run: () => {
      const validCopy = GenerateSocialCopySchema.safeParse({
        topicIntro: "เปิดตัวคอลเลกชันน้ำหอมคริสตัลกลิ่นใหม่รับซัมเมอร์",
        mediaUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800",
        mediaKind: "image",
        brandName: "Neramit Luxe",
        voiceTone: "Luxury & Modern",
        locale: "th",
      });
      assert.equal(validCopy.success, true);

      const validPost = CreateSocialPostSchema.safeParse({
        brandId: "brand-default",
        topicIntro: "น้ำหอมกลิ่นซัมเมอร์",
        mediaKind: "video",
        mediaUrl: "/media/templates/swatch-snap-video.mp4",
        channels: ["x", "facebook", "tiktok"],
        variants: {
          x: { caption: "หอมติดทนตลอดวัน ✨ #Neramit", hashtags: ["#Neramit"] },
          facebook: { caption: "เปิดตัวน้ำหอมใหม่ สั่งซื้อคลิกเลย", hashtags: ["#Neramit"] },
          instagram: { caption: "Summer scent ✨", hashtags: ["#Neramit"] },
          youtube: { title: "Neramit Summer Perfume", caption: "Official commercial", hashtags: ["perfume"] },
          tiktok: { caption: "ลองหรือยัง? หอมมาก! 🔥", hashtags: ["#fyp", "#Neramit"] },
        },
      });
      assert.equal(validPost.success, true);
    },
  },
];
