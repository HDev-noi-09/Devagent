import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState("agent")
  const [displayedAnswer, setDisplayedAnswer] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayedAnswer])

  const typeAnswer = (fullText, callback) => {
    let index = 0
    setDisplayedAnswer("")
    setIsTyping(true)

    const interval = setInterval(() => {
      setDisplayedAnswer(prev => prev + fullText[index])
      index++
      if (index >= fullText.length) {
        clearInterval(interval)
        setIsTyping(false)
        callback(fullText)
      }
    }, 8)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")

    const updatedMessages = [
      ...messages,
      { role: "user", content: userMessage }
    ]
    setMessages(updatedMessages)
    setLoading(true)

    const recentHistory = updatedMessages.slice(-6)

    try {
      const response = await axios.post('/api/chat', {
        question: userMessage,
        history: recentHistory,
        mode
      })

      const answer = response.data.answer

      typeAnswer(answer, (fullText) => {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: fullText }
        ])
        setDisplayedAnswer("")
        setLoading(false)
      })

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: err.response?.data?.error || "Something went wrong. Please try again."
        }
      ])
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleNewProject = async () => {
    try {
    await axios.delete('/api/reset')
  } catch (err) {
    console.log("Reset error:", err)
  }
    navigate('/')
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>DevAgent</span>
          <span style={styles.headerDivider}>|</span>
          <span style={styles.headerSub}>AI Code Review</span>
        </div>
        <div style={styles.headerRight}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={styles.modeSelect}
          >
            <option value="agent">Agent</option>
            <option value="learning">Learning</option>
          </select>
          <button
            onClick={handleNewProject}
            style={styles.newProjectBtn}
          >
            New Project
          </button>
        </div>
      </div>
    {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && !loading && (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>Project uploaded successfully</p>
            <p style={styles.emptySubtitle}>Ask anything about your codebase</p>
            <div style={styles.suggestions}>
              <div
                style={styles.suggestion}
                onClick={() => setInput("What files are in this project?")}
              >
               What files are in this project?
              </div>
              <div
                style={styles.suggestion}
                onClick={() => setInput("Find any bugs in the code")}
              >
               Find any bugs in the code
              </div>
              <div
                style={styles.suggestion}
                onClick={() => setInput("Explain the overall structure")}
              >
               Explain the overall structure
              </div>
              <div
                style={styles.suggestion}
                onClick={() => setInput("How is error handling done?")}
              >
               How is error handling done?
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={styles.avatar}>DA</div>
            )}
            <div style={{
              ...styles.bubble,
              ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble)
            }}>
             <ReactMarkdown
  components={{
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: '8px',
            fontSize: '12px',
            margin: '8px 0',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          style={{
            backgroundColor: '#2a2a2a',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#e06c75'
          }}
          {...props}
        >
          {children}
        </code>
      )
    },
    p({ children }) {
      return <p style={{ margin: '6px 0', lineHeight: '1.6' }}>{children}</p>
    },
    ul({ children }) {
      return <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>{children}</ul>
    },
    li({ children }) {
      return <li style={{ margin: '4px 0' }}>{children}</li>
    },
    strong({ children }) {
      return <strong style={{ color: '#ffffff' }}>{children}</strong>
    }
  }}
>
  {msg.content}
</ReactMarkdown>
            </div>
            {msg.role === 'user' && (
              <div style={{ ...styles.avatar, backgroundColor: '#7c3aed' }}>U</div>
            )}
          </div>
        ))}

        {/* Typing animation */}
        {isTyping && displayedAnswer && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={styles.avatar}>DA</div>
            <div style={{ ...styles.bubble, ...styles.assistantBubble }}>
             <ReactMarkdown
  components={{
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: '8px',
            fontSize: '12px',
            margin: '8px 0',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          style={{
            backgroundColor: '#2a2a2a',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#e06c75'
          }}
          {...props}
        >
          {children}
        </code>
      )
    },
    p({ children }) {
      return <p style={{ margin: '6px 0', lineHeight: '1.6' }}>{children}</p>
    },
    ul({ children }) {
      return <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>{children}</ul>
    },
    li({ children }) {
      return <li style={{ margin: '4px 0' }}>{children}</li>
    },
    strong({ children }) {
      return <strong style={{ color: '#ffffff' }}>{children}</strong>
    }
  }}
>
  {displayedAnswer}
</ReactMarkdown>
            </div>
          </div>
        )}

         {/* Loading dots */}
        {loading && !isTyping && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={styles.avatar}>DA</div>
            <div style={{ ...styles.bubble, ...styles.assistantBubble }}>
              <span style={styles.loadingDots}>thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

     {/* Input */}
      <div style={styles.inputContainer}>
        <div style={styles.inputRow}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your codebase..."
            style={styles.textarea}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              ...styles.sendButton,
              opacity: loading || !input.trim() ? 0.4 : 1,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            ↑
          </button>
        </div>
        <p style={styles.inputHint}>
          Enter to send · Shift+Enter for new line · Mode: {mode === 'agent' ? '🤖 Agent' : '🎓 Learning'}
        </p>
      </div>

    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    borderBottom: '1px solid #1f1f1f',
    backgroundColor: '#141414',
    flexShrink: 0
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logo: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '16px',
    letterSpacing: '-0.3px'
  },
  headerDivider: {
    color: '#333333',
    fontSize: '16px'
  },
  headerSub: {
    color: '#555555',
    fontSize: '13px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  modeSelect: {
    backgroundColor: '#1a1a1a',
    color: '#aaaaaa',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none'
  },
  newProjectBtn: {
    backgroundColor: 'transparent',
    color: '#666666',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '12px',
    marginTop: '80px'
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  emptySubtitle: {
    color: '#555555',
    fontSize: '13px',
    margin: 0
  },
  suggestions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '16px',
    width: '100%',
    maxWidth: '560px'
  },
  suggestion: {
    backgroundColor: '#141414',
    border: '1px solid #222222',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '12px',
    color: '#666666',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.2s'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#1f1f1f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#888888',
    flexShrink: 0,
    fontWeight: '600'
  },
  bubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  userBubble: {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    borderBottomRightRadius: '4px'
  },
  assistantBubble: {
    backgroundColor: '#141414',
    color: '#cccccc',
    border: '1px solid #222222',
    borderBottomLeftRadius: '4px'
  },
  messageText: {
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '13px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  loadingDots: {
    color: '#555555',
    fontSize: '13px',
    fontStyle: 'italic'
  },
  inputContainer: {
    padding: '16px 24px',
    borderTop: '1px solid #1f1f1f',
    backgroundColor: '#141414',
    flexShrink: 0
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '13px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5'
  },
  sendButton: {
    width: '36px',
    height: '36px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  inputHint: {
    color: '#333333',
    fontSize: '11px',
    margin: '8px 0 0 0',
    textAlign: 'center'
  }
}

export default ChatPage