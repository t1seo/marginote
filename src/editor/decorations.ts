import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, type DecorationSet, type EditorView } from "@codemirror/view";
import { editorInfoField, editorLivePreviewField } from "obsidian";
import type { PreviewRepository } from "../preview/repository";
import { shouldKeepLinkMark } from "./eligibility";
import { findVisibleWikiLinks } from "./visible-links";
import { syntaxAllowsWikiLink, type TextRange, type WikiLinkRange } from "./wiki-links";

export type EditorAnchor = {
  readonly sourcePath: string;
  readonly link: WikiLinkRange;
};

export type EditorDecorations = {
  readonly decorations: DecorationSet;
  readonly anchors: ReadonlyMap<string, EditorAnchor>;
};

export function buildEditorDecorations(
  view: EditorView,
  repository: PreviewRepository,
  held: TextRange | null,
  pointerDown: boolean,
  composing: boolean,
): EditorDecorations {
  const builder = new RangeSetBuilder<Decoration>();
  const anchors = new Map<string, EditorAnchor>();
  const sourcePath = view.state.field(editorInfoField, false)?.file?.path;
  if (
    !sourcePath ||
    !view.state.field(editorLivePreviewField, false) ||
    composing ||
    view.composing ||
    view.compositionStarted
  ) {
    return { decorations: Decoration.none, anchors };
  }
  const tree = syntaxTree(view.state);
  for (const link of findVisibleWikiLinks(view.state.doc, view.visibleRanges)) {
    if (!shouldKeepLinkMark(link, view.state.selection.ranges, held, pointerDown)) continue;
    const names: string[] = [];
    tree.iterate({
      from: link.from,
      to: link.to,
      enter(node) {
        if (node.to <= link.from || node.from >= link.to) return false;
        names.push(node.name);
      },
    });
    if (!syntaxAllowsWikiLink(names) || !repository.resolve(link.linktext, sourcePath)) continue;
    const key = `${link.from}:${link.to}`;
    anchors.set(key, { link, sourcePath });
    builder.add(
      link.labelFrom,
      link.labelTo,
      Decoration.mark({
        tagName: "span",
        class: "marginote-anchor",
        attributes: {
          "data-marginote-editor-anchor": key,
          role: "link",
          tabindex: "0",
          "aria-haspopup": "dialog",
        },
      }),
    );
  }
  return { decorations: builder.finish(), anchors };
}
