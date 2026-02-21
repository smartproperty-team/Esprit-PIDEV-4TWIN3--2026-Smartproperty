// ===========================================
// SmartProperty - Settings Page
// ===========================================

import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HomeFooter, HomeNavbar } from "../../components/layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui";
import { useAuthStore } from "../../store";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <>
      <HomeNavbar />
      <div className="min-h-screen bg-gray-50 pt-24">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Security Settings
            </h1>
            <div className="w-32" />
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 2FA Setup Card */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-indigo-600" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                        <Shield className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900 text-lg">
                          {user?.twoFactorEnabled
                            ? "✓ 2FA is Enabled"
                            : "Secure Your Account"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {user?.twoFactorEnabled
                            ? "Your account is protected with two-factor authentication."
                            : "Enable two-factor authentication for extra security"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => navigate("/security/2fa")}
                      className="whitespace-nowrap"
                    >
                      {user?.twoFactorEnabled ? "Manage 2FA" : "Setup 2FA"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Other Security Options */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Security Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        Profile Settings
                      </p>
                      <p className="text-sm text-gray-600">
                        Edit your personal information
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate("/sessions")}
                    className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        Active Sessions
                      </p>
                      <p className="text-sm text-gray-600">
                        Manage your sessions
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <HomeFooter />
      </div>
    </>
  );
}
