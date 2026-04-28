import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HomeFooter, Navbar } from "../../components/layout";
import { useTranslation } from "../../i18n";
import { propertyService } from "../../services/property.service";

interface RoomEntry {
  id: string;
  title: string;
  file: File | null;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const PANORAMA_CAPTION_PREFIX = "__VR360__";

const buildRoomId = () =>
  `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function VirtualVisitFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useTranslation();
  const virtualVisitText = t.properties?.virtualVisit;

  const [rooms, setRooms] = useState<RoomEntry[]>([
    {
      id: buildRoomId(),
      title: "",
      file: null,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const extractApiErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== "object") {
      return "Upload failed";
    }

    const maybeError = error as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };

    const apiMessage = maybeError.response?.data?.message;
    if (Array.isArray(apiMessage) && apiMessage.length > 0) {
      return apiMessage.join(", ");
    }
    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }
    if (maybeError.message) {
      return maybeError.message;
    }

    return "Upload failed";
  };

  const addRoom = () => {
    setRooms((prev) => [
      ...prev,
      {
        id: buildRoomId(),
        title: "",
        file: null,
      },
    ]);
  };

  const updateRoomTitle = (roomId: string, title: string) => {
    setRooms((prev) =>
      prev.map((room) => (room.id === roomId ? { ...room, title } : room)),
    );
  };

  const updateRoomFile = (roomId: string, file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitError("Only image files are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setSubmitError("Each image must be 10MB or smaller.");
      return;
    }

    setSubmitError(null);
    setRooms((prev) =>
      prev.map((room) => (room.id === roomId ? { ...room, file } : room)),
    );
  };

  const removeRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
  };

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitError(null);

    const completedRooms = rooms.filter(
      (room) => Boolean(room.title.trim()) && Boolean(room.file),
    );
    const hasIncompleteRoom = rooms.some(
      (room) => Boolean(room.title.trim()) !== Boolean(room.file),
    );

    if (completedRooms.length === 0) {
      alert(
        t.properties?.form?.image?.virtualTour?.noImages ||
          "Please add at least one room with a title and panoramic image.",
      );
      return;
    }

    if (hasIncompleteRoom) {
      setSubmitError("Each room needs both a title and a panoramic image.");
      return;
    }

    setLoading(true);
    try {
      const uploadResult = await propertyService.uploadImages(
        id,
        completedRooms
          .map((room) => room.file)
          .filter((file): file is File => Boolean(file)),
      );

      await Promise.allSettled(
        uploadResult.addedImages.map((uploadedImage, index) => {
          const roomTitle = completedRooms[index]?.title?.trim();
          const caption = roomTitle
            ? `${PANORAMA_CAPTION_PREFIX}${roomTitle}`
            : "";
          if (!caption || !uploadedImage.key) return Promise.resolve();
          return propertyService.updateImageCaption(
            id,
            uploadedImage.key,
            caption,
          );
        }),
      );

      navigate(`/properties/${id}`);
    } catch (err) {
      console.error("Failed uploading virtual visit images", err);
      setSubmitError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <div className="property-form-page">
        <Navbar />
        <main className="property-form-container">
          <div className="property-form-header">
            <h1>Add Virtual Visit</h1>
            <p>Property id is missing in the URL.</p>
          </div>
        </main>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div className="property-form-page">
      <Navbar />
      <main className="property-form-container">
        <div className="property-form-header">
          <h1>{virtualVisitText?.page?.title || "Add Virtual Visit"}</h1>
          <p>
            {virtualVisitText?.page?.description ||
              "Add rooms with a title and one panoramic image for each room."}
          </p>
        </div>

        <div className="property-form virtual-visit-builder" role="form">
          <section className="form-section virtual-visit-intro">
            <h3 className="form-section-title">Room panorama builder</h3>
            <p>
              Add one panoramic image per room with a clear title. Visitors will
              browse these rooms in your fullscreen 360 tour.
            </p>
            <div className="virtual-visit-stats">
              <span>{rooms.length} room(s)</span>
              <span>
                {rooms.filter((room) => room.title.trim() && room.file).length}{" "}
                complete
              </span>
            </div>
          </section>

          <section className="form-section virtual-visit-rooms">
            {rooms.map((room, index) => (
              <article key={room.id} className="virtual-visit-room-card">
                <div className="virtual-visit-room-head">
                  <strong>Room {index + 1}</strong>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => removeRoom(room.id)}
                    disabled={rooms.length === 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="virtual-visit-room-grid">
                  <label>
                    Room title
                    <input
                      type="text"
                      value={room.title}
                      onChange={(e) => updateRoomTitle(room.id, e.target.value)}
                      placeholder="Kitchen, Bedroom 1, Living room..."
                    />
                  </label>

                  <label>
                    Panoramic image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateRoomFile(room.id, e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>

                {room.file && (
                  <div className="virtual-visit-room-preview">
                    <img
                      src={URL.createObjectURL(room.file)}
                      alt={room.title || `Room ${index + 1}`}
                    />
                  </div>
                )}
              </article>
            ))}

            <button
              type="button"
              className="btn-edit virtual-visit-add-room"
              onClick={addRoom}
            >
              + Add another room
            </button>

            {submitError && (
              <p
                role="alert"
                style={{ color: "#b42318", marginTop: "0.75rem" }}
              >
                {submitError}
              </p>
            )}

            <div className="virtual-visit-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(-1)}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? "Uploading..."
                  : virtualVisitText?.page?.actions?.upload ||
                    "Upload virtual visit"}
              </button>
            </div>
          </section>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
