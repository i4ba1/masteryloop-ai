import ts from "typescript";
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const normalize = (path) => path.replaceAll("\\", "/");
export function importsIn(source, runtimeOnly = false) {
  const file = ts.createSourceFile(
    "module.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const imports = [];
  function visit(node) {
    if (runtimeOnly && isTypeOnly(node)) return;
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      imports.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      imports.push(node.arguments[0].text);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      imports.push(node.argument.literal.text);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return imports;
}
function isTypeOnly(node) {
  if (ts.isImportTypeNode(node)) return true;
  if (ts.isImportDeclaration(node)) {
    const clause = node.importClause;
    if (clause?.isTypeOnly) return true;
    const bindings = clause?.namedBindings;
    return (
      !clause?.name &&
      bindings &&
      ts.isNamedImports(bindings) &&
      bindings.elements.length > 0 &&
      bindings.elements.every((item) => item.isTypeOnly)
    );
  }
  if (ts.isExportDeclaration(node)) {
    const clause = node.exportClause;
    return (
      node.isTypeOnly ||
      (clause &&
        ts.isNamedExports(clause) &&
        clause.elements.length > 0 &&
        clause.elements.every((item) => item.isTypeOnly))
    );
  }
  return false;
}
export function directivesIn(source) {
  const file = ts.createSourceFile(
    "module.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const directives = [];
  for (const statement of file.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    directives.push(statement.expression.text);
  }
  return directives;
}
// Server-action modules are RPC boundaries; their dependencies execute on the
// server. Type-only references never enter the browser dependency graph.
export function clientBoundaryErrors(modules) {
  const errors = [];
  for (const [root, entry] of modules) {
    if (!directivesIn(entry.source).includes("use client")) continue;
    const visited = new Set();
    function visit(path, chain) {
      if (visited.has(path)) return;
      visited.add(path);
      const module = modules.get(path);
      if (!module) return;
      if (directivesIn(module.source).includes("use server") && path !== root) return;
      const imports = importsIn(module.source, true);
      if (
        imports.some(
          (specifier) =>
            ["server-only", "next/headers", "next/server"].includes(specifier) ||
            specifier.startsWith("node:"),
        )
      ) {
        errors.push(`Client imports server-only code: ${[...chain, path].join(" -> ")}`);
        return;
      }
      for (const dependency of module.dependencies) visit(dependency, [...chain, path]);
    }
    visit(root, []);
  }
  return errors;
}
export function boundaryErrors(filePath, imports) {
  const file = normalize(filePath);
  const errors = [];
  for (const specifier of imports) {
    const internal = specifier.startsWith(".");
    const target = internal ? normalize(resolve(dirname(resolve(file)), specifier)) : specifier;
    if (file.startsWith("packages/domain/") && !(internal && target.includes("/packages/domain/")))
      errors.push(`Domain dependency: ${specifier}`);
    if (
      file.startsWith("packages/application/") &&
      !(
        (internal && target.includes("/packages/application/")) ||
        ["@masteryloop/domain", "@masteryloop/contracts"].includes(specifier)
      )
    )
      errors.push(`Application dependency: ${specifier}`);
    if (
      file.startsWith("packages/contracts/") &&
      !(specifier === "zod" || (internal && target.includes("/packages/contracts/")))
    )
      errors.push(`Unsafe contract dependency: ${specifier}`);
    const feature = file.match(/\/features\/([^/]+)\//)?.[1];
    const destination = specifier.startsWith("@/") ? specifier.slice(2) : target;
    const otherFeature = destination.match(/(?:^|\/)features\/([^/]+)\/(.+)/);
    if (
      feature &&
      otherFeature &&
      feature !== otherFeature[1] &&
      !["index", "index.ts", "server", "server.ts"].includes(otherFeature[2])
    )
      errors.push(`Cross-feature deep import: ${specifier}`);
  }
  return errors;
}
function filesUnder(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", ".next", "dist"].includes(entry.name)) return [];
    const path = resolve(root, entry.name);
    return entry.isDirectory()
      ? filesUnder(path)
      : /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")
        ? [path]
        : [];
  });
}
export function checkArchitecture() {
  const files = ["packages", "apps/web/src"].flatMap(filesUnder);
  const errors = [];
  const graph = new Map();
  const clientModules = new Map();
  const options = {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    baseUrl: resolve("apps/web"),
    paths: { "@/*": ["src/*"] },
  };
  for (const file of files) {
    const imports = importsIn(readFileSync(file, "utf8"));
    const name = normalize(relative(process.cwd(), file));
    for (const error of boundaryErrors(name, imports)) errors.push(`${name}: ${error}`);
    const edges = imports
      .map(
        (specifier) =>
          ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule?.resolvedFileName,
      )
      .filter(Boolean)
      .map((path) => realpathSync(path))
      .filter((path) => files.includes(path));
    graph.set(file, edges);
    const source = readFileSync(file, "utf8");
    const dependencies = importsIn(source, true)
      .map(
        (specifier) =>
          ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule?.resolvedFileName,
      )
      .filter(Boolean)
      .map((path) => realpathSync(path))
      .filter((path) => files.includes(path));
    clientModules.set(file, { source, dependencies });
  }
  const active = new Set();
  const done = new Set();
  function visit(file) {
    if (active.has(file)) {
      errors.push(`Circular dependency at ${normalize(relative(process.cwd(), file))}`);
      return;
    }
    if (done.has(file)) return;
    active.add(file);
    for (const edge of graph.get(file) ?? []) visit(edge);
    active.delete(file);
    done.add(file);
  }
  for (const file of files) visit(file);
  errors.push(...clientBoundaryErrors(clientModules));
  return errors;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkArchitecture();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log("Architecture boundaries and circular-dependency check passed.");
}
