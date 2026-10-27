# Backend Step Tutor

Phase 0.1 to 0.3 · Primitives, NestJS, Postgres

## Contents


**Phase 0.1 · Design system primitives**

1. Text pattern + a11y harness (45 min)
2. Layout: Stack, Inline, Grid, Container, Spacer (2 hr)
3. Surface, Separator, Icon, FocusRing (2 hr)

**Phase 0.2 · NestJS + Docker**

4. Baseline and tooling (30 min)
5. Docker Compose for infra (1 hr)
6. Dockerfile, multi-stage (45 min)
7. ConfigModule + Joi (45 min)
8. Bootstrap hardening (45 min)
9. Database + Redis modules (1 hr)
10. Health module (you write) (45 min)
11. Swagger docs (30 min)
12. Filters and interceptors (1 hr)
13. Full stack in Docker + e2e (30 min)

**Phase 0.3 · Schema + migrations**

14. Schema rules + CLI (45 min)
15. 001 users (you write) (1 hr)
16. 002 to 005 content + progress (2 hr)
17. 006 to 010 sessions, audit, billing (2 hr)
18. Seed script (45 min)
19. Verify, EXPLAIN, ER diagram (1 hr)


---

# Phase 0.1 · Design system primitives

## Step 1 of 19: Read the Text pattern, set up a11y tests

*About 45 min*

Every primitive follows the same recipe. Write down what made Text work, then add accessibility testing before you build the rest.

### Why

Without primitives, each component invents its own spacing and borders. With them, one change to `Surface` updates every card, modal and section. This work happens in your **frontend repo**, not this backend one.

### [YOU WRITE] Pattern audit

> You write this part yourself.

Open your finished `Text` primitive and its tests. Before building anything, write five lines answering:

1. What is the file layout (component, test, index)?
2. How does `cva` define variants and default variants?
3. How is `ref` handled? In React 19 it is a normal prop, so no `forwardRef`.
4. How is `cn` imported (a relative path, not an alias)?
5. Which 13 behaviors do the tests cover?

These answers are your template for the next nine primitives.

### [DO] Add jest-axe

```bash
npm i -D jest-axe @types/jest-axe
```

**jest.setup.ts (add)**

```ts
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

Make sure this file is listed under `setupFilesAfterEnv` in your Jest config. Then every primitive gets one test shaped like this:

**Stack.test.tsx (a11y test shape)**

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Stack } from './Stack';

it('has no accessibility violations', async () => {
  const { container } = render(<Stack><p>content</p></Stack>);
  expect(await axe(container)).toHaveNoViolations();
});
```

Note what axe cannot do. It finds missing labels and bad roles, but it cannot judge color contrast in jsdom or keyboard order. Those you check by hand in the browser.

### [DONE WHEN]

- [ ] Your five-line pattern audit is written in your journal

- [ ] An a11y test on Text passes with jest-axe

### Journal

Mark: ✅ cva, ✅ ref as prop, ⚠️/❌ a11y testing. Be honest about the last one; it is the newest for you.

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 2 of 19: Layout primitives

*About 2 hr*

Stack, Inline, Grid, Container and Spacer replace repeated `flex flex-col gap-*` and ad hoc margins. Test first, then component.

### Spec

| Primitive | Does | Props |
|---|---|---|
| Stack | Vertical layout | `gap` |
| Inline | Horizontal row that wraps | `gap`, `align`, `justify`, `wrap` |
| Grid | Responsive columns, 1 to 4 | `cols`, `gap` |
| Container | Max width plus side padding | `size` (sm, md, lg, xl) |
| Spacer | Intentional empty space | `size`, `axis` |

### Pitfall to know before you start

Tailwind scans your source for complete class names. A template like ```gap-${n}``` is never found, so the class is not generated and the gap silently does nothing. Map each value to a full literal string inside `cva`, as below. The same applies to `cols`.

### [YOU WRITE] Stack, test first

> You write this part yourself.

Write `Stack.test.tsx` first. Cases: renders children; applies `flex-col`; default gap; each gap variant adds the right class; merges a custom `className`; forwards `ref`; passes through `aria-label`; no axe violations. Then write the component. Compare with mine only after yours passes:

<details>
<summary>My Stack</summary>

**Stack.tsx**

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const stack = cva('flex flex-col', {
  variants: {
    gap: {
      0: 'gap-0', 1: 'gap-1', 2: 'gap-2', 3: 'gap-3',
      4: 'gap-4', 6: 'gap-6', 8: 'gap-8',
    },
  },
  defaultVariants: { gap: 4 },
});

