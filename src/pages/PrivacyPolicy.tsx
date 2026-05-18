import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LandingFooter } from '@/components/landing/LandingFooter';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white text-slate-900 font-['Inter'] antialiased selection:bg-slate-200 overflow-x-hidden min-h-screen">
      {/* Navbar Area - Simple for legal page */}
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
          <Shield className="w-3 h-3" />
          Privacy & Trust
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          Privacy Policy
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          At St. Gamaliel's Hospital, your privacy is our priority. We are committed to protecting your personal and medical information through secure systems and transparent practices.
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
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">Introduction</h2>
            </div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              This Privacy Policy describes how St. Gamaliel's Hospital ("we," "our," or "us") collects, uses, and shares your personal information when you visit our website, use our patient portal, or receive services at our facility.
            </p>
            <p className="text-slate-600 leading-relaxed">
              By accessing our services, you agree to the practices described in this policy. We adhere to all local and international health data privacy regulations, including GDPR and HIPAA-aligned standards for data protection.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">Information We Collect</h2>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              We collect information that helps us provide you with high-quality medical care and improve your experience.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100/50">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Direct Information</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    Identity data (name, date of birth, gender)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    Contact details (phone, email, address)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    Medical history and health records
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100/50">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Technical Data</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    IP address and device information
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    Browsing history on our platform
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    Interaction with our digital forms
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">Data Security</h2>
            </div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We implement industry-standard security measures to protect your data from unauthorized access, alteration, or destruction. This includes:
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Encryption</h4>
                  <p className="text-sm text-slate-500">All data transmitted between your device and our servers is encrypted using SSL/TLS protocols.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Access Control</h4>
                  <p className="text-sm text-slate-500">Access to patient medical records is strictly restricted to authorized medical personnel on a need-to-know basis.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12 p-8 rounded-[2rem] bg-slate-900 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold m-0">Need any help?</h2>
            </div>
            <p className="text-white/70 text-sm mb-6 max-w-md">
              If you have any questions about this Privacy Policy or how we handle your data, please don't hesitate to contact our data protection office.
            </p>
            <a 
              href="mailto:privacy@gamaliel.hospital"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Contact Support
            </a>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default PrivacyPolicy;
