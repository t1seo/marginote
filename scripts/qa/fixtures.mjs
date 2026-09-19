import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const cards = [
  [
    "Text",
    "text",
    "11111111-1111-4111-8111-111111111111",
    "# Learning by observation\n\nWatch what an experienced person chooses, where they pause, and how they revise their work. Following the **thinking behind each decision** reveals more than the finished result alone.\n\nTry the next small step, then compare what you noticed. ^sample",
  ],
  ["Image", "image", "22222222-2222-4222-8222-222222222222", "![[Attachments/archival-study.svg]]"],
  [
    "Mixed",
    "mixed",
    "33333333-3333-4333-8333-333333333333",
    "# The shape of an idea\n\n![[Attachments/archival-study.svg]]\n\nThree folded pages share one continuous line. Pairing a sketch with a few words can reveal a useful relationship. Continue in the [[Ordinary note|reading journal]].",
  ],
  [
    "Other text",
    "text",
    "44444444-4444-4444-8444-444444444444",
    "# Another perspective\n\nObservation can also mean taking a step back. Notice the setting, the people involved, and the details that a familiar explanation leaves out.",
  ],
  [
    "Long",
    "text",
    "55555555-5555-4555-8555-555555555555",
    `# An extended reflection

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum dignissim, nibh sed viverra varius, est neque consequat tellus, non sodales libero lorem eget arcu. Curabitur ac purus vel eros fermentum aliquet. Praesent vitae massa at nibh luctus posuere vel sit amet eros.

Donec sollicitudin mauris vel felis tincidunt, vitae volutpat nunc dapibus. Sed a metus at sapien placerat consequat. Morbi dignissim tellus vitae neque tristique, et porta enim imperdiet. Integer consequat, erat in ullamcorper tincidunt, turpis sem laoreet lectus, eget commodo lectus purus in mauris. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.

## A wider view

Aliquam ornare semper sapien. Cras accumsan augue in velit luctus, id vulputate neque dictum. Suspendisse id erat vel massa commodo volutpat. In hac habitasse platea dictumst.

Phasellus et ante eu lorem malesuada euismod. Nunc facilisis, justo eget tempus congue, ipsum magna pellentesque nibh, a luctus nisl odio vitae nulla. Etiam aliquam placerat ante, non feugiat libero posuere ut. Mauris mattis ligula a orci egestas, quis posuere lacus aliquam. Nam sed risus faucibus, ultrices orci vel, pharetra lectus.

Quisque viverra purus sed felis porttitor, at aliquam sapien bibendum. Nulla ac libero a lectus commodo interdum. Maecenas pretium felis vitae risus aliquet, in condimentum ligula mattis.

## Leave room for a question

Fusce euismod ante ut magna tempus, non elementum ipsum efficitur. Pellentesque feugiat, purus ac pretium cursus, arcu neque ornare lorem, at varius velit neque sit amet nunc. Aenean egestas consectetur arcu. Duis in odio a tellus blandit hendrerit. Sed at nisl vitae velit hendrerit tempor eget at justo.

Vivamus tincidunt odio ac libero convallis, sit amet convallis risus blandit. Proin eget erat lorem. Ut quis magna eget nisl condimentum eleifend. Integer blandit elit nec purus molestie, quis tristique nibh fermentum. A short note at the end can hold the question you want to return to.`,
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

const source = `Keep a small explanation beside the sentence, and stay with the idea you are reading.

Learning through [[Annotations/Text|careful observation]] helps us see how a decision takes shape. A [[Annotations/Image|visual study]] offers another way into the same thought.

Words and pictures meet in [[Annotations/Mixed|an illustrated note]]. Related questions belong in a [[Ordinary note|reading journal]] that can grow over time.

Two writers may use [[Annotations/Text|observation]] and [[Annotations/Other text|observation]] to point toward different perspectives.

## Follow a thought

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus sit amet lectus malesuada gravida. Integer vitae lacus ac mauris malesuada consequat. Aenean euismod, turpis nec faucibus tincidunt, lacus justo sollicitudin orci, vitae placerat mi ligula sed sapien. Donec quis augue vel magna posuere tincidunt.

Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nulla vitae elit libero, a pharetra augue. Cras mattis consectetur purus sit amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit.

Aliquam erat volutpat. Phasellus lacinia, nisl sed interdum consectetur, augue nibh suscipit lorem, a pellentesque metus erat in augue. Vivamus at velit eu turpis tincidunt egestas. In posuere arcu sed sapien sodales, ac porta urna interdum. Mauris eu nibh vitae lacus ornare pellentesque. Curabitur vitae sem nec nibh faucibus dignissim.

## Make room for detail

Suspendisse potenti. Pellentesque ultricies tellus quis orci imperdiet, a finibus est pharetra. Etiam feugiat ante sit amet justo tincidunt, sit amet vestibulum dui commodo. Sed vel urna eu metus congue dictum.

Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Maecenas sed diam eget risus varius blandit sit amet non magna. Vestibulum id ligula porta felis euismod semper. Aenean lacinia bibendum nulla sed consectetur. Nam at risus ut lorem facilisis tincidunt quis vitae augue.

Nunc varius felis nec dolor volutpat, sed mattis odio posuere. Curabitur suscipit velit ut arcu tincidunt, vitae finibus massa bibendum. Proin a sapien ut magna lacinia rutrum. Sed quis tortor vel justo blandit cursus. Etiam porttitor sapien vitae eros molestie, in volutpat justo malesuada. Donec eget lectus sed erat pretium cursus. Quisque at ipsum ac justo luctus efficitur.

Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla.

## Return to the margin

Ut vitae lectus nec neque pharetra scelerisque. Aenean viverra ligula in magna facilisis, vel dictum erat tincidunt. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; dignissim et aliquam in, convallis non mi. Quisque interdum neque et erat convallis, ut elementum massa finibus.

After a longer passage, return to [[Annotations/Text|careful observation]] or spend more time with [[Annotations/Long|an extended reflection]]. The margin is still close at hand.

### Further reading

Look closely at the [[Annotations/Large image|large illustration]], follow the [[Annotations/Text#Learning by observation|section link]], or revisit the [[Annotations/Text#^sample|marked passage]].

Some references are incomplete: a [[Missing note|note yet to be written]], an [[Annotations/Missing image|unavailable image]], an [[Annotations/Bad schema|unsupported card version]], an [[Annotations/Bad kind|unsupported media type]], and a [[Annotations/No marker|plain note without a marker]].
`;

const ordinaryNotes = {
  "Ordinary note.md":
    "# A reading journal\n\nKeep a question beside an idea that stays with you.\n\n- What did I notice this time?\n- Which detail changes how I understand the passage?\n- Where would I like to continue reading?\n\nThis is an ordinary Markdown note, with room for thoughts that do not need a separate annotation card.\n",
  "Annotations/Bad schema.md":
    "---\nmarginote-card: 99\nmarginote-id: 88888888-8888-4888-8888-888888888888\nmarginote-kind: text\n---\nThis note declares an unsupported card version.\n",
  "Annotations/Bad kind.md":
    "---\nmarginote-card: 1\nmarginote-id: 99999999-9999-4999-8999-999999999999\nmarginote-kind: video\n---\nThis note declares an unsupported media type.\n",
  "Annotations/No marker.md":
    "# A plain note\n\nThis note has no annotation-card metadata. It remains an ordinary Markdown document.\n",
};

const cardContents = (kind, id, body) =>
  `---\nmarginote-card: 1\nmarginote-id: ${id}\nmarginote-kind: ${kind}\n---\n${body}\n`;

export function englishFixtureUpdates() {
  const updates = { "QA Reading.md": source, ...ordinaryNotes };
  for (const [name, kind, id, body] of cards) {
    if (["Text", "Mixed", "Other text", "Long"].includes(name)) {
      updates[`Annotations/${name}.md`] = cardContents(kind, id, body);
    }
  }
  return updates;
}

const svg = (width, height) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 600 420"><title>Original geometric reading study</title><rect width="600" height="420" fill="#e7dfce"/><path d="M60 330V105L185 65V290Z" fill="#475853"/><path d="M205 65L335 110V335L205 290Z" fill="#8c6959"/><path d="M355 110L535 75V295L355 335Z" fill="#bda475"/><path d="M80 345L205 307L340 352L545 309" fill="none" stroke="#273b36" stroke-width="5"/><circle cx="475" cy="170" r="35" fill="#e7dfce"/></svg>\n`;

async function create(path, contents) {
  try {
    await writeFile(path, contents, { flag: "wx" });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
  }
}

export async function prepareFixtures(vault) {
  await Promise.all(
    ["Annotations", "Attachments", ".obsidian"].map((path) =>
      mkdir(join(vault, path), { recursive: true }),
    ),
  );
  for (const [name, kind, id, body] of cards) {
    await create(join(vault, "Annotations", `${name}.md`), cardContents(kind, id, body));
  }
  for (const [path, content] of Object.entries(ordinaryNotes))
    await create(join(vault, path), content);
  await Promise.all([
    create(join(vault, "QA Reading.md"), source),
    create(
      join(vault, "Authoring.md"),
      "# 작성 검증\n\n선택한 문구를 새 카드로 연결합니다.\n\n취소해도 이 원문은 보존되어야 합니다.\n\n`코드 내부 문구`와 [[Ordinary note|기존 링크]]도 보존합니다.\n",
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
