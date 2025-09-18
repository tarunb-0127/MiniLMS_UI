# Stage 1: build
FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine

# Copy the Vite build output (dist/) to nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
