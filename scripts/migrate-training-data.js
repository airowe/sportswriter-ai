const fs = require('fs');
const path = require('path');

const oldDataFile = path.join(process.cwd(), 'training-data.json');
const newDataFile = path.join(process.cwd(), 'training-samples.json');

function migrateData() {
  console.log('Starting migration...');

  // Check if old file exists
  if (!fs.existsSync(oldDataFile)) {
    console.log('No training-data.json found. Nothing to migrate.');
    return;
  }

  // Read old data
  const oldContent = fs.readFileSync(oldDataFile, 'utf-8');
  const oldData = oldContent ? JSON.parse(oldContent) : [];

  console.log(`Found ${oldData.length} articles to migrate.`);

  // Check if new file exists
  let newData = [];
  if (fs.existsSync(newDataFile)) {
    const newContent = fs.readFileSync(newDataFile, 'utf-8');
    newData = newContent ? JSON.parse(newContent) : [];
    console.log(`Existing training-samples.json has ${newData.length} samples.`);
  }

  // Convert old format to new format
  const migratedSamples = oldData.map((article, index) => {
    const bodyText = typeof article.body === 'string' 
      ? article.body 
      : Array.isArray(article.body) 
        ? article.body.join('\n\n') 
        : JSON.stringify(article.body);

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      prompt: `Write a sports article about: ${article.title}`,
      response: bodyText,
      sport: undefined,
      contentType: undefined,
      status: 'draft',
      source: 'imported',
      url: article.url,
      createdAt: article.savedAt || new Date().toISOString(),
      updatedAt: article.savedAt || new Date().toISOString(),
    };
  });

  // Merge with existing samples (avoid duplicates by URL)
  const existingUrls = new Set(newData.filter(s => s.url).map(s => s.url));
  const uniqueMigratedSamples = migratedSamples.filter(
    s => !s.url || !existingUrls.has(s.url)
  );

  const finalData = [...newData, ...uniqueMigratedSamples];

  // Write to new file
  fs.writeFileSync(newDataFile, JSON.stringify(finalData, null, 2));

  console.log(`Migration complete! Added ${uniqueMigratedSamples.length} new samples.`);
  console.log(`Total samples in training-samples.json: ${finalData.length}`);
}

migrateData();
