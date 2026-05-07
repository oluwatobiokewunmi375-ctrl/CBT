"use client";

import React, { useEffect, useState } from "react";
import { Plan } from "@/types/billing";
import { Check, X, Zap } from "lucide-react";

interface PlansShowcaseProps {
  plans: Plan[];
  currentPlan?: string;
  onSelectPlan: (planId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PlansShowcase({
  plans,
  currentPlan,
  onSelectPlan,
  isLoading = false,
}: PlansShowcaseProps) {
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  const featuresComparison = [
    { key: "maxUsers", label: "Maximum Users", type: "number" },
    { key: "maxExams", label: "Maximum Exams", type: "number" },
    { key: "maxQuestionsPerExam", label: "Max Questions/Exam", type: "number" },
    { key: "maxStorage", label: "Storage (MB)", type: "number" },
    { key: "enableVideoProctoring", label: "Video Proctoring", type: "boolean" },
    { key: "enableCustomBranding", label: "Custom Branding", type: "boolean" },
    { key: "enableAPI", label: "API Access", type: "boolean" },
    {
      key: "enableAdvancedAnalytics",
      label: "Advanced Analytics",
      type: "boolean",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
              currentPlan === plan.id
                ? "border-4 border-blue-600 ring-2 ring-blue-300"
                : "border border-gray-200"
            } ${plan.id === "PREMIUM" ? "md:scale-105" : ""}`}
          >
            {/* Header */}
            <div
              className={`p-6 text-white ${
                plan.id === "PREMIUM" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-800"
              }`}
            >
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-sm opacity-90 mt-1">{plan.description}</p>

              {plan.id === "PREMIUM" && (
                <div className="flex items-center gap-2 mt-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full w-fit">
                  <Zap size={16} />
                  <span className="text-sm font-bold">Popular</span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  ${(plan.price / 100).toFixed(2)}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Billed monthly</p>
            </div>

            {/* Features */}
            <div className="p-6 space-y-3">
              <div>
                <p className="font-bold text-gray-900 mb-3">Includes:</p>
                <ul className="space-y-2">
                  {Object.entries(plan.features)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <li key={key} className="flex items-center gap-2 text-sm">
                        <Check className="text-green-600" size={18} />
                        <span>
                          {value === true
                            ? "✓"
                            : `${value}`}{" "}
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => onSelectPlan(plan.id)}
                disabled={isLoading || currentPlan === plan.id}
                className={`w-full py-3 rounded-lg font-bold transition ${
                  currentPlan === plan.id
                    ? "bg-green-600 text-white"
                    : plan.id === "PREMIUM"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                {isLoading ? "Processing..." : currentPlan === plan.id ? "✓ Current Plan" : "Choose Plan"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Features Comparison Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold">Detailed Comparison</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-900">
                  Feature
                </th>
                {sortedPlans.map((plan) => (
                  <th
                    key={plan.id}
                    className="px-6 py-3 text-center font-bold text-gray-900"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featuresComparison.map((feature, index) => (
                <tr
                  key={feature.key}
                  className={`border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {feature.label}
                  </td>
                  {sortedPlans.map((plan) => (
                    <td
                      key={plan.id}
                      className="px-6 py-3 text-center"
                    >
                      {feature.type === "boolean" ? (
                        plan.features[feature.key as keyof typeof plan.features] ? (
                          <Check className="text-green-600 mx-auto" size={20} />
                        ) : (
                          <X className="text-red-600 mx-auto" size={20} />
                        )
                      ) : (
                        <span className="font-bold">
                          {
                            plan.features[
                              feature.key as keyof typeof plan.features
                            ]
                          }
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}