
export default function ResultCard({ title, children, right }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-soft">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
        <h3 className="font-amiri text-lg font-bold">{title}</h3>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
