import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function safeJson(res: Response, fallback: any = {}): Promise<any> {
  try {
    const text = await res.text();
    if (!text || text.trim().startsWith("<")) {
      return fallback;
    }
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
