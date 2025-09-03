export const parseIrcMessage = (line: string) => {
 if (line.startsWith('PING')) return { type: 'PING', data: line.slice(4) }
 
 const patterns = {
   privmsg: /^:([^!]+)![^ ]+ PRIVMSG ([^ ]+) :(.*)$/,
   topic: /^:[^ ]+ (331|332) [^ ]+ ([^ ]+) :?(.*)$/,
   topicChange: /^:([^!]+)![^ ]+ TOPIC ([^ ]+) :(.*)$/,
   join: /^:([^!]+)![^ ]+ JOIN :?(.+)$/,
   part: /^:([^!]+)![^ ]+ PART ([^ ]+)(.*)$/,
   quit: /^:([^!]+)![^ ]+ QUIT :?(.*)$/,
   nick: /^:([^!]+)![^ ]+ NICK :?(.+)$/,
   names: /^:[^ ]+ 353 [^ ]+ . ([^ ]+) :(.+)$/,
   mode: /^:([^!]+)![^ ]+ MODE ([^ ]+) ([+-][ov]) (.+)$/
 }
 
 for (const [type, pattern] of Object.entries(patterns)) {
   const match = line.match(pattern)
   if (match) return { type, match }
 }
 
 return null
}

export const formatMessage = (
 timestamp: number, 
 nick: string | null, 
 message: string
) => {
 const time = new Date(timestamp * 1000).toTimeString().slice(0, 5)
 let from = nick
 let text = message
 
 if (message.startsWith('***')) {
   from = null
   text = message.replace(/^\*\*\* /, '')
 }
 
 return { time, from, text }
}

export const parseNickList = (nicks: string, currentNick: string) => {
 const nickMap: {[nick: string]: string} = {}
 nicks.split(' ').forEach(n => {
   if (n.startsWith('@')) {
     const cleanNick = n.slice(1)
     if (cleanNick !== currentNick) nickMap[cleanNick] = '@'
   } else if (n.startsWith('+')) {
     const cleanNick = n.slice(1)
     if (cleanNick !== currentNick) nickMap[cleanNick] = '+'
   } else if (n && n !== currentNick) {
     nickMap[n] = ''
   }
 })
 return nickMap
}
