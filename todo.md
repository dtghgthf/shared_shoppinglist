# Einkaufsliste App - ToDo Liste

## Status: In Progress 🚀

### Pending Tasks

#### 1. Fix OpenRouter caching causing duplicate upload failures
- **ID:** `duplicate-upload-caching`
- **Status:** ⏳ pending
- **Priority:** 🟢 low
- **Description:**
  - Issue: When uploading the same file twice in quick succession, OpenRouter cache causes the second upload to return truncated/empty response (20 tokens instead of 157)
  - Evidence: OpenRouter logs show cached responses with negative cost (-0.000263)
  - Impact: Prevents proper merging behavior on duplicate uploads
  - Workaround: Users typically don't upload the same file twice in practice
  - Potential Solutions:
    1. Implement retry logic with backoff
    2. Use different cache-busting strategy (not timestamp-based)
    3. Switch to Claude/GPT for upload processing
    4. Add request deduplication on client side

---

## Completed Features ✅

- [x] Smart AI-powered upload merging with quantity detection
- [x] Comprehensive debug logging system (dev-only)
- [x] Mobile drag-and-drop fixes
- [x] Unified toolbar with all actions (upload, delete, share, theme)
- [x] Production-safe debug system
- [x] German UI & terminology
- [x] Real-time synchronization
- [x] Dark mode support

---

## Notes

- Last deployment: `14b94f1` 
- All systems operational except edge case of duplicate uploads
- System is production-ready and live on `shoppinglist.echterhofflabs.me`
