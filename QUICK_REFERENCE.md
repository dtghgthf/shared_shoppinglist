# Quick Reference - Debug & Stress Test System

## 🚀 Quick Start

```bash
# Start app
npm run dev

# In another terminal - run tests one by one
# (Each creates automatic logs)

# After uploads - analyze logs
node debug-logs/analyze.js
```

## 📋 Test Files (in order of complexity)

| Test | File | Focus |
|------|------|-------|
| 1️⃣ Basic | `test-1-basic.txt` | No duplicates |
| 2️⃣ Duplicates | `test-2-duplicates.txt` | Exact matches |
| 3️⃣ Variations | `test-3-variations.txt` | "Milch" = "1L Milch" |
| 4️⃣ Quantities | `test-4-quantities.txt` | "2x Milch" already |
| 5️⃣ Special Chars | `test-5-special-chars.txt` | Umlauts, emojis |
| 6️⃣ Mixed Language | `test-6-mixed-language.txt` | Deutsch/English |
| 7️⃣ Long Names | `test-7-long-names.txt` | Very long products |
| 8️⃣ Empty Lines | `test-8-empty-lines.txt` | Whitespace handling |
| 9️⃣ Large List | `test-9-large-list.txt` | 100+ items |
| 🔟 Fuzzy | `test-10-fuzzy-matching.txt` | Typos (hardest!) |
| 1️⃣1️⃣ Categories | `test-11-categories.txt` | All categories |
| 1️⃣2️⃣ Handwritten | `test-12-handwritten.txt` | OCR errors |
| 1️⃣3️⃣ Recipe | `test-13-recipe.txt` | Structured recipe |
| 1️⃣4️⃣ Note | `test-14-shopping-note.txt` | Unstructured notes |

## 🔍 Analyzing Logs

```bash
# Show summary
node debug-logs/analyze.js

# View specific log (with pretty formatting)
jq . debug-logs/upload_LATEST.json

# Check just the AI response
jq '.aiResponse' debug-logs/upload_LATEST.json

# Check merge results
jq '.finalResult' debug-logs/upload_LATEST.json

# Find errors
jq 'select(.error != null)' debug-logs/upload_*.json

# Compare with expected
cat stress-test-files/test-X-expected.json
```

## 🐛 Common Issues

| Issue | Check | Fix |
|-------|-------|-----|
| Items not merged | `aiResponse` in log | Adjust prompt |
| Too many merges | `parsedResult.updates` | Make matching stricter |
| Slow uploads | `durationMs` | Check file size |
| Parse errors | Look for `error` field | Check JSON format |
| Missing items | `finalResult.newItemsCount` | Check extraction |

## 📊 Log Structure

```
debug-logs/
├─ upload_2026-03-31-12-45-30-123_test-1-basic.txt.json
├─ upload_2026-03-31-12-46-15-456_test-2-duplicates.txt.json
├─ error_2026-03-31-12-47-00-789_failed-upload.json
└─ analyze.js (run this!)
```

Each upload log contains:
- ✅ File info (name, size, type)
- ✅ Existing items (what was already there)
- ✅ AI prompt (what we asked)
- ✅ AI response (raw answer)
- ✅ Parsed result (extracted data)
- ✅ Final result (success/error message)
- ✅ Duration (how long it took)

## 💡 Debug Workflow

1. **Upload a test file** → Auto-logs to `debug-logs/upload_*.json`
2. **Run analyzer** → `node debug-logs/analyze.js`
3. **Check results** → Compare with `*-expected.json`
4. **If wrong**, review the log:
   - Check `aiResponse` (what AI returned)
   - Check `parsedResult` (what we parsed)
   - Compare to `finalResult` (what ended up in DB)
5. **Adjust prompt** if needed in `src/app/api/upload-items/route.ts`
6. **Test again** with same file

## 📚 Full Documentation

See:
- 📖 `DEBUG_GUIDE.md` - Complete guide
- 📋 `stress-test-files/README.md` - Test descriptions
- 🎯 `stress-test-files/*-expected.json` - Expected results

## ⚡ Pro Tips

```bash
# Watch logs as they're created
watch -n 1 'ls -lh debug-logs/upload_*.json | tail -5'

# Most recent upload
ls -t debug-logs/upload_*.json | head -1 | xargs jq .

# Count successes vs errors
jq 'select(.error != null) | 1' debug-logs/*.json | wc -l

# Export stats to CSV
jq -r '[.fileName, .fileSize, .durationMs, .finalResult.message] | @csv' \
  debug-logs/upload_*.json > results.csv
```

## 🎯 Testing Strategy

**Start Simple:**
1. test-1-basic.txt
2. test-2-duplicates.txt
3. test-3-variations.txt

**Then Edge Cases:**
4. test-5-special-chars.txt
5. test-8-empty-lines.txt
6. test-6-mixed-language.txt

**Finally Stress:**
9. test-9-large-list.txt
10. test-10-fuzzy-matching.txt

---

**Ready to debug? Start with:** `npm run dev` then upload `test-1-basic.txt`!
