"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Card, CardBody } from "@heroui/card";
import { Plus, CheckCircle } from "lucide-react";
import {
  SECTION_METADATA,
  type SectionKey,
} from "@/components/sections/metadata";
import { addSection } from "@/app/actions/sections";
import clsx from "clsx";

interface SectionCatalogProps {
  activeSectionKeys: Set<string>;
}

export default function SectionCatalog({
  activeSectionKeys,
}: SectionCatalogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ✨ OPTIMISTIC UPDATES - React 19
  const [optimisticActiveKeys, addOptimisticKey] = useOptimistic(
    activeSectionKeys,
    (state, newKey: string) => {
      const newSet = new Set(state);
      newSet.add(newKey);
      return newSet;
    },
  );

  async function handleAddSection(key: SectionKey) {
    setError(null);

    startTransition(async () => {
      // ✨ Update optimista
      addOptimisticKey(key);

      // Guardar en background
      const result = await addSection(key);

      if (!result.success) {
        setError(result.error || "Error al agregar sección");
        setTimeout(() => setError(null), 3000);
      }
      // ✅ No necesitamos callback - la revalidación automática actualiza initialSections
    });
  }

  // Todas las secciones ordenadas alfabéticamente por key (determinista)
  // Usamos key en vez de name porque es ASCII puro y no depende del locale
  const allSections = Object.entries(SECTION_METADATA).sort(([keyA], [keyB]) =>
    keyA < keyB ? -1 : keyA > keyB ? 1 : 0,
  );

  return (
    <div className="space-y-4">
      {error ? (
        <div className="p-3 rounded-lg bg-danger-50 text-danger-700 border border-danger-200">
          {error}
        </div>
      ) : null}

      {/* Scroll horizontal CONTENIDO dentro de la card */}
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-1">
          {allSections.map(([key, metadata]) => {
            const sectionKey = key as SectionKey; // Cast para tipos estrictos
            // Los dividers pueden agregarse múltiples veces
            const isActive =
              sectionKey !== "divider" && optimisticActiveKeys.has(sectionKey);

            return (
              <Card
                key={sectionKey}
                className={clsx(
                  "transition-all group flex-shrink-0 w-44",
                  isActive
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-md hover:scale-105",
                )}
              >
                <CardBody className="p-4 flex flex-col items-center gap-2 text-center relative min-h-[120px]">
                  {/* Icon */}
                  <div className="text-4xl">{metadata.icon}</div>

                  {/* Name */}
                  <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1">
                    {metadata.name}
                    {isActive ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : null}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {metadata.description}
                  </p>

                  {/* Hover overlay clickeable (solo si NO está activa) */}
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => handleAddSection(sectionKey)}
                      disabled={isPending}
                      className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      aria-label={`Agregar ${metadata.name}`}
                    >
                      {isPending ? (
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="bg-primary text-white rounded-full p-2">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ) : null}
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
