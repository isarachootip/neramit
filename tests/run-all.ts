import assert from "node:assert/strict";
import { calculateGenerationTokens, estimateAudioScriptTokens } from "../src/domain/token-pricing";
import { extractReferenceTags, insertReferenceTag, syncPromptWithReferences, enhanceCreativePrompt, rollPromptIdea } from "../src/domain/rich-prompt-engine";
import { validateGenerationInput, validateAudioGenerationInput, validateTemplateExecutionInput } from "../src/domain/studio-schemas";
import { ALL_STUDIO_MODELS, getModelBySlug } from "../src/domain/models-video-data";
import { NERAMIT_TEMPLATES, NERAMIT_PRICING_PACKAGES } from "../src/domain/templates-data";
import { detectAtMentionQuery, applyAtMentionSelection, buildChainedStageState, settleQueueJobRefund, validateApiKeyVault } from "../src/domain/neramit-vault-types";
import { providerRouterTests } from "./provider-router.test";
import { socialAutopostTests } from "./social-autopost.test";

interface TestCase {
  name: string;
  run: () => void;
}

const tests: TestCase[] = [
  {
    name: "Catalog & Brand Hygiene: 9 Image models, 11 Video models, 7 Neramit Templates, zero legacy aliases",
    run: () => {
      const imageModels = ALL_STUDIO_MODELS.filter((m) => m.output === "image");
      const videoModels = ALL_STUDIO_MODELS.filter((m) => m.output === "video");
      assert.equal(imageModels.length, 9);
      assert.equal(videoModels.length, 11);
      assert.equal(NERAMIT_TEMPLATES.length, 7);
      assert.equal(NERAMIT_PRICING_PACKAGES.length, 5);
      for (const m of ALL_STUDIO_MODELS) {
        assert.equal(m.name.startsWith("neramit/"), true, `Expected neramit/ alias on ${m.slug}`);
      }
      for (const tpl of NERAMIT_TEMPLATES) {
        assert.equal(tpl.modelAlias.startsWith("neramit/"), true);
        assert.equal(tpl.thumbnailUrl.startsWith("/media/templates/"), true);
        assert.equal(tpl.coverVideoUrl.startsWith("/media/templates/"), true);
      }
    },
  },
  {
    name: "Pricing: Calculates Image tokens with resolution, batch count, and layer decomposition",
    run: () => {
      const seedreamLite = getModelBySlug("seedream-5-lite");
      assert.ok(seedreamLite);
      const base2k = calculateGenerationTokens(seedreamLite, { size: "2K", num_images: 1 });
      const four4k = calculateGenerationTokens(seedreamLite, { size: "4K", num_images: 4 });
      assert.ok(four4k > base2k * 4);

      const seedreamPro = getModelBySlug("seedream-5-pro");
      assert.ok(seedreamPro);
      const normalPro = calculateGenerationTokens(seedreamPro, { size: "1K", layer_decomposition: false });
      const layeredPro = calculateGenerationTokens(seedreamPro, { size: "1K", layer_decomposition: true, thinking: true });
      assert.ok(layeredPro > normalPro);
    },
  },
  {
    name: "Pricing: Calculates Video tokens proportional to duration, resolution, and audio multiplier",
    run: () => {
      const seedance15 = getModelBySlug("seedance-1-5-pro");
      assert.ok(seedance15);
      const clip5sNoAudio = calculateGenerationTokens(seedance15, { mode: "t2v", resolution: "720p", duration: 5, audio: false });
      const clip5sWithAudio = calculateGenerationTokens(seedance15, { mode: "t2v", resolution: "720p", duration: 5, audio: true });
      assert.equal(clip5sWithAudio, clip5sNoAudio * 2);
    },
  },
  {
    name: "Pricing: Estimates Seed Audio 1.0 duration and token cost from script",
    run: () => {
      const sampleEst = estimateAudioScriptTokens("สวัสดีครับ ยินดีต้อนรับเข้าสู่ Neramit AI ระบบสร้างสื่อโฆษณาอัจฉริยะ");
      assert.ok(sampleEst.seconds >= 3);
      assert.ok(sampleEst.tokens >= 10);
    },
  },
  {
    name: "Rich Prompt Engine: Extracts, inserts, syncs @img/@video/@audio pills and enhances prompts",
    run: () => {
      const tags = extractReferenceTags("Use @img-1 as product hero with @video-1 motion and @Audio1 voice");
      assert.deepEqual(tags, ["@img-1", "@video-1", "@Audio1"]);
      assert.equal(insertReferenceTag("Close-up of bottle", "@img-1"), "Close-up of bottle @img-1 ");
      const synced = syncPromptWithReferences("Show @img-1 next to @img-2", 1);
      assert.equal(synced.includes("@img-1"), true);
      assert.equal(synced.includes("@img-2"), false);
      assert.ok(enhanceCreativePrompt("Perfume bottle", "cinematic-35mm").includes("35mm"));
      assert.ok(rollPromptIdea("video", "th").length > 10);
    },
  },
  {
    name: "Neramit @-Autocomplete & Pipeline Chaining: Detects @ query, inserts chip, and chains Image -> Video",
    run: () => {
      const q = detectAtMentionQuery("Camera orbits around @im");
      assert.equal(q, "im");
      const replaced = applyAtMentionSelection("Camera orbits around @im", "@img-1");
      assert.equal(replaced, "Camera orbits around @img-1 ");

      const chained = buildChainedStageState({
        sourceTurnId: "seed-turn-1",
        sourceModelTitle: "Seedream 5 Pro",
        mediaUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1000",
        targetStage: "video",
        layerLabel: "Layer 02 · Primary Product Hero",
      });
      assert.equal(chained.targetStage, "video");
      assert.equal(chained.mode, "i2v");
      assert.equal(chained.referenceImages[0], "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1000");
      assert.ok(chained.lineageLabel.includes("Seedream 5 Pro"));
      assert.ok(chained.prompt.includes("@img-1"));
    },
  },
  {
    name: "Neramit Queue Auto-Refund & API Vault: Refunds 100% tokens on failed job and validates API keys",
    run: () => {
      const refund = settleQueueJobRefund({
        jobId: "job-1",
        tokensReserved: 120,
        status: "failed",
      });
      assert.equal(refund.refundedTokens, 120);
      assert.equal(refund.netCharged, 0);

      const vault = validateApiKeyVault({
        engineMode: "hybrid",
        geminiApiKey: "AIzaSyMockKey123",
        openaiApiKey: "",
        falApiKey: "",
      });
      assert.equal(vault.success, true);
    },
  },
  {
    name: "Zod Schemas: Enforces boundary validation for Image, Video modes, Audio, and Templates",
    run: () => {
      const validImg = validateGenerationInput({
        modelSlug: "seedream-5-lite",
        output: "image",
        prompt: " Ceramic cup @img-1",
        aspectRatio: "1:1",
        resolution: "2K",
        numImages: 1,
        referenceImages: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600"],
      });
      assert.equal(validImg.success, true);

      const invalidVideoI2v = validateGenerationInput({
        modelSlug: "seedance-2-5",
        output: "video",
        mode: "i2v",
        prompt: "Orbit camera",
        resolution: "1080p",
        duration: 5,
        referenceImages: [],
      });
      assert.equal(invalidVideoI2v.success, false);
      assert.equal(
        validateAudioGenerationInput({ mode: "voice", prompt: "สวัสดี", voiceId: "th-female-nicha" }).success,
        true
      );
      assert.equal(
        validateTemplateExecutionInput({
          templateSlug: "swatch-snap",
          answers: { producttype: "กระเป๋า" },
          slotImages: { product: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600" },
        }).success,
        true
      );
    },
  },
];

let passed = 0;
const allSuites = [...tests, ...providerRouterTests, ...socialAutopostTests];
for (const test of allSuites) {
  try {
    test.run();
    console.log(`✅ PASS: ${test.name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${test.name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log(`\n🎉 All ${passed}/${allSuites.length} Neramit AI domain test suites passed!`);
