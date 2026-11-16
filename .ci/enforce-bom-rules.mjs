#!/usr/bin/env node
// @ts-check
/**
 * Self-validation half of the BOM dependency-enforcement mechanism
 * (`.ai/skills/_shared/framework-guidelines.md` §5): for every
 * `packages/bom-*-js/qe.bom.json`, checks that its paired `@qe/base-*-js`
 * package's own `package.json` dependency versions agree, entry for entry,
 * with the BOM's `managed` map — catching drift at the source before it's
 * ever published. The TS analogue of the sibling Java repo's
 * `.ci/enforce-bom-rules.sh` (which runs `maven-enforcer-plugin`'s
 * `dependencyConvergence`/`banDuplicatePomDependencyVersions` against its
 * `qe-bom-*-java` modules).
 *
 * This script validates THIS repo against itself. The other half of the
 * mechanism — a published `qe-bom-guard` CLI that a *downstream consumer*
 * runs against its own lockfile, respecting each BOM's `overridable` list —
 * is a separate, larger piece of work (lockfile parsing across npm/pnpm/
 * yarn) that framework-guidelines.md §5.2 documents but this script does
 * not implement yet. Don't claim a consumer-facing command that doesn't
 * exist.
 *
 * Usage: node .ci/enforce-bom-rules.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findBomManifests() {
  return fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('bom-'))
    .map((entry) => path.join(PACKAGES_DIR, entry.name, 'qe.bom.json'))
    .filter((manifestPath) => fs.existsSync(manifestPath));
}

function basePackageJsonFor(bomManifest) {
  const manages = bomManifest.manages; // e.g. "@qe/base-web-js"
  const dirName = manages.replace(/^@qe\//, '');
  const packageJsonPath = path.join(PACKAGES_DIR, dirName, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { manages, packageJsonPath: undefined, packageJson: undefined };
  }
  return { manages, packageJsonPath, packageJson: readJson(packageJsonPath) };
}

function checkBom(manifestPath) {
  const bom = readJson(manifestPath);
  const { manages, packageJsonPath, packageJson } = basePackageJsonFor(bom);
  const violations = [];

  if (packageJson === undefined) {
    violations.push(`${manages}'s package.json does not exist at the expected path`);
    return { bomName: bom.name, manages, violations };
  }

  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const [depName, pinnedVersion] of Object.entries(bom.managed ?? {})) {
    const actualVersion = allDeps[depName];
    if (actualVersion === undefined) {
      // Not every managed entry has to be a direct dependency of the base package
      // (e.g. a core entry inherited by an api/web slice that doesn't itself need it).
      continue;
    }
    if (actualVersion !== pinnedVersion) {
      violations.push(
        `${depName}: ${manages}'s package.json has "${actualVersion}", but ${bom.name}'s qe.bom.json pins "${pinnedVersion}" (${path.relative(REPO_ROOT, packageJsonPath)})`,
      );
    }
  }

  return { bomName: bom.name, manages, violations };
}

function main() {
  const manifests = findBomManifests();
  if (manifests.length === 0) {
    console.error('No packages/bom-*-js/qe.bom.json manifests found.');
    process.exit(1);
  }

  let totalViolations = 0;
  for (const manifestPath of manifests) {
    const { bomName, manages, violations } = checkBom(manifestPath);
    if (violations.length === 0) {
      console.log(`PASS  ${bomName} -> ${manages}`);
      continue;
    }
    totalViolations += violations.length;
    console.error(`FAIL  ${bomName} -> ${manages}`);
    for (const violation of violations) {
      console.error(`      - ${violation}`);
    }
  }

  if (totalViolations > 0) {
    console.error(`\n${totalViolations} BOM violation(s) found.`);
    process.exit(1);
  }
  console.log('\nAll base packages agree with their BOM.');
}

main();
