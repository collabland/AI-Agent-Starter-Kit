'use client'

import { useEffect } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramLoginProps {
  botName: string
  onAuth?: (user: TelegramUser) => void
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: boolean
}

export default function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 20,
  requestAccess = true,
}: TelegramLoginProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    script.setAttribute('data-radius', cornerRadius.toString())
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-userpic', 'false')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.async = true

    // @ts-expect-error window.onTelegramAuth is not typed
    window.onTelegramAuth = (user: TelegramUser) => {
      if (onAuth) {
        onAuth(user)
      }
    }

    const container = document.getElementById('telegram-login-button')
    container?.appendChild(script)

    return () => {
      container?.removeChild(script)
    }
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess])

  return <div id="telegram-login-button" />
} 