export type StackProps = ComponentProps<'div'> & VariantProps<typeof stack>;

export function Stack({ className, gap, ref, ...props }: StackProps) {
  return <div ref={ref} className={cn(stack({ gap }), className)} {...props} />;
}
```

</details>

### [DO] The other four

- **Inline**: same shape as Stack with `flex flex-row flex-wrap` and `align`/`justify` variants. Test that long content wraps (class present).
- **Grid**: `cols` variants such as `1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'`. This is your mobile-first rule: one column on phones.
- **Container**: `mx-auto w-full px-4` plus a max-width per size. Test that it centers.
- **Spacer**: an empty element, `aria-hidden="true"`, fixed height or width by token. Test that it is hidden from assistive tech.

Add each to your index exports as you finish it.

### [DONE WHEN]

- [ ] Five components, each with its own test file, all passing

- [ ] No template-string class names anywhere

- [ ] One commit per primitive

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 3 of 19: Surface, Separator, Icon, FocusRing

*About 2 hr*

The four primitives with real accessibility decisions. Finish with a review pass and a commit.

### Spec and the a11y decision for each

| Primitive | Spec | A11y decision |
|---|---|---|
| Surface | Variants: **flat** (no border), **raised** (`border-2 border-black shadow-[4px_4px_0_#000]`), **sunken** (tinted background), **outline** (border only). Accepts `as` to render `section`, `article` and so on. | Do not hardcode `div` semantics. Let the caller pick the element. |
| Separator | Horizontal or vertical line. `decorative` prop. | Decorative: `role="none"`. Meaningful: `role="separator"` and `aria-orientation`. |
| Icon | SVG wrapper with `size` and color token. | No label: `aria-hidden="true"`. With `label`: `role="img"` and `aria-label`. |
| FocusRing | Applies a visible ring on `:focus-visible`. | Never remove outlines without a replacement. Use `focus-visible`, not `focus`, so mouse clicks do not show a ring. |

### [YOU WRITE] Surface, test first

> You write this part yourself.

Tests: renders each variant with its class; default is `flat`; custom `className` merges and wins on conflict (this is what `cn` with tailwind-merge is for); `as="section"` renders a `section`; ref forwarding; axe passes. Use the same cva shape as Stack.

<details>
<summary>Hint: the variant map</summary>

Put the shared base classes in the first argument of `cva` and only the differences per variant. Keep the shadow as one literal string so Tailwind can see it.

</details>

### [DO] Review pass

When all nine pass, paste each component and ask:

```
What edge cases do these tests not cover? Read each primitive and list only real gaps, with the input that would expose each one.
```

Read every line of the answer. For each suggestion, write **take** or **skip** and one reason. Journal the places where you changed my template.

```bash
npm test
git add -A
git commit -m "feat(ui): add layout and surface primitives"
```

### [DONE WHEN]

- [ ] All nine primitives exported, tested, axe-clean; `npm test` green

- [ ] Keyboard tab through a page using FocusRing shows a visible ring

- [ ] Review decisions (take or skip) recorded in your journal

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:


---

# Phase 0.2 · NestJS + Docker

## Step 4 of 19: Baseline and tooling

*About 30 min*

Get a green, committed starting point so every later change is a small, readable diff.

### Where you work

Open a terminal in `C:\Users\PC\Documents\professional_projects\backend-paper-and-progress`. This folder is already scaffolded by `nest new`, so do not run it again. Every path in the NestJS and database steps is relative to this folder.

### Why commit first

The repo has no commits yet; every scaffold file shows as untracked. The first commit saves the untouched scaffold, so you can always compare against it or roll back. The alias change then becomes its own small commit.

### Why

Right now nothing is committed. If a later step breaks something, you have nothing to compare against. Path aliases (`@/config/...`) also save you from `../../../` imports once you have four layers per module.

### [DO] Steps

**1.1** Check `.gitignore` contains `.env`, `*.pem`, `coverage/`, `dist/`. Add any that are missing, then commit the scaffold.

```bash
git add -A
git commit -m "chore: nest scaffold"
```

**1.2** Check the Jest versions agree. If npm prints a peer warning, bump `ts-jest` to the line that supports Jest 30.

```bash
npm ls jest ts-jest
npm test
npm run build
npm run lint
```

**1.3** Add the alias. In `tsconfig.json` under `compilerOptions`:

```
"paths": { "@/*": ["./src/*"] }
```

Do not add `baseUrl`. TypeScript 6 deprecates it, and `paths` works without it, resolved relative to `tsconfig.json`.

