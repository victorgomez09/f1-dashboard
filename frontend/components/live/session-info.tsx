"use client"

export const SessionHeader = ({ info, trackStatus }: { info: any, trackStatus: any }) => {
  if (!info) return null;

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-black border-b border-white/10">
      <div>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">
          {info.meetingName} <span className="text-primary">— {info.sessionName}</span>
        </h1>
        <div className="flex gap-4 mt-1">
          <span className="text-[10px] font-mono opacity-50 uppercase">Live Telemetry</span>
          {trackStatus && (
            <span className={`text-[10px] font-bold px-2 rounded ${
              trackStatus.Status === "1" ? "bg-green-600" : "bg-yellow-500 text-black"
            }`}>
              {trackStatus.Message}
            </span>
          )}
        </div>
      </div>

      {/* Reloj de sesión o tiempo restante */}
      <div className="text-right">
        <div className="text-2xl font-mono font-bold">
          {/* Aquí podrías calcular el tiempo restante usando info.endDate */}
          LIVE
        </div>
      </div>
    </div>
  );
};