import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combina classes do Tailwind resolvendo conflitos; usado pelos componentes shadcn-vue.
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
