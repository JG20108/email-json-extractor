# Email JSON Extractor

## Description

Email JSON Extractor is a NestJS application that parses emails and extracts JSON content from various sources within the email, including attachments, body links, and webpage links.

## Features

- Extract JSON from email attachments
- Parse JSON from links in email body
- Fetch and parse JSON from webpage links found in emails
- Robust error handling and logging

## Architecture

This project uses a hexagonal architecture (also known as ports and adapters) to separate concerns and improve maintainability. The architecture is divided into three main layers:

1. **Domain**: Contains business logic and entities
2. **Application**: Houses use cases and DTOs
3. **Infrastructure**: Implements adapters for external services and repositories

### Why Hexagonal Architecture?

Hexagonal architecture offers several benefits:

1. **Separation of concerns**: Business logic is isolated from external dependencies.
2. **Testability**: Core business logic can be tested without external dependencies.
3. **Flexibility**: Easy to swap out external implementations (e.g., switching from file system to cloud storage).
4. **Maintainability**: Changes in one layer don't affect others, making the codebase easier to maintain.

### Relation to Microservices

While this project is a monolithic application, its hexagonal architecture makes it well-suited for potential migration to a microservices architecture:

1. **Clear boundaries**: The separation of concerns allows for easy extraction of functionalities into separate services.
2. **Dependency inversion**: The use of interfaces (ports) makes it easier to adapt to different implementations across services.
3. **Scalability**: Individual components can be scaled independently when moved to separate services.

## Running the Application

To start the application in development mode:
bash
yarn start:dev


## Testing

To run the tests:
bash
yarn test:e2e
yarn jest


## Acknowledgments

Special thanks to the NestJS community for their support and resources.
