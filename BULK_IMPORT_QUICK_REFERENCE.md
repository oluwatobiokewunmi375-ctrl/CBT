# Quick Reference - Bulk Import Feature

## 📍 Location
**URL:** `http://localhost:3000/admin/questions`  
**Button:** "Bulk import" (top right corner)

---

## 🎯 Two Ways to Import

### Option 1️⃣: PASTE (For CSV)
```
1. Click "Bulk import"
2. Select "Paste Content" tab
3. Download CSV template (optional)
4. Paste your CSV-formatted questions
5. Click "Preview from Paste"
6. Select exam
7. Click "Import" ✓
```

### Option 2️⃣: UPLOAD (For Any Format)
```
1. Click "Bulk import"
2. Select "Upload File" tab
3. Click file input
4. Choose file from your computer
5. System auto-detects format & parses
6. Select exam
7. Click "Import" ✓
```

---

## 📁 Supported Formats

| Format | Extension | Best For | Status |
|--------|-----------|----------|--------|
| CSV | `.csv` | Quick text imports | ✅ Full |
| Excel | `.xlsx`, `.xls` | Large datasets | ✅ Full |
| PDF | `.pdf` | Digitized exams | ⚠️ Basic |
| Word | `.docx`, `.doc` | Word files | ⚠️ Basic |

---

## 📊 CSV Format

**Required Columns (7):**
```
content,optionA,optionB,optionC,optionD,correctAnswer,marks
```

**Example:**
```csv
"What is 2+2?","3","4","5","6","B",1
"Capital of Nigeria","Lagos","Abuja","Kano","Ibadan","B",2
```

---

## 💻 Excel Format

**Column Names (auto-detects variations):**
| Original | Alternatives |
|----------|--------------|
| content | Content, Question |
| optionA | OptionA, Option_A, Option A |
| optionB | OptionB, Option_B, Option B |
| optionC | OptionC, Option_C, Option C |
| optionD | OptionD, Option_D, Option D |
| correctAnswer | CorrectAnswer, Correct |
| marks | Marks, Points |

**Example Table:**
| content | optionA | optionB | optionC | optionD | correctAnswer | marks |
|---------|---------|---------|---------|---------|---------------|-------|
| 2+2 = ? | 3 | 4 | 5 | 6 | B | 1 |

---

## ✅ Validation Rules

All questions must have:
- ✓ Question text (content)
- ✓ Four options (A, B, C, D)
- ✓ Correct answer (A/B/C/D only)
- ✓ Valid marks (number ≥ 1)

---

## 🎬 Workflow

```
SELECT INPUT METHOD
        ↓
PASTE/UPLOAD → PARSE → VALIDATE
        ↓
    PREVIEW
  (First 5 shown)
        ↓
SELECT EXAM
        ↓
    REVIEW
        ↓
    IMPORT ✓
        ↓
SUCCESS MESSAGE
```

---

## 🚀 Quick Tips

1. **Always download template first** - Use as reference
2. **Start small** - Test with 3-5 questions
3. **Use Excel for 50+ questions** - Easier management
4. **Check preview carefully** - Catch errors before import
5. **Verify in list after import** - Confirm questions saved

---

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| "Missing options" | Check all A,B,C,D columns have content |
| "Invalid answer" | Use A, B, C, or D only (not 1,2,3,4) |
| "No questions found" | Check file format matches requirements |
| "PDF not parsing" | Ensure PDF is text-based, not scanned image |

---

## 📚 Full Documentation

For detailed information, see:
- **User Guide:** `BULK_IMPORT_GUIDE.md`
- **Implementation Details:** `BULK_IMPORT_IMPLEMENTATION.md`
- **Question Examples:** In BULK_IMPORT_GUIDE.md (Math, English, Science)

---

## 🔗 Related Files

- `lib/fileParser.ts` - Multi-format parser utility
- `app/admin/questions/content.tsx` - Import UI component
- `BULK_IMPORT_GUIDE.md` - Comprehensive guide
- `BULK_IMPORT_IMPLEMENTATION.md` - Technical details

---

**Version:** 2.0 (Multi-format support)  
**Last Updated:** 2026-06-04  
**Ready to Use:** ✅ Yes

