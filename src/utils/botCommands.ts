import { supabase } from '@/integrations/supabase/client';

export interface BotResponse {
  content: string;
  isEmbed?: boolean;
  fields?: { label: string; value: string }[];
}

export interface CommandDef {
  name: string;
  description: string;
  usage: string;
  ownerOnly: boolean;
}

export const COMMANDS: CommandDef[] = [
  { name: 'help', description: 'Tüm komutları listele', usage: '/help', ownerOnly: false },
  { name: 'info', description: 'Sunucu istatistiklerini göster', usage: '/info', ownerOnly: false },
  { name: 'list', description: 'Üye listesini göster', usage: '/list', ownerOnly: false },
  { name: 'lock', description: 'Kanalı kilitle', usage: '/lock', ownerOnly: true },
  { name: 'unlock', description: 'Kanal kilidini aç', usage: '/unlock', ownerOnly: true },
  { name: 'kick', description: 'Kullanıcıyı sunucudan çıkar', usage: '/kick @kullanıcı', ownerOnly: true },
  { name: 'ban', description: 'Kullanıcıyı kalıcı olarak yasakla', usage: '/ban @kullanıcı [sebep]', ownerOnly: true },
  { name: 'unban', description: 'Kullanıcının yasağını kaldır', usage: '/unban @kullanıcı', ownerOnly: true },
  { name: 'timeout', description: 'Kullanıcıyı geçici olarak sustur', usage: '/timeout @kullanıcı [dakika]', ownerOnly: true },
  { name: 'untimeout', description: 'Susturma kaldır', usage: '/untimeout @kullanıcı', ownerOnly: true },
];

interface CommandContext {
  serverId: string;
  channelId: string;
  userId: string;
  isOwner: boolean;
  members: { id: string; name: string; role?: string }[];
}

function findMemberByMention(mention: string, members: CommandContext['members']) {
  const name = mention.replace('@', '').trim();
  return members.find(m => m.name.toLowerCase() === name.toLowerCase());
}

