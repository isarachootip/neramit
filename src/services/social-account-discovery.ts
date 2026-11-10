import { DiscoveredSocialTarget, SocialChannelId } from "../domain/social-types";
import { decryptSecret } from "../domain/token-crypto";
import { getBrandProfileById } from "../repositories/social-db";

function buildSimulatedTargets(brandName: string, channel: SocialChannelId): DiscoveredSocialTarget[] {
  const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "neramit";
  const presets: Record<SocialChannelId, DiscoveredSocialTarget[]> = {
    x: [{ id: `x-${slug}-01`, label: `${brandName} Official X`, handle: `@${slug}_official` }],
    facebook: [
      { id: "104928192019201", label: `${brandName} Official Page`, handle: `${brandName} Page` },
      { id: "104928192019888", label: `${brandName} Community Store`, handle: `${brandName} Store` },
    ],
    instagram: [
      { id: "17841405822304914", label: `IG Business · @${slug}.official`, handle: `@${slug}.official` },
    ],
    youtube: [{ id: `UC_${slug}_shorts`, label: `${brandName} Shorts Channel`, handle: `@${slug}Shorts` }],
    tiktok: [{ id: `tt_${slug}_creator`, label: `TikTok · @${slug}.tiktok`, handle: `@${slug}.tiktok` }],
    line: [{ id: `@${slug}_oa`, label: `LINE OA · ${brandName} Official`, handle: `@${slug}_oa` }],
    linkedin: [
      { id: `urn:li:organization:9910283`, label: `${brandName} Company Page`, handle: `${slug}-company` },
      { id: `urn:li:person:8819201`, label: `${brandName} Founder Profile`, handle: `${slug}-founder` },
    ],
    threads: [{ id: "259102910291", label: `Threads · @${slug}.threads`, handle: `@${slug}.threads` }],
    telegram: [
      { id: `@${slug}_channel`, label: `Telegram Channel · @${slug}_channel`, handle: `@${slug}_channel` },
      { id: `-1002192839182`, label: `${brandName} VIP Broadcast Group`, handle: `@${slug}_vip` },
    ],
  };
  return presets[channel];
}

export async function discoverSocialChannelTargets(
  brandId: string,
  channel: SocialChannelId,
  overrideToken?: string
): Promise<{ targets: DiscoveredSocialTarget[]; source: "live_api" | "preset_discovery" }> {
  const brand = getBrandProfileById(brandId);
  const brandName = brand?.name ?? "Neramit";
  const storedCred = brand?.channels[channel];
  const token =
    overrideToken?.trim() ||
    (storedCred?.encryptedAccessToken ? decryptSecret(storedCred.encryptedAccessToken) : "");

  if (!token) {
    return { targets: buildSimulatedTargets(brandName, channel), source: "preset_discovery" };
  }

  try {
    if (channel === "facebook" || channel === "instagram") {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          name: string;
          access_token?: string;
          instagram_business_account?: { id: string; username?: string };
        }>;
      };
      if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
        if (channel === "facebook") {
          return {
            source: "live_api",
            targets: json.data.map((p) => ({
              id: p.id,
              label: `FB Page · ${p.name} (${p.id})`,
              handle: p.name,
              accessToken: p.access_token,
            })),
          };
        }
        const igTargets = json.data
          .filter((p) => Boolean(p.instagram_business_account?.id))
          .map((p) => ({
            id: p.instagram_business_account!.id,
            label: `IG Business · @${p.instagram_business_account!.username ?? p.name}`,
            handle: `@${p.instagram_business_account!.username ?? p.name}`,
            accessToken: p.access_token,
          }));
        if (igTargets.length > 0) return { source: "live_api", targets: igTargets };
      }
    }

    if (channel === "threads") {
      const res = await fetch(
        `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const json = (await res.json()) as { id?: string; username?: string };
      if (res.ok && json.id) {
        return {
          source: "live_api",
          targets: [{ id: json.id, label: `Threads · @${json.username ?? json.id}`, handle: `@${json.username ?? json.id}` }],
        };
      }
    }

    if (channel === "linkedin") {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      });
      const json = (await res.json()) as { sub?: string; name?: string };
      if (res.ok && json.sub) {
        return {
          source: "live_api",
          targets: [{ id: `urn:li:person:${json.sub}`, label: `LinkedIn · ${json.name ?? json.sub}`, handle: json.name ?? json.sub }],
        };
      }
    }

    if (channel === "line") {
      const res = await fetch("https://api.line.me/v2/bot/info", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      });
      const json = (await res.json()) as { userId?: string; basicId?: string; displayName?: string };
      if (res.ok && (json.basicId || json.userId)) {
        const handle = json.basicId ?? json.userId ?? "@line_oa";
        return {
          source: "live_api",
          targets: [{ id: handle, label: `LINE OA · ${json.displayName ?? handle}`, handle }],
        };
      }
    }

    if (channel === "telegram") {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        signal: AbortSignal.timeout(15000),
      });
      const json = (await res.json()) as { ok?: boolean; result?: { username?: string; first_name?: string } };
      if (res.ok && json.ok && json.result?.username) {
        return {
          source: "live_api",
          targets: [{ id: `@${json.result.username}`, label: `Bot Ready · @${json.result.username} (ใส่ @channel ปลายทางได้)`, handle: `@${json.result.username}` }],
        };
      }
    }
  } catch {
    // Fallback to preset discovery when network or token scope is restricted
  }

  return { targets: buildSimulatedTargets(brandName, channel), source: "preset_discovery" };
}
