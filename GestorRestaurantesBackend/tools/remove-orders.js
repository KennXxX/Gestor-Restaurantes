#!/usr/bin/env node

/*
  Small admin script to list or delete orders from the MongoDB used by GestorRestaurantesBackend.
  Usage examples (PowerShell):
    node tools\remove-orders.js --list --restaurant "La Buena Mesa"
    node tools\remove-orders.js --filterRestaurantId <id> --dryRun
    node tools\remove-orders.js --id <orderId> --delete

  Options:
    --list                List orders matching filter
    --id <orderId>        Target an order by id
    --restaurant <name>   Filter by restaurant name (case-insensitive)
    --filterRestaurantId <id>  Filter by restaurant ObjectId
    --dryRun              Show what would be deleted, don't perform deletion
    --delete              Actually delete matching orders

  IMPORTANT: This script uses the same `URI_MONGO` env var as the backend. Run from project root with env set.
*/

import mongoose from 'mongoose';
import Order from '../src/orders/order.model.js';
import Restaurant from '../src/restaurants/restaurant.model.js';

const argv = process.argv.slice(2);

const args = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.replace(/^--/, '');
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
}

const connect = async () => {
  const uri = process.env.URI_MONGO;
  if (!uri) {
    console.error('URI_MONGO not set in environment. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
};

const buildFilter = async () => {
  const filter = {};
  if (args.id) {
    filter._id = args.id;
  }
  if (args.filterRestaurantId) {
    filter.restaurantId = args.filterRestaurantId;
  }
  if (args.restaurant) {
    // Resolve restaurant name -> id
    const r = await Restaurant.findOne({ restaurantName: new RegExp(`^${args.restaurant}$`, 'i') });
    if (r) filter.restaurantId = r._id;
    else {
      console.warn('No restaurant found with that name. Filter will produce no results.');
      filter.restaurantId = null; // will not match
    }
  }
  return filter;
};

const main = async () => {
  try {
    await connect();
    const filter = await buildFilter();
    // If filter.restaurantId explicitly set to null (not found), exit
    if (filter.restaurantId === null) {
      console.log('No matching restaurant; exiting.');
      process.exit(0);
    }

    const doList = args.list || (!args.delete && !args.id && !args.restaurant && !args.filterRestaurantId);

    if (doList) {
      const orders = await Order.find(filter).limit(200).sort({ createdAt: -1 }).lean();
      console.log(`Found ${orders.length} orders:`);
      orders.forEach(o => {
        console.log(`- id=${o._id} restaurant=${o.restaurantId} status=${o.status} total=${o.total} createdAt=${o.createdAt}`);
      });
      process.exit(0);
    }

    if (args.delete) {
      const dryRun = !!args.dryRun;
      const orders = await Order.find(filter).limit(200).sort({ createdAt: -1 }).lean();
      console.log(`Matched ${orders.length} orders:`);
      orders.forEach(o => console.log(`- ${o._id} status=${o.status} total=${o.total} createdAt=${o.createdAt}`));
      if (orders.length === 0) {
        console.log('Nothing to delete.');
        process.exit(0);
      }

      if (dryRun) {
        console.log('Dry run: no deletions performed. Use --delete without --dryRun to actually delete.');
        process.exit(0);
      }

      const { ok } = await Order.deleteMany(filter);
      console.log('Delete result:', ok);
      process.exit(0);
    }

    console.log('No action taken. Use --list or --delete.');
    process.exit(0);
  } catch (err) {
    console.error('Error in remove-orders script:', err);
    process.exit(1);
  }
};

main();
