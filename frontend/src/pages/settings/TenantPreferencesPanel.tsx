import * as Slider from "@radix-ui/react-slider";
import { useEffect, useState } from "react";
import LocationPreferenceMap from "../../components/settings/LocationPreferenceMap";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui";
import { authService } from "../../services";
import { useAuthStore, usePreferencesStore } from "../../store";
import {
  UserRole,
  type UserLocationPreference,
  type UserNotificationPreferences,
} from "../../types/auth";

const PROPERTY_TYPE_OPTIONS = [
  "Apartment",
  "House",
  "Studio",
  "Villa",
  "Office",
];

export default function TenantPreferencesPanel() {
  const { user } = useAuthStore();
  const { getUserPreferences, setUserPreferences } = usePreferencesStore();
  const isTenant = user?.role === UserRole.TENANT;

  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState(500);
  const [maxBudget, setMaxBudget] = useState(3000);
  const [locations, setLocations] = useState("");
  const [locationPreference, setLocationPreference] =
    useState<UserLocationPreference>({
      label: "",
      radiusKm: 11,
    });
  const [notifications, setNotifications] =
    useState<UserNotificationPreferences>({
      email: true,
      sms: false,
      push: true,
    });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!user || !isTenant) {
      return;
    }

    const localPreferences = getUserPreferences(user.id);
    setPropertyTypes(localPreferences.propertyTypes);
    setMinBudget(localPreferences.budgetRange[0]);
    setMaxBudget(localPreferences.budgetRange[1]);
    setLocations(localPreferences.locations);
    setLocationPreference(
      localPreferences.locationPreference ?? {
        label: localPreferences.locations,
        radiusKm: 11,
      },
    );
    setNotifications(localPreferences.notifications);

    let isCancelled = false;
    const loadPreferences = async () => {
      setIsLoadingPreferences(true);
      try {
        const serverPreferences = await authService.getPreferences();
        if (isCancelled) {
          return;
        }
        setUserPreferences(user.id, serverPreferences);
        setPropertyTypes(serverPreferences.propertyTypes);
        setMinBudget(serverPreferences.budgetRange[0]);
        setMaxBudget(serverPreferences.budgetRange[1]);
        setLocations(serverPreferences.locations);
        setLocationPreference(
          serverPreferences.locationPreference ?? {
            label: serverPreferences.locations,
            radiusKm: 11,
          },
        );
        setNotifications(serverPreferences.notifications);
      } catch {
        if (!isCancelled) {
          setPreferencesMessage({
            type: "error",
            text: "Could not load latest preferences from server.",
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPreferences(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      isCancelled = true;
    };
  }, [getUserPreferences, isTenant, setUserPreferences, user]);

  const togglePropertyType = (propertyType: string) => {
    setPropertyTypes((currentPropertyTypes) => {
      if (currentPropertyTypes.includes(propertyType)) {
        return currentPropertyTypes.filter((type) => type !== propertyType);
      }
      return [...currentPropertyTypes, propertyType];
    });
  };

  const handleNotificationToggle = (
    notificationType: keyof UserNotificationPreferences,
  ) => {
    setNotifications((currentNotifications) => ({
      ...currentNotifications,
      [notificationType]: !currentNotifications[notificationType],
    }));
  };

  const handleBudgetRangeChange = (value: number[]) => {
    if (value.length !== 2) {
      return;
    }
    setMinBudget(Math.min(value[0], value[1]));
    setMaxBudget(Math.max(value[0], value[1]));
  };

  const handleSavePreferences = async () => {
    if (!user || !isTenant) {
      return;
    }

    setIsSavingPreferences(true);
    setPreferencesMessage(null);
    try {
      const serverPreferences = await authService.updatePreferences({
        propertyTypes,
        budgetRange: [minBudget, maxBudget],
        locations: locations.trim(),
        locationPreference: {
          ...locationPreference,
          label: locations.trim(),
        },
        notifications,
        completed: true,
        skipped: false,
      });
      setUserPreferences(user.id, serverPreferences);
      setPreferencesMessage({
        type: "success",
        text: "Preferences saved successfully.",
      });
    } catch {
      setPreferencesMessage({
        type: "error",
        text: "Failed to save preferences. Please try again.",
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (!isTenant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Property preferences are currently available for tenant accounts
            only.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferencesMessage && (
          <Alert
            type={preferencesMessage.type}
            message={preferencesMessage.text}
            onClose={() => setPreferencesMessage(null)}
          />
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Property type preferences
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={propertyTypes.includes(option)}
                  onChange={() => togglePropertyType(option)}
                  className="h-4 w-4 rounded border-gray-300 text-home-primary focus:ring-home-primary"
                />
                {option}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Budget range preferences
            </h3>
            <span className="text-sm text-gray-600">
              ${minBudget.toLocaleString()} - ${maxBudget.toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <Slider.Root
              className="relative flex h-6 w-full touch-none select-none items-center"
              min={500}
              max={10000}
              step={100}
              minStepsBetweenThumbs={1}
              value={[minBudget, maxBudget]}
              onValueChange={handleBudgetRangeChange}
            >
              <Slider.Track className="relative h-2 grow rounded-full bg-gray-200">
                <Slider.Range className="absolute h-full rounded-full bg-home-primary" />
              </Slider.Track>
              <Slider.Thumb className="block h-5 w-5 rounded-full border border-home-primary bg-white shadow focus:outline-none focus:ring-2 focus:ring-home-primary" />
              <Slider.Thumb className="block h-5 w-5 rounded-full border border-home-primary bg-white shadow focus:outline-none focus:ring-2 focus:ring-home-primary" />
            </Slider.Root>
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>$500</span>
              <span>$10,000</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Location preferences
          </h3>
          <LocationPreferenceMap
            value={locations}
            onChange={setLocations}
            selection={locationPreference}
            onSelectionChange={setLocationPreference}
            disabled={isLoadingPreferences || isSavingPreferences}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Notification preferences
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { key: "email", label: "Email" },
                { key: "sms", label: "SMS" },
                { key: "push", label: "Push" },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => handleNotificationToggle(item.key)}
                  className="h-4 w-4 rounded border-gray-300 text-home-primary focus:ring-home-primary"
                />
                {item.label}
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            onClick={handleSavePreferences}
            isLoading={isSavingPreferences || isLoadingPreferences}
          >
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
