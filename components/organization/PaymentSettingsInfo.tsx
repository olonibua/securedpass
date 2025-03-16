import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { PaymentModel } from "@/types";
interface PaymentSettingsInfoProps {
  paymentModel: PaymentModel;
  transactionFeePercentage?: number;
}

export default function PaymentSettingsInfo({
  paymentModel,
  transactionFeePercentage = 5
}: PaymentSettingsInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="mr-2 h-5 w-5" />
          Payment Model Information
        </CardTitle>
        <CardDescription>
          Understanding your current payment setup
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentModel === 'subscription' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center">
                <Info className="mr-2 h-4 w-4" />
                You are on the Direct Subscription Model
              </h3>
              <p className="text-sm mt-2">
                You pay a subscription fee to use our platform, and you collect 100% of your member payments directly through your Paystack account.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                <li>You pay a subscription fee to SecuredPass</li>
                <li>You connect your own Paystack account</li>
                <li>Your members pay you directly through your Paystack account</li>
                <li>You keep 100% of your member payments</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
              <h3 className="font-medium text-amber-800 dark:text-amber-300 flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                You are on the Transaction Fee Model
              </h3>
              <p className="text-sm mt-2">
                You pay no subscription fee, but SecuredPass takes a {transactionFeePercentage}% fee from each payment made by your members.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                <li>You pay no subscription fee to SecuredPass</li>
                <li>Your members pay through our platform's Paystack account</li>
                <li>We deduct a {transactionFeePercentage}% fee from each transaction</li>
                <li>We transfer the remaining balance to your bank account</li>
                <li>You need to provide your bank details for transfers</li>
              </ol>
            </div>
            
            <div className="mt-4 border-t pt-4">
              <h3 className="font-medium">Bank Account Information</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please contact support to set up your bank account for settlement transfers.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 