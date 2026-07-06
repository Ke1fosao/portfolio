import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function AdminLogin() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    totp_code: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/token/', {
        username: form.username,
        password: form.password,
        totp_code: form.totp_code,
      })

      localStorage.setItem(
        'portfolio_access_token',
        response.data.access
      )

      localStorage.setItem(
        'portfolio_refresh_token',
        response.data.refresh
      )

      navigate('/admin/overview')
    } catch (error) {
      setError(error.response?.data?.detail || 'Неправильний логін, пароль або 2FA-код')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .login-page {
          min-height: 100vh;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(
              circle at 20% 15%,
              rgba(52, 255, 112, 0.12),
              transparent 32%
            ),
            radial-gradient(
              circle at 80% 85%,
              rgba(0, 255, 128, 0.08),
              transparent 35%
            ),
            #050706;
        }

        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.18;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            );
          background-size: 50px 50px;
          mask-image: radial-gradient(
            circle at center,
            black,
            transparent 80%
          );
        }

        .login-glow {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          background: rgba(47, 255, 110, 0.13);
          animation: glowMove 7s ease-in-out infinite alternate;
        }

        .login-glow-one {
          top: -160px;
          left: -100px;
        }

        .login-glow-two {
          right: -140px;
          bottom: -170px;
          animation-delay: -3s;
        }

        .login-card {
          width: 100%;
          max-width: 410px;
          padding: 34px;
          position: relative;
          z-index: 2;
          border: 1px solid rgba(80, 255, 130, 0.14);
          border-radius: 24px;
          background: rgba(12, 16, 13, 0.9);
          backdrop-filter: blur(20px);
          box-shadow:
            0 35px 90px rgba(0, 0, 0, 0.55),
            0 0 60px rgba(35, 255, 100, 0.04);
          animation: cardAppear 0.45s ease;
        }

        .login-top {
          margin-bottom: 27px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .login-back {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 13px;
          color: #9aa39d;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.035);
          transition:
            color 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .login-back:hover {
          color: #61ff91;
          border-color: rgba(97, 255, 145, 0.35);
          background: rgba(97, 255, 145, 0.08);
          transform: translateX(-3px);
        }

        .login-back svg {
          width: 20px;
          height: 20px;
        }

        .login-logo {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          color: #041108;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -1px;
          background: linear-gradient(
            135deg,
            #b9ffca,
            #42ff7c
          );
          box-shadow: 0 10px 30px rgba(53, 255, 111, 0.22);
        }

        .login-title {
          margin: 0 0 8px;
          color: #f4fff7;
          font-size: 32px;
          line-height: 1.1;
          letter-spacing: -1.5px;
        }

        .login-description {
          margin: 0 0 30px;
          color: #78827b;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-field label {
          color: #bec7c0;
          font-size: 13px;
          font-weight: 600;
        }

        .login-input-wrapper {
          position: relative;
        }

        .login-input {
          width: 100%;
          height: 53px;
          padding: 0 16px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          outline: none;
          color: #f1fff5;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.035);
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .login-input.password {
          padding-right: 50px;
        }

        .login-input::placeholder {
          color: #515a54;
        }

        .login-input:hover {
          border-color: rgba(94, 255, 141, 0.22);
        }

        .login-input:focus {
          border-color: #4dff82;
          background: rgba(77, 255, 130, 0.045);
          box-shadow: 0 0 0 4px rgba(77, 255, 130, 0.09);
        }

        .password-button {
          position: absolute;
          top: 50%;
          right: 10px;
          width: 35px;
          height: 35px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 10px;
          color: #717b74;
          cursor: pointer;
          transform: translateY(-50%);
          background: transparent;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .password-button:hover {
          color: #60ff90;
          background: rgba(77, 255, 130, 0.08);
        }

        .password-button svg {
          width: 19px;
          height: 19px;
        }

        .login-button {
          width: 100%;
          height: 53px;
          margin-top: 3px;
          border: none;
          border-radius: 14px;
          color: #031208;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          background: linear-gradient(
            135deg,
            #b4ffc8,
            #43ff79
          );
          box-shadow: 0 14px 34px rgba(55, 255, 111, 0.17);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 19px 40px rgba(55, 255, 111, 0.27);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .login-error {
          padding: 12px 14px;
          border: 1px solid rgba(255, 91, 91, 0.25);
          border-radius: 12px;
          color: #ffaaaa;
          font-size: 13px;
          background: rgba(255, 80, 80, 0.07);
          animation: errorAppear 0.25s ease;
        }

        @keyframes cardAppear {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes errorAppear {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glowMove {
          from {
            transform: translate(0, 0);
          }

          to {
            transform: translate(45px, 30px);
          }
        }

        @media (max-width: 500px) {
          .login-page {
            padding: 14px;
          }

          .login-card {
            padding: 28px 22px;
            border-radius: 20px;
          }

          .login-title {
            font-size: 28px;
          }
        }
      `}</style>

      <main className="login-page">
        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />

        <div className="login-card">
          <div className="login-top">
            <a
              href="/"
              className="login-back"
              aria-label="Повернутися на сайт"
              title="Повернутися на сайт"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M19 12H5M11 18L5 12L11 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            <div className="login-logo">DK.</div>
          </div>

          <h1 className="login-title">Адмінпанель</h1>

          <p className="login-description">
            Увійдіть у свій обліковий запис
          </p>

          <form className="login-form" onSubmit={submit}>
            <div className="login-field">
              <label htmlFor="username">Логін</label>

              <input
                id="username"
                className="login-input"
                type="text"
                placeholder="Введіть логін"
                value={form.username}
                onChange={(event) =>
                  setForm({
                    ...form,
                    username: event.target.value,
                  })
                }
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Пароль</label>

              <div className="login-input-wrapper">
                <input
                  id="password"
                  className="login-input password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введіть пароль"
                  value={form.password}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      password: event.target.value,
                    })
                  }
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  className="password-button"
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? 'Приховати пароль'
                      : 'Показати пароль'
                  }
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3L21 21M10.6 10.6A2 2 0 0 0 13.4 13.4M9.9 4.25A10.5 10.5 0 0 1 12 4C17.5 4 21 9.5 21 9.5C20.4 10.45 19.65 11.35 18.8 12.15M6.2 6.2C4.2 7.55 3 9.5 3 9.5C3 9.5 6.5 15 12 15C13 15 13.9 14.82 14.75 14.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 12C3 12 6.5 7 12 7C17.5 7 21 12 21 12C21 12 17.5 17 12 17C6.5 17 3 12 3 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="totp_code">2FA код</label>

              <input
                id="totp_code"
                className="login-input"
                inputMode="numeric"
                placeholder="Необов’язково, поки 2FA вимкнена"
                value={form.totp_code}
                onChange={(event) =>
                  setForm({
                    ...form,
                    totp_code: event.target.value,
                  })
                }
                autoComplete="one-time-code"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Входимо...' : 'Увійти'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
