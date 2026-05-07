import { Request, Response, NextFunction } from "express";
import { canCreateExam, canAddUser, canAddQuestions } from "../services/stripeService";

/**
 * Middleware to check if school can create an exam
 */
export const checkExamLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;

    const canCreate = await canCreateExam(schoolId);

    if (!canCreate) {
      return res.status(403).json({
        error: "Exam limit reached for your plan",
        code: "EXAM_LIMIT_EXCEEDED",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if school can add users
 */
export const checkUserLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = (req as any).schoolId;

    const canAdd = await canAddUser(schoolId);

    if (!canAdd) {
      return res.status(403).json({
        error: "User limit reached for your plan",
        code: "USER_LIMIT_EXCEEDED",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if school can add questions
 */
export const checkQuestionLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const examId = req.params.examId;
    const questionCount = Array.isArray(req.body.questions)
      ? req.body.questions.length
      : 1;

    const canAdd = await canAddQuestions(examId, questionCount);

    if (!canAdd) {
      return res.status(403).json({
        error: "Question limit reached for your plan",
        code: "QUESTION_LIMIT_EXCEEDED",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};