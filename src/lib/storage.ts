export type StoredIdentity = {
  participantId: string;
  name: string;
};

function key(roomId: string): string {
  return `plannit-poker:${roomId}`;
}

export function getStoredIdentity(roomId: string): StoredIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(roomId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredIdentity;
  } catch {
    return null;
  }
}

export function setStoredIdentity(
  roomId: string,
  identity: StoredIdentity
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(roomId), JSON.stringify(identity));
}

export function clearStoredIdentity(roomId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(roomId));
}
