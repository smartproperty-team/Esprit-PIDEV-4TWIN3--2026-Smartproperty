// ===========================================
// SmartProperty - Application History Page
// ===========================================

import { AppSidebar, HomeFooter } from "@/components/layout";
import { Alert, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useTranslation } from "@/i18n";
import applicationService from "@/services/application.service";
import { ApplicationStatus, type Application } from "@/types/application";
import { isTenant } from "@/utils";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ACTIVE_APPLICATION_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.DOCUMENTS_REQUESTED,
  ApplicationStatus.VIEWING_SCHEDULED,
]);

const statusLabel: Record<ApplicationStatus, string> = {
  submitted: "No response yet",
  under_review: "No response yet",
  documents_requested: "No response yet",
  viewing_scheduled: "No response yet",
  approved: "Approved",
  rejected: "Disapproved",
  withdrawn: "Withdrawn",
};

const statusClasses: Record<ApplicationStatus, string> = {
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-700",
  documents_requested: "border-orange-200 bg-orange-50 text-orange-700",
  viewing_scheduled: "border-violet-200 bg-violet-50 text-violet-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  withdrawn: "border-slate-200 bg-slate-50 text-slate-700",
};

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ApplicationSummaryCard({
  application,
}: {
  application: Application;
}) {
  const label = statusLabel[application.status] || application.status;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {application.propertyTitle || "Property application"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Submitted {formatDate(application.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[application.status]}`}
        >
          {label}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Property</p>
          <p className="mt-1 font-medium text-gray-900">
            {application.propertyAddress || "Address not available"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
          <p className="mt-1 font-medium text-gray-900">{label}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Owner</p>
          <p className="mt-1 font-medium text-gray-900">
            {application.ownerName || "Not available"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Updated</p>
          <p className="mt-1 font-medium text-gray-900">
            {formatDate(application.updatedAt)}
          </p>
        </div>
      </div>

      {application.rejectionReason && application.status === ApplicationStatus.REJECTED && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">Disapproval reason</p>
          <p className="mt-1">{application.rejectionReason}</p>
        </div>
      )}

      {application.withdrawnReason && application.status === ApplicationStatus.WITHDRAWN && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">Withdrawn reason</p>
          <p className="mt-1">{application.withdrawnReason}</p>
        </div>
      )}
    </article>
  );
}

export default function ApplicationHistoryPage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await applicationService.getMyApplicationHistory({
          page: 1,
          limit: 100,
        });

        if (!isMounted) {
          return;
        }

        setApplications(response.applications);
        setError(null);
      } catch {
        if (isMounted) {
          setApplications([]);
          setError("Failed to load your application history.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const { currentApplications, pastApplications } = useMemo(() => {
    const current = applications.filter((application) =>
      ACTIVE_APPLICATION_STATUSES.has(application.status),
    );
    const past = applications.filter(
      (application) => !ACTIVE_APPLICATION_STATUSES.has(application.status),
    );

    return {
      currentApplications: current,
      pastApplications: past,
    };
  }, [applications]);

  const totalApplications = applications.length;

  return (
    <>
      <AppSidebar />
      <main className="min-h-screen bg-gray-50 px-4 pb-12 pt-20 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-lg sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Tenant portal
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Application History
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
                  Review your active applications and past applications in one
                  place. Active applications are shown as no response yet until
                  the landlord or manager makes a decision.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                onClick={() => navigate("/applications")}
              >
                Start new application
              </button>
            </div>
          </section>

          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>All applications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-gray-900">
                  {loading ? "…" : totalApplications}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Current</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-blue-700">
                  {loading ? "…" : currentApplications.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-emerald-700">
                  {loading ? "…" : pastApplications.length}
                </p>
              </CardContent>
            </Card>
          </section>

          {!isTenant(undefined) && null}

          {loading ? (
            <Card>
              <CardContent className="p-6 text-sm text-gray-600">
                Loading your applications...
              </CardContent>
            </Card>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  No applications yet
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Once you submit an application, its status will appear here.
                </p>
                <Link
                  to="/applications"
                  className="mt-5 inline-flex rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Submit an application
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    Current applications
                  </h2>
                  <span className="text-sm text-gray-500">
                    No response yet until reviewed
                  </span>
                </div>
                <div className="space-y-4">
                  {currentApplications.length > 0 ? (
                    currentApplications.map((application) => (
                      <ApplicationSummaryCard
                        key={application.id}
                        application={application}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-sm text-gray-600">
                        No current applications waiting for a response.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    Past applications
                  </h2>
                  <span className="text-sm text-gray-500">
                    Approved, disapproved, or withdrawn
                  </span>
                </div>
                <div className="space-y-4">
                  {pastApplications.length > 0 ? (
                    pastApplications.map((application) => (
                      <ApplicationSummaryCard
                        key={application.id}
                        application={application}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-sm text-gray-600">
                        You do not have any completed applications yet.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <HomeFooter />
    </>
  );
}