export async function executeBotCommand(
  text: string,
  ctx: CommandContext
): Promise<BotResponse | null> {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase().replace('/', '');
  const args = parts.slice(1);

  switch (cmd) {
    case 'help': {
      const lines = COMMANDS.map(c => `**${c.usage}** — ${c.description}${c.ownerOnly ? ' 🔒' : ''}`);
      return { content: '📖 **AuroraChat Bot Komutları**\n\n' + lines.join('\n'), isEmbed: true };
    }

    case 'info': {
      const { count: memberCount } = await supabase
        .from('server_members')
        .select('*', { count: 'exact', head: true })
        .eq('server_id', ctx.serverId);
      const { count: channelCount } = await supabase
        .from('channels')
        .select('*', { count: 'exact', head: true })
        .eq('server_id', ctx.serverId);
      const { data: serverData } = await supabase
        .from('servers')
        .select('name, created_at')
        .eq('id', ctx.serverId)
        .single();
      const created = serverData ? new Date(serverData.created_at).toLocaleDateString('tr-TR') : '?';
      return {
        content: `📊 **Sunucu Bilgisi**`,
        isEmbed: true,
        fields: [
          { label: 'Sunucu Adı', value: serverData?.name || '?' },
          { label: 'Üye Sayısı', value: String(memberCount || 0) },
          { label: 'Kanal Sayısı', value: String(channelCount || 0) },
          { label: 'Oluşturulma', value: created },
        ],
      };
    }

    case 'list': {
      if (ctx.members.length === 0) return { content: '👥 Üye bulunamadı.' };
      const lines = ctx.members.map(m => `• **${m.name}**${m.role ? ` — ${m.role}` : ''}`);
      return { content: '👥 **Üye Listesi**\n\n' + lines.join('\n'), isEmbed: true };
    }

    case 'lock': {
      if (!ctx.isOwner) return { content: '❌ Bu komutu yalnızca sunucu sahibi kullanabilir.' };
      const { error } = await supabase.from('channels').update({ is_locked: true } as any).eq('id', ctx.channelId);
      if (error) return { content: '❌ Kanal kilitlenirken hata oluştu.' };
      return { content: '🔒 **Bu kanal kilitlendi.** Yalnızca sunucu sahibi mesaj gönderebilir.' };
    }

    case 'unlock': {
      if (!ctx.isOwner) return { content: '❌ Bu komutu yalnızca sunucu sahibi kullanabilir.' };
      const { error } = await supabase.from('channels').update({ is_locked: false } as any).eq('id', ctx.channelId);
      if (error) return { content: '❌ Kanal kilidi açılırken hata oluştu.' };
      return { content: '🔓 **Kanal kilidi açıldı.** Herkes mesaj gönderebilir.' };
    }

    case 'kick': {
      if (!ctx.isOwner) return { content: '❌ Bu komutu yalnızca sunucu sahibi kullanabilir.' };
      if (!args[0]) return { content: '❌ Kullanım: `/kick @kullanıcı`' };
      const target = findMemberByMention(args[0], ctx.members);
      if (!target) return { content: `❌ Kullanıcı bulunamadı: ${args[0]}` };
      if (target.id === ctx.userId) return { content: '❌ Kendini atamazsın!' };
      const { error } = await supabase.from('server_members').delete().eq('server_id', ctx.serverId).eq('user_id', target.id);
      if (error) return { content: '❌ Kullanıcı atılırken hata oluştu.' };
      return { content: `👢 **${target.name}** sunucudan atıldı.` };
    }

    case 'ban': {
      if (!ctx.isOwner) return { content: '❌ Bu komutu yalnızca sunucu sahibi kullanabilir.' };
      if (!args[0]) return { content: '❌ Kullanım: `/ban @kullanıcı [sebep]`' };
      const target = findMemberByMention(args[0], ctx.members);
      if (!target) return { content: `❌ Kullanıcı bulunamadı: ${args[0]}` };
      if (target.id === ctx.userId) return { content: '❌ Kendini yasaklayamazsın!' };
      const reason = args.slice(1).join(' ') || '';
      const { error: banErr } = await supabase.from('server_bans').insert({
        server_id: ctx.serverId,
        user_id: target.id,
        banned_by: ctx.userId,
        reason,
      } as any);
      if (banErr) return { content: '❌ Yasaklama sırasında hata oluştu.' };
      await supabase.from('server_members').delete().eq('server_id', ctx.serverId).eq('user_id', target.id);
      return { content: `🔨 **${target.name}** sunucudan yasaklandı.${reason ? ` Sebep: ${reason}` : ''}` };
    }

    case 'unban': {
      if (!ctx.isOwner) return { content: '❌ Bu komutu yalnızca sunucu sahibi kullanabilir.' };
      if (!args[0]) return { content: '❌ Kullanım: `/unban @kullanıcı`' };
      const name = args[0].replace('@', '');
      // Look up in bans
      const { data: bans } = await supabase.from('server_bans').select('id, user_id').eq('server_id', ctx.serverId);
      if (!bans || bans.length === 0) return { content: '❌ Bu sunucuda yasaklı kullanıcı yok.' };
      // Try to find by profile name
      const userIds = bans.map(b => b.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
      const profile = profiles?.find(p => p.display_name.toLowerCase() === name.toLowerCase());
      if (!profile) return { content: `❌ Yasaklı kullanıcı bulunamadı: ${name}` };
      await supabase.from('server_bans').delete().eq('server_id', ctx.serverId).eq('user_id', profile.user_id);
      return { content: `✅ **${profile.display_name}** kullanıcısının yasağı kaldırıldı.` };
    }

    case 'timeout': {
      if (!ctx.isOwner) return { content: '❌ Bu komutu yalnızca sunucu sahibi kullanabilir.' };
      if (!args[0]) return { content: '❌ Kullanım: `/timeout @kullanıcı [dakika]`' };
      const target = findMemberByMention(args[0], ctx.members);
      if (!target) return { content: `❌ Kullanıcı bulunamadı: ${args[0]}` };
      const minutes = parseInt(args[1]) || 10;
      const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      const { error } = await supabase.from('server_members').update({ timeout_until: until } as any).eq('server_id', ctx.serverId).eq('user_id', target.id);
      if (error) return { content: '❌ Susturma sırasında hata oluştu.' };
      return { content: `🔇 **${target.name}** ${minutes} dakika boyunca susturuldu.` };
    }

    case 'untimeout': {
      if (!ctx.isOwner) return { content: '❌ Bu komutu yalnızca sunucu sahibi kullanabilir.' };
      if (!args[0]) return { content: '❌ Kullanım: `/untimeout @kullanıcı`' };
      const target = findMemberByMention(args[0], ctx.members);
      if (!target) return { content: `❌ Kullanıcı bulunamadı: ${args[0]}` };
      const { error } = await supabase.from('server_members').update({ timeout_until: null } as any).eq('server_id', ctx.serverId).eq('user_id', target.id);
      if (error) return { content: '❌ Susturma kaldırılırken hata oluştu.' };
      return { content: `🔊 **${target.name}** kullanıcısının susturması kaldırıldı.` };
    }

    default:
      return { content: `❌ Bilinmeyen komut: \`/${cmd}\`. Tüm komutlar için \`/help\` yazın.` };
  }
}
