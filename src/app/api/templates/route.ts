import { NextResponse } from "next/server";
import { GENWHY_TEMPLATES } from "@/domain/templates-data";

export async function GET() {
  return NextResponse.json({
    items: GENWHY_TEMPLATES,
    total: GENWHY_TEMPLATES.length,
  });
}
