"use client"

export const RadioFeed = ({ radios }: { radios: any[] }) => {
  return (
    <div className="space-y-2">
      {radios.length === 0 && <p className="text-[10px] opacity-30 italic">No hay transmisiones...</p>}
      {radios.map((radio, i) => (
        <div key={i} className="flex flex-col gap-1 p-2 bg-base-300 rounded border-l-2 border-primary">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold">DRIVER {radio.Utc.split('T')[1].slice(0, 8)}</span>
          </div>
          <audio controls className="w-full h-6 mt-1 scale-90 origin-left">
            <source src={radio.Path} type="audio/mpeg" />
          </audio>
        </div>
      ))}
    </div>
  );
};