import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify user with anon client
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAnon.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub as string;
    const shortId = userId.slice(0, 8);

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Anonymize profile
    await supabaseAdmin.from('profiles').update({
      display_name: `Deleted User ${shortId}`,
      username: `deleted_${userId}`,
      avatar_url: null,
    }).eq('user_id', userId);

    // 2. Anonymize messages (keep them but update author_name)
    await supabaseAdmin.from('messages').update({
      author_name: 'Deleted User',
    }).eq('user_id', userId);

    // 3. Remove server memberships
    await supabaseAdmin.from('server_member_roles').delete().eq('user_id', userId);
    await supabaseAdmin.from('server_members').delete().eq('user_id', userId);

    // 4. Remove friendships
    await supabaseAdmin.from('friends').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    // 5. Delete servers owned by user (optional: transfer ownership would be better, but for now delete)
    // Get servers owned by user
    const { data: ownedServers } = await supabaseAdmin.from('servers').select('id').eq('owner_id', userId);
    if (ownedServers && ownedServers.length > 0) {
      const serverIds = ownedServers.map(s => s.id);
      // Clean up related data for owned servers
      await supabaseAdmin.from('server_member_roles').delete().in('server_id', serverIds);
      await supabaseAdmin.from('server_roles').delete().in('server_id', serverIds);
      await supabaseAdmin.from('server_invites').delete().in('server_id', serverIds);
      await supabaseAdmin.from('message_reactions').delete().in('message_id',
        (await supabaseAdmin.from('messages').select('id').in('server_id', serverIds)).data?.map(m => m.id) || []
      );
      await supabaseAdmin.from('messages').delete().in('server_id', serverIds);
      await supabaseAdmin.from('channels').delete().in('server_id', serverIds);
      await supabaseAdmin.from('audit_logs').delete().in('server_id', serverIds);
      await supabaseAdmin.from('server_members').delete().in('server_id', serverIds);
      await supabaseAdmin.from('servers').delete().in('id', serverIds);
    }

    // 6. Delete the profile
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId);

    // 7. Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Delete account error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
