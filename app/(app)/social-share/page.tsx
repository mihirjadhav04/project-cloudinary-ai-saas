"use client"

import React, { useState, useEffect, useRef } from 'react';
import { CldImage } from 'next-cloudinary'; // Cloudinary component to render images

// Predefined social media image formats with their dimensions and aspect ratios
const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
  "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
  "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
};

// Define the type for SocialFormat as keys of the `socialFormats` object
type SocialFormat = keyof typeof socialFormats;

export default function SocialShare() {
  // State to store the uploaded image's public ID
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // State to store the selected format for image transformation
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>("Instagram Square (1:1)");

  // State to handle upload and transformation status
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  // Ref to the transformed image for downloading purposes
  const imageRef = useRef<HTMLImageElement>(null);

  // Effect to track changes in format or uploaded image, triggering transformation loading state
  useEffect(() => {
    if (uploadedImage) {
      setIsTransforming(true);
    }
  }, [selectedFormat, uploadedImage]);

  // Function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Get the uploaded file
    if (!file) return;

    setIsUploading(true); // Start the uploading process
    const formData = new FormData();
    formData.append("file", file); // Append file to FormData for the POST request

    try {
      // Send the file to the backend for upload
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json(); // Get the Cloudinary public ID from the response
      setUploadedImage(data.publicId); // Store the uploaded image's public ID
    } catch (error) {
      console.log(error);
      alert("Failed to upload image"); // Show error message
    } finally {
      setIsUploading(false); // Stop the uploading process
    }
  };

  // Function to download the transformed image
  const handleDownload = () => {
    if (!imageRef.current) return;

    // Fetch the image URL as a blob and trigger the download
    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob); // Create a downloadable URL
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedFormat.replace(/\s+/g, "_").toLowerCase()}.png`; // Set download file name
        document.body.appendChild(link);
        link.click(); // Trigger download
        document.body.removeChild(link); // Clean up
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Social Media Image Creator</h1>

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Upload an Image</h2>

          {/* File Upload Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Choose an image file</span>
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="file-input file-input-bordered file-input-primary w-full"
            />
          </div>

          {/* Show progress bar during uploading */}
          {isUploading && (
            <div className="mt-4">
              <progress className="progress progress-primary w-full"></progress>
            </div>
          )}

          {/* Image transformation section */}
          {uploadedImage && (
            <div className="mt-6">
              <h2 className="card-title mb-4">Select Social Media Format</h2>

              {/* Dropdown for selecting social media format */}
              <div className="form-control">
                <select
                  className="select select-bordered w-full"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as SocialFormat)}
                >
                  {Object.keys(socialFormats).map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Preview Section */}
              <div className="mt-6 relative">
                <h3 className="text-lg font-semibold mb-2">Preview:</h3>
                <div className="flex justify-center">
                  {isTransforming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50 z-10">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  )}
                  {/* Render the transformed image */}
                  <CldImage
                    width={socialFormats[selectedFormat].width}
                    height={socialFormats[selectedFormat].height}
                    src={uploadedImage}
                    sizes="100vw"
                    alt="transformed image"
                    crop="fill"
                    aspectRatio={socialFormats[selectedFormat].aspectRatio}
                    gravity="auto"
                    ref={imageRef}
                    onLoad={() => setIsTransforming(false)} // Stop loading spinner on load
                  />
                </div>
              </div>

              {/* Download Button */}
              <div className="card-actions justify-end mt-6">
                <button className="btn btn-primary" onClick={handleDownload}>
                  Download for {selectedFormat}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
