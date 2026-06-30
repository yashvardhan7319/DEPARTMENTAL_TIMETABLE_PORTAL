#!/bin/bash
echo "Stopping DPT Portal..."
docker-compose down
echo "Stopped. Data is preserved. Use 'docker-compose down -v' to also delete database."
