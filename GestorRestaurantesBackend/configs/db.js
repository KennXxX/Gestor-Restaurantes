'use strict';

import dns from 'node:dns';
import mongoose from 'mongoose';

import Promotion from '../src/promotions/promotion.model.js';

// Node's DNS resolver can end up pointing at a non-functional server (e.g. a VPN
// adapter like Hamachi injecting 127.0.0.1), which breaks the SRV lookups that
// mongodb+srv:// URIs rely on even though the OS resolver works fine. Force
// public DNS servers so Atlas SRV resolution doesn't depend on local network config.
dns.setServers(['1.1.1.1', '8.8.8.8']);

export const dbConnection = async () => {
    try {

        mongoose.connection.on('error', () => {
            console.log('Error connecting to MongoDB');
            mongoose.disconnect();
        });

        mongoose.connection.on('connecting', () => {
            console.log('MongoDB / intentando conectar a MongoDB');
        });

        mongoose.connection.on('connected', () => {
            console.log('MongoDB / conexión establecida a MongoDB');
        });

        mongoose.connection.on('open', () => {
            console.log('MongoDB / conexión establecida a la base de datos gestorRestaurantesDb');
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB / desconectado de MongoDB');
        });

        await mongoose.connect(process.env.URI_MONGO, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10
        });

        // Auto-approve all existing promotions for development and testing convenience
        try {
            const result = await Promotion.updateMany({ isApproved: false }, { isApproved: true });
            if (result.modifiedCount > 0) {
                console.log(`MongoDB / Auto-aprobadas ${result.modifiedCount} promociones existentes`);
            }
        } catch (e) {
            console.error('Error auto-approving promotions:', e);
        }

    } catch (error) {
        console.log(`Error connecting to MongoDB: ${error}`);
    }
};

const gracefulShutdown = async (signal) => {
    console.log(`MongoDB / Received ${signal}. Closing database connection...`);
    try {
        await mongoose.connection.close();
        console.log('MongoDB / Database connection closed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error.message);
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
