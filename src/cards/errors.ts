export class CardCreationError extends Error {
  override readonly name = "CardCreationError";

  constructor(
    readonly code: "folder-blocked" | "name-exhausted" | "invalid-image",
    message: string,
  ) {
    super(message);
  }
}

export function assertNever(value: never): never {
  throw new TypeError(`Unsupported annotation state: ${String(value)}`);
}
