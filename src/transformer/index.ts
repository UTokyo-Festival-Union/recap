import fs from "node:fs/promises";
import { glob } from "glob";
import { mf98Transformer } from "./mf97";

const paths = glob.sync(`${import.meta.dirname}/../../wiki/**/*.txt`);

for (const path of paths) {
  const file = await fs.readFile(path, "utf-8");
  const replacedFile = file.split("\n").map(mf98Transformer).join("\n");
  const fileName = path.replace("wiki", "output").replace(".txt", ".md");
  await fs.mkdir(fileName.replace(/\/[^/]+$/, ""), { recursive: true });
  await fs.writeFile(fileName, replacedFile);
}
