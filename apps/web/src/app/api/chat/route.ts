import { formatLessonCatalog } from "@/data/lessons";

const PATHWAYS = [
  {
    id: "cbcs",
    label: "Certified Billing and Coding Specialist (CBCS)",
    synonyms: [
      "cbcs",
      "certified billing and coding specialist",
      "certified coding and billing specialist",
      "billing and coding",
      "coding and billing",
    ],
  },
  {
    id: "pharmacy-technician",
    label: "Pharmacy Technician",
    synonyms: [
      "pharmacy technician",
      "pharmacy tech",
      "pharm tech",
      "pharmacy pathway",
    ],
  },
  {
    id: "ccma",
    label: "Certified Clinical Medical Assistant (CCMA)",
    synonyms: [
      "ccma",
      "certified clinical medical assistant",
      "clinical medical assistant",
    ],
  },
  {
    id: "cmaa",
    label: "Certified Medical Administrative Assistant (CMAA)",
    synonyms: [
      "cmaa",
      "certified medical administrative assistant",
      "medical administrative assistant",
    ],
  },
] as const;

type PathwayId = (typeof PATHWAYS)[number]["id"];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SpreadsheetComfort = "expert" | "familiar" | "novice";

type SkillConfidence = "confident" | "needs-support" | "unsure";

type GedReadiness = "not-ready" | "somewhat-ready" | "refresher";

type GedSubject = "math" | "reading" | "language-mechanics" | "writing";

type AnswerSummary = {
  diploma: string;
  spreadsheet: string;
  timeManagement: string;
  communication: string;
  teamwork: string;
  gedReadiness?: string;
  gedSubjects?: string;
};

type PlanInputs = {
  hasDiploma: boolean;
  spreadsheetComfort: SpreadsheetComfort;
  timeManagement: SkillConfidence;
  communication: SkillConfidence;
  teamwork: SkillConfidence;
  gedReadiness: GedReadiness | null;
  gedSubjects: GedSubject[];
};

type ParsedResponse<T> = {
  entry: { index: number; content: string } | null;
  value: T | null;
};

type PlanBlueprint = {
  eligibilityLine: string;
  digitalLiteracyLine: string;
  softSkillLines: string[];
  certificationIntroLine: string;
  examTopicLines: string[];
  knowledgeAssessmentLine: string;
  sampleQuestionBlocks: string[];
  recommendedLessonLines: string[];
};

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const EXAM_TOPICS = [
  "The Revenue Cycle and Regulatory Compliance",
  "Insurance Eligibility and Other Payer Requirements",
  "Coding and Coding Guidelines",
  "Billing and Reimbursement",
];

const KNOWLEDGE_ASSESSMENT_INTRO =
  "CBCS Knowledge Assessment – Use the practice quiz to pinpoint topics for review.";

const SAMPLE_QUESTIONS = [
  {
    prompt:
      "Q1: Billing and coding specialists need to understand the purpose of medical code sets. What is the purpose of ICD-10-CM code?",
    options: [
      "For reporting diseases and conditions, signs and symptoms, external causes of injuries, and abnormal findings",
      "For classifying and coding hospital inpatient procedures",
      "For reporting outpatient procedures and services healthcare providers perform",
      "For reporting nonphysician supplies, procedures, products, and services provided to Medicare beneficiaries or individuals enrolled in private health insurance programs",
    ],
  },
  {
    prompt:
      "Q2: Medical billing and coding specialists also have to be familiar with medical terminology. What is the meaning of medial?",
    options: [
      "Toward the middle of the body",
      "Away from the midline of the body",
      "Below",
      "Above",
    ],
  },
  {
    prompt:
      "Q3: Medical billing and coding specialists need to be familiar with HIPAA. Which of the following are covered entities under HIPAA?",
    options: [
      "Health plans",
      "Healthcare clearinghouses",
      "Healthcare providers",
      "All of the above",
      "None of the above",
    ],
  },
];

