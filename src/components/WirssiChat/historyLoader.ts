export const loadChannelHistory = async (
 channel: string,
 messageSet: Set<string>
) => {
 try {
   const response = await fetch(
     `https://ircstore.rotko.net/api/logs/${encodeURIComponent(channel)}?limit=50`
   )
   
   if (!response.ok) {
     console.log('History not available for', channel)
     return null
   }
   
   const logs = await response.json()
   
   if (!logs.length) return null
   
   // Filter out JOIN/PART/QUIT messages
   const messages = logs
     .filter(event => {
       // Skip pure JOIN/PART/QUIT messages
       if (event.message === 'JOIN' || 
           event.message === 'PART' || 
           event.message === 'QUIT' ||
           event.message.startsWith('*** ') && (
             event.message.includes(' joined') ||
             event.message.includes(' left') ||
             event.message.includes(' quit')
           )) {
         return false
       }
       return true
     })
     .map(event => {
       const msgKey = `${event.timestamp}-${event.nick}-${event.message}`
       messageSet.add(msgKey)
       
       const time = new Date(event.timestamp * 1000).toTimeString().slice(0, 5)
       let from = event.nick
       let text = event.message
       
       // Handle topic and other server messages
       if (event.message.startsWith('*** ')) {
         from = null
         text = event.message.replace(/^\*\*\* /, '')
       }
       
       return { time, from, text }
     })
   
   return {
     messages,
     lastTimestamp: logs[logs.length - 1]?.timestamp
   }
 } catch (err) {
   console.log('Failed to load history:', err)
   return null
 }
}

export const connectHistoryStream = (
 onMessage: (event: any) => void
) => {
 try {
   const histSocket = new WebSocket('wss://ircstore.rotko.net/ws')
   
   histSocket.onopen = () => {
     console.log('Connected to ircstore history')
   }
   
   histSocket.onmessage = (e) => {
     try {
       const event = JSON.parse(e.data)
       
       // Skip JOIN/PART/QUIT from history stream too
       if (event.message === 'JOIN' || 
           event.message === 'PART' || 
           event.message === 'QUIT' ||
           event.message.startsWith('*** ') && (
             event.message.includes(' joined') ||
             event.message.includes(' left') ||
             event.message.includes(' quit')
           )) {
         return
       }
       
       onMessage(event)
     } catch (err) {
       console.error('Failed to parse history:', err)
     }
   }
   
   histSocket.onerror = () => {
     console.log('ircstore history not available')
   }
   
   return histSocket
 } catch (err) {
   console.log('ircstore history connection failed:', err)
   return null
 }
}
