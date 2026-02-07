"use client";

import { Button } from "@heroui/button";
import { Minus, Plus } from "lucide-react";

interface CheckInCounterProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  remaining: number;
}

/**
 * Contador de invitados para check-in
 *
 * Similar a GuestCountSelector pero adaptado para el flujo de check-in.
 * Muestra cuántos lugares quedan disponibles y valida límites.
 */
export default function CheckInCounter({
  value,
  onChange,
  min,
  max,
  remaining,
}: CheckInCounterProps) {
  const canDecrease = value > min;
  const canIncrease = value < max && value < remaining;

  const handleDecrease = () => {
    if (canDecrease) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        isIconOnly
        size="lg"
        variant="flat"
        onPress={handleDecrease}
        isDisabled={!canDecrease}
        aria-label="Disminuir cantidad"
      >
        <Minus size={20} />
      </Button>

      <div className="min-w-24 text-center">
        <div className="text-4xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-default-500 mt-1">
          de {remaining} disponibles
        </div>
      </div>

      <Button
        isIconOnly
        size="lg"
        variant="flat"
        onPress={handleIncrease}
        isDisabled={!canIncrease}
        aria-label="Aumentar cantidad"
      >
        <Plus size={20} />
      </Button>
    </div>
  );
}
