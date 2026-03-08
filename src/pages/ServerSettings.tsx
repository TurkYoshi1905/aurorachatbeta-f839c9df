import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Settings, Users, Shield, ScrollText, Trash2, Camera, UserMinus, Plus, ArrowUp, ArrowDown, ChevronDown, Hash, Volume2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

interface Member { id: string; user_id: string; display_name: string; avatar_url: string | null; roles: { id: string; name: string; color: string }[]; }
interface Role { id: string; name: string; color: string; position: number; permissions: Record<string, boolean>; }
interface AuditLog { id: string; action: string; user_id: string; target_type: string | null; details: any; created_at: string; user_name?: string; }

const PRESET_COLORS = ['#E74C3C', '#E91E63', '#9B59B6', '#8E44AD', '#3498DB', '#2196F3', '#1ABC9C', '#2ECC71', '#F1C40F', '#FF9800', '#E67E22', '#95A5A6', '#607D8B', '#99AAB5'];

const PERMISSION_CATEGORIES = [
  { label: 'Genel', permissions: [
    { key: 'manage_channels', label: 'Kanal Yönetimi' },
    { key: 'manage_roles', label: 'Rol Yönetimi' },
  ]},
  { label: 'Üye', permissions: [
    { key: 'kick_members', label: 'Üye Atma' },
    { key: 'ban_members', label: 'Üye Yasaklama' },
  ]},
  { label: 'Metin', permissions: [
    { key: 'manage_messages', label: 'Mesaj Silme' },
    { key: 'pin_messages', label: 'Mesaj Sabitleme' },
    { key: 'mention_everyone', label: '@everyone Etiketleme' },
  ]},
];

