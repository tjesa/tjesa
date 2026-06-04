const { Client } = require('@notionhq/client');

const token = "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";
const databaseId = "7ef6a526-8237-82af-9225-87ec07e95f20";

const notion = new Client({ auth: token });

async function run() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      page_size: 5
    });

    console.log("Found pages count:", response.results.length);
    for (const page of response.results) {
      console.log(`Page: ${page.id}`);
      console.log("Properties keys:", Object.keys(page.properties));
      console.log("Check column:", JSON.stringify(page.properties['check'], null, 2));
      console.log("Select column:", JSON.stringify(page.properties['select'], null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
