import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Helper `cn()` du design system — TOUS les composants shadcn l'importent.
 * clsx : compose des classes conditionnelles.
 * twMerge : dédoublonne les classes Tailwind en conflit (la dernière gagne),
 *           ce qui permet de surcharger un composant via sa prop `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
