import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File not found!" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult: CloudinaryUploadResult = await new Promise(
      (resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "cloudinary-ai-saas-uploads" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          }
        ).end(buffer);
      }
    );

    return NextResponse.json({
      message: "File uploaded successfully",
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error uploading file:", error.message);
      return NextResponse.json(
        { error: "File upload failed", details: error.message },
        { status: 500 }
      );
    } else {
      // Handle unknown error type
      console.error("Error uploading file: Unknown error type");
      return NextResponse.json(
        { error: "File upload failed", details: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

