export type Pillar = "academic" | "soft" | "cte";

export interface LessonRow {
  course: string;
  subject: string;
  unit: string;
  lesson: string;
  code: string;
  description: string;
  pillar: Pillar;
  sheet: string;
}

export interface CourseInfo {
  name: string;
  pillar: Pillar;
  subjects: string[];
}

export interface CatalogData {
  lessons: LessonRow[];
  courses: Map<string, CourseInfo>;
  subjectsByCourse: Map<string, Set<string>>;
  unitsByCourseSubject: Map<string, string[]>;
}
