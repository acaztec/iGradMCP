import { formatCbcsLessonLabel, formatLessonCatalog } from "@/data/lessons";

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

type GedSubject = "math" | "reading";

type KnowledgeQuestionId =
  | "icd10-purpose"
  | "medial-meaning"
  | "hipaa-entities";

type KnowledgeAnswer = {
  questionId: KnowledgeQuestionId;
  answer: string;
  optionIndex: number;
};

type AnswerSummary = {
  careerGoal: string;
  diploma: string;
  spreadsheet: string;
  timeManagement: string;
  communication: string;
  teamwork: string;
  gedReadiness?: string;
  gedSubjects?: string;
  knowledgeAnswers?: KnowledgeAnswer[];
};

type PlanInputs = {
  careerGoal: string;
  hasDiploma: boolean;
  spreadsheetComfort: SpreadsheetComfort;
  timeManagement: SkillConfidence;
  communication: SkillConfidence;
  teamwork: SkillConfidence;
  gedReadiness: GedReadiness | null;
  gedSubjects: GedSubject[];
  knowledgeAnswers: KnowledgeAnswer[];
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

type MultipleChoiceQuestion = {
  prompt: string;
  options: string[];
};

type KnowledgeQuestion = MultipleChoiceQuestion & {
  id: KnowledgeQuestionId;
  correctOptionIndex: number;
  supportLessons: string[];
};

const KNOWLEDGE_QUESTIONS: KnowledgeQuestion[] = [
  {
    id: "icd10-purpose",
    prompt:
      "Q1: Billing and coding specialists need to understand the purpose of medical code sets. What is the purpose of ICD-10-CM code?",
    options: [
      "For reporting diseases and conditions, signs and symptoms, external causes of injuries, and abnormal findings",
      "For classifying and coding hospital inpatient procedures",
      "For reporting outpatient procedures and services healthcare providers perform",
      "For reporting nonphysician supplies, procedures, products, and services provided to Medicare beneficiaries or individuals enrolled in private health insurance programs",
    ],
    correctOptionIndex: 0,
    supportLessons: ["Medical Coding Sets"],
  },
  {
    id: "medial-meaning",
    prompt:
      "Q2: Medical billing and coding specialists also have to be familiar with medical terminology. For example, being able to describe the location of an anatomic site is important for diagnosis and procedural coding. What is the meaning of medial?",
    options: [
      "Toward the middle of the body",
      "Away from the midline of the body",
      "Below",
      "Above",
    ],
    correctOptionIndex: 0,
    supportLessons: [
      "Anatomy and Physiology: Part 1",
      "Anatomy and Physiology: Part 2",
      "Anatomy and Physiology: Part 3",
      "Medical Terminology",
    ],
  },
  {
    id: "hipaa-entities",
    prompt:
      "Q3: Medical billing and coding specialists need to be familiar with the Health Insurance Portability and Accountability Act (HIPAA) and do their part to keep patient health information private and secure. Which of the following are covered entities under HIPAA?",
    options: [
      "Health plans",
      "Healthcare clearinghouses",
      "Healthcare providers",
      "All of the above",
      "None of the above",
    ],
    correctOptionIndex: 3,
    supportLessons: ["Regulatory Compliance"],
  },
];

const KNOWLEDGE_OPTION_PATTERNS: Record<
  KnowledgeQuestionId,
  RegExp[][]
> = {
  "icd10-purpose": [
    [/diseases?/, /(conditions?|symptoms?)/, /(external\s+causes?|abnormal\s+findings?)/],
    [/hospital/, /inpatient/],
    [/outpatient/],
    [
      /nonphysician/,
      /(medicare\s+beneficiaries|privately\s+insured\s+enrollees|private\s+health\s+insurance)/,
    ],
  ],
  "medial-meaning": [
    [/(toward|to)\s+the\s+(middle|midline)/],
    [/(away|farther)\s+from\s+the\s+(midline|middle)/],
    [/\bbelow\b/],
    [/\babove\b/],
  ],
  "hipaa-entities": [
    [/health\s+plans?/],
    [/clearinghouses?/],
    [/providers?/],
    [/all\s+of\s+the\s+above/],
    [/none\s+of\s+the\s+above/],
  ],
};

const CAREER_GOAL_PROMPT = [
  "Thanks for choosing the Certified Billing and Coding Specialist (CBCS) pathway!",
  "Tell me what you'd like to do or where you'd like to work as a CBCS.",
].join("\n");

const CAREER_GOAL_REMINDER = [
  "I want to personalize every step for you—share the CBCS role or workplace you're aiming for.",
  "Tell me what you'd like to do or where you'd like to work as a CBCS.",
].join("\n");

const CBCS_ASSESSMENT_INTRO = [
  "Got it. Thanks for helping me better understand your soft skills needs. To get certified, you will also need to pass a certification test, such as the National Healthcareer Association Certified Coding and Billing Specialist (CBCS) exam.",
  "The CBCS exam includes questions about the following topics: The Revenue Cycle and Regulatory Compliance, Insurance Eligibility and Other Payer Requirements, Coding and Coding Guidelines, and Billing and Reimbursement.",
  "",
  "I’ve pulled together some questions that will help focus your studies for preparing for the CBCS exam. Please answer the questions in this assessment.",
  "CBCS Knowledge Assessment [User takes exam, which pulls 1-2 drill items each unit in the course. Sample questions follow. Incorrect answer in red.]",
].join("\n");

function buildAssessmentIntroWithFirstQuestion(
  careerGoal: string | null
): string {
  const [firstQuestion] = KNOWLEDGE_QUESTIONS;

  if (!firstQuestion) {
    if (!careerGoal) {
      return CBCS_ASSESSMENT_INTRO;
    }

    const contextLine = `Keeping your goal of "${careerGoal}" in sight, let's zero in on the CBCS topics that matter most.`;
    return [CBCS_ASSESSMENT_INTRO, contextLine].join("\n\n");
  }

  const firstPrompt = buildKnowledgeQuestionPrompt(firstQuestion, careerGoal);
  const contextLine = careerGoal
    ? `Keeping your goal of "${careerGoal}" in sight, let's zero in on the CBCS topics that matter most.`
    : null;

  return [
    CBCS_ASSESSMENT_INTRO,
    contextLine,
    firstPrompt,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

type GedAssessmentQuestion = MultipleChoiceQuestion & {
  id: string;
};

const GED_ASSESSMENT_ORDER: GedSubject[] = ["math", "reading"];

const GED_SUBJECT_LABELS: Record<GedSubject, string> = {
  math: "math",
  reading: "reading",
};

const GED_ASSESSMENTS: Partial<
  Record<
    GedSubject,
    {
      introLines: string[];
      questions: GedAssessmentQuestion[];
    }
  >
> = {
  math: {
    introLines: [
      "I’ve pulled together some questions that will help focus your studies for math. Please answer the questions in this assessment.",
      "Math Skills Assessment",
    ],
    questions: [
      {
        id: "math-lowest-terms",
        prompt: "Q1: Which of these fractions is in lowest terms?",
        options: ["A) 2/3", "B) 2/6", "C) 4/8", "D) 5/15"],
      },
      {
        id: "math-division",
        prompt: "Q2: What is 72 ÷ 5?",
        options: [
          "A) 12",
          "B) 13",
          "C) 14 remainder 2",
          "D) 14 remainder 4",
        ],
      },
      {
        id: "math-exponents",
        prompt: "Q3: What is 4²?",
        options: ["A) 2", "B) 8", "C) 12", "D) 16"],
      },
    ],
  },
  reading: {
    introLines: [
      "I’ve pulled together some questions that will help focus your studies for reading. Please answer the questions in this assessment.",
      "Reading Skills Assessment",
    ],
    questions: [
      {
        id: "reading-text-type",
        prompt:
          "Q1: When a passage gives facts about a real person, place, or event, which type of text are you reading?",
        options: [
          "A) Informational text",
          "B) Fiction narrative",
          "C) Poetry",
          "D) Opinion letter",
        ],
      },
      {
        id: "reading-context-clues",
        prompt:
          "Q2: If you need to find the meaning of an unfamiliar word in a passage, which strategy is most helpful?",
        options: [
          "A) Look at the words and sentences around it for context clues.",
          "B) Skip the word and keep reading.",
          "C) Replace it with any word that sounds similar.",
          "D) Look only at the first letter.",
        ],
      },
      {
        id: "reading-main-idea",
        prompt:
          "Q3: After reading an article, what question helps you identify the main idea?",
        options: [
          "A) What is the author mostly trying to explain?",
          "B) Which sentence uses the most complex vocabulary?",
          "C) How many paragraphs are in the article?",
          "D) Which paragraph is the longest?",
        ],
      },
    ],
  },
};

function buildGedReadinessPrompt(careerGoal: string | null): string {
  const lead = buildGoalLead(
    careerGoal,
    `No worries—we'll pace things so you can thrive in "%goal%". How would you rate your readiness to take a high-school equivalency (HSE) exam?`,
    "How would you rate your readiness to take a high-school equivalency (HSE) exam?"
  );

  return [
    lead,
    "• I’m not ready. I would need to start with basic academic skills and work my way up to intermediate skills and then high-school skills.",
    "• I’m somewhat ready. I would need to start with intermediate academic skills and work my way up to high-school level skills.",
    "• I’m ready, but I would like a refresher of high-school level academic skills.",
  ].join("\n");
}

function buildGedReadinessReprompt(careerGoal: string | null): string {
  const lead = buildGoalLead(
    careerGoal,
    `To keep your "%goal%" plan moving, could you pick the option that best matches your GED readiness?`,
    "Could you pick the option that best matches your GED readiness so I can recommend the right lessons?"
  );

  return [
    lead,
    "• I’m not ready. I would need to start with basic academic skills and work my way up to intermediate skills and then high-school skills.",
    "• I’m somewhat ready. I would need to start with intermediate academic skills and work my way up to high-school level skills.",
    "• I’m ready, but I would like a refresher of high-school level academic skills.",
  ].join("\n");
}

function buildGedSubjectsPrompt(careerGoal: string | null): string {
  const intro = buildGoalLead(
    careerGoal,
    `Which subject area(s) do you want to strengthen so "%goal%" stays on track?`,
    "Which subject area(s) do you feel you need to work on?"
  );

  return [
    intro,
    "Select all that apply.",
    "• Math",
    "• Reading",
  ].join("\n");
}

function buildGedSubjectsReprompt(careerGoal: string | null): string {
  const intro = buildGoalLead(
    careerGoal,
    `Just let me know which GED subjects you want to prioritize so I can keep tailoring the path to "%goal%".`,
    "Just let me know which GED subjects you want to prioritize so I can keep tailoring your CBCS plan."
  );

  return [
    intro,
    "Select all that apply.",
    "• Math",
    "• Reading",
  ].join("\n");
}

const CORE_CBCS_LESSONS = [
  "Certification",
  "Revenue Cycle",
  "Regulatory Compliance",
  "Medical Terminology",
  "Medical Coding Sets",
  "Billing and Reimbursement",
];

function buildKnowledgeQuestionPrompt(
  question: KnowledgeQuestion,
  careerGoal: string | null
): string {
  const optionLines = question.options.map((option) => `• ${option}`).join("\n");
  const encouragement = careerGoal
    ? "You're doing great—let's keep the momentum going!"
    : "You're doing great—keep going!";
  return `${encouragement}\n${question.prompt}\n${optionLines}`;
}

function buildGedQuestionPrompt(
  question: GedAssessmentQuestion,
  careerGoal: string | null
): string {
  const optionLines = question.options.map((option) => `• ${option}`).join("\n");
  const encouragement = careerGoal
    ? "Each answer keeps your CBCS plan moving—here's the next one:"
    : "Each answer keeps your progress moving—here's the next one:";
  return `${encouragement}\n${question.prompt}\n${optionLines}`;
}

function buildGedSubjectIntroWithFirstQuestion(
  subject: GedSubject,
  careerGoal: string | null
): string | null {
  const config = GED_ASSESSMENTS[subject];

  if (!config || config.questions.length === 0) {
    return null;
  }

  const [firstQuestion] = config.questions;

  if (!firstQuestion) {
    return null;
  }

  const introBlock = config.introLines.join("\n");
  const contextLine = buildGoalLead(
    careerGoal,
    `This check-in keeps you on track for "%goal%".`,
    "This check-in keeps you on track."
  );
  const firstPrompt = buildGedQuestionPrompt(firstQuestion, careerGoal);

  if (introBlock.length === 0) {
    return [contextLine, firstPrompt].join("\n\n");
  }

  return `${introBlock}\n\n${contextLine}\n\n${firstPrompt}`;
}

function createMultipleChoiceAnswerParser(
  options: string[],
  optionPatterns?: RegExp[][]
): (content: string) => { answer: string; optionIndex: number } | null {
  return (content: string) => {
    const latestAnswer = extractLatestAnswer(content);
    const normalizedAnswer = normalizeText(latestAnswer);

    for (let index = 0; index < options.length; index += 1) {
      const option = options[index]!;
      const normalizedOption = normalizeText(option);

      if (normalizedAnswer === normalizedOption) {
        return { answer: option, optionIndex: index };
      }

      const optionLetter = String.fromCharCode(65 + index).toLowerCase();

      if (normalizedAnswer === optionLetter) {
        return { answer: option, optionIndex: index };
      }

      if (normalizedAnswer.startsWith(`${optionLetter})`)) {
        return { answer: option, optionIndex: index };
      }
    }

    if (optionPatterns && optionPatterns.length > 0) {
      const normalizedContent = normalizeText(content);

      for (let index = 0; index < optionPatterns.length; index += 1) {
        const patterns = optionPatterns[index] ?? [];

        if (
          patterns.length > 0 &&
          patterns.every((pattern) => pattern.test(normalizedContent))
        ) {
          const option = options[index]!;
          return { answer: option, optionIndex: index };
        }
      }
    }

    return null;
  };
}

function createKnowledgeAnswerParser(
  question: KnowledgeQuestion
): (content: string) => { answer: string; optionIndex: number } | null {
  return createMultipleChoiceAnswerParser(
    question.options,
    KNOWLEDGE_OPTION_PATTERNS[question.id]
  );
}

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
2. Include sections titled "Eligibility", "Digital Literacy", "Soft Skill Focus", "Certification Prep Focus", "CBCS Knowledge Assessment", and "Recommended Lessons". Render each section title as a level-3 Markdown heading and separate sections with a blank line.
3. Under "Certification Prep Focus" list the four CBCS domains exactly as provided. Under "CBCS Knowledge Assessment" include the provided practice quiz line, but do not restate the individual assessment questions in the final plan.
4. Use the supplied guidance notes verbatim whenever they are provided (for example, digital literacy lines, soft skill suggestions, and recommended lessons). You may adjust sentence flow for readability but do not alter the meaning.
5. Maintain a supportive, professional voice that thanks the learner, summarizes their needs, and calls out next steps.
6. Include a brief reflection on the learner's GED subject responses (when applicable) and CBCS quiz answers so the recommended lessons clearly connect to their demonstrated strengths and gaps.

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

function formatCareerGoal(goal: string | null): string | null {
  if (!goal) {
    return null;
  }

  const normalized = goal.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  return normalized.replace(/^["“]+/, "").replace(/["”]+$/, "");
}

function buildGoalLead(
  goal: string | null,
  template: string,
  fallback: string
): string {
  const formatted = formatCareerGoal(goal);

  if (!formatted) {
    return fallback;
  }

  return template.replace(/%goal%/g, formatted);
}

function buildGoalClosing(goal: string | null): string {
  return buildGoalLead(
    goal,
    `Keep taking steps toward "%goal%"—you've got this!`,
    "Keep taking steps toward your CBCS goal—you've got this!"
  );
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

function getUserMessageAfterIndex(
  messages: ChatMessage[],
  startIndex: number
): { index: number; content: string } | null {
  for (let index = startIndex + 1; index < messages.length; index += 1) {
    const entry = messages[index];

    if (entry?.role === "user") {
      const trimmed = entry.content.trim();

      if (trimmed.length > 0) {
        return { index, content: entry.content };
      }
    }
  }

  return null;
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

function selectKnowledgeLessonBoosts(
  knowledgeAnswers: KnowledgeAnswer[]
): string[] {
  const boosts = new Set<string>();

  for (const response of knowledgeAnswers) {
    const question = KNOWLEDGE_QUESTIONS.find(
      (entry) => entry.id === response.questionId
    );

    if (!question) {
      continue;
    }

    if (response.optionIndex !== question.correctOptionIndex) {
      question.supportLessons.forEach((lesson) => boosts.add(lesson));
    }
  }

  return Array.from(boosts);
}

function getRecommendedLessonLines(
  spreadsheetComfort: SpreadsheetComfort,
  digitalLessons: string[],
  softSkillLessons: string[],
  academicSupport: { lessons: string[] } | null,
  knowledgeBoosts: string[]
): string[] {
  const lines: (string | null)[] = [];

  const cbcsLessons = [...knowledgeBoosts, ...CORE_CBCS_LESSONS];
  const formattedCbcsLessons = cbcsLessons.map(formatCbcsLessonLabel);

  lines.push(
    formatLessonGroup("CBCS Certification Prep", formattedCbcsLessons)
  );

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
    knowledgeAnswers,
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
  const knowledgeBoosts = selectKnowledgeLessonBoosts(knowledgeAnswers);
  const recommendedLessonLines = getRecommendedLessonLines(
    spreadsheetComfort,
    digitalLessons,
    softSkillLessons,
    academicSupport,
    knowledgeBoosts
  );

  return {
    eligibilityLine,
    digitalLiteracyLine,
    softSkillLines,
    certificationIntroLine,
    examTopicLines,
    knowledgeAssessmentLine,
    recommendedLessonLines,
  };
}

function buildStaticPlan(inputs: PlanInputs): string {
  const blueprint = buildPlanBlueprint(inputs);
  const closingLine = buildGoalClosing(inputs.careerGoal);

  const softSkillContent = blueprint.softSkillLines.join("\n");
  const certificationContent = [
    blueprint.certificationIntroLine,
    ...blueprint.examTopicLines,
  ].join("\n");

  const recommendedLessonContent = blueprint.recommendedLessonLines.join("\n");

  return [
    PLAN_OPENING_LINE,
    `### Eligibility\n${blueprint.eligibilityLine}`,
    `### Digital Literacy\n${blueprint.digitalLiteracyLine}`,
    `### Soft Skill Focus\n${softSkillContent}`,
    `### Certification Prep Focus\n${certificationContent}`,
    `### CBCS Knowledge Assessment\n${blueprint.knowledgeAssessmentLine}`,
    `### Recommended Lessons\n${recommendedLessonContent}`,
    closingLine,
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
  const closingLine = buildGoalClosing(inputs.careerGoal);
  const lessonCatalog = formatLessonCatalog();

  const answerSummaryLines: string[] = [];
  const pushAnswer = (label: string, answer: string) => {
    if (!answer) {
      return;
    }

    answerSummaryLines.push(
      `${answerSummaryLines.length + 1}. ${label}\n   Answer: ${answer}`
    );
  };

  pushAnswer("CBCS career goal focus", answers.careerGoal);
  pushAnswer(
    "Do you have a high-school diploma or high-school equivalency?",
    answers.diploma
  );
  pushAnswer(
    "How comfortable are you working with spreadsheets?",
    answers.spreadsheet
  );
  pushAnswer(
    "How do you feel about your time-management skills?",
    answers.timeManagement
  );
  pushAnswer(
    "How do you feel about your communication skills?",
    answers.communication
  );
  pushAnswer(
    "How do you feel about your ability to work with others?",
    answers.teamwork
  );

  if (!inputs.hasDiploma) {
    if (answers.gedReadiness) {
      pushAnswer("GED readiness level", answers.gedReadiness);
    }

    if (answers.gedSubjects) {
      pushAnswer("GED subject priorities", answers.gedSubjects);
    }
  }

  if (answers.knowledgeAnswers?.length) {
    let counter = answerSummaryLines.length + 1;

    for (const response of answers.knowledgeAnswers) {
      const question = KNOWLEDGE_QUESTIONS.find(
        (entry) => entry.id === response.questionId
      );

      if (!question) {
        continue;
      }

      const isCorrect =
        response.optionIndex === question.correctOptionIndex;
      const correctAnswer =
        question.options[question.correctOptionIndex] ?? "";
      const answerLineParts = [`Answer: ${response.answer}`];

      if (!isCorrect && correctAnswer) {
        answerLineParts.push(`Correct answer: ${correctAnswer}`);
      }

      answerSummaryLines.push(
        `${counter}. ${question.prompt}\n   ${answerLineParts.join(" | ")}`
      );
      counter += 1;
    }
  }

  const answerSummary = answerSummaryLines.join("\n");

  const normalizedInterpretationLines = [
    `- CBCS career goal: ${inputs.careerGoal}`,
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

  for (const response of inputs.knowledgeAnswers) {
    const question = KNOWLEDGE_QUESTIONS.find(
      (entry) => entry.id === response.questionId
    );

    if (!question) {
      continue;
    }

    const correctAnswer = question.options[question.correctOptionIndex] ?? "";
    const status =
      response.optionIndex === question.correctOptionIndex
        ? "Correct"
        : "Needs review";

    const parts = [
      `Learner answered: ${response.answer}`,
      correctAnswer ? `Correct answer: ${correctAnswer}` : null,
      `Result: ${status}`,
    ].filter((part): part is string => Boolean(part));

    normalizedInterpretationLines.push(
      `- ${question.prompt} -> ${parts.join(" | ")}`
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
    `Recommended lessons:\n${blueprint.recommendedLessonLines.join("\n")}`,
    `Closing encouragement line:\n${closingLine}`,
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
    return "Hello and welcome! I’m excited to help you map out your Certified Billing and Coding Specialist journey. Tap one of the pathway buttons to get started, or let me know which certification you’re curious about.";
  }

  const { pathway, index: pathwayIndex } = getFirstPathwayChoice(userMessages);

  if (!pathway) {
    return "I didn’t quite catch which pathway you’d like to explore. Try tapping one of the pathway buttons above—CBCS is ready now, and the others are coming soon.";
  }

  if (pathway.id !== "cbcs") {
    return `Thanks for your interest in the ${pathway.label}! That guidance is coming soon in this demo. For now, choose "Certified Billing and Coding Specialist (CBCS)" so I can walk you through the full experience.`;
  }

  let careerGoal = "";

  const careerGoalPromptIndex = findAssistantMessageIndex(
    messages,
    CAREER_GOAL_PROMPT
  );

  if (careerGoalPromptIndex === -1) {
    return CAREER_GOAL_PROMPT;
  }

  const careerGoalResponse = getUserMessageAfterIndex(
    messages,
    careerGoalPromptIndex
  );

  if (!careerGoalResponse) {
    return CAREER_GOAL_REMINDER;
  }

  const parsedCareerGoal = formatCareerGoal(
    extractLatestAnswer(careerGoalResponse.content)
  );

  if (!parsedCareerGoal) {
    return CAREER_GOAL_REMINDER;
  }

  careerGoal = parsedCareerGoal;

  const diplomaResult = findParsedResponse(
    userMessages,
    pathwayIndex,
    parseYesNoResponse
  );

  if (!diplomaResult.entry) {
    const lead = buildGoalLead(
      careerGoal,
      `To help you shine in "%goal%", let's check a quick requirement.`,
      "Let's check a quick requirement before we dive deeper."
    );

    return [
      lead,
      "Do you have a high-school diploma or high-school equivalency?",
      "• Yes",
      "• No",
    ].join("\n");
  }

  const hasDiploma = diplomaResult.value;

  if (hasDiploma === null) {
    const reminder = buildGoalLead(
      careerGoal,
      `Great! Each step brings you closer to %goal%. Can you pick the option that matches your high-school diploma or equivalency status?`,
      "Could you pick the option that best matches your high-school diploma or high-school equivalency status?"
    );

    return [reminder, "• Yes", "• No"].join("\n");
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
      return buildGedReadinessPrompt(careerGoal);
    }

    const gedReadinessValue = gedReadinessResult.value;

    if (!gedReadinessValue) {
      return buildGedReadinessReprompt(careerGoal);
    }

    gedSubjectsResult = findParsedResponse(
      userMessages,
      gedReadinessResult.entry.index,
      parseGedSubjects
    );

    if (!gedSubjectsResult.entry) {
      return buildGedSubjectsPrompt(careerGoal);
    }

    const gedSubjectsValue = gedSubjectsResult.value;

    if (!gedSubjectsValue || gedSubjectsValue.length === 0) {
      return buildGedSubjectsReprompt(careerGoal);
    }
  }

  const spreadsheetResult = findParsedResponse(
    userMessages,
    diplomaResult.entry.index,
    parseSpreadsheetComfort
  );

  if (!spreadsheetResult.entry) {
    const celebration = hasDiploma
      ? buildGoalLead(
          careerGoal,
          `Great! Having a high-school diploma or high-school equivalency meets one of the CBCS requirements—that keeps "%goal%" within reach.`,
          "Great! Having a high-school diploma or high-school equivalency meets one of the CBCS requirements."
        )
      : buildGoalLead(
          careerGoal,
          `Thanks for letting me know. We can plan for your high-school equivalency while you build coding skills so "%goal%" stays on track.`,
          "Thanks for letting me know. We can plan for your high-school equivalency while you build coding skills."
        );

    const questionLine = buildGoalLead(
      careerGoal,
      `How comfortable are you working with spreadsheets right now to support "%goal%"?`,
      "How comfortable are you working with spreadsheets?"
    );

    return [
      celebration,
      questionLine,
      "• Very comfortable—I use spreadsheets frequently and consider myself an expert.",
      "• Somewhat comfortable—I occasionally use spreadsheets and know the basics.",
      "• Not comfortable—I rarely use or have never used spreadsheets.",
      "• What is a spreadsheet?",
    ].join("\n");
  }

  const spreadsheetComfort = spreadsheetResult.value;

  if (!spreadsheetComfort) {
    const reminder = buildGoalLead(
      careerGoal,
      `Give me a quick read on your spreadsheet comfort so we can map training that supports "%goal%".`,
      "How comfortable are you working with spreadsheets?"
    );

    return [
      reminder,
      "• Very comfortable—I use spreadsheets frequently and consider myself an expert.",
      "• Somewhat comfortable—I occasionally use spreadsheets and know the basics.",
      "• Not comfortable—I rarely use or have never used spreadsheets.",
      "• What is a spreadsheet?",
    ].join("\n");
  }

  const timeManagementResult = findParsedResponse(
    userMessages,
    spreadsheetResult.entry.index,
    parseSkillConfidence
  );

  if (!timeManagementResult.entry) {
    const prompt = buildGoalLead(
      careerGoal,
      `Let's build routines that keep "%goal%" moving. How do you feel about your time-management skills?`,
      "How do you feel about your time-management skills?"
    );

    return [
      prompt,
      "• I have good time management skills.",
      "• I could use some suggestions for improving time-management skills.",
      "• I’m not sure what time management skills are.",
    ].join("\n");
  }

  const timeManagement = timeManagementResult.value;

  if (!timeManagement) {
    const reminder = buildGoalLead(
      careerGoal,
      `Choose the option that best describes your time-management skills so we can plan support for "%goal%".`,
      "Could you pick the option that best describes your time-management skills?"
    );

    return [
      reminder,
      "• I have good time management skills.",
      "• I could use some suggestions for improving time-management skills.",
      "• I’m not sure what time management skills are.",
    ].join("\n");
  }

  const communicationResult = findParsedResponse(
    userMessages,
    timeManagementResult.entry.index,
    parseSkillConfidence
  );

  if (!communicationResult.entry) {
    const prompt = buildGoalLead(
      careerGoal,
      `Strong communication will help you shine in "%goal%". How do you feel about your communication skills?`,
      "Here’s the next one: How do you feel about your communication skills?"
    );

    return [
      prompt,
      "• I have good communication skills.",
      "• I could use some suggestions for improving communication skills.",
      "• I’m not sure what communication skills are.",
    ].join("\n");
  }

  const communication = communicationResult.value;

  if (!communication) {
    const reminder = buildGoalLead(
      careerGoal,
      `Let me know which option fits your communication skills best so your "%goal%" journey stays strong.`,
      "Please let me know which option fits your communication skills best?"
    );

    return [
      reminder,
      "• I have good communication skills.",
      "• I could use some suggestions for improving communication skills.",
      "• I’m not sure what communication skills are.",
    ].join("\n");
  }

  const teamworkResult = findParsedResponse(
    userMessages,
    communicationResult.entry.index,
    parseSkillConfidence
  );

  if (!teamworkResult.entry) {
    const prompt = buildGoalLead(
      careerGoal,
      `Collaboration is huge when you’re working toward "%goal%". How do you feel about your ability to work with others?`,
      "Here’s the last question about soft skills: How do you feel about your ability to work with others?"
    );

    return [
      prompt,
      "• I work well with others and feel confident in my skills in this area.",
      "• I could use some suggestions for improving how I work with others.",
      "• I’m not sure what skills are related to working well with others.",
    ].join("\n");
  }

  const teamwork = teamworkResult.value;

  if (!teamwork) {
    const reminder = buildGoalLead(
      careerGoal,
      `Choose the option that best describes how you work with others so we can support "%goal%".`,
      "Please choose the option that best describes how you work with others?"
    );

    return [
      reminder,
      "• I work well with others and feel confident in my skills in this area.",
      "• I could use some suggestions for improving how I work with others.",
      "• I’m not sure what skills are related to working well with others.",
    ].join("\n");
  }

  const answers: AnswerSummary = {
    careerGoal,
    diploma: extractLatestAnswer(diplomaResult.entry.content),
    spreadsheet: extractLatestAnswer(spreadsheetResult.entry.content),
    timeManagement: extractLatestAnswer(timeManagementResult.entry.content),
    communication: extractLatestAnswer(communicationResult.entry.content),
    teamwork: extractLatestAnswer(teamworkResult.entry.content),
  };

  let gedReadiness: GedReadiness | null = null;
  let gedSubjects: GedSubject[] = [];

  if (
    !hasDiploma &&
    gedReadinessResult?.entry &&
    gedSubjectsResult?.entry
  ) {
    gedReadiness = gedReadinessResult.value;
    gedSubjects = gedSubjectsResult.value ?? [];
    answers.gedReadiness = extractLatestAnswer(
      gedReadinessResult.entry.content
    );
    answers.gedSubjects = extractLatestAnswer(
      gedSubjectsResult.entry.content
    );
  }

  let lastAnsweredUserIndex = teamworkResult.entry.index;

  if (!hasDiploma && gedSubjects.length > 0) {
    const assessmentSubjects = GED_ASSESSMENT_ORDER.filter(
      (subject) =>
        gedSubjects.includes(subject) &&
        (GED_ASSESSMENTS[subject]?.questions.length ?? 0) > 0
    );

    for (const subject of assessmentSubjects) {
      const config = GED_ASSESSMENTS[subject];

      if (!config) {
        continue;
      }

      const introWithFirstQuestion =
        buildGedSubjectIntroWithFirstQuestion(subject, careerGoal);
      const subjectLabel = GED_SUBJECT_LABELS[subject] ?? subject;

      for (let index = 0; index < config.questions.length; index += 1) {
        const question = config.questions[index]!;
        const prompt = buildGedQuestionPrompt(question, careerGoal);
        const assistantIndex = findAssistantMessageIndex(messages, prompt);

        if (assistantIndex === -1) {
          if (index === 0 && introWithFirstQuestion) {
            return introWithFirstQuestion;
          }

          return prompt;
        }

        if (!hasUserReplyAfterIndex(messages, assistantIndex)) {
          return prompt;
        }

        const result = findParsedResponse(
          userMessages,
          lastAnsweredUserIndex,
          createMultipleChoiceAnswerParser(question.options)
        );

        if (!result.entry) {
          return prompt;
        }

        if (!result.value) {
          const encouragement = buildGoalLead(
            careerGoal,
            `Thanks for sticking with me! Please choose one of the answer choices so I can tailor your ${subjectLabel} study plan for "%goal%".`,
            `Thanks for sticking with me! Please choose one of the answer choices so I can tailor your ${subjectLabel} study plan.`
          );

          return [encouragement, prompt].join("\n");
        }

        lastAnsweredUserIndex = result.entry.index;
      }
    }
  }

  const knowledgeAnswers: KnowledgeAnswer[] = [];

  const introIndex = findAssistantMessageIndex(
    messages,
    CBCS_ASSESSMENT_INTRO
  );

  if (introIndex === -1) {
    return buildAssessmentIntroWithFirstQuestion(careerGoal);
  }

  let lastUserIndex = lastAnsweredUserIndex;

  for (const question of KNOWLEDGE_QUESTIONS) {
    const prompt = buildKnowledgeQuestionPrompt(question, careerGoal);
    const assistantIndex = findAssistantMessageIndex(messages, prompt);

    if (assistantIndex === -1) {
      return prompt;
    }

    if (!hasUserReplyAfterIndex(messages, assistantIndex)) {
      return prompt;
    }

    const result = findParsedResponse(
      userMessages,
      lastUserIndex,
      createKnowledgeAnswerParser(question)
    );

    if (!result.entry) {
      return prompt;
    }

    const parsed = result.value;

    if (!parsed) {
      const encouragement = buildGoalLead(
        careerGoal,
        'Thanks for sticking with me! Please choose one of the answer choices so I can tailor the CBCS study plan for "%goal%".',
        "Thanks for sticking with me! Please choose one of the answer choices so I can tailor the CBCS study plan."
      );

      return [encouragement, prompt].join("\n");
    }

    knowledgeAnswers.push({
      questionId: question.id,
      answer: parsed.answer,
      optionIndex: parsed.optionIndex,
    });

    lastUserIndex = result.entry.index;
  }

  if (knowledgeAnswers.length > 0) {
    answers.knowledgeAnswers = knowledgeAnswers;
  }

  return await generateCbcsPlan({
    careerGoal,
    hasDiploma,
    spreadsheetComfort,
    timeManagement,
    communication,
    teamwork,
    gedReadiness,
    gedSubjects,
    knowledgeAnswers,
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

