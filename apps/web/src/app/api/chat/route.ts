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

type AnswerSummary = {
  diploma: string;
  spreadsheet: string;
  timeManagement: string;
  communication: string;
  teamwork: string;
};

type PlanInputs = {
  hasDiploma: boolean;
  spreadsheetComfort: SpreadsheetComfort;
  timeManagement: SkillConfidence;
  communication: SkillConfidence;
  teamwork: SkillConfidence;
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

const SYSTEM_PROMPT = `You are Aztec IET's AI advisor supporting adult learners who want to become Certified Billing and Coding Specialists (CBCS). Keep the focus exclusively on the CBCS pathway. When provided with learner responses and recommended focus areas, craft a supportive guidance message that helps them prepare for certification.

Follow these formatting rules exactly:
1. Open with the sentence: "Thanks for sharing those details! Here's the Aztec IET guidance for the Certified Billing and Coding Specialist (CBCS) pathway:" on its own line.
2. Include sections titled "Eligibility:", "Digital Literacy:", "Soft Skill Focus:", "Certification Prep Focus:", "CBCS Knowledge Assessment:", "Sample questions to guide your study:", and "Recommended Lessons:". Separate sections with a blank line.
3. Under "Certification Prep Focus:" list the four CBCS domains exactly as provided. Under "CBCS Knowledge Assessment:" reference the provided practice quiz line. Under "Sample questions to guide your study:" include each sample question prompt and answer options exactly as provided.
4. Use the supplied guidance notes verbatim whenever they are provided (for example, digital literacy lines, soft skill suggestions, and recommended lessons). You may adjust sentence flow for readability but do not alter the meaning.
5. Keep the tone encouraging, actionable, and professional.`;

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

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

function findFirstMeaningfulMessage(messages: string[], startIndex: number) {
  for (let index = startIndex + 1; index < messages.length; index += 1) {
    const content = messages[index].trim();
    if (content.length > 0) {
      return { index, content } as const;
    }
  }

  return null;
}

function findParsedResponse<T>(
  messages: string[],
  startIndex: number,
  parser: (content: string) => T | null
) {
  let lastEntry: { index: number; content: string } | null = null;

  for (let index = startIndex + 1; index < messages.length; index += 1) {
    const content = messages[index].trim();

    if (content.length === 0) {
      continue;
    }

    lastEntry = { index, content } as const;
    const parsedValue = parser(content);

    if (parsedValue !== null) {
      return { entry: lastEntry, value: parsedValue } as const;
    }
  }

  return { entry: lastEntry, value: null } as const;
}

function formatSoftSkillRecommendations(
  timeManagement: SkillConfidence,
  communication: SkillConfidence,
  teamwork: SkillConfidence
): string[] {
  const suggestions: string[] = [];

  if (timeManagement === "needs-support") {
    suggestions.push(
      "Explore productivity strategies like time blocking and use Aztec's planning templates to track certification tasks."
    );
  } else if (timeManagement === "unsure") {
    suggestions.push(
      "Review the time-management overview to learn how prioritizing tasks keeps claim submissions on schedule."
    );
  }

  if (communication === "needs-support") {
    suggestions.push(
      "Practice patient-friendly explanations of billing terms and role-play calls with payers to build confidence."
    );
  } else if (communication === "unsure") {
    suggestions.push(
      "Take the communication fundamentals mini-lesson to learn the vocabulary that keeps documentation clear."
    );
  }

  if (teamwork === "needs-support") {
    suggestions.push(
      "Use collaboration checklists to stay aligned with providers, coders, and revenue-cycle teammates."
    );
  } else if (teamwork === "unsure") {
    suggestions.push(
      "Review examples of interdepartmental workflows so you know who to loop in during claim follow-up."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Keep applying your professional strengths—log weekly wins so you can show how you collaborate, communicate, and stay on track."
    );
  }

  return suggestions;
}

function getEligibilityLine(hasDiploma: boolean): string {
  return hasDiploma
    ? "• You already meet the high school requirement—great work checking that box."
    : "• Plan time to finish your high-school equivalency (GED/HiSET) so you can sit for the CBCS exam.";
}

function getDigitalLiteracyLine(spreadsheetComfort: SpreadsheetComfort): string {
  if (spreadsheetComfort === "familiar") {
    return "• Build confidence with Excel formatting, formulas, and filtering so you can track denials and appeals efficiently.";
  }

  if (spreadsheetComfort === "novice") {
    return "• Start with the Digital Literacy lesson \"Using Technology to Present Information: Microsoft Excel\" to learn spreadsheets from the ground up.";
  }

  return "• Keep practicing spreadsheet workflows to manage claims, denials, and study notes.";
}

function getRecommendedLessonLines(
  spreadsheetComfort: SpreadsheetComfort
): string[] {
  const lessons = [
    "Certified Billing and Coding Specialist (CBCS)\n  Lesson: Regulatory Compliance\n  Lesson: Anatomy and Physiology: Part 1\n  Lesson: Anatomy and Physiology: Part 2\n  Lesson: Anatomy and Physiology: Part 3\n  Lesson: Medical Coding Sets",
  ];

  if (spreadsheetComfort !== "expert") {
    lessons.unshift(
      "Digital Literacy\n  Lesson: Using Technology to Present Information: Microsoft Excel"
    );
  }

  return lessons.map((lesson) => `• ${lesson}`);
}

function buildPlanBlueprint(inputs: PlanInputs): PlanBlueprint {
  const { hasDiploma, spreadsheetComfort, timeManagement, communication, teamwork } = inputs;

  const eligibilityLine = getEligibilityLine(hasDiploma);
  const digitalLiteracyLine = getDigitalLiteracyLine(spreadsheetComfort);
  const softSkillLines = formatSoftSkillRecommendations(
    timeManagement,
    communication,
    teamwork
  ).map((suggestion) => `• ${suggestion}`);

  const certificationIntroLine =
    "• Start a study notebook that covers the four major CBCS domains.";

  const examTopicLines = EXAM_TOPICS.map((topic) => `• ${topic}`);
  const knowledgeAssessmentLine = `• ${KNOWLEDGE_ASSESSMENT_INTRO}`;
  const sampleQuestionBlocks = SAMPLE_QUESTIONS.map((question) => {
    const optionLines = question.options.map((option) => `• ${option}`).join("\n");
    return `${question.prompt}\n${optionLines}`;
  });
  const recommendedLessonLines = getRecommendedLessonLines(spreadsheetComfort);

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
    "Thanks for sharing those details! Here's the Aztec IET guidance for the Certified Billing and Coding Specialist (CBCS) pathway:",
    `Eligibility:\n${blueprint.eligibilityLine}`,
    `Digital Literacy:\n${blueprint.digitalLiteracyLine}`,
    `Soft Skill Focus:\n${softSkillContent}`,
    `Certification Prep Focus:\n${certificationContent}`,
    `CBCS Knowledge Assessment:\n${blueprint.knowledgeAssessmentLine}`,
    `Sample questions to guide your study:\n${sampleQuestionContent}`,
    `Recommended Lessons:\n${recommendedLessonContent}`,
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

  const answerSummary = [
    `1. Do you have a high-school diploma or high-school equivalency?\n   Answer: ${answers.diploma}`,
    `2. How comfortable are you working with spreadsheets?\n   Answer: ${answers.spreadsheet}`,
    `3. How do you feel about your time-management skills?\n   Answer: ${answers.timeManagement}`,
    `4. How do you feel about your communication skills?\n   Answer: ${answers.communication}`,
    `5. How do you feel about your ability to work with others?\n   Answer: ${answers.teamwork}`,
  ].join("\n");

  const normalizedInterpretation = [
    `- Diploma requirement met: ${inputs.hasDiploma ? "Yes" : "No"}`,
    `- Spreadsheet comfort level: ${inputs.spreadsheetComfort}`,
    `- Time-management confidence: ${inputs.timeManagement}`,
    `- Communication confidence: ${inputs.communication}`,
    `- Teamwork confidence: ${inputs.teamwork}`,
  ].join("\n");

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

  const followUpEntry = findFirstMeaningfulMessage(
    userMessages,
    teamworkResult.entry.index
  );

  if (followUpEntry) {
    return "Happy to help! Let me know whenever you want more resources or practice questions.";
  }

  const answers: AnswerSummary = {
    diploma: extractLatestAnswer(diplomaResult.entry.content),
    spreadsheet: extractLatestAnswer(spreadsheetResult.entry.content),
    timeManagement: extractLatestAnswer(timeManagementResult.entry.content),
    communication: extractLatestAnswer(communicationResult.entry.content),
    teamwork: extractLatestAnswer(teamworkResult.entry.content),
  };

  return await generateCbcsPlan({
    hasDiploma,
    spreadsheetComfort,
    timeManagement,
    communication,
    teamwork,
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

