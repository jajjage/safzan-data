/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BiometricVerificationModal } from "@/components/auth/BiometricVerificationModal";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { PinSetupModal } from "@/components/features/security/pin-setup-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useSupplierMarkupMap } from "@/hooks/useSupplierMarkup";
import { useTopup } from "@/hooks/useTopup";
import { useEligibleOffers } from "@/hooks/useUserOffers";
import { useTransaction } from "@/hooks/useWallet";
import { detectNetworkProvider } from "@/lib/network-utils";
import { useSecurityStore } from "@/store/securityStore";
import { Product } from "@/types/product.types";
import {
  convertDenomAmountToNumber,
  getResolvedProductPrice,
} from "@/utils/reseller-products";
import { useQueryClient } from "@tanstack/react-query";
import { Grid, LayoutList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckoutModal } from "../shared/checkout-modal";
import { NetworkDetector } from "../shared/network-detector";
import { NetworkSelector } from "../shared/network-selector";
import { ProductCard } from "../shared/product-card";
import { ShareTransactionDialog } from "../transactions/share-transaction-dialog";
import { CategoryTabs } from "./category-tabs";

type DataPlansProps = {
  productType?: string;
  title?: string;
  returnUrl?: string;
};

export function DataPlans({
  productType = "data",
  title = "Data Plans",
  returnUrl = "/dashboard/data",
}: DataPlansProps) {
  const router = useRouter();
  const showCategories = productType === "data";
  const { user, refetch: refetchUser } = useAuth();
  const { recordPinAttempt, isBlocked: _isBlocked } = useSecurityStore();
  const topupMutation = useTopup();
  const queryClient = useQueryClient();

  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch categories from API
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();

  // State for Input & Detection
  const [phoneNumber, setPhoneNumber] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [_networkMismatch, setNetworkMismatch] = useState(false);
  const [isPhoneNumberExplicitlyEntered, setIsPhoneNumberExplicitlyEntered] =
    useState(false);

  // Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMarkupPercent, setSelectedMarkupPercent] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // Verification Modal State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    useCashback: boolean;
    amount?: number;
    verificationToken?: string;
    pin?: string;
  } | null>(null);

  // Share dialog state
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(
    null
  );
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch products
  const { data, isLoading, error } = useProducts(
    { productType, isActive: true },
    { staleTime: 5 * 60 * 1000 }
  );

  const products = useMemo(() => data?.products || [], [data?.products]);

  const isGuest = !user;
  const { eligibleIds } = useEligibleOffers(!isGuest);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const markupMap = useSupplierMarkupMap();

  const operators = useMemo(() => {
    const uniqueOps = new Map<string, { name: string; logoUrl: string }>();

    products.forEach((p) => {
      if (p.operator && p.operator.name) {
        if (!uniqueOps.has(p.operator.name)) {
          uniqueOps.set(p.operator.name, {
            name: p.operator.name,
            logoUrl: p.operator.logoUrl,
          });
        }
      }
    });

    return Array.from(uniqueOps.values()).sort((a, b) => {
      if (a.name.includes("MTN")) return -1;
      if (b.name.includes("MTN")) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  useEffect(() => {
    if (!selectedNetwork && operators.length > 0) {
      setSelectedNetwork(operators[0].name);
    }
  }, [operators, selectedNetwork]);

  useEffect(() => {
    if (showCategories && !selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].slug);
    }
  }, [categories, selectedCategory, showCategories]);

  const handleNetworkDetected = useCallback(
    (networkKey: string) => {
      const matchedOperator = operators.find((op) =>
        op.name.toLowerCase().includes(networkKey.toLowerCase())
      );

      if (matchedOperator) {
        setDetectedNetwork(matchedOperator.name);
        setSelectedNetwork(matchedOperator.name);
        setNetworkMismatch(false);
      }
    },
    [operators]
  );

  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 4 && operators.length > 0) {
      const detectedOp = detectNetworkProvider(phoneNumber);
      if (detectedOp) {
        handleNetworkDetected(detectedOp);
      }
    }
  }, [phoneNumber, operators, handleNetworkDetected]);

  const handleManualNetworkSelect = (networkName: string) => {
    if (
      detectedNetwork &&
      detectedNetwork !== networkName &&
      phoneNumber.length >= 4
    ) {
      setNetworkMismatch(true);
      toast.warning(`This number appears to be ${detectedNetwork}.`, {
        description: `${networkName} plans won't work with this number.`,
        action: {
          label: "Yes, switch anyway",
          onClick: () => {
            setSelectedNetwork(networkName);
          },
        },
      });
      setSelectedNetwork(networkName);
    } else {
      setNetworkMismatch(false);
      setSelectedNetwork(networkName);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!selectedNetwork) return [];

    const networkProducts = products.filter((product: Product) => {
      if (product.productType !== productType) return false;
      if (product.operator?.name !== selectedNetwork) return false;
      return true;
    });

    const categoryFiltered = showCategories
      ? networkProducts.filter(
          (product: Product) => product.category?.slug === selectedCategory
        )
      : networkProducts;

    const seen = new Set<string>();
    const deduplicated = categoryFiltered.filter((product) => {
      if (seen.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    });

    const sorted = [...deduplicated].sort((a, b) => {
      const sizeMbA = a.dataMb || 0;
      const sizeMbB = b.dataMb || 0;
      return sizeMbA - sizeMbB;
    });

    return sorted;
  }, [
    products,
    productType,
    selectedNetwork,
    selectedCategory,
    showCategories,
  ]);

  const handlePlanClick = (product: Product) => {
    if (!isPhoneNumberExplicitlyEntered) {
      toast.error("Please enter a phone number before selecting a product.", {
        description: "We need a valid number to proceed.",
        duration: 4000,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error("Please enter a valid phone number first.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const phoneNetwork = detectNetworkProvider(phoneNumber);
    const productNetwork = product.operator?.name;

    if (phoneNetwork && productNetwork) {
      const isMatch = productNetwork
        .toLowerCase()
        .includes(phoneNetwork.toLowerCase());

      if (!isMatch) {
        toast.error(
          `This ${productNetwork} plan cannot be used with your ${phoneNetwork} number.`,
          {
            description:
              "Please enter a phone number that matches this network, or select a different network.",
            duration: 5000,
          }
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setSelectedProduct(product);
    setIsSuccess(false);
    setIsFailed(false);
    setFailureMessage("");

    const supplierId = product.supplierOffers?.[0]?.supplierId || "";
    const markup = markupMap.get(supplierId) || 0;
    setSelectedMarkupPercent(markup);

    if (product.activeOffer) {
      const isEligible = eligibleIds.has(product.activeOffer.id);
      setSelectedOfferId(isEligible ? product.activeOffer.id : null);
    } else {
      setSelectedOfferId(null);
    }

    setIsCheckoutOpen(true);
  };

  const handleBiometricSuccess = (verificationToken: string) => {
    if (pendingPaymentData) {
      setPendingPaymentData({
        ...pendingPaymentData,
        verificationToken,
      });

      proceedWithPayment(pendingPaymentData.useCashback, verificationToken);
    }
  };

  const handleBiometricUnavailable = useCallback(() => {
    setShowBiometricModal(false);
    setShowPinModal(true);
  }, []);

  const handleNoPinSetup = useCallback(() => {
    setShowBiometricModal(false);
    setShowPinSetupModal(true);
  }, []);

  const handlePinSetupSuccess = useCallback(() => {
    setShowPinSetupModal(false);
    setShowPinModal(true);
    refetchUser();
  }, [refetchUser]);

  const handlePinEntrySuccess = (pin: string) => {
    setErrorMessage("");

    if (pendingPaymentData) {
      proceedWithPayment(pendingPaymentData.useCashback, undefined, pin);
    } else {
      setShowPinModal(false);
    }
  };

  const handlePayment = (useCashback: boolean) => {
    if (!selectedProduct) return;

    const basePrice =
      getResolvedProductPrice(selectedProduct) ??
      convertDenomAmountToNumber(selectedProduct.denomAmount);

    const userCashbackBalance = user?.cashback?.availableBalance || 0;
    const payableAmount = useCashback
      ? Math.max(0, basePrice - userCashbackBalance)
      : basePrice;

    setPendingPaymentData({ useCashback, amount: payableAmount });
    setIsCheckoutOpen(false);
    setShowBiometricModal(true);
  };

  const proceedWithPayment = (
    useCashback: boolean,
    verificationToken?: string,
    pin?: string
  ) => {
    if (!selectedProduct) return;

    const amount =
      getResolvedProductPrice(selectedProduct) ??
      convertDenomAmountToNumber(selectedProduct.denomAmount);
    const offer = selectedProduct.supplierOffers?.[0];

    topupMutation.mutate(
      {
        amount,
        productCode: selectedProduct.productCode,
        recipientPhone: phoneNumber,
        supplierSlug: offer?.supplierSlug,
        supplierMappingId: offer?.mappingId,
        useCashback,
        verificationToken,
        pin,
        offerId: selectedOfferId || undefined,
      },
      {
        onSuccess: (response) => {
          setIsSuccess(true);
          const txId =
            response.data?.transactionId ||
            response.data?.id ||
            response.data?.transaction_id ||
            response.data?.topupRequestId ||
            response.data?.requestId;
          if (txId) {
            setLastTransactionId(txId);
          }
          if (pin) recordPinAttempt(true);

          setShowPinModal(false);
          setShowBiometricModal(false);
          setIsCheckoutOpen(true);
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Transaction failed. Please try again.";

          if (
            pin &&
            (msg.toLowerCase().includes("pin") ||
              msg.toLowerCase().includes("invalid"))
          ) {
            recordPinAttempt(false);
            setErrorMessage(msg);
          } else {
            setShowPinModal(false);
            setShowBiometricModal(false);
            setIsFailed(true);
            setFailureMessage(msg);
            setIsCheckoutOpen(true);
          }
        },
      }
    );
  };

  const handleRetry = () => {
    setIsFailed(false);
    setFailureMessage("");
    if (pendingPaymentData) {
      setShowBiometricModal(true);
    }
  };

  const currentLogo = operators.find(
    (op) => op.name === selectedNetwork
  )?.logoUrl;

  if (error) {
    return (
      <div className="py-10 text-center text-red-500">
        Failed to load data plans. Please try again.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Input & Detection Section */}
      <NetworkDetector
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        onNetworkDetected={handleNetworkDetected}
        onExplicitEntry={setIsPhoneNumberExplicitlyEntered}
        selectedNetworkLogo={currentLogo}
        recentNumbers={user?.recentlyUsedNumbers || []}
      />

      {/* Header & View Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="size-8 rounded-md"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="size-8 rounded-md"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="size-4" />
          </Button>
        </div>
      </div>

      {/* Network Selector */}
      {isLoading && operators.length === 0 ? (
        <div className="flex gap-4 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          onSelect={handleManualNetworkSelect}
          operators={operators}
        />
      )}

      {/* Category Tabs */}
      {showCategories && (
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory || ""}
          onSelect={setSelectedCategory}
          isLoading={isCategoriesLoading}
        />
      )}

      {/* Data Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              : "flex flex-col gap-3"
          }
        >
          {filteredProducts.map((product) => {
            const supplierId = product.supplierOffers?.[0]?.supplierId || "";
            const markupPercent = markupMap.get(supplierId) || 0;

            return (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handlePlanClick(product)}
                markupPercent={markupPercent}
                isGuest={isGuest}
                isEligibleForOffer={
                  product.activeOffer
                    ? eligibleIds.has(product.activeOffer.id)
                    : false
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground py-10 text-center">
          No plans available for this selection.
        </div>
      )}

      {/* Checkout Modal */}
      {selectedProduct &&
        !showBiometricModal &&
        !showPinModal &&
        !showPinSetupModal &&
        !topupMutation.isPending && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            product={selectedProduct}
            phoneNumber={phoneNumber}
            networkLogo={currentLogo}
            networkName={selectedNetwork}
            userBalance={parseFloat(user?.balance || "0")}
            userCashbackBalance={user?.cashback?.availableBalance || 0}
            onConfirm={handlePayment}
            isProcessing={topupMutation.isPending}
            isSuccess={isSuccess}
            isFailed={isFailed}
            failureMessage={failureMessage}
            onRetry={handleRetry}
            markupPercent={selectedMarkupPercent}
            onShare={
              isSuccess
                ? () => {
                    setIsShareDialogOpen(true);
                  }
                : undefined
            }
          />
        )}

      {/* Biometric Verification Modal */}
      <BiometricVerificationModal
        open={showBiometricModal}
        onClose={() => {
          setShowBiometricModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={handleBiometricSuccess}
        onBiometricUnavailable={handleBiometricUnavailable}
        onNoPinSetup={handleNoPinSetup}
        transactionAmount={pendingPaymentData?.amount?.toString()}
        productCode={selectedProduct?.productCode}
        phoneNumber={phoneNumber}
        isVerifying={topupMutation.isPending}
      />

      {/* PIN Verification Modal */}
      <PinVerificationModal
        open={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingPaymentData(null);
          setErrorMessage("");
        }}
        onSuccess={handlePinEntrySuccess}
        useCashback={pendingPaymentData?.useCashback || false}
        reason="transaction"
        transactionAmount={pendingPaymentData?.amount?.toString()}
        productCode={selectedProduct?.productCode}
        phoneNumber={phoneNumber}
        isVerifying={topupMutation.isPending}
        errorMessage={errorMessage}
        onForgotPin={() =>
          router.push(
            `/dashboard/profile/security/pin?returnUrl=${encodeURIComponent(returnUrl)}`
          )
        }
      />

      {/* PIN Setup Modal */}
      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={() => {
          setShowPinSetupModal(false);
          setPendingPaymentData(null);
        }}
        onSuccess={handlePinSetupSuccess}
      />

      {/* Share Dialog */}
      {lastTransactionId && (
        <ShareDialogWithTransaction
          transactionId={lastTransactionId}
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
        />
      )}
    </div>
  );
}

function ShareDialogWithTransaction({
  transactionId,
  isOpen,
  onClose,
}: {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useTransaction(transactionId);
  const transaction = data?.data;

  if (!isOpen || isLoading || !transaction) return null;

  return (
    <ShareTransactionDialog
      isOpen={isOpen}
      onClose={onClose}
      transaction={transaction}
    />
  );
}
