import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Upload, MessageCircle, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface UsageData {
  pdf_uploads_today: number
  questions_asked_today: number
  last_reset_date: string
}

export function UsageLimits() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUsageData()
    }
  }, [user])

  const fetchUsageData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('pdf_uploads_today, questions_asked_today, last_reset_date')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching usage data:', error)
        return
      }

      setUsage(data)
    } catch (error) {
      console.error('Error in fetchUsageData:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const getProgressColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressWidth = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100)
  }

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="card"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Daily Usage
      </h3>

      <div className="space-y-6">
        {/* PDF Uploads */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">PDF Uploads</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage?.pdf_uploads_today || 0}/1
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage?.pdf_uploads_today || 0, 1)}`}
              style={{ width: `${getProgressWidth(usage?.pdf_uploads_today || 0, 1)}%` }}
            ></div>
          </div>
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Questions</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage?.questions_asked_today || 0}/3
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage?.questions_asked_today || 0, 3)}`}
              style={{ width: `${getProgressWidth(usage?.questions_asked_today || 0, 3)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Free Plan:</strong> 1 PDF upload and 3 questions per day. 
          Limits reset daily at midnight.
        </p>
      </div>
    </motion.div>
  )
}