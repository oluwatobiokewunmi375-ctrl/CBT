import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";
import {
  buildMcqQuestionCreateInput,
  parseQuestionsCsv,
} from "@/lib/questions/questionBuilder";
import { getExamForQuestionOps, recalculateExamTotalMarks } from "@/lib/questions/examAccess";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    const contentType = req.headers.get("content-type") || "";

    let examId = "";
    let csvText = "";
    let jsonQuestions: unknown[] | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      examId = (form.get("examId") as string) || "";
      const file = form.get("file") as File | null;
      if (file) {
        csvText = await file.text();
      } else {
        csvText = (form.get("csv") as string) || "";
      }
    } else {
      const body = await req.json();
      examId = body.examId;
      if (body.csv) csvText = body.csv;
      if (Array.isArray(body.questions)) jsonQuestions = body.questions;
    }

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const access = await getExamForQuestionOps(decoded, examId);
    if ("error" in access) {
      const status = access.error === "Exam not found" ? 404 : 403;
      return NextResponse.json({ error: access.error }, { status });
    }

    let toCreate: ReturnType<typeof parseQuestionsCsv>["questions"] = [];

    if (jsonQuestions) {
      toCreate = jsonQuestions.map((q: any) => ({
        content: q.content,
        optionA: q.optionA || q.options?.[0]?.text || "",
        optionB: q.optionB || q.options?.[1]?.text || "",
        optionC: q.optionC || q.options?.[2]?.text || "",
        optionD: q.optionD || q.options?.[3]?.text || "",
        correctAnswer: q.correctAnswer || "A",
        marks: q.marks ?? 1,
      }));
    } else if (csvText) {
      const parsed = parseQuestionsCsv(csvText);
      if (parsed.errors.length > 0) {
        return NextResponse.json(
          { error: "CSV validation failed", details: parsed.errors },
          { status: 400 }
        );
      }
      toCreate = parsed.questions;
    } else {
      return NextResponse.json(
        { error: "Provide csv file/text or questions array" },
        { status: 400 }
      );
    }

    if (toCreate.length === 0) {
      return NextResponse.json({ error: "No questions to import" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      toCreate.map((q) =>
        prisma.question.create({
          data: buildMcqQuestionCreateInput(examId, q),
          select: { id: true },
        })
      )
    );

    const totalMarks = await recalculateExamTotalMarks(examId);

    return NextResponse.json({
      success: true,
      imported: created.length,
      totalMarks,
      message: `Imported ${created.length} questions`,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Failed to import questions" }, { status: 500 });
  }
}
