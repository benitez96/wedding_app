# Sections System Guide

Invify uses a **dynamic sections system** that allows each invitation to be composed of configurable, reorderable components.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    INVITATION PAGE                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HeroSection (settings: {title, showCountdown})     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DateSection (settings: {format, showCalendar})     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CeremonySection (settings: {time, venue, maps})    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  RSVPSection (settings: {collectMenu, dietary})     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

## Available Sections

| Key             | Name          | Repeatable | Description                          |
| --------------- | ------------- | ---------- | ------------------------------------ |
| `hero`          | Hero          | No         | Main header with names and countdown |
| `date`          | Date          | No         | Event date with calendar add button  |
| `ceremony`      | Ceremony      | No         | Ceremony venue and time              |
| `celebration`   | Celebration   | No         | Reception venue and time             |
| `rsvp`          | RSVP          | No         | Guest response form                  |
| `gift`          | Gifts         | No         | Gift registry information            |
| `dress_code`    | Dress Code    | No         | Attire suggestions                   |
| `accommodation` | Accommodation | No         | Hotel recommendations                |
| `instagram`     | Instagram     | No         | Event hashtag                        |
| `photo_upload`  | Photo Upload  | No         | Guest photo submission               |
| `qr`            | QR Code       | No         | Check-in QR code                     |
| `quote`         | Quote         | No         | Decorative quote                     |
| `divider`       | Divider       | **Yes**    | Visual separator between sections    |

---

## Section Architecture

### File Structure

Each section follows this structure:

```
components/sections/
├── HeroSection/
│   ├── HeroSection.tsx           # Main component
│   ├── HeroSection.metadata.ts   # Metadata + settings schema
│   ├── HeroSectionSettings.tsx   # Backoffice settings form
│   └── index.ts                  # Barrel export
├── CeremonySection/
│   └── ...
└── metadata.ts                   # Auto-generated registry
```

### Metadata Definition

Each section exports metadata that describes its capabilities:

```typescript
// components/sections/HeroSection/HeroSection.metadata.ts
import { z } from "zod";

export const HeroSettingsSchema = z.object({
  title: z.string().default("Save the Date"),
  subtitle: z.string().optional(),
  showCountdown: z.boolean().default(true),
  backgroundImage: z.url().optional(),
});

export type HeroSettings = z.infer<typeof HeroSettingsSchema>;

export const HeroSectionMetadata = {
  key: "hero" as const,
  name: "Hero",
  description: "Main header with couple names and event countdown",
  settingsSchema: HeroSettingsSchema,
  defaultSettings: HeroSettingsSchema.parse({}),
  isRepeatable: false,
};
```

### Component Implementation

```typescript
// components/sections/HeroSection/HeroSection.tsx
import type { BaseSectionProps } from "@/types/sections";
import type { HeroSettings } from "./HeroSection.metadata";
import { HeroSettingsSchema } from "./HeroSection.metadata";

export function HeroSection({ settings }: BaseSectionProps) {
  // Parse and validate settings with defaults
  const config = HeroSettingsSchema.parse(settings ?? {});

  return (
    <section className="min-h-screen flex items-center justify-center">
      <h1>{config.title}</h1>
      {config.subtitle && <p>{config.subtitle}</p>}
      {config.showCountdown && <CountdownTimer />}
    </section>
  );
}
```

### Settings Form (Backoffice)

```typescript
// components/sections/HeroSection/HeroSectionSettings.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HeroSettingsSchema, type HeroSettings } from "./HeroSection.metadata";

interface HeroSectionSettingsProps {
  settings: HeroSettings;
  onSave: (settings: HeroSettings) => Promise<void>;
}

export function HeroSectionSettings({ settings, onSave }: HeroSectionSettingsProps) {
  const form = useForm<HeroSettings>({
    resolver: zodResolver(HeroSettingsSchema),
    defaultValues: settings,
  });

  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <Input label="Title" {...form.register("title")} />
      <Input label="Subtitle" {...form.register("subtitle")} />
      <Switch label="Show Countdown" {...form.register("showCountdown")} />
      <Button type="submit">Save</Button>
    </form>
  );
}
```

---

## Metadata Registry

The registry is **auto-generated** by the sync script:

```bash
pnpm run internal:sync-sections
```

This scans all section folders and generates `components/sections/metadata.ts`:

```typescript
// ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
import { HeroSectionMetadata } from "./HeroSection/HeroSection.metadata";
import { CeremonySectionMetadata } from "./CeremonySection/CeremonySection.metadata";
// ...

export const SECTION_METADATA = {
  hero: HeroSectionMetadata,
  ceremony: CeremonySectionMetadata,
  // ...
} as const;

export type SectionKey = keyof typeof SECTION_METADATA;
```

---

## Database Storage

Section configurations are stored per event:

```prisma
model SectionConfiguration {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(...)

  key       String   // 'hero', 'ceremony', etc.
  isEnabled Boolean  @default(true)
  order     Int      // Display order
  settings  Json?    // Validated against section's schema

  @@index([eventId, order])
}
```

### Example Data

