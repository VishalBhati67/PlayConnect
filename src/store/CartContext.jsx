import { createContext, useContext, useState } from "react";

const CartContext = createContext({ items: [], count: 0, add: () => {}, remove: () => {}, clear: () => {} });

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const add = (product) => setItems((prev) => [...prev, product]);
  const remove = (name) => setItems((prev) => prev.filter((p) => p.name !== name));
  const clear = () => setItems([]);
  return (
    <CartContext.Provider value={{ items, count: items.length, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);