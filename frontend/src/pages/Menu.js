import React, { useState } from 'react';
import MenuItemCard from '../components/menu/MenuItemCard';
import CartModal from '../components/menu/CartModal';
import OrdersModal from '../components/menu/OrdersModal';
import { Button, PageLoader } from '../components/ui';
import { useCustomerMenu } from '../hooks/useCustomerMenu';
import { statusOf } from '../constants/orderStatus';
import { TEXT } from '../constants/text';

const T = TEXT.customer;

const Notice = ({ message }) => (
  <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
    <p className="max-w-sm text-center text-ink/70">{message}</p>
  </div>
);

const Menu = () => {
  const menu = useCustomerMenu();
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const { cart } = menu;

  if (!menu.restaurantId) return <Notice message={T.scanPrompt} />;
  if (menu.loading) return <PageLoader />;
  if (menu.loadError) return <Notice message={menu.loadError} />;

  const placeAndClose = async () => {
    if (await menu.placeOrder()) setShowCart(false);
  };

  return (
    <div className="min-h-screen bg-canvas pb-28">
      <header className="relative overflow-hidden bg-gradient-to-br from-accent via-primary to-primary-dark px-5 pb-14 pt-8 text-white">
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative mx-auto flex max-w-5xl items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">{menu.restaurant?.name || T.menuTitle}</h1>
            {menu.tableNumber && <p className="mt-1 text-white/85">{T.atTable(menu.tableNumber)}</p>}
          </div>
          {menu.tableSlug && (
            <Button variant="outline" size="sm" className="!border-white !text-white hover:!bg-white/15" onClick={() => setShowOrders(true)}>{T.myOrders}</Button>
          )}
        </div>
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute bottom-[-1px] left-0 h-10 w-full fill-canvas" aria-hidden="true">
          <path d="M0 60V34C110 60 250 52 400 6V60Z" />
        </svg>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-4">
        {menu.lastOrder && (
          <div className="mb-6 rounded-2xl bg-success/10 p-4 text-success">
            <p className="font-semibold">{T.orderPlaced(menu.lastOrder._id.slice(-6))} {statusOf(menu.lastOrder.status).label}</p>
            <Button size="sm" variant="ghost" className="mt-1" onClick={menu.dismissLastOrder}>{TEXT.common.close}</Button>
          </div>
        )}

        {menu.sections.length === 0 && <p className="text-center text-ink/60">{T.noCategories}</p>}
        {menu.sections.map((section) => (
          <section key={section._id} className="mb-8">
            <h2 className="mb-3 text-xl font-extrabold">{section.name}</h2>
            {section.items.length === 0 ? <p className="text-ink/60">{T.noItems}</p> : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <MenuItemCard key={item._id} item={item} qty={cart.cart.find((c) => c._id === item._id)?.qty || 0} onAdd={cart.add} onQty={cart.setQty} />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4">
          <Button size="lg" fullWidth className="mx-auto max-w-md !justify-between" onClick={() => setShowCart(true)}>
            <span>{T.viewCart} · {cart.count}</span>
            <span>₹{cart.total}</span>
          </Button>
        </div>
      )}

      {showCart && <CartModal cart={cart} onPlace={placeAndClose} placing={menu.placing} error={menu.orderError} onClose={() => { setShowCart(false); menu.clearOrderError(); }} />}
      {showOrders && <OrdersModal orders={menu.orders} onClose={() => setShowOrders(false)} />}
    </div>
  );
};

export default Menu;
