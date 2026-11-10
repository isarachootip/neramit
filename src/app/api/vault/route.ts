import { NextResponse } from "next/server";
import {
  loadServerVaultConfig,
  saveServerVaultConfig,
} from "@/repositories/server-vault-db";

export async function GET() {
  const vault = loadServerVaultConfig();
  return NextResponse.json({ vault });
}

export async function POST(request: Request) {
  try {
    const raw: unknown = await request.json();
    const vault = saveServerVaultConfig(raw);
    return NextResponse.json({ ok: true, vault });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save vault";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
