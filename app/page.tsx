import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
     <Header />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10 sm:py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6 max-w-4xl">
          Streamline Your Check-in Process
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-sm sm:max-w-2xl md:max-w-3xl mb-6 sm:mb-10">
          A modern QR-based attendance system for organizations of all sizes.
          Track attendance, collect data, and manage members with ease.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xs sm:max-w-md">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-4 sm:px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/demo" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto px-4 sm:px-8">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Image
                  src="/entryflex.webp"
                  alt="QR Code"
                  width={24}
                  height={24}
                  className="dark:invert"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">QR Code Check-in</h3>
              <p className="text-muted-foreground">
                Generate unique QR codes for seamless check-ins at your events
                or locations.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Image
                  src="/entryflex.webp"
                  alt="Custom Fields"
                  width={24}
                  height={24}
                  className="dark:invert"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Fields</h3>
              <p className="text-muted-foreground">
                Create custom forms to collect exactly the information you need
                from attendees.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Image
                  src="/entryflex.webp"
                  alt="Analytics"
                  width={24}
                  height={24}
                  className="dark:invert"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Attendance Analytics
              </h3>
              <p className="text-muted-foreground">
                Track attendance patterns and generate reports with our powerful
                analytics tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Join thousands of organizations that use our platform to streamline
            their check-in process.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-8">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image
                src="/entryflex.webp"
                alt="QR Check-in Logo"
                width={24}
                height={24}
                className="dark:invert"
              />
              <span className="font-semibold">QR Check-in</span>
            </div>
            <div className="flex gap-6">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-muted-foreground">
            © {new Date().getFullYear()} QR Check-in. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
