import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { patientName, appointmentDate, appointmentType, specialty, status, notes } =
      await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const prompt = `You are a medical assistant AI. Write a concise 3-5 sentence clinical summary for a doctor about this patient appointment. Patient: ${patientName}. Date: ${appointmentDate}. Type: ${appointmentType}. Specialty: ${specialty}. Status: ${status}. Doctor notes: ${notes || 'None provided'}. Keep it professional and clinical.`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}))
      const errMsg  = (errBody as any)?.error?.message || 'Unknown Gemini error'
      console.error('Gemini API error:', geminiRes.status, errMsg)

      if (geminiRes.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      if (geminiRes.status === 404) {
        return NextResponse.json(
          { error: 'Gemini model not found. Contact support.' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: `Gemini API error: ${errMsg}` }, { status: 502 })
    }

    const geminiData = await geminiRes.json()
    const summary: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No summary generated.'

    return NextResponse.json({ summary })
  } catch (err: any) {
    console.error('Summarize route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
