import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../../auth/AuthContext.jsx'
import { authService } from '../../api/services/auth.js'
import { errMsg } from '../../api/client.js'
import loginBg from '../../assets/images/login-bg.jpg'   // <-- the image you saved

const homeFor = (role) => (role === 'PASSENGER' ? '/' : '/staff')

const COPY = {
  login: { title: 'Welcome back', sub: 'Sign in to continue.', cta: 'Sign in' },
  register: { title: 'Create your account', sub: 'Register as a passenger to start booking.', cta: 'Create account' },
  forgot: { title: 'Reset your password', sub: "Enter your email and we'll issue a reset code.", cta: 'Send reset code' },
  reset: { title: 'Choose a new password', sub: 'Enter the reset code and your new password.', cta: 'Reset password' },
}

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) navigate(homeFor(user.role), { replace: true })

  // A valid email needs text, an "@", and a dotted domain after it.
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Switch mode and clear any transient messages.
  function go(next) { setMode(next); setError(''); setInfo('') }

  async function submitLogin(e) {
    e.preventDefault()
    setError('')
    if (!emailValid) { setError('Please enter a valid email address.'); return }
    setBusy(true)
    try {
      const u = await login(email, password)
      navigate(homeFor(u.role), { replace: true })
    } catch (err) {
      setError(errMsg(err, 'Sign in failed. Check your email and password.'))
    } finally {
      setBusy(false)
    }
  }

  async function submitRegister(e) {
    e.preventDefault()
    setError(''); setInfo('')
    if (!emailValid) { setError('Please enter a valid email address.'); return }
    if (phone.length !== 10) { setError('Please enter a valid phone number.'); return }
    setBusy(true)
    try {
      await authService.register({ name, email, password, phone })
      const u = await login(email, password)
      navigate(homeFor(u.role), { replace: true })
    } catch (err) {
      setError(errMsg(err, 'Registration failed.'))
    } finally {
      setBusy(false)
    }
  }

  async function submitForgot(e) {
    e.preventDefault()
    setError(''); setInfo('')
    if (!emailValid) { setError('Please enter a valid email address.'); return }
    setBusy(true)
    try {
      const data = await authService.forgotPassword(email)
      // No mail server in this project, so the reset code is returned directly.
      // Pre-fill it and move to the reset step.
      setResetToken(data?.resetToken || '')
      setPassword('')
      setMode('reset')
      setInfo(`Reset code issued (valid ${data?.expiresInMinutes ?? 15} min). It's filled in below — set your new password.`)
    } catch (err) {
      setError(errMsg(err, 'Could not start a password reset.'))
    } finally {
      setBusy(false)
    }
  }

  async function submitReset(e) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      await authService.resetPassword(resetToken.trim(), password)
      setPassword(''); setResetToken('')
      setMode('login')
      setInfo('Password updated — please sign in with your new password.')
    } catch (err) {
      setError(errMsg(err, 'Could not reset your password.'))
    } finally {
      setBusy(false)
    }
  }

  const submit = { login: submitLogin, register: submitRegister, forgot: submitForgot, reset: submitReset }[mode]
  const copy = COPY[mode]

  return (
    <div className="cl-login-bg" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="cl-login-glass">
        <div className="cl-login-brand"><i className="bi bi-life-preserver" />CruiseLine</div>

        <h1 className="cl-login-title">{copy.title}</h1>
        <p className="cl-login-sub">{copy.sub}</p>

        {error && <Alert variant="danger">{error}</Alert>}
        {info && <Alert variant="info">{info}</Alert>}

        <Form onSubmit={submit}>
          {mode === 'register' && (
            <Form.Group className="mb-3">
              <Form.Label>Full name</Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter your full name" />
            </Form.Group>
          )}

          {mode !== 'reset' && (
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
              <div style={{ minHeight: '1.25rem' }}>
                {email.length > 0 && !emailValid &&
                  <Form.Text className="text-warning">Please enter a valid email address.</Form.Text>}
              </div>
            </Form.Group>
          )}

          {mode === 'register' && (
            <Form.Group className="mb-3">
              <Form.Label>Phone number</Form.Label>
              <Form.Control type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required placeholder="Enter your mobile number" />
              <div style={{ minHeight: '1.25rem' }}>
                {phone.length > 0 && phone.length < 10 &&
                  <Form.Text className="text-warning">Please enter a valid phone number.</Form.Text>}
              </div>
            </Form.Group>
          )}

          {mode === 'reset' && (
            <Form.Group className="mb-3">
              <Form.Label>Reset code</Form.Label>
              <Form.Control value={resetToken} onChange={(e) => setResetToken(e.target.value)} required placeholder="Paste your reset code" />
            </Form.Group>
          )}

          {mode !== 'forgot' && (
            <Form.Group className="mb-3">
              <Form.Label>{mode === 'reset' ? 'New password' : 'Password'}</Form.Label>
              <div className="cl-pw-wrap">
                <Form.Control type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  minLength={mode === 'register' || mode === 'reset' ? 8 : undefined}
                  placeholder="••••••••" />
                <button type="button" className="cl-pw-toggle" onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {(mode === 'register' || mode === 'reset') && <Form.Text className="text-white-50">At least 8 characters.</Form.Text>}
            </Form.Group>
          )}

          {mode === 'login' && (
            <div className="mb-3 text-end">
              <a href="#" className="cl-login-switch" onClick={(e) => { e.preventDefault(); go('forgot') }}>Forgot password?</a>
            </div>
          )}

          <Button type="submit" className="cl-btn-gold w-100 mb-3" disabled={busy}>
            {busy ? 'Please wait…' : copy.cta}
          </Button>
        </Form>

        <div className="text-center cl-login-switch">
          {mode === 'login' && (
            <>New passenger?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); go('register') }}>Create an account</a>
            </>
          )}
          {mode === 'register' && (
            <>Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); go('login') }}>Sign in</a>
            </>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <a href="#" onClick={(e) => { e.preventDefault(); go('login') }}>
              <i className="bi bi-arrow-left me-1" />Back to sign in
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
