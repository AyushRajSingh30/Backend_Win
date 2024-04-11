# Use the official Ubuntu base image
FROM ubuntu:latest

# Update package lists and install curl
RUN apt-get update && apt-get install -y curl

# Install Node.js 18.x from NodeSource repository
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to /app
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

COPY src ./
# Copy application code into the container
COPY . ./

# Set the default command to run when the container starts
CMD ["node", "-r dotenv/config --experimental-json-modules src/index.js"]
