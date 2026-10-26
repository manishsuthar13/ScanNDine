// Seeds demo restaurants (on different plans, with 3 months of orders and invoices), admins, staff, tables (with QR codes) and menus.
// Usage: npm run seed:demo           (adds demo data, skips restaurants that already exist)
//        npm run seed:demo -- --reset (removes the demo restaurants first, then re-creates them)
// Only touches restaurants whose email ends with @demo.scanndine.test.
require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Plan = require('../models/Plan');
const Invoice = require('../models/Invoice');
const { seedPlans } = require('../config/plans');
const { periodOf, generateInvoices } = require('../utils/billing');

const DEMO_DOMAIN = '@demo.scanndine.test';
const PASSWORD = 'Demo@1234';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const DEMO = [
  {
    slug: 'spice-route',
    plan: 'Growth',
    volume: 4,
    name: 'Spice Route',
    phone: '+91 98765 43210',
    tables: 6,
    menu: {
      Starters: [
        ['Paneer Tikka', 220, 'Char-grilled cottage cheese with spices', ['veg', 'tandoor']],
        ['Chicken 65', 260, 'Crispy fried chicken with curry leaves', ['non-veg', 'spicy']],
        ['Veg Spring Rolls', 160, 'Crisp rolls stuffed with vegetables', ['veg']],
      ],
      Mains: [
        ['Butter Chicken', 340, 'Creamy tomato gravy with tender chicken', ['non-veg']],
        ['Dal Makhani', 240, 'Slow-cooked black lentils', ['veg']],
        ['Veg Biryani', 260, 'Fragrant basmati rice with vegetables', ['veg']],
        ['Garlic Naan', 60, 'Tandoor-baked garlic flatbread', ['veg', 'bread']],
      ],
      Desserts: [
        ['Gulab Jamun', 90, 'Warm milk dumplings in sugar syrup', ['veg', 'sweet']],
        ['Kulfi', 110, 'Traditional pistachio ice cream', ['veg', 'sweet']],
      ],
      Drinks: [
        ['Masala Chai', 40, 'Spiced Indian tea', ['hot']],
        ['Mango Lassi', 90, 'Chilled yogurt mango drink', ['cold']],
      ],
    },
  },
  {
    slug: 'luigis-pizzeria',
    plan: 'Starter',
    volume: 2,
    name: "Luigi's Pizzeria",
    phone: '+91 91234 56780',
    tables: 4,
    menu: {
      Pizzas: [
        ['Margherita', 299, 'Tomato, mozzarella and basil', ['veg']],
        ['Pepperoni', 399, 'Spicy pepperoni and mozzarella', ['non-veg']],
        ['Farmhouse', 349, 'Mushroom, capsicum, onion and olives', ['veg']],
      ],
      Pasta: [
        ['Penne Arrabbiata', 279, 'Spicy tomato sauce', ['veg', 'spicy']],
        ['Fettuccine Alfredo', 319, 'Creamy parmesan sauce', ['veg']],
      ],
      Sides: [
        ['Garlic Bread', 120, 'Toasted with garlic butter', ['veg']],
        ['Caesar Salad', 180, 'Romaine, croutons and parmesan', ['veg']],
      ],
      Drinks: [
        ['Cold Coffee', 110, 'Blended iced coffee', ['cold']],
        ['Lemonade', 70, 'Fresh lime soda', ['cold']],
      ],
    },
  },
  {
    slug: 'brew-bites',
    plan: 'Pro',
    volume: 3,
    name: 'Brew & Bites Cafe',
    phone: '+91 99887 76655',
    tables: 5,
    menu: {
      Coffee: [
        ['Cappuccino', 150, 'Espresso with steamed milk foam', ['hot']],
        ['Latte', 160, 'Smooth espresso with milk', ['hot']],
        ['Iced Americano', 140, 'Espresso over ice', ['cold']],
      ],
      Snacks: [
        ['Veg Club Sandwich', 190, 'Triple-decker with fresh veggies', ['veg']],
        ['Chicken Wrap', 230, 'Grilled chicken in a tortilla', ['non-veg']],
        ['French Fries', 120, 'Crispy salted fries', ['veg']],
      ],
      Bakery: [
        ['Blueberry Muffin', 100, 'Freshly baked', ['veg', 'sweet']],
        ['Chocolate Brownie', 130, 'Fudgy with walnuts', ['veg', 'sweet']],
      ],
    },
  },
  {
    slug: 'saffron-garden',
    name: 'Saffron Garden',
    plan: 'Starter',
    volume: 1,
    status: 'suspended', // unpaid invoices, so the demo shows a suspended account
    phone: '+91 90000 11122',
    tables: 3,
    menu: {
      Mains: [
        ['Paneer Butter Masala', 280, 'Rich tomato and butter gravy', ['veg']],
        ['Jeera Rice', 150, 'Cumin-tempered basmati', ['veg']],
      ],
      Drinks: [
        ['Sweet Lassi', 80, 'Chilled and creamy', ['cold']],
      ],
    },
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUSES = ['placed', 'preparing', 'ready', 'served', 'served', 'cleared', 'canceled'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedRestaurant = async (def) => {
  const email = `${def.slug}${DEMO_DOMAIN}`;
  if (await Restaurant.exists({ email })) {
    console.log(`- ${def.name}: already exists, skipping (use --reset to recreate)`);
    return null;
  }

  const plan = await Plan.findOne({ name: def.plan });
  const restaurant = await Restaurant.create({
    name: def.name, email, phone: def.phone, status: def.status || 'active', planId: plan._id,
    createdAt: new Date(Date.now() - 100 * DAY_MS), // joined before the order history below
  });
  const restaurantId = restaurant._id;

  // Admin + 2 staff (User pre-save hook hashes passwordHash)
  const users = [
    { username: `${def.slug}-admin`, role: 'admin' },
    { username: `${def.slug}-staff1`, role: 'staff' },
    { username: `${def.slug}-staff2`, role: 'staff' },
  ];
  for (const u of users) {
    await User.create({
      username: u.username, email: `${u.username}${DEMO_DOMAIN}`, passwordHash: PASSWORD, role: u.role, restaurantId,
    });
  }

  // Tables with QR codes
  const tables = [];
  for (let number = 1; number <= def.tables; number++) {
    const qrSlug = `table-${number}`;
    const qrUrl = `${BASE_URL}/menu?r=${restaurantId}&table=${qrSlug}`;
    tables.push(await Table.create({ restaurantId, number, qrSlug, qrUrl, qrData: await QRCode.toDataURL(qrUrl) }));
  }

  // Menu
  const items = [];
  let order = 0;
  for (const [categoryName, list] of Object.entries(def.menu)) {
    const category = await MenuCategory.create({ restaurantId, name: categoryName, displayOrder: order++ });
    for (const [name, price, description, tags] of list) {
      items.push(await MenuItem.create({ restaurantId, categoryId: category._id, name, price, description, tags }));
    }
  }

  // A few live orders (as if just placed from a table QR) plus ~90 days of history for analytics
  const buildOrder = (createdAt, status) => {
    const lines = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => ({
      item: pick(items), qty: 1 + Math.floor(Math.random() * 3),
    }));
    return {
      restaurantId,
      tableId: pick(tables)._id,
      items: lines.map((l) => ({ menuItemId: l.item._id, qty: l.qty })),
      totals: lines.reduce((sum, l) => sum + l.item.price * l.qty, 0),
      status,
      createdAt,
    };
  };
  const orders = [];
  for (let i = 0; i < 8; i++) orders.push(buildOrder(new Date(Date.now() - i * 20 * 60 * 1000), i < 3 ? 'placed' : pick(STATUSES)));
  for (let day = 1; day <= 90; day++) {
    const trend = 1 + (90 - day) / 180; // busier as time goes on
    const count = Math.round(def.volume * trend * (1 + Math.random() * 2));
    for (let n = 0; n < count; n++) {
      orders.push(buildOrder(new Date(Date.now() - day * DAY_MS - Math.random() * 12 * 60 * 60 * 1000), pick(['served', 'served', 'served', 'cleared', 'canceled'])));
    }
  }
  await Order.insertMany(orders);

  console.log(`+ ${def.name}: ${tables.length} tables, ${items.length} items, 1 admin, 2 staff, ${orders.length} orders`);
  return restaurant;
};

// Invoices for the last 3 full months: the oldest are paid, the middle one mostly paid, the latest pending
const seedInvoices = async () => {
  const now = new Date();
  const periods = [3, 2, 1].map((back) => periodOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1))));
  for (const period of periods) await generateInvoices(period);
  const demoIds = (await Restaurant.find({ email: new RegExp(`${DEMO_DOMAIN.replace('.', '\\.')}$`) }).select('_id name')).reduce((m, r) => m.set(String(r._id), r.name), new Map());
  const invoices = await Invoice.find({ restaurantId: { $in: [...demoIds.keys()] }, status: 'pending' });
  for (const invoice of invoices) {
    const isLatest = invoice.period === periods[2];
    const unpaidRestaurant = demoIds.get(String(invoice.restaurantId)) === 'Saffron Garden';
    if (isLatest) continue; // still within its payment window
    if (unpaidRestaurant) {
      await Invoice.updateOne({ _id: invoice._id }, { dueDate: new Date(Date.now() - 10 * DAY_MS) }); // left unpaid, so overdue
      continue;
    }
    await Invoice.updateOne({ _id: invoice._id }, { status: 'paid', paidAt: new Date(invoice.dueDate.getTime() - 5 * DAY_MS) });
  }
  console.log(`+ Invoices generated for ${periods.join(', ')}`);
};

const reset = async () => {
  const restaurants = await Restaurant.find({ email: new RegExp(`${DEMO_DOMAIN.replace('.', '\\.')}$`) }).select('_id');
  const ids = restaurants.map((r) => r._id);
  if (!ids.length) return;
  await Promise.all([Order, MenuItem, MenuCategory, Table, User, Invoice].map((M) => M.deleteMany({ restaurantId: { $in: ids } })));
  await Restaurant.deleteMany({ _id: { $in: ids } });
  console.log(`Removed ${ids.length} demo restaurant(s)`);
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await seedPlans();
    if (process.argv.includes('--reset')) await reset();
    for (const def of DEMO) await seedRestaurant(def);
    await seedInvoices();

    console.log(`\nLogin with username or email, password: ${PASSWORD}`);
    for (const def of DEMO) console.log(`  ${def.name}: ${def.slug}-admin, ${def.slug}-staff1, ${def.slug}-staff2`);
    console.log('Customers need no account: open a table\'s QR URL (Admin > Tables) to browse the menu and order.');
  } catch (error) {
    console.error('Demo seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
