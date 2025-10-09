import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type Pillar = "academic" | "soft" | "cte";

export interface LessonRecord {
  course: string;
  subject: string;
  unit: string;
  lesson: string;
  code: string;
  description: string;
  pillar: Pillar;
  sheet: string;
}

export interface CatalogData {
  lessons: LessonRecord[];
}

const CATALOG_FILENAME = "Samples for AI prototype.xlsx";

let cachedCatalog: CatalogData | null = null;

function resolveCatalogPath(): string {
  const explicitPath = process.env.CATALOG_PATH;

  if (explicitPath) {
    const normalizedExplicitPath = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(explicitPath);

    if (fs.existsSync(normalizedExplicitPath)) {
      return normalizedExplicitPath;
    }

    console.warn(
      `CATALOG_PATH was set to "${explicitPath}" but no file was found. Falling back to directory search.`
    );
  }

  const candidateDirs = new Set<string>();
  const cwd = process.cwd();

  candidateDirs.add(path.resolve(cwd, "data"));
  candidateDirs.add(path.resolve(cwd, "../data"));
  candidateDirs.add(path.resolve(cwd, "../../data"));

  let currentDir = __dirname;
  for (let i = 0; i < 10; i += 1) {
    candidateDirs.add(path.resolve(currentDir, "data"));
    currentDir = path.dirname(currentDir);
  }

  for (const dir of candidateDirs) {
    const candidate = path.join(dir, CATALOG_FILENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate curriculum catalog at ${CATALOG_FILENAME}. ` +
      "Ensure the data directory is available during runtime or provide an absolute path via the CATALOG_PATH environment variable."
  );
}

function normalizePillar(sheetName: string): Pillar {
  const lower = sheetName.toLowerCase();
  if (lower.includes("bridge") || lower.includes("pre-hse") || lower.includes("academic")) {
    return "academic";
  }
  if (lower.includes("ready for work") || lower.includes("soft")) {
    return "soft";
  }
  if (lower.includes("cbcs") || lower.includes("cte")) {
    return "cte";
  }
  return "academic";
}

function loadCatalogFromDisk(): CatalogData {
  const workbook = XLSX.readFile(resolveCatalogPath());
  const lessons: LessonRecord[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });
    const pillar = normalizePillar(sheetName);

    for (const row of rows) {
      const course = String(row.Course ?? row.course ?? "").trim();
      const subject = String(row.Subject ?? row.subject ?? "").trim();
      const unit = String(row.Unit ?? row.unit ?? "").trim();
      const lesson = String(row.Lesson ?? row.lesson ?? "").trim();
      const code = String(row.Code ?? row.code ?? "").trim();
      const description = String(row.Description ?? row.description ?? "").trim();

      if (!course || !code) continue;

      lessons.push({
        course,
        subject,
        unit,
        lesson,
        code,
        description,
        pillar,
        sheet: sheetName,
      });
    }
  }

  return { lessons };
}

export function getCatalog(): CatalogData {
  if (!cachedCatalog) {
    cachedCatalog = loadCatalogFromDisk();
  }
  return cachedCatalog;
}

export function searchLessons(
  query: string,
  options: { pillar?: Pillar; ccCode?: string } = {}
) {
  const { lessons } = getCatalog();
  const lowerQuery = query.toLowerCase();
  const { pillar, ccCode } = options;

  return lessons.filter((lesson) => {
    const matchesQuery =
      lesson.lesson.toLowerCase().includes(lowerQuery) ||
      lesson.description.toLowerCase().includes(lowerQuery) ||
      lesson.code.toLowerCase().includes(lowerQuery) ||
      lesson.subject.toLowerCase().includes(lowerQuery) ||
      lesson.unit.toLowerCase().includes(lowerQuery) ||
      lesson.course.toLowerCase().includes(lowerQuery);

    const matchesPillar = !pillar || lesson.pillar === pillar;
    const matchesCode = !ccCode || lesson.code.toLowerCase().includes(ccCode.toLowerCase());

    return matchesQuery && matchesPillar && matchesCode;
  });
}

export function lessonsByCourse(courseName: string) {
  const { lessons } = getCatalog();
  return lessons.filter((lesson) => lesson.course.toLowerCase() === courseName.toLowerCase());
}
