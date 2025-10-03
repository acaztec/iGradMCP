import type { CatalogData } from "./types.js";

export function registerResources(catalog: CatalogData) {
  return {
    "aztec://courses": {
      uri: "aztec://courses",
      name: "Course List",
      description: "List all available courses with pillar tags",
      mimeType: "application/json",
      handler: () => {
        const courses = Array.from(catalog.courses.values()).map((c) => ({
          name: c.name,
          pillar: c.pillar,
          subjects: c.subjects,
        }));
        return {
          contents: [
            {
              uri: "aztec://courses",
              mimeType: "application/json",
              text: JSON.stringify(courses, null, 2),
            },
          ],
        };
      },
    },
    "aztec://course/{course}/subjects": {
      uri: "aztec://course/{course}/subjects",
      name: "Course Subjects",
      description: "List subjects for a specific course",
      mimeType: "application/json",
      handler: (uri: string) => {
        const match = uri.match(/aztec:\/\/course\/([^/]+)\/subjects/);
        if (!match) throw new Error("Invalid URI format");
        const courseName = decodeURIComponent(match[1]);
        const courseInfo = catalog.courses.get(courseName);
        if (!courseInfo) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Course not found" }),
              },
            ],
          };
        }
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({ course: courseName, subjects: courseInfo.subjects }, null, 2),
            },
          ],
        };
      },
    },
    "aztec://course/{course}/subject/{subject}/units": {
      uri: "aztec://course/{course}/subject/{subject}/units",
      name: "Subject Units",
      description: "List units for a specific course and subject",
      mimeType: "application/json",
      handler: (uri: string) => {
        const match = uri.match(/aztec:\/\/course\/([^/]+)\/subject\/([^/]+)\/units/);
        if (!match) throw new Error("Invalid URI format");
        const courseName = decodeURIComponent(match[1]);
        const subjectName = decodeURIComponent(match[2]);
        const key = `${courseName}::${subjectName}`;
        const units = catalog.unitsByCourseSubject.get(key) || [];
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                { course: courseName, subject: subjectName, units },
                null,
                2
              ),
            },
          ],
        };
      },
    },
    "aztec://lesson/{code}": {
      uri: "aztec://lesson/{code}",
      name: "Lesson Details",
      description: "Get full details for a lesson by code",
      mimeType: "application/json",
      handler: (uri: string) => {
        const match = uri.match(/aztec:\/\/lesson\/([^/]+)/);
        if (!match) throw new Error("Invalid URI format");
        const code = decodeURIComponent(match[1]);
        const lesson = catalog.lessons.find((l) => l.code === code);
        if (!lesson) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ error: "Lesson not found" }),
              },
            ],
          };
        }
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(lesson, null, 2),
            },
          ],
        };
      },
    },
  };
}
