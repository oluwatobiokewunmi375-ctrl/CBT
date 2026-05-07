import { useState, useEffect } from "react";
import { Plan, Subscription, UsageStats, Invoice } from "@/types/billing";

export const useBilling = (accessToken: string) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/plans");

      if (!response.ok) throw new Error("Failed to fetch plans");

      const data = await response.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription details
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/subscription", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error("Failed to fetch subscription");

      const data = await response.json();
      setSubscription(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch usage stats
  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/billing/usage", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error("Failed to fetch usage");

      const data = await response.json();
      setUsage(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Create checkout session
  const createCheckout = async (planId: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) throw new Error("Failed to create checkout");

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update plan
  const updatePlan = async (planId: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/update-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) throw new Error("Failed to update plan");

      const data = await response.json();
      await fetchSubscription();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error("Failed to cancel subscription");

      const data = await response.json();
      await fetchSubscription();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Open billing portal
  const openBillingPortal = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error("Failed to open billing portal");

      const data = await response.json();
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    plans,
    subscription,
    usage,
    loading,
    error,
    setError,
    fetchPlans,
    fetchSubscription,
    fetchUsage,
    createCheckout,
    updatePlan,
    cancelSubscription,
    openBillingPortal,
  };
};