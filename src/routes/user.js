import FastifyAuth from '@fastify/auth'
import User from '../models/user'

const usersRoutes = async (fastify, opts) => {
    fastify 
    .decorate('asyncVerifyJWT', async (request, reply) => {
        try {
            if (!request.headers.authorization) {
                throw new Error('Le token non envoyer')
            }

            const token = request.headers.authorization.replace('Bearer ', '');
            const user = await User.findByToken(token);
            if (!user) {
                // handles logged out user with valid token
                throw new Error(' Echec Authentication!');
            }
            request.user = user;
            request.token = token; // used in logout route

        } catch (error) {
            reply.code(401).send(error)
        }
    })
    .decorate('asyncVerifyUsernameAndPassword', async (request, reply) => {
        try {
            if (!request.body) {
                throw new Error('le nom utilisateur et le mot de passe sont requis ')
            }
            const user = await User.findByCredentials(request.body.username, request.body.password);
            request.user = user

        } catch (error) {
            reply.code(400).send(error);
        }
    })
    .register(FastifyAuth)
    .after(() => {
        // enregistrement de l'utilisateur
        fastify.route({
            method: ['POST', 'HEAD'],
            url: '/register',
            logLevel: 'warn',
            handler: async (request, reply) => {
                const user = new User(request.body)
                try {
                    await user.save();
                    const token = await user.generateToken();
                    reply.status(201).send({user})
                } catch (error) {
                    reply.status(400).send(error)
                }
            }
        })

        // connexion de l'utilisateur 
        fastify.route({
            method: ['POST', 'HEAD'],
            url: '/login',
            logLevel: 'warn',
            preHandler: fastify.asyncVerifyUsernameAndPassword,
            handler: async (request, reply) => {
                const token = await request.user.generateToken();
                reply.send({status: 'connexion reussi', user: request.user});
            }
        })

        //Profile utilisateur
        fastify.route({
            method: ['GET', 'HEAD'],
            url: '/profile',
            logLevel: 'warn',
            preHandler: fastify.asyncVerifyJWT,
            handler: async (request, reply) => {
                reply.send({status: 'Authentifié!', user:request.user})
            }
        })

        fastify.route({
            method: ['GET', 'HEAD'],
            url: '/users',
            logLevel: 'warn',
            handler: async (request, reply) => {
                const users = await User.find();
                reply.send(users);
            }
        })

        
        

        // Deconnexion utilisateur 
        fastify.route({
            method: ['POST', 'HEAD'],
            url: '/logout',
            logLevel: 'warn', // definie le niveau de journalisation
            preHandler: fastify.asyncVerifyJWT,
            handler: async(request, reply) => {
                try {
                    request.user.tokens = request.user.tokens.filter((token) => {
                        return token.token !== request.token;
                    })
                    const loggedOutUser = await request.user.save();
                    reply.send({status: 'Deconnexion reussi', uers: loggedOutUser})
                } catch (e) {
                    reply.status(500).send(e);
                }
            }

        })
    })
}; 

export default usersRoutes;