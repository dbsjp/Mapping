import fs from "node:fs";
import vm from "node:vm";

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL("../data.js", import.meta.url), "utf8"), context);

const { nodes, links } = context.window.SCHOOL_MAP;
const expectedGroups = new Set([
  "Quality Assurance",
  "Strategy",
  "Curriculum",
  "Evidence",
  "Classroom Practice",
  "Dialogue & Review",
]);
const ids = new Set(nodes.map((node) => node.id));

const checks = [
  [nodes.length === 30, `Expected 30 substantive nodes; found ${nodes.length}`],
  [links.length === 102, `Expected 102 directed relationships; found ${links.length}`],
  [ids.size === nodes.length, "Node IDs must be unique"],
  [!ids.has("placeholder"), "The demonstration placeholder must be excluded"],
  [nodes.every((node) => expectedGroups.has(node.group)), "Every node must use an established category"],
  [links.every((link) => ids.has(link.source) && ids.has(link.target)), "Every relationship must reference existing nodes"],
  [links.every((link) => link.type === "influences"), "Initial relationship type must be influences"],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Validated 30 nodes, 102 directed relationships and six categories.");
}
