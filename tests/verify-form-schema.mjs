import { readFileSync } from "node:fs";

const source = readFileSync("app/document.ts", "utf8");
const schema = JSON.parse(
  readFileSync("app/api/responses/fields.json", "utf8"),
);

const inputTags = source.match(/<input\b[^>]*>/g) ?? [];
const textareaTags = source.match(/<textarea\b[^>]*>/g) ?? [];
const tags = [...inputTags, ...textareaTags];

const names = new Set();
const valuesByName = new Map();

for (const tag of tags) {
  const name = tag.match(/name=\\"([^\"]+)\\"/)?.[1];
  if (!name) continue;

  names.add(name);

  const value = tag.match(/value=\\"([^\"]*)\\"/)?.[1];
  if (value !== undefined) {
    const values = valuesByName.get(name) ?? new Set();
    values.add(value);
    valuesByName.set(name, values);
  }
}

const schemaNames = new Set(Object.keys(schema));
const missingInHtml = [...schemaNames].filter((name) => !names.has(name));
const missingInSchema = [...names].filter((name) => !schemaNames.has(name));

if (missingInHtml.length || missingInSchema.length) {
  console.error("Form/schema field mismatch");
  if (missingInHtml.length) {
    console.error("Missing in HTML:", missingInHtml.join(", "));
  }
  if (missingInSchema.length) {
    console.error("Missing in API schema:", missingInSchema.join(", "));
  }
  process.exit(1);
}

for (const [name, spec] of Object.entries(schema)) {
  if (!Array.isArray(spec.values)) continue;

  const htmlValues = [...(valuesByName.get(name) ?? new Set())].sort();
  const schemaValues = [...spec.values].sort();

  if (JSON.stringify(htmlValues) !== JSON.stringify(schemaValues)) {
    console.error(`Allowed values mismatch for ${name}`);
    console.error("HTML:", htmlValues);
    console.error("Schema:", schemaValues);
    process.exit(1);
  }
}

console.log(
  `Form schema verified: ${schemaNames.size} fields and all enumerated values match.`,
);
