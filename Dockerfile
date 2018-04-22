# Use node 4.4.5 LTS
FROM node:9.11.1
ENV LAST_UPDATED 20180422T165400

# Copy source code
COPY . /app

# Change working directory
WORKDIR /app

# Install dependencies
RUN npm install

# Expose API port to the outside
EXPOSE 5050

# Launch application
CMD ["npm","start"]