import { cardLink } from "../cards/links";

export type SelectionState = {
  readonly content: string;
  readonly sourcePath: string;
  readonly from: number;
  readonly to: number;
  readonly selectionCount: number;
};

export type AuthoringTarget = {
  readonly getState: () => SelectionState;
  readonly replace: (from: number, to: number, value: string) => void;
};

export type CreationResult =
  | { readonly kind: "stale" }
  | { readonly kind: "saved" | "linked"; readonly path: string };

export async function createAndLink(
  snapshot: SelectionState,
  target: AuthoringTarget,
  create: () => Promise<string>,
  isOpen: () => boolean,
): Promise<CreationResult> {
  if (!isOpen() || !sameSelection(snapshot, target.getState())) return { kind: "stale" };
  const path = await create();
  if (!isOpen() || !sameSelection(snapshot, target.getState())) return { kind: "saved", path };
  const alias = snapshot.content.slice(snapshot.from, snapshot.to);
  target.replace(snapshot.from, snapshot.to, cardLink(path, alias));
  return { kind: "linked", path };
}

export function sameSelection(first: SelectionState, second: SelectionState): boolean {
  return (
    first.content === second.content &&
    first.sourcePath === second.sourcePath &&
    first.from === second.from &&
    first.to === second.to &&
    first.selectionCount === second.selectionCount
  );
}
