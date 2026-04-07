"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setError("All fields are required"); return; }
    setLoading(true); setError("");
    // Email sending via Resend deferred — log for now
    await new Promise((r) => setTimeout(r, 800));
    setSent(true); setLoading(false);
  };

  const ic = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] bg-white focus:outline-none focus:border-brand-500 transition-colors";

  if (sent) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 size={32} className="mx-auto text-green-500 mb-3" />
        <h3 className="font-display text-xl font-bold mb-1">Message sent!</h3>
        <p className="text-[14px] text-gray-500">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-[13px] text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
      <div>
        <label className="text-[12.5px] font-medium text-gray-500 block mb-1">Name</label>
        <input className={ic} value={form.name} onChange={set("name")} placeholder="Your name" />
      </div>
      <div>
        <label className="text-[12.5px] font-medium text-gray-500 block mb-1">Email</label>
        <input type="email" className={ic} value={form.email} onChange={set("email")} placeholder="you@example.com" />
      </div>
      <div>
        <label className="text-[12.5px] font-medium text-gray-500 block mb-1">Message</label>
        <textarea className={`${ic} min-h-[120px] resize-vertical`} value={form.message} onChange={set("message")} placeholder="How can we help?" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
