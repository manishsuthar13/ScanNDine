import React from 'react';
import { Button, Badge, Pagination, Spinner } from '../ui';
import { TEXT } from '../../constants/text';

const T = TEXT.admin.menu;

const ItemRow = React.memo(({ item, onToggle, onEdit, onDelete }) => (
  <li className="flex flex-col gap-3 border-b border-ink/10 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      {item.imageUrl
        ? <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" />
        : <span className="h-16 w-16 rounded-2xl bg-primary/10" />}
      <div>
        <h4 className="font-bold">{item.name} <Badge>{item.categoryId?.name}</Badge></h4>
        <p className="text-sm text-ink/60">{item.description}</p>
        <p className="font-semibold text-primary">₹{item.price}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant={item.availability ? 'accent' : 'outline'} onClick={() => onToggle(item)}>
        {item.availability ? T.available : T.unavailable}
      </Button>
      <Button size="sm" variant="outline" onClick={() => onEdit(item)}>{T.edit}</Button>
      <Button size="sm" variant="soft" onClick={() => onDelete(item)}>{T.delete}</Button>
    </div>
  </li>
));

const ItemList = ({ list, onToggle, onEdit, onDelete }) => {
  if (list.loading && list.items.length === 0) return <Spinner />;
  return (
    <>
      {list.items.length === 0 ? <p className="text-ink/60">{T.empty}</p> : (
        <ul>{list.items.map((item) => <ItemRow key={item._id} item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</ul>
      )}
      <Pagination pagination={list.pagination} onPage={list.setPage} disabled={list.loading} />
    </>
  );
};

export default ItemList;
