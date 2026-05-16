import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { subject, message, contactEmail } = await req.json();
    if (!subject || !message) return NextResponse.json({ error: "subject and message required" }, { status: 400 });

    const schoolId = decoded.schoolId || null;

    const log = await prisma.auditLog.create({
      data: {
        schoolId: schoolId || '',
        actorId: decoded.userId || null,
        action: 'SUPPORT_TICKET',
        description: subject,
        meta: { message, contactEmail },
      },
    });

    return NextResponse.json({ success: true, ticketId: log.id }, { status: 201 });
  } catch (error) {
    console.error('Support ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    // SUPER_ADMIN may view all tickets; SCHOOL_ADMIN only their school
    let where: any = { action: 'SUPPORT_TICKET' };
    if (decoded.role === 'SCHOOL_ADMIN') {
      if (!decoded.schoolId) return NextResponse.json({ error: 'No school context' }, { status: 400 });
      where.schoolId = decoded.schoolId;
    }

    const tickets = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
