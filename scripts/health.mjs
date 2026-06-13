import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoots = ["outputs/core", "outputs/scenes", "outputs/shaders"];
const warnAt = 220;
const overAt = 300;

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && full.endsWith(".js")) files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(root, file);
}

function lineCount(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function collectTopLevelFunctions(text) {
  const names = [];
  const re = /^(?:export\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  for (const match of text.matchAll(re)) names.push(match[1]);
  return names;
}

function collectExports(text) {
  const exports = [];
  const re = /^export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z_$][\w$]*)/gm;
  for (const match of text.matchAll(re)) exports.push(match[1]);
  return exports;
}

function collectNamedImports(text) {
  const imports = new Set();
  const re = /import\s*\{([\s\S]*?)\}\s*from\s*["'][^"']+["']/g;
  for (const match of text.matchAll(re)) {
    const names = match[1]
      .split(",")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => part.split(/\s+as\s+/)[0].trim());
    for (const name of names) imports.add(name);
  }
  return imports;
}

function collectDomRefs(text) {
  const ids = [];
  const re = /getElementById\(\s*["']([^"']+)["']\s*\)/g;
  for (const match of text.matchAll(re)) ids.push(match[1]);
  return ids;
}

async function main() {
  const files = (await Promise.all(sourceRoots.map(dir => walk(path.join(root, dir)))))
    .flat()
    .sort();
  const records = [];
  const functionsByName = new Map();
  const exportsByName = new Map();
  const importedNames = new Set();
  let totalLines = 0;
  let violations = 0;

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const lines = lineCount(text);
    totalLines += lines;
    records.push({ file, lines });

    for (const name of collectTopLevelFunctions(text)) {
      const list = functionsByName.get(name) || [];
      list.push(rel(file));
      functionsByName.set(name, list);
    }

    for (const name of collectExports(text)) {
      const list = exportsByName.get(name) || [];
      list.push(rel(file));
      exportsByName.set(name, list);
    }

    for (const name of collectNamedImports(text)) importedNames.add(name);
  }

  records.sort((a, b) => b.lines - a.lines || rel(a.file).localeCompare(rel(b.file)));
  const worst = records[0] || { file: "(none)", lines: 0 };

  console.log("Source line counts");
  console.log("==================");
  for (const record of records) {
    let flag = "";
    if (record.lines > overAt) {
      flag = " OVER BUDGET";
      violations++;
    } else if (record.lines > warnAt) {
      flag = " warn";
    }
    console.log(`${String(record.lines).padStart(4)}  ${rel(record.file)}${flag}`);
  }

  console.log("\nDuplicate top-level function names");
  console.log("==================================");
  const duplicates = [...functionsByName.entries()].filter(([, files]) => files.length > 1);
  if (!duplicates.length) console.log("none");
  for (const [name, locations] of duplicates) {
    violations++;
    console.log(`${name}: ${locations.join(", ")}`);
  }

  console.log("\nExported names never imported");
  console.log("=============================");
  const unusedExports = [...exportsByName.entries()]
    .filter(([name]) => !importedNames.has(name))
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (!unusedExports.length) console.log("none");
  for (const [name, locations] of unusedExports) {
    console.log(`${name}: ${locations.join(", ")}`);
  }

  console.log("\nui.js DOM refs without matching index.html id");
  console.log("=============================================");
  const uiFile = path.join(root, "outputs/core/ui.js");
  const indexFile = path.join(root, "outputs/index.html");
  const missingRefs = [];
  if (await exists(uiFile) && await exists(indexFile)) {
    const [uiText, indexText] = await Promise.all([
      fs.readFile(uiFile, "utf8"),
      fs.readFile(indexFile, "utf8")
    ]);
    const ids = new Set([...indexText.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
    for (const id of collectDomRefs(uiText)) {
      if (!ids.has(id)) missingRefs.push(id);
    }
  }
  if (!missingRefs.length) console.log("none");
  for (const id of missingRefs) {
    violations++;
    console.log(id);
  }

  console.log(`\nSummary: total source lines ${totalLines}; worst file ${rel(worst.file)} (${worst.lines}); total violations ${violations}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 0;
});
