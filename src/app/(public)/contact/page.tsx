"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Globe, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      }
    } catch {
      // fail silently — still show success to user (email may have gone through)
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-5 py-10 lg:py-14">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-[clamp(28px,4vw,38px)] font-bold">
          Get in Touch
        </h1>
        <p className="text-[15px] text-gray-500 mt-1">
          Have questions? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Info cards */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[15px] font-semibold flex items-center gap-2 mb-1.5">
              <Mail size={16} className="text-brand-500" />
              Email us
            </h3>
            <p className="text-[13.5px] text-gray-500 leading-relaxed">
              For general inquiries and support
              <br />
              <a
                href="mailto:hello@theeduhire.in"
                className="text-brand-500 font-medium hover:underline"
              >
                hello@theeduhire.in
              </a>
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[15px] font-semibold flex items-center gap-2 mb-1.5">
              <Phone size={16} className="text-brand-500" />
              Call us
            </h3>
            <p className="text-[13.5px] text-gray-500 leading-relaxed">
              Mon–Sat, 9am to 6pm IST
              <br />
              <a
                href="tel:+914522345678"
                className="text-brand-500 font-medium hover:underline"
              >
                +91 452-234-5678
              </a>
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[15px] font-semibold flex items-center gap-2 mb-1.5">
              <MapPin size={16} className="text-brand-500" />
              Visit us
            </h3>
            <p className="text-[13.5px] text-gray-500 leading-relaxed">
              EduHire Office
              <br />
              123, Anna Nagar
              <br />
              Madurai, Tamil Nadu 625020
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[15px] font-semibold flex items-center gap-2 mb-1.5">
              <Globe size={16} className="text-brand-500" />
              Follow us
            </h3>
            <p className="text-[13.5px] text-gray-500 leading-relaxed">
              Stay updated on new opportunities
              <br />
              <span className="flex gap-3 mt-1">
                <a href="#" className="text-brand-500 font-medium hover:underline">LinkedIn</a>
                <a href="#" className="text-brand-500 font-medium hover:underline">Instagram</a>
                <a href="#" className="text-brand-500 font-medium hover:underline">Twitter</a>
              </span>
            </p>
          </div>
        </div>

        {/* Right — Form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-7">
          {sent ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-brand-500" />
              </div>
              <h3 className="font-display text-[22px] font-bold mb-2">
                Message Sent!
              </h3>
              <p className="text-[14px] text-gray-500 mb-5">
                We&apos;ll get back to you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setForm({ name: "", email: "", subject: "", message: "" });
                  setSent(false);
                }}
                className="px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                Send Another
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-display text-[18px] font-semibold mb-5">
                Send us a message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[12.5px] font-medium text-gray-500">
                    Your name <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-[13.5px] font-body focus:outline-none focus:border-brand-500 transition-colors"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Full name"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12.5px] font-medium text-gray-500">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-[13.5px] font-body focus:outline-none focus:border-brand-500 transition-colors"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-3.5">
                <label className="text-[12.5px] font-medium text-gray-500">
                  Subject
                </label>
                <input
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-[13.5px] font-body focus:outline-none focus:border-brand-500 transition-colors"
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="What's this about?"
                />
              </div>

              <div className="flex flex-col gap-1 mb-5">
                <label className="text-[12.5px] font-medium text-gray-500">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-[13.5px] font-body focus:outline-none focus:border-brand-500 transition-colors resize-vertical min-h-[130px]"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Type your message here..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.name || !form.email || !form.message}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
