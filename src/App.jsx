import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    async function loadMessages() {
      try {
        const response = await fetch(`${BACKEND}/api/messages`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (response.status === 401) {
          await supabase.auth.signOut()
          return
        }
        const data = await response.json()
        setMessages(data.map(msg => ({ role: msg.role, content: msg.content })))
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }
    loadMessages()
  }, [session])

  async function handleAuth() {
    setAuthError('')
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
        if (error) setAuthError(error.message)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
        if (error) setAuthError(error.message)
      }
    } catch (error) {
      setAuthError('Something went wrong')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setMessages([])
  }

  async function sendMessage() {
    if (!input.trim()) return
    const userMessage = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages: updatedMessages })
      })
      const data = await response.json()
      const assistantMessage = { role: 'assistant', content: data.content[0].text }
      setMessages([...updatedMessages, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendMessage()
  }

  if (!session) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', fontFamily: 'sans-serif' }}>
        <h1>AI Assistant</h1>
        <h2>{isRegistering ? 'Create account' : 'Sign in'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
          />
          <input
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
          />
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
          <button
            style={{ padding: '8px', borderRadius: '8px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}
            onClick={handleAuth}
          >
            {isRegistering ? 'Register' : 'Sign in'}
          </button>
          <button
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>AI Assistant</h1>
        <div>
          <span style={{ marginRight: '12px', color: '#666' }}>{session.user.email}</span>
          <button
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer' }}
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', minHeight: '300px', marginBottom: '16px' }}>
        {messages.length === 0 && <p style={{ color: '#999' }}>No messages yet. Say something!</p>}
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '12px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '8px',
              background: msg.role === 'user' ? '#0070f3' : '#f0f0f0',
              color: msg.role === 'user' ? 'white' : 'black'
            }}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: '#999' }}>Thinking...</p>}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button
          style={{ padding: '8px 16px', borderRadius: '8px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default App