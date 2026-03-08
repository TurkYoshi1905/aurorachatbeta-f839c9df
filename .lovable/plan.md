

## Plan: Black Screen Fix + Server Delete Cascade + DM Real-time Stabilization

### 1. Black Screen Root Cause (CRITICAL)

**Line 828 of `src/pages/Index.tsx`**: `const { t } = useTranslation()` is called **after** three conditional returns (lines 788, 830, 844). This violates React's Rules of Hooks — hooks must be called unconditionally at the top of the component. This causes React to crash silently, producing a black screen.

**Fix**: Move the `useTranslation()` call to the top of the component (next to the other hooks, around line 122). Replace all subsequent `t()` calls that already exist above the current hook call location with the moved reference.

### 2. Server Deletion — Cascade via Foreign Keys

Current deletion logic (ServerSettingsDialog.tsx lines 63-73) manually deletes messages, channels, invites, members, then the server. This is fragile — if RLS blocks any intermediate delete, the server remains.

**Fix**: Add a SQL migration with `ON DELETE CASCADE` foreign keys:
- `channels.server_id → servers.id ON DELETE CASCADE`
- `messages.server_id → servers.id ON DELETE CASCADE`
- `messages.channel_id → channels.id ON DELETE CASCADE`
- `server_members.server_id → servers.id ON DELETE CASCADE`
- `server_invites.server_id → servers.id ON DELETE CASCADE`

Then simplify `handleDelete` to a single `supabase.from('servers').delete().eq('id', serverId)`.

### 3. DM Real-time — Typing Channel Broadcast Fix

In `Index.tsx` lines 623-633, `handleTypingStart` and `handleTypingStop` create a **new channel reference** via `supabase.channel(...)` instead of using the existing subscribed channel. This sends broadcasts on an unsubscribed channel, which Supabase silently drops.

**Fix**: Store the typing channel in a `useRef` (similar to how DMChatArea already does it) and use that ref in `handleTypingStart`/`handleTypingStop`.

### File Changes

| File | Change |
|---|---|
| SQL Migration | Add CASCADE foreign keys to channels, messages, server_members, server_invites |
| `src/pages/Index.tsx` | Move `useTranslation()` to top; fix typing channel ref; simplify `handleTypingStart`/`handleTypingStop` |
| `src/components/ServerSettingsDialog.tsx` | Simplify `handleDelete` to single server delete (cascade handles the rest) |

