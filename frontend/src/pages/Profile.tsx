import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, CreditCard, Calendar, MessageSquare } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { 
  ProfileHeader, 
  PersonalInfo, 
  PaymentMethods, 
  ProfileBookings, 
  UserReviews 
} from '../components/profile'
import Loading from '../components/common/Loading'

type TabType = 'personal' | 'payment' | 'bookings' | 'reviews'

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'bookings', label: 'Booking History', icon: Calendar },
  { id: 'reviews', label: 'My Reviews', icon: MessageSquare },
] as const

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Get active tab from URL or default to 'personal'
  const activeTab = (searchParams.get('tab') as TabType) || 'personal'

  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab }, { replace: true })
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return <Loading fullScreen message="Loading profile..." />
  }

  if (!user) {
    return null
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfo />
      case 'payment':
        return <PaymentMethods />
      case 'bookings':
        return <ProfileBookings />
      case 'reviews':
        return <UserReviews />
      default:
        return <PersonalInfo />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-6"
        >
          {/* Profile Header (Always Visible) */}
          <ProfileHeader />

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
          >
            {renderTabContent()}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile
