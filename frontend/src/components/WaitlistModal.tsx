"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, Check, Shirt, Sparkles, Utensils, Smartphone, Pill, Sofa, 
  ShoppingBag, Store, MessageCircle, Camera, Share2, MapPin, 
  CheckCircle2, Box, CreditCard, Users, Truck, ArrowRight, Loader2, Hash 
} from "lucide-react";

type WaitlistModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    whatsapp: "",
    category: "",
    channels: [] as string[],
    challenge: "",
    volume: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const handleNext = async () => {
    if (step === 5) {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.position) setPosition(data.position);
        setStep(6);
      } catch (err) {
        console.error(err);
        setStep(6);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel) 
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const categories = [
    { name: 'Fashion', icon: <Shirt className="w-5 h-5 mb-2" /> },
    { name: 'Beauty', icon: <Sparkles className="w-5 h-5 mb-2" /> },
    { name: 'Food', icon: <Utensils className="w-5 h-5 mb-2" /> },
    { name: 'Electronics', icon: <Smartphone className="w-5 h-5 mb-2" /> },
    { name: 'Pharmacy', icon: <Pill className="w-5 h-5 mb-2" /> },
    { name: 'Furniture', icon: <Sofa className="w-5 h-5 mb-2" /> },
    { name: 'Other', icon: <ShoppingBag className="w-5 h-5 mb-2" /> }
  ];

  const channelIcons: Record<string, any> = {
    'WhatsApp': <MessageCircle className="w-5 h-5 text-green-500" />,
    'Instagram': <Camera className="w-5 h-5 text-pink-500" />,
    'Facebook': <Share2 className="w-5 h-5 text-blue-500" />,
    'Google Business': <MapPin className="w-5 h-5 text-red-500" />,
    'TikTok': <Hash className="w-5 h-5 text-black dark:text-white" />
  };

  const challengeIcons: Record<string, any> = {
    'Replying DMs': <MessageCircle className="w-5 h-5" />,
    'Taking orders manually': <Box className="w-5 h-5" />,
    'Confirming payments': <CreditCard className="w-5 h-5" />,
    'Negotiating prices': <Users className="w-5 h-5" />,
    'Tracking delivery': <Truck className="w-5 h-5" />
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Background glow effects - Optimized for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="absolute w-[500px] h-[500px] bg-brand-brown/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#111111]/95 backdrop-blur-xl border border-white/20 dark:border-white/10 flex flex-col rounded-[2rem] shadow-2xl overflow-hidden z-10 animate-in fade-in duration-300 ring-1 ring-brand-brown/10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-brand-dark/5 dark:border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-brown/10 flex items-center justify-center">
                <Store className="w-4 h-4 text-brand-brown" />
             </div>
            <h2 className="text-xl font-bold text-brand-dark dark:text-white">
              {step === 6 ? "Welcome to Morlen" : "Join the Waitlist"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-brand-dark/5 dark:hover:bg-white/10 transition-colors text-brand-dark/40 hover:text-brand-dark dark:text-white/40 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar (Hidden on success) */}
        {step < 6 && (
          <div className="w-full h-1.5 bg-brand-dark/5 dark:bg-white/5 shrink-0 relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-brand-brown transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,90,43,0.5)]"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex flex-col grow">
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="flex-grow flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-500">
              <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-1">Let's get started</h3>
              <p className="text-brand-dark/60 dark:text-white/60 text-sm mb-2">Tell us a bit about yourself and your business.</p>
              
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1.5 transition-colors group-focus-within:text-brand-brown">Name</label>
                  <input type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:bg-transparent focus:ring-2 focus:ring-brand-brown focus:border-brand-brown outline-none transition-all placeholder:text-brand-dark/30 dark:placeholder:text-white/30"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1.5 transition-colors group-focus-within:text-brand-brown">Business Name</label>
                  <input type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:bg-transparent focus:ring-2 focus:ring-brand-brown focus:border-brand-brown outline-none transition-all placeholder:text-brand-dark/30 dark:placeholder:text-white/30"
                    placeholder="Morlen Cafe"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1.5 transition-colors group-focus-within:text-brand-brown">Email</label>
                  <input type="email" 
                    className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:bg-transparent focus:ring-2 focus:ring-brand-brown focus:border-brand-brown outline-none transition-all placeholder:text-brand-dark/30 dark:placeholder:text-white/30"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1.5 transition-colors group-focus-within:text-brand-brown">WhatsApp Number</label>
                  <input type="tel" 
                    className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:bg-transparent focus:ring-2 focus:ring-brand-brown focus:border-brand-brown outline-none transition-all placeholder:text-brand-dark/30 dark:placeholder:text-white/30"
                    placeholder="+234 800 000 0000"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div className="flex-grow flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-500">
              <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">Your Industry</h3>
              <p className="text-brand-dark/60 dark:text-white/60 text-sm mb-4">What best describes your business?</p>
              
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setFormData({...formData, category: cat.name});
                      setTimeout(() => setStep(3), 300);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                      formData.category === cat.name 
                        ? 'border-brand-brown bg-brand-brown/10 text-brand-brown shadow-[0_0_15px_rgba(139,90,43,0.2)]' 
                        : 'border-brand-dark/10 dark:border-white/10 hover:border-brand-dark/30 dark:hover:border-white/30 text-brand-dark/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {cat.icon}
                    <span className="text-xs font-bold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Channels */}
          {step === 3 && (
            <div className="flex-grow flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-500">
              <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">Sales Channels</h3>
              <p className="text-brand-dark/60 dark:text-white/60 text-sm mb-4">Where do your customers find you?</p>
              
              <div className="space-y-3">
                {['WhatsApp', 'Instagram', 'Facebook', 'Google Business', 'TikTok'].map((channel) => (
                  <button
                    key={channel}
                    onClick={() => toggleChannel(channel)}
                    className={`w-full px-5 py-4 rounded-2xl border flex items-center justify-between transition-all duration-300 hover:scale-[1.02] ${
                      formData.channels.includes(channel)
                        ? 'border-brand-brown bg-brand-brown/10 shadow-[0_0_15px_rgba(139,90,43,0.15)]' 
                        : 'border-brand-dark/10 dark:border-white/10 hover:border-brand-dark/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {channelIcons[channel] || <Store className="w-5 h-5 text-brand-dark/50" />}
                      <span className={`font-bold ${formData.channels.includes(channel) ? 'text-brand-brown' : 'text-brand-dark/80 dark:text-white/80'}`}>{channel}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      formData.channels.includes(channel) 
                        ? 'bg-brand-brown border-brand-brown text-white' 
                        : 'border-brand-dark/20 dark:border-white/20'
                    }`}>
                      {formData.channels.includes(channel) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Challenge */}
          {step === 4 && (
            <div className="flex-grow flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-500">
              <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">Biggest Challenge</h3>
              <p className="text-brand-dark/60 dark:text-white/60 text-sm mb-4">What drains most of your time?</p>
              
              <div className="space-y-3">
                {[
                  'Replying DMs',
                  'Taking orders manually',
                  'Confirming payments',
                  'Negotiating prices',
                  'Tracking delivery'
                ].map((challenge) => (
                  <button
                    key={challenge}
                    onClick={() => {
                      setFormData({...formData, challenge});
                      setTimeout(() => setStep(5), 300);
                    }}
                    className={`w-full px-5 py-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] ${
                      formData.challenge === challenge
                        ? 'border-brand-brown bg-brand-brown/10 text-brand-brown shadow-[0_0_15px_rgba(139,90,43,0.15)]' 
                        : 'border-brand-dark/10 dark:border-white/10 hover:border-brand-dark/30 dark:hover:border-white/30 text-brand-dark/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={formData.challenge === challenge ? "text-brand-brown" : "text-brand-dark/50 dark:text-white/50"}>
                      {challengeIcons[challenge]}
                    </div>
                    <span className="font-bold text-left">{challenge}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Volume */}
          {step === 5 && (
            <div className="flex-grow flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-500">
              <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-2">Message Volume</h3>
              <p className="text-brand-dark/60 dark:text-white/60 text-sm mb-4">How many customer messages do you get daily?</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Under 50',
                  '50 - 200',
                  '200 - 500',
                  '500+'
                ].map((volume) => (
                  <button
                    key={volume}
                    onClick={() => setFormData({...formData, volume})}
                    className={`px-4 py-5 rounded-2xl border text-center font-bold text-lg transition-all duration-300 hover:scale-105 ${
                      formData.volume === volume
                        ? 'border-brand-brown bg-brand-brown/10 text-brand-brown shadow-[0_0_15px_rgba(139,90,43,0.15)]' 
                        : 'border-brand-dark/10 dark:border-white/10 hover:border-brand-dark/30 dark:hover:border-white/30 text-brand-dark/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {volume}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 animate-in zoom-in-95 duration-700 py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-brown/30 rounded-full blur-xl animate-pulse" />
                <div className="w-24 h-24 bg-brand-brown/20 rounded-full flex items-center justify-center relative border-4 border-white dark:border-[#111111] shadow-xl">
                  <CheckCircle2 className="w-12 h-12 text-brand-brown" />
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-black text-brand-dark dark:text-white mb-3 tracking-tight">You're on the list.</h3>
                <p className="text-brand-dark/70 dark:text-white/70 max-w-sm mx-auto leading-relaxed">
                  We're excited to have you onboard. You'll be among the first businesses invited for Early Access to Morlen.
                </p>
              </div>
              
              {position && (
                <div className="bg-brand-brown/5 dark:bg-white/5 rounded-3xl p-8 w-full max-w-xs border border-brand-brown/20 dark:border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-brown/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
                  <div className="text-xs font-bold text-brand-dark/50 dark:text-white/50 uppercase tracking-widest mb-2">Your Position</div>
                  <div className="text-6xl font-black text-brand-brown tracking-tighter relative">
                    #{position}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Navigation */}
          {step < 6 && (
            <div className="mt-8 pt-6 border-t border-brand-dark/5 dark:border-white/5 flex items-center justify-between">
              {step > 1 ? (
                <button 
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 font-bold text-brand-dark/50 dark:text-white/50 hover:text-brand-dark dark:hover:text-white transition-colors"
                >
                  Back
                </button>
              ) : <div />}
              
              <button 
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (step === 1 && (!formData.name || !formData.email)) ||
                  (step === 2 && !formData.category) ||
                  (step === 3 && formData.channels.length === 0) ||
                  (step === 4 && !formData.challenge) ||
                  (step === 5 && !formData.volume)
                }
                className="group px-8 py-3 bg-brand-brown text-white font-bold rounded-2xl hover:bg-brand-brown/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-brand-brown/30 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {step === 5 ? "Join Waitlist" : "Continue"}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          )}
          
          {step === 6 && (
            <div className="mt-8 w-full animate-in fade-in duration-1000 delay-300">
              <button 
                onClick={onClose}
                className="w-full px-6 py-4 bg-brand-dark dark:bg-white text-white dark:text-brand-dark font-bold rounded-2xl hover:scale-[1.02] transition-all shadow-xl"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
