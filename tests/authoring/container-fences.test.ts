import { describe, expect, test } from "bun:test";
import { annotationLinkAt } from "../../src/authoring/existing-link";
import { selectionError } from "../../src/authoring/selection";

const containers = [
  { name: "unordered tilde", open: "- ~~~", indent: "  ", close: "  ~~~" },
  { name: "unordered backtick", open: "- ```md", indent: "  ", close: "  ```" },
  { name: "ordered list", open: "1. ~~~", indent: "   ", close: "   ~~~" },
  { name: "nested list", open: "- outer\n  - ~~~", indent: "    ", close: "    ~~~" },
  { name: "blockquote list", open: "> - ~~~", indent: ">   ", close: ">   ~~~" },
  { name: "list blockquote", open: "- > ```", indent: "  > ", close: "  > ```" },
  { name: "indented blockquote", open: "  > ~~~", indent: "> ", close: "> ~~~" },
] as const;

describe("fenced code inside Markdown containers", () => {
  test.each([...containers])("rejects creation inside $name", ({ open, indent, close }) => {
    const content = `${open}\n\n${indent}selected\n\n${close}`;
    const from = content.indexOf("selected");
    const result = selectionError(content, from, from + "selected".length);
    expect(result).not.toBeNull();
  });

  test.each([...containers])(
    "rejects unlinking examples inside $name",
    ({ open, indent, close }) => {
      const content = `${open}\n\n${indent}[[Annotations/Card|alias]]\n\n${close}`;
      const caret = content.indexOf("alias");
      const result = annotationLinkAt(content, caret, caret);
      expect(result).toBeNull();
    },
  );

  test.each([...containers])("allows prose after closed $name", ({ open, indent, close }) => {
    const content = `${open}\n${indent}code\n${close}\n\nselected prose`;
    const from = content.indexOf("selected");
    const result = selectionError(content, from, from + "selected".length);
    expect(result).toBeNull();
  });

  test("does not let an indented example close a top-level fence", () => {
    const content = "~~~\n    ~~~\n\nselected\n\n~~~";
    const from = content.indexOf("selected");
    const result = selectionError(content, from, from + "selected".length);
    expect(result).not.toBeNull();
  });
});
