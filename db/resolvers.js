const Usuario = require("../models/Usuario");
const Proyecto = require("../models/Proyecto");
const Tarea = require("../models/Tarea");

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });
//funcion para crear un token
const crearToken = (usuario, secreta, expiresIn) => {
  //console.log(usuario)
  const { id, email, nombre } = usuario;
  return jwt.sign({ id, email, nombre }, secreta, { expiresIn });
};

const resolvers = {
  Query: {
    obtenerProyectos: async (_, {}, ctx ) =>{
      const proyectos = await Proyecto.find({creador: ctx.usuario.id})
      return proyectos;

    },
    obtenerTareas: async (_, {input}, ctx ) =>{
      const tareas = await Tarea.find({ creador: ctx.usuario.id }).where('proyecto').equals(input.proyecto);
      return tareas;
    }
  },
  Mutation: {
    crearUsuario: async (_, { input }, context, info) => {
      const { nombre, email, password } = input;

      const existeUsuario = await Usuario.findOne({ email });
      //console.log(existeUsuario)
      if (existeUsuario) {
        throw new Error("El usuario ya esta registrado");
      }
      try {
        //hashear password
        const salt = await bcryptjs.genSalt(10);
        input.password = await bcryptjs.hash(password, salt);
        //console.log(input);
        //no hay como recuperar un hash

        ///Subir el usuario a la Base de Datos
        const nuevoUsuario = new Usuario(input);
        console.log("creacion de usuario", nuevoUsuario);
        nuevoUsuario.save();

        return "Usuario creado correctamente";
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { nombre, email, password } = input;
      //verificar que el usuario exista
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error("El usuario no está registrado!");
      }
      //si el password es correcto
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      ); //compara el password con el otro hasheado
      console.log(passwordCorrecto); //para verificar si el password esta bien escrito
      if (!passwordCorrecto) {
        throw new Error("Password incorrecto!");
      }

      return {
        token: crearToken(existeUsuario, process.env.SECRETA, "4hr"),
      };
    },
    nuevoProyecto: async ( _, { input }, ctx ) => {
      

      try {
        const proyecto = new Proyecto(input);
        //asociar el creador del proyecto
        proyecto.creador = ctx.usuario.id;
        //almacenar en la base de datos
        const resultado = await proyecto.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProyecto: async ( _, { id, input }, ctx )=>{
      //EXISTE EL PROYECTO?
      let proyecto = await Proyecto.findById(id);
      if(!proyecto){
        throw new Error('Proyecto no encontrado!')
      }
      //LA PERSONA EDITORA ES EL CREADOR?
        if(proyecto.creador.toString() !== ctx.usuario.id){
          throw new Error('No tiene las credenciales para editar')

        }
        //gaurdar proyecto
        proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true})
        return proyecto;
    },
    eliminarProyecto: async ( _, { id, input }, ctx )=>{
      //EXISTE EL PROYECTO?
      let proyecto = await Proyecto.findById(id);
      if(!proyecto){
        throw new Error('Proyecto no encontrado!')
      }
      //LA PERSONA EDITORA ES EL CREADOR?
        if(proyecto.creador.toString() !== ctx.usuario.id){
          throw new Error('No tiene las credenciales para eliminar')

        }
        //eliminar
        await Proyecto.findOneAndDelete({_id: id})
        return "Proyecto Eliminado";

    },
    nuevaTarea: async ( _, { input }, ctx ) =>{
      try {
        const tarea = new Tarea(input);
        //asociar el creador del proyecto
        tarea.creador = ctx.usuario.id;
        //almacenar en la base de datos
        const resultado = await tarea.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarTarea: async ( _, {id, input, estado }, ctx ) =>{
      let tarea =  await Tarea.findById(id);
      if(!tarea){
        throw new Error('Tarea no encontrada!')
      }
      //LA PERSONA EDITORA ES EL CREADOR?
        if(tarea.creador.toString() !== ctx.usuario.id){
          throw new Error('No tiene las credenciales para editar')

        }
        //asignar estado
        input.estado = estado;
        //guardar y retornar la tarea
        tarea = await Tarea.findOneAndUpdate({_id : id}, input, {new: true});
        return tarea;
    },
    eliminarTarea: async ( _, { id }, ctx )=>{
      let tarea =  await Tarea.findById(id);
      //verificar si existe la tarea
      if(!tarea){
        throw new Error('Tarea no encontrada!')
      }
      //LA PERSONA EDITORA ES EL CREADOR?
        if(tarea.creador.toString() !== ctx.usuario.id){
          throw new Error('No tiene las credenciales para editar')

        }
        //eliminar tarea
        await Tarea.findOneAndDelete({_id: id});
        return "Tarea Eliminada"

    }




  },
};

module.exports = resolvers;
