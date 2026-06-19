import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'

function UploadPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.name.endsWith('.zip')) {
      setFile(selected)
      setError("")
    } else {
      setError("Please select a valid ZIP file")
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a ZIP file first")
      return
    }

    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append('project', file)

    try {
      await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate('/chat')
    } catch (err) {
        console.log("Upload error:", err)
        console.log("Error response:", err.response)
      setError(err.response?.data?.error || "Upload failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.badge}>AI Code Review Agent</div>

        <h1 style={styles.title}>DevAgent</h1>

        <p style={styles.subtitle}>
          Drop your codebase here. Get reviews, bug detection,
          and suggestions — powered by an AI agent.
        </p>

        <div style={styles.divider} />

        <div style={styles.uploadRow}>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="fileInput"
          />
          <label htmlFor="fileInput" style={styles.fileLabel}>
            <span style={styles.fileIcon}>📁</span>
            <span style={styles.fileName}>
              {file ? file.name : "Select ZIP file"}
            </span>
          </label>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              ...styles.button,
              opacity: loading || !file ? 0.5 : 1,
              cursor: loading || !file ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "Processing..." : "Upload"}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {loading && (
          <p style={styles.loadingText}>
            Analyzing your project...
          </p>
        )}

        <div style={styles.features}>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🔍</span>
            <span>Semantic code search</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🐛</span>
            <span>Bug detection & fixes</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>📚</span>
            <span>Live documentation fetch</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🎓</span>
            <span>Learning mode</span>
          </div>
        </div>

      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f0f',
  },
  card: {
    backgroundColor: '#141414',
    padding: '48px 44px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '460px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
    border: '1px solid #222222',
    boxShadow: '0 0 40px rgba(124, 58, 237, 0.08)'
  },
  badge: {
    backgroundColor: '#1e1333',
    color: '#a78bfa',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    border: '1px solid #2d1f4e'
  },
  title: {
    color: '#ffffff',
    fontSize: '36px',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  subtitle: {
    color: '#666666',
    fontSize: '13px',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.7',
    maxWidth: '340px'
  },
  divider: {
    width: '100%',
    height: '1px',
    backgroundColor: '#1f1f1f'
  },
  uploadRow: {
    width: '100%',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  fileLabel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  fileIcon: {
    fontSize: '14px',
    flexShrink: 0
  },
  fileName: {
    color: '#888888',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
    transition: 'opacity 0.2s'
  },
  error: {
    color: '#f87171',
    fontSize: '12px',
    margin: 0,
    alignSelf: 'flex-start'
  },
  loadingText: {
    color: '#555555',
    fontSize: '12px',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.6'
  },
  features: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '4px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#444444',
    fontSize: '12px',
  },
  featureIcon: {
    fontSize: '14px'
  }
}

export default UploadPage