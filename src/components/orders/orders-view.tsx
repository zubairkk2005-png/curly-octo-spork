"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrdersTable } from "./orders-table";

export function OrdersView() {
  const { ready, orders } = useAppData();
  if (!ready) return <Card><TableSkeleton rows={10} /></Card>;
  if (orders.length === 0) {
    return <EmptyState icon={Upload} title="No orders yet" description="Import a CSV of your Amazon or eBay orders to see every order's profit." action={<Button asChild><Link href="/import">Import orders</Link></Button>} />;
  }
  return <OrdersTable />;
}
