import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Header } from '../components/Header'
import { UsageLimits } from '../components/UsageLimits'
import { Upload, Send, FileText, MessageCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../components/LoadingSpinner'

interface Document {
  id: string
  filename: string
  summary: string
  upload_date: string
}

interface UsageData {
  pdf_uploads_today: number
  questions_asked_today: number
}

export function DashboardPage() {
  const { user } = useAuth()
  const [document, setDocument] = useState<Document | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [uploading, setUploading] = useState(false)
  const [asking, setAsking] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    // Fetch user's document
    const { data: docData } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (docData) {
      setDocument(docData)
    }

    // Fetch usage data
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('pdf_uploads_today, questions_asked_today')
      .eq('user_id', user.id)
      .single()

    if (usageData) {
      setUsage(usageData)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!user || !usage) return

    if (usage.pdf_uploads_today >= 1) {
      toast.error('Daily PDF upload limit reached. Try again tomorrow.')
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      // Create FormData for the file
      const formData = new FormData()
      formData.append('file', file)

      console.log('Uploading PDF to FastAPI backend...')
      
      // Call your FastAPI backend
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('FastAPI error:', errorText)
        throw new Error(`Failed to process PDF: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('FastAPI response:', result)

      if (!result.summary) {
        throw new Error('No summary received from backend')
      }

      // Save to Supabase
      const { error: docError } = await supabase
        .from('user_documents')
        .upsert({
          user_id: user.id,
          filename: file.name,
          summary: result.summary,
          upload_date: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (docError) {
        console.error('Supabase document error:', docError)
        throw docError
      }

      // Update usage
      const { error: usageError } = await supabase
        .from('user_usage')
        .update({
          pdf_uploads_today: usage.pdf_uploads_today + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (usageError) {
        console.error('Supabase usage error:', usageError)
        throw usageError
      }

      toast.success('PDF processed successfully!')
      fetchUserData()
    } catch (error: any) {
      console.error('Upload error:', error)
      if (error.message?.includes('fetch')) {
        toast.error('Cannot connect to backend server. Please make sure the FastAPI server is running on http://localhost:8000')
      } else {
        toast.error(error.message || 'Failed to process PDF')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !usage || !question.trim()) return

    if (usage.questions_asked_today >= 3) {
      toast.error('Daily question limit reached. Try again tomorrow.')
      return
    }

    if (!document) {
      toast.error('Please upload a PDF first')
      return
    }

    setAsking(true)
    try {
      console.log('Asking question to FastAPI backend:', question)
      
      const response = await fetch(`http://localhost:8000/ask/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `question=${encodeURIComponent(question)}`
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('FastAPI Q&A error:', errorText)
        throw new Error(`Failed to get answer: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('FastAPI Q&A response:', result)

      if (!result.answer) {
        throw new Error('No answer received from backend')
      }

      setAnswer(result.answer)

      // Update usage
      const { error } = await supabase
        .from('user_usage')
        .update({
          questions_asked_today: usage.questions_asked_today + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Usage update error:', error)
        throw error
      }

      setQuestion('')
      fetchUserData()
      toast.success('Question answered successfully!')
    } catch (error: any) {
      console.error('Q&A error:', error)
      if (error.message?.includes('fetch')) {
        toast.error('Cannot connect to backend server. Please make sure the FastAPI server is running on http://localhost:8000')
      } else {
        toast.error(error.message || 'Failed to get answer')
      }
    } finally {
      setAsking(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <UsageLimits />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Upload Section */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Research Paper
              </h2>
              
              {!document ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-50' 
                      : usage?.pdf_uploads_today >= 1
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <LoadingSpinner size="lg" className="mb-4" />
                      <p className="text-gray-600">Processing your PDF with AI<span className="loading-dots"></span></p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                    </div>
                  ) : usage?.pdf_uploads_today >= 1 ? (
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">Daily upload limit reached</p>
                      <p className="text-sm text-gray-500">Come back tomorrow to upload another PDF</p>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop your PDF here or click to browse
                      </p>
                      <p className="text-gray-600 mb-4">
                        Upload a biotech research paper to get AI-powered summary
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="btn-primary cursor-pointer">
                        Choose File
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Maximum file size: 10MB
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">{document.filename}</span>
                    </div>
                    <button
                      onClick={() => {
                        setDocument(null)
                        setAnswer('')
                      }}
                      className="text-sm text-green-700 hover:text-green-900 underline"
                    >
                      Upload New PDF
                    </button>
                  </div>
                  <p className="text-sm text-green-700">
                    Uploaded on {new Date(document.upload_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Summary Section */}
            {document && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📄 AI-Generated Summary
                </h2>
                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-lg p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {document.summary}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Q&A Section */}
            {document && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Ask Questions About Your Research
                </h2>
                
                <form onSubmit={handleQuestionSubmit} className="mb-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question about the research paper..."
                      className="input-field flex-1"
                      disabled={asking || (usage?.questions_asked_today >= 3)}
                    />
                    <button
                      type="submit"
                      disabled={asking || !question.trim() || (usage?.questions_asked_today >= 3)}
                      className="btn-primary flex items-center px-6"
                    >
                      {asking ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Ask
                        </>
                      )}
                    </button>
                  </div>
                  {usage?.questions_asked_today >= 3 && (
                    <p className="text-sm text-red-600 mt-2">
                      Daily question limit reached. Try again tomorrow.
                    </p>
                  )}
                </form>

                {answer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      AI Answer:
                    </h3>
                    <div className="prose max-w-none text-blue-800">
                      <div className="whitespace-pre-wrap leading-relaxed">{answer}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}