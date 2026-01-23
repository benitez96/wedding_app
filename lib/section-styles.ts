/**
 * Utilidades para estilos de secciones con background alternativo
 *
 * Concepto: Cada sección puede tener un toggle "hasAlternateBg"
 * - false (default): bg-background + text-foreground (blanco/neutral)
 * - true: bg-secondary + text-secondary-foreground (color brand)
 */

import type { ButtonProps } from "@heroui/button";

interface AlternateBgStyles {
  container: string;
  text: string;
  buttonColor: ButtonProps["color"];
  buttonVariant: ButtonProps["variant"];
  buttonClassName: string;
}

/**
 * Retorna los estilos apropiados según si tiene background alternativo
 *
 * @param hasAlternateBg - Si está activo el background alternativo
 * @returns Objeto con estilos para container, text y button
 */
export function getAlternateBgClasses(
  hasAlternateBg: boolean,
): AlternateBgStyles {
  if (hasAlternateBg) {
    return {
      container: "bg-secondary text-secondary-foreground",
      text: "text-secondary-foreground",
      buttonColor: "primary",
      buttonVariant: "bordered",
      buttonClassName:
        "border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary",
    };
  }

  // Default: sin background especial
  return {
    container: "", // Sin bg extra (usa el general de body)
    text: "", // text-foreground por defecto
    buttonColor: "primary",
    buttonVariant: "solid",
    buttonClassName: "",
  };
}
