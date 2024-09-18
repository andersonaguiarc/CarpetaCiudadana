# 🛍️ **Ambassador Store Project** 
## arq-ambassador-auth-ms

En este proyecto se toma como base los repositorios de Antonio Papa para una tienda virtual y se le hacen cambios arquitectonicos con el fin de mejorar su disponibilidad ante fallas, simulando un despliegue de una tienda en linea real con alta resiliencia, alta disponibilidad y que soporte un alto nivel de tráfico.

Este repostorio corresponde al microservicio de usuarios, implementando un patrón de circuit breaker para obtener información de la cola MoM del servicio.

## Descripción Arquitectónica

En esta arquitectura se consideran varios elementos principales:
- FrontEnd: Dividido en 3 grandes proyectos: Store, Admin y Checkout.
- Un API Gateway, que sirve de puente entre el front y los diferentes microservicios.
- Un conjunto de microservicios, que cumplen las funciones de Autenticación, Manejo de Usuarios, Productos, Ordenes, Generación de Enlaces y Visualización de Rankings y un servicio core. Al igual que uno de soporte que envía los correos de confirmación y notificación.
- Cada servicio contiene elementos necesarios para su funcionamiento, como workers, que se encargan de implementar los patrones de diseño estipulados. 

## Integrantes

- Andrés Mauricio Ayala Cardona.
- Santiago Patiño Betancur.
- Sara Rodríguez Velásquez.

## Docente

👨‍🏫 Danny Andrés Salcedo Saldaña -  [Docente de EAFIT](https://www.linkedin.com/in/danny-andres-salcedo-salda%C3%B1a-0b07772a/?originalSubdomain=co)

## Tecnologías Utilizadas

📑 Lenguaje de Programación:
- **TypeScript:** Extiende JavaScript con características de tipado estático opcional para ayudar a detectar errores y hacer que el código sea más robusto.

🗂️ Frameworks y Librerías:
- Express: Un framework web minimalista para Node.js que se utiliza para construir aplicaciones y APIs web. Express simplifica el manejo de rutas, middleware y solicitudes HTTP.
- TypeORM: Un ORM (Mapeo Objeto-Relacional) para TypeScript y JavaScript que se utiliza para interactuar con la base de datos. TypeORM simplifica la interacción con la base de datos al mapear objetos de JavaScript a entidades de base de datos y viceversa.
- Axios: Una biblioteca HTTP para realizar solicitudes a servicios externos. Se utiliza para consumir APIs externas y realizar solicitudes HTTP desde el servidor.
- Bcryptjs: Una biblioteca para el hash de contraseñas. Se utiliza para cifrar contraseñas antes de almacenarlas en la base de datos para mejorar la seguridad.
- Jsonwebtoken: Una biblioteca para la generación y verificación de tokens JWT (JSON Web Tokens). Se utiliza para autenticar y autorizar usuarios en la aplicación.
- Nodemailer: Una biblioteca para enviar correos electrónicos desde Node.js. Se utiliza para enviar correos electrónicos de verificación, recuperación de contraseñas, etc.
- Redis: Una base de datos en memoria que se utiliza para almacenar datos en caché y mejorar el rendimiento de la aplicación.
- KafkaJS: Una biblioteca de cliente para interactuar con Apache Kafka, se utiliza para la mensajería entre microservicios.
- Cors: Un middleware de Express que se utiliza para permitir el acceso a recursos de origen cruzado (CORS) en el servidor.
- Firebase: Plataforma de desarrollo de aplicaciones móviles y web desarrollada por Google. Proporciona una variedad de servicios backend. 


## Instalación

Instrucciones paso a paso sobre cómo instalar y configurar el proyecto localmente.

Correr localmente:
```
npm install
npm run start
```


## Uso

Recuerde configurar todas las variables de entorno pertinentes para que pueda correr correctamente. 
Para el despliegue actual se sigue un modelo de despliegue en Kubernetes, por lo cual los archivos de configuración estan orientados a esta tecnología.

## Recursos Adicionales

Proyectos originales:
- 📌 Proyecto original de React frontend: https://github.com/antoniopapa/react-ambassador 
- 📌 Proyecto original de Node backend: https://github.com/antoniopapa/node-ambassador

## Contacto

- Andrés Mauricio Ayala Cardona. amayalac@eafit.edu.co
- Santiago Patiño Betancur. spatinob1@eafit.edu.co
- Sara Rodríguez Velásquez. srodriguev@eafit.edu.co


> [!NOTE]
> Este proyecto se ha creado con fines netamente académicos, sin fines comerciales y con un propósito de aprendizaje.
