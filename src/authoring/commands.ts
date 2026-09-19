import { type Editor, type MarkdownFileInfo, Notice, type Plugin } from "obsidian";
import type { CardRepository } from "../cards/repository";
import { type SelectionState, sameSelection } from "./creation";
import { annotationLinkAt } from "./existing-link";
import { CardAuthorModal } from "./modal";
import { selectionError } from "./selection";

function editorState(editor: Editor, context: MarkdownFileInfo): SelectionState {
  return {
    content: editor.getValue(),
    sourcePath: context.file?.path ?? "",
    from: editor.posToOffset(editor.getCursor("from")),
    to: editor.posToOffset(editor.getCursor("to")),
    selectionCount: editor.listSelections().length,
  };
}

export function registerAuthoring(plugin: Plugin, repository: CardRepository): void {
  const modals = new Set<CardAuthorModal>();
  plugin.register(() => {
    for (const modal of modals) modal.close();
  });
  plugin.addCommand({
    id: "create-annotation-card",
    name: "Create annotation card from selection",
    editorCallback: (editor, context) => {
      if (!context.file) return;
      const snapshot = editorState(editor, context);
      const issue =
        editor.listSelections().length !== 1
          ? "Select one text range."
          : selectionError(snapshot.content, snapshot.from, snapshot.to);
      if (issue) {
        new Notice(issue);
        return;
      }
      const isActive = () =>
        plugin.app.workspace.activeEditor?.editor === editor &&
        context.file?.path === snapshot.sourcePath;
      const modal = new CardAuthorModal(plugin.app, repository, {
        snapshot,
        target: {
          getState: () => editorState(editor, context),
          replace: (from, to, value) =>
            editor.replaceRange(
              value,
              editor.offsetToPos(from),
              editor.offsetToPos(to),
              "+marginote-annotation",
            ),
        },
        isActive,
        onClosed: (linked) => {
          modals.delete(modal);
          if (isActive() && (linked || sameSelection(snapshot, editorState(editor, context))))
            editor.focus();
        },
      });
      modals.add(modal);
      modal.open();
    },
  });
  plugin.addCommand({
    id: "edit-annotation-card",
    name: "Edit annotation card at cursor",
    editorCheckCallback: (checking, editor, context) => {
      if (!context.file || editor.listSelections().length !== 1) return false;
      const state = editorState(editor, context);
      const link = annotationLinkAt(state.content, state.from, state.to);
      const reference = link && repository.resolve(link.target, state.sourcePath);
      if (!reference) return false;
      if (!checking) {
        void plugin.app.workspace
          .getLeaf("tab")
          .openFile(reference.file)
          .catch((error: unknown) => {
            new Notice(
              `Could not open the card: ${error instanceof Error ? error.message : String(error)}`,
            );
          });
      }
      return true;
    },
  });
  plugin.addCommand({
    id: "unlink-annotation-card",
    name: "Unlink annotation card at cursor",
    editorCheckCallback: (checking, editor, context) => {
      if (!context.file || editor.listSelections().length !== 1) return false;
      const state = editorState(editor, context);
      const link = annotationLinkAt(state.content, state.from, state.to);
      if (!link || !repository.resolve(link.target, state.sourcePath)) return false;
      if (!checking)
        editor.replaceRange(
          link.alias,
          editor.offsetToPos(link.from),
          editor.offsetToPos(link.to),
          "+marginote-annotation",
        );
      return true;
    },
  });
}