const ServerSettings = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('general');
  const [serverName, setServerName] = useState('');
  const [serverIcon, setServerIcon] = useState('');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3498DB');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<{ id: string; name: string; position: number }[]>([]);
  const [channelsList, setChannelsList] = useState<{ id: string; name: string; type: string; position: number; category_id: string | null }[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const tabs = [
    { id: 'general', label: t('serverSettings.general'), icon: Settings },
    { id: 'channels', label: 'Kanallar', icon: Hash },
    { id: 'roles', label: t('serverSettings.rolesTab') || 'Roller', icon: Shield },
    { id: 'members', label: t('serverSettings.membersTab'), icon: Users },
    { id: 'audit', label: t('serverSettings.auditTab') || 'Denetim Kaydı', icon: ScrollText },
    { id: 'danger', label: t('serverSettings.dangerZone'), icon: Trash2 },
  ];

  const fetchChannelsAndCategories = useCallback(async () => {
    if (!serverId) return;
    const { data: cats } = await supabase.from('channel_categories').select('*').eq('server_id', serverId).order('position');
    const { data: chs } = await supabase.from('channels').select('*').eq('server_id', serverId).order('position');
    if (cats) setCategories(cats as any);
    if (chs) setChannelsList((chs as any[]).map(c => ({ id: c.id, name: c.name, type: c.type, position: c.position, category_id: c.category_id || null })));
  }, [serverId]);

  useEffect(() => { if (activeTab === 'channels') fetchChannelsAndCategories(); }, [activeTab, fetchChannelsAndCategories]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !serverId) return;
    await supabase.from('channel_categories').insert({ server_id: serverId, name: newCategoryName.trim(), position: categories.length });
    setNewCategoryName('');
    fetchChannelsAndCategories();
  };

  const handleDeleteCategory = async (catId: string) => {
    await supabase.from('channel_categories').delete().eq('id', catId);
    fetchChannelsAndCategories();
  };

  const handleDeleteChannel = async (channelId: string) => {
    await supabase.from('channels').delete().eq('id', channelId);
    fetchChannelsAndCategories();
  };

  useEffect(() => {
    if (!serverId) return;
    const fetchServer = async () => {
      const { data } = await supabase.from('servers').select('*').eq('id', serverId).single();
      if (data) { setServerName(data.name); setServerIcon(data.icon); setOwnerId(data.owner_id); }
      else navigate('/');
    };
    fetchServer();
  }, [serverId]);

  const fetchRoles = useCallback(async () => {
    if (!serverId) return;
    const { data } = await supabase.from('server_roles').select('*').eq('server_id', serverId).order('position', { ascending: false });
    if (data) setRoles(data as Role[]);
  }, [serverId]);

  const fetchMembers = useCallback(async () => {
    if (!serverId) return;
    setLoadingMembers(true);
    const { data: memberRows } = await supabase.from('server_members').select('id, user_id').eq('server_id', serverId);
    if (!memberRows) { setLoadingMembers(false); return; }
    const userIds = memberRows.map(m => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
    const { data: memberRoles } = await supabase.from('server_member_roles').select('user_id, role_id').eq('server_id', serverId);
    const { data: allRoles } = await supabase.from('server_roles').select('id, name, color').eq('server_id', serverId);

    setMembers(memberRows.map(m => {
      const p = profiles?.find(pr => pr.user_id === m.user_id);
      const userRoleIds = memberRoles?.filter(mr => mr.user_id === m.user_id).map(mr => mr.role_id) || [];
      const userRoles = allRoles?.filter(r => userRoleIds.includes(r.id)).map(r => ({ id: r.id, name: r.name, color: r.color })) || [];
      return { id: m.id, user_id: m.user_id, display_name: p?.display_name || 'Kullanıcı', avatar_url: p?.avatar_url || null, roles: userRoles };
    }));
    setLoadingMembers(false);
  }, [serverId]);

  const fetchAuditLogs = useCallback(async () => {
    if (!serverId) return;
    const { data } = await supabase.from('audit_logs').select('*').eq('server_id', serverId).order('created_at', { ascending: false }).limit(100);
    if (data) {
      const userIds = [...new Set((data as any[]).map(l => l.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
      setAuditLogs((data as any[]).map(l => ({
        ...l,
        user_name: profiles?.find(p => p.user_id === l.user_id)?.display_name || 'Kullanıcı',
      })));
    }
  }, [serverId]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);
  useEffect(() => { if (activeTab === 'members') fetchMembers(); }, [activeTab, fetchMembers]);
  useEffect(() => { if (activeTab === 'audit') fetchAuditLogs(); }, [activeTab, fetchAuditLogs]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (window.history.length > 1) navigate(-1); else navigate('/'); } };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  const isOwner = ownerId === user?.id;

  const handleSave = async () => {
    if (!serverName.trim() || !serverId) return;
    setSaving(true);
    const { error } = await supabase.from('servers').update({ name: serverName.trim(), icon: serverIcon }).eq('id', serverId);
    setSaving(false);
    if (error) toast.error(t('serverSettings.saveFailed'));
    else toast.success(t('serverSettings.saved'));
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !serverId) return;
    if (!file.type.startsWith('image/')) { toast.error(t('serverSettings.selectImage')); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t('serverSettings.fileTooLarge')); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/servers/${serverId}/icon.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error(t('serverSettings.uploadFailed')); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setServerIcon(urlData.publicUrl + '?t=' + Date.now());
    toast.success(t('serverSettings.iconUploaded'));
  };

  const handleDelete = async () => {
    if (!serverId) return;
    setDeleting(true);
    const { error } = await supabase.from('servers').delete().eq('id', serverId);
    setDeleting(false);
    if (error) toast.error(t('serverSettings.deleteFailed'));
    else { toast.success(t('serverSettings.deleted')); navigate('/'); }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim() || !serverId) return;
    const { error } = await supabase.from('server_roles').insert({ server_id: serverId, name: newRoleName.trim(), color: newRoleColor, position: roles.length });
    if (!error) {
      setNewRoleName('');
      fetchRoles();
      // Audit log
      if (user) await supabase.from('audit_logs').insert({ server_id: serverId, user_id: user.id, action: 'role_created', target_type: 'role', details: { name: newRoleName.trim(), color: newRoleColor } });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const { error } = await supabase.from('server_roles').delete().eq('id', roleId);
    if (!error) fetchRoles();
  };

  const handleMoveRole = async (roleId: string, direction: 'up' | 'down') => {
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= roles.length) return;
    await supabase.from('server_roles').update({ position: roles[swapIdx].position }).eq('id', roles[idx].id);
    await supabase.from('server_roles').update({ position: roles[idx].position }).eq('id', roles[swapIdx].id);
    fetchRoles();
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!serverId) return;
    const { error } = await supabase.from('server_member_roles').insert({ server_id: serverId, user_id: userId, role_id: roleId });
    if (!error) {
      fetchMembers();
      if (user) await supabase.from('audit_logs').insert({ server_id: serverId, user_id: user.id, action: 'role_assigned', target_type: 'member', target_id: userId, details: { role_id: roleId } });
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!serverId) return;
    await supabase.from('server_member_roles').delete().eq('server_id', serverId).eq('user_id', userId).eq('role_id', roleId);
    fetchMembers();
  };

  const handleKickMember = async (memberId: string, userId: string) => {
    if (userId === user?.id) { toast.error(t('serverSettings.cantKickSelf')); return; }
    const { error } = await supabase.from('server_members').delete().eq('id', memberId);
    if (error) toast.error(t('serverSettings.kickFailed'));
    else {
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success(t('serverSettings.kicked'));
      if (user && serverId) await supabase.from('audit_logs').insert({ server_id: serverId, user_id: user.id, action: 'member_kicked', target_type: 'member', target_id: userId });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const actionLabels: Record<string, string> = {
    role_created: '🛡️ Rol oluşturdu',
    role_assigned: '🎭 Rol atadı',
    member_kicked: '👢 Üye attı',
    member_joined: '📥 Sunucuya katıldı',
    member_left: '📤 Sunucudan ayrıldı',
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {isMobile && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-sidebar overflow-x-auto shrink-0">
          <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {!isMobile && (
        <div className="w-56 bg-sidebar flex flex-col items-end py-10 pr-2 pl-4 overflow-y-auto shrink-0">
          <div className="w-full space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">{t('serverSettings.title')}</p>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            <div className="border-t border-border my-2" />
            <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50">
              <X className="w-4 h-4" /> Geri
            </button>
          </div>
        </div>
      )}

      {!isMobile && (
        <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }} className="absolute top-6 right-6 w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="w-full max-w-2xl py-6 md:py-10 px-4 md:px-10 overflow-y-auto">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('serverSettings.general')}</h2>
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {serverIcon && (serverIcon.startsWith('http') || serverIcon.startsWith('/')) ? (
                      <img src={serverIcon} alt="Server" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-secondary-foreground">
                        {serverIcon || serverName.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    {isOwner && (
                      <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-5 h-5 text-white" />
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs uppercase text-muted-foreground font-semibold">{t('serverSettings.serverNameLabel')}</label>
                    <Input value={serverName} onChange={e => setServerName(e.target.value)} className="bg-input border-border" disabled={!isOwner} />
                  </div>
                </div>
                {isOwner && (
                  <Button onClick={handleSave} disabled={saving || !serverName.trim()} className="w-full">
                    {saving ? t('serverSettings.saving') : t('serverSettings.save')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Roles */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('serverSettings.rolesTab') || 'Roller'}</h2>
              {isOwner && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Yeni Rol Oluştur</p>
                  <div className="flex gap-2">
                    <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Rol adı" className="bg-input border-border flex-1" />
                    <Button onClick={handleCreateRole} disabled={!newRoleName.trim()} size="sm"><Plus className="w-4 h-4 mr-1" /> Ekle</Button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map(c => (
                      <button key={c} onClick={() => setNewRoleColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${newRoleColor === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {roles.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Henüz rol oluşturulmamış</p>}
                {roles.map((role, idx) => (
                  <div key={role.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                    <span className="flex-1 text-sm font-medium text-foreground">{role.name}</span>
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleMoveRole(role.id, 'up')} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleMoveRole(role.id, 'down')} disabled={idx === roles.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteRole(role.id)} className="p-1 text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('serverSettings.membersTab')}</h2>
              <div className="space-y-2">
                {loadingMembers ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('serverSettings.loadingMembers')}</p>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('serverSettings.noMembers')}</p>
                ) : (
                  members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium shrink-0">{m.display_name.charAt(0)?.toUpperCase()}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-medium truncate block">{m.display_name}{m.user_id === user?.id && <span className="text-muted-foreground text-xs ml-1">{t('serverSettings.you')}</span>}</span>
                        {m.roles.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {m.roles.map(r => (
                              <span key={r.id} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: r.color + '20', color: r.color }}>{r.name}
                                {isOwner && <button onClick={() => handleRemoveRole(m.user_id, r.id)} className="ml-1 hover:opacity-70">×</button>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isOwner && roles.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"><Shield className="w-3.5 h-3.5" /></button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1.5" side="left">
                              {roles.filter(r => !m.roles.some(mr => mr.id === r.id)).map(r => (
                                <button key={r.id} onClick={() => handleAssignRole(m.user_id, r.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary transition-colors">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                                  {r.name}
                                </button>
                              ))}
                              {roles.filter(r => !m.roles.some(mr => mr.id === r.id)).length === 0 && (
                                <p className="text-xs text-muted-foreground px-2 py-1">Tüm roller atanmış</p>
                              )}
                            </PopoverContent>
                          </Popover>
                        )}
                        {isOwner && m.user_id !== user?.id && (
                          <button onClick={() => handleKickMember(m.id, m.user_id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><UserMinus className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Audit Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('serverSettings.auditTab') || 'Denetim Kaydı'}</h2>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Henüz kayıt yok</p>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{log.user_name}</span>
                          {' '}<span className="text-muted-foreground">{actionLabels[log.action] || log.action}</span>
                        </p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {log.details.name && `Ad: ${log.details.name}`}
                            {log.details.color && ` • Renk: ${log.details.color}`}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(log.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Kanallar</h2>
              {isOwner && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Yeni Kategori Oluştur</p>
                  <div className="flex gap-2">
                    <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Kategori adı" className="bg-input border-border flex-1" />
                    <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()} size="sm"><Plus className="w-4 h-4 mr-1" /> Ekle</Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Kanalları kategoriler arasında taşımak için aşağıdaki açılır menüyü kullanın.</p>
              {channelsList.filter(c => !c.category_id).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Kategorisiz</p>
                  {channelsList.filter(c => !c.category_id).map(ch => (
                    <div key={ch.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
                      {ch.type === 'voice' ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <Hash className="w-4 h-4 text-muted-foreground" />}
                      <span className="flex-1 text-sm text-foreground">{ch.name}</span>
                      {isOwner && categories.length > 0 && (
                        <select
                          className="text-xs bg-secondary border border-border rounded px-1.5 py-1 text-foreground"
                          value=""
                          onChange={async (e) => {
                            const catId = e.target.value;
                            if (!catId) return;
                            const targetChannels = channelsList.filter(c => c.category_id === catId);
                            await supabase.from('channels').update({ category_id: catId, position: targetChannels.length } as any).eq('id', ch.id);
                            fetchChannelsAndCategories();
                          }}
                        >
                          <option value="">Taşı...</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      )}
                      {isOwner && <button onClick={() => handleDeleteChannel(ch.id)} className="p-1 text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
              )}
              {categories.map(cat => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat.name}</p>
                    {isOwner && <button onClick={() => handleDeleteCategory(cat.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3 h-3" /></button>}
                  </div>
                  {channelsList.filter(c => c.category_id === cat.id).map(ch => (
                    <div key={ch.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card ml-3">
                      {ch.type === 'voice' ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <Hash className="w-4 h-4 text-muted-foreground" />}
                      <span className="flex-1 text-sm text-foreground">{ch.name}</span>
                      {isOwner && (
                        <select
                          className="text-xs bg-secondary border border-border rounded px-1.5 py-1 text-foreground"
                          value={cat.id}
                          onChange={async (e) => {
                            const newCatId = e.target.value || null;
                            const targetChannels = channelsList.filter(c => c.category_id === newCatId);
                            await supabase.from('channels').update({ category_id: newCatId, position: targetChannels.length } as any).eq('id', ch.id);
                            fetchChannelsAndCategories();
                          }}
                        >
                          <option value="">Kategorisiz</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                      {isOwner && <button onClick={() => handleDeleteChannel(ch.id)} className="p-1 text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && isOwner && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-destructive">{t('serverSettings.dangerZone')}</h2>
              <div className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">{t('serverSettings.deleteServer')}</p>
                <p className="text-xs text-muted-foreground">{t('serverSettings.deleteConfirm')}</p>
                {!confirmDelete ? (
                  <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="w-4 h-4 mr-1" /> {t('serverSettings.deleteServer')}</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>{deleting ? t('serverSettings.deleting') : t('serverSettings.confirmDelete')}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>{t('serverSettings.cancelButton')}</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerSettings;
