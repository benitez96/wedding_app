"use client";

import type { ChangeEvent } from "react";
import { useState, useRef } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (url: string, mediaType: "image" | "video") => void;
  label?: string;
  description?: string;
  currentMediaType?: "image" | "video";
}

export function ImageUpload({
  currentImageUrl,
  onImageChange,
  label = "Imagen o Video",
  description = "Subir imagen (JPG, PNG, WebP) o video (MP4, WebM, MOV - Máx. 20MB)",
  currentMediaType = "image",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    currentImageUrl,
  );
  const [mediaType, setMediaType] = useState<"image" | "video">(
    currentMediaType,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    // Crear preview local
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      // Subir archivo
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/backoffice/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      // Actualizar con URL real y tipo de media
      setPreviewUrl(data.url);
      setMediaType(data.mediaType);
      onImageChange(data.url, data.mediaType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
      setPreviewUrl(currentImageUrl);
    } finally {
      // ✅ SIEMPRE limpiar el object URL (evita memory leak)
      URL.revokeObjectURL(localPreview);
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setMediaType("image");
    onImageChange("", "image");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div>
          <label className="text-sm font-medium">{label}</label>
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                {mediaType === "video" ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-cover"
                    aria-label="Preview del video"
                  >
                    Tu navegador no soporta videos
                  </video>
                ) : (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    loading="lazy"
                    unoptimized={previewUrl.startsWith("blob:")}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<X className="w-4 h-4" />}
                  onPress={handleRemove}
                  isDisabled={isUploading}
                >
                  Eliminar
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Upload className="w-4 h-4" />}
                  onPress={() => fileInputRef.current?.click()}
                  isDisabled={isUploading}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-12 h-12 text-gray-400" />
              <div className="text-sm text-gray-600">
                {isUploading
                  ? "Subiendo..."
                  : "Click para seleccionar imagen o video"}
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </CardBody>
      </Card>
    </div>
  );
}
