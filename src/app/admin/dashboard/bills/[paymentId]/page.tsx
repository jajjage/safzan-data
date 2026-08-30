"use client";

import { BillPaymentDetailView } from "@/components/features/admin/bills/BillPaymentDetailView";
import React, { useState } from "react";

interface BillPaymentDetailPageProps {
  params: Promise<{
    paymentId: string;
  }>;
}

export default function BillPaymentDetailPage({
  params,
}: BillPaymentDetailPageProps) {
  const [paymentId, setPaymentId] = useState<string>("");

  React.useEffect(() => {
    params.then(({ paymentId }) => setPaymentId(paymentId));
  }, [params]);

  if (!paymentId) {
    return null;
  }

  return <BillPaymentDetailView paymentId={paymentId} />;
}
