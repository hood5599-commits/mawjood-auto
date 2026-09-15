/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface AdminLiveChatConsoleProps {
  supabaseUrl: string;
  apiKey: string;
  lang?: 'ar' | 'en';
}

type Conversation = {
  id: string;
  user_id: string;
  status: string;
  requested_agent_at?: string | null;
  assigned_agent_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ChatMsg = {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'bot' | 'agent' | string;
  message: string;
  created_at?: string | null;
};

export const AdminLiveChatConsole: React.FC<AdminLiveChatConsoleProps> = ({
  supabaseUrl,
  apiKey,
  lang = 'ar',
}) => {
  const isRtl = lang === 'ar';
  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  const [waiting, setWaiting] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const knownWaitingIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const headers = useMemo(
    () => ({
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    [apiKey]
  );

  const playChime = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  const fetchQueues = useCallback(async () => {
    try {
      const [wRes, aRes] = await Promise.all([
        fetch(
          `${restUrl}/chat_conversations?status=eq.waiting_agent&order=requested_agent_at.asc`,
          { headers }
        ),
        fetch(
          `${restUrl}/chat_conversations?status=eq.agent_active&order=updated_at.desc`,
          { headers }
        ),
      ]);
      const wData = wRes.ok ? await wRes.json() : [];
      const aData = aRes.ok ? await aRes.json() : [];
      const waitingList: Conversation[] = Array.isArray(wData) ? wData : [];
      const activeList: Conversation[] = Array.isArray(aData) ? aData : [];

      // Detect new waiting tickets
      const nextIds = new Set(waitingList.map((c) => c.id));
      if (knownWaitingIds.current.size > 0) {
        for (const c of waitingList) {
          if (!knownWaitingIds.current.has(c.id)) {
            playChime();
            setToast(
              isRtl
                ? 'مستخدم جديد في قائمة انتظار الدعم'
                : 'New user entered the support queue'
            );
            setTimeout(() => setToast(null), 4000);
            break;
          }
        }
      }
      knownWaitingIds.current = nextIds;

      setWaiting(waitingList);
      setActive(activeList);
    } catch (_) {
      // keep prior
    } finally {
      setLoading(false);
    }
  }, [headers, isRtl, restUrl]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      try {
        const res = await fetch(
          `${restUrl}/chat_messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=300`,
          { headers }
        );
        if (!res.ok) return;
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (_) {}
    },
    [headers, restUrl]
  );

  useEffect(() => {
    fetchQueues();
    const t = setInterval(fetchQueues, 4000);
    return () => clearInterval(t);
  }, [fetchQueues]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedId);
    const t = setInterval(() => fetchMessages(selectedId), 2500);
    return () => clearInterval(t);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selected =
    waiting.find((c) => c.id === selectedId) ||
    active.find((c) => c.id === selectedId) ||
    null;

  const elapsedLabel = (iso?: string | null) => {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(ms / 60000));
    if (mins < 1) return isRtl ? 'الآن' : 'now';
    if (mins < 60) return isRtl ? `${mins} د` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return isRtl ? `${hrs} س` : `${hrs}h`;
  };

  const acceptChat = async (conv: Conversation) => {
    try {
      const res = await fetch(`${restUrl}/chat_conversations?id=eq.${conv.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: 'agent_active',
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.text();
        alert(err || 'Accept failed');
        return;
      }
      await fetch(
        `${restUrl}/chat_messages`,
        {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify({
            conversation_id: conv.id,
            sender_type: 'agent',
            message: isRtl
              ? 'مرحباً، أنا موظف الدعم في موجود أوتو. كيف أقدر أساعدك؟'
              : 'Hi, I am a Mawjood support agent. How can I help?',
          }),
        }
      );
      setSelectedId(conv.id);
      fetchQueues();
      fetchMessages(conv.id);
    } catch (e: any) {
      alert(e?.message || 'Accept failed');
    }
  };

  const closeChat = async (conv: Conversation) => {
    if (!window.confirm(isRtl ? 'إنهاء هذه المحادثة؟' : 'Close this ticket?')) return;
    try {
      await fetch(`${restUrl}/chat_conversations?id=eq.${conv.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: 'closed',
          updated_at: new Date().toISOString(),
        }),
      });
      await fetch(`${restUrl}/chat_messages`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          conversation_id: conv.id,
          sender_type: 'agent',
          message: isRtl
            ? 'تم إنهاء المحادثة. شكراً لتواصلك مع موجود أوتو.'
            : 'This chat has been closed. Thank you for contacting Mawjood Auto.',
        }),
      });
      if (selectedId === conv.id) setSelectedId(null);
      fetchQueues();
    } catch (e: any) {
      alert(e?.message || 'Close failed');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${restUrl}/chat_messages`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          conversation_id: selectedId,
          sender_type: 'agent',
          message: draft.trim(),
        }),
      });
      if (res.ok || res.status === 201 || res.status === 204) {
        setDraft('');
        fetchMessages(selectedId);
      } else {
        alert(await res.text());
      }
    } catch (err: any) {
      alert(err?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const panelCard = (conv: Conversation, queueIndex?: number) => {
    const isSelected = selectedId === conv.id;
    const waitingMode = conv.status === 'waiting_agent';
    return (
      <div
        key={conv.id}
        onClick={() => setSelectedId(conv.id)}
        style={{
          padding: 12,
          borderRadius: 12,
          border: `1.5px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
          backgroundColor: isSelected ? '#f0f9ff' : '#fff',
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <strong style={{ fontSize: 13, color: '#0f172a' }}>
            {waitingMode && queueIndex != null ? `#${queueIndex + 1} · ` : ''}
            {conv.user_id.slice(0, 8)}…
          </strong>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
            {elapsedLabel(conv.requested_agent_at || conv.updated_at)}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
          {waitingMode
            ? (isRtl ? 'بانتظار القبول' : 'Waiting to be accepted')
            : (isRtl ? 'محادثة نشطة' : 'Active chat')}
        </div>
        {waitingMode && (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              acceptChat(conv);
            }}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '8px 10px',
              border: 'none',
              borderRadius: 8,
              backgroundColor: '#0284c7',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {isRtl ? 'قبول المحادثة' : 'Accept Chat'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: 18 }}>
            {isRtl ? 'صندوق الدعم المباشر' : 'Live Support Inbox'}
          </h3>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12.5 }}>
            {isRtl
              ? 'قائمة الانتظار والمحادثات النشطة مع عبود / الموظفين'
              : 'Waiting queue and active Abboud / agent conversations'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '6px 10px', borderRadius: 999, fontWeight: 800, fontSize: 12 }}>
            {isRtl ? `انتظار ${waiting.length}` : `Waiting ${waiting.length}`}
          </span>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 10px', borderRadius: 999, fontWeight: 800, fontSize: 12 }}>
            {isRtl ? `نشط ${active.length}` : `Active ${active.length}`}
          </span>
        </div>
      </div>

      {toast && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
            color: '#92400e',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          🔔 {toast}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 320px) 1fr',
          gap: 16,
          minHeight: 520,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12 }}>
            <h4 style={{ margin: '0 0 10px', color: '#92400e', fontSize: 14 }}>
              {isRtl ? 'قائمة الانتظار' : 'Waiting Queue'}
            </h4>
            {loading && waiting.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 12.5 }}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : waiting.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 12.5 }}>{isRtl ? 'لا يوجد منتظرون' : 'Queue empty'}</div>
            ) : (
              waiting.map((c, i) => panelCard(c, i))
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, flex: 1 }}>
            <h4 style={{ margin: '0 0 10px', color: '#0369a1', fontSize: 14 }}>
              {isRtl ? 'محادثات نشطة' : 'Active Conversations'}
            </h4>
            {active.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 12.5 }}>{isRtl ? 'لا توجد محادثات نشطة' : 'No active chats'}</div>
            ) : (
              active.map((c) => panelCard(c))
            )}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 520,
          }}
        >
          {!selected ? (
            <div style={{ margin: 'auto', color: '#94a3b8', padding: 24, textAlign: 'center' }}>
              {isRtl ? 'اختر محادثة من القائمة' : 'Select a conversation'}
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>{selected.user_id}</strong>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>{selected.status}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selected.status === 'waiting_agent' && (
                    <button
                      type="button"
                      onClick={() => acceptChat(selected)}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 8,
                        background: '#0284c7',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {isRtl ? 'قبول المحادثة' : 'Accept Chat'}
                    </button>
                  )}
                  {selected.status === 'agent_active' && (
                    <button
                      type="button"
                      onClick={() => closeChat(selected)}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 8,
                        background: '#b91c1c',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {isRtl ? 'إنهاء المحادثة' : 'Close Ticket'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#f8fafc' }}>
                {messages.map((m) => {
                  const mine = m.sender_type === 'agent';
                  const isBot = m.sender_type === 'bot';
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: mine ? (isRtl ? 'flex-start' : 'flex-end') : (isRtl ? 'flex-end' : 'flex-start'),
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '10px 12px',
                          borderRadius: 12,
                          background: mine ? '#0284c7' : isBot ? '#fff7ed' : '#fff',
                          color: mine ? '#fff' : '#0f172a',
                          border: mine ? 'none' : '1px solid #e2e8f0',
                          fontSize: 13,
                          lineHeight: 1.45,
                        }}
                      >
                        <div style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.8, marginBottom: 4 }}>
                          {mine ? (isRtl ? 'الموظف' : 'Agent') : isBot ? (isRtl ? 'عبود' : 'Abboud') : (isRtl ? 'العميل' : 'Customer')}
                        </div>
                        {m.message}
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString(isRtl ? 'ar-QA' : 'en-GB') : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selected.status === 'agent_active' ? (
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={isRtl ? 'اكتب ردك...' : 'Type a reply...'}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      fontFamily: 'Cairo, sans-serif',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: 10,
                      background: '#0284c7',
                      color: '#fff',
                      fontWeight: 800,
                      cursor: sending ? 'wait' : 'pointer',
                    }}
                  >
                    {isRtl ? 'إرسال' : 'Send'}
                  </button>
                </form>
              ) : (
                <div style={{ padding: 12, borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: 12.5, textAlign: 'center' }}>
                  {isRtl ? 'اقبل المحادثة لبدء الرد' : 'Accept the chat to reply'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
