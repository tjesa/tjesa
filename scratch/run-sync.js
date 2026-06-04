const { Client } = require('@notionhq/client');

const token = "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";
const databaseId = "7ef6a526-8237-82af-9225-87ec07e95f20";

const notion = new Client({ auth: token });

async function run() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: databaseId
    });

    const pages = response.results;
    console.log(`Processing ${pages.length} pages...`);

    for (const page of pages) {
      const triggerProp = page.properties['check'];
      const targetPropDesc = page.properties['QR Code'];

      console.log(`\nPage ID: ${page.id}`);
      console.log(`Checkbox is: ${triggerProp ? triggerProp.checkbox : 'not found'}`);
      console.log(`Target column type: ${targetPropDesc ? targetPropDesc.type : 'not found'}`);
      console.log(`Target column files count: ${targetPropDesc && targetPropDesc.files ? targetPropDesc.files.length : 0}`);

      // Evaluate condition
      let conditionMet = true;
      if (!triggerProp || triggerProp.type !== 'checkbox' || !triggerProp.checkbox) {
        conditionMet = false;
      }

      if (!conditionMet) {
        console.log(`Condition not met. Clearing target column...`);
        if (targetPropDesc && targetPropDesc.type === 'files' && targetPropDesc.files && targetPropDesc.files.length > 0) {
          const clearProperties = {
            'QR Code': {
              files: []
            }
          };
          await notion.pages.update({
            page_id: page.id,
            properties: clearProperties
          });
          console.log(`Successfully cleared QR Code for page ${page.id}`);
        } else {
          console.log(`Already empty, no action taken.`);
        }
      } else {
        console.log(`Condition met, should generate/keep QR Code.`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
