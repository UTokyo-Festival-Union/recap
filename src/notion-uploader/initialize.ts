import { Client } from "@notionhq/client";
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { markdownToBlocks } from "@tryfabric/martian";
import { sectionListData } from "../data/sections";
import { userListData } from "../data/users";
const {
  NOTION_TOKEN,
  INIT_USER_LIST_NOTION_DATABASE_ID,
  INIT_RECAP_LIST_NOTION_DATABASE_ID,
  INIT_SECTION_LIST_NOTION_DATABASE_ID,
  INIT_TEXT,
  INIT_YEAR,
} = process.env;
if (!NOTION_TOKEN) {
  throw new Error("NOTION_TOKEN is required");
}
if (!INIT_USER_LIST_NOTION_DATABASE_ID) {
  throw new Error("INIT_USER_LIST_NOTION_DATABASE_ID is required");
}
if (!INIT_RECAP_LIST_NOTION_DATABASE_ID) {
  throw new Error("INIT_RECAP_LIST_NOTION_DATABASE_ID is required");
}
if (!INIT_SECTION_LIST_NOTION_DATABASE_ID) {
  throw new Error("INIT_SECTION_LIST_NOTION_DATABASE_ID is required");
}
if (!INIT_TEXT) {
  throw new Error("INIT_TEXT is required");
}
if (!INIT_YEAR) {
  throw new Error("INIT_YEAR is required");
}

const notion = new Client({
  auth: NOTION_TOKEN,
});

const sectionIdDict: { [key: string]: string } = {};
const userIdDict: { [key: string]: string } = {};

console.log("Starting section creation...");
await createSections();

console.log("Starting user creation...");
await createUsers();

console.log("Starting recap creation...");
await createRecaps();

console.log("All tasks completed!");

async function createSections() {
  for (const [
    index,
    { name, abbr, departments },
  ] of sectionListData.entries()) {
    if (!name || !abbr || !departments) continue;

    try {
      const { id: sectionId } = await notion.pages.create({
        parent: { database_id: INIT_SECTION_LIST_NOTION_DATABASE_ID as string },
        properties: {
          担当名: {
            type: "title",
            title: [{ type: "text", text: { content: name } }],
          },
          略称: {
            type: "rich_text",
            rich_text: [{ type: "text", text: { content: abbr } }],
          },
          局: {
            type: "multi_select",
            multi_select: departments.map((department) => ({
              name: department,
            })),
          },
          sortNumber: {
            type: "number",
            number: index,
          },
        },
      });
      sectionIdDict[abbr] = sectionId;
      console.log(`Section created: ${name} (${abbr})`);
    } catch (error) {
      console.error(`Failed to create section: ${name} (${abbr})`, error);
    }
  }
}

async function createUsers() {
  for (const { name, kanji, grade, sections } of userListData) {
    if (!name || !grade || !sections) continue;

    try {
      const { id: userId } = await notion.pages.create({
        parent: { database_id: INIT_USER_LIST_NOTION_DATABASE_ID as string },
        properties: {
          よみがな: {
            type: "title",
            title: [{ type: "text", text: { content: name } }],
          },
          氏名: {
            type: "rich_text",
            rich_text: [{ type: "text", text: { content: kanji } }],
          },
          学年: {
            type: "select",
            select: { name: grade },
          },
          担当: {
            type: "relation",
            relation: sections.map((section) => ({
              id: sectionIdDict[section] as string,
            })),
          },
        },
      });
      userIdDict[name] = userId;
      console.log(`User created: ${name}`);
    } catch (error) {
      console.error(`Failed to create user: ${name}`, error);
    }
  }
}

async function createRecaps() {
  for (const [i, { abbr }] of sectionListData.entries()) {
    if (!abbr || !sectionIdDict[abbr]) {
      console.error(`Skipping recap creation for: ${abbr}`);
      continue;
    }

    const usersInSection = userListData.filter((user) =>
      user.sections.includes(abbr),
    );

    for (const [j, { name }] of usersInSection.entries()) {
      if (!userIdDict[name]) {
        console.error(`User not found for recap creation: ${name}`);
        continue;
      }

      try {
        const { id: blockId } = await notion.pages.create({
          parent: { database_id: INIT_RECAP_LIST_NOTION_DATABASE_ID as string },
          properties: {
            委員よみがな: {
              type: "title",
              title: [
                {
                  type: "mention",
                  mention: {
                    page: { id: userIdDict[name] },
                  },
                },
              ],
            },
            期: {
              type: "select",
              select: { name: INIT_YEAR as string },
            },
            担当: {
              type: "relation",
              relation: [{ id: sectionIdDict[abbr] }],
            },
            sortNumber: {
              type: "number",
              number: i * 100 + j,
            },
          },
        });
        await notion.blocks.children.append({
          block_id: blockId,
          children: markdownToBlocks(
            INIT_TEXT as string,
          ) as BlockObjectRequest[],
        });
        console.log(`Recap created for ${name} in ${abbr}`);
      } catch (error) {
        console.error(`Failed to create recap for ${name} (${abbr})`, error);
      }
    }
  }
}
