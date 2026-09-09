FROM node:22-alpine AS web-build
WORKDIR /src/web

COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
RUN pnpm install --frozen-lockfile

COPY web/ ./
RUN pnpm build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS api-build
WORKDIR /src

COPY api/PastaList.sln api/
COPY api/PastaList.Api/PastaList.Api.csproj api/PastaList.Api/
RUN dotnet restore api/PastaList.sln

COPY api/ api/
RUN dotnet publish api/PastaList.Api/PastaList.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=api-build /app/publish ./
COPY --from=web-build /src/web/dist ./wwwroot

ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "PastaList.Api.dll"]
