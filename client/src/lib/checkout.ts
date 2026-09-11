import { api } from "./api";

export type GatewayCheckout = {
  gateway: "razorpay" | "cashfree";
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  paymentSessionId?: string;
  mode?: "sandbox" | "production";
};

export type CreatePaymentResponse = {
  orderId: string;
  invoiceNo: string;
  amount: number;
  currency: string;
  plan: { id: string; name: string };
  checkout: GatewayCheckout;
};

type VerifyPayload = {
  orderId: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as HTMLScriptElement & { dataset: { loaded?: string } }).dataset.loaded === "1" || (window as any).Razorpay || (window as any).Cashfree) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load payment checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error("Could not load payment checkout."));
    document.body.appendChild(script);
  });
}

async function openRazorpay(created: CreatePaymentResponse): Promise<VerifyPayload | "cancelled"> {
  await loadScript("https://checkout.razorpay.com/v1/checkout.js", "razorpay-checkout");
  const Razorpay = (window as any).Razorpay;
  if (!Razorpay) throw new Error("Could not load payment checkout.");
  const checkout = created.checkout;

  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency || "INR",
      name: checkout.name || "Plan",
      description: checkout.description || "",
      order_id: checkout.orderId,
      prefill: checkout.prefill || {},
      handler(response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
        resolve({
          orderId: created.orderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() {
          resolve("cancelled");
        },
      },
    });
    rzp.on("payment.failed", () => {
      resolve("cancelled");
    });
    try {
      rzp.open();
    } catch (err) {
      reject(err);
    }
  });
}

async function openCashfree(created: CreatePaymentResponse): Promise<VerifyPayload | "cancelled"> {
  await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js", "cashfree-checkout");
  const Cashfree = (window as any).Cashfree;
  if (!Cashfree) throw new Error("Could not load payment checkout.");
  const checkout = created.checkout;
  const cashfree = await Cashfree({ mode: checkout.mode === "production" ? "production" : "sandbox" });
  const result = await cashfree.checkout({
    paymentSessionId: checkout.paymentSessionId,
    redirectTarget: "_modal",
  });
  if (result?.error) {
    const msg = result.error.message || result.error.code;
    if (String(msg || "").toLowerCase().includes("cancel") || result.error.code === "USER_DROPPED") {
      return "cancelled";
    }
    throw new Error(typeof msg === "string" ? msg : "Payment could not be completed.");
  }
  if (result?.paymentDetails || result?.redirect === false) {
    return { orderId: created.orderId };
  }
  return { orderId: created.orderId };
}

export async function startPlanCheckout(created: CreatePaymentResponse) {
  const gateway = created.checkout?.gateway;
  let payload: VerifyPayload | "cancelled";
  if (gateway === "razorpay") payload = await openRazorpay(created);
  else if (gateway === "cashfree") payload = await openCashfree(created);
  else throw new Error("No payment gateway is configured. Please contact support.");

  if (payload === "cancelled") {
    await api.post("/payments/cancel", { orderId: created.orderId }).catch(() => undefined);
    throw new Error("Payment was cancelled.");
  }

  return api.post<{
    orderId: string;
    paymentStatus: string;
    approvalStatus: string;
    message: string;
  }>("/payments/verify", payload);
}
