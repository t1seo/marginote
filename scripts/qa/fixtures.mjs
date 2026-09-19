import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const cards = [
  [
    "Text",
    "text",
    "11111111-1111-4111-8111-111111111111",
    "# 관찰하며 배우기\n\n전문가의 사고 과정을 관찰하고, 함께 시도하며, 점차 혼자 해내는 학습입니다. **한글과 이모지 📚**가 자연스럽게 보존됩니다.",
  ],
  ["Image", "image", "22222222-2222-4222-8222-222222222222", "![[Attachments/archival-study.svg]]"],
  [
    "Mixed",
    "mixed",
    "33333333-3333-4333-8333-333333333333",
    "# 읽기의 구조\n\n![[Attachments/archival-study.svg]]\n\n직접 만든 추상 도형입니다. 노트의 [[Ordinary note|일반 링크]]도 확인합니다.",
  ],
  [
    "Other text",
    "text",
    "44444444-4444-4444-8444-444444444444",
    "# 다른 의미\n\n같은 표시 문구라도 이 카드는 다른 대상입니다.",
  ],
  [
    "Long",
    "text",
    "55555555-5555-4555-8555-555555555555",
    `# 긴 본문\n\n${Array.from({ length: 28 }, (_, i) => `${i + 1}. 읽으며 질문하고 연결하는 과정에서 새로운 의미가 드러납니다. 카드 내부 스크롤을 확인하는 독립 작성 문장입니다.`).join("\n\n")}`,
  ],
  [
    "Large image",
    "image",
    "66666666-6666-4666-8666-666666666666",
    "![[Attachments/very-large-study.svg]]",
  ],
  [
    "Missing image",
    "image",
    "77777777-7777-4777-8777-777777777777",
    "![[Attachments/missing-file.svg]]",
  ],
];

const source = `# Marginote QA

이 vault는 이 플러그인 검증을 위해서만 만든 임시 vault입니다.

읽기 중 [[Annotations/Text|인지적 도제]]를 생각하고, [[Annotations/Image|이미지 자료]]를 살펴봅니다. 이어서 [[Annotations/Mixed|혼합 카드]]를 엽니다.

동일한 문구 [[Annotations/Text|관찰]]와 [[Annotations/Other text|관찰]]는 각각 다른 카드로 연결됩니다.

[[Ordinary note|일반 링크]], [[Missing note|없는 대상]], [[Annotations/Bad schema|알 수 없는 버전]], [[Annotations/Bad kind|알 수 없는 종류]], [[Annotations/No marker|표식 없는 노트]]는 Obsidian 기본 링크로 남아야 합니다.

[[Annotations/Text#관찰하며 배우기|제목 fragment]], [[Annotations/Text#^sample|블록 fragment]]도 기본 링크입니다.

[[Annotations/Long|긴 설명]]과 [[Annotations/Large image|큰 이미지]], [[Annotations/Missing image|없는 이미지]]를 확인합니다.

키보드 선택과 복사 보존을 확인할 문장입니다. 사용자의 원문은 변하지 않습니다.

## 아래로 스크롤

${Array.from({ length: 30 }, (_, i) => `${i + 1}. 이 문단은 정지한 포인터와 스크롤 동작을 확인하기 위한 독립 작성 예제입니다.`).join("\n\n")}

맨 아래에도 [[Annotations/Text|인지적 도제]] 앵커가 있습니다.
`;

const svg = (width, height) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 600 420"><title>Original geometric reading study</title><rect width="600" height="420" fill="#e7dfce"/><path d="M60 330V105L185 65V290Z" fill="#475853"/><path d="M205 65L335 110V335L205 290Z" fill="#8c6959"/><path d="M355 110L535 75V295L355 335Z" fill="#bda475"/><path d="M80 345L205 307L340 352L545 309" fill="none" stroke="#273b36" stroke-width="5"/><circle cx="475" cy="170" r="35" fill="#e7dfce"/></svg>\n`;

async function create(path, contents) {
  try {
    await writeFile(path, contents, { flag: "wx" });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") {
      throw error;
    }
  }
}

export async function prepareFixtures(vault) {
  await Promise.all(
    ["Annotations", "Attachments", ".obsidian"].map((path) =>
      mkdir(join(vault, path), { recursive: true }),
    ),
  );
  for (const [name, kind, id, body] of cards) {
    await create(
      join(vault, "Annotations", `${name}.md`),
      `---\nmarginote-card: 1\nmarginote-id: ${id}\nmarginote-kind: ${kind}\n---\n${body}\n`,
    );
  }
  await Promise.all([
    create(join(vault, "QA Reading.md"), source),
    create(
      join(vault, "Authoring.md"),
      "# 작성 검증\n\n선택한 문구를 새 카드로 연결합니다.\n\n취소해도 이 원문은 보존되어야 합니다.\n\n`코드 내부 문구`와 [[Ordinary note|기존 링크]]도 보존합니다.\n",
    ),
    create(join(vault, "Ordinary note.md"), "# 일반 노트\n\n이 노트는 카드가 아닙니다.\n"),
    create(
      join(vault, "Annotations/Bad schema.md"),
      "---\nmarginote-card: 99\nmarginote-id: 88888888-8888-4888-8888-888888888888\nmarginote-kind: text\n---\n알 수 없는 버전.\n",
    ),
    create(
      join(vault, "Annotations/Bad kind.md"),
      "---\nmarginote-card: 1\nmarginote-id: 99999999-9999-4999-8999-999999999999\nmarginote-kind: video\n---\n알 수 없는 종류.\n",
    ),
    create(
      join(vault, "Annotations/No marker.md"),
      "# 보통 노트\n\n명시적인 카드 표식이 없습니다.\n",
    ),
    create(join(vault, "Attachments/archival-study.svg"), svg(600, 420)),
    create(join(vault, "Attachments/very-large-study.svg"), svg(6000, 4200)),
    create(
      join(vault, ".obsidian/app.json"),
      JSON.stringify(
        { alwaysUpdateLinks: true, defaultViewMode: "preview", livePreview: true, safeMode: false },
        null,
        2,
      ),
    ),
    create(
      join(vault, ".obsidian/appearance.json"),
      JSON.stringify({ theme: "moonstone", baseFontSize: 16 }, null, 2),
    ),
    create(join(vault, ".obsidian/community-plugins.json"), JSON.stringify(["marginote"])),
    create(
      join(vault, ".obsidian/core-plugins.json"),
      JSON.stringify([
        "file-explorer",
        "global-search",
        "switcher",
        "command-palette",
        "page-preview",
        "outline",
      ]),
    ),
  ]);
}
