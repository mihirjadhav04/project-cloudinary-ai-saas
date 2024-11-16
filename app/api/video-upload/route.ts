import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  bytes: number;
  duration?: number;
}

async function uploadToCloudinary(buffer: Buffer): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "cloudinary-ai-saas-uploads/videos",
        resource_type: "video",
        transformation: [{ quality: "auto", fetch_format: "mp4" }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as CloudinaryUploadResult);
        }
      }
    ).end(buffer);
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check environment variables
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary credentials not found!" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file || !title || !description || !originalSize) {
      return NextResponse.json({ error: "Missing required fields!" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer);

    // Save video details to the database
    const video = await prisma.video.create({
      data: {
        title,
        description,
        publicId: uploadResult.public_id,
        originalSize: originalSize,
        compressedSize: String(uploadResult.bytes),
        duration: uploadResult.duration || 0,
      },
    });

    return NextResponse.json({
      message: "Video uploaded successfully",
      data: video,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error uploading video file:", error.message);
      return NextResponse.json(
        { error: "Video upload failed", details: error.message },
        { status: 500 }
      );
    } else {
      // Handle unknown error type
      console.error("Error uploading video file: Unknown error type");
      return NextResponse.json(
        { error: "Video upload failed", details: "An unknown error occurred" },
        { status: 500 }
      );
    }
  } finally{
    await prisma.$disconnect()
  }
}
