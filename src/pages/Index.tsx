import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Hospital, Home, Heart, Headphones, Users, DollarSign, Facebook, Twitter, Github } from "lucide-react";
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 ">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center transform rotate-45">
              <Heart className="w-6 h-6 text-primary -rotate-45" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-[hsl(222,47%,11%)]"> St Gameliel's Hospital</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {/* <Link to="/" className="text-[hsl(222,47%,11%)] hover:text-primary transition-colors font-medium">
              Home
            </Link> */}
            {/* <Link to="/dashboard/patient" className="text-[hsl(222,47%,11%)] hover:text-primary transition-colors font-medium">
              My Appointments
            </Link> */}
            {/* <Link to="/doctors" className="text-[hsl(222,47%,11%)] hover:text-primary transition-colors font-medium">
              Doctors
            </Link> */}
            {/* <Link to="/contact" className="text-[hsl(222,47%,11%)] hover:text-primary transition-colors font-medium">
              Contact Us
            </Link> */}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!loading && (
              user ? (
                <Button 
                  onClick={() => navigate(getDashboardPath())}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    asChild 
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Link to="/auth?mode=signup">Sign Up</Link>
                  </Button>
                  <Button 
                    asChild
                    variant="outline"
                    className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Link to="/auth">Login</Link>
                  </Button>
                </>
              )
            )}
        </div>
        </div>
      </header>

      {/* Carousel Banner */}
      <section className="w-full py-8 md:py-12 bg-white">
        <div className="container px-4 md:px-6">
          <Carousel className="w-full mx-auto">
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
                            {/* <Button 
                              variant={slide.buttonVariant}
                              className="mt-4 bg-primary hover:bg-primary/90 text-white"
                              asChild
                            >
                              <Link to={slide.buttonLink}>
                                {slide.buttonText}
                              </Link>
                            </Button> */}
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-[hsl(222,47%,11%)] leading-tight">
              Quality Healthcare,<br />Your Way
          </h1>
            <p className="text-xl text-gray-600">
              Book your appointment online, at the hospital, or from the comfort of your home.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="/doctor.jpg" 
                alt="Professional medical doctor in surgical attire" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Consultation Type */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[hsl(222,47%,11%)] mb-3">
              Choose Your Consultation Type
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Online Consultation */}
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-[hsl(222,47%,11%)]">Online Consultation</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Convenient virtual care from anywhere.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  asChild 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  <Link to="/auth?redirect=/book/online">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* In-Person Hospital Visit */}
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Hospital className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-[hsl(222,47%,11%)]">In-Person Hospital Visit</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Access to our full facilities and direct care.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <Button 
                  asChild 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                  <Link to="/auth?redirect=/book/hospital">Book Now</Link>
              </Button>
              </CardContent>
            </Card>

            {/* Home Visit */}
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Home className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-[hsl(222,47%,11%)]">Home Visit</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Personalized care for those who prefer staying at home.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <Button 
                asChild 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                  <Link to="/auth?redirect=/book/home">Book Now</Link>
              </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Care You Can Trust */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-[hsl(222,47%,11%)] mb-4">
              Care You Can Trust
            </h2>
            <p className="text-lg text-gray-600">
              We are committed to providing the best care possible with our team of dedicated professionals.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* 24/7 Support */}
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Headphones className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-[hsl(222,47%,11%)]">24/7 Support</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Our support team is always available to assist you with your needs.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Experienced Doctors */}
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-[hsl(222,47%,11%)]">Experienced Doctors</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Consult with our board-certified and highly experienced medical staff.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Affordable Care */}
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow bg-white">
            <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
              </div>
                <CardTitle className="text-2xl text-[hsl(222,47%,11%)]">Affordable Care</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Transparent and affordable pricing for all our consultation services.
              </CardDescription>
            </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Services */}
            <div>
              <h3 className="text-[hsl(222,47%,11%)] font-bold text-lg mb-4">SERVICES</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/book/online" className="text-gray-600 hover:text-primary transition-colors">
                    Online Consultation
                  </Link>
                </li>
                <li>
                  <Link to="/book/hospital" className="text-gray-600 hover:text-primary transition-colors">
                    Hospital Visit
                  </Link>
                </li>
                <li>
                  <Link to="/book/home" className="text-gray-600 hover:text-primary transition-colors">
                    Home Visit
                  </Link>
                </li>
                <li>
                  <Link to="/doctors" className="text-gray-600 hover:text-primary transition-colors">
                    Find a Doctor
                  </Link>
                </li>
              </ul>
              </div>

            {/* About */}
            <div>
              <h3 className="text-[hsl(222,47%,11%)] font-bold text-lg mb-4">ABOUT</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-gray-600 hover:text-primary transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-gray-600 hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
              </div>

            {/* Legal */}
            <div>
              <h3 className="text-[hsl(222,47%,11%)] font-bold text-lg mb-4">LEGAL</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-gray-600 hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-600 hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-[hsl(222,47%,11%)] font-bold text-lg mb-4">CONTACT</h3>
              <ul className="space-y-2 text-gray-600">
                <li>123 Health St, Medtown</li>
                <li>contact@gamelishospital.com</li>
                <li>(123) 456-7890</li>
              </ul>
            </div>
        </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600">
              &copy; 2025 Gameli's Hospital. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              {/* <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
