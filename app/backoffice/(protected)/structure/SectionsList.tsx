"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { GripVertical, Trash2, Settings, Eye, EyeOff } from "lucide-react";
import { SectionConfiguration } from "@/types/sections";
import { SECTION_METADATA } from "@/components/sections/metadata";
import { updateSectionsOrder, removeSection } from "@/app/actions/sections";
import clsx from "clsx";
import { useRouter } from "next/navigation";

interface SectionsListProps {
  initialSections: SectionConfiguration[];
}

// Componente para cada item sortable
function SortableSection({
  section,
  onToggle,
  onClick,
  onRemove,
}: {
  section: SectionConfiguration;
  onToggle: (id: string, isEnabled: boolean) => void;
  onClick: (key: string) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const metadata =
    SECTION_METADATA[section.key as keyof typeof SECTION_METADATA];

  if (!metadata) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={clsx("mb-3", isDragging && "opacity-50 z-50")}
      >
        <Card className="transition-shadow hover:shadow-md opacity-60">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground/70"
              >
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">📄</div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{section.key}</h4>
                  <p className="text-sm text-foreground/40">
                    Sección sin metadata registrada
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                isIconOnly
                onPress={() => onRemove(section.id)}
                aria-label="Eliminar sección"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx("mb-3", isDragging && "opacity-50 z-50")}
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground/70"
            >
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Icon + Info */}
            <div className="flex items-center gap-3 flex-1">
              <div className="text-2xl">{metadata.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{metadata.name}</h4>
                <p className="text-sm text-foreground/60">
                  {metadata.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Settings Button */}
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                onPress={() => onClick(section.key)}
                aria-label="Configurar"
              >
                <Settings className="w-4 h-4" />
              </Button>

              {/* Visibility Toggle Button */}
              <Button
                size="sm"
                variant="flat"
                color={section.isEnabled ? "success" : "default"}
                isIconOnly
                onPress={() => onToggle(section.id, !section.isEnabled)}
                aria-label={section.isEnabled ? "Ocultar" : "Mostrar"}
              >
                {section.isEnabled ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>

              {/* Remove Button */}
              <Button
                size="sm"
                variant="flat"
                color="danger"
                isIconOnly
                onPress={() => onRemove(section.id)}
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

type OptimisticAction =
  | { type: "reorder"; oldIndex: number; newIndex: number }
  | { type: "toggle"; id: string; isEnabled: boolean }
  | { type: "remove"; id: string };

export default function SectionsList({ initialSections }: SectionsListProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fix hydration mismatch - solo renderizar DnD en cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✨ OPTIMISTIC UPDATES - React 19
  const [optimisticSections, addOptimisticUpdate] = useOptimistic(
    initialSections,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case "reorder": {
          const newSections = [...state];
          const [removed] = newSections.splice(action.oldIndex, 1);
          newSections.splice(action.newIndex, 0, removed);
          return newSections;
        }
        case "toggle":
          return state.map((s) =>
            s.id === action.id ? { ...s, isEnabled: action.isEnabled } : s,
          );
        case "remove":
          return state.filter((s) => s.id !== action.id);
        default:
          return state;
      }
    },
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleSectionClick(key: string) {
    router.push(`/backoffice/structure/${key}`);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = optimisticSections.findIndex(
        (item) => item.id === active.id,
      );
      const newIndex = optimisticSections.findIndex(
        (item) => item.id === over.id,
      );

      // Calcular los datos ANTES del optimistic update
      const reorderedSections = arrayMove(
        optimisticSections,
        oldIndex,
        newIndex,
      );
      const sectionsData = reorderedSections.map((section, index) => ({
        id: section.id,
        order: index,
        isEnabled: section.isEnabled,
      }));

      startTransition(async () => {
        // ✨ Update optimista
        addOptimisticUpdate({ type: "reorder", oldIndex, newIndex });

        // Guardar en background
        await updateSectionsOrder(sectionsData);
      });
    }
  }

  function handleToggle(id: string, isEnabled: boolean) {
    // Calcular los datos ANTES del optimistic update
    const sectionsData = optimisticSections.map((section, index) => ({
      id: section.id,
      order: index,
      isEnabled: section.id === id ? isEnabled : section.isEnabled,
    }));

    startTransition(async () => {
      // ✨ Update optimista
      addOptimisticUpdate({ type: "toggle", id, isEnabled });

      // Guardar en background
      await updateSectionsOrder(sectionsData);
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      // ✨ Update optimista
      addOptimisticUpdate({ type: "remove", id });

      // Guardar en background
      await removeSection(id);
      // ✅ La revalidación automática actualiza initialSections
    });
  }

  return (
    <div className="space-y-4">
      {/* Lista de secciones con scroll */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {!mounted ? (
          // Renderizado inicial (SSR) - sin DnD para evitar hydration mismatch
          <>
            {optimisticSections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggle={handleToggle}
                onClick={handleSectionClick}
                onRemove={handleRemove}
              />
            ))}
          </>
        ) : (
          // Cliente - con DnD
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={optimisticSections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {optimisticSections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onToggle={handleToggle}
                  onClick={handleSectionClick}
                  onRemove={handleRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
