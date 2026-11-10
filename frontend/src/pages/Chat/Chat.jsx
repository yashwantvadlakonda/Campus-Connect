import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages, sendMessage } from '../../services/api'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Send, ArrowLeft, Loader2, Sparkles, Check, CheckCheck, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function Chat() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const currentUserId = user?.id || 'current_user'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(matchId)
        setMessages(Array.isArray(data) ? data : [])
      } catch (error) {
        setMessages([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchMessages()

    const channel = supabase
      .channel(`match_${matchId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        setMessages(prev => [...prev, payload.payload])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, currentUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!newMessage.trim()) return

    const msgContent = newMessage.trim()
    setNewMessage('')

    const tempMsg = {
      id: Date.now(),
      senderId: currentUserId,
      content: msgContent,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, tempMsg])

    try {
      await sendMessage(matchId, msgContent)
      await supabase.channel(`match_${matchId}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: tempMsg
      })
    } catch (error) {
      // Optimistic message already added
    }
  }

  const icebreakers = [
    "Let's register for the Hackathon! 🚀",
    "What stack are you thinking of using? 💻",
    "Do you want to do a quick Discord / Google Meet call? 📞"
  ]

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        <p className="text-sm text-slate-400">Loading conversation...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[82vh] bg-white rounded-3xl overflow-hidden shadow-sm animate-fade-in max-w-4xl mx-auto border border-slate-200">
      {/* Top Header */}
      <div className="bg-white/95 backdrop-blur-md p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/matches')}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              SC
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900 text-sm">Sarah Chen</h2>
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              Computer Science • Online
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg font-medium">
            Campus Hackathon 2026 Match
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
              <Sparkles size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Direct Match Conversation</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              No messages exchanged yet. Send a message below to kick off your team formation or coordinate on projects!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-3.5 shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/10' 
                      : 'bg-white text-slate-900 rounded-tl-sm border border-slate-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck size={12} className="text-indigo-200" />}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Icebreaker suggestions */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0">Quick reply:</span>
        {icebreakers.map((text, idx) => (
          <button
            key={idx}
            onClick={() => {
              setNewMessage(text)
            }}
            className="text-[11px] px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 whitespace-nowrap transition-colors"
          >
            {text}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200 sticky bottom-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="input-field py-3 text-sm bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
            placeholder="Type a message to your teammate..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-5 py-3 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/10 active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
