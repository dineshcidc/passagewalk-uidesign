// Reflection questions shared by Write Reflection and the Journal (wording pending Kathy's final copy).
// Review call 3: Kathy wants one question built on the word "move" — Q1 already is ("As you moved…").
// Q1 connects the walk with the reading (client slide 18, wording completed by us — "As you moved through your steps
// and passages what…"); Q2 and Q3 come from the hard-copy journal.
export const reflectionQuestions = [
  { label: "As you moved through your steps and passages today, what did God place on your heart?", placeholder: "A thought, a feeling, a prayer..." },
  { label: "What did this passage teach you today?", placeholder: "Capture what you learned..." },
  { label: "How can you apply this to your life?", placeholder: "Write one meaningful next step..." },
] as const;

// Steps, reflections and highlights live in the journey store so they reset when the journey changes.
export { getDayRecord, getDayReflection, saveDayReflection, saveDaySteps, type ReflectionAnswers, type SavedReflection } from "./journeyStore";
