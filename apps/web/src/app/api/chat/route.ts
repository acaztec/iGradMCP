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

const EXAM_TOPICS = [
  "The Revenue Cycle and Regulatory Compliance",
  "Insurance Eligibility and Other Payer Requirements",
  "Coding and Coding Guidelines",
  "Billing and Reimbursement",
];

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
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
  const normalized = normalizeText(content);

  const positivePatterns = [
    /^y(es)?\b/,
    /\bdefinitely\b/,
    /\babsolutely\b/,
    /\bi (do|have)\b/,
    /\bcompleted\b/,
  ];

  const negativePatterns = [
    /^no?\b/,
    /\bnot yet\b/,
    /\bdon't have\b/,
    /\bstill working\b/,
    /\bneed to earn\b/,
  ];

  if (positivePatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (negativePatterns.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  return null;
}

function parseSpreadsheetComfort(content: string): SpreadsheetComfort | null {
  const normalized = normalizeText(content);

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

  return null;
}

function parseSkillConfidence(content: string): SkillConfidence | null {
  const normalized = normalizeText(content);

  if (/have\s+good/.test(normalized) || /confident/.test(normalized)) {
    return "confident";
  }

  if (/suggestions/.test(normalized) || /improv(e|ing)/.test(normalized)) {
    return "needs-support";
  }

  if (/not\s+sure/.test(normalized) || /unsure/.test(normalized)) {
    return "unsure";
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

function buildCbcsPlan(params: {
  hasDiploma: boolean;
  spreadsheetComfort: SpreadsheetComfort;
  timeManagement: SkillConfidence;
  communication: SkillConfidence;
  teamwork: SkillConfidence;
}): string {
  const {
    hasDiploma,
    spreadsheetComfort,
    timeManagement,
    communication,
    teamwork,
  } = params;

  const eligibility = hasDiploma
    ? "Eligibility:\n• You already meet the high school requirement—great work checking that box."
    : "Eligibility:\n• Plan time to finish your high-school equivalency (GED/HiSET) so you can sit for the CBCS exam.";

  let digitalLiteracy = "Digital Literacy:\n• Keep practicing spreadsheet workflows to manage claims, denials, and study notes.";

  if (spreadsheetComfort === "familiar") {
    digitalLiteracy =
      "Digital Literacy:\n• Build confidence with Excel formatting, formulas, and filtering so you can track denials and appeals efficiently.";
  }

  if (spreadsheetComfort === "novice") {
    digitalLiteracy =
      "Digital Literacy:\n• Start with the Digital Literacy lesson \"Using Technology to Present Information: Microsoft Excel\" to learn spreadsheets from the ground up.";
  }

  const softSkillSuggestions = formatSoftSkillRecommendations(
    timeManagement,
    communication,
    teamwork
  )
    .map((suggestion) => `• ${suggestion}`)
    .join("\n");

  const examTopicList = EXAM_TOPICS.map((topic) => `• ${topic}`).join("\n");

  const recommendedLessons = [
    spreadsheetComfort !== "expert"
      ? "Digital Literacy\n  Lesson: Using Technology to Present Information: Microsoft Excel"
      : null,
    "Certified Billing and Coding Specialist (CBCS)\n  Lesson: Regulatory Compliance\n  Lesson: Anatomy and Physiology: Part 1\n  Lesson: Anatomy and Physiology: Part 2\n  Lesson: Anatomy and Physiology: Part 3\n  Lesson: Medical Coding Sets",
  ]
    .filter((value): value is string => Boolean(value))
    .map((lesson) => `• ${lesson}`)
    .join("\n");

  return [
    "Thanks for sharing those details! Here's the Aztec IET guidance for the Certified Billing and Coding Specialist (CBCS) pathway:",
    eligibility,
    digitalLiteracy,
    `Soft Skill Focus:\n${softSkillSuggestions}`,
    `Certification Prep Focus:\n• Start a study notebook that covers the four major CBCS domains.\n${examTopicList}`,
    "CBCS Knowledge Assessment:\n• CBCS Knowledge Assessment – Use the practice quiz to pinpoint topics for review.\n\nSample questions to guide your study:\nQ1: Billing and coding specialists need to understand the purpose of medical code sets. What is the purpose of ICD-10-CM code?\n• For reporting diseases and conditions, signs and symptoms, external causes of injuries, and abnormal findings\n• For classifying and coding hospital inpatient procedures\n• For reporting outpatient procedures and services healthcare providers perform\n• For reporting nonphysician supplies, procedures, products, and services provided to Medicare beneficiaries or individuals enrolled in private health insurance programs\n\nQ2: Medical billing and coding specialists also have to be familiar with medical terminology. What is the meaning of medial?\n• Toward the middle of the body\n• Away from the midline of the body\n• Below\n• Above\n\nQ3: Medical billing and coding specialists need to be familiar with HIPAA. Which of the following are covered entities under HIPAA?\n• Health plans\n• Healthcare clearinghouses\n• Healthcare providers\n• All of the above\n• None of the above",
    `Recommended Lessons:\n${recommendedLessons}`,
  ].join("\n\n");
}

function getAssistantReply(messages: ChatMessage[]): string {
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

  const diplomaEntry = findFirstMeaningfulMessage(userMessages, pathwayIndex);

  if (!diplomaEntry) {
    return "Do you have a high-school diploma or high-school equivalency?\n• Yes\n• No";
  }

  const hasDiploma = parseYesNoResponse(diplomaEntry.content);

  if (hasDiploma === null) {
    return "Just a quick check—do you currently have a high-school diploma or high-school equivalency (GED/HiSET)?\n• Yes\n• No";
  }

  const spreadsheetEntry = findFirstMeaningfulMessage(userMessages, diplomaEntry.index);

  if (!spreadsheetEntry) {
    if (hasDiploma) {
      return "Great! Having a high-school diploma or high-school equivalency meets one of the CBCS requirements. How comfortable are you working with spreadsheets?\n• Very comfortable—I use spreadsheets frequently and consider myself an expert.\n• Somewhat comfortable—I occasionally use spreadsheets and know the basics.\n• Not comfortable—I rarely use or have never used spreadsheets.\n• What is a spreadsheet?";
    }

    return "Thanks for letting me know. We can plan for your high-school equivalency while you build coding skills. How comfortable are you working with spreadsheets?\n• Very comfortable—I use spreadsheets frequently and consider myself an expert.\n• Somewhat comfortable—I occasionally use spreadsheets and know the basics.\n• Not comfortable—I rarely use or have never used spreadsheets.\n• What is a spreadsheet?";
  }

  const spreadsheetComfort = parseSpreadsheetComfort(spreadsheetEntry.content);

  if (!spreadsheetComfort) {
    return "How comfortable are you working with spreadsheets?\n• Very comfortable—I use spreadsheets frequently and consider myself an expert.\n• Somewhat comfortable—I occasionally use spreadsheets and know the basics.\n• Not comfortable—I rarely use or have never used spreadsheets.\n• What is a spreadsheet?";
  }

  const timeManagementEntry = findFirstMeaningfulMessage(
    userMessages,
    spreadsheetEntry.index
  );

  if (!timeManagementEntry) {
    return "How do you feel about your time-management skills?\n• I have good time management skills.\n• I could use some suggestions for improving time-management skills.\n• I’m not sure what time management skills are.";
  }

  const timeManagement = parseSkillConfidence(timeManagementEntry.content);

  if (!timeManagement) {
    return "Could you pick the option that best describes your time-management skills?\n• I have good time management skills.\n• I could use some suggestions for improving time-management skills.\n• I’m not sure what time management skills are.";
  }

  const communicationEntry = findFirstMeaningfulMessage(
    userMessages,
    timeManagementEntry.index
  );

  if (!communicationEntry) {
    return "Here’s the next one: How do you feel about your communication skills?\n• I have good communication skills.\n• I could use some suggestions for improving communication skills.\n• I’m not sure what communication skills are.";
  }

  const communication = parseSkillConfidence(communicationEntry.content);

  if (!communication) {
    return "Please let me know which option fits your communication skills.\n• I have good communication skills.\n• I could use some suggestions for improving communication skills.\n• I’m not sure what communication skills are.";
  }

  const teamworkEntry = findFirstMeaningfulMessage(
    userMessages,
    communicationEntry.index
  );

  if (!teamworkEntry) {
    return "Here’s the last question about soft skills: How do you feel about your ability to work with others?\n• I work well with others and feel confident in my skills in this area.\n• I could use some suggestions for improving how I work with others.\n• I’m not sure what skills are related to working well with others.";
  }

  const teamwork = parseSkillConfidence(teamworkEntry.content);

  if (!teamwork) {
    return "Please choose the option that best describes how you work with others.\n• I work well with others and feel confident in my skills in this area.\n• I could use some suggestions for improving how I work with others.\n• I’m not sure what skills are related to working well with others.";
  }

  const followUpEntry = findFirstMeaningfulMessage(userMessages, teamworkEntry.index);

  if (followUpEntry) {
    return "Happy to help! Let me know whenever you want more resources or practice questions.";
  }

  return buildCbcsPlan({
    hasDiploma,
    spreadsheetComfort,
    timeManagement,
    communication,
    teamwork,
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

    const reply = getAssistantReply(messages);

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

