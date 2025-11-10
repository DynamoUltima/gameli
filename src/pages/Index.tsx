import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Hospital, Home, Calendar, Shield, Clock, LogIn, LayoutDashboard, ArrowRight, ArrowLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const { role } = useUserRole(user?.id);
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const getDashboardPath = () => {
    if (role === 'doctor') return '/dashboard/doctor';
    if (role === 'admin') return '/dashboard/admin';
    return '/dashboard/patient';
  };

  // Fetch active awareness campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from('awareness_campaigns')
          .select('*')
          .eq('status', 'active')
          .order('scheduled_date', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Banner slides data with images - fallback if no campaigns
  const defaultBannerSlides = [
    {
      title: "Expert Medical Care",
      description: "Book appointments with top healthcare professionals from the comfort of your home.",
      image: "/images/banners/medical-team.jpg",
      overlay: "bg-black/40",
      textColor: "text-white",
      buttonVariant: "default" as const,
      buttonText: "Book Now",
      buttonLink: "/book/consultation"
    },
    // {
    //   title: "24/7 Virtual Consultations",
    //   description: "Get medical advice anytime, anywhere with our secure online consultation service.",
    //   image: "/images/banners/virtual-consult.jpg",
    //   overlay: "bg-primary/60",
    //   textColor: "text-white",
    //   buttonVariant: "secondary" as const,
    //   buttonText: "Start Consultation",
    //   buttonLink: "/book/virtual"
    // },
    // {
    //   title: "Comprehensive Health Services",
    //   description: "From general check-ups to specialized treatments, we've got you covered.",
    //   image: "/images/banners/healthcare-services.jpg",
    //   overlay: "bg-secondary/60",
    //   textColor: "text-secondary-foreground",
    //   buttonVariant: "default" as const,
    //   buttonText: "Our Services",
    //   buttonLink: "/services"
    // }
  ];

  // Transform campaigns into banner slide format
  const campaignSlides = campaigns.map(campaign => ({
    title: campaign.title,
    description: campaign.subtitle || "Learn more about this campaign",
    image: campaign.image_url || "/images/banners/default-campaign.jpg",
    overlay: "bg-black/50",
    textColor: "text-white",
    buttonVariant: "default" as const,
    buttonText: "Learn More",
    buttonLink: "/book/consultation"
  }));

  // Combine campaigns with default slides (campaigns first)
  const bannerSlides = loadingCampaigns ? defaultBannerSlides : [...campaignSlides, ...defaultBannerSlides];

  return (
    <div className="min-h-screen bg-background">
      {/* Carousel Banner */}
      <section className="w-full py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <Carousel className="w-full  mx-auto">
            <CarouselContent>
              {bannerSlides.map((slide, index) => (
                <CarouselItem key={`slide-${index}`}>
                  <div className="p-1">
                    <Card className="border-0 overflow-hidden">
                      <div 
                        className="relative w-full aspect-video md:aspect-[3/1] bg-cover bg-center bg-gray-100"
                        style={{ backgroundImage: `url(${slide.image})` }}
                      >
                        <div className={`absolute inset-0 ${slide.overlay}`}></div>
                        <CardContent className="flex flex-col items-center justify-center h-full p-6 relative z-10">
                          <div className="text-center max-w-3xl mx-auto">
                            <h2 className={`text-2xl md:text-4xl font-bold mb-4 ${slide.textColor}`}>
                              {slide.title}
                            </h2>
                            <p className={`${slide.textColor} mb-6 text-sm md:text-base`}>
                              {slide.description}
                            </p>
                            <Button 
                              variant={slide.buttonVariant}
                              className="mt-4"
                              asChild
                            >
                              <Link to={slide.buttonLink}>
                                {slide.buttonText}
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:left-4" />
            <CarouselNext className="right-2 md:right-4" />
          </Carousel>
        </div>
      </section>

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-end">
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            <span className="text-primary">Gameli Patient Portal</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Book appointments online, visit our hospital, or get care at home. 
            Expert medical consultation tailored to your needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-success" />
              <span>Secure & Confidential</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5 text-warning" />
              <span>24/7 Availability</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Easy Scheduling</span>
            </div>
          </div>
        </div>
      </section>

      {/* Login/Dashboard Section */}
      <section className="container mx-auto px-4 pb-8">
        <div className="text-center">
          {!loading && (
            user ? (
              <Button 
                size="lg" 
                onClick={() => navigate(getDashboardPath())}
                className="gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                Go to Dashboard
              </Button>
            ) : (
              <Button 
                asChild 
                size="lg" 
                className="gap-2"
              >
                <Link to="/auth">
                  <LogIn className="w-5 h-5" />
                  Login / Register
                </Link>
              </Button>
            )
          )}
        </div>
      </section>

      {/* Appointment Types */}
      <section className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Choose Your Appointment Type</h2>
          <p className="text-muted-foreground">Select the consultation method that works best for you</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Online Consultation */}
          <Card className="border-2 hover:border-medical-primary transition-all duration-300 hover:shadow-lg hover:shadow-medical-primary/20">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-medical-primary/10 flex items-center justify-center mb-4">
                <Video className="w-7 h-7 text-medical-primary" />
              </div>
              <CardTitle className="text-2xl">Online Consultation</CardTitle>
              <CardDescription className="text-base">
                Video call with our specialists from anywhere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Instant confirmation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Choose your time slot
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Gynecology & Fertility clinics
                </li>
              </ul>

              <Button asChild className="w-full bg-gradient-to-r from-medical-primary to-medical-accent hover:from-medical-accent hover:to-medical-primary" size="lg">
                <Link to="/auth?redirect=/book/online">Book Online Visit</Link>
              </Button>
            </CardContent>
          </Card>

          {/* In-Person Visit */}
          <Card className="border-2 hover:border-medical-primary transition-all duration-300 hover:shadow-lg hover:shadow-medical-primary/20">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-medical-primary/10 flex items-center justify-center mb-4">
                <Hospital className="w-7 h-7 text-medical-primary" />
              </div>
              <CardTitle className="text-2xl">Hospital Visit</CardTitle>
              <CardDescription className="text-base">
                Visit our hospital for in-person consultation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Phone confirmation required
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  All clinics available
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Comprehensive care
                </li>
              </ul>

              <Button asChild variant="outline" className="w-full border-medical-primary/50 text-medical-primary hover:bg-medical-primary hover:text-white" size="lg">
                <Link to="/auth?redirect=/book/hospital">Book Hospital Visit</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Home Visit */}
          <Card className="border-2 hover:border-medical-primary transition-all duration-300 hover:shadow-lg hover:shadow-medical-primary/20">
            <CardHeader>
              <div className="w-14 h-14 rounded-full bg-medical-primary/10 flex items-center justify-center mb-4">
                <Home className="w-7 h-7 text-medical-primary" />
              </div>
              <CardTitle className="text-2xl">Home Visit</CardTitle>
              <CardDescription className="text-base">
                Get medical care in the comfort of your home
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Location verification needed
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Admin will call to confirm
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  Convenient & comfortable
                </li>
              </ul>

              <Button asChild variant="outline" className="w-full border-medical-primary/50 text-medical-primary hover:bg-medical-primary hover:text-white" size="lg">
                <Link to="/auth?redirect=/book/home">Book Home Visit</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">&copy; 2025 Gameli Patient Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