In `package.json` under `jest` (rootDir is `src`, so the mapper points there):

```
"moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" }
```

**1.4** Pin Node. Create `.nvmrc` containing `22` and add `"engines": { "node": ">=22" }` to `package.json`. Docker and CI will use the same major version.

### [DONE WHEN]

- [ ] `npm test`, `npm run build`, `npm run lint` all pass

- [ ] A second commit contains the alias change on its own

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 5 of 19: Docker Compose for dev infrastructure

*About 1 hr*

One command starts Postgres and Redis the same way on every machine. You read every line before you run it.

### Concepts to understand first

- **Port mapping** `"127.0.0.1:5432:5432"` is host:container. Binding to `127.0.0.1` keeps the database off your Wi-Fi network.
- **Named volume** `pgdata` keeps data after `docker compose down`. Only `down -v` deletes it.
- **Healthcheck + `depends_on: service_healthy`** makes the API wait until Postgres actually accepts connections, not merely until the container started.
- **Profiles** let you keep pgAdmin and Redis Commander out of a normal `up`.

### [DO] Create `.env.example` and copy it to `.env`

**.env.example**

```
NODE_ENV=development
PORT=3000
API_PREFIX=api
CORS_ORIGINS=http://localhost:3001

DB_HOST=localhost
DB_PORT=5432
DB_USER=pp_user
DB_PASSWORD=change_me_dev_only
DB_NAME=paper_progress

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=change_me_dev_only

PGADMIN_EMAIL=dev@example.com
PGADMIN_PASSWORD=change_me_dev_only
```

#### Create `docker-compose.yml`

**docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "127.0.0.1:${DB_PORT}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    ports:
      - "127.0.0.1:${REDIS_PORT}:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4
    profiles: ["tools"]
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "127.0.0.1:5050:80"
    depends_on:
      postgres:
        condition: service_healthy

  redis-commander:
    image: rediscommander/redis-commander
    profiles: ["tools"]
    environment:
      REDIS_HOSTS: "local:redis:6379:0:${REDIS_PASSWORD}"
    ports:
      - "127.0.0.1:8081:8081"
    depends_on:
      redis:
        condition: service_healthy

volumes:
  pgdata:
  redisdata:
```

The API service is added in step 13, once it has a Dockerfile.

### [DONE WHEN]

```bash
cp .env.example .env
docker compose up -d postgres redis
docker compose ps
docker compose exec postgres psql -U pp_user -d paper_progress -c "select 1"
docker compose exec redis redis-cli -a change_me_dev_only ping
```

- [ ] Both services show `healthy`

- [ ] `select 1` works and Redis answers `PONG`

- [ ] `git status` shows `.env` is ignored

### Journal

For each service, write what the port, the volume and the healthcheck do, in your own words. What happens to your data on `docker compose down` versus `down -v`?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 6 of 19: Dockerfile, multi-stage

*About 45 min*

Build in one image, ship from a clean small one.

### Why

Building needs TypeScript, the Nest CLI and every devDependency. Running needs only compiled JavaScript and production packages. Splitting stages keeps the shipped image small and removes tools an attacker could use. Copying `package*.json` before the source also lets Docker reuse the cached `npm ci` layer when only your code changed.

### [DO]

**Dockerfile**

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1
CMD ["node", "dist/main.js"]
```

**.dockerignore**

```
node_modules
dist
coverage
.git
.env*
!.env.example
docker-compose*.yml
Dockerfile
```

### [DONE WHEN]

```bash
docker build -t pp-api .
docker images pp-api
docker run --rm pp-api whoami
```

- [ ] Build succeeds; size is roughly under 250 MB

- [ ] `whoami` prints `nestjs`, not `root`

The HEALTHCHECK will report unhealthy until step 10 adds the endpoint. That is expected.

### Journal

List what is in the `builder` stage that is not in the final image. Why does running as non-root matter if the container is hacked?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 7 of 19: ConfigModule with Joi validation

*About 45 min*

The app should refuse to start when configuration is wrong, and say exactly what is wrong.

### [YOU WRITE] First attempt

> You write this part yourself.

Before reading my version, write `src/config/env.validation.ts` yourself: a Joi object covering every key in `.env.example`. Required keys have no default. `NODE_ENV` is one of development, test, production. Ports are numbers. `REDIS_PASSWORD` is optional in development only.

<details>
<summary>Compare with my version</summary>

**src/config/env.validation.ts**

```ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().required(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
});
```

</details>

### [DO] Wire it up

**src/app.module.ts**

```ts
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from '@/config/env.validation';

ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  validationSchema: envValidationSchema,
  validationOptions: { abortEarly: false },
}),
```

