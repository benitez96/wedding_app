// Server Component Wrapper - Fetchea data y la pasa al client component
import { getWeddingDate } from "@/lib/get-configurations";
import DateSectionClient from "./DateSection";
import { DateSectionSettings } from "./DateSection.metadata";

interface DateSectionProps {
  settings?: DateSectionSettings;
}

export default async function DateSection({ settings }: DateSectionProps) {
  const targetDate = await getWeddingDate();

  return <DateSectionClient settings={settings} targetDate={targetDate} />;
}
