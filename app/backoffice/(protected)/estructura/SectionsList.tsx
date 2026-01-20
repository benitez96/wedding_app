"use client";

import { useState } from "react";
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
import { Card, CardBody, Switch, Button } from "@heroui/react";
import { GripVertical, Save, CheckCircle } from "lucide-react";
import { SectionConfiguration } from "@/types/sections";
import { SECTION_METADATA } from "@/components/sections/metadata";
import { updateSectionsOrder } from "@/app/actions/sections";
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
}: {
  section: SectionConfiguration;
  onToggle: (id: string, isEnabled: boolean) => void;
  onClick: (key: string) => void;
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
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Icon + Info - Clickeable para editar */}
            <button
              type="button"
              className="flex items-center gap-3 flex-1 cursor-pointer text-left"
              onClick={() => onClick(section.key)}
            >
              <div className="text-2xl">{metadata.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{metadata.name}</h4>
                <p className="text-sm text-gray-600">{metadata.description}</p>
              </div>
            </button>

            {/* Switch */}
            <Switch
              isSelected={section.isEnabled}
              onValueChange={(isEnabled) => onToggle(section.id, isEnabled)}
              size="sm"
              color="success"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SectionsList({ initialSections }: SectionsListProps) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleSectionClick(key: string) {
    router.push(`/backoffice/estructura/${key}`);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        setHasChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleToggle(id: string, isEnabled: boolean) {
    // Solo actualizar estado local, NO guardar en BD
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled } : s)),
    );
    setHasChanges(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage(null);

    // Preparar datos con orden y enabled/disabled
    const sectionsData = sections.map((section, index) => ({
      id: section.id,
      order: index,
      isEnabled: section.isEnabled,
    }));

    const result = await updateSectionsOrder(sectionsData);

    if (result.success) {
      setHasChanges(false);
      setSaveMessage(result.message || "Cambios guardados correctamente");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage(result.error || "Error al guardar");
      setTimeout(() => setSaveMessage(null), 3000);
    }

    setIsSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Header con botón de guardar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Arrastrá para reordenar, clickeá para editar
        </p>
        {hasChanges ? (
          <Button
            color="primary"
            size="sm"
            startContent={isSaving ? null : <Save className="w-4 h-4" />}
            onPress={handleSave}
            isLoading={isSaving}
            isDisabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        ) : null}
      </div>

      {/* Mensaje de feedback */}
      {saveMessage ? (
        <div
          className={clsx(
            "p-3 rounded-lg flex items-center gap-2",
            saveMessage.includes("Error") || saveMessage.includes("error")
              ? "bg-danger-50 text-danger-700 border border-danger-200"
              : "bg-success-50 text-success-700 border border-success-200",
          )}
        >
          {!saveMessage.includes("Error") && (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>{saveMessage}</span>
        </div>
      ) : null}

      {/* Lista de secciones con scroll */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggle={handleToggle}
                onClick={handleSectionClick}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
