

## Plan: Fuzzy Search, Reply Fix & Thread Fix

### 1. Emoji Autocomplete Fuzzy Search

**File:** `src/components/EmojiAutocompletePopup.tsx`

Replace exact `includes()` matching with a fuzzy scoring function that checks if all query characters appear in order within the keyword/name. Score by consecutive matches and early position. Sort results by score.

```typescript
const fuzzyMatch = (text: string, query: string): number => {
  let qi = 0, score = 0, consecutive = 0;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] === query[qi]) {
      qi++; score += 1 + consecutive; consecutive++;
      if (i === qi - 1) score += 2; // bonus for prefix match
    } else { consecutive = 0; }
  }
  return qi === query.length ? score : 0;
};
```

Apply to both server emojis (`e.name`) and built-in emoji keywords, then sort by score descending.

### 2. Reply Feature — Optimistic Message Fix

**File:** `src/pages/Index.tsx` — `handleSendMessage`

The optimistic message (line ~849) doesn't include `replyTo`, `replyAuthor`, or `replyContent`. When a user replies, the reply reference doesn't appear until the message list is refreshed.

**Fix:** Add reply info to the optimistic message:
```typescript
const optimisticMsg: DbMessage = {
  ...existing fields,
  replyTo: replyTo || undefined,
  replyAuthor: replyTo ? messages.find(m => m.id === replyTo)?.author : undefined,
  replyContent: replyTo ? messages.find(m => m.id === replyTo)?.content : undefined,
};
```

Also need to pass `messages` into the `handleSendMessage` dependency (or use a ref).

### 3. Thread Panel — Mobile Support

**File:** `src/pages/Index.tsx`

The mobile layout (lines 1085-1157) never renders `ThreadPanel`. When `handleOpenThread` is called on mobile, `activeThread` is set but nothing displays it.

**Fix:** On mobile, when `activeThread` is set, render `ThreadPanel` as a full-screen overlay or Sheet instead of the chat view. Add thread rendering logic to the mobile section:

- When `activeThread` is set and `mobileView === 'chat'`, show the ThreadPanel as a Sheet (bottom) or switch the mobile view to show the thread panel
- Add a close handler that sets `activeThread` to null

### Files Changed

| File | Change |
|---|---|
| `src/components/EmojiAutocompletePopup.tsx` | Add fuzzy match scoring function, apply to server + built-in search |
| `src/pages/Index.tsx` | Add reply info to optimistic message; render ThreadPanel in mobile layout |

