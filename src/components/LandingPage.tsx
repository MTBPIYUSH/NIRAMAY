import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Users, 
  HardHat, 
  MapPin, 
  Award, 
  Recycle, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Leaf,
  Shield,
  Zap,
  Heart,
  Globe,
  Github,
  Linkedin,
  Mail,
  Phone,
  ChevronDown
} from 'lucide-react';
import { ScrollVelocityDemo } from './ui/testimonials';
import { FeatureStepsDemo } from './ui/feature-steps-demo';
import { RolesByCpu } from './ui/roles-by-cpu';
import { BorderBeam } from './ui/border-beam';
import { BorderBeamDemo } from './ui/border-beam-demo';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { number: '70%', label: 'of Indian waste is not properly collected' },
    { number: '1M+', label: 'Citizens can be empowered through Niramay' },
    { number: '24hrs', label: 'Average cleanup response time' },
    { number: '100%', label: 'Transparency in waste management' }
  ];

  // Features are now defined in the RolesByCpu component

  // Testimonials array removed

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with parallax effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-green-50 via-orange-50 to-blue-50"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-pulse" />
          <div className="absolute top-40 right-20 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse delay-1000" />
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-blue-200 rounded-full opacity-20 animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Banner */}
          <div className="flex items-center justify-center mb-4">
            <div className="px-6 py-2 bg-green-100 rounded-full text-green-800 text-sm font-medium flex items-center gap-2">
              <Leaf className="w-4 h-4" /> Transforming Waste into a Cleaner India with AI
            </div>
          </div>

          {/* Main Hindi Text */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-2">
              <span className="text-orange-600">स्वच्छ</span>{" "}
              <span className="text-gray-900">भारत,</span>
            </h1>
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-green-600">स्वस्थ</span>{" "}
              <span className="text-gray-900">भविष्य</span>
            </h1>
          </div>

          {/* English Subtitle */}
          <h2 className="text-2xl md:text-3xl text-gray-700 font-medium mb-8">
            Clean India, Healthy Future
          </h2>

          {/* Mission Statement */}
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Empowering Indian citizens, municipal workers, and technology to build sustainable cities. Join the digital revolution in waste management supporting the Swachh Bharat Mission.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <div className="relative">
              <button
                onClick={onGetStarted}
                className="group flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Camera size={24} className="mr-3" />
                Report Waste Now
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <BorderBeam size={250} duration={8} colorFrom="#22c55e" colorTo="#10b981" />
            </div>
            
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="flex items-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-2xl border-2 border-gray-200 hover:border-green-500 hover:text-green-600 transition-all duration-300"
            >
              Learn How It Works
              <ChevronDown size={20} className="ml-2" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown size={32} className="text-gray-400" />
        </div>
      </section>

      {/* About Niramay */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 text-center">
              About <span className="text-green-600">Niramay</span>
            </h3>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed text-center max-w-3xl mx-auto">
              Niramay is an AI-powered civic platform that lets Indian citizens report garbage in real-time and enables local authorities to resolve issues efficiently — building cleaner, greener cities across India.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="text-green-600" size={32} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-lg mb-1">AI-Powered</div>
                  <div className="text-sm text-gray-600">Smart waste detection</div>
                </div>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="text-orange-600" size={32} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-lg mb-1">Community-Driven</div>
                  <div className="text-sm text-gray-600">Citizen participation</div>
                </div>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="text-blue-600" size={32} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-lg mb-1">Pan-India</div>
                  <div className="text-sm text-gray-600">Scalable solution</div>
                </div>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Award className="text-purple-600" size={32} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-lg mb-1">Rewarding</div>
                  <div className="text-sm text-gray-600">Eco-points system</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Border Beam Demo Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <BorderBeamDemo 
              videoSrc="/videos/swachh-bharat.mp4" 
              posterSrc="/images/cleanup1.jpg"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Journey */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              From Click to Clean in <span className="text-green-600">4 Simple Steps</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the seamless journey from waste reporting to cleanup completion
            </p>
          </div>
          
          {/* Import the FeatureStepsDemo component */}
          <div className="mt-8">
            <FeatureStepsDemo />
          </div>
        </div>
      </section>

      {/* Features by Role - Using CPU Architecture */}
      <section className="bg-white">
        <RolesByCpu 
          title="Features by Role" 
          subtitle="Tailored experiences for every stakeholder in the waste management ecosystem" 
          initialRole="citizen" 
        />
      </section>

      {/* Why Niramay */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Why <span className="text-green-600">Niramay</span>?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The impact and unique selling propositions that make Niramay the future of waste management
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
                    <TrendingUp className="text-red-600" size={32} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-600">70%</div>
                    <div className="text-gray-600">of Indian waste is not properly collected</div>
                  </div>
                </div>
                <p className="text-gray-600">
                  Current waste management systems are inefficient and lack citizen participation. Niramay bridges this gap with technology.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                    <Award className="text-green-600" size={32} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">100%</div>
                    <div className="text-gray-600">Transparency in waste management</div>
                  </div>
                </div>
                <p className="text-gray-600">
                  Niramay rewards citizens for civic participation and ensures complete transparency in the cleanup process.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Leaf, title: 'Clean India Vision', desc: 'Supporting Swachh Bharat Abhiyan', color: 'bg-green-100 text-green-600' },
                { icon: Award, title: 'Eco Points', desc: 'Gamified reward system', color: 'bg-yellow-100 text-yellow-600' },
                { icon: MapPin, title: 'Real-time Tracking', desc: 'Live location monitoring', color: 'bg-blue-100 text-blue-600' },
                { icon: Zap, title: 'AI Optimization', desc: 'Smart task assignment', color: 'bg-purple-100 text-purple-600' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon size={24} />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Image Scroll Gallery */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Our <span className="text-green-600">Impact</span> in Pictures
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how we're transforming communities through waste management initiatives
            </p>
          </div>

          {/* Image Scroll Gallery */}
          <div>
            <ScrollVelocityDemo />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-emerald-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your City?
          </h3>
          <p className="text-xl text-green-100 mb-12 max-w-2xl mx-auto">
            Join thousands of citizens, municipal workers, and administrators who are building cleaner, smarter cities with Niramay.
          </p>
          <div className="relative inline-block">
            <button
              onClick={onGetStarted}
              className="group flex items-center mx-auto px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Camera size={24} className="mr-3" />
              Start Your Journey
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <BorderBeam size={300} duration={10} colorFrom="#ffffff" colorTo="#22c55e" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                  <Leaf className="text-white" size={24} />
                </div>
                <h4 className="text-2xl font-bold">Niramay</h4>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Transforming waste management in India through AI-powered civic engagement and community participation.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-400">
                  <span className="mr-2">🇮🇳</span>
                  Made in India with
                  <Heart size={16} className="mx-1 text-red-500" />
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h5 className="text-lg font-semibold mb-4">Platform</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h5 className="text-lg font-semibold mb-4">Connect</h5>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Mail size={16} className="mr-2" />
                  <a href="mailto:hello@niramay.in" className="hover:text-white transition-colors">hello@niramay.in</a>
                </li>
                <li className="flex items-center">
                  <Phone size={16} className="mr-2" />
                  <span>+91 98765 43210</span>
                </li>
              </ul>
              
              <div className="flex space-x-4 mt-6">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Linkedin size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Github size={20} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Niramay. All rights reserved. Supporting Swachh Bharat Mission.
            </p>
            <p className="text-gray-400 text-sm mt-4 md:mt-0">
              Built for hackathons and a cleaner India 🌱
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};