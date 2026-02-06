"use client";

import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import { motion } from "framer-motion";
import clsx from "clsx";

interface EventAvatarProps {
  eventId: string;
  eventName: string;
  isActive: boolean;
  onClick: () => void;
}

// Generar color consistente basado en el ID del evento
function getEventColor(eventId: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  // Simple hash del ID
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index] || "bg-primary";
}

// Extraer iniciales del nombre del evento
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    // Una sola palabra: primeras 2 letras
    return words[0]?.slice(0, 2).toUpperCase() || "??";
  }

  // Múltiples palabras: primera letra de las primeras 2 palabras
  return ((words[0]?.[0] || "") + (words[1]?.[0] || "")).toUpperCase();
}

export default function EventAvatar({
  eventId,
  eventName,
  isActive,
  onClick,
}: EventAvatarProps) {
  const initials = getInitials(eventName);
  const colorClass = getEventColor(eventId);

  return (
    <Tooltip content={eventName} placement="right" delay={300}>
      <motion.button
        onClick={onClick}
        className={clsx(
          "relative rounded-full",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isActive && "ring-2 ring-primary ring-offset-2",
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{
          scale: isActive ? 1.05 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        aria-label={`Seleccionar evento: ${eventName}`}
        aria-current={isActive ? "page" : undefined}
      >
        <Avatar
          name={initials}
          size="sm"
          classNames={{
            base: clsx(
              colorClass,
              "text-white font-semibold transition-all w-10 h-10",
              isActive && "ring-2 ring-white",
            ),
            name: "text-xs",
          }}
        />
        {isActive && (
          <motion.div
            className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          />
        )}
      </motion.button>
    </Tooltip>
  );
}
