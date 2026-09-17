import { readdirSync, readFileSync } from "node:fs";
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory() ? walk(`${path}/${item.name}`) : [`${path}/${item.name}`],
  );
}
const forbidden = [/SUPABASE_SERVICE_ROLE_KEY/, /OPENAI_API_KEY/, /sb_secret_[A-Za-z0-9_-]+/];
for (const file of walk("apps/web/.next/static")) {
  if (!file.endsWith(".js")) continue;
  const source = readFileSync(file, "utf8");
  if (forbidden.some((pattern) => pattern.test(source)))
    throw new Error(`Server secret marker in client bundle: ${file}`);
  for (const key of ["SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]) {
    if (process.env[key] && source.includes(process.env[key]))
      throw new Error(`Secret value in client bundle: ${file}`);
  }
}
console.log("Client bundle secret checks passed.");
