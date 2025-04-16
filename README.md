English | [简体中文](/README.zh-CN.md)
# BLOG-SERVICE

A backend service for a blog management system, using the **RBAC0** permission model, supporting interface-level permission control.
This project is a personal study project, and the code may not be well structured. It is not recommended for production use.

## Features

- Login: Supports single sign-on, using dual tokens to refresh login credentials;
- User Management: CRUD operations, supports multiple role associations, and user disabling;
- Role Management: CRUD operations, supports multiple permission associations, and role disabling;
- Permission Management: CRUD operations, supports interface-level permission control;
- Log Management: Uses winston for logging;
- Article Management: CRUD operations, supports markdown editor;
- Category Management: CRUD operations, supports multi-level categories;
- Swagger API Documentation.

## Tech Stack

`NodeJS` `NestJS` `PostgreSQL` `Prisma` `Redis` `Minio` `Docker` `Winston` `Swagger`

## Quick Start

### Prerequisites

1. Install NodeJS 18+;
2. Install Docker.

### Clone the Project

```bash
$ git clone https://github.com/wansongtao/blog-service.git
```

### Generate Jwt Key

Create a `key` folder in the project root directory, then enter the directory and create the following keys.

```bash
# Generate private key (macOS)
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Generate public key (macOS)
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

### Start Container Services

Use docker-compose to start containers:

```bash
$ docker-compose --env-file .env.development up --build
```

### Configure Minio

#### Set Minio Access Keys

Access `http://localhost:9001` in your browser and log in to Minio using the username and password set in `docker-compose.yml`.

Select `Access Keys` from the left menu bar, then click `Create access key` in the top right corner to create a new access key.

You can then either fill the new access key into `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in the `.env.development` file, or copy the `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` from the `.env.development` file into the created access key.

#### Set Minio Bucket

Access `http://localhost:9001` in your browser and log in to Minio using the username and password set in `docker-compose.yml`.

Select `Buckets` from the left menu bar, then click the `avatar` bucket on the right. After entering the bucket, select `Anonymous`, then click `Add Access Rule` in the top right corner. In the popup, enter `/` for `Prefix`, select `readonly` for `Access`, and click `Save`.

### Install Dependencies

```bash
$ pnpm install
```

### Local Development

```bash
# Migrate database
$ pnpm run migrate:dev

# Execute database seed
$ pnpm run prisma:seed

# Start development mode
$ pnpm run start

# Start watch mode (auto-restart service when code updates)
$ pnpm run start:dev
```

## License

[MIT](/LICENSE)
