const {ApolloServer} = require('apollo-server');
const typeDefs = require('./db/schema')
const resolvers = require('./db/resolvers');
//para usar context
const jwt = require('jsonwebtoken');
require('dotenv').config('variables.env')

const conectarDB = require('./config/db')
conectarDB();


//con esto se crea un servidor de Apollo
const server = new ApolloServer({
    typeDefs,
     resolvers,
    context: ({req}) => {
        const token = req.headers['authorization'] || '';
        if(token){
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
                return {usuario};
            } catch (error) {
                
            }
        }
    }
    });//dos parametros type definitions y resolvers

server.listen({port: process.env.PORT || 4000}).then( ({url}) => { 
    console.log(`Servidor listo en la URL ${url}`)
} )