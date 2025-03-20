"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  FileEdit,
  QrCode,
  UserCheck,
  BarChart4,
  CreditCard,
  X
} from "lucide-react";

interface DemoStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const demoSteps: DemoStep[] = [
  {
    title: "Register Organization",
    description:
      "Create an account and set up your organization's profile. Choose between company or membership types.",
    icon: <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
  },
  {
    title: "Configure Check-in",
    description:
      "Create custom check-in forms with the exact fields you need for your organization.",
    icon: <FileEdit className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
  },
  {
    title: "Generate QR Codes",
    description:
      "Generate unique QR codes for your events or locations that members can scan.",
    icon: <QrCode className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
  },
  {
    title: "Members Check In",
    description:
      "Members scan the QR code and complete the check-in form in seconds.",
    icon: <UserCheck className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
  },
  {
    title: "Track Analytics",
    description:
      "Monitor attendance patterns and generate detailed reports from your dashboard.",
    icon: <BarChart4 className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
  },
  {
    title: "Track Payments",
    description:
      "Monitor payment status and keep track of your business cash flow.",
    icon: <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
  },
];

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep((curr) => curr + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((curr) => curr - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md p-0 overflow-hidden bg-black text-white border-primary rounded-xl">
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 z-50 rounded-full bg-gray-800 p-1 text-white hover:bg-gray-700"
          aria-label="Close"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        
        <div className="relative h-[350px] sm:h-[400px] pt-8 sm:pt-10">
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 text-xs sm:text-sm text-gray-400">
            Step {currentStep + 1} of {demoSteps.length}
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center px-4">
            How to Use QR Check-in
          </h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center px-4 sm:px-8"
            >
              <div className="mb-4 sm:mb-6">{demoSteps[currentStep].icon}</div>

              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-center">
                {demoSteps[currentStep].title}
              </h3>

              <p className="text-sm sm:text-base text-gray-400 text-center mb-6 sm:mb-8 px-2 sm:px-0">
                {demoSteps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 flex justify-between items-center px-4 sm:px-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="bg-white text-black hover:bg-gray-800 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2"
            >
              Previous
            </Button>

            <Button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2"
            >
              {currentStep === demoSteps.length - 1 ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
