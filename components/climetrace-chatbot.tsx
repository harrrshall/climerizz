"use client";

import React, { useState, useRef, RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, Calendar, Mail, Linkedin, MessageSquare, MapPin, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/react"


const ClimerizzWebsite = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);



  const homeRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const blogsRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  const navItems = [
    { name: 'Home', ref: homeRef },
    { name: 'Services', ref: servicesRef },
    { name: 'Blogs', ref: blogsRef },
    { name: 'About', ref: aboutRef },
    { name: 'Contact', ref: contactRef },
  ];

  const blogPosts = [
    {
      title: "Understanding Social Safeguards in Carbon Credits",
      excerpt: "Explore how social safeguards protect local communities and ensure sustainable development in carbon credit projects.",
      category: "Social Impact",
      date: "Mar 15, 2024",
      readTime: "5 min read",
      likes: 124,
      comments: 35,
      image: "/api/placeholder/800/400"
    },
    {
      title: "Best Practices for Community Engagement",
      excerpt: "Learn effective strategies for engaging local communities in carbon credit projects and ensuring lasting positive impact.",
      category: "Community",
      date: "Mar 12, 2024",
      readTime: "4 min read",
      likes: 98,
      comments: 27,
      image: "/api/placeholder/800/400"
    },
    {
      title: "The Future of Carbon Credit Verification",
      excerpt: "Discover how technology and new standards are shaping the future of carbon credit verification and compliance.",
      category: "Technology",
      date: "Mar 10, 2024",
      readTime: "6 min read",
      likes: 156,
      comments: 42,
      image: "/api/placeholder/800/400"
    }
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/submit-contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEmailSubmitting(true);
    setStatus('');
    try {
      const response = await fetch('/api/subscribe-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        const data = await response.json();
        setStatus(`error:${data.error}`);
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      setStatus('error:An unexpected error occurred');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const scrollToSection = (elementRef: RefObject<HTMLElement>, section: string) => {
    if (elementRef.current) {
      window.scrollTo({
        top: elementRef.current.offsetTop - 80,
        behavior: 'smooth'
      });
      setActiveSection(section);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header and Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 transition-all duration-300 shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">C</span>
              </div>
              <span className="font-extrabold text-3xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">

                climerizz
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  onClick={() => scrollToSection(item.ref, item.name.toLowerCase())}
                  className={`text-gray-700 hover:text-emerald-600 cursor-pointer transition-colors duration-200 relative group text-lg ${activeSection === item.name.toLowerCase() ? 'text-emerald-600 font-semibold' : ''
                    }`}
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-200 group-hover:w-full"></span>
                </a>
              ))}
            </nav>

            {/* ChatBot Button */}
            <Link href="/chatbot">
              <Button
                className="hidden md:flex bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-full px-6 py-2"
              >
                Open ChatBot
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white shadow-lg"
            >
              <nav className="container mx-auto px-6 py-6 flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    onClick={() => scrollToSection(item.ref, item.name.toLowerCase())}
                    className={`text-gray-700 hover:text-emerald-600 cursor-pointer transition-colors duration-200 text-lg ${activeSection === item.name.toLowerCase() ? 'text-emerald-600 font-semibold' : ''
                      }`}
                  >
                    {item.name}
                  </a>
                ))}
                <Link href="/chatbot">
                  <Button
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg rounded-full w-full"
                  >
                    Open ChatBot
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="pt-24">
        {/* Home Section */}
        {/* Custom SVG Pattern Background */}
        <svg className="hidden">
          <defs>
            <pattern id="leaf-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 2C14 2 10 6 10 12C10 18 14 22 20 22C26 22 30 18 30 12C30 6 26 2 20 2Z"
                fill="currentColor" opacity="0.1" />
            </pattern>
          </defs>
        </svg>

        {/* Home Section */}
        <section
          ref={homeRef}
          className="relative min-h-screen flex items-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(147, 197, 253, 0.05) 100%)'
          }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 pattern-leaf opacity-10"></div>
            <div
              className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-emerald-50 to-transparent opacity-40"
              style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 100% 0)' }}
            ></div>
            <div
              className="absolute left-0 bottom-0 w-1/2 h-full bg-gradient-to-t from-emerald-50 to-transparent opacity-40"
              style={{ clipPath: 'polygon(0 100%, 100% 100%, 0 0)' }}
            ></div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-24 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="text-left space-y-8">
                <div className="inline-block px-4 py-2 bg-emerald-50 rounded-full">
                  <span className="text-emerald-600 font-semibold">Trusted by Industry Leaders</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
                  Ensure Your Carbon Credits Meet{' '}
                  <span className="relative">
                    <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Social Safeguard Requirements
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-3 bg-emerald-200 opacity-30 z-0"></span>
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Carbon projects often overlook their impact on local communities. Before investing in carbon credits,
                  take the extra step to ensure compliance with social and environmental safeguards mandated by ICVCM
                  and local governments.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/chatbot">
                    <Button
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-4 text-lg flex items-center justify-center w-full sm:w-auto"
                    >
                      Start Chat
                      <ChevronDown className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => scrollToSection(contactRef, 'contact')}
                    className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-all duration-300 rounded-full px-8 py-4 text-lg flex items-center justify-center w-full sm:w-auto"
                  >
                    Contact Us
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="pt-8 border-t border-gray-200">
                  <div className="flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Verified Projects</p>
                        <p className="text-sm text-gray-600">100+ Projects</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Communities Served</p>
                        <p className="text-sm text-gray-600">50+ Communities</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Decorative SVG */}
              <div className="hidden md:block">
                <svg viewBox="0 0 400 400" className="w-full max-w-lg mx-auto">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.6 }} />
                      <stop offset="100%" style={{ stopColor: '#14B8A6', stopOpacity: 0.6 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="200" cy="200" r="180" fill="url(#grad1)" opacity="0.1" />
                  <circle cx="200" cy="200" r="150" fill="url(#grad1)" opacity="0.2" />
                  <circle cx="200" cy="200" r="120" fill="url(#grad1)" opacity="0.3" />
                  <path d="M200,50 Q350,200 200,350 Q50,200 200,50"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    opacity="0.6" />
                  <circle cx="200" cy="50" r="10" fill="#10B981" />
                  <circle cx="200" cy="350" r="10" fill="#14B8A6" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        {/* Services Section */}
        <section ref={servicesRef} className="relative bg-white py-24 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-emerald-50 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-teal-50 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-2 bg-emerald-50 rounded-full mb-4">
                <span className="text-emerald-600 font-semibold">Our Expert Services</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                Ensure Social Safeguards in Your{' '}
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Carbon Credit Projects
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-3 bg-emerald-200 opacity-30 z-0"></span>
                </span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                As experts in social, environmental, and legal safeguards, we ensure your carbon credit projects
                meet the highest standards of community engagement and sustainable development.
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: (
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Safeguard Assessment',
                  description: 'Comprehensive evaluation of social and environmental impacts ensuring compliance with ICVCM standards.',
                  features: ['Risk Assessment', 'Community Impact Analysis', 'Compliance Review']
                },
                {
                  icon: (
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: 'Community Engagement',
                  description: 'Facilitate meaningful dialogue between project developers and local communities.',
                  features: ['Stakeholder Consultation', 'Benefit Sharing Plans', 'Grievance Mechanisms']
                },
                {
                  icon: (
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Verification Services',
                  description: 'Independent verification of social safeguard implementation and effectiveness.',
                  features: ['Documentation Review', 'Field Verification', 'Compliance Certification']
                }
              ].map((service, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-b from-white to-gray-50">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        {service.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">{service.title}</h3>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                    </div>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-600">
                          <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <div className="relative">
              <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-3xl font-bold mb-4">Ready to Ensure Compliance?</h3>
                      <p className="text-emerald-50 text-lg mb-6">
                        Let us help you navigate the complexities of social safeguards in carbon credit projects.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/chatbot">
                          <Button
                            className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-3 text-lg w-full sm:w-auto"
                          >
                            Get Started
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-3 text-lg w-full sm:w-auto"
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                    {/* Decorative Element */}
                    <div className="hidden md:block relative">
                      <svg viewBox="0 0 200 200" className="w-full max-w-sm mx-auto">
                        <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.1" />
                        <circle cx="100" cy="100" r="60" fill="white" fillOpacity="0.1" />
                        <circle cx="100" cy="100" r="40" fill="white" fillOpacity="0.1" />
                        <path d="M100,20 Q180,100 100,180 Q20,100 100,20"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          opacity="0.6" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Blogs Section */}
        <section ref={blogsRef} className="bg-gradient-to-b from-gray-50 to-white py-24 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 font-semibold mb-4">
                Latest Insights
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Stay Informed with Our{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Latest Articles
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-3 bg-emerald-200 opacity-30 z-0"></span>
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore our latest insights on carbon credits, social safeguards, and sustainable development.
              </p>
            </div>

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {blogPosts.map((post, index) => (
                <Card key={index} className="group bg-white hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden transform hover:-translate-y-2">
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        width={200}
                        height={200}
                        className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      {post.date}
                      <span className="mx-2">•</span>
                      {post.readTime}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
                      {post.title}
                    </CardTitle>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-gray-500 text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {post.comments}
                        </span>
                      </div>
                      <Share2 className="h-4 w-4 hover:text-emerald-600 cursor-pointer" />
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button
                      variant="ghost"
                      className="w-full group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all duration-300"
                    >
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Button
                variant="outline"
                className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold hover:scale-105 transform"
              >
                View All Articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section ref={aboutRef} className="bg-white py-24">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">About <span className="text-emerald-600">
              climerizz</span></h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">

              climerizz is dedicated to ensuring that carbon credit projects uphold the highest standards of social and environmental safeguards. Our mission is to create a more sustainable and equitable future for all, leveraging expertise and technology to drive positive change in the carbon credit industry.
            </p>
            <div className="flex justify-center space-x-6">
              <Button onClick={() => window.open('https://www.linkedin.com/in/palak27sharma/', '_blank')} className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-3 text-lg">
                Know the Founder
              </Button>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-300 rounded-full px-8 py-3 text-lg">Learn More</Button>
            </div>
          </div>
        </section>

        <section ref={contactRef} className="relative bg-gradient-to-b from-gray-50 to-white py-24 overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 font-semibold mb-4">
                Contact Us
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Let&apos;s Start a{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Conversation
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-3 bg-emerald-200 opacity-30 z-0"></span>
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Have questions about social safeguards in carbon credits? We&apos;re here to help you navigate the complexities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Contact Form Card */}
              <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8">
                  <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
                    <MessageSquare className="h-8 w-8" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your Name"
                          className="pl-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl h-12"
                          required
                        />
                        <span className="absolute left-4 top-3.5 text-gray-400">👤</span>
                      </div>
                      <div className="relative">
                        <Input
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Your Email"
                          type="email"
                          className="pl-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl h-12"
                          required
                        />
                        <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Your Message"
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl resize-none"
                      rows={5}
                      required
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                    {submitStatus === 'success' && (
                      <p className="text-green-600 text-center">Message sent successfully!</p>
                    )}
                    {submitStatus === 'error' && (
                      <p className="text-red-600 text-center">Error sending message. Please try again.</p>
                    )}
                  </form>
                </CardContent>
              </Card>


              {/* Contact Info Card */}
              <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8">
                  <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
                    <MapPin className="h-8 w-8" />
                    Connect With Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* LinkedIn */}
                    <a
                      href="https://www.linkedin.com/in/palak27sharma/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Linkedin className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">LinkedIn</h4>
                        <p className="text-blue-600 hover:underline">Palak Sharma</p>
                      </div>
                    </a>

                    {/* Email */}
                    <a
                      href="mailto:contact@climerizz.com"
                      className="flex items-center gap-6 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300"
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Email</h4>
                        <p className="text-emerald-600">contact@climerizz.com</p>
                      </div>
                    </a>

                    {/* Calendar */}
                    <a
                      href="https://calendly.com/contact-climerizz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300"
                    >
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Schedule a Meeting</h4>
                        <p className="text-teal-600 hover:underline">Book a time slot</p>
                      </div>
                    </a>

                    {/* Response Time */}
                    <div className="flex items-center gap-6 p-4 rounded-xl bg-gray-50">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Quick Response</h4>
                        <p className="text-gray-600">Within 24 hours</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
                <span className="font-extrabold text-2xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">

                  climerizz

                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Ensuring carbon credits meet social safeguard requirements through expert guidance and innovative solutions.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.linkedin.com/in/palak27sharma/"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center hover:from-emerald-600 hover:to-teal-600 transition-all duration-300">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="mailto:contact@climerizz.com"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center hover:from-emerald-600 hover:to-teal-600 transition-all duration-300">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="https://calendly.com/contact-climerizz"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center hover:from-emerald-600 hover:to-teal-600 transition-all duration-300">
                  <Calendar className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-emerald-400">Quick Links</h3>
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    onClick={() => scrollToSection(item.ref, item.name.toLowerCase())}
                    className="text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors duration-200 text-sm"
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-emerald-400">Our Services</h3>
              <ul className="space-y-4 text-sm">
                <li className="text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors duration-200">
                  Social Safeguard Assessment
                </li>
                <li className="text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors duration-200">
                  Carbon Credit Verification
                </li>
                <li className="text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors duration-200">
                  Community Engagement
                </li>
                <li className="text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors duration-200">
                  Compliance Consulting
                </li>
              </ul>
            </div>

            {/* Newsletter */}
    <div>
      <h3 className="text-lg font-semibold mb-6 text-emerald-400">Stay Updated</h3>
      <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter for the latest insights and updates.</p>
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500 rounded-full"
          required
        />
        <Button 
          type="submit"
          disabled={isEmailSubmitting}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all duration-300 rounded-full"
        >
          {isEmailSubmitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
        {status === 'success' && (
          <p className="text-green-500 text-sm">Successfully subscribed!</p>
        )}
        {status.startsWith('error:') && (
          <p className="text-red-500 text-sm">{status.split(':')[1]}</p>
        )}
      </form>
    </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024
                climerizz
                . All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors duration-200">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors duration-200">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors duration-200">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <Analytics />

    </div>
  );
};

export default ClimerizzWebsite;
