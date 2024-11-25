import fs from "node:fs/promises";
import { glob } from "glob";
import { Client } from "@notionhq/client";
import { markdownToBlocks } from "@tryfabric/martian";
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { decodeFileName } from "./decodeFileName";

const paths = glob.sync(`${import.meta.dirname}/../../output/**/*.md`);

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
if (!NOTION_TOKEN) {
  throw new Error("NOTION_TOKEN is required");
}
if (!NOTION_DATABASE_ID) {
  throw new Error("NOTION_DATABASE_ID is required");
}

const notion = new Client({
  auth: NOTION_TOKEN,
});

for (const path of paths) {
  const file = await fs.readFile(path, "utf-8");
  const blocks = markdownToBlocks(file);

  const fileName = path.split("/").pop()?.replace(".md", "");

  const decodedFileName = decodeFileName(fileName ?? "");

  const year = decodedFileName.split("/")[0];
  const department = decodedFileName.split("/")[1]?.split(".")[1];
  const position = decodedFileName.split("/")[2]?.split("_")[1];
  const type = decodedFileName.endsWith("総括") ? "総括" : "総括補遺";
  const title =
    decodedFileName
      .split("/")[2]
      ?.split("_")[2]
      ?.slice(0, type === "総括" ? -2 : -4) ?? "";
  const sortNumber = Number(
    (decodedFileName.split("/")[1]?.split(".")[0] ?? "999") +
      (decodedFileName.split("/")[2]?.split("_")[0] ?? "999"),
  );

  if (!year || !department || !position) {
    continue;
  }

  try {
    const { id } = await notion.pages.create({
      parent: {
        database_id: NOTION_DATABASE_ID,
      },
      properties: {
        title: {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: title,
              },
            },
          ],
        },
        期: {
          type: "select",
          select: {
            name: year,
          },
        },
        局: {
          type: "select",
          select: {
            name: department,
          },
        },
        担当: {
          type: "rich_text",
          rich_text: [
            {
              type: "text",
              text: {
                content: position,
              },
            },
          ],
        },
        種別: {
          type: "select",
          select: {
            name: type,
          },
        },
        sortNumber: {
          type: "number",
          number: sortNumber,
        },
      },
    });

    for (let i = 0; i < blocks.length; i += 100) {
      const chunk = blocks.slice(i, i + 100);
      await notion.blocks.children.append({
        block_id: id,
        children: chunk as BlockObjectRequest[],
      });
    }
    console.log(`Success: ${year} ${department} ${position} ${type} ${title}`);
  } catch (e) {
    console.error(`Failed: ${year} ${department} ${position} ${type} ${title}`);
  }
}
