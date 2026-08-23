FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_ENABLE_DEMO=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ENABLE_DEMO=$VITE_ENABLE_DEMO

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
