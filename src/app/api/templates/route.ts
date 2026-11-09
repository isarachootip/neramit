import { NextResponse } from "next/server";
import { NERAMIT_TEMPLATES } from "@/domain/templates-data";

export async function GET() {
  return NextResponse.json({
    items: NERAMIT_TEMPLATES,
    total: NERAMIT_TEMPLATES.length,
  });
}
