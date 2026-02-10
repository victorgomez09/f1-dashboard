"use client"

export const WeatherBar = ({ data }: { data: any }) => {
  if (!data) return null;
  return (
    <div className="flex gap-6 px-4 py-1 bg-base-300 text-[10px] font-bold uppercase border-b border-white/5 overflow-x-auto">
      <div className="flex items-center gap-2">
        <span className="opacity-50">Air</span>
        <span className="text-primary">{data.AirTemp}°C</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="opacity-50">Track</span>
        <span className="text-orange-400">{data.TrackTemp}°C</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="opacity-50">Humidity</span>
        <span>{data.Humidity}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="opacity-50">Rain</span>
        <span className={data.Rainfall !== "0" ? "text-blue-400" : ""}>
          {data.Rainfall === "0" ? "NO" : "YES"}
        </span>
      </div>
    </div>
  );
};