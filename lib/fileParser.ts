/**
 * Multi-format file parser for CBT bulk question import
 * Supports: CSV, Excel (XLSX/XLS), PDF, Word (DOCX)
 */

import * as XLSX from 'xlsx'

export interface ParsedQuestion {
  content: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  marks: number
}

/**
 * Parse CSV content into questions array
 */
export function parseCSV(content: string): ParsedQuestion[] {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))

  if (lines.length === 0) return []

  const questions: ParsedQuestion[] = []
  
  // Skip header row if present
  const startIndex = lines[0].toLowerCase().includes('content') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    
    // Handle quoted CSV
    const values = parseCSVLine(line)
    
    if (values.length >= 6) {
      const [content, optionA, optionB, optionC, optionD, correctAnswer, marksStr] = values
      
      if (content && optionA && optionB && optionC && optionD && correctAnswer) {
        questions.push({
          content: content.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          optionC: optionC.trim(),
          optionD: optionD.trim(),
          correctAnswer: correctAnswer.trim().toUpperCase(),
          marks: parseInt(marksStr || '1', 10) || 1,
        })
      }
    }
  }

  return questions
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result.map(v => v.replace(/^"|"$/g, '').trim())
}

/**
 * Parse Excel file into questions array
 */
export async function parseExcel(file: File): Promise<ParsedQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        
        const questions: ParsedQuestion[] = rows
          .map((row: any) => {
            // Try various column name variations
            const content = row.content || row.Content || row.Question || row.question || ''
            const optionA = row.optionA || row.OptionA || row.Option_A || row['Option A'] || ''
            const optionB = row.optionB || row.OptionB || row.Option_B || row['Option B'] || ''
            const optionC = row.optionC || row.OptionC || row.Option_C || row['Option C'] || ''
            const optionD = row.optionD || row.OptionD || row.Option_D || row['Option D'] || ''
            const correctAnswer = row.correctAnswer || row.CorrectAnswer || row.Correct || row.correct || ''
            const marks = parseInt(row.marks || row.Marks || '1', 10) || 1

            if (content && optionA && optionB && optionC && optionD && correctAnswer) {
              return {
                content: String(content).trim(),
                optionA: String(optionA).trim(),
                optionB: String(optionB).trim(),
                optionC: String(optionC).trim(),
                optionD: String(optionD).trim(),
                correctAnswer: String(correctAnswer).trim().toUpperCase(),
                marks,
              }
            }
            return null
          })
          .filter((q): q is ParsedQuestion => q !== null)

        resolve(questions)
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse PDF file into questions array
 * Note: This is a simple implementation that extracts text
 * For production, consider using more advanced PDF parsing
 */
export async function parsePDF(file: File): Promise<ParsedQuestion[]> {
  try {
    // For now, we'll use a simple approach: extract text and try to parse as delimited content
    const text = await file.text()
    
    // Try to parse as CSV-like format first
    const questions = parseCSV(text)
    if (questions.length > 0) return questions

    // If no luck with CSV parsing, try to extract based on common patterns
    return extractFromPDFText(text)
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract questions from PDF text content
 * Looks for patterns like "1) Question? A) Option B) Option C) Option D) Option"
 */
function extractFromPDFText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  
  // Split by numbered patterns (1), (2), etc. or by Q1, Q2, etc.
  const questionBlocks = text.split(/\n\s*(?:\d+\)|Q\d+[\s:.]|Question\s*\d+)/i)
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim()
    
    // Try to extract content and options
    const lines = block.split('\n').map(l => l.trim()).filter(l => l)
    
    if (lines.length >= 5) {
      const content = lines[0]
      
      // Look for option patterns
      let optionA = '', optionB = '', optionC = '', optionD = '', correctAnswer = 'A'
      let marksStr = '1'
      
      for (let j = 1; j < lines.length; j++) {
        const line = lines[j]
        
        if (line.match(/^[Aa]\s*[\):\-]/)) {
          optionA = line.replace(/^[Aa]\s*[\):\-]\s*/, '')
        } else if (line.match(/^[Bb]\s*[\):\-]/)) {
          optionB = line.replace(/^[Bb]\s*[\):\-]\s*/, '')
        } else if (line.match(/^[Cc]\s*[\):\-]/)) {
          optionC = line.replace(/^[Cc]\s*[\):\-]\s*/, '')
        } else if (line.match(/^[Dd]\s*[\):\-]/)) {
          optionD = line.replace(/^[Dd]\s*[\):\-]\s*/, '')
        } else if (line.match(/answer|correct/i)) {
          const match = line.match(/[A-D]/i)
          if (match) correctAnswer = match[0].toUpperCase()
        } else if (line.match(/marks?:|points?:/i)) {
          const match = line.match(/\d+/)
          if (match) marksStr = match[0]
        }
      }
      
      if (content && optionA && optionB && optionC && optionD) {
        questions.push({
          content,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          marks: parseInt(marksStr, 10) || 1,
        })
      }
    }
  }
  
  return questions
}

