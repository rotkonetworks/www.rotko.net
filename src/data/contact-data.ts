export const contactData = {
 hero: {
   title: "Contact",
   subtitle: "IRC preferred."
 },
 
 philosophy: {
   title: "Why IRC?",
   content: [
     "Every chat application since IRC has been a degradation. Slack? Bloated IRC with vendor lock-in. Discord? IRC with single client & tracking. Teams? No experience.",
     "IRC is text. IRC is simple. IRC has worked for 35+ years. It feels good not to have accounts too.",
     "Simplicity of protocol lets you join with 4 lines of commands into telnet."
   ]
 },
 
 connection: {
   title: "Connection Details",
   server: "irc.rotko.net",
   ports: "6667 (plain) / 6697 (TLS)",
   tor: "qiy42ysuvzqweciiprb6nzcblonlcdnlqasj5hsj2oicppmm5osvqvad.onion:6667",
   channel: "#rotko",
   webchat: "wss://irc.rotko.net/webirc"
 },
 
 encrypted: {
   title: "Encrypted",
   description: "For sensitive discussions:",
   matrix: "@tommi:matrix.rotko.net",
   note: "Signal available on request via IRC. We don't log encrypted channels."
 },
 
 rules: {
   title: "Channel Rules",
   subtitle: "Keep it civil or the bots will handle you.",
   items: [
     "Be direct. We're engineers, not therapists.",
     "Technical questions get technical answers.",
     "No spam. Our bots are less forgiving than we are.",
     "English only. Not because we're monolingual, but because logs need to be searchable.",
     "Paste code somewhere else. Nobody wants to see your 500 line stack trace.",
   ]
 },
 
 expectations: {
   title: "What to Expect",
   items: [
     "Real engineers, not sales",
     "Direct answers, not marketing",
     "Response times vary - we're global",
     "If we can't help, we'll say so",
     "No data harvesting, no CRM, no follow-up emails"
   ]
 },
 
 services: {
   title: "What We Can Help With",
   items: [
     "Global high availability RPC endpoints",
     "Validator operations",
     "Custom software in Rust/Go",
     "Linux infrastructure consulting",
     "ISP-level network consulting",
     "AI/LLM hosting on real hardware",
     "Telling you why your current setup is broken"
   ]
 }
}
