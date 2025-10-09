const PATHWAYS = [
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
    id: "cbcs",
    label: "Certified Coding and Billing Specialist (CBCS)",
    synonyms: [
      "cbcs",
      "certified coding and billing specialist",
      "billing and coding",
      "coding and billing",
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
      return { pathway, index };
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

function findFirstMeaningfulMessage(messages: string[], startIndex: number) {
  for (let index = startIndex + 1; index < messages.length; index += 1) {
    const content = messages[index].trim();
    if (content.length > 0) {
      return { index, content };
    }
  }

  return null;
}

function formatSoftSkillsSummary(input: string): string {
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return "communication, teamwork, and professionalism";
  if (trimmed.length <= 180) return trimmed;
  return `${trimmed.slice(0, 177)}...`;
}

function buildPharmacyPlan(
  hasDiploma: boolean,
  softSkillsFocus: string
): string {
  const softSkillsSummary = formatSoftSkillsSummary(softSkillsFocus);

  const academicSection = hasDiploma
    ? `Academic Foundation:\n• You already meet the high school requirement—great! Complete the short "Pharmacy Math Refresher" module to revisit key ratios, conversions, and dosage calculations before compounding labs.`
    : `Academic Foundation:\n• Start with Aztec's GED/HiSET prep units for math, reading, and science.\n• Schedule time each week for the official practice tests and track your score growth.\n• Revisit pharmacy-specific math mini-lessons once you're comfortable with fractions, proportions, and basic algebra.`;

  return [
    "Here's a personalized Pharmacy Technician pathway for you:",
    academicSection,
    `Soft Skills Focus:\n• Use "Ready for Work" modules to strengthen ${softSkillsSummary}.\n• Practice scenario prompts about supporting patients and collaborating with pharmacists.\n• Build a reflection journal that ties your soft-skill wins back to pharmacy settings.`,
    "Technical Training:\n• PT-101: Orientation to Pharmacy Practice – roles, pharmacy workflow, safety, HIPAA.\n• PT-205: Prescription Processing & Dispensing – interpreting orders, labeling, filling scripts.\n• PT-310: Sterile Compounding Basics – aseptic technique, garbing, and cleanroom routines.\n• PT-330: Pharmacy Calculations Lab – dimensional analysis, IV flow rates, and inventory math.",
    "Next Steps:\n1. Block study time for your academic and soft-skill goals each week.\n2. Enroll in the technical modules in the order above and log your lab hours.\n3. Keep me posted on progress or new questions—I can suggest make-up lessons or additional practice any time.",
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
    return "I didn't catch which pathway you want to explore. Tap one of the pathway buttons above—Pharmacy Technician, CBCS, CCMA, or CMAA—to continue.";
  }

  if (pathway.id !== "pharmacy-technician") {
    return `${pathway.label} content is coming soon in this demo. For now, pick "Pharmacy Technician" to walk through the full guided experience.`;
  }

  const diplomaEntry = findFirstMeaningfulMessage(userMessages, pathwayIndex);

  if (!diplomaEntry) {
    return "Great choice! Do you currently have a high school diploma or equivalent (GED/HiSET)?";
  }

  const diplomaAnswer = parseYesNoResponse(diplomaEntry.content);

  if (diplomaAnswer === null) {
    return "Just a quick check—do you already have a high school diploma or GED/HiSET?";
  }

  const softSkillsEntry = findFirstMeaningfulMessage(userMessages, diplomaEntry.index);

  if (!softSkillsEntry) {
    if (diplomaAnswer) {
      return "Excellent! We'll dive into the technical training next. Before we do, which workplace or professional skills would you like to strengthen?";
    }

    return "No worries—we can build that academic foundation first. Start with GED/HiSET prep for math, reading, and science, then let me know: which workplace or professional skills would you like to focus on while you work on academics?";
  }

  const followUpEntry = findFirstMeaningfulMessage(userMessages, softSkillsEntry.index);

  if (followUpEntry) {
    return "Happy to help! Keep me posted on your progress or ask for more lesson ideas whenever you need them.";
  }

  return buildPharmacyPlan(diplomaAnswer, softSkillsEntry.content);
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
