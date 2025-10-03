import { z } from "zod";
import type { CatalogData, Pillar } from "./types.js";

export function createTools(catalog: CatalogData) {
  return {
    search_lessons: {
      description:
        "Search for lessons by query text, optionally filtered by pillar or course code. Returns matching lessons with their codes, course, subject, unit, and descriptions.",
      inputSchema: z.object({
        query: z.string().describe("Search query text"),
        pillar: z
          .enum(["academic", "soft", "cte"])
          .optional()
          .describe("Filter by pillar: academic (Bridge Pre-HSE), soft (Ready for Work), or cte (CBCS)"),
        ccCode: z.string().optional().describe("Filter by specific course code"),
      }),
      handler: async (args: { query: string; pillar?: Pillar; ccCode?: string }) => {
        const { query, pillar, ccCode } = args;
        const lowerQuery = query.toLowerCase();

        let filtered = catalog.lessons.filter((lesson) => {
          const matchesQuery =
            lesson.lesson.toLowerCase().includes(lowerQuery) ||
            lesson.description.toLowerCase().includes(lowerQuery) ||
            lesson.code.toLowerCase().includes(lowerQuery) ||
            lesson.subject.toLowerCase().includes(lowerQuery) ||
            lesson.unit.toLowerCase().includes(lowerQuery);

          const matchesPillar = !pillar || lesson.pillar === pillar;
          const matchesCode = !ccCode || lesson.code.toLowerCase().includes(ccCode.toLowerCase());

          return matchesQuery && matchesPillar && matchesCode;
        });

        const matches = filtered.slice(0, 50).map((l) => ({
          code: l.code,
          course: l.course,
          subject: l.subject,
          unit: l.unit,
          lesson: l.lesson,
          description: l.description,
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${matches.length} lessons matching "${query}"${pillar ? ` (pillar: ${pillar})` : ""}${ccCode ? ` (code filter: ${ccCode})` : ""}.\n\n${matches.map((m) => `• ${m.code}: ${m.lesson} (${m.course} > ${m.subject} > ${m.unit})`).join("\n")}`,
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
      inputSchema: z.object({
        course: z.string().describe("Course name"),
      }),
      handler: async (args: { course: string }) => {
        const { course } = args;
        const courseLessons = catalog.lessons.filter(
          (l) => l.course.toLowerCase() === course.toLowerCase()
        );

        if (courseLessons.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Course "${course}" not found in catalog.`,
              },
            ],
          };
        }

        const unitsMap = new Map<string, typeof courseLessons>();
        for (const lesson of courseLessons) {
          const key = `${lesson.subject}::${lesson.unit}`;
          if (!unitsMap.has(key)) {
            unitsMap.set(key, []);
          }
          unitsMap.get(key)!.push(lesson);
        }

        const sequence = Array.from(unitsMap.entries()).map(([key, lessons]) => {
          const [subject, unit] = key.split("::");
          return {
            subject,
            unit,
            lessons: lessons.map((l) => ({
              code: l.code,
              lesson: l.lesson,
              description: l.description,
            })),
          };
        });

        return {
          content: [
            {
              type: "text",
              text: `Course "${course}" sequence:\n\n${sequence.map((s) => `${s.subject} > ${s.unit}:\n${s.lessons.map((l) => `  • ${l.code}: ${l.lesson}`).join("\n")}`).join("\n\n")}`,
            },
          ],
          structuredContent: {
            course,
            pillar: courseLessons[0].pillar,
            sequence,
          },
        };
      },
    },

    apply_locator_results: {
      description:
        "Given student locator results (reading, math, language scores), recommend starting course, entry unit, and lessons that can be excused.",
      inputSchema: z.object({
        studentId: z.string().optional().describe("Student identifier"),
        payload: z
          .object({
            reading: z.number().min(0).max(12).describe("Reading level (0-12)"),
            math: z.number().min(0).max(12).describe("Math level (0-12)"),
            language: z.number().optional().describe("Language level (0-12)"),
          })
          .describe("Locator assessment scores"),
      }),
      handler: async (args: {
        studentId?: string;
        payload?: { reading: number; math: number; language?: number };
      }) => {
        const { studentId, payload } = args;
        if (!payload) {
          return {
            content: [{ type: "text", text: "No payload provided." }],
          };
        }

        const { reading, math, language } = payload;
        let recommendedCourse = "";
        let entryUnit = "";
        const entryLessonsExcused: string[] = [];

        if (reading < 6 && math < 6) {
          recommendedCourse = "Aztec's Pre-HSE Series";
          entryUnit = "Foundations";
        } else if (reading >= 6 && math >= 6) {
          recommendedCourse = "Aztec's Pre-HSE Series";
          entryUnit = "Intermediate";
          entryLessonsExcused.push("All Foundations lessons");
        } else {
          recommendedCourse = "Aztec's Pre-HSE Series";
          entryUnit = "Foundations";
        }

        return {
          content: [
            {
              type: "text",
              text: `Student ${studentId || "N/A"} - Locator results: R=${reading}, M=${math}${language ? `, L=${language}` : ""}.\n\nRecommendation:\n• Start: ${recommendedCourse}\n• Entry unit: ${entryUnit}\n• Excused lessons: ${entryLessonsExcused.length > 0 ? entryLessonsExcused.join(", ") : "None"}`,
            },
          ],
          structuredContent: {
            studentId,
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
      inputSchema: z.object({
        industry: z
          .string()
          .describe("Target industry (e.g., healthcare, hospitality, construction)"),
        topic: z.string().describe("Soft skill topic (e.g., conflict resolution, teamwork)"),
        scenarioLevel: z
          .enum(["beginner", "intermediate", "advanced"])
          .describe("Difficulty level"),
      }),
      handler: async (args: {
        industry: string;
        topic: string;
        scenarioLevel: "beginner" | "intermediate" | "advanced";
      }) => {
        const { industry, topic, scenarioLevel } = args;

        const relevantLessons = catalog.lessons.filter(
          (l) =>
            l.pillar === "soft" &&
            (l.lesson.toLowerCase().includes(topic.toLowerCase()) ||
              l.description.toLowerCase().includes(topic.toLowerCase()))
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

        const lessonCodes = relevantLessons.slice(0, 3).map((l) => l.code);

        return {
          content: [
            {
              type: "text",
              text: `${scenario}\n\nCoaching Points:\n${coachingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nPractice Prompts:\n${practicePrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nRelated Aztec lessons: ${lessonCodes.join(", ")}`,
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
      inputSchema: z.object({
        industry: z.string().describe("Target industry context"),
        targetSkill: z
          .string()
          .describe("Academic skill (e.g., main_idea, inference, addition, fractions)"),
        difficulty: z.number().min(1).max(3).describe("Difficulty level (1=easy, 3=hard)"),
      }),
      handler: async (args: { industry: string; targetSkill: string; difficulty: number }) => {
        const { industry, targetSkill, difficulty } = args;

        const relevantLessons = catalog.lessons.filter(
          (l) =>
            l.pillar === "academic" &&
            (l.lesson.toLowerCase().includes(targetSkill.toLowerCase()) ||
              l.description.toLowerCase().includes(targetSkill.toLowerCase()) ||
              l.subject.toLowerCase().includes("reading") ||
              l.subject.toLowerCase().includes("math"))
        );

        const passage = `[${industry.toUpperCase()} CONTEXT - Level ${difficulty}]\n\nContent: This ${targetSkill} exercise is set in a ${industry} workplace environment. Students must apply ${targetSkill} skills to real-world ${industry} scenarios, procedures, or documentation.`;

        const answerKey = [
          `Question 1: Identify the ${targetSkill} in the passage - Answer: [Industry-specific example]`,
          `Question 2: Apply ${targetSkill} to solve the problem - Answer: [Solution with ${industry} context]`,
        ];

        const tieBack = relevantLessons.slice(0, 3).map((l) => ({
          code: l.code,
          reason: `Addresses ${targetSkill} skills needed for ${industry} reading comprehension`,
        }));

        return {
          content: [
            {
              type: "text",
              text: `${passage}\n\nAnswer Key:\n${answerKey.join("\n")}\n\nRelated Aztec lessons:\n${tieBack.map((t) => `• ${t.code}: ${t.reason}`).join("\n")}`,
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
      inputSchema: z.object({
        exam: z.string().describe("Certification exam name (e.g., PTCB, CBCS)"),
        domainScores: z.record(z.number()).describe("Domain names with scores (0-100)"),
        minReadingLevel: z.string().optional().describe("Minimum reading level required"),
      }),
      handler: async (args: {
        exam: string;
        domainScores: Record<string, number>;
        minReadingLevel?: string;
      }) => {
        const { exam, domainScores, minReadingLevel } = args;

        const weakDomains = Object.entries(domainScores)
          .filter(([, score]) => score < 70)
          .map(([domain]) => domain);

        const examLessons = catalog.lessons.filter(
          (l) =>
            l.pillar === "cte" &&
            (l.course.toLowerCase().includes(exam.toLowerCase()) ||
              l.description.toLowerCase().includes(exam.toLowerCase()))
        );

        const recommendedLessons = examLessons
          .filter((l) =>
            weakDomains.some((domain) => l.description.toLowerCase().includes(domain.toLowerCase()))
          )
          .slice(0, 10)
          .map((l) => l.code);

        const notes = `Focus on weak domains: ${weakDomains.join(", ")}. ${minReadingLevel ? `Ensure student meets ${minReadingLevel} reading level before starting.` : ""}`;

        return {
          content: [
            {
              type: "text",
              text: `Remediation plan for ${exam}:\n\nWeak domains (score < 70): ${weakDomains.join(", ")}\n\nRecommended lessons:\n${recommendedLessons.map((code) => `• ${code}`).join("\n")}\n\nNotes: ${notes}`,
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
      description:
        "Get certification program requirements including hours, competencies, and reference links.",
      inputSchema: z.object({
        exam: z.string().describe("Certification exam or program name"),
      }),
      handler: async (args: { exam: string }) => {
        const { exam } = args;

        const programLessons = catalog.lessons.filter(
          (l) =>
            l.pillar === "cte" &&
            l.course.toLowerCase().includes(exam.toLowerCase())
        );

        const competencies = [
          ...new Set(programLessons.map((l) => l.subject)),
        ];

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
}
