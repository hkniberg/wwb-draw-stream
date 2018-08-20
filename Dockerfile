# Use node 4.4.5 LTS
FROM node:9.11.1
ENV LAST_UPDATED 20180422T165400
ENV TEXT_PORT 3003
ENV DRAW_PORT 3004

# Copy source code
COPY . /app

# Change working directory
WORKDIR /app

# Install dependencies
RUN npm install

# Expose ports to the outside
EXPOSE 3003
EXPOSE 3004

# Launch application
CMD ["npm","start"]