import { useState } from 'react'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: updatedMessages
  })
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

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>AI Assistant</h1>

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
          onChange={(e) => setInput(e.target.value)}
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