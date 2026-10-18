import React from 'react';
import { Modal, Button, Alert } from '../ui';
import { TEXT } from '../../constants/text';

const T = TEXT.customer;

const CartModal = ({ cart, onPlace, placing, error, onClose }) => (
  <Modal title={T.yourCart} onClose={onClose}>
    {cart.cart.length === 0 ? <p className="my-4 text-ink/60">{T.emptyCart}</p> : (
      <>
        <ul className="my-4">
          {cart.cart.map((item) => (
            <li key={item._id} className="border-b border-ink/10 py-3">
              <p className="flex justify-between gap-3 font-semibold"><span>{item.name}</span><span>₹{item.price * item.qty}</span></p>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <button onClick={() => cart.setQty(item._id, item.qty - 1)} className="h-7 w-7 rounded-full bg-primary/10 font-bold text-primary" aria-label="Decrease">−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => cart.setQty(item._id, item.qty + 1)} className="h-7 w-7 rounded-full bg-primary font-bold text-white" aria-label="Increase">+</button>
                </span>
                <button onClick={() => cart.setQty(item._id, 0)} className="text-sm font-semibold text-primary">{T.remove}</button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mb-4 flex justify-between text-lg font-bold"><span>{T.total}</span><span>₹{cart.total}</span></p>
        <Alert>{error}</Alert>
        <Button fullWidth size="lg" loading={placing} onClick={onPlace}>{T.placeOrder}</Button>
      </>
    )}
  </Modal>
);

export default CartModal;