/**
 * Parse Word document (DOCX) into questions array
 * Note: This is a simple implementation
 */
export async function parseWord(file: File): Promise<ParsedQuestion[]> {
  try {
    // Extract text from DOCX
    const text = await extractTextFromDocx(file)
    
    // Try to parse as CSV-like format first
    const questions = parseCSV(text)
    if (questions.length > 0) return questions

    // Try PDF-style extraction
    return extractFromPDFText(text)
  } catch (error) {
    throw new Error(`Word document parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from DOCX file
 * Simple implementation using basic XML parsing
 */
async function extractTextFromDocx(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        // DOCX files are ZIP archives
        const arrayBuffer = e.target?.result as ArrayBuffer
        
        // Try to use JSZip if available, otherwise extract text manually
        try {
          const JSZip = (await import('jszip')).default
          const zip = new JSZip()
          await zip.loadAsync(arrayBuffer)
          
          const xmlFile = zip.file('word/document.xml')
          if (!xmlFile) {
            throw new Error('Invalid DOCX file')
          }
          
          const xmlContent = await xmlFile.async('string')
          
          // Extract text from XML tags (simple parsing)
          const text = xmlContent
            .replace(/<[^>]+>/g, ' ') // Remove XML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
          
          resolve(text)
        } catch {
          // Fallback: try basic text extraction without JSZip
          const view = new Uint8Array(arrayBuffer)
          const text = new TextDecoder().decode(view)
          
          // Extract readable text
          const cleaned = text
            .replace(/<[^>]+>/g, ' ')
            .replace(/[^\w\s\-():.?A-Za-z0-9,]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          
          resolve(cleaned)
        }
      } catch (error) {
        reject(new Error(`Failed to extract DOCX text: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read DOCX file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Auto-detect and parse file based on extension
 */
export async function parseFile(file: File): Promise<ParsedQuestion[]> {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  if (name.endsWith('.csv') || type === 'text/csv') {
    const text = await file.text()
    return parseCSV(text)
  }

  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel'
  ) {
    return parseExcel(file)
  }

  if (
    name.endsWith('.pdf') ||
    type === 'application/pdf'
  ) {
    return parsePDF(file)
  }

  if (
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword'
  ) {
    return parseWord(file)
  }

  // Try text extraction for unknown types
  try {
    const text = await file.text()
    return parseCSV(text)
  } catch {
    throw new Error(`Unsupported file format: ${file.type || 'unknown'}. Please use CSV, Excel, PDF, or Word documents.`)
  }
}

/**
 * Get display name for file format
 */
export function getFormatName(extension: string): string {
  const map: Record<string, string> = {
    csv: 'CSV (Comma-Separated Values)',
    xlsx: 'Excel (Modern)',
    xls: 'Excel (Legacy)',
    pdf: 'PDF Document',
    docx: 'Word Document (Modern)',
    doc: 'Word Document (Legacy)',
  }
  return map[extension.toLowerCase()] || extension.toUpperCase()
}

/**
 * CSV template for download
 */
export const CSV_TEMPLATE = `content,optionA,optionB,optionC,optionD,correctAnswer,marks
"What is 2 + 2?","3","4","5","6","B",1
"The capital of Nigeria is","Lagos","Abuja","Kano","Ibadan","B",1
"What is the largest planet?","Mars","Jupiter","Saturn","Venus","B",1`

/**
 * Excel template for download (as base64 encoded XLSX)
 */
export async function generateExcelTemplate(): Promise<Blob> {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['content', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'marks'],
    ['What is 2 + 2?', '3', '4', '5', '6', 'B', 1],
    ['The capital of Nigeria is', 'Lagos', 'Abuja', 'Kano', 'Ibadan', 'B', 1],
    ['What is the largest planet?', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'B', 1],
  ])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions')

  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 8 },
  ]

  return new Promise((resolve) => {
    XLSX.write(workbook, { bookType: 'xlsx', type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }).then(blob => {
      resolve(blob as Blob)
    })
  })
}

/**
 * Validate questions array
 */
export function validateQuestions(questions: ParsedQuestion[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (questions.length === 0) {
    errors.push('No questions found in file')
    return { valid: false, errors }
  }

  questions.forEach((q, index) => {
    const qNum = index + 1

    if (!q.content?.trim()) {
      errors.push(`Question ${qNum}: Missing question text`)
    }
    if (!q.optionA?.trim() || !q.optionB?.trim() || !q.optionC?.trim() || !q.optionD?.trim()) {
      errors.push(`Question ${qNum}: Missing one or more options`)
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer?.toUpperCase())) {
      errors.push(`Question ${qNum}: Invalid correct answer (must be A, B, C, or D)`)
    }
    if (isNaN(q.marks) || q.marks < 1) {
      errors.push(`Question ${qNum}: Invalid marks`)
    }
  })

  return { valid: errors.length === 0, errors }
}