`abortEarly: false` reports every missing variable in one run instead of one at a time. `isGlobal` means you do not import the module everywhere.

**Test it.** Write a small spec that calls `envValidationSchema.validate({...})` with `DB_HOST` missing and expects an error mentioning `DB_HOST`.

### [DONE WHEN]

- [ ] Deleting `DB_HOST` from `.env` makes `npm run start:dev` fail with a readable message

- [ ] Your spec passes

### Journal

What is "fail fast" and why is a crash at boot better than an undefined value at the first request?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 8 of 19: Bootstrap hardening in `main.ts`

*About 45 min*

Prefix, versioning, security headers, validation, graceful shutdown. All in one function that tests reuse.

### Why a shared `configureApp`

If your e2e tests build the app without the same pipes and prefix as production, they test a different app. One function, called by both, removes that gap.

### [DO]

```bash
npm i class-validator class-transformer
```

**src/configure-app.ts**

```ts
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.setGlobalPrefix(config.get('API_PREFIX', 'api'));
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(helmet());
  app.enableCors({
    origin: config.getOrThrow('CORS_ORIGINS').split(','),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
}
```

**src/main.ts**

```ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(app.get(ConfigService).getOrThrow('PORT'));
}
void bootstrap();
```

**Throttler.** In `AppModule` add `ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])` and register `ThrottlerGuard` as a global `APP_GUARD` provider. Strict per-route limits (login 5/min) come in Phase 1.

### What each option does

- `whitelist` strips unknown fields from request bodies.
- `forbidNonWhitelisted` returns 400 instead of silently stripping, so clients learn they sent junk.
- `transform` turns plain JSON into DTO class instances and converts types.
- `enableShutdownHooks` lets Nest close DB and Redis connections on SIGTERM, which is what Kubernetes sends before killing a pod.

### [DONE WHEN]

- [ ] App boots; `curl -i localhost:3000/api/v1/` shows helmet headers like `x-content-type-options`

- [ ] Ctrl+C logs a clean shutdown

### Journal

Explain the NestJS request lifecycle order: middleware, guards, interceptors, pipes, handler, interceptors, filters. Where does `ValidationPipe` sit?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 9 of 19: Database and Redis modules

*About 1 hr*

Connect Nest to Postgres and Redis, and give the TypeORM CLI its own connection for migrations.

### Two connections, on purpose

The running app gets its connection from Nest's DI. The migration CLI runs outside Nest, so it needs a plain `DataSource` file. Both read the same environment variables.

**Rule:** `synchronize` is always `false`. With it on, TypeORM diffs your entities against the database at boot and alters tables, including dropping columns. That is how production data gets lost.

### [DO]

```bash
npm i dotenv argon2
```

`argon2` is installed now for the seed script in step 18.

**src/database/database.module.ts**

```ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        host: c.getOrThrow('DB_HOST'),
        port: c.getOrThrow('DB_PORT'),
        username: c.getOrThrow('DB_USER'),
        password: c.getOrThrow('DB_PASSWORD'),
        database: c.getOrThrow('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
```

**src/database/data-source.ts**

```ts
import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: ['src/database/migrations/*.ts'],
});
```

**package.json scripts**

```json
"typeorm": "typeorm-ts-node-commonjs",
"migration:create": "typeorm-ts-node-commonjs migration:create",
"migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
"migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts",
"migration:show": "typeorm-ts-node-commonjs migration:show -d src/database/data-source.ts"
```

Your installed TypeORM is a new major version. Run `npx typeorm --help` to confirm the CLI name and flags before relying on these.

**src/redis/redis.module.ts**

```ts
import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (c: ConfigService) =>
        new Redis({
          host: c.getOrThrow('REDIS_HOST'),
          port: c.getOrThrow('REDIS_PORT'),
          password: c.get('REDIS_PASSWORD') || undefined,
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
  async onModuleDestroy() {
    await this.redis.quit();
  }
}
```

Add `DatabaseModule` and `RedisModule` to `AppModule`. For BullMQ add `BullModule.forRootAsync` with the same host, port and password inside a `connection` object. BullMQ workers need `maxRetriesPerRequest: null` on their connection.

### [DONE WHEN]

- [ ] App boots with Docker Postgres and Redis running, no connection errors

- [ ] `npm run migration:show` connects (it will list nothing yet)

### Journal

What is a provider token? Why is `REDIS_CLIENT` a Symbol and what does `@Inject` do with it?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 10 of 19: Health module

*About 45 min*

You write the first version by hand. Then we upgrade it with real dependency checks.

