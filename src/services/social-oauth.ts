import { SocialChannelId } from "../domain/social-types";

interface OAuthPlatformSpec {
  authUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string;
}

const OAUTH_SPECS: Record<SocialChannelId, OAuthPlatformSpec> = {
  x: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    scopes: "tweet.read tweet.write users.read offline.access",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    scopes: "pages_show_list,pages_read_engagement,pages_manage_posts",
  },
  instagram: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    scopes: "instagram_basic,instagram_content_publish,pages_show_list",
  },
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: "https://www.googleapis.com/auth/youtube.upload",
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    scopes: "user.info.basic,video.publish",
  },
  line: {
    authUrl: "https://access.line.me/oauth2/v2.1/authorize",
    tokenUrl: "https://api.line.me/oauth2/v2.1/token",
    clientIdEnv: "LINE_CHANNEL_ID",
    clientSecretEnv: "LINE_CHANNEL_SECRET",
    scopes: "profile openid",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scopes: "openid profile w_member_social",
  },
  threads: {
    authUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    clientIdEnv: "THREADS_APP_ID",
    clientSecretEnv: "THREADS_APP_SECRET",
    scopes: "threads_basic,threads_content_publish",
  },
  telegram: {
    authUrl: "https://oauth.telegram.org/auth",
    tokenUrl: "https://api.telegram.org",
    clientIdEnv: "TELEGRAM_BOT_TOKEN",
    clientSecretEnv: "TELEGRAM_BOT_TOKEN",
    scopes: "channel:post",
  },
};

export function buildOAuthAuthorizeRedirect(
  platform: SocialChannelId,
  brandId: string,
  baseOrigin: string
): { redirectUrl: string; missingEnv?: string } {
  const spec = OAUTH_SPECS[platform];
  const clientId = process.env[spec.clientIdEnv]?.trim();
  if (!clientId) {
    return {
      redirectUrl: `${baseOrigin}/social?oauth_notice=missing_env&env=${spec.clientIdEnv}&platform=${platform}`,
      missingEnv: spec.clientIdEnv,
    };
  }

  const callbackUri = `${baseOrigin}/api/oauth/${platform}/callback`;
  const state = Buffer.from(JSON.stringify({ brandId, platform })).toString("base64url");
  const params = new URLSearchParams({
    response_type: "code",
    redirect_uri: callbackUri,
    scope: spec.scopes,
    state,
  });

  if (platform === "tiktok") params.set("client_key", clientId);
  else params.set("client_id", clientId);

  if (platform === "youtube") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }
  if (platform === "x") {
    params.set("code_challenge", "neramit_pkce_plain_challenge");
    params.set("code_challenge_method", "plain");
  }

  return { redirectUrl: `${spec.authUrl}?${params.toString()}` };
}

export async function exchangeOAuthCodeForTokens(
  platform: SocialChannelId,
  code: string,
  baseOrigin: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  const spec = OAUTH_SPECS[platform];
  const clientId = process.env[spec.clientIdEnv]?.trim() ?? "";
  const clientSecret = process.env[spec.clientSecretEnv]?.trim() ?? "";
  const callbackUri = `${baseOrigin}/api/oauth/${platform}/callback`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUri,
  });

  if (platform === "tiktok") {
    body.set("client_key", clientId);
    body.set("client_secret", clientSecret);
  } else {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }
  if (platform === "x") {
    body.set("code_verifier", "neramit_pkce_plain_challenge");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (platform === "x" && clientId && clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  }

  const res = await fetch(spec.tokenUrl, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(20000),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    error_description?: string;
    error?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description ?? json.error ?? `OAuth exchange HTTP ${res.status}`);
  }
  return { accessToken: json.access_token, refreshToken: json.refresh_token };
}
