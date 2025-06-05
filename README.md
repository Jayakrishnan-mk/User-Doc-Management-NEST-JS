# Modular NestJS Backend : User and Document Management

## Overview

A production-ready, modular NestJS backend for user and document management, featuring:

- Modular architecture (SOLID, best practices)
- DTO validation, error handling, and clear separation of concerns
- JWT authentication and role-based access (admin/editor/viewer)
- PostgreSQL integration via TypeORM
- File upload, document ingestion (OCR/PDF parsing), and status tracking
- VirusTotal integration
- Comprehensive unit and e2e tests

## Features

- **User Management:** Registration, login, CRUD, role management
- **Auth:** JWT-based, role-based guards, secure endpoints
- **Document Management:** CRUD, ownership checks, file upload
- **Ingestion:** Trigger OCR/PDF parsing, status tracking, error handling
- **Testing:** Unit and e2e tests for all modules

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

### Installation

```sh
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```
DATABASE_URL=postgres://user:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret
OCR_SPACE_API_KEY=your_ocr_space_api_key
```

### Database Migration

If using TypeORM migrations, run:

```sh
npm run typeorm migration:run
```

### Running the App

```sh
npm run start:dev
```

### Running Tests

- **Unit tests:**
  ```sh
  npm run test
  ```
- **e2e tests:**
  ```sh
  npm run test:e2e
  ```

## API Overview

### Auth

- `POST /auth/register` — Register user `{ username, password, role? }`
- `POST /auth/login` — Login `{ username, password }` → `{ access_token }`

### Users

- `GET /users/:id` — Get user profile (auth required)
- `GET /users` — List users (auth required)
- `PUT /users/:id` — Update user (self or admin)
- `PATCH /users/:id/role` — Update user role (admin only)
- `DELETE /users/:id` — Delete user (admin only)

### Documents

- `POST /documents` — Create document (auth required)
- `GET /documents` — List documents (auth required)
- `GET /documents/:id` — Get document by ID (auth required)
- `PUT /documents/:id` — Update document (owner only)
- `DELETE /documents/:id` — Delete document (owner only)
- `POST /documents/upload` — Upload file (auth required)

### Ingestion

- `POST /ingestion/trigger` — Trigger ingestion `{ documentId }`
- `GET /ingestion/status/:id` — Get ingestion status

## Roles

- `admin`: Full access, can manage users and roles
- `editor`: Can manage own documents
- `viewer`: Read-only access

## File Uploads

Uploaded files are stored in `/uploads`. File URLs are returned in API responses.

## Ingestion

- Supports OCR (images) and PDF parsing
- Status tracked per document
- VirusTotal scan

## Testing

- All modules have unit and e2e tests
- Run with `npm run test` and `npm run test:e2e`

## Deployment

- Dockerfile and docker-compose recommended for production
- Ensure environment variables are set in production

## Postman Collection

- [Online Postman Workspace](https://postman.co/workspace/My-Workspace~392b206e-087a-4088-8de3-b885ca4343fa/collection/27063930-dd3c579f-c9ed-4d72-bdbc-ae6578ad841e?action=share&creator=27063930&active-environment=27063930-e072c2cc-0bbd-48d5-9a93-8cc1f0aa9ecd)
- [Download Postman Collection (JSON)](./postman_collection.json)

---

**For more details, see code comments and tests.**
