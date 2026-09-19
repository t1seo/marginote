import { describe, expect, test } from "bun:test";
import { type CardFileWriter, createUniqueCard } from "../../src/cards/create";

class MemoryWriter implements CardFileWriter<string> {
  readonly files = new Map<string, string>();
  raceOnce = false;

  exists(path: string): boolean {
    return this.files.has(path);
  }
  async create(path: string, markdown: string): Promise<string> {
    if (this.raceOnce) {
      this.raceOnce = false;
      this.files.set(path, "Another writer's card");
    }
    if (this.files.has(path)) throw new Error("File exists");
    this.files.set(path, markdown);
    return path;
  }
}

describe("collision-safe vault creation", () => {
  test("never overwrites an existing card", async () => {
    const writer = new MemoryWriter();
    writer.files.set("Annotations/한글 카드.md", "Keep me");
    const result = await createUniqueCard(writer, "한글 카드", "New content");
    expect(result).toBe("Annotations/한글 카드 (2).md");
    expect(writer.files.get("Annotations/한글 카드.md")).toBe("Keep me");
  });

  test("retries when another writer creates the same candidate", async () => {
    const writer = new MemoryWriter();
    writer.raceOnce = true;
    const result = await createUniqueCard(writer, "Twin", "Our card");
    expect(result).toBe("Annotations/Twin (2).md");
    expect(writer.files.get("Annotations/Twin.md")).toBe("Another writer's card");
  });

  test("uses a vault-safe basename without losing Unicode", async () => {
    const writer = new MemoryWriter();
    const result = await createUniqueCard(writer, "../도제: 📚 [예]", "Card");
    expect(result).toBe("Annotations/도제 📚 예.md");
  });

  test("truncates long names without splitting an emoji", async () => {
    const writer = new MemoryWriter();
    const title = `${"a".repeat(79)}📚 more`;
    const result = await createUniqueCard(writer, title, "Card");
    expect(result).toBe(`Annotations/${"a".repeat(79)}📚.md`);
  });

  test("propagates a write failure without overwriting unrelated files", async () => {
    const failure = new Error("Disk is read-only");
    const writer: CardFileWriter<string> = {
      exists: () => false,
      create: () => Promise.reject(failure),
    };
    const result = createUniqueCard(writer, "Card", "Text");
    await expect(result).rejects.toBe(failure);
  });
});
