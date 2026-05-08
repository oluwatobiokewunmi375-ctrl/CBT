import { addLead, getLeads } from '../../../../lib/crm'

export async function GET() {
  return Response.json(getLeads())
}

export async function POST(req) {
  const body = await req.json()
  addLead(body)

  return Response.json({ success: true })
}
