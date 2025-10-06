export interface WirssiChatProps {
 server?: string
 channel?: string
 nick?: string
 position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
 onClose?: () => void
}

export interface ChatBox {
 id: string
 type: 'channel' | 'query'
 messages: Array<{time: string, from: string | null, text: string}>
 minimized: boolean
 showUsers?: boolean
 historyLoaded?: boolean
 lastHistoryTime?: number
}

export type Users = {[channel: string]: {[nick: string]: string}}
