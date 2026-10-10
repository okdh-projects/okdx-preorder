import { Plus, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { newSizeChart, type SizeChart as Chart } from "../lib/sizeChart";

export function SizeChartTable({ chart }: { chart: Chart | null }) {
  if (!chart || !chart.rows.some((row) => row.some((cell) => cell.trim()))) return null;
  return (
    <section className="mt-8 min-w-0 border-t border-border pt-6" aria-label={chart.title || "Размерная сетка"}>
      <h2 className="text-lg font-bold">{chart.title || "Размерная сетка"}</h2>
      <div className="mt-3 max-w-full overflow-x-auto rounded-md border border-border" tabIndex={0}>
        <table className="w-full text-left font-mono text-xs">
          <caption className="sr-only">{chart.title || "Размерная сетка"}</caption>
          <thead className="bg-muted text-muted-foreground">
            <tr>{chart.columns.map((column, i) => <th key={i} scope="col" className="min-w-24 whitespace-pre-wrap break-words border-b border-border px-3 py-3 font-medium">{column}</th>)}</tr>
          </thead>
          <tbody>
            {chart.rows.filter((row) => row.some((cell) => cell.trim())).map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {row.map((cell, j) => j === 0
                  ? <th key={j} scope="row" className="whitespace-pre-wrap break-words px-3 py-3 font-medium">{cell || "—"}</th>
                  : <td key={j} className="whitespace-pre-wrap break-words px-3 py-3">{cell || "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chart.note && <p className="mt-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">{chart.note}</p>}
    </section>
  );
}

export function SizeChartEditor({ value, onChange }: { value: Chart | null; onChange: (chart: Chart | null) => void }) {
  const field = "w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground";
  const tool = "border border-border bg-background text-foreground hover:bg-muted";
  return (
    <section className="min-w-0 border-t border-border pt-4" aria-label="Редактор размерной сетки">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-xs uppercase text-muted-foreground">Размерная сетка</h3>
        {value ? <Button type="button" size="icon" variant="ghost" className={tool} title="Удалить размерную сетку" aria-label="Удалить размерную сетку" onClick={() => onChange(null)}><Trash2 /></Button>
          : <Button type="button" size="sm" onClick={() => onChange(newSizeChart())}><Plus /> Добавить таблицу</Button>}
      </div>
      {value && <div className="mt-3 space-y-3">
        <label className="block text-xs text-muted-foreground">Заголовок таблицы<input aria-label="Заголовок таблицы" className={`${field} mt-1`} value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} /></label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="ghost" className={tool} onClick={() => onChange({ ...value, rows: [...value.rows, value.columns.map(() => "")] })}><Plus /> Строка</Button>
          <Button type="button" size="sm" variant="ghost" className={tool} onClick={() => onChange({ ...value, columns: [...value.columns, ""], rows: value.rows.map((row) => [...row, ""]) })}><Plus /> Столбец</Button>
        </div>
        <div className="max-w-full overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left">
            <thead className="bg-muted"><tr>
              {value.columns.map((column, i) => <th key={i} className="min-w-36 p-2">
                <div className="flex items-center gap-1">
                  <input aria-label={`Название столбца ${i + 1}`} className={field} value={column} onChange={(e) => onChange({ ...value, columns: value.columns.map((c, j) => j === i ? e.target.value : c) })} />
                  <Button type="button" size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:bg-background hover:text-foreground" disabled={value.columns.length === 1} title={`Удалить столбец ${i + 1}`} aria-label={`Удалить столбец ${i + 1}`} onClick={() => onChange({ ...value, columns: value.columns.filter((_, j) => j !== i), rows: value.rows.map((row) => row.filter((_, j) => j !== i)) })}><X /></Button>
                </div>
              </th>)}
              <th className="w-12"><span className="sr-only">Удаление строки</span></th>
            </tr></thead>
            <tbody>{value.rows.map((row, i) => <tr key={i} className="border-t border-border">
              {row.map((cell, j) => <td key={j} className="p-2"><input aria-label={`Строка ${i + 1}, столбец ${j + 1}`} className={field} value={cell} onChange={(e) => onChange({ ...value, rows: value.rows.map((r, ri) => ri === i ? r.map((c, ci) => ci === j ? e.target.value : c) : r) })} /></td>)}
              <td className="p-2"><Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:bg-muted hover:text-foreground" title={`Удалить строку ${i + 1}`} aria-label={`Удалить строку ${i + 1}`} onClick={() => onChange({ ...value, rows: value.rows.filter((_, j) => j !== i) })}><Trash2 /></Button></td>
            </tr>)}</tbody>
          </table>
        </div>
        <label className="block text-xs text-muted-foreground">Примечание<textarea aria-label="Примечание к размерной сетке" className={`${field} mt-1`} rows={2} value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} /></label>
      </div>}
    </section>
  );
}