// Server Component Wrapper - Fetchea data y la pasa al client component
import { getPhotoUploadUrl } from "@/lib/get-configurations";
import PhotoUploadSectionClient from "./PhotoUploadSection";
import { PhotoUploadSectionSettings } from "./PhotoUploadSection.metadata";

interface PhotoUploadSectionProps {
  settings?: PhotoUploadSectionSettings;
}

export default async function PhotoUploadSection({
  settings,
}: PhotoUploadSectionProps) {
  const photoUploadUrl = await getPhotoUploadUrl();

  return (
    <PhotoUploadSectionClient
      settings={settings}
      photoUploadUrl={photoUploadUrl}
    />
  );
}
