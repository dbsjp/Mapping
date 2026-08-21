import fs from "node:fs";
import vm from "node:vm";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass the source HTML path.");

const html = fs.readFileSync(sourcePath, "utf8");
const start = html.indexOf("const nodes=[");
const end = html.indexOf("let selectedId=", start);
if (start < 0 || end < 0) throw new Error("Could not find the map data model.");

const context = {};
vm.runInNewContext(
  `${html.slice(start, end)}\nglobalThis.result = { nodes, links };`,
  context,
);

const nodes = context.result.nodes
  .filter((node) => node.id !== "placeholder")
  .map(({ id, title, group, description }) => ({
    id,
    title,
    group: group.replace(/^Quality assurance$/, "Quality Assurance")
      .replace(/^Classroom practice$/, "Classroom Practice")
      .replace(/^Dialogue & review$/, "Dialogue & Review"),
    description,
  }));

const ids = new Set(nodes.map((node) => node.id));
const links = context.result.links
  .filter(([source, target]) => ids.has(source) && ids.has(target))
  .map(([source, target]) => ({ source, target, type: "influences" }));

fs.writeFileSync(
  new URL("../data.js", import.meta.url),
  `window.SCHOOL_MAP = ${JSON.stringify({ nodes, links }, null, 2)};\n`,
);

console.log(`Extracted ${nodes.length} nodes and ${links.length} relationships.`);
