"use client";

import React from "react";
import { UsageStats } from "@/types/billing";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface UsageDashboardProps {
  usage: UsageStats;
}

export default function UsageDashboard({ usage }: UsageDashboardProps) {
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-orange-600";
    return "text-green-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-600";
    if (percentage >= 70) return "bg-orange-600";
    return "bg-green-600";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Usage</h2>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard
          title="Users"
          used={usage.users.used}
          limit={usage.users.limit}
          percentage={usage.users.percentage}
        />
        <UsageCard
          title="Exams"
          used={usage.exams.used}
          limit={usage.exams.limit}
          percentage={usage.exams.percentage}
        />
        <UsageCard
          title="Questions"
          used={usage.questions.used}
          limit={usage.questions.limit}
          percentage={usage.questions.percentage}
        />
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Features Included</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureItem
            name="Video Proctoring"
            enabled={usage.features.videoProctoring}
          />
          <FeatureItem
            name="Custom Branding"
            enabled={usage.features.customBranding}
          />
          <FeatureItem name="API Access" enabled={usage.features.api} />
          <FeatureItem
            name="Advanced Analytics"
            enabled={usage.features.advancedAnalytics}
          />
        </div>
      </div>

      {/* Upgrade CTA */}
      {Object.values(usage).some(
        (val) =>
          typeof val === "object" &&
          val.percentage &&
          val.percentage >= 80
      ) && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-orange-900">Approaching Limits</h4>
              <p className="text-sm text-orange-800 mt-1">
                You're approaching your plan limits. Consider upgrading to a
                higher plan to avoid interruptions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface UsageCardProps {
  title: string;
  used: number;
  limit: number;
  percentage: number;
}

function UsageCard({ title, used, limit, percentage }: UsageCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h4 className="font-bold text-gray-900 mb-4">{title}</h4>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            {used} / {limit}
          </span>
          <span className={`text-sm font-bold ${percentage >= 90 ? "text-red-600" : percentage >= 70 ? "text-orange-600" : "text-green-600"}`}>
            {percentage}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all ${
              percentage >= 90
                ? "bg-red-600"
                : percentage >= 70
                ? "bg-orange-600"
                : "bg-green-600"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {limit - used > 0
          ? `${limit - used} remaining`
          : "Limit reached"}
      </p>
    </div>
  );
}

interface FeatureItemProps {
  name: string;
  enabled: boolean;
}

function FeatureItem({ name, enabled }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
      {enabled ? (
        <CheckCircle className="text-green-600" size={20} />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
      )}
      <span className={enabled ? "text-gray-900" : "text-gray-400"}>
        {name}
      </span>
    </div>
  );
}