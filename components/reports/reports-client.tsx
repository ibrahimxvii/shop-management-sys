"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { SalesReport } from "./sales-report";
import { InventoryReport } from "./inventory-report";
import { OrdersReport } from "./orders-report";
import { CustomersReport } from "./customers-report";

export function ReportsClient() {
  return (
    <Tabs defaultValue="sales">
      <TabsList className="mb-4">
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
      </TabsList>

      <TabsContent value="sales">
        <Card variant="elevated" padding="default">
          <CardContent>
            <SalesReport />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="inventory">
        <Card variant="elevated" padding="default">
          <CardContent>
            <InventoryReport />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders">
        <Card variant="elevated" padding="default">
          <CardContent>
            <OrdersReport />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="customers">
        <Card variant="elevated" padding="default">
          <CardContent>
            <CustomersReport />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
