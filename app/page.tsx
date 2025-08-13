'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import { useState, useEffect } from 'react';
import { DemoModal } from '@/components/DemoModal';
import { motion} from 'framer-motion';
import { ArrowRight, CheckCircle, MessageSquare, Calendar } from 'lucide-react';

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Stedi-inspired Header with your original navigation */}
      <Header scrollState={scrolled} />

      {/* Hero Section - Stedi style with your original content */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-28 sm:py-28 md:py-44 overflow-hidden bg-[#1e293b] text-white">
        {/* Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Your original hero content with Stedi styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-5xl"
        >
          <div className="inline-flex items-center px-3 py-1.5 mb-6 text-sm border border-teal-300/20 rounded-full bg-teal-500/10 text-[var(--stedi-teal)]">
            <span className="mr-2 bg-[var(--stedi-teal)] w-2 h-2 rounded-full"></span>
            Streamlined Check-in Solution
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Modernize Your <br />
            <span className="text-[var(--stedi-teal)]">Check-in Experience</span>
          </h1>

          <p className="text-xl sm:text-2xl text-teal-100 max-w-2xl md:max-w-3xl mx-auto mb-10">
            A powerful QR-based attendance system that helps organizations track
            attendance, collect data, and manage members effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-md mx-auto mb-12">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="teal"
                size="lg"
                className="w-full px-8 py-6 text-base sm:text-lg rounded-xl bg-[var(--stedi-teal)] hover:bg-[var(--stedi-teal-dark)] shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-8 py-6 text-base sm:text-lg rounded-xl bg-white text-[#0F4A47] hover:bg-gray-100 hover:-translate-y-1 transition-all duration-200"
              onClick={() => setIsDemoOpen(true)}
            >
              View Demo
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-teal-200">
            <div className="flex items-center">
              <CheckCircle className="text-[var(--stedi-teal)] mr-2 h-5 w-5" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="text-[var(--stedi-teal)] mr-2 h-5 w-5" />
              Free plan available
            </div>
          </div>

          {/* Customer Logos - adapted from your social proof */}
          <div className="mt-16 text-center">
            <p className="text-teal-200 text-sm mb-6">Trusted by growing organizations</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
              <div className="text-white/60 font-semibold">GymTech</div>
              <div className="text-white/60 font-semibold">FlexSpace</div>
              <div className="text-white/60 font-semibold">EventPro</div>
              <div className="text-white/60 font-semibold">CoWork</div>
              <div className="text-white/60 font-semibold">MemberHub</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Your original "How It Works" section with Stedi styling */}
      <section className="py-24 relative bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-sm rounded-full bg-[var(--stedi-teal-light)] text-[var(--stedi-teal)] mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--stedi-black)] mb-4">
              Simple Steps to Get Started
            </h2>
            <p className="text-lg text-[var(--stedi-medium-gray)] max-w-2xl mx-auto">
              Our platform makes it easy to manage attendance and check-ins for
              any organization
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 lg:gap-10">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group bg-white p-8 rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 border border-gray-100 relative overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--stedi-teal-light)] rounded-bl-full -mr-12 -mt-12"></div>
              <div className="bg-[var(--stedi-teal-light)] p-4 rounded-xl w-14 h-14 flex items-center justify-center mb-6 text-[var(--stedi-teal)] font-bold text-xl group-hover:scale-110 transition-transform z-10 relative">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--stedi-black)]">
                Register Organization
              </h3>
              <p className="text-[var(--stedi-medium-gray)]">
                Create an account and set up your organization&apos;s profile
                with all necessary details.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="group bg-white p-8 rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 border border-gray-100 relative overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--stedi-primary-light)] rounded-bl-full -mr-12 -mt-12"></div>
              <div className="bg-[var(--stedi-primary-light)] p-4 rounded-xl w-14 h-14 flex items-center justify-center mb-6 text-[var(--stedi-primary)] font-bold text-xl group-hover:scale-110 transition-transform z-10 relative">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--stedi-black)]">
                Configure Check-in
              </h3>
              <p className="text-[var(--stedi-medium-gray)]">
                Design custom forms and generate unique QR codes for your events
                or locations.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group bg-white p-8 rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 border border-gray-100 relative overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--stedi-primary-light)] rounded-bl-full -mr-12 -mt-12"></div>
              <div className="bg-[var(--stedi-primary-light)] p-4 rounded-xl w-14 h-14 flex items-center justify-center mb-6 text-[var(--stedi-primary)] font-bold text-xl group-hover:scale-110 transition-transform z-10 relative">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--stedi-black)]">
                Members Check In
              </h3>
              <p className="text-[var(--stedi-medium-gray)]">
                Members simply scan the QR code and complete the custom form for
                quick access.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="group bg-white p-8 rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 border border-gray-100 relative overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--stedi-primary-light)] rounded-bl-full -mr-12 -mt-12"></div>
              <div className="bg-[var(--stedi-primary-light)] p-4 rounded-xl w-14 h-14 flex items-center justify-center mb-6 text-[var(--stedi-primary)] font-bold text-xl group-hover:scale-110 transition-transform z-10 relative">
                4
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--stedi-black)]">
                Track & Analyze
              </h3>
              <p className="text-[var(--stedi-medium-gray)]">
                Access real-time attendance data and generate comprehensive
                analytical reports.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section with Better Animations */}
      <section
        className={`py-24 relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 ${
          scrolled ? "bg-opacity-95" : "bg-opacity-100"
        }`}
      >
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-sm rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 mb-4">
              Key Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform provides all the tools you need to streamline your
              check-in process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <QrCodeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                QR Code Check-in
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate unique QR codes for seamless check-ins at your events
                or locations. Simply scan and go.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-800/40 p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FormIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Custom Fields
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create custom forms to collect exactly the information you need
                from your attendees and members.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChartIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Attendance Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track attendance patterns and generate comprehensive reports
                with our powerful analytics tools.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="py-24 relative overflow-hidden bg-[#1e293b]">
        <div className="container mx-auto px-4 relative z-10 bg-[#1e293b]">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to transform your check-in process?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                Join thousands of organizations that use our platform to
                streamline their operations.
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-8 py-6 text-lg bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-medium shadow-lg shadow-blue-700/20 hover:shadow-blue-700/30 transition-all duration-200 hover:-translate-y-1"
                >
                  Get Started for Free
                </Button>
              </Link>
              <p className="text-blue-100 mt-6 text-sm">
                No credit card required
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              
              <span className="font-semibold text-xl text-gray-900 dark:text-white">
                SecuredPass
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link
                href="/about"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                About
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
          <div className="text-center mt-10 text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} QR Check-in. All rights reserved.
          </div>
        </div>
      </footer>

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}

// Icon components
function QrCodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="6" height="6" x="3" y="3" rx="1" />
      <rect width="6" height="6" x="15" y="3" rx="1" />
      <rect width="6" height="6" x="3" y="15" rx="1" />
      <path d="M15 15h.01M15 18h.01M18 15h.01M18 18h.01M21 21v-6h-6" />
    </svg>
  );
}

function FormIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h6" />
    </svg>
  );
}

function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
