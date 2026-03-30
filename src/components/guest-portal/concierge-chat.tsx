'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ConciergeChatProps {
  propertyConfig: Record<string, unknown>
  guestLanguage: string
}

export function ConciergeChat({ propertyConfig, guestLanguage }: ConciergeChatProps) {
  const t = useTranslations('ai')
  const tc = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true)
      setMessages([{ role: 'assistant', content: t('chatGreeting') }])
    }
  }, [open, greeted, t])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          guestLanguage,
          propertyConfig,
          history: updated,
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = (await res.json()) as { reply: string }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: tc('error') },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleForwardToHost(messageContent: string) {
    const subject = encodeURIComponent('Guest question')
    const body = encodeURIComponent(messageContent)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-xl"
        aria-label={t('concierge')}
      >
        <MessageCircle className="size-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col rounded-2xl border bg-background/95 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Label className="text-base font-semibold">{t('concierge')}</Label>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(false)}
          aria-label={tc('close')}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex max-h-96 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'self-end' : 'self-start'}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'assistant' && i > 0 && (
              <button
                type="button"
                onClick={() => handleForwardToHost(msg.content)}
                className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
              >
                {t('forwardToHost')}
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="self-start">
            <div className="max-w-[85%] animate-pulse rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              ...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleSend() }}
        className="flex items-center gap-2 border-t px-4 py-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('sendMessage')}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
