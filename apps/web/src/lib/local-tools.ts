import { jsonSchema, type Schema } from "ai";

import { Pillar, getCatalog, lessonsByCourse, searchLessons } from "./catalog";

type ToolHandler = (args: Record<string, unknown>) => Promise<any> | any;

type ToolDefinition = {
  description: string;
  parameters: Schema<Record<string, unknown>>;
  execute: ToolHandler;
};

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireNumberInRange(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
    throw new Error(`${field} must be a number between ${min} and ${max}`);
  }
  return value;
}

const sharedTools: Record<string, ToolDefinition> = {
  search_lessons: {
    description:
      "Search for lessons by query text, optionally filtered by pillar or course code. Returns matching lessons with their codes, course, subject, unit, and descriptions.",
    parameters: jsonSchema({
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", description: "Search query text" },
        pillar: {
          type: "string",
          enum: ["academic", "soft", "cte"],
          description:
            "Filter by pillar: academic (Bridge Pre-HSE), soft (Ready for Work), or cte (CBCS)",
        },
        ccCode: { type: "string", description: "Filter by specific course code" },
      },
      required: ["query"],
    }),
    execute: (args) => {
      const query = requireString(args.query, "query");
      const pillar = args.pillar as Pillar | undefined;
      const ccCode = typeof args.ccCode === "string" ? args.ccCode : undefined;

      const matches = searchLessons(query, { pillar, ccCode }).slice(0, 50).map((lesson) => ({
        code: lesson.code,
        course: lesson.course,
        subject: lesson.subject,
        unit: lesson.unit,
        lesson: lesson.lesson,
        description: lesson.description,
      }));

      return {
        content: [
          {
            type: "text",
            text: `Found ${matches.length} lessons matching "${query}"${pillar ? ` (pillar: ${pillar})` : ""}${ccCode ? ` (code filter: ${ccCode})` : ""}.\n\n${matches
              .map((m) => `• ${m.code}: ${m.lesson} (${m.course} > ${m.subject} > ${m.unit})`)
              .join("\n")}`,
          },
        ],
        structuredContent: {
          count: matches.length,
          matches,
        },
      };
    },
  },
  get_sequence: {
    description:
      "Get the ordered sequence of units and lessons for a course. For Academic pillar courses, returns prerequisites order.",
    parameters: jsonSchema({
      type: "object",
      additionalProperties: false,
      properties: {
        course: { type: "string", description: "Course name" },
      },
      required: ["course"],
    }),
    execute: (args) => {
      const course = requireString(args.course, "course");
      const lessons = lessonsByCourse(course);

      if (lessons.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Course "${course}" not found in catalog.`,
            },
          ],
        };
      }

      const unitsMap = new Map<string, typeof lessons>();
      for (const lesson of lessons) {
        const key = `${lesson.subject}::${lesson.unit}`;
        if (!unitsMap.has(key)) {
          unitsMap.set(key, []);
        }
        unitsMap.get(key)!.push(lesson);
      }

      const sequence = Array.from(unitsMap.entries()).map(([key, groupedLessons]) => {
        const [subject, unit] = key.split("::");
        return {
          subject,
          unit,
          lessons: groupedLessons.map((lesson) => ({
            code: lesson.code,
            lesson: lesson.lesson,
            description: lesson.description,
          })),
        };
      });

      return {
        content: [
          {
            type: "text",
            text: `Course "${course}" sequence:\n\n${sequence
              .map(
                (s) =>
                  `${s.subject} > ${s.unit}:\n${s.lessons.map((lesson) => ` • ${lesson.code}: ${lesson.lesson}`).join("\n")}`
              )
              .join("\n\n")}`,
          },
        ],
        structuredContent: {
          course,
          pillar: lessons[0].pillar,
          sequence,
        },
      };
    },
  },
  apply_locator_results: {
    description:
      "Given student locator results (reading, math, language scores), recommend starting course, entry unit, and lessons that can be excused.",
    parameters: jsonSchema({
      type: "object",
      additionalProperties: false,
      properties: {
        studentId: { type: "string", description: "Student identifier" },
        payload: {
          type: "object",
          description: "Locator assessment scores",
          required: ["reading", "math"],
          additionalProperties: false,
          properties: {
            reading: { type: "number", minimum: 0, maximum: 12 },
            math: { type: "number", minimum: 0, maximum: 12 },
            language: { type: "number", minimum: 0, maximum: 12 },
          },
        },
      },
      required: ["payload"],
    }),
    execute: (args) => {
      const payload = args.payload as
        | { reading: number; math: number; language?: number }
        | undefined;

      if (!payload) {
        return { content: [{ type: "text", text: "No payload provided." }] };
      }

      const reading = requireNumberInRange(payload.reading, "reading", 0, 12);
      const math = requireNumberInRange(payload.math, "math", 0, 12);
      const language =
        typeof payload.language === "number"
          ? requireNumberInRange(payload.language, "language", 0, 12)
          : undefined;

      let recommendedCourse = "Aztec's Pre-HSE Series";
      let entryUnit = "Foundations";
      const entryLessonsExcused: string[] = [];

      if (reading >= 6 && math >= 6) {
        entryUnit = "Intermediate";
        entryLessonsExcused.push("All Foundations lessons");
      }

      return {
        content: [
          {
            type: "text",
            text: `Student ${args.studentId ?? "N/A"} - Locator results: R=${reading}, M=${math}${
              typeof language === "number" ? `, L=${language}` : ""
            }.\n\nRecommendation:\n• Start: ${recommendedCourse}\n• Entry unit: ${entryUnit}\n• Excused lessons: ${
              entryLessonsExcused.length > 0 ? entryLessonsExcused.join(", ") : "None"
            }`,
          },
        ],
        structuredContent: {
          studentId: args.studentId,
          recommendedCourse,
          entryUnit,
          entryLessonsExcused,
        },
      };
    },
  },
  generate_contextualized_soft_skill: {
    description:
      "Generate an industry-specific soft skills scenario with coaching points, practice prompts, and rubrics.",
    parameters: jsonSchema({
      type: "object",
      additionalProperties: false,
      required: ["industry", "topic", "scenarioLevel"],
      properties: {
        industry: {
          type: "string",
          description: "Target industry (e.g., healthcare, hospitality, construction)",
        },
        topic: {
          type: "string",
          description: "Soft skill topic (e.g., conflict resolution, teamwork)",
        },
        scenarioLevel: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "Difficulty level",
        },
      },
    }),
    execute: (args) => {
      const industry = requireString(args.industry, "industry");
      const topic = requireString(args.topic, "topic");
      const scenarioLevel = requireString(args.scenarioLevel, "scenarioLevel");

      const { lessons } = getCatalog();
      const relevantLessons = lessons.filter(
        (lesson) =>
          lesson.pillar === "soft" &&
          (lesson.lesson.toLowerCase().includes(topic.toLowerCase()) ||
            lesson.description.toLowerCase().includes(topic.toLowerCase()))
      );

      const scenario = `[${industry.toUpperCase()} CONTEXT - ${scenarioLevel.toUpperCase()}]\n\nScenario: You are working in a ${industry} setting and need to apply ${topic}. A situation arises where you must demonstrate professional ${topic} skills in a real-world context specific to ${industry} operations.`;

      const coachingPoints = [
        `Identify key ${topic} principles relevant to ${industry}`,
        `Apply industry-specific communication protocols`,
        `Demonstrate cultural competency and professionalism`,
        `Use appropriate terminology and procedures for ${industry}`,
      ];

      const practicePrompts = [
        `Describe how you would handle this situation in a ${industry} environment`,
        `What specific steps would you take to demonstrate ${topic}?`,
        `How would you adapt your approach based on ${industry} best practices?`,
      ];

      const rubrics = {
        exceeds: `Demonstrates exceptional ${topic} with industry-specific nuance`,
        meets: `Competently applies ${topic} principles in ${industry} context`,
        developing: `Shows basic understanding but needs more ${industry}-specific practice`,
      };

      const lessonCodes = relevantLessons.slice(0, 3).map((lesson) => lesson.code);

      return {
        content: [
          {
            type: "text",
            text: `${scenario}\n\nCoaching Points:\n${coachingPoints
              .map((point, index) => `${index + 1}. ${point}`)
              .join("\n")}\n\nPractice Prompts:\n${practicePrompts
              .map((prompt, index) => `${index + 1}. ${prompt}`)
              .join("\n")}\n\nRelated Aztec lessons: ${lessonCodes.join(", ")}`,
          },
        ],
        structuredContent: {
          scenario,
          coachingPoints,
          practicePrompts,
          rubrics,
          relatedLessonCodes: lessonCodes,
        },
      };
    },
  },
  generate_contextualized_academic: {
    description:
      "Generate industry-contextualized academic content (reading passages or math problems) tied to specific skills, with answer keys and lesson code mappings.",
    parameters: jsonSchema({
      type: "object",
      additionalProperties: false,
      required: ["industry", "targetSkill", "difficulty"],
      properties: {
        industry: { type: "string", description: "Target industry context" },
        targetSkill: {
          type: "string",
          description: "Academic skill (e.g., main_idea, inference, addition, fractions)",
        },
        difficulty: {
          type: "number",
          minimum: 1,
          maximum: 3,
          description: "Difficulty level (1=easy, 3=hard)",
        },
      },
    }),
    execute: (args) => {
      const industry = requireString(args.industry, "industry");
      const targetSkill = requireString(args.targetSkill, "targetSkill");
      const difficulty = requireNumberInRange(args.difficulty, "difficulty", 1, 3);

      const { lessons } = getCatalog();
      const relevantLessons = lessons.filter(
        (lesson) =>
          lesson.pillar === "academic" &&
          (lesson.lesson.toLowerCase().includes(targetSkill.toLowerCase()) ||
            lesson.description.toLowerCase().includes(targetSkill.toLowerCase()) ||
            lesson.subject.toLowerCase().includes("reading") ||
            lesson.subject.toLowerCase().includes("math"))
      );

      const passage = `[${industry.toUpperCase()} CONTEXT - Level ${difficulty}]\n\nContent: This ${targetSkill} exercise is set in a ${industry} workplace environment. Students must apply ${targetSkill} skills to real-world ${industry} scenarios, procedures, or documentation.`;

      const answerKey = [
        `Question 1: Identify the ${targetSkill} in the passage - Answer: [Industry-specific example]`,
        `Question 2: Apply ${targetSkill} to solve the problem - Answer: [Solution with ${industry} context]`,
      ];

      const tieBack = relevantLessons.slice(0, 3).map((lesson) => ({
        code: lesson.code,
        reason: `Addresses ${targetSkill} skills needed for ${industry} reading comprehension`,
      }));

      return {
        content: [
          {
            type: "text",
            text: `${passage}\n\nAnswer Key:\n${answerKey.join("\n")}\n\nRelated Aztec lessons:\n${tieBack
              .map((item) => `• ${item.code}: ${item.reason}`)
              .join("\n")}`,
          },
        ],
        structuredContent: {
          passageOrItems: passage,
          answerKey,
          tieBack,
        },
      };
    },
  },
  remediation_plan_from_cert_gaps: {
    description:
      "Given certification exam results with domain scores, recommend lessons for remediation based on weak domains.",
    parameters: jsonSchema({
      type: "object",
      additionalProperties: false,
      required: ["exam", "domainScores"],
      properties: {
        exam: {
          type: "string",
          description: "Certification exam name (e.g., PTCB, CBCS)",
        },
        domainScores: {
          type: "object",
          additionalProperties: { type: "number" },
          description: "Domain names with scores (0-100)",
        },
        minReadingLevel: {
          type: "string",
          description: "Minimum reading level required",
        },
      },
    }),
    execute: (args) => {
      const exam = requireString(args.exam, "exam");
      const domainScores = args.domainScores as Record<string, number>;

      if (!domainScores || typeof domainScores !== "object") {
        throw new Error("domainScores must be an object of domain: score pairs");
      }

      const weakDomains = Object.entries(domainScores)
        .filter(([, score]) => typeof score === "number" && score < 70)
        .map(([domain]) => domain);

      const { lessons } = getCatalog();
      const examLessons = lessons.filter(
        (lesson) =>
          lesson.pillar === "cte" &&
          (lesson.course.toLowerCase().includes(exam.toLowerCase()) ||
            lesson.description.toLowerCase().includes(exam.toLowerCase()))
      );

      const recommendedLessons = examLessons
        .filter((lesson) =>
          weakDomains.some((domain) => lesson.description.toLowerCase().includes(domain.toLowerCase()))
        )
        .slice(0, 10)
        .map((lesson) => lesson.code);

      const notes = `Focus on weak domains: ${weakDomains.join(", ")}. ${
        args.minReadingLevel ? `Ensure student meets ${args.minReadingLevel} reading level before starting.` : ""
      }`;

      return {
        content: [
          {
            type: "text",
            text: `Remediation plan for ${exam}:\n\nWeak domains (score < 70): ${weakDomains.join(", ")}\n\nRecommended lessons:\n${
              recommendedLessons.map((code) => `• ${code}`).join("\n")
            }\n\nNotes: ${notes}`,
          },
        ],
        structuredContent: {
          recommendedLessons,
          notes,
          weakDomains,
        },
      };
    },
  },
  program_requirements: {
    description: "Get certification program requirements including hours, competencies, and reference links.",
    parameters: jsonSchema({
      type: "object",
      additionalProperties: false,
      required: ["exam"],
      properties: {
        exam: {
          type: "string",
          description: "Certification exam or program name",
        },
      },
    }),
    execute: (args) => {
      const exam = requireString(args.exam, "exam");
      const { lessons } = getCatalog();

      const programLessons = lessons.filter(
        (lesson) => lesson.pillar === "cte" && lesson.course.toLowerCase().includes(exam.toLowerCase())
      );

      const competencies = Array.from(new Set(programLessons.map((lesson) => lesson.subject))).filter(Boolean);
      const hoursRequired = exam.toLowerCase().includes("cbcs") ? 160 : 240;

      return {
        content: [
          {
            type: "text",
            text: `${exam} Program Requirements:\n\nHours: ${hoursRequired}\nCompetencies: ${competencies.join(", ")}\n\nAvailable lessons: ${programLessons.length}`,
          },
        ],
        structuredContent: {
          exam,
          hoursRequired,
          competencies,
          links: [`https://www.nhanow.com/${exam.toLowerCase()}`],
        },
      };
    },
  },
};

export function getLocalTools(): Record<string, ToolDefinition> {
  // Accessing sharedTools ensures the catalog is loaded lazily through helper functions.
  return sharedTools;
}
