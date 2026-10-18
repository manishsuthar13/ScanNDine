import React from 'react';
import { Button } from '../ui';
import { TEXT } from '../../constants/text';

const QtyStepper = ({ qty, onChange }) => (
  <div className="mt-3 flex items-center justify-between rounded-full bg-primary/10 p-1">
    <button onClick={() => onChange(qty - 1)} className="h-8 w-8 rounded-full bg-surface font-bold text-primary" aria-label="Decrease">−</button>
    <span className="font-semibold">{qty}</span>
    <button onClick={() => onChange(qty + 1)} className="h-8 w-8 rounded-full bg-primary font-bold text-white" aria-label="Increase">+</button>
  </div>
);

const MenuItemCard = ({ item, qty, onAdd, onQty }) => (
  <article className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card">
    {item.imageUrl
      ? <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-36 w-full object-cover" />
      : <div className="h-36 w-full bg-gradient-to-br from-accent/30 to-primary/20" />}
    <div className="flex flex-1 flex-col p-4">
      <h3 className="font-display font-bold">{item.name}</h3>
      <p className="flex-1 text-sm text-ink/60">{item.description}</p>
      <p className="mt-2 font-display text-lg font-extrabold text-primary">₹{item.price}</p>
      {qty === 0
        ? <Button className="mt-3" fullWidth onClick={() => onAdd(item)}>{TEXT.customer.addToCart}</Button>
        : <QtyStepper qty={qty} onChange={(q) => onQty(item._id, q)} />}
    </div>
  </article>
);

export default React.memo(MenuItemCard);
