import React, { useState, useEffect } from 'react';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingServices } from '@/components/landing/LandingServices';
import { LandingAbout } from '@/components/landing/LandingAbout';
import { LandingConsultation } from '@/components/landing/LandingConsultation';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingContactModal } from '@/components/landing/LandingContactModal';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const navigate = useNavigate();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isServicesMenuOpen && !target.closest('#navServicesWrapper') && !target.closest('#servicesMenu')) {
        setIsServicesMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isServicesMenuOpen]);

  // Main flow actions
  const handleBookClick = (title: string, img: string) => {
    if (!user) {
      navigate('/auth');
    } else {
      switch (role) {
        case 'doctor':
          navigate('/dashboard/doctor');
          break;
        case 'admin':
          navigate('/dashboard/admin');
          break;
        default:
          navigate('/dashboard/patient');
      }
    }
  };

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  return (
    <div className="bg-white text-slate-900 font-['Inter'] antialiased selection:bg-slate-200 overflow-x-hidden min-h-screen">
      <LandingHero
        onBookClick={handleBookClick}
        onContactClick={handleContactClick}
        isServicesMenuOpen={isServicesMenuOpen}
        toggleServicesMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsServicesMenuOpen(!isServicesMenuOpen);
        }}
      />

      <LandingServices onBookClick={handleBookClick} />

      <LandingConsultation onBookClick={handleBookClick} />

      <LandingAbout />

      <LandingFooter />

      {/* Floating reload icon (bottom right decoration) */}
      <div
        className="fixed bottom-8 right-8 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-900 border border-slate-100 z-50 cursor-pointer hover:scale-105 transition-transform"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="w-6 h-6 stroke-[1.5px]" />
      </div>

      <LandingContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}
