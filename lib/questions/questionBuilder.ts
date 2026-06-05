/**
 * Question builder utilities for parsing and creating questions
 */

interface ParsedQuestion {
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: number;
}

interface ParseResult {
  questions: ParsedQuestion[];
  errors: string[];
}

/**
 * Parse CSV text into questions
 * Expected CSV format: content,optionA,optionB,optionC,optionD,correctAnswer,marks
 */
export function parseQuestionsCsv(csvText: string): ParseResult {
  const errors: string[] = [];
  const questions: ParsedQuestion[] = [];

  if (!csvText || csvText.trim().length === 0) {
    errors.push("CSV text is empty");
    return { questions, errors };
  }

  const lines = csvText.split("\n").filter((line) => line.trim());
  const headers = lines[0]
    ?.split(",")
    .map((h) => h.trim().toLowerCase()) || [];

  // Validate headers
  const requiredHeaders = [
    "content",
    "optiona",
    "optionb",
    "optionc",
    "optiond",
    "correctanswer",
  ];
  const hasRequiredHeaders = requiredHeaders.every(
    (h) => headers.includes(h) || headers.length === 0
  );

  // If no header row detected, assume order: content,optionA,optionB,optionC,optionD,correctAnswer,marks
  const skipHeader = hasRequiredHeaders && headers.includes("content");

  for (let i = skipHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCsvLine(line);

    if (parts.length < 6) {
      errors.push(
        `Row ${i + 1}: Insufficient columns (expected at least 6, got ${parts.length})`
      );
      continue;
    }

    const question: ParsedQuestion = {
      content: parts[0],
      optionA: parts[1],
      optionB: parts[2],
      optionC: parts[3],
      optionD: parts[4],
      correctAnswer: (parts[5] || "A").toUpperCase(),
      marks: parseFloat(parts[6]) || 1,
    };

    // Validate
    if (!question.content) {
      errors.push(`Row ${i + 1}: Question content is required`);
      continue;
    }

    if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
      errors.push(
        `Row ${i + 1}: Correct answer must be A, B, C, or D (got: ${question.correctAnswer})`
      );
      continue;
    }

    questions.push(question);
  }

  return { questions, errors };
}

/**
 * Parse a CSV line handling quoted strings
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

/**
 * Build a Prisma create input for a question
 */
export function buildMcqQuestionCreateInput(
  examId: string,
  question: ParsedQuestion
) {
  return {
    examId,
    content: question.content,
    type: "MULTIPLE_CHOICE" as const,
    marks: question.marks,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctAnswer: question.correctAnswer,
  };
}
