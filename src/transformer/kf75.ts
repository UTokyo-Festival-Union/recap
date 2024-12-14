import type { Transformer } from "./types";

export const kf75Transformer: Transformer = (line) => {
  let replacedLine = line;
  // まずは行頭の記法から変換する

  // 見出し
  if (replacedLine.startsWith("*")) {
    // 行頭から連続する * の数を数える
    const level = replacedLine.match(/^\*+/)?.[0].length;
    // 行頭の * を # に置換する
    if (level) {
      replacedLine = `${"#".repeat(level)} ${replacedLine.slice(level)}`;
    }
  }
  // 箇条書き
  if (replacedLine.startsWith("-")) {
    // 行頭から連続する - の数を数える
    const level = replacedLine.match(/^-+/)?.[0].length;
    // (level - 1) * 2 個のスペースを行頭に追加して - を 1 個だけにする
    if (level) {
      replacedLine = `${"  ".repeat(level - 1)}- ${replacedLine.slice(level)}`;
    }
  }
  // 引用
  if (replacedLine.startsWith("&&")) {
    // 行頭の && を > に置換する
    replacedLine = `| ${replacedLine.slice(2)}`;
  }

  // 次に行内の記法を変換する

  // 太字（$ で囲まれた部分）
  replacedLine = replacedLine.replace(/\$(.+?)\$/g, "**$1**");

  // 下線強調（\\ で囲まれた部分）
  replacedLine = replacedLine.replace(/\\\\(.+?)\\\\/g, "*$1*");

  // 打ち消し線（%% で囲まれた部分）
  replacedLine = replacedLine.replace(/%%(.+?)%%/g, "~~$1~~");

  return replacedLine;
};
