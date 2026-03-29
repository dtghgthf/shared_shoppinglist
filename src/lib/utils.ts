import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10
);

export function generateListId(): string {
  return nanoid();
}

export function getListUrl(id: string): string {
  if (typeof window === "undefined") return `/list/${id}`;
  return `${window.location.origin}/list/${id}`;
}
