.DEFAULT_GOAL := help

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?# .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":[^#]*? #| #"}; {printf "%-57s%s\n", $$1 $$3, $$2}'

# Bootstrap
.PHONY: bootstrap bs
bootstrap: # Bootstrap to start development.
	@./tools/bootstrap.sh
bs: # Short hand for the bootstrap command.
	@$(MAKE) bootstrap

# Clean
.PHONY: clean
clean: # Clean
	@bun run clean
