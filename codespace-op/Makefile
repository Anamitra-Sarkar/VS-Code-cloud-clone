.PHONY: up-dev build-images test deploy-staging snapshot-user lint clean

COMPOSE_FILE := infra/docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

up-dev:
	$(COMPOSE) --env-file infra/.env up -d
	@echo "Services started:"
	@echo "  Frontend:   http://localhost:3000"
	@echo "  Backend:    http://localhost:7860"
	@echo "  Grafana:    http://localhost:3001"
	@echo "  Prometheus: http://localhost:9090"

build-images:
	bash scripts/build-all.sh

test:
	cd backend && python -m pytest tests/ -v --tb=short
	cd frontend && npx next lint

deploy-staging:
	helm upgrade --install codespace-op-staging \
		infra/k8s/helm-chart \
		--namespace codespace-op-staging \
		--create-namespace \
		--set autoscaling.enabled=false \
		--set replicaCount.backend=1 \
		--set replicaCount.frontend=1 \
		--wait --timeout 5m

snapshot-user:
	@test -n "$(UID)" || (echo "Usage: make snapshot-user UID=<user_id> WID=<workspace_id>" && exit 1)
	@test -n "$(WID)" || (echo "Usage: make snapshot-user UID=<user_id> WID=<workspace_id>" && exit 1)
	bash tools/snapshot-scripts/snapshot.sh $(WID)

lint:
	cd backend && ruff check .
	cd frontend && npx next lint

clean:
	$(COMPOSE) down -v --remove-orphans
	docker image prune -f --filter "label=project=codespace-op"
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
