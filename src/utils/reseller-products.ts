/**
 * Reseller Product Utilities
 * Helper functions for working with products in the reseller API context
 */

import type { Product } from "@/types/product.types";

type ResellerProduct = Omit<Product, "denomAmount"> & {
  denomAmount?: string | number | null;
  resolvedPrice?: number;
  priceTags?: {
    user?: number;
    reseller?: number;
    api?: number;
  };
};

/**
 * Check if a product is eligible for Reseller API purchase
 */
export function isFixedPriceProduct(product: ResellerProduct): boolean {
  if (!product.isActive) {
    return false;
  }

  const amount = product.denomAmount;

  if (typeof amount !== "number" && typeof amount !== "string") {
    return false;
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Check if a product is a variable/range airtime product
 */
export function isVariableAirtimeProduct(product: ResellerProduct): boolean {
  return (
    product.productType === "airtime" &&
    (product.denomAmount === null ||
      product.denomAmount === 0 ||
      (typeof product.denomAmount === "string" &&
        (product.denomAmount === "" || parseFloat(product.denomAmount) === 0)))
  );
}

/**
 * Check if a product is a data bundle
 */
export function isDataProduct(product: ResellerProduct): boolean {
  return product.productType === "data";
}

/**
 * Check if a product is an airtime product
 */
export function isAirtimeProduct(product: ResellerProduct): boolean {
  return product.productType === "airtime";
}

/**
 * Safely convert denomAmount to a number
 */
export function convertDenomAmountToNumber(
  denomAmount: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (denomAmount === null || denomAmount === undefined) {
    return defaultValue;
  }

  if (typeof denomAmount === "number") {
    return denomAmount;
  }

  const parsed = parseFloat(denomAmount);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Resolve the customer-facing price for a product.
 */
export function getResolvedProductPrice(
  product: ResellerProduct
): number | null {
  if (typeof product.resolvedPrice === "number" && product.resolvedPrice > 0) {
    return product.resolvedPrice;
  }

  const denomPrice = convertDenomAmountToNumber(product.denomAmount, 0);
  return denomPrice > 0 ? denomPrice : null;
}

/**
 * Format price from denomAmount or discountedPrice
 */
export function getProductPrice(product: ResellerProduct): number | null {
  const resolvedPrice = getResolvedProductPrice(product);
  if (resolvedPrice !== null) {
    return resolvedPrice;
  }

  if (product.discountedPrice && product.discountedPrice > 0) {
    return product.discountedPrice;
  }

  return null;
}

/**
 * Get a UI-friendly status message for why a product cannot be purchased via Reseller API
 */
export function getProductPurchaseBlockReason(
  product: ResellerProduct
): string | null {
  if (!product.isActive) {
    return "Product is inactive";
  }

  if (isVariableAirtimeProduct(product)) {
    return "Variable airtime not yet supported for Reseller API";
  }

  if (!isFixedPriceProduct(product)) {
    return "Variable/range products are not supported for Reseller API";
  }

  return null;
}

/**
 * Filter products to only those eligible for Reseller API purchase
 */
export function filterFixedPriceProducts(
  products: ResellerProduct[]
): ResellerProduct[] {
  return products.filter(isFixedPriceProduct);
}

/**
 * Sort products for display (by price ascending)
 */
export function sortProductsByPrice(
  products: ResellerProduct[]
): ResellerProduct[] {
  return [...products].sort((a, b) => {
    const priceA = getProductPrice(a) ?? Infinity;
    const priceB = getProductPrice(b) ?? Infinity;
    return priceA - priceB;
  });
}

/**
 * Group products by operator for display
 */
export function groupProductsByOperator(
  products: ResellerProduct[]
): Map<string, ResellerProduct[]> {
  const grouped = new Map<string, ResellerProduct[]>();

  for (const product of products) {
    const operatorName = product.operator?.name || "Unknown";
    if (!grouped.has(operatorName)) {
      grouped.set(operatorName, []);
    }
    grouped.get(operatorName)!.push(product);
  }

  return grouped;
}
