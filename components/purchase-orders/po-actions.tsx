"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
  useDeletePurchaseOrder,
} from "@/hooks/use-purchase-orders";
import type { PurchaseOrderStatus } from "@/types/purchase-orders";

interface PoActionsProps {
  poId: string;
  poNumber: string;
  status: PurchaseOrderStatus;
}

export function PoActions({ poId, poNumber, status }: PoActionsProps) {
  const router = useRouter();
  const [confirmReceive, setConfirmReceive] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const receive = useReceivePurchaseOrder();
  const cancel = useCancelPurchaseOrder();
  const deletePO = useDeletePurchaseOrder();

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {status === "pending" && (
          <>
            <Button size="sm" onClick={() => setConfirmReceive(true)}>
              <PackageCheck className="mr-2 h-4 w-4" />
              Receive Stock
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Modal
        open={confirmReceive}
        onOpenChange={setConfirmReceive}
        title="Receive Stock"
        description={`Mark "${poNumber}" as received? Stock quantities for every item will be added to inventory immediately.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmReceive(false)}>
            Cancel
          </Button>
          <Button
            disabled={receive.isPending}
            onClick={async () => {
              await receive.mutateAsync(poId);
              setConfirmReceive(false);
              router.refresh();
            }}
          >
            {receive.isPending ? "Receiving..." : "Confirm Receive"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel Purchase Order"
        description={`Cancel "${poNumber}"? This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmCancel(false)}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            disabled={cancel.isPending}
            onClick={async () => {
              await cancel.mutateAsync(poId);
              setConfirmCancel(false);
              router.refresh();
            }}
          >
            {cancel.isPending ? "Cancelling..." : "Cancel Order"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Purchase Order"
        description={`Permanently delete "${poNumber}"? This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deletePO.isPending}
            onClick={async () => {
              await deletePO.mutateAsync(poId);
              setConfirmDelete(false);
              router.push("/purchase-orders");
            }}
          >
            {deletePO.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
