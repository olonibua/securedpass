'use client';

import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { PaymentModel } from '@/types';
import { AlertCircle, Calendar, CheckCircle, Lock, PencilIcon } from 'lucide-react';

interface PaymentModelSelectorProps {
  organizationId: string;
  currentModel: PaymentModel;
  transactionFeePercentage?: number;
  paymentModelLastChanged?: string;
  onModelChange?: (model: PaymentModel, feePercentage: number) => void;
}

export default function PaymentModelSelector({
  organizationId,
  currentModel = 'subscription',
  transactionFeePercentage = 5,
  paymentModelLastChanged,
  onModelChange,
}: PaymentModelSelectorProps) {
  // Form state (for editing)
  const [paymentModel, setPaymentModel] = useState<PaymentModel>(currentModel);
  const [feePercentage, setFeePercentage] = useState(transactionFeePercentage);
  
  // Display state (what's shown in the UI)
  const [displayModel, setDisplayModel] = useState<PaymentModel>(currentModel);
  const [displayFeePercentage, setDisplayFeePercentage] = useState(transactionFeePercentage);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [daysUntilChange, setDaysUntilChange] = useState<number | null>(null);
  const [canChange, setCanChange] = useState(false); // Default to false until we check
  
  // Update state when props change
  useEffect(() => {
    setDisplayModel(currentModel);
    setPaymentModel(currentModel);
    setDisplayFeePercentage(transactionFeePercentage || 5);
    setFeePercentage(transactionFeePercentage || 5);
  }, [currentModel, transactionFeePercentage]);

  // Check if changes are allowed (30-day restriction)
  useEffect(() => {
    if (paymentModelLastChanged) {
      const lastChanged = new Date(paymentModelLastChanged);
      const now = new Date();
      
      // Calculate days since last change
      const diffTime = now.getTime() - lastChanged.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate days until change is allowed
      const daysUntil = 30 - diffDays;
      setDaysUntilChange(daysUntil > 0 ? daysUntil : 0);
      
      // Determine if change is allowed - ONLY if 30+ days have passed
      setCanChange(diffDays >= 30);
    } else {
      // If no last change date, they can change it (first time setup)
      setCanChange(true);
    }
  }, [paymentModelLastChanged]);

  const handleSubmit = async () => {
    if (!canChange) {
      toast.error(`You cannot change your payment model yet. Please wait ${daysUntilChange} more days.`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updateData = {
        paymentModel,
        transactionFeePercentage: paymentModel === 'transaction_fee' ? feePercentage : null,
        paymentModelLastChanged: new Date().toISOString(),
      };
      
      await databases.updateDocument(
        DATABASE_ID,
        ORGANIZATIONS_COLLECTION_ID,
        organizationId,
        updateData
      );
      
      // Update the display immediately to show the new selection
      setDisplayModel(paymentModel);
      setDisplayFeePercentage(feePercentage);
      
      // Notify parent component of the change
      if (onModelChange) {
        onModelChange(paymentModel, paymentModel === 'transaction_fee' ? feePercentage : 0);
      }
      
      toast.success('Payment model updated successfully');
      setIsEditing(false);
      
      // Update canChange to false and set days until next change
      setCanChange(false);
      setDaysUntilChange(30);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment model';
      console.error('Error updating payment model:', errorMessage);
      toast.error('Failed to update payment model');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Payment Model</span>
          {!isEditing && (
            canChange ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mr-1" />
                <span>Locked for {daysUntilChange} more days</span>
              </div>
            )
          )}
        </CardTitle>
        <CardDescription>
          Choose how you want to pay for using our platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            {/* Current payment model indicator */}
            <div className={`p-4 rounded-md border-2 ${
              displayModel === 'subscription'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
            }`}>
              <div className="flex items-center">
                <CheckCircle className={`h-5 w-5 mr-2 ${
                  displayModel === 'subscription' ? 'text-blue-600' : 'text-amber-600'
                }`} />
                <h3 className="font-medium">
                  {displayModel === 'subscription'
                    ? 'Subscription Based'
                    : 'Transaction Fee Based'}
                </h3>
              </div>
              <p className="mt-2 text-sm">
                {displayModel === 'subscription'
                  ? 'You pay a fixed subscription fee and keep 100% of your member payments.'
                  : `You pay no subscription fee, but we take a ${displayFeePercentage}% fee from each transaction.`
                }
              </p>
              {paymentModelLastChanged && (
                <div className="mt-3 flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  Last changed: {new Date(paymentModelLastChanged).toLocaleDateString()}
                </div>
              )}
              {!canChange && paymentModelLastChanged && (
                <div className="mt-3 flex items-center text-xs bg-muted p-2 rounded">
                  <Lock className="h-3 w-3 mr-1" />
                  <span>
                    Payment model changes are locked for {daysUntilChange} more days. 
                    Organizations can only change payment models once every 30 days.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <RadioGroup
            value={paymentModel}
            onValueChange={(value) => setPaymentModel(value as PaymentModel)}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-md">
              <RadioGroupItem value="subscription" id="subscription" />
              <div className="grid gap-1.5">
                <Label htmlFor="subscription" className="font-medium">
                  Subscription Based
                </Label>
                <p className="text-sm text-muted-foreground">
                  Pay a fixed monthly or annual fee for using our platform.
                  Includes all features with no additional transaction fees.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border rounded-md">
              <RadioGroupItem value="transaction_fee" id="transaction_fee" />
              <div className="grid gap-1.5 w-full">
                <Label htmlFor="transaction_fee" className="font-medium">
                  Transaction Fee Based
                </Label>
                <p className="text-sm text-muted-foreground">
                  No monthly subscription fee. Instead, we'll take a percentage of each transaction
                  processed through our platform.
                </p>
                
                {paymentModel === 'transaction_fee' && (
                  <div className="mt-3">
                    <Label htmlFor="percentage">Transaction Fee Percentage</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="percentage"
                        type="number"
                        min="1"
                        max="20"
                        value={feePercentage}
                        onChange={(e) => setFeePercentage(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="ml-2">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Platform fee percentage (1-20%)
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Changes to your payment model will lock it for 30 days. Choose carefully.
              </p>
            </div>
          </RadioGroup>
        )}
      </CardContent>
      
      {isEditing && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setIsEditing(false);
            // Reset to current values when canceled
            setPaymentModel(displayModel);
            setFeePercentage(displayFeePercentage);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !canChange}>
            {isSubmitting ? 'Saving...' : 'Save Payment Model'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 