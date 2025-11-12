# Bootcamp Project

This repository contains the application code for the Psychometry App. The infrastructure code is located in the [bootcamp-infra](https://github.com/omerteomim/bootcamp-infra) repository, and the GitOps configurations are in the [bootcamp-gitops](https://github.com/omerteomim/bootcamp-gitops) repository.

## Psychometry Essay Inspector

This repository contains a full-stack web application designed for psychometric testing and analysis. It features a React-based frontend, a Python backend, and is set up for deployment on Kubernetes using Helm, ArgoCD, Grafana, and Prometheus for monitoring.

## Features

*   **User Authentication**: Secure user registration and login.
*   **Psychometric Tests**: Administer and manage various psychometric tests.
*   **Results Analysis**: Display and analyze test results.
*   **Dashboard**: User-friendly dashboard to view progress and history.
*   **Scalable Deployment**: Ready for containerized deployment on Kubernetes.
*   **Monitoring**: Integrated with Grafana and Prometheus for application and infrastructure monitoring.

## Technologies Used

### Frontend
*   **React**: JavaScript library for building user interfaces.
*   **TypeScript**: Typed superset of JavaScript.
*   **Nginx**: High-performance web server for serving static files.

### Backend
*   **Python**: Programming language.
*   **Flask**: Python web framework.
*   **Docker**: Containerization platform.

### Infrastructure & Deployment
*   **Kubernetes**: Container orchestration system.
*   **Helm**: Package manager for Kubernetes.
*   **ArgoCD**: Declarative GitOps continuous delivery for Kubernetes.
*   **Grafana**: Open-source platform for monitoring and observability.
*   **Prometheus**: Open-source monitoring system with a time series database.
*   **ExternalSecrets**: Kubernetes operator to manage external secret stores.

## Deployment

This application is designed for Kubernetes deployment.

*   **Helm Charts**: Located in `chart-psychometric/`, these define the Kubernetes resources for the backend and frontend.
*   **ArgoCD**: The `chart-psychometric/environments/applicationset.yml` defines an ArgoCD ApplicationSet for deploying the application across different environments (dev, staging, prod).
*   **Monitoring**: Grafana dashboards (`grafana/dashboards/`) and Prometheus configurations (`prometheus/prometheus.yml`) are included for observability.

## Project Structure

*   `backend/`: Python backend application, Dockerfile, and dependencies.
*   `frontend/`: React frontend application, Dockerfile, and build configurations.
*   `chart-psychometric/`: Helm charts for Kubernetes deployment, including environment-specific values.
*   `grafana/`: Grafana dashboards and provisioning configurations.
*   `prometheus/`: Prometheus configuration.
*   `tests/`: Shell scripts for testing.
*   `.github/workflows/`: GitHub Actions for CI/CD.
*   `docker-compose.yml`: Docker Compose configuration for local development.
