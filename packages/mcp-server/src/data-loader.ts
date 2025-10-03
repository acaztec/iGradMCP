import * as XLSX from "xlsx";
import * as path from "path";
import { fileURLToPath } from "url";
import type { LessonRow, CourseInfo, CatalogData, Pillar } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export function loadCatalog(): CatalogData {
  const excelPath = path.join(__dirname, "../../../data/Samples for AI prototype.xlsx");
  const workbook = XLSX.readFile(excelPath);

  const lessons: LessonRow[] = [];
  const coursesMap = new Map<string, CourseInfo>();
  const subjectsByCourseName = new Map<string, Set<string>>();
  const unitsByCourseSubjectKey = new Map<string, string[]>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const pillar = normalizePillar(sheetName);

    for (const row of rows) {
      const course = String(row.Course || row.course || "").trim();
      const subject = String(row.Subject || row.subject || "").trim();
      const unit = String(row.Unit || row.unit || "").trim();
      const lesson = String(row.Lesson || row.lesson || "").trim();
      const code = String(row.Code || row.code || "").trim();
      const description = String(row.Description || row.description || "").trim();

      if (!course || !code) continue;

      const lessonRow: LessonRow = {
        course,
        subject,
        unit,
        lesson,
        code,
        description,
        pillar,
        sheet: sheetName,
      };

      lessons.push(lessonRow);

      if (!coursesMap.has(course)) {
        coursesMap.set(course, {
          name: course,
          pillar,
          subjects: [],
        });
      }

      if (subject) {
        if (!subjectsByCourseName.has(course)) {
          subjectsByCourseName.set(course, new Set());
        }
        subjectsByCourseName.get(course)!.add(subject);
      }

      if (subject && unit) {
        const key = `${course}::${subject}`;
        if (!unitsByCourseSubjectKey.has(key)) {
          unitsByCourseSubjectKey.set(key, []);
        }
        const existingUnits = unitsByCourseSubjectKey.get(key)!;
        if (!existingUnits.includes(unit)) {
          existingUnits.push(unit);
        }
      }
    }
  }

  for (const [courseName, subjects] of subjectsByCourseName.entries()) {
    const courseInfo = coursesMap.get(courseName);
    if (courseInfo) {
      courseInfo.subjects = Array.from(subjects);
    }
  }

  return {
    lessons,
    courses: coursesMap,
    subjectsByCourse: subjectsByCourseName,
    unitsByCourseSubject: unitsByCourseSubjectKey,
  };
}
