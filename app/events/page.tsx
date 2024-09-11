"use client";

import React, { ReactElement, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { EventString } from "../api/events/route";
import Agenda from "@/components/agenda";
import UpAppearTransition from "@/components/UpAppearTransition";
import { MapProps } from "@/components/map";

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

const Map: React.ComponentType<MapProps> = dynamic(
  () => import("@/components/map"),
  { ssr: false }
);

const EventsPage: () => ReactElement = (): ReactElement => {
  const [events, setEvents] = useState<EventString[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<EventString | null>(null);

  const headers: HeadersInit = useMemo((): Record<string, string> => {
    const headersInit: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (NEXT_PUBLIC_GROUP_TOKEN) {
      headersInit["X-Group-Authorization"] = NEXT_PUBLIC_GROUP_TOKEN;
    } else {
      throw new Error("Group token is not set.");
    }

    return headersInit;
  }, []);

  useEffect((): void => {
    const fetchEvents: () => Promise<void> = async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/events", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [headers]);

  const handleEventClick = (event: EventString): void => {
    setSelectedEvent(event);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(0, 0, 0, 0.1)",
            borderLeftColor: "#007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <UpAppearTransition>
      <div
        style={{
          padding: "16px",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div className="my-4">
          <h1 className="text-2xl font-bold text-black sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-center mx-auto">
            Events
          </h1>
        </div>
        <div className="my-8"></div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: "32px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 48%",
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              overflowY: "auto",
              maxHeight: "600px",
              zIndex: 1,
            }}
          >
            <Agenda events={events} onEventClick={handleEventClick} />
          </div>
          <div
            style={{
              flex: "1 1 48%",
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {selectedEvent ? (
              <div style={{ position: "relative", zIndex: 1000 }}>
                <h2
                  style={{
                    fontSize: "1.75rem",
                    marginBottom: "16px",
                    color: "#333",
                  }}
                >
                  {selectedEvent.name}
                </h2>
                <p>
                  Registered Participants:{" "}
                  {selectedEvent.registered_participants} /{" "}
                  {selectedEvent.max_participants}
                </p>
                <p style={{ color: "#777" }}>
                  Location: {selectedEvent.location_name}
                </p>
                <div
                  style={{
                    marginTop: "16px",
                    height: "400px",
                    position: "relative",
                  }}
                >
                  <Map
                    latitude={parseFloat(selectedEvent.location_x)}
                    longitude={parseFloat(selectedEvent.location_y)}
                    locationName={selectedEvent.location_name}
                  />
                </div>
                <button
                  style={{
                    marginTop: "16px",
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                  onClick={() => setSelectedEvent(null)}
                >
                  Deselect Event
                </button>
              </div>
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: "#777",
                  fontSize: "1.2rem",
                }}
              >
                Select an event to see details
              </p>
            )}
          </div>
        </div>
      </div>
    </UpAppearTransition>
  );
};

export default EventsPage;
