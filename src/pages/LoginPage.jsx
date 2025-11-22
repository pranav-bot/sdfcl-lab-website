//TODO: use env save keys


import './LoginPage.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
//import env from 'react-dotenv'

// Initialize Supabase client
// Note: Replace these with your actual Supabase project URL and anon key
const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function LoginPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) navigate('/edit')
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
      if (session) navigate('/edit')
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error.message)
    }
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Welcome to SDFCL</h1>
            <p>Space Dynamics and Feedback Control Laboratory</p>
          </div>
          <div className="auth-container">
            <Auth 
              supabaseClient={supabase} 
              appearance={{ 
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#1f4e79',
                      brandAccent: '#2563eb',
                      brandButtonText: 'white',
                      defaultButtonBackground: '#f8fafc',
                      defaultButtonBackgroundHover: '#f1f5f9',
                      inputBackground: 'white',
                      inputBorder: '#d1d5db',
                      inputBorderHover: '#9ca3af',
                      inputBorderFocus: '#2563eb',
                    },
                    space: {
                      spaceSmall: '4px',
                      spaceMedium: '8px',
                      spaceLarge: '16px',
                      spaceXLarge: '32px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
                className: {
                  container: 'auth-widget',
                  button: 'auth-button',
                  input: 'auth-input',
                }
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/`}
            />
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="login-page">
        <div className="dashboard-container">
          <div className="welcome-header">
            <h1>Welcome Back!</h1>
            <p>You are successfully logged in to SDFCL Portal</p>
          </div>
          
          <div className="user-info">
            <div className="user-card">
              <div className="user-avatar">
                {session.user.user_metadata?.avatar_url ? (
                  <img 
                    src={session.user.user_metadata.avatar_url} 
                    alt="User Avatar" 
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {session.user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h3>{session.user.user_metadata?.full_name || 'User'}</h3>
                <p>{session.user.email}</p>
                <span className="user-id">ID: {session.user.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="dashboard-actions">
            <button className="action-btn primary">
              Access Lab Resources
            </button>
            <button className="action-btn secondary">
              View Research Projects
            </button>
            <button className="action-btn secondary">
              Team Portal
            </button>
          </div>

          <div className="logout-section">
            <button onClick={handleSignOut} className="logout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }
}
