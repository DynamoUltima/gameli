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
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const { user } = useAuth();
  const { role } = useUserRole(user?.uid);
  const navigate = useNavigate();

  // Fetch active campaign
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const { data, error } = await supabase
          .from('awareness_campaigns')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (data && !error) {
          let validCampaign = null;
          const today = new Date();
          // Reset time to start of day for accurate day-to-day comparison
          today.setHours(0, 0, 0, 0);

          for (const campaign of data) {
            const startDate = new Date(campaign.scheduled_date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);

            if (campaign.duration_unit === 'days') endDate.setDate(endDate.getDate() + campaign.duration);
            if (campaign.duration_unit === 'weeks') endDate.setDate(endDate.getDate() + campaign.duration * 7);
            if (campaign.duration_unit === 'months') endDate.setMonth(endDate.getMonth() + campaign.duration);
            
            if (today >= startDate && today <= endDate) {
              validCampaign = campaign;
              break;
            }
          }
          setActiveCampaign(validCampaign);
        } else {
          setActiveCampaign(null);
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
      }
    };
    fetchCampaign();
  }, []);

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
        activeCampaign={activeCampaign}
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
