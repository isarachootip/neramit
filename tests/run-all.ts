import assert from "node:assert/strict";
import {
  calculateGenerationTokens,
  estimateAudioScriptTokens,
} from "../src/domain/token-pricing";
import {
  extractReferenceTags,
  insertReferenceTag,
  syncPromptWithReferences,
  enhanceCreativePrompt,
  rollPromptIdea,
} from "../src/domain/rich-prompt-engine";
import {
  validateGenerationInput,
  validateAudioGenerationInput,
  validateTemplateExecutionInput,
} from "../src/domain/studio-schemas";
import { ALL_STUDIO_MODELS, getModelBySlug } from "../src/domain/models-video-data";
import { GENWHY_TEMPLATES } from "../src/domain/templates-data";

interface TestCase {
  name: string;
  run: () => void;
}

const tests: TestCase[] = [
  {
    name: "Catalog: Contains 9 Image models, 11 Video models, and 7 Video Ad Templates",
    run: () => {
      const imageModels = ALL_STUDIO_MODELS.filter((m) => m.output === "image");
      const videoModels = ALL_STUDIO_MODELS.filter((m) => m.output === "video");
      assert.equal(imageModels.length, 9, "Should have 9 GenWhy Image models");
      assert.equal(videoModels.length, 11, "Should have 11 GenWhy Video models");
      assert.equal(GENWHY_TEMPLATES.length, 7, "Should have 7 GenWhy Video Templates");
    },
  },
  {
    name: "Pricing: Calculates Image tokens with resolution, batch count, and layer decomposition",
    run: () => {
      const seedreamLite = getModelBySlug("seedream-5-lite");
      assert.ok(seedreamLite, "seedream-5-lite exists");

      const base2k = calculateGenerationTokens(seedreamLite, {
        size: "2K",
        num_images: 1,
        sequential: false,
      });
      const four4k = calculateGenerationTokens(seedreamLite, {
        size: "4K",
        num_images: 4,
        sequential: false,
      });
      assert.ok(four4k > base2k * 4, "4K x 4 images costs more than 4x 2K single image");

      const seedreamPro = getModelBySlug("seedream-5-pro");
      assert.ok(seedreamPro, "seedream-5-pro exists");
      const normalPro = calculateGenerationTokens(seedreamPro, {
        size: "1K",
        num_images: 1,
        layer_decomposition: false,
        thinking: false,
      });
      const layeredPro = calculateGenerationTokens(seedreamPro, {
        size: "1K",
        num_images: 1,
        layer_decomposition: true,
        thinking: true,
      });
      assert.ok(layeredPro > normalPro, "16-layer decomposition + thinking increases token cost");
    },
  },
  {
    name: "Pricing: Calculates Video tokens proportional to duration, resolution, and audio multiplier",
    run: () => {
      const seedance15 = getModelBySlug("seedance-1-5-pro");
      assert.ok(seedance15, "seedance-1-5-pro exists");

      const clip5sNoAudio = calculateGenerationTokens(seedance15, {
        mode: "t2v",
        resolution: "720p",
        duration: 5,
        audio: false,
      });
      const clip5sWithAudio = calculateGenerationTokens(seedance15, {
        mode: "t2v",
        resolution: "720p",
        duration: 5,
        audio: true,
      });
      assert.equal(clip5sWithAudio, clip5sNoAudio * 2, "Audio doubles Seedance 1.5 Pro cost");

      const clip10s = calculateGenerationTokens(seedance15, {
        mode: "t2v",
        resolution: "720p",
        duration: 10,
        audio: false,
      });
      assert.equal(clip10s, clip5sNoAudio * 2, "10s clip costs 2x 5s clip");
    },
  },
  {
    name: "Pricing: Estimates Seed Audio 1.0 duration and token cost from script",
    run: () => {
      const emptyEst = estimateAudioScriptTokens("");
      assert.equal(emptyEst.seconds, 0);
      assert.equal(emptyEst.tokens, 0);

      const sampleEst = estimateAudioScriptTokens(
        "สวัสดีครับ ยินดีต้อนรับเข้าสู่ GenWhy Studio ระบบสร้างสื่อโฆษณาด้วย AI"
      );
      assert.ok(sampleEst.seconds >= 3, "Estimates realistic spoken duration");
      assert.ok(sampleEst.tokens >= 10, "Estimates positive token cost");
    },
  },
  {
    name: "Rich Prompt Engine: Extracts and inserts @img-N and @AudioN pills cleanly",
    run: () => {
      const prompt = "Use @img-1 as product hero and match lighting from @img-2 with @Audio1 voice";
      const tags = extractReferenceTags(prompt);
      assert.deepEqual(tags, ["@img-1", "@img-2", "@Audio1"]);

      const inserted = insertReferenceTag("Cinematic close-up of bottle", "@img-1");
      assert.equal(inserted, "Cinematic close-up of bottle @img-1 ");

      const synced = syncPromptWithReferences(
        "Show @img-1 next to @img-2 and @img-3 in neon rain",
        1
      );
      assert.equal(synced.includes("@img-1"), true);
      assert.equal(synced.includes("@img-2"), false);
      assert.equal(synced.includes("@img-3"), false);
    },
  },
  {
    name: "Rich Prompt Engine: Enhances prompts with presets and rolls diverse ideas",
    run: () => {
      const enhanced = enhanceCreativePrompt("A luxury perfume bottle on wet obsidian", "cinematic-35mm");
      assert.ok(enhanced.length > 38, "Enhanced prompt adds camera/lighting directives");
      assert.ok(enhanced.includes("35mm"), "Includes 35mm preset descriptor");

      const idea = rollPromptIdea("video", "th");
      assert.ok(idea.length > 15, "Rolls a non-empty Thai video prompt idea");
    },
  },
  {
    name: "Zod Schemas: Enforces boundary validation for Image, Video modes, Audio, and Templates",
    run: () => {
      const validImg = validateGenerationInput({
        modelSlug: "seedream-5-lite",
        output: "image",
        prompt: "A minimalist ceramic cup with matcha foam, morning sunlight @img-1",
        aspectRatio: "1:1",
        resolution: "2K",
        numImages: 2,
        referenceImages: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600"],
      });
      assert.equal(validImg.success, true);

      const invalidVideoI2v = validateGenerationInput({
        modelSlug: "seedance-2-5",
        output: "video",
        mode: "i2v",
        prompt: "Camera orbits slowly around the subject",
        resolution: "1080p",
        duration: 5,
        referenceImages: [],
      });
      assert.equal(invalidVideoI2v.success, false, "i2v without first_frame reference image must fail");

      const validAudio = validateAudioGenerationInput({
        mode: "voice",
        prompt: "สวัสดีทุกคน วันนี้เรามีคอลเลกชันใหม่มาแนะนำ",
        voiceId: "th-female-nicha",
        format: "mp3",
        speechRate: 0,
        loudnessRate: 0,
        pitchRate: 0,
        subtitles: true,
      });
      assert.equal(validAudio.success, true);

      const validTemplate = validateTemplateExecutionInput({
        templateSlug: "swatch-snap",
        answers: {
          producttype: "กระเป๋า",
          character: "A women",
          characterdetailed: "Indigo Bob",
        },
        slotImages: {
          product: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
        },
        aspectRatio: "9:16",
      });
      assert.equal(validTemplate.success, true);
    },
  },
];

let passed = 0;
for (const test of tests) {
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

console.log(`\n🎉 All ${passed}/${tests.length} domain test suites passed!`);
