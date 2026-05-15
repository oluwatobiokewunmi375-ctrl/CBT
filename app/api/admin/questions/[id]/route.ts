import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth/middleware"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { content, type, marks, optionA, optionB, optionC, optionD, correctAnswer } = await req.json()

    const question = await prisma.question.update({
      where: { id: params.id },
      data: {
        ...(content && { content }),
        ...(type && { type }),
        ...(marks !== undefined && { marks }),
        ...(optionA && { optionA }),
        ...(optionB && { optionB }),
        ...(optionC && { optionC }),
        ...(optionD && { optionD }),
        ...(correctAnswer && { correctAnswer }),
      },
      include: { options: true, exam: true },
    })

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.question.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: "Question deleted" })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
