import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const DashboardPage = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getDisplayName = () => {
    if (user?.nombre) {
      return user.nombre;
    }
    return user?.username || "";
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {getDisplayName()} 👋
        </h1>
        <p className="mt-2 text-gray-600 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {currentTime.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          -{" "}
          {currentTime.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};
