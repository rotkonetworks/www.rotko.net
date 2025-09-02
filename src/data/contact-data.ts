export const contactData = {
 hero: {
   title: "Contact",
   subtitle: "IRC preferred. Matrix for the paranoid. Signal if you insist."
 },
 
 philosophy: {
   title: "Why IRC?",
   content: [
     "Every chat application since IRC has been a degradation. Slack? Bloated IRC with vendor lock-in. Discord? IRC with tracking. Teams? Don't get us started.",
     "IRC is text. IRC is simple. IRC has worked for 35+ years. No accounts, no tracking, no BS.",
     "We run our own server because depending on others is how you end up with Teams."
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
   title: "Encrypted Options",
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
     "We use AI moderation. It's smarter than most trolls."
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
     "RPC endpoints that actually work",
     "Validator operations without the drama",
     "Custom software in Rust/Go",
     "Linux infrastructure consulting",
     "AI/LLM hosting on real hardware",
     "Telling you why your current setup is broken"
   ]
 }
}
