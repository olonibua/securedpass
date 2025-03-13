'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { databases, Query } from '@/lib/appwrite';
import { 
  DATABASE_ID, 
  PAYMENT_METHODS_COLLECTION_ID
} from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface PaymentMethod {
  $id: string;
  userId: string;
  type: string;
  cardBrand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
}

interface PaymentHistory {
  $id: string;
  userId: string;
  amount: number;
  status: string; 
  date: string;
  description: string;
}

export default function PaymentPage() {
  const { organizationId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch payment methods
      const paymentMethodsResponse = await databases.listDocuments(
        DATABASE_ID,
        PAYMENT_METHODS_COLLECTION_ID,
        [Query.equal("userId", user?.$id || "")]
      );

      setPaymentMethods(
        paymentMethodsResponse.documents as unknown as PaymentMethod[]
      );

      // Fetch payment history (mock data for now)
      // In a real app, you would fetch from your payments collection
      setPaymentHistory([
        {
          $id: "1",
          userId: user?.$id || "",
          amount: 29.99,
          status: "completed",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly Subscription Payment",
        },
        {
          $id: "2",
          userId: user?.$id || "",
          amount: 29.99,
          status: "completed",
          date: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly Subscription Payment",
        },
      ]);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, organizationId, fetchData]);

  

  const getCardBrand = (cardNumber: string) => {
    // Simple card brand detection
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('3')) return 'Amex';
    if (cardNumber.startsWith('6')) return 'Discover';
    return 'Unknown';
  };

  const resetForm = () => {
    setCardNumber('');
    setCardName('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setIsDefault(false);
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsAddingPaymentMethod(true);
      
      // In a real app, you would integrate with Stripe or another payment processor
      // For demo purposes, we'll just simulate adding a card
      
      // Validate form
      if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
        toast.error('Please fill in all card details');
        return;
      }
      
      // Create new payment method in database
      await databases.createDocument(
        DATABASE_ID,
        PAYMENT_METHODS_COLLECTION_ID,
        'unique()',
        {
          userId: user?.$id,
          type: 'card',
          cardBrand: getCardBrand(cardNumber),
          last4: cardNumber.slice(-4),
          expiryMonth,
          expiryYear,
          isDefault: isDefault || paymentMethods.length === 0, // Make default if it's the first card
          createdAt: new Date().toISOString()
        }
      );
      
      toast.success('Payment method added successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    } finally {
      setIsAddingPaymentMethod(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      // Update all payment methods to not be default
      await Promise.all(
        paymentMethods.map(method => 
          databases.updateDocument(
            DATABASE_ID,
            PAYMENT_METHODS_COLLECTION_ID,
            method.$id,
            { isDefault: method.$id === methodId }
          )
        )
      );
      
      toast.success('Default payment method updated');
      fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('Failed to update default payment method');
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        PAYMENT_METHODS_COLLECTION_ID,
        methodId
      );
      
      toast.success('Payment method deleted successfully');
      fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container py-10 max-w-6xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold mb-6">Payment Management</h1>

        <Tabs defaultValue="methods" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="methods">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Your Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your saved payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length > 0 ? (
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.$id}
                          className="flex justify-between items-center p-4 border rounded-lg"
                        >
                          <div className="flex items-center">
                            <CreditCard className="h-10 w-10 mr-4 text-primary" />
                            <div>
                              <div className="font-medium">
                                {method.cardBrand}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                •••• {method.last4}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Expires {method.expiryMonth}/{method.expiryYear}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {method.isDefault ? (
                              <Badge
                                variant="outline"
                                className="bg-primary/10"
                              >
                                Default
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSetDefaultPaymentMethod(method.$id)
                                }
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeletePaymentMethod(method.$id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No Payment Methods
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        You haven&apos;t added any payment methods yet.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <DialogDescription>
                          Enter your card details to add a new payment method.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddPaymentMethod}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="cardName">Name on Card</Label>
                            <Input
                              id="cardName"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                              id="cardNumber"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4242 4242 4242 4242"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="expiryMonth">Month</Label>
                              <Select
                                value={expiryMonth}
                                onValueChange={setExpiryMonth}
                              >
                                <SelectTrigger id="expiryMonth">
                                  <SelectValue placeholder="MM" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const month = (i + 1)
                                      .toString()
                                      .padStart(2, "0");
                                    return (
                                      <SelectItem key={month} value={month}>
                                        {month}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="expiryYear">Year</Label>
                              <Select
                                value={expiryYear}
                                onValueChange={setExpiryYear}
                              >
                                <SelectTrigger id="expiryYear">
                                  <SelectValue placeholder="YY" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 10 }, (_, i) => {
                                    const year = (new Date().getFullYear() + i)
                                      .toString()
                                      .slice(-2);
                                    return (
                                      <SelectItem key={year} value={year}>
                                        {year}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                placeholder="123"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id="isDefault"
                              checked={isDefault}
                              onCheckedChange={(checked) =>
                                setIsDefault(checked === true)
                              }
                            />
                            <Label htmlFor="isDefault">
                              Set as default payment method
                            </Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={isAddingPaymentMethod}
                          >
                            {isAddingPaymentMethod ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Payment Method"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Options</CardTitle>
                  <CardDescription>
                    Available payment processors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg flex items-center">
                      <div className="h-10 w-10 bg-[#6772E5] rounded-md flex items-center justify-center mr-4">
                        <span className="text-white font-bold">S</span>
                      </div>
                      <div>
                        <div className="font-medium">Stripe</div>
                        <div className="text-sm text-muted-foreground">
                          Credit/Debit Cards
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg flex items-center">
                      <div className="h-10 w-10 bg-[#0BA4DB] rounded-md flex items-center justify-center mr-4">
                        <span className="text-white font-bold">P</span>
                      </div>
                      <div>
                        <div className="font-medium">PayStack</div>
                        <div className="text-sm text-muted-foreground">
                          Local Payment Methods
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg flex items-center">
                      <div className="h-10 w-10 bg-[#003087] rounded-md flex items-center justify-center mr-4">
                        <span className="text-white font-bold">P</span>
                      </div>
                      <div>
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-muted-foreground">
                          PayPal Account
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Your recent payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                      <div
                        key={payment.$id}
                        className="flex justify-between items-center p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {payment.description}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(payment.date)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : "outline"
                            }
                            className={
                              payment.status === "completed"
                                ? "bg-green-500"
                                : ""
                            }
                          >
                            {payment.status === "completed" ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {payment.status.charAt(0).toUpperCase() +
                              payment.status.slice(1)}
                          </Badge>
                          <span className="font-medium">
                            ${payment.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Payment History
                    </h3>
                    <p className="text-muted-foreground">
                      You haven&apos;t made any payments yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 