### [YOU WRITE] Version 1

> You write this part yourself.

1. Write the unit test first: the controller's method returns an object with `status: 'ok'`, an ISO `timestamp`, and a numeric `uptime`.
2. Create `src/health/health.controller.ts` and `health.module.ts`. Route: `GET /api/v1/health`.
3. Use `process.uptime()` for uptime. Import the module in `AppModule`.

<details>
<summary>Stuck? Hints, not the answer</summary>

- `@Controller({ path: 'health', version: '1' })` gives you the URL.
- A controller must be listed in a module's `controllers` array, or Nest never sees it.
- Test with `Test.createTestingModule({ controllers: [HealthController] }).compile()`.

</details>

### [DO] Version 2: split liveness and readiness

```bash
npm i @nestjs/terminus
```

| Endpoint | Checks | If it fails, Kubernetes |
|---|---|---|
| `/health` (liveness) | Process is alive. No dependencies. | Restarts the pod |
| `/health/ready` (readiness) | Database and Redis respond | Stops sending traffic, does not restart |

If liveness checked the database, one database outage would restart every pod in a loop and make recovery slower. This is the answer to your journal question.

**readiness sketch**

```
@Get('ready')
@HealthCheck()
ready() {
  return this.health.check([
    () => this.db.pingCheck('database'),
    async () => {
      await this.redis.ping();
      return { redis: { status: 'up' } };
    },
  ]);
}
```

Inject `HealthCheckService`, `TypeOrmHealthIndicator` and `@Inject(REDIS_CLIENT)`. Import `TerminusModule`. Put `@SkipThrottle()` on the controller so probes never get rate limited.

### [DONE WHEN]

- [ ] Test passes and `/api/v1/health` returns the JSON shape

- [ ] `docker compose stop redis` makes `/health/ready` return 503 while `/health` stays 200

### Journal

Module, Controller, Provider: one sentence each from memory. Then compare with Express, where you wire all of this by hand.

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 11 of 19: Swagger docs

*About 30 min*

Every endpoint documents itself, and the frontend can read the contract at `/api/docs`.

### [DO]

**src/configure-swagger.ts**

```ts
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureSwagger(app: INestApplication): void {
  const doc = new DocumentBuilder()
    .setTitle('Paper & Progress API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
}
```

In `main.ts`, call it only outside production:

```
if (process.env.NODE_ENV !== 'production') configureSwagger(app);
```

Add the CLI plugin so DTO properties are documented automatically. In `nest-cli.json`, inside `compilerOptions`:

```
"plugins": ["@nestjs/swagger"]
```

Add `@ApiTags('health')` and `@ApiOperation({ summary: 'Liveness probe' })` to your health controller.

### [DONE WHEN]

- [ ] `/api/docs` lists both health endpoints and "Try it out" works

- [ ] You can say why docs are off in production

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 12 of 19: Cross-cutting foundations

*About 1 hr*

One response shape for success, one for errors, and a request id on every call. Small now, large payoff later.

### Target shapes

```
success: { "data": ... }
error:   { "error": { "code": "EMAIL_TAKEN", "message": "...", "details": ... } }
```

Domain code will throw its own errors (for example `EmailAlreadyExistsError`) and never import `HttpException`. The filter is the only place that maps domain errors to HTTP status codes. That keeps the domain framework-free.

### [YOU WRITE] Interceptor

> You write this part yourself.

Write `common/interceptors/response.interceptor.ts` yourself. It implements `NestInterceptor` and wraps the handler result with `map((data) => ({ data }))`. Skip wrapping for health, since probes want the plain object. Hint: a custom decorator that sets metadata, read with `Reflector`.

### [DO] Exception filter

**src/common/filters/all-exceptions.filter.ts**

```ts
import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string' ? body : (body as any).message ?? exception.message;
      return res.status(status).json({
        error: { code: HttpStatus[status], message },
      });
    }

    this.logger.error(exception);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  }
}
```

Register it with `app.useGlobalFilters(new AllExceptionsFilter())` in `configureApp`. The 500 branch never returns the stack trace or the original message, which could leak SQL or file paths.

**Request id.** A tiny middleware: read `x-request-id` or generate one with `crypto.randomUUID()`, set it on the response header and on `req`. In Phase 6 your logger will print it on every line.

### [DONE WHEN]

- [ ] A 404 route returns the error envelope

- [ ] A thrown plain `Error` returns 500 with no stack trace

- [ ] Every response carries an `x-request-id` header

### Journal

