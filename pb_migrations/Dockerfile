FROM alpine:3.19

RUN apk add --no-cache curl unzip

# Download PocketBase at build time
RUN curl -fsSL https://github.com/pocketbase/pocketbase/releases/download/v0.22.12/pocketbase_0.22.12_linux_amd64.zip -o /tmp/pb.zip \
    && unzip -o /tmp/pb.zip -d /pb \
    && rm /tmp/pb.zip

WORKDIR /pb

# Expose the PocketBase port
EXPOSE 8090

# Default command
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--migrationsDir=/pb/pb_migrations"]
