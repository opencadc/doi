# Build ADES Validator Docker Image

## Build Command

```bash
docker build -t bucket.canfar.net/ades-validator-api:latest ./api/validator
```

## Build Arguments

None. The ADES validator has no build-time configuration.

## Notes

- Base image: `python:3.11-slim`
- Exposes port `8080`
- Runs as non-root user `validator` (uid 1001)
- Includes `iau-ades` package for ADES format validation
- Supports XML, PSV, and MPC validation formats
