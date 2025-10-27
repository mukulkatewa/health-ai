# health-ai

![TypeScript](https://img.shields.io/badge/-TypeScript-blue?logo=typescript&logoColor=white) ![License](https://img.shields.io/badge/license-ISC-green)

## 📝 Description

Health-AI is a web-based application built with Express.js and TypeScript, designed to revolutionize healthcare through the power of artificial intelligence. While specific AI functionalities are not detailed, the application's foundation in robust technologies suggests a platform poised for data-driven insights and innovative solutions within the health sector. This project provides a solid starting point for future development of AI-powered health tools.

Links:
Frontend: https://medico-sync-cgkaobdxc-kaksaab2605-8884s-projects.vercel.app

Backend: https://health-ai-production-2b49.up.railway.app/api

## ✨ Features

- 🕸️ Web


## 🛠️ Tech Stack

- 🚀 Express.js
- 📜 TypeScript


## 📦 Key Dependencies

```
@google/genai: ^1.27.0
@prisma/client: ^6.18.0
@types/bcryptjs: ^2.4.6
@types/express: ^5.0.4
@types/jsonwebtoken: ^9.0.10
@types/node: ^24.9.1
bcrypt: ^6.0.0
bcryptjs: ^3.0.2
cors: ^2.8.5
dotenv: ^17.2.3
express: ^5.1.0
express-rate-limit: ^8.1.0
express-validator: ^7.3.0
jsonwebtoken: ^9.0.2
openai: ^6.7.0
```

## 🚀 Run Commands

- **test**: `npm run test`
- **dev**: `npm run dev`
- **build**: `npm run build`
- **start**: `npm run start`
- **postinstall**: `npm run postinstall`


## 📁 Project Structure

```
.
├── backend
│   ├── Procfile
│   ├── package.json
│   ├── prisma
│   │   ├── migrations
│   │   │   ├── 20251026052007_init
│   │   │   │   └── migration.sql
│   │   │   ├── 20251026053908_init
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   └── schema.prisma
│   ├── prisma.config.ts
│   ├── src
│   │   ├── controllers
│   │   │   ├── aiController.ts
│   │   │   ├── authController.ts
│   │   │   ├── doctorController.ts
│   │   │   └── patientController.ts
│   │   ├── middleware
│   │   │   ├── auth.ts
│   │   │   └── rateLimiter.ts
│   │   ├── routes
│   │   │   └── index.ts
│   │   ├── server.ts
│   │   └── types
│   │       └── express.d.ts
│   └── tsconfig.json
└── vercel.json
```

## 👥 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/mukulkatewa/health-ai.git`
3. **Create** a new branch: `git checkout -b feature/your-feature`
4. **Commit** your changes: `git commit -am 'Add some feature'`
5. **Push** to your branch: `git push origin feature/your-feature`
6. **Open** a pull request

