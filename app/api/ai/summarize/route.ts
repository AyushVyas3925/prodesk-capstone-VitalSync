import { NextRequest, NextResponse } from 'next/server'

// ── Fallback template when Gemini quota is exhausted ──────────────────────────
function templateSummary(
  patientName: string,
  appointmentDate: string,
  appointmentType: string,
  specialty: string,
  status: string,
  notes: string | null
): string {
  const statusMap: Record<string, string> = {
    pending:   'is currently pending physician review',
    confirmed: 'has been confirmed and is scheduled',
    completed: 'has been completed successfully',
    cancelled: 'was cancelled and requires rescheduling',
  }
  const statusPhrase = statusMap[status] ?? `has a status of ${status}`

  return `Patient ${patientName} presented for a ${appointmentType} consultation in ${specialty} on ${appointmentDate}. The appointment ${statusPhrase}. ${
    notes
      ? `The following clinical notes were recorded: "${notes}".`
      : 'No additional clinical notes were recorded at this time.'
  } Follow-up care should be coordinated based on the current appointment status and any outstanding investigations. The attending physician should review this summary prior to the next patient interaction.`
}

export async function POST(req: NextRequest) {
  try {
    const { patientName, appointmentDate, appointmentType, specialty, status, notes } =
      await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // No key at all — return template summary
      return NextResponse.json({
        summary: templateSummary(patientName, appointmentDate, appointmentType, specialty, status, notes),
        source: 'template',
      })
    }

    const prompt = `You are a medical assistant AI. Write a concise 3-5 sentence clinical summary for a doctor about this patient appointment. Patient: ${patientName}. Date: ${appointmentDate}. Type: ${appointmentType}. Specialty: ${specialty}. Status: ${status}. Doctor notes: ${notes || 'None provided'}. Keep it professional and clinical.`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    // Rate-limited or any Gemini error → fallback to template
    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}))
      const errMsg  = (errBody as any)?.error?.message || 'Unknown error'
      console.warn(`Gemini ${geminiRes.status} — falling back to template. Reason: ${errMsg}`)

      return NextResponse.json({
        summary: templateSummary(patientName, appointmentDate, appointmentType, specialty, status, notes),
        source: 'template',
      })
    }

    const geminiData = await geminiRes.json()
    const summary: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No summary generated.'

    return NextResponse.json({ summary, source: 'ai' })
  } catch (err: any) {
    console.error('Summarize route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
