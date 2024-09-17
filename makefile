.PHONY: global
global:
	@docker-compose -f infrastructure/docker-compose/docker-compose.global.yml up --build

.PHONY: citizen_transfer
citizen_transfer:
	@docker-compose -f infrastructure/docker-compose/docker-compose.citizen_transfer.yml up --build

.PHONY: external_citizen_register
citizen_transfer:
	@docker-compose -f infrastructure/docker-compose/docker-compose.external_citizen_register.yml up --build

.PHONY: documents
documents:
	@docker-compose -f infrastructure/docker-compose/docker-compose.documents.yml up --build

.PHONY: citizen_folder
citizen_folder:
	@docker-compose -f infrastructure/docker-compose/docker-compose.citizen_folder.yml up --build
