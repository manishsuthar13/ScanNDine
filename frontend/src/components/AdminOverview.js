import React from 'react';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { Card, Button, Alert, Pagination, StatTile } from './ui';
import { TEXT } from '../constants/text';

const T = TEXT.admin.overview;

const QueryRow = React.memo(({ query, onClear }) => (
  <li className="flex items-start justify-between gap-4 border-b border-ink/10 py-3 last:border-0">
    <span className="min-w-0">
      <strong>{query.staffId?.username || T.removedStaff}</strong>: {query.message}
      <span className="block text-xs text-ink/50">{new Date(query.createdAt).toLocaleString()}</span>
    </span>
    <Button variant="soft" size="sm" onClick={() => onClear(query._id)}>{TEXT.common.clear}</Button>
  </li>
));

const groupByCategory = (items) =>
  Object.entries(items.reduce((acc, item) => {
    (acc[item.categoryName] = acc[item.categoryName] || []).push(item);
    return acc;
  }, {}));

const Breakdown = ({ items }) => (
  <div className="mt-4 space-y-5">
    {groupByCategory(items).map(([category, dishes]) => (
      <div key={category} className="border-t border-ink/10 pt-4">
        <h5 className="text-lg font-bold">{category}</h5>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <div key={dish._id} className="overflow-hidden rounded-2xl bg-canvas p-3">
              {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="mb-2 h-24 w-full rounded-xl object-cover" />}
              <h6 className="font-bold">{dish.name}</h6>
              <p className="text-sm text-ink/60">{dish.description}</p>
              <p className="text-sm font-semibold text-primary">{T.ordered(dish.count)}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Admin landing page: staff queries and this restaurant's analytics
const AdminOverview = () => {
  const { queries, analytics, clearQuery, clearPage } = useAdminOverview();

  return (
    <>
      <Card title={T.queries(queries.pagination.total)} className="mb-6"
        action={queries.items.length > 0 && <Button variant="outline" size="sm" onClick={clearPage}>{T.clearAll}</Button>}>
        <Alert>{queries.error}</Alert>
        {queries.items.length === 0 ? <p className="text-ink/60">{T.noQueries}</p> : (
          <ul>{queries.items.map((q) => <QueryRow key={q._id} query={q} onClear={clearQuery} />)}</ul>
        )}
        <Pagination pagination={queries.pagination} onPage={queries.setPage} disabled={queries.loading} />
      </Card>

      <Card title={T.analytics}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile label={T.totalOrders} value={analytics.totalOrders || 0} tone="accent" />
          <StatTile label={T.totalRevenue} value={`₹${analytics.totalRevenue || 0}`} tone="success" />
        </div>
        <h4 className="mt-6 font-bold">{T.breakdown}</h4>
        {analytics.itemBreakdown?.length > 0
          ? <Breakdown items={analytics.itemBreakdown} />
          : <p className="mt-2 text-ink/60">{T.noOrders}</p>}
      </Card>
    </>
  );
};

export default AdminOverview;
