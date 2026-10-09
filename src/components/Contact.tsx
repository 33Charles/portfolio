import { useState, type FormEvent } from "react";
import { Mail, Phone, Send, MessageCircle } from "lucide-react";
import emailjs from "@emailjs/browser";

export default function Contact() {
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSending) return;

    const form = e.currentTarget;
    setIsSending(true);
    setStatus(null);

    try {
      await emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        form,
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        },
      );

      setStatus({
        type: "success",
        message: "Message sent successfully! I'll get back to you soon.",
      });

      form.reset();
    } catch (error) {
      console.error("EmailJS submission failed:", error);

      setStatus({
        type: "error",
        message:
          "Sorry, your message could not be sent. Please try again or email me directly.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative mx-auto w-full max-w-7xl px-2 py-24"
    >
      {/* Section heading */}
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-phos" />
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-phos">
          Get in touch
        </span>
      </div>

      <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Let's start a <span className="text-phos">conversation.</span>
      </h2>

      <p className="mt-4 max-w-xl text-sm leading-7 text-mute sm:text-base">
        Have an opportunity, a project idea, or a question? Feel free to reach
        out. I'd be happy to hear from you.
      </p>

      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        {/* Contact details */}
        <div className="space-y-8">
          <div>
            <h3 className="my-5 text-lg font-medium text-ink">
              Contact information
            </h3>

            <div className="space-y-5">
              <a
                href="mailto:kamaucharles6884@gmail.com"
                className="group flex items-start gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-bg text-phos transition-colors group-hover:border-phos/40">
                  <Mail size={19} />
                </span>

                <span className="pt-0.5">
                  <span className="block text-xs text-mute">Email</span>
                  <span className="mt-1 block text-sm text-ink transition-colors group-hover:text-phos">
                    kamaucharles6884@gmail.com.com
                  </span>
                </span>
              </a>

              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-bg text-phos">
                  <Phone size={19} />
                </span>

                <span className="pt-0.5">
                  <span className="block text-xs text-mute">Phone</span>
                  <a
                    href="tel:+254717542259"
                    className="mt-1 block text-sm text-ink transition-colors hover:text-phos"
                  >
                    +254 717 542 259
                  </a>
                </span>
              </div>

              <a
                href={`https://wa.me/254717542259?text=${encodeURIComponent(
                  "Hi Charles, I came across your portfolio and would like to get in touch.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-bg text-phos transition-colors group-hover:border-phos/50">
                  <MessageCircle size={19} />
                </span>

                <span className="pt-0.5">
                  <span className="block text-xs text-mute">WhatsApp</span>
                  <span className="mt-1 block text-sm text-ink transition-colors group-hover:text-phos">
                    Chat with me
                  </span>
                </span>
              </a>
            </div>
          </div>

          <div className="border-t border-line pt-6">
            <p className="mb-4 text-xs uppercase tracking-widest text-mute">
              Find me online
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                { name: "GitHub", href: "https://github.com/33Charles" },
                {
                  name: "LinkedIn",
                  href: "https://www.linkedin.com/in/charles-mwangi-852b9b2a9/",
                },
                {
                  name: "TryHackMe",
                  href: "https://tryhackme.com/p/D4SEIN",
                },
                {
                  name: "Hack The Box",
                  href: "https://app.hackthebox.com/users/1691258",
                },
              ].map((profile) => (
                <a
                  key={profile.name}
                  href={profile.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-line px-3 py-2 text-xs text-mute transition-colors hover:border-phos/40 hover:text-phos"
                >
                  {profile.name}
                  <span className="ml-1.5" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-line bg-bg/60 p-5 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contact-name"
                className="mb-2 block text-sm text-ink"
              >
                Your name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                required
                className="w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-mute/60 focus:border-phos"
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="mb-2 block text-sm text-ink"
              >
                Email address
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="john@example.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-mute/60 focus:border-phos"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-subject"
              className="mb-2 block text-sm text-ink"
            >
              Subject
            </label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              placeholder="What would you like to discuss?"
              required
              className="w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-mute/60 focus:border-phos"
            />
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="mb-2 block text-sm text-ink"
            >
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              placeholder="Write your message here..."
              required
              className="w-full resize-y rounded-lg border border-line bg-transparent px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-mute/60 focus:border-phos"
            />
          </div>

          <button
  type="submit"
  disabled={isSending}
  className="inline-flex items-center gap-2 rounded-lg bg-phos px-5 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isSending ? "Sending..." : "Send message"}
  <Send size={15} />
</button>

{status && (
  <p
    role="status"
    aria-live="polite"
    className={`text-xs leading-5 ${
      status.type === "success" ? "text-phos" : "text-red-400"
    }`}
  >
    {status.message}
  </p>)}

        </form>
      </div>
    </section>
  );
}
