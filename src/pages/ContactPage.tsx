import { Component, createSignal, Show } from 'solid-js'
import MainLayout from '../layouts/MainLayout'
import { contactData } from '../data/contact-data'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

const ContactPage: Component = () => {
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [message, setMessage] = createSignal('')
  const [company, setCompany] = createSignal('') // honeypot
  const [status, setStatus] = createSignal<Status>('idle')
  const [error, setError] = createSignal('')

  const fail = (msg: string) => {
    setStatus('error')
    setError(msg)
  }

  const submit = async (e: Event) => {
    e.preventDefault()
    if (!emailOk(email())) return fail('Please enter a valid email so we can reply.')
    if (message().trim().length < 3) return fail('Add a short message.')
    setStatus('sending')
    setError('')
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name().trim(),
          email: email().trim(),
          message: message().trim(),
          company: company(),
        }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        throw new Error(body.error || `Something went wrong (${r.status}).`)
      }
      setStatus('sent')
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Network error. Please try again.')
    }
  }

  const fieldClass =
    'w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-600 transition-colors outline-none'

  return (
    <MainLayout>
      <section class="pt-12 pb-16 px-4 max-w-3xl mx-auto">
        {/* Header */}
        <div class="text-xs uppercase tracking-[0.22em] text-cyan-400/80 mb-3">
          {contactData.hero.eyebrow}
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {contactData.hero.title}
        </h1>
        <p class="text-lg text-gray-300 mt-5 leading-relaxed">
          {contactData.hero.subtitle}
        </p>

        {/* Booking option */}
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={contactData.booking.url}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md border border-cyan-600/60 text-cyan-300 hover:bg-cyan-600/10 transition-colors"
          >
            <span class="i-mdi-calendar-clock" /> {contactData.booking.label}
          </a>
          <span class="text-gray-500 text-sm">{contactData.booking.note}</span>
        </div>

        {/* Form / success */}
        <div class="mt-10">
          <Show
            when={status() !== 'sent'}
            fallback={
              <div class="rounded-xl border border-gray-800 border-l-2 border-l-cyan-600/70 bg-gray-900/40 p-6">
                <p class="text-white font-semibold flex items-center gap-2">
                  <span class="i-mdi-check-circle text-cyan-400" /> Message sent.
                </p>
                <p class="text-gray-400 text-sm mt-2">
                  Thanks — it's on its way. We'll reply to the address you gave.
                </p>
              </div>
            }
          >
            <form class="space-y-4" onSubmit={submit}>
              <div>
                <label class="block text-sm text-gray-400 mb-1" for="c-name">
                  Name <span class="text-gray-600">(optional)</span>
                </label>
                <input
                  id="c-name"
                  class={fieldClass}
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  autocomplete="name"
                />
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-1" for="c-email">Email</label>
                <input
                  id="c-email"
                  class={fieldClass}
                  type="email"
                  required
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  autocomplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label class="block text-sm text-gray-400 mb-1" for="c-msg">Message</label>
                <textarea
                  id="c-msg"
                  class={fieldClass}
                  rows="6"
                  required
                  value={message()}
                  onInput={(e) => setMessage(e.currentTarget.value)}
                  placeholder="What are you working on? Chains, regions, SLA…"
                />
              </div>

              {/* honeypot — hidden from people; bots fill it and get silently dropped */}
              <input
                class="absolute left-[-9999px] w-px h-px opacity-0"
                tabindex="-1"
                autocomplete="off"
                aria-hidden="true"
                name="company"
                value={company()}
                onInput={(e) => setCompany(e.currentTarget.value)}
              />

              <Show when={status() === 'error'}>
                <p class="text-sm text-red-400">{error()}</p>
              </Show>

              <button
                type="submit"
                disabled={status() === 'sending'}
                class="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                {status() === 'sending' ? 'Sending…' : 'Send →'}
              </button>
            </form>
          </Show>
        </div>
      </section>
    </MainLayout>
  )
}

export default ContactPage
