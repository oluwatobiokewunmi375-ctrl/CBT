# Bulk Import Guide - Multiple File Formats Support

## Overview

The CBT platform now supports advanced bulk question import with multiple file formats and dual input methods (paste or upload). This allows educators to easily import questions in their preferred format.

## 📁 Supported File Formats

### 1. **CSV (Comma-Separated Values)** ✅ Recommended for quick imports
- **Extension:** `.csv`
- **Format:** Plain text with comma-separated columns
- **Best for:** Quick text-based imports, manual creation
- **Template:**
  ```
  content,optionA,optionB,optionC,optionD,correctAnswer,marks
  "What is 2 + 2?","3","4","5","6","B",1
  "Capital of Nigeria","Lagos","Abuja","Kano","Ibadan","B",1
  ```

### 2. **Excel Spreadsheets** ✅ Best for large datasets
- **Extensions:** `.xlsx` (Modern), `.xls` (Legacy)
- **Format:** Structured spreadsheet with columns
- **Best for:** Large question banks, professional tools
- **Column Headers:** 
  - `content` - Question text
  - `optionA`, `optionB`, `optionC`, `optionD` - Answer options
  - `correctAnswer` - Correct option (A/B/C/D)
  - `marks` - Question marks/points
- **Flexibility:** Column order doesn't matter, system auto-detects

### 3. **PDF Documents** ⚠️ Basic support (best effort)
- **Extension:** `.pdf`
- **Format:** Text extraction from PDF
- **Best for:** Digitized exam papers
- **Text Pattern:**
  ```
  Question 1) What is 2 + 2?
  A) 3
  B) 4
  C) 5
  D) 6
  Correct: B
  Marks: 1
  ```

### 4. **MS Word Documents** ⚠️ Basic support
- **Extensions:** `.docx` (Modern), `.doc` (Legacy)
- **Format:** Text extraction from Word document
- **Best for:** Exam content from Word files
- **Support:** Basic text extraction and parsing

---

## 🎯 How to Use

### Option 1: Paste Content

Best for: Quick imports, manual CSV creation

1. Navigate to **Admin Panel** → **Question Bank** → **Bulk Import**
2. Select **"Paste Content"** tab
3. Copy your CSV-formatted questions
4. Paste into the textarea
5. Click **"Preview from Paste"**
6. Review the preview (first 5 questions shown)
7. Click **"Import [X] Questions"**

### Option 2: Upload File

Best for: Spreadsheets, PDFs, Word documents

1. Navigate to **Admin Panel** → **Question Bank** → **Bulk Import**
2. Select **"Upload File"** tab
3. Click the file input area
4. Choose file from your computer:
   - Downloads folder
   - Documents folder
   - Desktop
   - Any directory on your device
5. System auto-detects format and parses
6. Review preview of extracted questions
7. Click **"Import [X] Questions"**

---

## 📋 CSV Format Details

### Required Columns
```
Column Name        | Required | Description
------------------|----------|-------------------------------------------
content           | Yes      | Question text/question
optionA           | Yes      | First answer option
optionB           | Yes      | Second answer option
optionC           | Yes      | Third answer option
optionD           | Yes      | Fourth answer option
correctAnswer     | Yes      | Correct option (A, B, C, or D)
marks             | No       | Question marks (default: 1)
```

### CSV Examples

**Basic CSV:**
```csv
content,optionA,optionB,optionC,optionD,correctAnswer,marks
"What is 2+2?","3","4","5","6","B",1
"Nigeria capital?","Lagos","Abuja","Port-Harcourt","Kano","B",2
```

**With Special Characters:**
```csv
"What does 'paradigm' mean?","A perfect example","A shift in thinking","A mathematical concept","A type of tool","B",1
```

**Multi-line (Quoted):**
```csv
"Choose the correct sentence:
She don't know nothing.","She knows nothing","She don't know nothing","She doesn't know anything","She didn't knew nothing","A",1
```

### CSV Rules
- Wrap content in **double quotes** if it contains commas or newlines
- Escape quotes inside content: `He said ""Hello"""` → He said "Hello"
- First row can be headers (auto-skipped if contains "content")
- Empty lines are ignored
- Comments (lines starting with #) are ignored

---

## 📊 Excel Format Details

### Column Mapping
System automatically recognizes these variations:
```
Exact Match    | Alternative Names
---------------|---------------------------------------
content        | Content, Question, question
optionA        | OptionA, Option_A, Option A
optionB        | OptionB, Option_B, Option B
optionC        | OptionC, Option_C, Option C
optionD        | OptionD, Option_D, Option D
correctAnswer  | CorrectAnswer, Correct, correct
marks          | Marks, Points, points
```

### Excel Example
| content | optionA | optionB | optionC | optionD | correctAnswer | marks |
|---------|---------|---------|---------|---------|---------------|-------|
| What is the capital of France? | London | Paris | Berlin | Madrid | B | 1 |
| Python is a: | Database | Programming Language | Framework | Library | B | 2 |
| What is 7 × 8? | 54 | 55 | 56 | 57 | C | 1 |

### Excel Best Practices
- Use single sheet (first sheet is imported)
- Keep column headers in first row
- No merged cells
- No images or formatting (text only)
- Use simple data types (text, numbers)

---

## 📄 PDF Format Details

### Supported Patterns
The system attempts to extract questions from PDFs using these patterns:

**Pattern 1: Numbered with options**
```
1) What is 2+2?
A) 3
B) 4
C) 5
D) 6
Answer: B
Marks: 1
```

**Pattern 2: Question prefix**
```
Q1: What is the largest planet?
A) Mars
B) Jupiter
C) Saturn
D) Venus
Correct: B
```

**Pattern 3: Inline format**
```
Question 1: Content? A) A option B) B option C) C option D) D option
Correct Answer: A, Marks: 1
```

### PDF Best Practices
- Ensure text is selectable (not image-based scan)
- One question per section/paragraph
- Clear option labels (A), B), C), D))
- Specify correct answer clearly
- Include marks if different from 1