Guard vs middleware vs interceptor vs filter. Which one can see the handler's return value? Which one can stop a request before the handler?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 13 of 19: Run the whole stack and verify

*About 30 min*

Add the API to Compose, prove it works from a cold start, and lock it in with an e2e test.

### [DO]

Add this service to `docker-compose.yml`. Inside containers the host names are service names, so override them:

```
  api:
    build: .
    env_file: .env
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "127.0.0.1:${PORT}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

Note the container's DB port is always 5432, even if you changed the host port. Put `NODE_ENV=production` in your shell only if you want to test the production image; Swagger is off then.

**e2e test** in `test/health.e2e-spec.ts`: build the app from `AppModule`, call `configureApp(app)`, then `request(app.getHttpServer()).get('/api/v1/health').expect(200)`. This needs Postgres and Redis running.

### [DONE WHEN]

```bash
docker compose down
docker compose up -d --build
curl localhost:3000/api/v1/health
curl localhost:3000/api/v1/health/ready
npm run test:e2e
```

- [ ] Both curls answer and the container shows `healthy`

- [ ] e2e passes

- [ ] README has a "Getting started" section, and you committed

### Phase 0.2 journal checklist

Rate each: Provider/Controller/Module, DI container, multi-stage build, liveness vs readiness. Use the ratings below.

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:


---

# Phase 0.3 · Schema + migrations

## Step 14 of 19: Schema ground rules

*About 45 min*

Decide conventions once, so the nine migrations look like one person wrote them.

### Conventions

| Topic | Rule | Reason |
|---|---|---|
| Names | snake_case, plural tables | Postgres folds unquoted names to lowercase |
| Primary key | `uuid DEFAULT gen_random_uuid()` | Not guessable, safe to merge databases. Built in since PG13 |
| Time | `timestamptz` always | Plain `timestamp` drops the zone silently |
| Delete rules | Cascade for user-owned data; RESTRICT for content references | Deleting a user removes their progress; deleting a category must not orphan courses |
| Enums | Native enums for stable sets (role, status) | Adding a value later is `ALTER TYPE ... ADD VALUE`; removing one is painful |
| Migrations | Hand-written SQL, working `down()` | You see exactly what runs |

### [DO]

Create the first empty migration with the CLI and read what it generates:

```bash
npm run migration:create -- src/database/migrations/001-users
```

It produces a class with `up(queryRunner)` and `down(queryRunner)`. TypeORM records each applied migration in a `migrations` table, which is how it knows what to skip.

**Decisions to make before step 16.** Reply to your assistant with a choice for each, or accept my recommendations:

- `domain` on `courses`: denormalize it (recommended) or join through categories.
- Add a `sections` table in migration 004 (recommended, Phase 2 needs it).
- Add `010_auth_tokens` for password-reset and email-verification token hashes (recommended).

### [DONE WHEN]

- [ ] An empty migration file exists and `migration:show` lists it as pending

- [ ] You made the three decisions above

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 15 of 19: Migration 001: users

*About 1 hr*

You write this one in raw SQL. I only review.

### [YOU WRITE] Spec

> You write this part yourself.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| email | varchar(320) | NOT NULL |
| password_hash | text | NOT NULL |
| role | enum `user_role` | student | admin, default student |
| email_verified | boolean | NOT NULL, default false |
| mfa_secret | text | nullable |
| created_at, updated_at | timestamptz | NOT NULL, default `now()` |

Plus: a **unique index on `lower(email)`**. Then write `down()` so it drops the table and the enum type, in the right order.

Use ``queryRunner.query(`...`)`` with one statement per call.

<details>
<summary>Hint 1: the index</summary>

`CREATE UNIQUE INDEX ... ON users (lower(email))` is an expression index. Ask yourself: why not just `UNIQUE(email)`? Try inserting `A@x.com` and `a@x.com` with each approach.

</details>

<details>
<summary>Hint 2: order in down()</summary>

The table uses the enum type, so the table must go first. Dropping the type first fails.

</details>

### When you finish, check these

- Is email length 320 or 255? (RFC allows 254; 320 is the old limit.) Pick and justify.
- Who updates `updated_at`: a trigger or the application? Both are valid; know which you chose.
- Do you also store emails already lower-cased in the application? (The Email value object in Phase 1 does.) Why keep both protections?

Then ask for a review. A good review request names what you decided and what you are unsure about.

### [DONE WHEN]

```bash
npm run migration:run
docker compose exec postgres psql -U pp_user -d paper_progress -c "\d users"
npm run migration:revert
npm run migration:run
```

- [ ] Up, down, up all succeed

- [ ] Inserting `A@x.com` then `a@x.com` fails with a unique violation

### Journal

UUID vs auto-increment: write two advantages and two costs of UUID.

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 16 of 19: Migrations 002 to 005

*About 2 hr*

Categories, courses, lessons and learner progress. Spec below, you write the SQL, then request a review.

### [YOU WRITE] 002 categories

> You write this part yourself.

`id`, `parent_id` (self FK, nullable, **RESTRICT**), `domain` enum (it, english, life_skills), `name`, `slug` unique, `sort_order` int default 0. Add `CHECK (id <> parent_id)` and an index on `parent_id`.

Why a tree: unlimited depth, Frontend > React > Hooks. An adjacency list (just `parent_id`) is fine at your scale.

### [YOU WRITE] 003 courses

> You write this part yourself.

`category_id` FK RESTRICT, `domain` (denormalized, same enum), `status` enum (draft, published, archived), `price_type` enum (free, pro), `slug` unique, `title`, `description`, `thumbnail_url`, `published_at`, timestamps.

Index for the main listing query. Compare these two and pick, then prove it with `EXPLAIN` in step 19:

```
-- plain compound
CREATE INDEX courses_status_domain_idx ON courses (status, domain);
-- partial: only indexes the rows the public site ever reads
CREATE INDEX courses_published_domain_idx ON courses (domain, published_at DESC)
  WHERE status = 'published';
