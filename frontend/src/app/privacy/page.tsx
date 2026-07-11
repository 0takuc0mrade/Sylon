"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="font-sans text-brand-dark min-h-screen flex flex-col relative overflow-x-hidden bg-[#faf9f7] dark:bg-[#121212]">
      {/* Background styling similar to the rest of the app */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-brand-lightbrown/10 to-transparent blur-[100px] opacity-70" />
      </div>

      <main className="flex-grow flex flex-col max-w-4xl mx-auto w-full pt-24 px-4 sm:px-8 pb-32 z-10 relative animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-brand-dark/60 dark:text-white/60 hover:text-brand-brown transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-lightbrown/20 text-brand-brown mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-brand-dark dark:text-white leading-tight">
            Morlen doesn't read your life.
          </h1>
          <p className="text-xl sm:text-2xl text-brand-dark/70 dark:text-white/70 max-w-3xl mx-auto font-medium leading-relaxed">
            We are building an Operating Intelligence, not a surveillance tool. You remain in total control of the data we analyze.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-brand-dark/10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-brand-lightbrown/10 flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-6 h-6 text-brand-brown" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">We look for business signals. Not personal secrets.</h3>
                <p className="text-lg text-brand-dark/80 dark:text-white/80 leading-relaxed mb-6">
                  Morlen is designed to look for hard business evidence—like product requests, orders, payments, and follow-ups—to help you run your business. Personal conversations are ignored or excluded based on your settings.
                </p>
                <div className="bg-white/40 dark:bg-black/20 rounded-2xl p-6 border border-brand-dark/5 dark:border-white/5">
                  <h4 className="font-bold text-brand-dark dark:text-white mb-4">What we classify as "Business Confidence":</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-brand-dark/80 dark:text-white/80"><span className="text-green-500 font-bold">✓</span> Prices (e.g. ₦15,000)</li>
                    <li className="flex items-center gap-3 text-brand-dark/80 dark:text-white/80"><span className="text-green-500 font-bold">✓</span> Product inquiries ("Available?", "How much?")</li>
                    <li className="flex items-center gap-3 text-brand-dark/80 dark:text-white/80"><span className="text-green-500 font-bold">✓</span> Delivery and dispatch coordination</li>
                    <li className="flex items-center gap-3 text-brand-dark/80 dark:text-white/80"><span className="text-green-500 font-bold">✓</span> Invoices and payment confirmations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-brand-dark/10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-brand-lightbrown/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-brand-brown" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">You have the final say. Always.</h3>
                <p className="text-lg text-brand-dark/80 dark:text-white/80 leading-relaxed mb-6">
                  Some business owners mix personal and business chats in the same WhatsApp account. Because no AI classifier is perfect, we design Morlen with conservative defaults and safeguards.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-brand-brown flex-shrink-0" />
                    <p className="text-brand-dark/80 dark:text-white/80"><strong>Total Visibility:</strong> We show you exactly which conversations are being included in our Business Health Scans.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-brand-brown flex-shrink-0" />
                    <p className="text-brand-dark/80 dark:text-white/80"><strong>Manual Exclusions:</strong> You can easily exclude contacts or reclassify a conversation if Morlen gets it wrong.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-brand-brown flex-shrink-0" />
                    <p className="text-brand-dark/80 dark:text-white/80"><strong>Conservative Defaults:</strong> We default to <em>not</em> using conversations when our confidence score is low.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href="/upload" className="text-white bg-brand-brown px-10 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all inline-block">
            Understood
          </Link>
        </div>
      </main>
    </div>
  );
}
