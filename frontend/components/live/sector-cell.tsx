"use client"

export const SectorCell = ({ value, isFastest, isPersonalBest }: any) => {
  let textColor = "text-base-content/60";
  if (isFastest) textColor = "text-purple-500 font-bold";
  else if (isPersonalBest) textColor = "text-green-500 font-bold";

  return (
    <td className={`font-mono text-[11px] ${textColor}`}>
      {value || "-"}
    </td>
  );
};