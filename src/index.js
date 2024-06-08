import fastify from 'fastify';
import env from 'dotenv';
import db from './config/index';
import user from './routes/user';
import mongoose from 'mongoose';

env.config();

const Port = process.env.PORT;
const uri = process.env.MONGODB_URI;

const app = fastify({ logger: true });

// Activation des plugin :
mongoose.connect('mongodb://127.0.0.1:27017/fastify-auth').then(() => console.log("Connected to database")).catch((e) => console.log("Error connecting to database", e));

app.register(user);
// Creation du serveur 
const start = async () => {
    try {
        console.log("Hello !");
        await app.listen({port: 5000});
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();