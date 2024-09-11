import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EventString } from "@/app/api/events/route";
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-react";
import { Add } from "@/components/event/add-dialog";
import { Edit } from "@/components/event/edit-dialog";
import { Alert } from "./ui/alert";

interface AgendaProps {
  events: EventString[];
  onEventClick: (event: EventString) => void;
}

const NEXT_PUBLIC_GROUP_TOKEN: string | undefined =
  process.env.NEXT_PUBLIC_GROUP_TOKEN;

const Agenda: React.FC<AgendaProps> = ({
  events,
  onEventClick,
}: AgendaProps): ReactElement | null => {
  const calendarRef: React.RefObject<DayPilotCalendar> =
    useRef<DayPilotCalendar>(null);
  const [localEvents, setLocalEvents] = useState<EventString[]>(events);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<DayPilot.Date>(
    DayPilot.Date.today()
  );
  const [duration, setDuration] = useState<number>(60);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [eventToDelete, setEventToDelete] = useState<DayPilot.EventId | null>(
    null
  );
  const [eventToEdit, setEventToEdit] = useState<EventString | null>(null);

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

  const fetchEvents: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      try {
        const res: Response = await fetch("/api/events", {
          method: "GET",
          headers,
        });
        const data: any = await res.json();
        setLocalEvents(data);
      } catch (error) {
        console.error("Failed to fetch events", error);
      }
    }, [headers, setLocalEvents]);

  useEffect((): void => {
    if (typeof window !== "undefined" && calendarRef.current) {
      const dp: DayPilot.Calendar = calendarRef.current.control;
      dp.update({
        events: localEvents.map((event: EventString) => ({
          id: event.id,
          text: event.name,
          start: new Date(event.date).toISOString(),
          end: new Date(
            new Date(event.date).getTime() + event.duration * 60 * 1000
          ).toISOString(),
        })),
      });

      dp.onTimeRangeSelected = function (
        args: DayPilot.CalendarTimeRangeSelectedArgs
      ): void {
        setStartDate(args.start);
        setDuration(
          Math.round((args.end.getTime() - args.start.getTime()) / 60000)
        );
        setIsAddDialogOpen(true);
        dp.clearSelection();
      };

      dp.eventDeleteHandling = "Update";

      dp.onEventDelete = function (
        args: DayPilot.CalendarEventDeleteArgs
      ): void {
        setEventToDelete(args.e.id());
        setShowAlert(true);
        args.preventDefault();
      };

      dp.onEventClicked = function (
        args: DayPilot.CalendarEventClickedArgs
      ): void {
        const event: EventString | undefined = localEvents.find(
          (e: EventString): boolean => e.id === args.e.id()
        );
        if (event) {
          setEventToEdit(event);
          setIsEditDialogOpen(true);
        }
      };

      dp.onEventResized = async function (
        args: DayPilot.CalendarEventResizedArgs
      ): Promise<void> {
        const updatedEvent = {
          ...args.e.data,
          start: args.newStart.toString(),
          end: args.newEnd.toString(),
        };

        try {
          const res: Response = await fetch(`/api/events/${args.e.id()}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              date: new Date(
                new Date(updatedEvent.start).getTime() -
                  new Date().getTimezoneOffset() * 60 * 1000
              ).toISOString(),
              duration: Math.round(
                (new Date(updatedEvent.end).getTime() -
                  new Date(updatedEvent.start).getTime()) /
                  60000
              ),
            }),
          });

          if (res.ok) {
            fetchEvents();
          } else {
            console.error("Failed to update event: " + args.e.text());
          }
        } catch (error) {
          console.error("Failed to update event", error);
        }
      };

      dp.onEventMove = async function (
        args: DayPilot.CalendarEventMoveArgs
      ): Promise<void> {
        const updatedEvent = {
          ...args.e.data,
          start: args.newStart.toString(),
          end: args.newEnd.toString(),
        };

        try {
          const res: Response = await fetch(`/api/events/${args.e.id()}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              date: new Date(
                new Date(updatedEvent.start).getTime() -
                  new Date().getTimezoneOffset() * 60 * 1000
              ).toISOString(),
              duration: Math.round(
                (new Date(updatedEvent.end).getTime() -
                  new Date(updatedEvent.start).getTime()) /
                  60000
              ),
            }),
          });

          if (res.ok) {
            fetchEvents();
          } else {
            console.error("Failed to update event: " + args.e.text());
          }
        } catch (error) {
          console.error("Failed to update event", error);
        }
      };

      dp.onEventDeleted = async function (
        args: DayPilot.CalendarEventDeletedArgs
      ): Promise<void> {
        try {
          const res: Response = await fetch(`/api/events/${args.e.id()}`, {
            method: "DELETE",
            headers,
          });
          if (res.ok) {
            fetchEvents();
          } else {
            console.error("Failed to delete event: " + args.e.text());
          }
        } catch (error) {
          console.error("Failed to delete event", error);
        }
      };
    }
  }, [fetchEvents, headers, localEvents]);

  useEffect((): void => {
    if (!isAddDialogOpen && calendarRef.current) {
      const dp: DayPilot.Calendar = calendarRef.current.control;
      dp.update({
        events: localEvents.map((event: EventString) => ({
          id: event.id,
          text: event.name,
          start: new Date(event.date).toISOString(),
          end: new Date(
            new Date(event.date).getTime() + event.duration * 60 * 1000
          ).toISOString(),
        })),
      });
    }
  }, [isAddDialogOpen, localEvents]);

  const handleEventClick: (args: any) => void = (args: any): void => {
    const event: EventString | undefined = localEvents.find(
      (e: EventString): boolean => e.id === args.e.id()
    );
    if (event) {
      onEventClick(event);
    }
  };

  const handleAlertClose: () => void = (): void => {
    setShowAlert(false);
    setEventToDelete(null);
  };

  const handleAlertConfirm: () => Promise<void> = async (): Promise<void> => {
    if (eventToDelete) {
      try {
        const res: Response = await fetch(`/api/events/${eventToDelete}`, {
          method: "DELETE",
          headers,
        });
        if (res.ok) {
          fetchEvents();
        } else {
          console.error("Failed to delete event: " + eventToDelete);
        }
      } catch (error) {
        console.error("Failed to delete event", error);
      }
    }
    handleAlertClose();
  };

  const handleEditClose: () => void = (): void => {
    setIsEditDialogOpen(false);
    setEventToEdit(null);
  };

  const handleEditSuccess: () => void = (): void => {
    fetchEvents();
    handleEditClose();
  };

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div>
      <DayPilotCalendar
        ref={calendarRef}
        startDate={DayPilot.Date.today()}
        viewType="Week"
        onEventClick={handleEventClick}
      />
      {showAlert && (
        <Alert
          isOpen={showAlert}
          onClose={handleAlertClose}
          onConfirm={handleAlertConfirm}
        />
      )}
      <Add
        isOpen={isAddDialogOpen}
        onClose={(): void => setIsAddDialogOpen(false)}
        startDate={startDate}
        duration={duration}
        onSuccess={fetchEvents}
      />
      {eventToEdit && (
        <Edit
          isOpen={isEditDialogOpen}
          onClose={handleEditClose}
          startDate={new DayPilot.Date(eventToEdit.date)}
          duration={eventToEdit.duration}
          onSuccess={handleEditSuccess}
          event={eventToEdit}
        />
      )}
    </div>
  );
};

export default Agenda;
