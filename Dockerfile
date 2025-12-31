# Multi-stage build for minimal Redbean container
# Uses Alpine for tiny but functional base (~8MB total)

FROM alpine:latest AS build

# Install zip and download redbean + ape loader to convert to native ELF
RUN apk add --no-cache zip && \
    wget -q https://cosmo.zip/pub/cosmos/bin/ape-x86_64.elf -O /usr/bin/ape && \
    chmod +x /usr/bin/ape && \
    wget -q https://redbean.dev/redbean-2.2.com -O /redbean.com && \
    chmod +x /redbean.com

# Copy static assets into redbean zip
WORKDIR /app
COPY dist/ ./dist/

# Pack assets into redbean.com (it's a zip file)
RUN cd dist && zip -r /redbean.com . && cd ..

# Use minimal Alpine for runtime
FROM alpine:latest

# Copy ape loader and the packed redbean
COPY --from=build /usr/bin/ape /usr/bin/ape
COPY --from=build /redbean.com /redbean.com

# Expose port 80
EXPOSE 80

# Run redbean via ape loader
CMD ["/usr/bin/ape", "/redbean.com", "-vv", "-p", "80"]