const CBCS_ASSESSMENT_PROMPT = [
  "Got it. Thanks for helping me better understand your soft skills needs. To get certified, you will also need to pass a certification test, such as the National Healthcareer Association Certified Coding and Billing Specialist (CBCS) exam.",
  "The CBCS exam includes questions about the following topics: The Revenue Cycle and Regulatory Compliance, Insurance Eligibility and Other Payer Requirements, Coding and Coding Guidelines, and Billing and Reimbursement.",
  "",
  "I’ve pulled together some questions that will help focus your studies for preparing for the CBCS exam. Please answer the questions in this assessment.",
  "CBCS Knowledge Assessment",
  SAMPLE_QUESTIONS.map((question) => {
    const optionLines = question.options
      .map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`)
      .join("\n");
    return `${question.prompt}\n${optionLines}`;
  }).join("\n\n"),
].join("\n");

const GED_MATH_ASSESSMENT_PROMPT = [
  "I’ve pulled together some questions that will help focus your studies for math. Please answer the questions in this assessment.",
  "Math Skills Assessment",
  "Q1: Which of these fractions is in lowest terms?",
  "A) 2/3",
  "B) 2/6",
  "C) 4/8",
  "D) 5/15",
  "",
  "Q2: What is 72 ÷ 5?",
  "A) 12",
  "B) 13",
  "C) 14 R2",
  "D) 14 R4",
  "",
  "Q3: What is 4²?",
  "A) 2",
  "B) 8",
  "C) 12",
  "D) 16",
].join("\n");

const GED_READINESS_PROMPT =
  "How would you rate your readiness to take a high-school equivalency (HSE) exam?\n• I’m not ready. I would need to start with basic academic skills and work my way up to intermediate skills and then high-school skills.\n• I’m somewhat ready. I would need to start with intermediate academic skills and work my way up to high-school level skills.\n• I’m ready, but I would like a refresher of high-school level academic skills.";

const GED_SUBJECTS_PROMPT =
  "Which subject area(s) do you feel you need to work on? Select all that apply.\n• Math\n• Reading\n• Language Mechanics\n• Writing";

const CORE_CBCS_LESSONS = [
  "Certification",
  "Revenue Cycle",
  "Regulatory Compliance",
  "Medical Terminology",
  "Medical Coding Sets",
  "Billing and Reimbursement",
];

const DIGITAL_EXCEL_LESSON =
  "Using Technology to Present Information: Microsoft Excel";
const DIGITAL_COMPUTER_SKILLS_LESSON = "Developing Computer Skills";
const DIGITAL_GOOGLE_DOC_LESSON =
  "Using Technology to Present Information: Google Doc";

const TIME_MANAGEMENT_LESSONS = [
  "Time Management",
  "Effective Work Techniques",
];
const COMMUNICATION_LESSONS = ["Listening Skills", "Effective Speaking"];
const TEAMWORK_LESSONS = ["Teamwork", "Dealing with Supervisors"];
const SOFT_SKILL_CONFIDENT_LESSON = "Positive Thinking";

const GED_SUBJECT_LESSONS: Record<
  GedSubject,
  { focus: string; lessons: string[] }
> = {
  math: {
    focus: "math skills",
    lessons: [
      "Dividing with a Remainder",
      "Reducing Fractions to Lowest Terms",
      "Exponents",
    ],
  },
  reading: {
    focus: "reading comprehension",
    lessons: [
      "Reading for Facts",
      "Reading Nonfiction",
      "Drawing Conclusions in Reading",
    ],
  },
  "language-mechanics": {
    focus: "language mechanics",
    lessons: [
      "Capitalization and Punctuation",
      "Common Writing Issues",
      "Creating an Outline",
    ],
  },
  writing: {
    focus: "writing skills",
    lessons: [
      "Writing an Essay",
      "Organization",
      "Writing Logical Arguments",
    ],
  },
};

const PLAN_OPENING_LINE =
  "Thanks for sharing those details! Here's the Aztec IET guidance for the Certified Billing and Coding Specialist (CBCS) pathway:";

const SYSTEM_PROMPT = `You are Aztec IET's AI advisor. Guide adult learners who want to earn the National Healthcareer Association Certified Billing and Coding Specialist (CBCS) credential. Follow Aztec's Integrated Education and Training (IET) model at all times:
- Blend academic skills, soft skills, and occupational (CBCS) skills. Lessons from these categories should reinforce each other and be contextualized for healthcare billing and coding roles.
- Emphasize that students without a high-school diploma or equivalency must prepare for and pass the GED/HiSET before attempting the CBCS exam. Support them with GED subject lessons that build toward certification readiness.
- Recognize that even credentialed learners need strong reading, writing, math, digital literacy, and professional behaviors to succeed with medical records, insurance claims, and patient communication.
- Reinforce soft skills such as attention to detail, communication, teamwork, time management, professionalism, ethics, adaptability, and stress management. Tie suggestions to billing and coding workflows.
- Highlight digital literacy expectations: navigating EHR and billing software, using spreadsheets, protecting PHI, researching coding updates, and communicating through secure digital channels.
- Cover the four CBCS domains: Revenue Cycle and Regulatory Compliance; Insurance Eligibility and Other Payer Requirements; Coding and Coding Guidelines; Billing and Reimbursement.

Conversation guardrails:
- Keep the focus on the CBCS journey. Do not discuss other pathways beyond acknowledging they are coming soon.
- Mirror the scripted scenario tone—warm, encouraging, and welcoming. Celebrate strengths, explain next steps clearly, and invite the learner to continue.
- Use quick-reply style multiple-choice questions exactly where provided in the intake flow and assessments.
- When referencing assessments, present the supplied question text and answer options verbatim.
- Never fabricate program requirements or lesson titles outside the provided catalog.

Final plan formatting rules:
1. Open with the sentence: "Thanks for sharing those details! Here's the Aztec IET guidance for the Certified Billing and Coding Specialist (CBCS) pathway:" on its own line.
2. Include sections titled "Eligibility", "Digital Literacy", "Soft Skill Focus", "Certification Prep Focus", "CBCS Knowledge Assessment", "Sample questions to guide your study", and "Recommended Lessons". Render each section title as a level-3 Markdown heading and separate sections with a blank line.
3. Under "Certification Prep Focus" list the four CBCS domains exactly as provided. Under "CBCS Knowledge Assessment" include the provided practice quiz line. Under "Sample questions to guide your study" include each sample question prompt and answer options exactly as provided.
4. Use the supplied guidance notes verbatim whenever they are provided (for example, digital literacy lines, soft skill suggestions, and recommended lessons). You may adjust sentence flow for readability but do not alter the meaning.
5. Maintain a supportive, professional voice that thanks the learner, summarizes their needs, and calls out next steps.

Always return valid Markdown in the final plan.`;

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function getAnswerSegments(content: string): string[] {
  return content
    .split("\n")
    .map((segment) => segment.replace(/^[-•]\s*/, "").trim())
    .filter((segment) => segment.length > 0);
}

function extractLatestAnswer(content: string): string {
  const segments = getAnswerSegments(content);
  if (segments.length === 0) {
    return content.trim();
  }

  return segments[segments.length - 1];
}

function extractJsonObject<T>(content: string): T {
  const match = content.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("No JSON object found in response.");
  }

  return JSON.parse(match[0]) as T;
}

function findPathway(content: string): { id: PathwayId; label: string } | null {
  const normalized = normalizeText(content);

  for (const pathway of PATHWAYS) {
    if (pathway.synonyms.some((term) => normalized.includes(term))) {
      return { id: pathway.id, label: pathway.label };
    }
  }

  return null;
}

function getFirstPathwayChoice(messages: string[]) {
  for (let index = 0; index < messages.length; index += 1) {
    const pathway = findPathway(messages[index]);
    if (pathway) {
      return { pathway, index } as const;
    }
  }

  return { pathway: null, index: -1 } as const;
}

function parseYesNoResponse(content: string): boolean | null {
  const segments = getAnswerSegments(content).reverse();

  const positivePatterns = [
    /^y(es)?\b/,
    /\bdefinitely\b/,
    /\babsolutely\b/,
    /\bi (do|have)\b/,
    /\bcompleted\b/,
    /\bsure\b/,
    /\byup\b/,
  ];

  const negativePatterns = [
    /^no?\b/,
    /\bnot yet\b/,
    /\bdon't have\b/,
    /\bstill working\b/,
    /\bneed to earn\b/,
    /\bnope\b/,
  ];

  for (const segment of segments) {
    const normalized = normalizeText(segment);

    if (positivePatterns.some((pattern) => pattern.test(normalized))) {
      return true;
    }

    if (negativePatterns.some((pattern) => pattern.test(normalized))) {
      return false;
    }
  }

  return null;
}

function parseSpreadsheetComfort(content: string): SpreadsheetComfort | null {
  const segments = getAnswerSegments(content).reverse();

  for (const segment of segments) {
    const normalized = normalizeText(segment);

    if (
      /very\s+comfortable/.test(normalized) ||
      /expert/.test(normalized) ||
      /frequently/.test(normalized)
    ) {
      return "expert";
    }

    if (
      /somewhat\s+comfortable/.test(normalized) ||
      /basics?/.test(normalized) ||
      /occasionally/.test(normalized)
    ) {
      return "familiar";
    }

    if (
      /not\s+comfortable/.test(normalized) ||
      /rarely/.test(normalized) ||
      /never/.test(normalized) ||
      /what\s+is\s+a\s+spreadsheet/.test(normalized)
    ) {
      return "novice";
    }
  }

  return null;
}

function parseSkillConfidence(content: string): SkillConfidence | null {
  const segments = getAnswerSegments(content).reverse();

  for (const segment of segments) {
    const normalized = normalizeText(segment);

    if (
      /have\s+good/.test(normalized) ||
      /confident/.test(normalized) ||
      /\bi('?m| am)\s+(pretty\s+)?(good|decent|solid)/.test(normalized)
    ) {
      return "confident";
    }

    if (/suggestions/.test(normalized) || /improv(e|ing)/.test(normalized)) {
      return "needs-support";
    }

    if (/not\s+sure/.test(normalized) || /unsure/.test(normalized)) {
      return "unsure";
    }
  }

  return null;
}

function findParsedResponse<T>(
  messages: string[],
  startIndex: number,
  parser: (content: string) => T | null
): ParsedResponse<T> {
  let lastEntry: { index: number; content: string } | null = null;

  for (let index = startIndex + 1; index < messages.length; index += 1) {
    const content = messages[index].trim();

    if (content.length === 0) {
      continue;
    }

    lastEntry = { index, content } as const;
    const parsedValue = parser(content);

    if (parsedValue !== null) {
      return { entry: lastEntry, value: parsedValue };
    }
  }

  return { entry: lastEntry, value: null };
}

function parseGedReadiness(content: string): GedReadiness | null {
  const normalized = normalizeText(content);

  if (/not\s+ready/.test(normalized)) {
    return "not-ready";
  }

  if (/somewhat\s+ready/.test(normalized) || /intermediate/.test(normalized)) {
    return "somewhat-ready";
  }

  if (/ready/.test(normalized) && /refresher/.test(normalized)) {
    return "refresher";
  }

  return null;
}

function parseGedSubjects(content: string): GedSubject[] | null {
  const segments = getAnswerSegments(content);
  const selections = new Set<GedSubject>();

  const evaluate = (value: string) => {
    const normalized = normalizeText(value);

    if (/math/.test(normalized) || /numbers?/.test(normalized)) {
      selections.add("math");
    }

    if (/reading/.test(normalized) || /literacy/.test(normalized)) {
      selections.add("reading");
    }

    if (/language/.test(normalized) || /mechanics/.test(normalized) || /grammar/.test(normalized)) {
      selections.add("language-mechanics");
    }

    if (/writing/.test(normalized) || /essays?/.test(normalized)) {
      selections.add("writing");
    }
  };

  if (segments.length === 0) {
    evaluate(content);
  } else {
    segments.forEach(evaluate);
  }

  return selections.size > 0 ? Array.from(selections) : null;
}

function selectGedAcademicSupport(
  subjects: GedSubject[]
): { lessons: string[]; focusHint: string | null } {
  const uniqueSubjects = Array.from(new Set(subjects));

  if (uniqueSubjects.length === 0) {
    return { lessons: [], focusHint: null };
  }

  const lessons = new Set<string>();
  let focusHint: string | null = null;

  for (const subject of uniqueSubjects) {
    const entry = GED_SUBJECT_LESSONS[subject];

    if (!entry) {
      continue;
    }

    entry.lessons.forEach((lesson) => lessons.add(lesson));

    if (!focusHint) {
      focusHint = entry.focus;
    }
  }

  return { lessons: Array.from(lessons), focusHint };
}

function buildGedAssessmentPrompt(subjects: GedSubject[]): string {
  if (subjects.includes("math")) {
    return GED_MATH_ASSESSMENT_PROMPT;
  }

  const subjectNames = subjects
    .map((subject) => {
      if (subject === "language-mechanics") {
        return "language mechanics";
      }

      return subject;
    })
    .join(", ");

  return [
    `I’ve pulled together some reflection questions to support your ${subjectNames} practice.`,
    "Let me know what feels most challenging so I can match specific lessons.",
  ].join("\n");
}

function findAssistantMessageIndex(
  messages: ChatMessage[],
  content: string
): number {
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];

    if (message.role !== "assistant") {
      continue;
    }

    if (message.content.includes(content)) {
      return index;
    }
  }

  return -1;
}

function hasUserReplyAfterIndex(
  messages: ChatMessage[],
  startIndex: number
): boolean {
  for (let index = startIndex + 1; index < messages.length; index += 1) {
    if (messages[index]?.role === "user") {
      const trimmed = messages[index]!.content.trim();

      if (trimmed.length > 0) {
        return true;
      }
    }
  }

  return false;
}

function selectDigitalLessons(spreadsheetComfort: SpreadsheetComfort): string[] {
  if (spreadsheetComfort === "novice") {
    return [
      DIGITAL_COMPUTER_SKILLS_LESSON,
      DIGITAL_EXCEL_LESSON,
      DIGITAL_GOOGLE_DOC_LESSON,
    ];
  }

  if (spreadsheetComfort === "familiar") {
    return [DIGITAL_EXCEL_LESSON, DIGITAL_GOOGLE_DOC_LESSON];
  }

  return [DIGITAL_EXCEL_LESSON];
}

function selectSoftSkillLessons(
  timeManagement: SkillConfidence,
  communication: SkillConfidence,
  teamwork: SkillConfidence
): string[] {
  const selections = new Set<string>();

  if (timeManagement === "needs-support") {
    TIME_MANAGEMENT_LESSONS.forEach((lesson) => selections.add(lesson));
  } else if (timeManagement === "unsure") {
    selections.add(TIME_MANAGEMENT_LESSONS[0]!);
  }

  if (communication === "needs-support") {
    COMMUNICATION_LESSONS.forEach((lesson) => selections.add(lesson));
  } else if (communication === "unsure") {
    selections.add(COMMUNICATION_LESSONS[0]!);
  }

  if (teamwork === "needs-support") {
    TEAMWORK_LESSONS.forEach((lesson) => selections.add(lesson));
  } else if (teamwork === "unsure") {
    selections.add(TEAMWORK_LESSONS[0]!);
  }

  if (selections.size === 0) {
    selections.add(SOFT_SKILL_CONFIDENT_LESSON);
  }

  return Array.from(selections);
}

function formatLessonGroup(label: string, lessons: string[]): string | null {
  const uniqueLessons = Array.from(new Set(lessons));

  if (uniqueLessons.length === 0) {
    return null;
  }

  const lessonLines = uniqueLessons
    .slice(0, 6)
    .map((lesson) => `Lesson: ${lesson}`)
    .join("\n  ");

  return `- ${label}\n  ${lessonLines}`;
}



function formatSoftSkillRecommendations(
  timeManagement: SkillConfidence,
  communication: SkillConfidence,
  teamwork: SkillConfidence
): string[] {
  const suggestions: string[] = [];

  if (timeManagement === "needs-support") {
    suggestions.push(
      "Use the \"Time Management\" and \"Effective Work Techniques\" lessons to build a repeatable schedule for processing claims and exam prep tasks."
    );
  } else if (timeManagement === "unsure") {
    suggestions.push(
      "Review the \"Time Management\" lesson to learn scheduling habits that keep claim submissions on track."
    );
  }

  if (communication === "needs-support") {
    suggestions.push(
      "Practice with the \"Listening Skills\" and \"Effective Speaking\" lessons to translate payer language into learner-friendly updates."
    );
  } else if (communication === "unsure") {
    suggestions.push(
      "Explore the \"Listening Skills\" lesson to stay confident when explaining billing steps."
    );
  }

  if (teamwork === "needs-support") {
    suggestions.push(
      "Work through the \"Teamwork\" and \"Dealing with Supervisors\" lessons to strengthen collaboration across the revenue-cycle team."
    );
  } else if (teamwork === "unsure") {
    suggestions.push(
      "Start with the \"Teamwork\" lesson to see how coders, billers, and providers stay aligned."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Keep applying your strengths—use \"Positive Thinking\" to celebrate wins with your team each week."
    );
  }

  return suggestions;
}

function getEligibilityLine(
  hasDiploma: boolean,
  focusHint: string | null,
  gedReadiness: GedReadiness | null
): string {
  if (hasDiploma) {
    return "- You already meet the high school requirement—great work checking that box.";
  }

  if (focusHint) {
    const readinessPhrase =
      gedReadiness === "refresher"
        ? `a refresher in ${focusHint}`
        : gedReadiness === "somewhat-ready"
        ? `intermediate-to-advanced practice for ${focusHint}`
        : `foundational lessons in ${focusHint}`;

    return `- Plan time to finish your high-school equivalency (GED/HiSET) so you can sit for the CBCS exam. We'll build ${readinessPhrase} as you work through the lessons below.`;
  }

  return "- Plan time to finish your high-school equivalency (GED/HiSET) so you can sit for the CBCS exam. Let me know which GED topics feel toughest so I can match lessons.";
}

function getDigitalLiteracyLine(
  spreadsheetComfort: SpreadsheetComfort,
  digitalLessons: string[]
): string {
  const highlightedLessons = digitalLessons
    .slice(0, 2)
    .map((lesson) => `\"${lesson}\"`)
    .join(" and ");

  if (spreadsheetComfort === "novice") {
    return `- Start with ${highlightedLessons} to learn spreadsheet basics for tracking denials, payments, and study checkpoints.`;
  }

  if (spreadsheetComfort === "familiar") {
    return `- Use ${highlightedLessons} to sharpen spreadsheet formulas and filtering for claim follow-up.`;
  }

  return "- Keep practicing spreadsheet workflows to manage claims, denials, and study notes—your Excel skills are a real asset.";
}

function getRecommendedLessonLines(
  spreadsheetComfort: SpreadsheetComfort,
  digitalLessons: string[],
  softSkillLessons: string[],
  academicSupport: { lessons: string[] } | null
): string[] {
  const lines: (string | null)[] = [];

  lines.push(formatLessonGroup("CBCS Certification Prep", CORE_CBCS_LESSONS));

  lines.push(
    formatLessonGroup(
      spreadsheetComfort === "expert"
        ? "Keep Spreadsheet Momentum"
        : "Digital Literacy Boost",
      digitalLessons
    )
  );

  lines.push(formatLessonGroup("Soft Skills Practice", softSkillLessons));

  if (academicSupport) {
    lines.push(
      formatLessonGroup(
        "Academic Skills for GED Prep",
        academicSupport.lessons
      )
    );
  }

  return lines.filter((line): line is string => Boolean(line));
}

function buildPlanBlueprint(inputs: PlanInputs): PlanBlueprint {
  const {
    hasDiploma,
    spreadsheetComfort,
    timeManagement,
    communication,
    teamwork,
    gedReadiness,
    gedSubjects,
  } = inputs;

  const academicSupport = hasDiploma
    ? null
    : selectGedAcademicSupport(gedSubjects);
  const digitalLessons = selectDigitalLessons(spreadsheetComfort);
  const softSkillLessons = selectSoftSkillLessons(
    timeManagement,
    communication,
    teamwork
  );

  const eligibilityLine = getEligibilityLine(
    hasDiploma,
    academicSupport?.focusHint ?? null,
    gedReadiness
  );
  const digitalLiteracyLine = getDigitalLiteracyLine(
    spreadsheetComfort,
    digitalLessons
  );
  const softSkillLines = formatSoftSkillRecommendations(
    timeManagement,
    communication,
    teamwork
  ).map((suggestion) => `- ${suggestion}`);

  const certificationIntroLine =
    "- Start a study notebook that covers the four major CBCS domains.";

  const examTopicLines = EXAM_TOPICS.map((topic) => `- ${topic}`);
  const knowledgeAssessmentLine = `- ${KNOWLEDGE_ASSESSMENT_INTRO}`;
  const sampleQuestionBlocks = SAMPLE_QUESTIONS.map((question) => {
    const optionLines = question.options
      .map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`)
      .join("\n");
    return `${question.prompt}\n${optionLines}`;
  });
  const recommendedLessonLines = getRecommendedLessonLines(
    spreadsheetComfort,
    digitalLessons,
    softSkillLessons,
    academicSupport
  );

  return {
    eligibilityLine,
    digitalLiteracyLine,
    softSkillLines,
    certificationIntroLine,
    examTopicLines,
    knowledgeAssessmentLine,
    sampleQuestionBlocks,
    recommendedLessonLines,
  };
}

function buildStaticPlan(inputs: PlanInputs): string {
  const blueprint = buildPlanBlueprint(inputs);

  const softSkillContent = blueprint.softSkillLines.join("\n");
  const certificationContent = [
    blueprint.certificationIntroLine,
    ...blueprint.examTopicLines,
  ].join("\n");

  const sampleQuestionContent = blueprint.sampleQuestionBlocks.join("\n\n");
  const recommendedLessonContent = blueprint.recommendedLessonLines.join("\n");

  return [
    PLAN_OPENING_LINE,
    `### Eligibility\n${blueprint.eligibilityLine}`,
    `### Digital Literacy\n${blueprint.digitalLiteracyLine}`,
    `### Soft Skill Focus\n${softSkillContent}`,
    `### Certification Prep Focus\n${certificationContent}`,
    `### CBCS Knowledge Assessment\n${blueprint.knowledgeAssessmentLine}`,
    `### Sample questions to guide your study\n${sampleQuestionContent}`,
    `### Recommended Lessons\n${recommendedLessonContent}`,
  ].join("\n\n");
}

async function callOpenAi(messages: OpenAiMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI API returned an empty response.");
  }

  return content;
}

async function generateCbcsPlan(
  inputs: PlanInputs & { answers: AnswerSummary }
): Promise<string> {
  const blueprint = buildPlanBlueprint(inputs);
  const { answers } = inputs;
  const lessonCatalog = formatLessonCatalog();

  const answerSummaryLines = [
    `1. Do you have a high-school diploma or high-school equivalency?\n   Answer: ${answers.diploma}`,
    `2. How comfortable are you working with spreadsheets?\n   Answer: ${answers.spreadsheet}`,
    `3. How do you feel about your time-management skills?\n   Answer: ${answers.timeManagement}`,
    `4. How do you feel about your communication skills?\n   Answer: ${answers.communication}`,
    `5. How do you feel about your ability to work with others?\n   Answer: ${answers.teamwork}`,
  ];

  if (!inputs.hasDiploma) {
    if (answers.gedReadiness) {
      answerSummaryLines.push(
        `6. GED readiness level\n   Answer: ${answers.gedReadiness}`
      );
    }

    if (answers.gedSubjects) {
      answerSummaryLines.push(
        `${answers.gedReadiness ? "7" : "6"}. GED subject priorities\n   Answer: ${answers.gedSubjects}`
      );
    }
  }

  const answerSummary = answerSummaryLines.join("\n");

  const normalizedInterpretationLines = [
    `- Diploma requirement met: ${inputs.hasDiploma ? "Yes" : "No"}`,
    `- Spreadsheet comfort level: ${inputs.spreadsheetComfort}`,
    `- Time-management confidence: ${inputs.timeManagement}`,
    `- Communication confidence: ${inputs.communication}`,
    `- Teamwork confidence: ${inputs.teamwork}`,
  ];

  if (!inputs.hasDiploma) {
    normalizedInterpretationLines.push(
      `- GED readiness level: ${inputs.gedReadiness ?? "Not captured"}`,
      `- GED subject priorities: ${
        inputs.gedSubjects.length > 0
          ? inputs.gedSubjects.join(", ")
          : "Not captured"
      }`
    );
  }

  const normalizedInterpretation = normalizedInterpretationLines.join("\n");

  const guidanceNotes = [
    `Eligibility bullet:\n${blueprint.eligibilityLine}`,
    `Digital literacy bullet:\n${blueprint.digitalLiteracyLine}`,
    `Soft skill bullets:\n${blueprint.softSkillLines.join("\n")}`,
    `Certification prep focus bullets:\n${[
      blueprint.certificationIntroLine,
      ...blueprint.examTopicLines,
    ].join("\n")}`,
    `CBCS knowledge assessment bullet:\n${blueprint.knowledgeAssessmentLine}`,
    `Sample questions (prompt followed by options):\n${blueprint.sampleQuestionBlocks.join("\n\n")}`,
    `Recommended lessons:\n${blueprint.recommendedLessonLines.join("\n")}`,
  ].join("\n\n");

  const userPrompt = [
    "Learner answers collected from the intake flow:",
    answerSummary,
    "",
    "Normalized interpretation of the learner's readiness:",
    normalizedInterpretation,
    "",
    "Lesson catalog to pull from when recommending academic, soft skill, and CBCS resources:",
    lessonCatalog,
    "",
    "Use the following guidance notes exactly as written when drafting your response (they already reflect the correct phrasing):",
    guidanceNotes,
    "",
    "Remember to keep the focus exclusively on the Certified Billing and Coding Specialist (CBCS) pathway and follow the formatting rules in the system prompt.",
  ].join("\n");

  try {
    return await callOpenAi([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);
  } catch (error) {
    console.error("Failed to generate AI guidance:", error);
    return buildStaticPlan(inputs);
  }
}

async function getAssistantReply(messages: ChatMessage[]): Promise<string> {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content);

  if (userMessages.length === 0) {
    return "Hi there! Choose one of the pathway buttons to get started, or tell me which certification you want to explore.";
  }

  const { pathway, index: pathwayIndex } = getFirstPathwayChoice(userMessages);

  if (!pathway) {
    return "I didn't catch which pathway you want to explore. Tap one of the pathway buttons above—CBCS, Pharmacy Technician, CCMA, or CMAA—to continue.";
  }

  if (pathway.id !== "cbcs") {
    return `${pathway.label} guidance is coming soon in this demo. For now, pick "Certified Billing and Coding Specialist (CBCS)" to walk through the scripted experience.`;
  }

  const diplomaResult = findParsedResponse(
    userMessages,
    pathwayIndex,
    parseYesNoResponse
  );

  if (!diplomaResult.entry) {
    return "Do you have a high-school diploma or high-school equivalency?\n• Yes\n• No";
  }

  const hasDiploma = diplomaResult.value;

  if (hasDiploma === null) {
    return "Just a quick check—do you currently have a high-school diploma or high-school equivalency (GED/HiSET)?\n• Yes\n• No";
  }

  let gedReadinessResult: ParsedResponse<GedReadiness> | null = null;
  let gedSubjectsResult: ParsedResponse<GedSubject[]> | null = null;

  if (!hasDiploma) {
    gedReadinessResult = findParsedResponse(
      userMessages,
      diplomaResult.entry.index,
      parseGedReadiness
    );

    if (!gedReadinessResult.entry) {
      return GED_READINESS_PROMPT;
    }

    const gedReadinessValue = gedReadinessResult.value;

    if (!gedReadinessValue) {
      return "Take a moment to pick the option that best matches your GED readiness so I can recommend the right lessons.\n• I’m not ready. I would need to start with basic academic skills and work my way up to intermediate skills and then high-school skills.\n• I’m somewhat ready. I would need to start with intermediate academic skills and work my way up to high-school level skills.\n• I’m ready, but I would like a refresher of high-school level academic skills.";
    }

    gedSubjectsResult = findParsedResponse(
      userMessages,
      gedReadinessResult.entry.index,
      parseGedSubjects
    );

    if (!gedSubjectsResult.entry) {
      return GED_SUBJECTS_PROMPT;
    }

    const gedSubjectsValue = gedSubjectsResult.value;

    if (!gedSubjectsValue || gedSubjectsValue.length === 0) {
      return "Let me know which GED subject areas you want to focus on so I can share the right practice set.\n• Math\n• Reading\n• Language Mechanics\n• Writing";
    }
  }

  const spreadsheetResult = findParsedResponse(
    userMessages,
    diplomaResult.entry.index,
    parseSpreadsheetComfort
  );

  if (!spreadsheetResult.entry) {
    if (hasDiploma) {
      return "Great! Having a high-school diploma or high-school equivalency meets one of the CBCS requirements. How comfortable are you working with spreadsheets?\n• Very comfortable—I use spreadsheets frequently and consider myself an expert.\n• Somewhat comfortable—I occasionally use spreadsheets and know the basics.\n• Not comfortable—I rarely use or have never used spreadsheets.\n• What is a spreadsheet?";
    }

    return "Thanks for letting me know. We can plan for your high-school equivalency while you build coding skills. How comfortable are you working with spreadsheets?\n• Very comfortable—I use spreadsheets frequently and consider myself an expert.\n• Somewhat comfortable—I occasionally use spreadsheets and know the basics.\n• Not comfortable—I rarely use or have never used spreadsheets.\n• What is a spreadsheet?";
  }

  const spreadsheetComfort = spreadsheetResult.value;

  if (!spreadsheetComfort) {
    return "How comfortable are you working with spreadsheets?\n• Very comfortable—I use spreadsheets frequently and consider myself an expert.\n• Somewhat comfortable—I occasionally use spreadsheets and know the basics.\n• Not comfortable—I rarely use or have never used spreadsheets.\n• What is a spreadsheet?";
  }

  const timeManagementResult = findParsedResponse(
    userMessages,
    spreadsheetResult.entry.index,
    parseSkillConfidence
  );

  if (!timeManagementResult.entry) {
    return "How do you feel about your time-management skills?\n• I have good time management skills.\n• I could use some suggestions for improving time-management skills.\n• I’m not sure what time management skills are.";
  }

  const timeManagement = timeManagementResult.value;

  if (!timeManagement) {
    return "Could you pick the option that best describes your time-management skills?\n• I have good time management skills.\n• I could use some suggestions for improving time-management skills.\n• I’m not sure what time management skills are.";
  }

  const communicationResult = findParsedResponse(
    userMessages,
    timeManagementResult.entry.index,
    parseSkillConfidence
  );

  if (!communicationResult.entry) {
    return "Here’s the next one: How do you feel about your communication skills?\n• I have good communication skills.\n• I could use some suggestions for improving communication skills.\n• I’m not sure what communication skills are.";
  }

  const communication = communicationResult.value;

  if (!communication) {
    return "Please let me know which option fits your communication skills.\n• I have good communication skills.\n• I could use some suggestions for improving communication skills.\n• I’m not sure what communication skills are.";
  }

  const teamworkResult = findParsedResponse(
    userMessages,
    communicationResult.entry.index,
    parseSkillConfidence
  );

  if (!teamworkResult.entry) {
    return "Here’s the last question about soft skills: How do you feel about your ability to work with others?\n• I work well with others and feel confident in my skills in this area.\n• I could use some suggestions for improving how I work with others.\n• I’m not sure what skills are related to working well with others.";
  }

  const teamwork = teamworkResult.value;

  if (!teamwork) {
    return "Please choose the option that best describes how you work with others.\n• I work well with others and feel confident in my skills in this area.\n• I could use some suggestions for improving how I work with others.\n• I’m not sure what skills are related to working well with others.";
  }

  const answers: AnswerSummary = {
    diploma: extractLatestAnswer(diplomaResult.entry.content),
    spreadsheet: extractLatestAnswer(spreadsheetResult.entry.content),
    timeManagement: extractLatestAnswer(timeManagementResult.entry.content),
    communication: extractLatestAnswer(communicationResult.entry.content),
    teamwork: extractLatestAnswer(teamworkResult.entry.content),
  };

  let gedReadiness: GedReadiness | null = null;
  let gedSubjects: GedSubject[] = [];

  if (!hasDiploma && gedReadinessResult && gedSubjectsResult) {
    gedReadiness = gedReadinessResult.value;
    gedSubjects = gedSubjectsResult.value ?? [];
    answers.gedReadiness = extractLatestAnswer(
      gedReadinessResult.entry.content
    );
    answers.gedSubjects = extractLatestAnswer(
      gedSubjectsResult.entry.content
    );
  }

  if (hasDiploma) {
    const assessmentIndex = findAssistantMessageIndex(
      messages,
      CBCS_ASSESSMENT_PROMPT
    );

    if (assessmentIndex === -1 || !hasUserReplyAfterIndex(messages, assessmentIndex)) {
      return CBCS_ASSESSMENT_PROMPT;
    }
  } else if (gedSubjects.length > 0) {
    const assessmentPrompt = buildGedAssessmentPrompt(gedSubjects);
    const assessmentIndex = findAssistantMessageIndex(
      messages,
      assessmentPrompt
    );

    if (assessmentIndex === -1 || !hasUserReplyAfterIndex(messages, assessmentIndex)) {
      return assessmentPrompt;
    }
  }

  return await generateCbcsPlan({
    hasDiploma,
    spreadsheetComfort,
    timeManagement,
    communication,
    teamwork,
    gedReadiness,
    gedSubjects,
    answers,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];

    const messages: ChatMessage[] = rawMessages
      .map((message: any) => ({
        role: message?.role === "assistant" ? "assistant" : "user",
        content: typeof message?.content === "string" ? message.content : "",
      }))
      .filter((message: ChatMessage) => message.content.trim().length > 0);

    const reply = await getAssistantReply(messages);

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ reply: "Sorry, something went wrong. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

