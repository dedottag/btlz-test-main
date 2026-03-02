# your node version
FROM public.ecr.aws/docker/library/node:20-alpine AS deps

WORKDIR /app

COPY ./package*.json .
RUN npm ci --omit=dev

FROM public.ecr.aws/docker/library/node:20-alpine AS build

WORKDIR /app

COPY ./package*.json .
RUN npm ci

COPY . .

RUN npm run build

FROM public.ecr.aws/docker/library/node:20-alpine AS prod

WORKDIR /app

COPY ./package*.json .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
