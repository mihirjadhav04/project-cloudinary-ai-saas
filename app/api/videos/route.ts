import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_: NextRequest) {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch videos." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
