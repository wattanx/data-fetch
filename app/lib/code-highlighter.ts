import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

export type CodeLanguage = "markdown" | "tsx" | "typescript";

const highlighterPromise = Promise.all([
  import("shiki/langs/tsx.mjs"),
  import("shiki/langs/typescript.mjs"),
  import("shiki/langs/markdown.mjs"),
  import("shiki/themes/github-dark-default.mjs"),
]).then(([tsx, typescript, markdown, githubDarkDefault]) =>
  createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [tsx.default, typescript.default, markdown.default],
    themes: [githubDarkDefault.default],
  }),
);

export async function highlightCode(code: string, lang: CodeLanguage) {
  const highlighter = await highlighterPromise;
  return highlighter.codeToHtml(code, {
    lang,
    theme: "github-dark-default",
  });
}