---

## 📝 Word Document Format Details

### Supported Content
- Plain text from `.docx` and `.doc` files
- Attempts to parse extracted text as CSV or structured format
- Recommended: Use CSV or Excel for most reliability

### Preparation
1. Save Word document as `.docx` (modern format)
2. Extract questions as structured text
3. Include clear option labels
4. Use tables for better structure:
   | Question | Option A | Option B | Option C | Option D | Answer | Marks |
   |----------|----------|----------|----------|----------|--------|-------|

---

## ⚙️ Technical Details

### File Size Limits
- CSV: No practical limit (processed line-by-line)
- Excel: Up to 100MB (system dependent)
- PDF: Up to 50MB (text extraction)
- Word: Up to 50MB (text extraction)

### Processing
- Files are processed **in the browser** (client-side)
- No server upload for raw files (efficiency)
- Only parsed question data sent to server
- Real-time validation during preview

### Validation Rules
1. **Content required:** Question text cannot be empty
2. **All options required:** A, B, C, D must all have text
3. **Valid correct answer:** Must be A, B, C, or D
4. **Valid marks:** Must be number ≥ 1
5. **No duplicates checked** (allow same question in different exams)

### Error Handling
| Error | Solution |
|-------|----------|
| "No valid questions found" | Check CSV format, ensure 6+ columns |
| "Missing one or more options" | Verify all options A-D have content |
| "Invalid correct answer" | Use A, B, C, or D only |
| "File parsing failed" | Ensure file is valid, try Excel format |
| "PDF parsing failed" | Try converting PDF to text or Excel |

---

## 🎓 Examples for Different Subjects

### Math Questions (CSV)
```csv
"What is √(16)?","2","3","4","5","C",1
"5 × 9 = ?","40","45","50","55","B",1
"What is 20% of 150?","20","25","30","35","C",2
```

### English Questions (CSV)
```csv
"Choose the correct spelling:","Occassion","Ocassion","Occasion","Ocasion","C",1
"What is a noun?","Action word","Person, place, or thing","Describing word","Word that modifies","B",1
```

### Science Questions (CSV)
```csv
"H₂O is:","Hydrogen","Water","Oxygen","Helium","B",1
"The speed of light is:","3×10⁸ m/s","3×10⁹ m/s","3×10⁷ m/s","3×10⁶ m/s","A",2
```

---

## 🔍 Troubleshooting

### Problem: "CSV format not recognized"
**Solution:** 
- Ensure commas separate columns
- Wrap values with special characters in quotes
- Check no extra spaces around commas

### Problem: "Excel columns not detected"
**Solution:**
- Use standard column names (content, optionA, optionB, optionC, optionD, correctAnswer, marks)
- Or use these alternatives: Content, Option_A, OptionA, etc.
- Ensure data starts from row 2 (row 1 for headers)

### Problem: "PDF questions not extracted"
**Solution:**
- Ensure PDF is text-based (not scanned image)
- Try converting to Excel first using online tools
- Manually create CSV from PDF content

### Problem: "Word document won't parse"
**Solution:**
- Save as `.docx` (modern format)
- Extract questions to simple text format
- Convert to CSV or Excel for better reliability

### Problem: "Questions disappear after import"
**Solution:**
- Check if target exam is selected
- Verify questions passed validation (preview showed them)
- Check if database connection is active
- Refresh page and verify questions were saved

---

## 💡 Best Practices

1. **Always preview before importing** - Review the preview section
2. **Start small** - Import 5-10 questions first
3. **Use Excel for large imports** - Easier to manage than CSV
4. **Test format** - Download template and verify format
5. **Keep backups** - Save original files locally
6. **Validate content** - Ensure questions make sense
7. **Use consistent marking** - Same marks per question level
8. **Review after import** - Check imported questions for accuracy

---

## 📥 Download Templates

### CSV Template
Contains 3 example questions. Download from import dialog.

### Excel Template  
Professional spreadsheet with proper formatting. Download from import dialog.

### How to Create Custom Template
1. Use provided template
2. Replace questions with your content
3. Maintain column structure
4. Save in Excel or CSV
5. Upload to platform

---

## 🔐 Security & Privacy

- **Client-side processing:** Files never reach server in raw form
- **No file storage:** Only parsed question data stored
- **Input validation:** All content sanitized
- **Access control:** Only admins can import
- **Audit trail:** All imports logged with admin info

---

## 📞 Support

For issues or questions:
1. Check this guide (Troubleshooting section)
2. Verify file format matches examples
3. Try simpler format (CSV before PDF)
4. Download and test template first
5. Contact platform support if problems persist

---

**Last Updated:** 2026-06-04  
**Version:** 2.0 (Multi-format support)  
**Supported Formats:** CSV, Excel (XLSX/XLS), PDF, Word (DOCX/DOC)

