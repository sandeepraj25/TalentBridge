import { razorpayProvider } from "./providers/razorpay.js";
import { cashfreeProvider } from "./providers/cashfree.js";

const providers = {
  razorpay: razorpayProvider,
  cashfree: cashfreeProvider,
};

export function getProvider(name) {
  return providers[name] || null;
}
