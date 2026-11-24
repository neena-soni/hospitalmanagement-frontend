import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Stethoscope,
  X,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react'
import botMascot from '../../assets/bot-mascot.png'
import { askAi, suggestSpecialty } from '../../api/ai'
import Button from '../ui/Button'

export default function AiCompanion({ isOpen, onToggle, onSelectSpecialty }) {
  const [activeMode, setActiveMode] = useState('triage') // 'triage' or 'chat'

  // --- Triage Mode State ---
  const [symptoms, setSymptoms] = useState('')
  const [triageLoading, setTriageLoading] = useState(false)
  const [triageResult, setTriageResult] = useState(null)
  const [triageError, setTriageError] = useState('')

  // --- Chat Mode State ---
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm your hospital assistant. Ask me anything about our doctors, specialties, or appointment availability!",
    },
  ])

  const chatEndRef = useRef(null)

  useEffect(() => {
    if (activeMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeMode])

  // Handle Symptom Triage Submission
  const handleTriageSubmit = async (e) => {
    e.preventDefault()
    if (!symptoms.trim() || triageLoading) return

    setTriageLoading(true)
    setTriageError('')
    setTriageResult(null)

    try {
      const data = await suggestSpecialty(symptoms.trim())
      setTriageResult(data)
    } catch (err) {
      setTriageError(err.message)
    } finally {
      setTriageLoading(false)
    }
  }

  // Handle Grounded Chat Submission
  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMsg = chatInput.trim()
    setChatInput('')
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }])
    setChatLoading(true)

    try {
      const data = await askAi(userMsg)
      setMessages((prev) => [...prev, { sender: 'bot', text: data.answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Sorry, I encountered an issue: ${err.message}` },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <>
      {/* 1. Floating Mascot Trigger (Bottom-Right) */}
      <div className="fixed bottom-5 right-6 z-40 flex flex-col items-end gap-1.5">
        {/* Speech Bubble Invitation */}
        {!isOpen && (
          <div
            onClick={onToggle}
            className="flex items-center gap-2 rounded-full bg-canvas/95 px-4 py-2 shadow-soft border border-ink/10 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:scale-105 select-none -mr-1"
          >
            <span className="flex h-2 w-2 rounded-full bg-clay animate-pulse" />
            <span className="text-xs font-semibold text-ink">Need help? Ask AI!</span>
          </div>
        )}

        {/* Large, High-Visibility Mascot Character Button */}
        <button
          onClick={onToggle}
          aria-label="Toggle AI Assistant"
          className="group relative flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer filter drop-shadow-xl"
        >
          <img
            src={botMascot}
            alt="AI Assistant Mascot"
            className="h-28 w-28 md:h-36 md:w-36 object-contain transition-transform duration-300 group-hover:-translate-y-1.5 select-none"
          />
          <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-clay text-[10px] font-bold text-canvas shadow-soft ring-2 ring-canvas">
            AI
          </span>
        </button>
      </div>

      {/* 2. Slide-Over Assistant Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop click to dismiss */}
          <div className="flex-1" onClick={onToggle} />

          {/* Drawer Card */}
          <div className="relative flex h-full w-full max-w-md flex-col bg-canvas shadow-2xl border-l border-ink/10 animate-slideLeft">
            {/* Header: Mascot, Title & Dismiss */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4 bg-sand/30">
              <div className="flex items-center gap-3.5">
                <img
                  src={botMascot}
                  alt="Assistant Mascot"
                  className="h-16 w-16 object-contain drop-shadow-sm shrink-0"
                />
                <div>
                  <h3 className="font-display text-xl text-ink leading-tight">
                    Hospital AI Assistant
                  </h3>
                </div>
              </div>

              <button
                onClick={onToggle}
                className="rounded-full p-2 text-ink/50 hover:bg-sand hover:text-ink transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-ink/10 px-6 pt-3 gap-2 bg-sand/15">
              <button
                onClick={() => setActiveMode('triage')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  activeMode === 'triage'
                    ? 'border-clay text-clay'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <Stethoscope size={14} />
                <span>Symptom Triage</span>
              </button>
              <button
                onClick={() => setActiveMode('chat')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  activeMode === 'chat'
                    ? 'border-clay text-clay'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <MessageSquare size={14} />
                <span>Ask Availability</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* --- MODE A: SYMPTOM TRIAGE --- */}
              {activeMode === 'triage' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-sand/40 p-4 text-xs text-ink/70">
                    <p className="font-medium text-ink">How are you feeling?</p>
                    <p className="mt-0.5">
                      Describe your symptoms and AI will route you to the correct hospital specialty.
                    </p>
                  </div>

                  <form onSubmit={handleTriageSubmit} className="space-y-3">
                    <textarea
                      rows={3}
                      required
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g. Constant throbbing headache on one side with light sensitivity for 2 days..."
                      className="w-full rounded-2xl border border-ink/15 bg-sand/20 p-3 text-xs text-ink focus:border-clay focus:outline-none"
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={triageLoading}
                      loading={triageLoading}
                      className="w-full"
                    >
                      {triageLoading ? 'Analyzing Symptoms…' : 'Suggest Department'}
                    </Button>
                  </form>

                  {triageError && (
                    <div className="rounded-xl bg-brick/10 p-3 text-xs text-brick">
                      {triageError}
                    </div>
                  )}

                  {/* Triage Output Card */}
                  {triageResult && (
                    <div className="space-y-3 pt-2">
                      {/* Suggested Specialty Card */}
                      <div className="rounded-2xl bg-sand/60 border border-ink/10 p-4 space-y-2">
                        <span className="text-[11px] uppercase tracking-wider text-ink/50 font-semibold block">
                          Recommended Department
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-xl text-ink font-semibold">
                            {triageResult.specialty}
                          </span>
                          <span className="rounded-full bg-clay/15 px-3 py-1 text-xs font-semibold text-clay">
                            Specialty Match
                          </span>
                        </div>
                        <p className="text-xs text-ink/70 pt-1">
                          {triageResult.reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- MODE B: GROUNDED HOSPITAL CHAT --- */}
              {activeMode === 'chat' && (
                <div className="flex flex-col h-full justify-between space-y-3">
                  <div className="space-y-3">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${
                          msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.sender === 'bot' && (
                          <img
                            src={botMascot}
                            alt="Bot"
                            className="h-7 w-7 object-contain mt-0.5 shrink-0"
                          />
                        )}
                        <div
                          className={`rounded-2xl p-3 text-xs max-w-[80%] ${
                            msg.sender === 'user'
                              ? 'bg-clay text-canvas rounded-br-xs'
                              : 'bg-sand/60 text-ink rounded-bl-xs border border-ink/5'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex gap-2 items-center text-xs text-ink/50">
                        <img src={botMascot} alt="Bot" className="h-6 w-6 object-contain animate-bounce" />
                        <span>Checking hospital records…</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleChatSubmit} className="flex gap-2 pt-2 border-t border-ink/10">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about doctors, fees, or availability..."
                      className="flex-1 rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-xs text-ink focus:border-clay focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-clay text-canvas hover:bg-brick disabled:opacity-50 transition cursor-pointer shrink-0"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Static Non-Diagnostic Medical Disclaimer */}
            <div className="border-t border-ink/10 bg-sand/40 p-4 flex items-start gap-2 text-[10px] text-ink/60 leading-normal">
              <ShieldAlert size={14} className="shrink-0 text-ink/40 mt-0.5" />
              <span>
                <strong>Medical Notice:</strong> AI suggestions provide departmental routing and availability details only. This does not constitute clinical diagnosis.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
