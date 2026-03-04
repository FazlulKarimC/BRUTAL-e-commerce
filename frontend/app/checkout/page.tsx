'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CreditCard, Loader2, ShoppingBag, Tag, X, Check } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { useAuthStore } from '@/lib/auth';
import { formatPrice, cn } from '@/lib/utils';
import api from '@/lib/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@/components/ui';

const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required').default('US'),
  cardNumber: z.string().length(16, 'Card number must be 16 digits'),
  expiryMonth: z.string().length(2, 'Invalid month'),
  expiryYear: z.string().length(2, 'Invalid year'),
  cvv: z.string().min(3, 'CVV must be 3-4 digits').max(4),
  cardholderName: z.string().min(1, 'Cardholder name is required'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutPreview {
  subtotal: number;
  discount: number;
  discountType: string | null;
  shipping: number;
  freeShippingThreshold: number | null;
  tax: number;
  taxRate: number;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Checkout preview state
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: '',
      lastName: '',
      country: 'US',
    },
  });

  // Fetch checkout preview on mount and when discount changes
  const userId = user?.id;
  useEffect(() => {
    const fetchPreview = async () => {
      // Only fetch preview if user is logged in and has items in cart
      if (!userId || !cart || cart.items.length === 0) return;

      setIsLoadingPreview(true);
      try {
        const response = await api.post('/checkout/preview', {
          discountCode: appliedDiscount || undefined,
        });
        setPreview(response.data);
      } catch (err) {
        console.error('Failed to fetch checkout preview:', err);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [userId, cart, appliedDiscount]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setIsApplyingDiscount(true);
    setDiscountError(null);

    try {
      const response = await api.post('/checkout/discount', {
        code: discountCode.trim(),
      });

      if (response.data.valid) {
        setAppliedDiscount(discountCode.trim().toUpperCase());
        setDiscountCode('');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setDiscountError(axiosErr.response?.data?.error || 'Invalid discount code');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError(null);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-4xl font-black mb-2">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Add some items before checkout
          </p>
          <Button asChild size="lg">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Prompt user to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-primary border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] flex items-center justify-center">
            <CreditCard className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-4">Login Required</h1>
          <p className="text-gray-600 mb-8">
            Please log in to your account to continue with the checkout process. This helps us save your order history and shipping details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/login?redirect=/checkout">Login to Continue</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/register?redirect=/checkout">Create Account</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Your cart items are saved and will be here when you return.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/checkout', {
        email: data.email,
        phone: data.phone,
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          line1: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
        },
        paymentInfo: {
          cardNumber: data.cardNumber,
          expiryMonth: data.expiryMonth,
          expiryYear: data.expiryYear,
          cvv: data.cvv,
          cardholderName: data.cardholderName,
        },
        discountCode: appliedDiscount || undefined,
      });

      if (response.data.order) {
        clearCart();
        router.push(`/thank-you/${response.data.order.orderNumber}`);
      } else {
        setError(response.data.error || 'Checkout failed');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'An error occurred during checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-bold mb-8 hover:text-red-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <h1 className="text-4xl font-black mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {error && (
                <div className="bg-red-500 text-white p-4 border-4 border-black rounded-xl">
                  {error}
                </div>
              )}

              {/* Contact Info */}
              <Card shadow="md">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="font-bold text-sm block mb-2">Email</label>
                      <Input
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        state={errors.email ? 'error' : 'default'}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-bold text-sm block mb-2">Phone (optional)</label>
                      <Input type="tel" autoComplete="tel" {...register('phone')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card shadow="md">
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-sm block mb-2">First Name</label>
                      <Input {...register('firstName')} autoComplete="given-name" state={errors.firstName ? 'error' : 'default'} />
                      {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="font-bold text-sm block mb-2">Last Name</label>
                      <Input {...register('lastName')} autoComplete="family-name" state={errors.lastName ? 'error' : 'default'} />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-bold text-sm block mb-2">Address</label>
                      <Input {...register('address')} autoComplete="street-address" state={errors.address ? 'error' : 'default'} />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                    </div>
                    <div>
                      <label className="font-bold text-sm block mb-2">City</label>
                      <Input {...register('city')} autoComplete="address-level2" state={errors.city ? 'error' : 'default'} />
                    </div>
                    <div>
                      <label className="font-bold text-sm block mb-2">State</label>
                      <Input {...register('state')} autoComplete="address-level1" state={errors.state ? 'error' : 'default'} />
                    </div>
                    <div>
                      <label className="font-bold text-sm block mb-2">Postal Code</label>
                      <Input {...register('postalCode')} autoComplete="postal-code" state={errors.postalCode ? 'error' : 'default'} />
                    </div>
                    <div>
                      <label className="font-bold text-sm block mb-2">Country</label>
                      <Input {...register('country')} autoComplete="country" defaultValue="US" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card shadow="md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Test: Card ending in 1 = success, 2 = declined, others = 80% success
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="font-bold text-sm block mb-2">Cardholder Name</label>
                      <Input {...register('cardholderName')} autoComplete="cc-name" state={errors.cardholderName ? 'error' : 'default'} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-bold text-sm block mb-2">Card Number</label>
                      <Input
                        {...register('cardNumber')}
                        autoComplete="cc-number"
                        maxLength={16}
                        placeholder="1234567890123456"
                        state={errors.cardNumber ? 'error' : 'default'}
                      />
                      {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber.message}</p>}
                    </div>
                    <div>
                      <label className="font-bold text-sm block mb-2">Expiry (MM/YY)</label>
                      <div className="flex gap-2">
                        <Input {...register('expiryMonth')} autoComplete="cc-exp-month" maxLength={2} placeholder="MM" inputSize="sm" />
                        <span className="self-center">/</span>
                        <Input {...register('expiryYear')} autoComplete="cc-exp-year" maxLength={2} placeholder="YY" inputSize="sm" />
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-sm block mb-2">CVV</label>
                      <Input {...register('cvv')} autoComplete="cc-csc" maxLength={4} placeholder="123" inputSize="sm" className="w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error message near payment button for visibility */}
              {error && (
                <div className="bg-red-500 text-white p-4 border-4 border-black rounded-xl flex items-center gap-2">
                  <span className="font-bold">Payment Failed:</span> {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Complete Order - {formatPrice(preview?.total || cart.subtotal)}</>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card shadow="lg" className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-60 overflow-y-auto mb-6">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 border-4 border-black rounded-lg relative overflow-hidden shrink-0">
                        {item.product.image ? (
                          <Image src={item.product.image} alt={item.product.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm line-clamp-1">{item.product.title}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-bold">{formatPrice(item.lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="border-t-4 border-black pt-4 mb-4">
                  <label className="font-bold text-sm mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Discount Code
                  </label>
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between bg-green-100 border-4 border-green-500 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-bold">{appliedDiscount}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        inputSize="sm"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount || !discountCode.trim()}
                      >
                        {isApplyingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {discountError && (
                    <p className="text-red-500 text-sm mt-2">{discountError}</p>
                  )}
                </div>

                {/* Order Totals */}
                <div className="border-t-4 border-black pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold">{formatPrice(preview?.subtotal || cart.subtotal)}</span>
                  </div>

                  {preview && preview.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-bold">-{formatPrice(preview.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    {isLoadingPreview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : preview ? (
                      <span className={preview.shipping === 0 ? 'text-green-600 font-bold' : ''}>
                        {preview.shipping === 0 ? 'FREE' : formatPrice(preview.shipping)}
                      </span>
                    ) : (
                      <span className="text-gray-500">Calculated</span>
                    )}
                  </div>

                  {preview && preview.freeShippingThreshold && preview.shipping > 0 && (
                    <p className="text-xs text-gray-500">
                      Free shipping on orders over {formatPrice(preview.freeShippingThreshold)}
                    </p>
                  )}

                  {preview && preview.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({preview.taxRate}%)</span>
                      <span>{formatPrice(preview.tax)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg pt-2 border-t-4 border-black">
                    <span className="font-black">Total</span>
                    {isLoadingPreview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="font-black">{formatPrice(preview?.total || cart.subtotal)}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