```

### [YOU WRITE] 004 sections, lessons, media_assets

> You write this part yourself.

`sections`: course_id (CASCADE), title, sort_order. `lessons`: section_id (CASCADE), course_id, title, slug, `content_type` enum (text, video, quiz), `content` text, `duration_seconds`, `is_free` boolean, sort_order. `media_assets`: storage_key unique, mime_type, size_bytes bigint, duration_seconds.

Ordering needs a unique constraint that survives reordering inside one transaction. This is the trick:

```sql
ALTER TABLE lessons
  ADD CONSTRAINT lessons_order_uq UNIQUE (section_id, sort_order)
  DEFERRABLE INITIALLY DEFERRED;
```

Deferred means Postgres checks the constraint at commit, so swapping two lessons' positions does not fail halfway through.

### [YOU WRITE] 005 user_progress, bookmarks, learning_streaks

> You write this part yourself.

`user_progress`: user_id (CASCADE), lesson_id (CASCADE), status enum (not_started, in_progress, completed), completed_at, time_spent_seconds, **UNIQUE (user_id, lesson_id)**. `bookmarks`: user_id, lesson_id, note, created_at, unique pair. `learning_streaks`: `user_id` as the primary key, current_streak, longest_streak, last_activity_date (a `date`, not timestamp).

### Review checklist for yourself

- Every FK has an explicit ON DELETE.
- Every FK column you filter or join by has an index (Postgres does not create these automatically).
- Every `down()` drops tables before the enum types they use.

### [DONE WHEN]

- [ ] 002 through 005 run up and revert down cleanly, one at a time

- [ ] You requested and read a review of all four

### Journal

For each index, write the query it serves. Why does column order in a compound index matter? What is a partial index?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 17 of 19: Migrations 006 to 010

*About 2 hr*

Sessions, notifications, audit log, subscriptions, devlog, and auth tokens.

### [YOU WRITE] 006 user_sessions

> You write this part yourself.

`user_id` (CASCADE), `refresh_token_hash` (store a hash, never the token), `device_fingerprint`, `ip_address` (`inet` type), `user_agent`, `country` char(2), `is_revoked` boolean, `expires_at`, created_at. Index `(user_id, is_revoked)`.

Design note: live sessions will sit in Redis for fast checks. This table is the durable record and powers the "active devices" page. Decide in writing which one wins if they disagree.

### [YOU WRITE] 007 notifications, activity_log

> You write this part yourself.

`notifications`: user_id, type enum, title, message, is_read, data jsonb, created_at. Index `(user_id, is_read, created_at DESC)`. `activity_log`: user_id (SET NULL on delete, so the audit trail survives), action, entity_type, entity_id, metadata jsonb, ip_address inet, created_at. Treat it as append-only: no updates.

Action as a native enum will grow constantly. Consider `text` with a `CHECK` instead, and write down which you picked.

### [YOU WRITE] 008 subscriptions

> You write this part yourself.

user_id, `stripe_customer_id`, `stripe_subscription_id` unique, plan enum (monthly, yearly), status enum (active, past_due, canceled), current_period_start/end. Index on stripe_customer_id.

### [YOU WRITE] 009 devlog_entries, reactions

> You write this part yourself.

`devlog_entries`: title, slug unique, content, `tags text[]`, published_at, reading_time_minutes. A GIN index on tags makes `tags @> ARRAY['nestjs']` fast. `reactions`: entry_id, emoji, count, **UNIQUE (entry_id, emoji)**.

Increment safely with one statement, no read-then-write race:

```sql
INSERT INTO reactions (entry_id, emoji, count) VALUES ($1, $2, 1)
ON CONFLICT (entry_id, emoji) DO UPDATE SET count = reactions.count + 1;
```

### [YOU WRITE] 010 auth_tokens

> You write this part yourself.

user_id (CASCADE), `type` (email_verification, password_reset), `token_hash`, `expires_at`, `used_at` nullable. Index on token_hash. Phase 1 forgot-password needs this.

### [DONE WHEN]

- [ ] All ten migrations run on an empty database

- [ ] Reverting all ten leaves only the `migrations` table

### Journal

Why store a hash of a token instead of the token? What is the difference between `ON DELETE SET NULL` and `CASCADE`, and why does audit data want the first?

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 18 of 19: Seed data

*About 45 min*

Sample categories and one admin, as a script you can run again safely.

### Why a script, not a migration

Migrations describe schema and run exactly once everywhere, including production. Sample data and a dev admin do not belong in production. A separate idempotent script lets you choose where to run it.

### [DO]

Add to `.env.example`: `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. Never commit a real password, and never hard-code a default admin in source.

