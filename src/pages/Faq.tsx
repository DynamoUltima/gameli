import React, { useEffect, useState } from 'react';
import { ArrowLeft, HelpCircle, Mail, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fetchFaqs, DEFAULT_FAQS, type Faq as FaqItem } from '@/lib/faqService';

const Faq = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFaqs();
        if (data.length > 0) {
          setFaqs(data);
        } else {
          // No FAQs configured yet — show the built-in defaults.
          setFaqs(DEFAULT_FAQS.map((f, i) => ({ id: `default-${i}`, ...f })));
        }
      } catch (err) {
        console.error('Error loading FAQs:', err);
        setFaqs(DEFAULT_FAQS.map((f, i) => ({ id: `default-${i}`, ...f })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white text-slate-900 font-['Inter'] antialiased selection:bg-slate-200 overflow-x-hidden min-h-screen">
      {/* Navbar Area */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6 sm:px-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="St. Gamaliel's Hospital Logo" className="w-8 h-8 object-contain rounded-full shadow-sm" />
          <span className="text-lg font-semibold tracking-tight hidden sm:inline">St. Gamaliel's Hospital</span>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-16 px-6 sm:px-12 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-xs font-semibold tracking-wide uppercase mb-6">
          <HelpCircle className="w-3 h-3" />
          Help Center
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Answers to the most common questions about booking, payments, rescheduling, and consultations at St. Gamaliel's Hospital.
        </p>
      </header>

      {/* Main Content */}
      <main className="px-6 sm:px-12 max-w-4xl mx-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm font-medium">Loading FAQs...</span>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-slate-100">
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline py-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-sm pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <section className="mt-12 p-8 rounded-[2rem] bg-slate-900 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold m-0">Still have questions?</h2>
          </div>
          <p className="text-white/70 text-sm mb-6 max-w-md">
            Our team is happy to help. Reach out and we'll get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:0533675498"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Call 0533-675-498
            </a>
            <a
              href="mailto:info@gamaliel.hospital"
              className="inline-flex items-center justify-center px-6 py-3 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Email Us
            </a>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Faq;
