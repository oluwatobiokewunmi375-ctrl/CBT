const leads = []

export function addLead(lead) {
  leads.push({
    id: Date.now(),
    ...lead,
    status: "LEAD",
    createdAt: new Date()
  })
}

export function updateLeadStatus(id, status) {
  const lead = leads.find(l => l.id === id)
  if (lead) {
    lead.status = status
  }
}

export function getLeads() {
  return leads
}
