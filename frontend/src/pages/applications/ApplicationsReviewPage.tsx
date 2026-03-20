import { AppSidebar, HomeFooter } from "@/components/layout";
import applicationService from "@/services/application.service";
import type { Application } from "@/types/application";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function ApplicationsReviewPage() {
  const [searchParams] = useSearchParams();
  const targetApplicationId = searchParams.get("applicationId") || "";

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [requestDocsText, setRequestDocsText] = useState<
    Record<string, string>
  >({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [viewingAt, setViewingAt] = useState<Record<string, string>>({});

  const items = useMemo(
    () =>
      [...applications].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    [applications],
  );

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationService.getReceivedApplications({
        page: 1,
        limit: 50,
      });
      setApplications(response.applications);
      setError(null);
    } catch {
      setError("Failed to load received applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  useEffect(() => {
    if (targetApplicationId && !loading) {
      const element = document.getElementById(`review-app-${targetApplicationId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-indigo-500", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2");
          }, 3000);
        }, 100);
      }
    }
  }, [targetApplicationId, loading]);

  const handleApprove = async (id: string) => {
    try {
      await applicationService.approveApplication(id);
      setNotice("Application approved.");
      await loadApplications();
    } catch {
      setError("Failed to approve application.");
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason[id]?.trim();
    if (!reason) {
      setError("Please provide a rejection reason.");
      return;
    }

    try {
      await applicationService.rejectApplication(id, reason);
      setNotice("Application rejected.");
      await loadApplications();
    } catch {
      setError("Failed to reject application.");
    }
  };

  const handleRequestDocs = async (id: string) => {
    const input = requestDocsText[id] || "";
    const requestedDocuments = input
      .split(",")
      .map((doc) => doc.trim())
      .filter(Boolean);

    if (!requestedDocuments.length) {
      setError("Add at least one requested document.");
      return;
    }

    try {
      await applicationService.requestAdditionalDocuments(
        id,
        requestedDocuments,
      );
      setNotice("Requested additional documents.");
      await loadApplications();
    } catch {
      setError("Failed to request documents.");
    }
  };

  const handleScheduleViewing = async (id: string) => {
    const value = viewingAt[id];
    if (!value) {
      setError("Please select a viewing date and time.");
      return;
    }

    try {
      await applicationService.scheduleViewing(
        id,
        new Date(value).toISOString(),
      );
      setNotice("Viewing scheduled.");
      await loadApplications();
    } catch {
      setError("Failed to schedule viewing.");
    }
  };

  return (
    <>
      <AppSidebar />
      <main className="min-h-screen bg-gray-50 px-4 pb-12 pt-20 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-7xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Received Applications
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Review tenant applications, request documents, approve or
                reject, and schedule viewings.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => void loadApplications()}
            >
              Refresh
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          {notice && (
            <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              {notice}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-600">
              No applications received yet.
            </p>
          ) : (
            <div className="space-y-6">
              {items.map((application) => {
                const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                  submitted: { bg: "bg-blue-50", text: "text-blue-700", label: "📋 Submitted" },
                  under_review: { bg: "bg-amber-50", text: "text-amber-700", label: "👀 Under Review" },
                  documents_requested: { bg: "bg-orange-50", text: "text-orange-700", label: "📄 Documents Requested" },
                  viewing_scheduled: { bg: "bg-purple-50", text: "text-purple-700", label: "📅 Viewing Scheduled" },
                  approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "✅ Approved" },
                  rejected: { bg: "bg-rose-50", text: "text-rose-700", label: "❌ Rejected" },
                  withdrawn: { bg: "bg-gray-50", text: "text-gray-700", label: "⏸️ Withdrawn" },
                };

                const colors = statusColors[application.status] || statusColors.submitted;

                return (
                  <article
                    key={application.id}
                    id={`review-app-${application.id}`}
                    className={`rounded-xl border-2 border-gray-200 p-6 transition-all ${colors.bg}`}
                  >
                    {/* Header with tenant name and status */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">
                          {application.tenantName || "Tenant"}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {application.tenantEmail}
                          {application.tenantPhone && ` • ${application.tenantPhone}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${colors.text}`}>
                          {colors.label}
                        </span>
                      </div>
                    </div>

                    {/* Property and employment info */}
                    <div className="mt-4 grid gap-4 rounded-lg bg-white p-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">Property</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {application.propertyTitle || "Property"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {application.propertyAddress}
                        </p>
                        {application.propertyPrice && (
                          <p className="mt-1 text-xs text-gray-700">
                            💰 €{application.propertyPrice.toLocaleString()}/month
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">Employment</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {application.employmentInfo.jobTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {application.employmentInfo.companyName}
                        </p>
                        <p className="mt-1 text-xs text-gray-700">
                          💼 €{application.employmentInfo.monthlyIncome.toLocaleString()}/month
                        </p>
                      </div>
                    </div>

                    {/* Uploaded Documents Section */}
                    {application.documents && application.documents.length > 0 && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-4">
                        <p className="mb-3 font-semibold text-blue-900">📂 Uploaded Documents</p>
                        <div className="space-y-2">
                          {application.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded border border-blue-200 bg-white px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              <span>📄</span>
                              <span className="flex-1 truncate font-medium">{doc.name}</span>
                              <span className="text-xs text-gray-500">
                                {(doc.size / 1024).toFixed(1)} KB
                              </span>
                              <span>↗️</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requested Documents Status */}
                    {application.requestedDocuments && application.requestedDocuments.length > 0 && (
                      <div className="mt-4 rounded-lg bg-yellow-50 p-4">
                        <p className="mb-2 font-semibold text-yellow-900">⏳ Documents Requested</p>
                        <p className="text-sm text-yellow-800">
                          {application.requestedDocuments.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Actions section */}
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1 rounded-lg bg-white p-3 text-sm text-gray-700">
                        <span className="font-semibold">📄 Request Documents</span>
                        <span className="text-xs text-gray-500">e.g.: Pay stubs, ID, bank statement</span>
                        <input
                          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
                          value={requestDocsText[application.id] || ""}
                          onChange={(e) =>
                            setRequestDocsText((prev) => ({
                              ...prev,
                              [application.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter document names separated by commas"
                        />
                      </label>

                      <label className="grid gap-1 rounded-lg bg-white p-3 text-sm text-gray-700">
                        <span className="font-semibold">📅 Schedule Viewing</span>
                        <span className="text-xs text-gray-500">When would you like to view?</span>
                        <input
                          type="datetime-local"
                          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
                          value={viewingAt[application.id] || ""}
                          onChange={(e) =>
                            setViewingAt((prev) => ({
                              ...prev,
                              [application.id]: e.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="grid gap-1 rounded-lg bg-white p-3 text-sm text-gray-700 md:col-span-2">
                        <span className="font-semibold">❌ Rejection Reason</span>
                        <span className="text-xs text-gray-500">Only fill if you plan to reject this application</span>
                        <textarea
                          className="min-h-16 mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
                          value={rejectReason[application.id] || ""}
                          onChange={(e) =>
                            setRejectReason((prev) => ({
                              ...prev,
                              [application.id]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800"
                      onClick={() => void handleApprove(application.id)}
                    >
                      ✅ Approve Application
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-100 active:bg-amber-200"
                      onClick={() => void handleRequestDocs(application.id)}
                    >
                      📄 Request Documents
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border-2 border-purple-400 bg-purple-50 px-4 py-3 font-semibold text-purple-700 transition-colors hover:bg-purple-100 active:bg-purple-200"
                      onClick={() => void handleScheduleViewing(application.id)}
                    >
                      📅 Schedule Viewing
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border-2 border-rose-400 bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition-colors hover:bg-rose-100 active:bg-rose-200"
                      onClick={() => void handleReject(application.id)}
                    >
                      ❌ Reject Application
                    </button>
                  </div>
                </article>
              );
              })}
            </div>
          )}
        </div>
      </main>
      <HomeFooter />
    </>
  );
}
