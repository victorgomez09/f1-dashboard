"use client"

export const MessageFeed = ({ messages }: { messages: any[] }) => {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg, i) => {
        // Lógica simple para resaltar banderas
        const isWarning = msg.Message.includes("YELLOW") || msg.Message.includes("INCIDENT");
        const isDanger = msg.Message.includes("RED FLAG") || msg.Message.includes("STOPPED");

        return (
          <div key={i} className={`text-[11px] leading-tight p-1.5 rounded border-l-2 ${
            isDanger ? 'bg-error/10 border-error' : 
            isWarning ? 'bg-warning/10 border-warning' : 'bg-base-content/5 border-base-content/20'
          }`}>
            <span className="opacity-40 mr-2 font-mono">
              {new Date(msg.Utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="font-medium uppercase">{msg.Message}</span>
          </div>
        );
      })}
    </div>
  );
};