```json
[
  {
    "id": "cfg_1",
    "eventId": "evt_abc",
    "key": "hero",
    "isEnabled": true,
    "order": 0,
    "settings": {
      "title": "John & Jane",
      "showCountdown": true
    }
  },
  {
    "id": "cfg_2",
    "eventId": "evt_abc",
    "key": "divider",
    "isEnabled": true,
    "order": 1,
    "settings": {
      "style": "floral"
    }
  },
  {
    "id": "cfg_3",
    "eventId": "evt_abc",
    "key": "ceremony",
    "isEnabled": true,
    "order": 2,
    "settings": {
      "time": "16:00",
      "venueName": "St. Mary's Church"
    }
  }
]
```

---

## Rendering Flow

### Server Component (Page)

```typescript
// app/(invitation)/page.tsx
export default async function InvitationPage({ event, user }) {
  const sections = await getSectionConfigurations(event.id);

  return (
    <DynamicSectionRenderer
      sections={sections}
      user={user}
    />
  );
}
```

### Dynamic Renderer

```typescript
// components/DynamicSectionRenderer.tsx
import { SECTION_COMPONENTS } from "./sections/registry";

interface DynamicSectionRendererProps {
  sections: SectionConfiguration[];
  user?: SectionUser;
}

export function DynamicSectionRenderer({ sections, user }: DynamicSectionRendererProps) {
  const enabledSections = sections
    .filter(s => s.isEnabled)
    .sort((a, b) => a.order - b.order);

  return (
    <main>
      {enabledSections.map(section => {
        const Component = SECTION_COMPONENTS[section.key];

        if (!Component) {
          console.warn(`Unknown section: ${section.key}`);
          return null;
        }

        // RSVP needs user data, others don't
        const props = section.key === "rsvp"
          ? { settings: section.settings, user }
          : { settings: section.settings };

        return (
          <Component
            key={section.id}
            {...props}
          />
        );
      })}
    </main>
  );
}
```

---

## Adding a New Section

### 1. Create the folder structure

```bash
mkdir -p components/sections/MySectionSection
```

### 2. Create metadata file

```typescript
// components/sections/MySectionSection/MySectionSection.metadata.ts
import { z } from "zod";

export const MySectionSettingsSchema = z.object({
  // Define your settings
  title: z.string().default("My Section"),
  showIcon: z.boolean().default(true),
});

export type MySectionSettings = z.infer<typeof MySectionSettingsSchema>;

export const MySectionSectionMetadata = {
  key: "my_section" as const,
  name: "My Section",
  description: "Description for the backoffice",
  settingsSchema: MySectionSettingsSchema,
  defaultSettings: MySectionSettingsSchema.parse({}),
  isRepeatable: false,
};
```

### 3. Create the component

```typescript
// components/sections/MySectionSection/MySectionSection.tsx
import type { BaseSectionProps } from "@/types/sections";
import { MySectionSettingsSchema } from "./MySectionSection.metadata";

export function MySectionSection({ settings }: BaseSectionProps) {
  const config = MySectionSettingsSchema.parse(settings ?? {});

  return (
    <section className="py-16">
      <h2>{config.title}</h2>
      {/* Your section content */}
    </section>
  );
}
```

### 4. Create settings form (optional)

```typescript
// components/sections/MySectionSection/MySectionSectionSettings.tsx
"use client";

// Settings form implementation...
```

### 5. Create barrel export

```typescript
// components/sections/MySectionSection/index.ts
export { MySectionSection } from "./MySectionSection";
export { MySectionSectionMetadata } from "./MySectionSection.metadata";
export { MySectionSectionSettings } from "./MySectionSectionSettings";
```

### 6. Regenerate registry

```bash
pnpm run internal:sync-sections
```

### 7. Add to component registry

```typescript
// components/sections/registry.ts
import { MySectionSection } from "./MySectionSection";

export const SECTION_COMPONENTS = {
  // ...existing sections
  my_section: MySectionSection,
};
```

---

## Server Actions

### Get Sections

```typescript
// app/actions/sections.ts
export async function getSectionConfigurations(eventId: string) {
  return prisma.sectionConfiguration.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
  });
}
```

### Update Section

```typescript
export const updateSectionConfiguration = withEventAuth(
  async (ctx, sectionId: string, data: Partial<SectionConfiguration>) => {
    // Validate settings against section's schema
    const existing = await prisma.sectionConfiguration.findUnique({
      where: { id: sectionId },
    });

    if (data.settings) {
      const metadata = SECTION_METADATA[existing.key];
      metadata.settingsSchema.parse(data.settings);
    }

    await prisma.sectionConfiguration.update({
      where: { id: sectionId },
      data,
    });

    revalidatePath("/backoffice/structure");
  },
  PERMISSIONS.STRUCTURE_EDIT,
);
```

### Reorder Sections

```typescript
export const reorderSections = withEventAuth(
  async (ctx, orderedIds: string[]) => {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.sectionConfiguration.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    revalidatePath("/backoffice/structure");
  },
  PERMISSIONS.STRUCTURE_EDIT,
);
```

---

## Best Practices

1. **Always validate settings** - Use the section's Zod schema when reading settings
2. **Provide sensible defaults** - Users shouldn't need to configure everything
3. **Keep sections focused** - One section = one purpose
4. **Use TypeScript strictly** - Settings types should be inferred from schemas
5. **Test with empty settings** - Component should render without any configuration
