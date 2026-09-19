import type { TFile } from "obsidian";
import type { CardDocument, CardReference } from "../cards/model";

export type NoteReference = { readonly kind: "note"; readonly file: TFile };
export type NoteDocument = NoteReference & {
  readonly markdown: string;
  readonly truncated: boolean;
};
export type PreviewReference = CardReference | NoteReference;
export type PreviewDocument = CardDocument | NoteDocument;
