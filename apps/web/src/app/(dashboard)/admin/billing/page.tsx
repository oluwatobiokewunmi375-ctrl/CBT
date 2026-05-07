"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBilling } from "@/hooks/useBilling";
import PlansShowcase from "@/components/billing/PlansShowcase";
import UsageDashboard from "@/components/billing/UsageDashboard";
import { Loader, Settings, Download } from "lucide-react";

export default function BillingPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const {
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
    openBillingPortal,
  } = useBilling(accessToken || "");

  const [activeTab, setActiveTab] = useState<"plans" | "usage" | "invoices">(
    "plans"
  );

  useEffect(() => {
    if (!user || user.role !== "SCHOOL_ADMIN") {
      router.push("/");
      return;
    }

    if (!accessToken) return;

    const loadData = async () => {
      await fetchPlans();
      await fetchSubscription();
      await fetchUsage();
    };

    loadData();
  }, [accessToken, user, router, fetchPlans, fetchSubscription, fetchUsage]);

  const handleSelectPlan = async (planId: string) => {
    const result = await createCheckout(planId);

    if (result?.url) {
      window.location.href = result.url;
    } else if (result?.sessionId === "free_plan") {
      await fetchSubscription();
      await fetchUsage();
    }
  };

  if (!user || user.role !== "SCHOOL_ADMIN") {
    return null;
  }

  if (loading && !subscription) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
          <p className="text-gray-600 mt-1">
            {subscription?.plan ? `Current Plan: ${subscription.plan}` : "No active plan"}
          </p>
        </div>

        <button
          onClick={() => openBillingPortal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Settings size={20} />
          Manage Billing
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-sm text-red-600 hover:underline mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {["plans", "usage", "invoices"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 border-b-2 transition capitalize ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "plans" && plans.length > 0 && (
          <PlansShowcase
            plans={plans}
            currentPlan={subscription?.plan.toLowerCase()}
            onSelectPlan={handleSelectPlan}
            isLoading={loading}
          />
        )}

        {activeTab === "usage" && usage && (
          <UsageDashboard usage={usage} />
        )}

        {activeTab === "invoices" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Invoices</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}