import { shared } from '../styles/shared'

export default function SortableTh({ label, sortKey, currentKey, onSort, indicator }) {
  const active = sortKey === currentKey
  return (
    <th
      style={{
        ...shared.th,
        cursor:     'pointer',
        userSelect: 'none',
        color:      active ? 'var(--accent)' : 'var(--text-secondary)',
      }}
      onClick={() => onSort(sortKey)}
    >
      {label}{indicator(sortKey)}
    </th>
  )
}