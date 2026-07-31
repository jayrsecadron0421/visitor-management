export default function StatusBadge({ status }) {
  const isInside = status === "inside";

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors
      ${isInside 
        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
        : "bg-amber-50 text-amber-700 border-amber-200"}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isInside ? "bg-emerald-500" : "bg-amber-500"}`} />
      {isInside ? "INSIDE" : "EXITED"}
    </span>
  );
}