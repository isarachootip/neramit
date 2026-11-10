import assert from "node:assert/strict";
import {
  applyInboundWebhookToPost,
  checkChannelMediaCompatibility,
  computePostAggregateStatus,
  createEmptyCopyVariants,
  CreateSocialPostSchema,
  GenerateSocialCopySchema,
  InboundAutoPostWebhookSchema,
  shouldRouteViaAutoPostBridge,
  SOCIAL_CHANNELS,
  SocialPostRecord,
} from "../src/domain/social-types";
import {
  decryptSecret,
  encryptSecret,
  maskSecretPreview,
  signHmacSha256,
  verifyHmacSha256,
} from "../src/domain/token-crypto";

export interface SocialTestCase {
  name: string;
  run: () => void;
}

export const socialAutopostTests: SocialTestCase[] = [
  {
    name: "Token Crypto: AES-256-GCM encryption and HMAC-SHA256 webhook signature verification",
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

      const body = JSON.stringify({ postId: "sp-1", channel: "line", status: "published" });
      const sig = signHmacSha256(body, "vibepost-bridge-secret");
      assert.equal(verifyHmacSha256(body, sig, "vibepost-bridge-secret"), true);
      assert.equal(verifyHmacSha256(body, "sha256=invalid", "vibepost-bridge-secret"), false);
    },
  },
  {
    name: "9-Channel Registry & Media Compatibility: Validates X, FB, IG, YouTube, TikTok, LINE, LinkedIn, Threads, Telegram",
    run: () => {
      assert.deepEqual(
        SOCIAL_CHANNELS.map((c) => c.id),
        ["x", "facebook", "instagram", "youtube", "tiktok", "line", "linkedin", "threads", "telegram"]
      );

      const imageCheck = checkChannelMediaCompatibility(
        ["x", "facebook", "instagram", "youtube", "tiktok", "line", "linkedin", "threads", "telegram"],
        "image"
      );
      assert.equal(imageCheck.compatible.includes("line"), true);
      assert.equal(imageCheck.compatible.includes("linkedin"), true);
      assert.equal(imageCheck.compatible.includes("threads"), true);
      assert.equal(imageCheck.compatible.includes("telegram"), true);
      assert.deepEqual(imageCheck.requiresVideoConversion, ["youtube", "tiktok"]);
    },
  },
  {
    name: "Hybrid Auto-Post Bridge Routing: Routes via bridge_primary, bridge_fallback, or direct_only accurately",
    run: () => {
      const bridgeCfg = {
        enabled: true,
        provider: "vibepost" as const,
        endpointUrl: "https://vibepost.online/api/autopost",
        encryptedBridgeKey: "enc:key",
        encryptedWebhookSecret: "enc:sec",
        routingMode: "bridge_fallback" as const,
      };
      const dryRunCred = {
        connected: true,
        authMode: "dry_run" as const,
        accountHandle: "@neramit",
        encryptedAccessToken: "",
        dryRun: true,
        updatedAt: new Date().toISOString(),
      };
      const liveCred = {
        ...dryRunCred,
        authMode: "oauth" as const,
        encryptedAccessToken: "enc:live",
        dryRun: false,
      };

      assert.equal(shouldRouteViaAutoPostBridge(bridgeCfg, dryRunCred), true);
      assert.equal(shouldRouteViaAutoPostBridge(bridgeCfg, liveCred), false);
      assert.equal(
        shouldRouteViaAutoPostBridge({ ...bridgeCfg, routingMode: "bridge_primary" }, liveCred),
        true
      );
      assert.equal(
        shouldRouteViaAutoPostBridge({ ...bridgeCfg, routingMode: "direct_only" }, dryRunCred),
        false
      );
    },
  },
  {
    name: "Inbound Webhook Status Sync: Updates channel delivery status and recomputes aggregate post status",
    run: () => {
      const basePost: SocialPostRecord = {
        id: "spost-webhook-test",
        brandId: "brand-neramit",
        brandName: "Neramit Official",
        createdAt: new Date().toISOString(),
        status: "partial_failure",
        topicIntro: "Auto-Post Webhook Test",
        mediaKind: "image",
        channels: ["x", "line"],
        variants: createEmptyCopyVariants("Test copy"),
        results: [
          { channel: "x", status: "published", retryCount: 0 },
          { channel: "line", status: "failed", errorMessage: "Pending webhook", retryCount: 0 },
        ],
      };

      const parsedWebhook = InboundAutoPostWebhookSchema.safeParse({
        postId: "spost-webhook-test",
        channel: "line",
        status: "published",
        externalPostId: "line-bcast-99",
        externalPostUrl: "https://line.me/R/ti/p/@neramit",
      });
      assert.equal(parsedWebhook.success, true);

      if (parsedWebhook.success) {
        const updated = applyInboundWebhookToPost(basePost, parsedWebhook.data);
        assert.equal(updated.status, "published");
        const lineRes = updated.results.find((r) => r.channel === "line");
        assert.equal(lineRes?.status, "published");
        assert.equal(lineRes?.externalPostUrl, "https://line.me/R/ti/p/@neramit");
        assert.equal(lineRes?.modeUsed, "autopost_bridge");
      }
    },
  },
  {
    name: "Social Zod Schemas: Validates 9-channel post creation and copywriting payloads",
    run: () => {
      const validCopy = GenerateSocialCopySchema.safeParse({
        topicIntro: "เปิดตัวคอลเลกชันน้ำหอมคริสตัลกลิ่นใหม่รับซัมเมอร์",
        mediaKind: "image",
        brandName: "Neramit Luxe",
        locale: "th",
      });
      assert.equal(validCopy.success, true);

      const validPost = CreateSocialPostSchema.safeParse({
        brandId: "brand-neramit",
        topicIntro: "น้ำหอมกลิ่นซัมเมอร์",
        mediaKind: "video",
        mediaUrl: "/media/templates/swatch-snap-video.mp4",
        channels: ["x", "line", "linkedin", "threads", "telegram"],
        variants: createEmptyCopyVariants("หอมติดทนตลอดวัน ✨"),
      });
      assert.equal(validPost.success, true);
      assert.equal(
        computePostAggregateStatus([
          { channel: "x", status: "published", retryCount: 0 },
          { channel: "telegram", status: "failed", retryCount: 1 },
        ]),
        "partial_failure"
      );
    },
  },
];