**src/database/seed.ts (shape)**

```ts
import 'dotenv/config';
import * as argon2 from 'argon2';
import dataSource from './data-source';

async function seed() {
  await dataSource.initialize();
  const hash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD!, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await dataSource.query(
    `INSERT INTO users (email, password_hash, role, email_verified)
     VALUES ($1, $2, 'admin', true)
     ON CONFLICT DO NOTHING`,
    [process.env.SEED_ADMIN_EMAIL!.toLowerCase(), hash],
  );

  // TODO (you): insert 3 root categories (IT, English, Life Skills)
  // then sub-categories, each with ON CONFLICT (slug) DO NOTHING.
  // Sub-categories need the parent id: use INSERT ... SELECT id FROM categories WHERE slug = ...

  await dataSource.destroy();
}
void seed();
```

Add the script `"seed": "ts-node -r tsconfig-paths/register src/database/seed.ts"`.

The memory, time and parallelism values are the OWASP-recommended Argon2id settings listed in your plan. Phase 1 will reuse them in the real password hasher.

### [DONE WHEN]

- [ ] `npm run seed` twice gives the same row counts

- [ ] `password_hash` starts with `$argon2id$`

- [ ] 3 root categories and at least 2 children each exist

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:

## Step 19 of 19: Prove it works

*About 1 hr*

Roll everything back and forward, read query plans, and draw the diagram that goes in your journal.

### [DO] Full cycle

```bash
docker compose down -v
docker compose up -d postgres redis
npm run migration:run
npm run seed
# revert all ten, one by one
for i in 1 2 3 4 5 6 7 8 9 10; do npm run migration:revert; done
npm run migration:run
```

Starting from `down -v` proves the migrations build the schema from nothing, not on top of leftovers.

### [DO] Read two query plans

Add some rows first (a few hundred courses via `generate_series` makes plans meaningful), then run `ANALYZE courses;` and:

```sql
EXPLAIN ANALYZE
SELECT id, title FROM courses
WHERE status = 'published' AND domain = 'it'
ORDER BY published_at DESC LIMIT 20;

EXPLAIN ANALYZE
SELECT * FROM user_sessions
WHERE user_id = '<some uuid>' AND is_revoked = false;
```

Look for `Index Scan` or `Index Only Scan` instead of `Seq Scan`. On a tiny table Postgres may still choose a sequential scan because it is cheaper. That is correct behavior, not a bug.

### [DO] Integration test

One Jest test that runs all migrations on a throwaway database and checks `information_schema` for the tables, and `pg_indexes` for the key indexes. This becomes the base for Testcontainers in Phase 6.

### [DONE WHEN]

- [ ] Cold build, seed, revert-all and re-run all succeed

- [ ] You can show which index each of the two queries used

- [ ] Hand-drawn ER diagram saved with your journal

### Phase 0.3 journal checklist

Rate yourself on: uuid vs serial, partial index, compound index column order, deferred constraints, and why `synchronize: true` is dangerous in production. Then write the devlog entry for Phase 0.

### Reflect

- Understanding: [ ] Clear · [ ] Concept only · [ ] Not yet
- Notes:
