import React from 'react';
import { ArrowLeft, Scale, BookOpen, AlertCircle, ShieldCheck, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LandingFooter } from '@/components/landing/LandingFooter';

const TermsOfService = () => {
  const navigate = useNavigate();

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
          <Scale className="w-3 h-3" />
          Legal Agreement
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          Terms of Service
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Please read these terms carefully before using our services. By using St. Gamaliel's Hospital facilities or digital platforms, you agree to follow the rules and guidelines outlined here.
        </p>
        <div className="mt-8 flex items-center gap-4 text-sm text-slate-400 font-medium pb-8 border-b border-slate-100">
          <span>Last Updated: April 7, 2026</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>Version 1.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 sm:px-12 max-w-4xl mx-auto pb-24">
        <div className="prose prose-slate max-w-none">
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">1. Services Provided</h2>
            </div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              St. Gamaliel's Hospital provides medical services, online appointment booking, and patient records management through its digital portal. Our services are provided "as is" and "as available."
            </p>
            <p className="text-slate-600 leading-relaxed">
              While we strive for excellence, we reserve the right to modify, suspend, or discontinue any part of our digital services at any time without prior notice.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">2. Medical Disclaimer</h2>
            </div>
            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-900">
              <p className="text-sm font-medium leading-relaxed">
                <strong>IMPORTANT:</strong> The content on our website is for informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </div>
            <p className="mt-4 text-slate-600 leading-relaxed">
              If you think you may have a medical emergency, call your doctor or emergency services immediately. Reliance on any information provided by St. Gamaliel's Hospital in a digital context is solely at your own risk.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">3. User Responsibility</h2>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              As a user of our services, you agree to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Provide accurate and complete personal information.",
                "Maintain the confidentiality of your account credentials.",
                "Notify us immediately of any unauthorized use of your account.",
                "Avoid any activity that might interfere with the platform's security."
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-center p-4 rounded-xl bg-slate-50 border border-slate-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></div>
                  <span className="text-sm text-slate-600 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">4. Limitation of Liability</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              To the fullest extent permitted by law, St. Gamaliel's Hospital shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our digital services.
            </p>
          </section>

          <section className="mb-12 p-8 rounded-[2rem] bg-slate-900 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold m-0">Questions about these terms?</h2>
            </div>
            <p className="text-white/70 text-sm mb-6 max-w-md">
              Our legal team is available to clarify any part of this agreement. Feel free to reach out via email for further information.
            </p>
            <a 
              href="mailto:legal@gamaliel.hospital"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Contact Legal Office
            </a>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default TermsOfService;
