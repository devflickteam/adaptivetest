
import ResultCard from './ResultCard';
import StatusBadge from './StatusBadge';

export default function ResultsView({ report }) {
  const totalIssues = report?.summary?.issues ?? 0;
  const totalPages = report?.summary?.total_pages ?? report?.pages?.length ?? 0;

  return (
    <div className="space-y-6">
      <ResultCard
        title="Scan summary"
        right={
          <div className="flex gap-2">
            <StatusBadge tone={totalIssues > 0 ? 'red' : 'green'}>
              {totalIssues > 0 ? `${totalIssues} issues found` : 'No issues found'}
            </StatusBadge>
            <StatusBadge tone="gray">{totalPages} pages</StatusBadge>
          </div>
        }
      >
        <p className="text-sm text-gray-600">AI & rule-based accessibility scan completed.</p>
      </ResultCard>

      {report?.pages?.map((page, idx) => (
        <ResultCard
          key={idx}
          title={page.url}
          right={<StatusBadge tone={page.issues?.length ? 'red' : 'green'}>{page.issues?.length || 0} issues</StatusBadge>}
        >
          {page.issues?.length ? (
            <ul className="list-disc pl-6 space-y-1">
              {page.issues.map((it, i) => (
                <li key={i} className="text-red-700 text-sm">{it.type}{it.src ? ` → ${it.src}` : ''}</li>
              ))}
            </ul>
          ) : (
            <div className="text-green-700 text-sm">No issues detected</div>
          )}

          {page?.data?.images && (
            <div className="overflow-x-auto mt-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">Src</th>
                    <th className="py-2 pr-4">Alt</th>
                    <th className="py-2 pr-4">Contrast vs white</th>
                    <th className="py-2 pr-4">Contrast vs black</th>
                  </tr>
                </thead>
                <tbody>
                  {page.data.images.map((img, k) => (
                    <tr key={k} className="border-t border-black/5">
                      <td className="py-2 pr-4 max-w-[360px] truncate"><a className="text-blue-600 underline" href={img.src} target="_blank" rel="noreferrer">{img.src}</a></td>
                      <td className="py-2 pr-4">{img.alt || <span className="text-red-700 italic">(missing)</span>}</td>
                      <td className="py-2 pr-4">{img?.contrast?.contrast_vs_white?.toFixed ? img.contrast.contrast_vs_white.toFixed(2) : '-'}</td>
                      <td className="py-2 pr-4">{img?.contrast?.contrast_vs_black?.toFixed ? img.contrast.contrast_vs_black.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {Array.isArray(page?.data?.broken_links) && (
            <div className="mt-5">
              <h4 className="font-amiri font-semibold mb-2">Broken links</h4>
              {page.data.broken_links.length ? (
                <ul className="space-y-1">
                  {page.data.broken_links.map((bl, bi) => (
                    <li key={bi} className="text-sm text-red-700">
                      <a className="underline" href={bl.href} target="_blank" rel="noreferrer">{bl.href}</a>
                      {bl.status ? <span className="ml-2 text-xs bg-red-50 text-red-800 px-2 py-0.5 rounded">{bl.status}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-green-700 text-sm">None</div>
              )}
            </div>
          )}

          {page.gpt && (
            <div className="mt-5">
              <h4 className="font-amiri font-semibold mb-2">AI analysis</h4>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border border-black/5">{page.gpt}</pre>
            </div>
          )}
        </ResultCard>
      ))}
    </div>
  );
}
