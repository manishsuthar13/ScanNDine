import React from 'react';
import { Pagination, Spinner } from '../ui';
import { TEXT } from '../../constants/text';
import { money, shortDate } from '../../utils/format';

const T = TEXT.superadmin;

const Row = React.memo(({ r, onOpen }) => (
  <tr onClick={() => onOpen(r._id)} className="cursor-pointer border-t border-ink/10 hover:bg-primary/5">
    <td className="px-4 py-3">
      <button type="button" className="text-left">
        <span className="block font-semibold">{r.name}</span>
        <span className="block text-xs text-ink/50">{r.email}</span>
      </button>
    </td>
    <td className="px-4 py-3">{r.admins}</td>
    <td className="px-4 py-3">{r.staff}</td>
    <td className="px-4 py-3">{r.tables}</td>
    <td className="px-4 py-3">{r.orders}</td>
    <td className="px-4 py-3 font-semibold text-primary">{money(r.revenue)}</td>
    <td className="px-4 py-3">{shortDate(r.lastOrderAt)}</td>
    <td className="px-4 py-3">{shortDate(r.createdAt)}</td>
  </tr>
));

const RestaurantTable = ({ list, onOpen }) => (
  <>
    <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary/10 text-ink/70">
          <tr>{T.columns.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {list.loading && list.items.length === 0 && (
            <tr><td colSpan={T.columns.length} className="px-4 py-8 text-center"><Spinner /></td></tr>
          )}
          {!list.loading && list.items.length === 0 && (
            <tr><td colSpan={T.columns.length} className="px-4 py-8 text-center text-ink/60">{T.emptyList}</td></tr>
          )}
          {list.items.map((r) => <Row key={r._id} r={r} onOpen={onOpen} />)}
        </tbody>
      </table>
    </div>
    <Pagination pagination={list.pagination} onPage={list.setPage} disabled={list.loading} />
  </>
);

export default RestaurantTable;
