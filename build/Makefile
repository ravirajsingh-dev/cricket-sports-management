ifndef DEP_ENV
$(error DEP_ENV is not set)
endif


# Permanent local overrides
-include ../.env.$(DEP_ENV)

# Registry credentials MUST come from the environment (never commit secrets).
# Required for push-app:
#   DOCR_TOKEN  — DigitalOcean Container Registry token
#   DOCR_USER   — registry username / email
export ACR_URI ?= registry.digitalocean.com
export ACR_USER ?= $(DOCR_USER)
export ACR_PASSWD ?= $(DOCR_TOKEN)
export TIMESTAMP=`date -u +"%Y-%m-%dT%H:%M:%SZ"`

build-app:
	TIMESTAMP=$(TIMESTAMP) \
	VERSION=$(VERSION) \
	docker compose -f ../docker-compose.$(DEP_ENV).yml --env-file ../.env.$(DEP_ENV) build --no-cache

push-app:
	@if [ -z "$(ACR_PASSWD)" ]; then echo "Error: DOCR_TOKEN is not set"; exit 1; fi
	@if [ -z "$(ACR_USER)" ]; then echo "Error: DOCR_USER is not set"; exit 1; fi
	@echo "$(ACR_PASSWD)" | docker login $(ACR_URI) --username $(ACR_USER) --password-stdin
	docker compose -f ../docker-compose.$(DEP_ENV).yml --env-file ../.env.$(DEP_ENV) push

build-n-push:
	make build-app
	make push-app

env:
#	env
	@echo Version: $(VERSION)
