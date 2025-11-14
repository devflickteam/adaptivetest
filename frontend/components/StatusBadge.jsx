
export default function StatusBadge({ tone = 'gray', children }) {
  const tones = {
    green: 'bg-green-50 text-green-800 border-green-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${tones[tone]}`}>
      {children}
    </span>
  );
}
