import { loadCatalog } from "./data-loader.js";
import { createTools } from "./tools.js";

async function testTools() {
  console.log("Loading catalog...");
  const catalog = loadCatalog();
  console.log(`Loaded ${catalog.lessons.length} lessons\n`);

  const tools = createTools(catalog);

  console.log("=== TEST 1: search_lessons (handwashing, pillar=soft) ===");
  const result1 = await tools.search_lessons.handler({
    query: "handwashing",
    pillar: "soft",
  });
  console.log(result1.content[0].text);
  console.log("\n");

  console.log("=== TEST 2: generate_contextualized_academic (healthcare, main_idea, 1) ===");
  const result2 = await tools.generate_contextualized_academic.handler({
    industry: "healthcare",
    targetSkill: "main_idea",
    difficulty: 1,
  });
  console.log(result2.content[0].text);
  console.log("\n");

  console.log("=== TEST 3: get_sequence (Aztec's Pre-HSE Series) ===");
  const result3 = await tools.get_sequence.handler({
    course: "Aztec's Pre-HSE Series",
  });
  console.log(result3.content[0].text.substring(0, 500) + "...");
  console.log("\n");

  console.log("=== TEST 4: search_lessons (CBCS revenue cycle) ===");
  const result4 = await tools.search_lessons.handler({
    query: "CBCS revenue cycle",
  });
  console.log(result4.content[0].text);
  console.log("\n");

  console.log("=== TEST 5: apply_locator_results (R=3, M=2) ===");
  const result5 = await tools.apply_locator_results.handler({
    studentId: "TEST123",
    payload: {
      reading: 3,
      math: 2,
    },
  });
  console.log(result5.content[0].text);
  console.log("\n");

  console.log("=== TEST 6: generate_contextualized_soft_skill (de-escalating patient) ===");
  const result6 = await tools.generate_contextualized_soft_skill.handler({
    industry: "healthcare",
    topic: "conflict resolution",
    scenarioLevel: "intermediate",
  });
  console.log(result6.content[0].text);
  console.log("\n");

  console.log("All tests completed!");
}

testTools().catch(console.error);
